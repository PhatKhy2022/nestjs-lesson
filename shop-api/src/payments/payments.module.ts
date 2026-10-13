import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestLoggerMiddleware } from '../common/middleware/request-logger.middleware.js';
import { OrdersModule } from '../orders/orders.module.js';
import { FakePaymentGateway } from './gateways/fake-payment.gateway.js';
import { PAYMENT_GATEWAY } from './payment.constants.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

// The finance department's org chart.
@Module({
  imports: [OrdersModule], // ✅ borrow the exported OrdersService from Sales
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    // "When someone asks for PAYMENT_GATEWAY, give them a FakePaymentGateway."
    // Swap the class here (e.g. StripeGateway) and every consumer gets the new bank.
    { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
  ],
})
export class PaymentsModule implements NestModule {
  // Module-level middleware: log every request to the cashier's window (money deserves a paper trail).
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes(PaymentsController);
  }
}
