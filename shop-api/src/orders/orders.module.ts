import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { UsersModule } from '../users/users.module.js';
import { UserDeletedListener } from './listeners/user-deleted.listener.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

// The sales department's org chart.
@Module({
  imports: [UsersModule, ProductsModule], // ✅ import the MODULES whose exported staff we need
  controllers: [OrdersController],
  providers: [OrdersService, UserDeletedListener],
  // providers: [OrdersService, UsersService], // ❌ would create a SECOND, separate UsersService
  exports: [OrdersService], // 👈 Finance (PaymentsModule) needs OrdersService
})
export class OrdersModule {}
