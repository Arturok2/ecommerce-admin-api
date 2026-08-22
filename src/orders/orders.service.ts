import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EstadoOrden, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const ORDER_SUMMARY_INCLUDE = {
  cliente: true,
  _count: { select: { items: true } },
} satisfies Prisma.OrderInclude;

const ORDER_DETAIL_INCLUDE = {
  cliente: true,
  direccionEnvio: true,
  items: {
    include: {
      variante: {
        include: {
          producto: true,
          atributos: true,
        },
      },
    },
  },
  historial: {
    orderBy: { createdAt: 'asc' },
    include: {
      admin: { select: { id: true, email: true } },
    },
  },
} satisfies Prisma.OrderInclude;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FindAllOrdersFilters {
  estado?: EstadoOrden;
  numeroOrden?: string;
}

const MAX_ORDER_NUMBER_ATTEMPTS = 5;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Genera un número de orden corto tipo "AB1850E7" (8 caracteres hex en mayúsculas).
   */
  private generateOrderNumber(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Genera un número de orden garantizando unicidad contra la base de datos.
   * Usa el cliente de transacción (tx) para leer un estado consistente.
   */
  private async generateUniqueOrderNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
      const numeroOrden = this.generateOrderNumber();
      const existente = await tx.order.findUnique({ where: { numeroOrden } });
      if (!existente) {
        return numeroOrden;
      }
    }
    throw new BadRequestException(
      'No se pudo generar un número de orden único, intenta de nuevo',
    );
  }

  /**
   * Registra la venta completa: valida stock y precios reales en el servidor,
   * crea la orden, sus items, la dirección de envío y la primera entrada del
   * historial — todo en una única transacción atómica.
   *
   * @param adminId id del administrador autenticado que registra la venta (para el historial)
   */
  async create(dto: CreateOrderDto, adminId: string) {
    const { clienteId, metodoPago, direccion, items } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Verificar que el cliente exista
      const cliente = await tx.customer.findUnique({ where: { id: clienteId } });
      if (!cliente) {
        throw new BadRequestException(`Cliente con id "${clienteId}" no encontrado`);
      }

      // 2. Buscar el precio y stock REAL de cada variante — nunca confiar en el cliente HTTP
      const variantIds = items.map((item) => item.variantId);
      const variantes = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
      });

      if (variantes.length !== new Set(variantIds).size) {
        throw new BadRequestException('Una o más variantes no existen');
      }

      const variantesPorId = new Map(variantes.map((v) => [v.id, v]));

      let total = new Prisma.Decimal(0);
      const orderItemsData: Prisma.OrderItemCreateWithoutOrdenInput[] = [];

      for (const item of items) {
        const variante = variantesPorId.get(item.variantId)!;

        if (variante.stock < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para el SKU "${variante.sku}" (disponible: ${variante.stock}, solicitado: ${item.cantidad})`,
          );
        }

        const subtotal = variante.precio.mul(item.cantidad);
        total = total.add(subtotal);

        orderItemsData.push({
          cantidad: item.cantidad,
          precioUnitario: variante.precio, // Precio real leído de la BD, no del payload
          variante: { connect: { id: variante.id } },
        });
      }

      // 3. Generar número de orden único
      const numeroOrden = await this.generateUniqueOrderNumber(tx);

      // 4. Crear la orden + items + dirección + primer registro de historial
      const orden = await tx.order.create({
        data: {
          numeroOrden,
          total,
          metodoPago,
          estadoOrden: EstadoOrden.EN_PREPARACION,
          cliente: { connect: { id: clienteId } },
          items: { create: orderItemsData },
          direccionEnvio: {
            create: {
              calle: direccion.calle,
              numeroExt: direccion.numero,
              colonia: direccion.colonia,
              ciudad: direccion.ciudad,
              estadoMx: direccion.estado,
              codigoPostal: direccion.codigoPostal,
            },
          },
          historial: {
            create: {
              estado: EstadoOrden.EN_PREPARACION,
              nota: 'Orden creada en preparación',
              admin: { connect: { id: adminId } },
            },
          },
        },
        include: ORDER_DETAIL_INCLUDE,
      });

      // 5. Descontar el stock reservado por esta venta
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.cantidad } },
        });
      }

      return orden;
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: FindAllOrdersFilters = {},
  ): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(filters.estado && { estadoOrden: filters.estado }),
      ...(filters.numeroOrden && {
        numeroOrden: { contains: filters.numeroOrden, mode: 'insensitive' },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: ORDER_SUMMARY_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const orden = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!orden) {
      throw new NotFoundException(`Orden con id "${id}" no encontrada`);
    }

    return orden;
  }

  /**
   * Actualiza el estado de la orden y registra el cambio en el historial,
   * asociando el admin (extraído del JWT) que realizó la modificación.
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto, adminId: string) {
    await this.prisma.$transaction(async (tx) => {
      const orden = await tx.order.findUnique({ where: { id } });

      if (!orden) {
        throw new NotFoundException(`Orden con id "${id}" no encontrada`);
      }

      await tx.order.update({
        where: { id },
        data: { estadoOrden: dto.estado },
      });

      await tx.historialOrden.create({
        data: {
          estado: dto.estado,
          nota: dto.nota,
          orden: { connect: { id } },
          admin: { connect: { id: adminId } },
        },
      });
    });

    // Se re-consulta con el detalle completo (incluye el nuevo registro de historial)
    return this.findOne(id);
  }
}
