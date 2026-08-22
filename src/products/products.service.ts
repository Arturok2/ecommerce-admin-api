import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_DETAIL_INCLUDE = {
  categoria: true,
  variantes: {
    include: { atributos: true },
  },
} satisfies Prisma.ProductInclude;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea el producto base junto con sus variantes y los atributos
   * (Color/Talla) de cada variante, todo dentro de una única transacción:
   * si falla cualquier parte (ej. un SKU duplicado), no queda nada guardado.
   */
  async create(dto: CreateProductDto): Promise<Product> {
    const { variants, categoriaId, ...productData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.product.create({
        data: {
          ...productData,
          categoria: { connect: { id: categoriaId } },
          variantes: {
            create: variants.map((variant) => ({
              sku: variant.sku,
              precio: variant.precio,
              stock: variant.stock,
              atributos: {
                create: variant.atributos.map((atributo) => ({
                  tipo: atributo.nombre,
                  valor: atributo.valor,
                })),
              },
            })),
          },
        },
        include: PRODUCT_DETAIL_INCLUDE,
      });

      return producto;
    });
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<Product>> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PRODUCT_DETAIL_INCLUDE,
      }),
      this.prisma.product.count(),
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

  async findOne(id: string): Promise<Product> {
    const producto = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_DETAIL_INCLUDE,
    });

    if (!producto) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }

    return producto;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id);
    const { categoriaId, ...rest } = dto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(categoriaId && { categoria: { connect: { id: categoriaId } } }),
      },
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  async remove(id: string): Promise<Product> {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
