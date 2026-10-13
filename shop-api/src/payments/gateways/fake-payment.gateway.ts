import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PaymentGateway } from '../payment.constants.js';

// A pretend bank for learning: every charge succeeds and no real money moves.
// For a real provider, write e.g. a StripeGateway that implements PaymentGateway and
// change `useClass` in PaymentsModule. Nothing else in the app has to change.
@Injectable()
export class FakePaymentGateway implements PaymentGateway {
  private readonly logger = new Logger(FakePaymentGateway.name);

  async charge(amountCents: number, customerId: string) {
    const id = `fake_ch_${randomUUID()}`;
    this.logger.log(`Charged ${amountCents} cents to ${customerId} (${id})`);
    return { id };
  }
}
