import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '../generated/prisma/client.js';
import { OrdersService } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PAYMENT_GATEWAY, type PaymentGateway } from './payment.constants.js';

// Finance staff. Borrows OrdersService from Sales (PaymentsModule imports OrdersModule)
// and talks to "the bank" through the PAYMENT_GATEWAY token.
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async pay(userId: number, { orderId }: CreatePaymentDto) {
    // 1. Ask Sales for the order. 404 if it doesn't exist or isn't yours.
    const order = await this.ordersService.findOwned(userId, orderId);
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(
        `Order is ${order.status}, only PENDING orders can be paid`,
      );
    }

    // 2. Charge the card. Money is counted in cents to avoid rounding errors.
    const amountCents = order.total.mul(100).toNumber();
    const charge = await this.gateway.charge(amountCents, `user-${userId}`);

    // 3. Record the payment and mark the order PAID together: both happen, or neither does.
    // (A real system also needs a plan for "card charged but this step failed" — see Lesson 12.)
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          status: PaymentStatus.SUCCEEDED,
          providerChargeId: charge.id,
        },
      });
      await this.ordersService.markPaid(order.id, tx);
      return payment;
    });
  }
}
