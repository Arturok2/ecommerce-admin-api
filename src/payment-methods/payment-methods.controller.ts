import { Controller, Get } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PaymentMethodsService } from './payment-methods.service';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  // Lectura pública: el formulario de "Generar Venta Ficticia" necesita
  // poblar el <select> sin requerir sesión de admin, igual que /categories.
  @Get()
  findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodsService.findAll();
  }
}
