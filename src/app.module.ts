import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { CustomersService } from './customers/customers.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { PaymentMethodsService } from './payment-methods/payment-methods.service';
import { MexicanStatesModule } from './mexican-states/mexican-states.module';
import { MexicanStatesService } from './mexican-states/mexican-states.service';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
    DashboardModule,
    PaymentMethodsModule,
    MexicanStatesModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly authService: AuthService,
    private readonly customersService: CustomersService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly mexicanStatesService: MexicanStatesService,
  ) {}

  // Esto creará automáticamente tu usuario administrador en Supabase al levantar el servidor
  async onApplicationBootstrap() {
    await this.authService.createFirstAdmin();
    await this.customersService.seedInitialCustomers();
    await this.paymentMethodsService.seedPaymentMethods();
    await this.mexicanStatesService.seedMexicanStates();
  }
}
