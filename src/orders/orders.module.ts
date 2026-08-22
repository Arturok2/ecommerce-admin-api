import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule], // Necesario para que JwtAuthGuard resuelva JwtService
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
