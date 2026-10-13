import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

// HR's org chart.
@Module({
  controllers: [UsersController], // the front desk
  providers: [UsersService], // the staff Nest should create
  exports: [UsersService], // 👈 lend UsersService to departments that import UsersModule (Auth, Orders)
})
export class UsersModule {}
