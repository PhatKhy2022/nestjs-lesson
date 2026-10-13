import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { requestId } from './common/middleware/request-id.middleware.js';
import { validate } from './config/env.validation.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';

// Headquarters: the root org chart. Nest starts here, reads every imported department's
// org chart, and wires all the staff together before the first request arrives.
@Module({
  imports: [
    // Company-wide services
    ConfigModule.forRoot({ isGlobal: true, validate }), // the handbook (.env), checked at startup
    EventEmitterModule.forRoot(), // the announcement board
    PrismaModule, // the filing room (@Global)

    // Departments
    AuthModule, // security desk (also registers the global guards)
    UsersModule, // HR
    ProductsModule, // warehouse
    OrdersModule, // sales
    PaymentsModule, // finance
  ],
  controllers: [AppController],
  providers: [
    // Global exception filters. For each error Nest tries the LAST registered filter first,
    // so the specific Prisma filter goes after the catch-all.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },

    // Global interceptors, outermost first: time it → wrap the answer → give up after 5 s.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(requestId).forRoutes('{*splat}'); // every route ('*' is the old, pre-Nest 11 syntax)
  }
}
