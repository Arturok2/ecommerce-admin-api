import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoOrden } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(EstadoOrden, {
    message: 'estado debe ser uno de: EN_PREPARACION, ENVIADO, COMPLETADO, CANCELADO',
  })
  estado: EstadoOrden;

  @IsOptional()
  @IsString()
  nota?: string;
}
