import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVariantAttributeDto {
  @IsString()
  @IsNotEmpty()
  nombre: string; // Ej: "Color", "Talla"

  @IsString()
  @IsNotEmpty()
  valor: string; // Ej: "Blanco", "27"
}
