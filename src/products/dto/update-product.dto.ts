import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// Las variantes de un producto existente se gestionan por endpoints propios
// (agregar/editar/eliminar variante individual), no en el update del producto base.
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants'] as const),
) {}
