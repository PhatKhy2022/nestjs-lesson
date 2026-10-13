import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  USER_DELETED,
  type UserDeletedEvent,
} from '../../users/user-deleted.event.js';
import { OrdersService } from '../orders.service.js';

// Sales reads the announcement board: when HR deletes a user, cancel that user's open orders.
@Injectable()
export class UserDeletedListener {
  private readonly logger = new Logger(UserDeletedListener.name);

  constructor(private readonly ordersService: OrdersService) {}

  @OnEvent(USER_DELETED)
  async cancelOpenOrders({ userId }: UserDeletedEvent) {
    const cancelled = await this.ordersService.cancelPendingForUser(userId);
    this.logger.log(
      `User ${userId} deleted → cancelled ${cancelled} pending order(s)`,
    );
  }
}
