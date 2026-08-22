import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateVariantAttributeDto } from './create-variant-attribute.dto';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'La variante debe tener al menos un atributo (ej. Talla, Color)' })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantAttributeDto)
  atributos: CreateVariantAttributeDto[];
}
