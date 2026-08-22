import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [AuthModule], // Necesario para que JwtAuthGuard resuelva JwtService
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService], // Disponible para OrdersModule u otros consumidores futuros
})
export class CustomersModule {}
