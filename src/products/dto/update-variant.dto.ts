import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

// Edición puntual de una variante ya existente. No incluye SKU ni cambios
// de atributos que no sean Color/Talla: esos casos siguen requiriendo
// crear una variante nueva (o eliminar y volver a crear) para no romper
// SKUs referenciados por órdenes ya existentes.
export class UpdateVariantDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  color?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  talla?: string;
}
