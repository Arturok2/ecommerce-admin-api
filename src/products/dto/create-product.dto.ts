import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Genero } from '@prisma/client';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsEnum(Genero, { message: 'genero debe ser uno de: MASCULINO, FEMENINO, UNISEX, NINOS' })
  genero: Genero;

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsArray()
  @IsString({ each: true })
  imagenes: string[];

  @IsUUID()
  categoriaId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El producto debe tener al menos una variante' })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
