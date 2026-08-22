import { Injectable, Logger } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

const SEED_CUSTOMERS: CreateCustomerDto[] = [
  { nombre: 'Juana Pérez', email: 'juana.perez@example.com', telefono: '2281234567' },
  { nombre: 'Carlos Ramírez', email: 'carlos.ramirez@example.com', telefono: '2287654321' },
  { nombre: 'María Torres', email: 'maria.torres@example.com', telefono: '2289876543' },
];

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({ data: dto });
  }

  async findAll(): Promise<Customer[]> {
    return this.prisma.customer.findMany({ orderBy: { nombre: 'asc' } });
  }

  /**
   * Estrategia de semilla: si la tabla Customer está vacía, inserta un
   * puñado de clientes ficticios para que el frontend tenga datos de
   * prueba inmediatamente (útil para el selector de "Generar Venta Ficticia").
   */
  async seedInitialCustomers(): Promise<void> {
    const customerCount = await this.prisma.customer.count();

    if (customerCount > 0) {
      return;
    }

    await this.prisma.customer.createMany({ data: SEED_CUSTOMERS });

    this.logger.warn(
      `${SEED_CUSTOMERS.length} clientes ficticios creados para pruebas del evaluador`,
    );
  }
}
