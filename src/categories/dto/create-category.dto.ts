import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @Min(0)
  posicion: number;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
