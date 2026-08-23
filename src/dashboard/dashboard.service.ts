import { Injectable } from '@nestjs/common';
import { EstadoPago, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface RangoMetrica {
  hoy: number;
  ultimos7Dias: number;
  ultimos30Dias: number;
}

interface TopProducto {
  productId: string;
  nombre: string;
  marca: string;
  unidadesVendidas: number;
}

export interface DashboardMetrics {
  ventas: RangoMetrica;
  ordenes: RangoMetrica;
  clientes: {
    total: number;
    nuevosUltimos30Dias: number;
  };
  topProductos: TopProducto[];
}

interface DateRanges {
  startOfToday: Date;
  last7Days: Date;
  last30Days: Date;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRanges(): DateRanges {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return { startOfToday, last7Days, last30Days };
  }

  private toNumber(value: Prisma.Decimal | null): number {
    return value ? Number(value) : 0;
  }

  async getMetrics(): Promise<DashboardMetrics> {
    const { startOfToday, last7Days, last30Days } = this.getDateRanges();

    const [
      ventasHoy,
      ventas7Dias,
      ventas30Dias,
      ordenesHoy,
      ordenes7Dias,
      ordenes30Dias,
      clientesTotal,
      clientesNuevos30Dias,
      ventasAgrupadasPorVariante,
    ] = await Promise.all([
      // Ventas (ingresos) por rango — solo órdenes con pago confirmado
      this.prisma.order.aggregate({
        where: { estadoPago: EstadoPago.PAGADO, createdAt: { gte: startOfToday } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { estadoPago: EstadoPago.PAGADO, createdAt: { gte: last7Days } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { estadoPago: EstadoPago.PAGADO, createdAt: { gte: last30Days } },
        _sum: { total: true },
      }),

      // Órdenes totales por rango (sin filtrar por estado de pago)
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.order.count({ where: { createdAt: { gte: last30Days } } }),

      // Clientes: gran total y nuevos en los últimos 30 días
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { createdAt: { gte: last30Days } } }),

      // Unidades vendidas por variante en los últimos 30 días.
      // Prisma no permite agrupar por un campo de una relación (productId
      // vive en ProductVariant, no en OrderItem), así que se agrupa por
      // varianteId y luego se re-agrega por producto en memoria (paso siguiente).
      this.prisma.orderItem.groupBy({
        by: ['varianteId'],
        where: { orden: { createdAt: { gte: last30Days } } },
        _sum: { cantidad: true },
      }),
    ]);

    const topProductos = await this.buildTopProductos(ventasAgrupadasPorVariante);

    return {
      ventas: {
        hoy: this.toNumber(ventasHoy._sum.total),
        ultimos7Dias: this.toNumber(ventas7Dias._sum.total),
        ultimos30Dias: this.toNumber(ventas30Dias._sum.total),
      },
      ordenes: {
        hoy: ordenesHoy,
        ultimos7Dias: ordenes7Dias,
        ultimos30Dias: ordenes30Dias,
      },
      clientes: {
        total: clientesTotal,
        nuevosUltimos30Dias: clientesNuevos30Dias,
      },
      topProductos,
    };
  }

  /**
   * A partir de las cantidades agrupadas por variante, resuelve el producto
   * base de cada variante, re-agrega las unidades vendidas por producto y
   * retorna el Top 5 ordenado de mayor a menor.
   */
  private async buildTopProductos(
    ventasPorVariante: Array<{ varianteId: string; _sum: { cantidad: number | null } }>,
  ): Promise<TopProducto[]> {
    if (ventasPorVariante.length === 0) {
      return [];
    }

    const varianteIds = ventasPorVariante.map((v) => v.varianteId);

    const variantes = await this.prisma.productVariant.findMany({
      where: { id: { in: varianteIds } },
      select: {
        id: true,
        producto: { select: { id: true, nombre: true, marca: true } },
      },
    });

    const varianteToProducto = new Map(variantes.map((v) => [v.id, v.producto]));

    const acumuladoPorProducto = new Map<string, TopProducto>();

    for (const venta of ventasPorVariante) {
      const producto = varianteToProducto.get(venta.varianteId);
      if (!producto) continue; // Variante eliminada o inconsistente; se ignora de forma segura

      const cantidad = venta._sum.cantidad ?? 0;
      const existente = acumuladoPorProducto.get(producto.id);

      if (existente) {
        existente.unidadesVendidas += cantidad;
      } else {
        acumuladoPorProducto.set(producto.id, {
          productId: producto.id,
          nombre: producto.nombre,
          marca: producto.marca,
          unidadesVendidas: cantidad,
        });
      }
    }

    return Array.from(acumuladoPorProducto.values())
      .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
      .slice(0, 5);
  }
}
