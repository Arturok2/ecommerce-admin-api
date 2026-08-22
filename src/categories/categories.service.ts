import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Estructura de árbol expuesta al cliente: categoría raíz + hijas de 2do nivel
export interface CategoryTreeNode extends Category {
  children: Category[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const { parentId, ...rest } = dto;

    return this.prisma.category.create({
      data: {
        ...rest,
        ...(parentId && { parent: { connect: { id: parentId } } }),
      },
    });
  }

  /**
   * Retorna únicamente las categorías raíz (parentId = null), cada una
   * con su propiedad `children` conteniendo sus subcategorías de 2do nivel.
   * Ambos niveles ordenados por `posicion`.
   */
  async findAll(): Promise<CategoryTreeNode[]> {
    const raices = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { posicion: 'asc' },
      include: {
        subcategorias: {
          orderBy: { posicion: 'asc' },
        },
      },
    });

    return raices.map(({ subcategorias, ...categoria }) => ({
      ...categoria,
      children: subcategorias,
    }));
  }

  async findOne(id: string): Promise<Category> {
    const categoria = await this.prisma.category.findUnique({
      where: { id },
      include: { subcategorias: { orderBy: { posicion: 'asc' } } },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con id "${id}" no encontrada`);
    }

    return categoria;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id);
    const { parentId, ...rest } = dto;

    return this.prisma.category.update({
      where: { id },
      data: {
        ...rest,
        ...(parentId !== undefined && {
          parent: parentId ? { connect: { id: parentId } } : { disconnect: true },
        }),
      },
    });
  }

  async remove(id: string): Promise<Category> {
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id } });
  }
}
