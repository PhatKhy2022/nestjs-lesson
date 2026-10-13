import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

// The warehouse's org chart.
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // 👈 Orders may borrow ProductsService to reserve stock
})
export class ProductsModule {}
