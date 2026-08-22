import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @IsPositive()
  cantidad: number;
}
