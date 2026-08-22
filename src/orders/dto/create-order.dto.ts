import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from './create-address.dto';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsUUID()
  clienteId: string;

  @IsString()
  @IsNotEmpty()
  metodoPago: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  direccion: CreateAddressDto;

  @IsArray()
  @ArrayMinSize(1, { message: 'La orden debe tener al menos un item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
