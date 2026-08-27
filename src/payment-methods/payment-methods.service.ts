import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Catálogo de métodos de pago más comunes en e-commerce en México.
// `posicion` controla el orden en que aparecen en el <select> del frontend.
const SEED_PAYMENT_METHODS: { nombre: string; posicion: number }[] = [
  { nombre: 'Tarjeta de crédito', posicion: 1 },
  { nombre: 'Tarjeta de débito', posicion: 2 },
  { nombre: 'Transferencia bancaria (SPEI)', posicion: 3 },
  { nombre: 'PayPal', posicion: 4 },
  { nombre: 'Mercado Pago', posicion: 5 },
  { nombre: 'Efectivo en OXXO', posicion: 6 },
];

@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({ orderBy: { posicion: 'asc' } });
  }

  /**
   * Estrategia de semilla: si la tabla está vacía, inserta los métodos de
   * pago más comunes para que el <select> de "Generar Venta Ficticia" tenga
   * opciones disponibles de inmediato, sin necesidad de un panel de admin
   * para darlos de alta manualmente.
   */
  async seedPaymentMethods(): Promise<void> {
    const count = await this.prisma.paymentMethod.count();

    if (count > 0) {
      return;
    }

    await this.prisma.paymentMethod.createMany({ data: SEED_PAYMENT_METHODS });

    this.logger.warn(
      `${SEED_PAYMENT_METHODS.length} métodos de pago sembrados en el catálogo`,
    );
  }
}
