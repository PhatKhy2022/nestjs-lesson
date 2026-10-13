import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';

// The cashier's window.
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post() // POST /api/payments  { "orderId": "<uuid>" }
  create(@CurrentUser('sub') userId: number, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.pay(userId, dto);
  }
}
