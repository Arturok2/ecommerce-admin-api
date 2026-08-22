import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail({}, { message: 'El email proporcionado no es válido' })
  email: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;
}
