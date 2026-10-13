import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Sort } from '../common/pipes/parse-sort.pipe.js';
import { OrderStatus, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from '../products/products.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders.query.js';

// Which status changes an admin may make by hand. PENDING → PAID only happens through a payment.
const ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: [OrderStatus.CANCELLED],
  PAID: [OrderStatus.SHIPPED],
};

type OrderWithItems = {
  id: string;
  items: { productId: number; quantity: number }[];
};

const newTrackingCode = () =>
  `TRK-${randomBytes(4).toString('hex').toUpperCase()}`;

// Sales staff. They borrow help from two other departments:
//   UsersService (HR)          → "does this customer exist?"
//   ProductsService (Warehouse) → "reserve these items"
// Both arrive through the constructor because OrdersModule imports UsersModule and ProductsModule.
@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    await this.usersService.findOne(userId); // 404 if the customer was deleted after logging in

    // Merge duplicate lines, e.g. two lines for product 1 → one line with the summed quantity.
    const quantities = new Map<number, number>();
    for (const { productId, quantity } of dto.items) {
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    // All or nothing: if any product is short, every stock change made so far is rolled back.
    return this.prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0);
      const items: {
        productId: number;
        quantity: number;
        unitPrice: Prisma.Decimal;
      }[] = [];

      for (const [productId, quantity] of quantities) {
        const product = await this.productsService.reserveStock(
          productId,
          quantity,
          tx,
        );
        total = total.plus(product.price.mul(quantity));
        items.push({ productId, quantity, unitPrice: product.price });
      }

      return tx.order.create({
        data: {
          userId,
          total,
          note: dto.note,
          trackingCode: newTrackingCode(),
          items: { create: items },
        },
        include: { items: true },
      });
    });
  }

  list(
    userId: number,
    { status, page, limit }: ListOrdersQueryDto,
    sort?: Sort,
  ) {
    return this.prisma.order.findMany({
      where: { userId, status }, // status undefined → Prisma ignores the filter
      orderBy: sort ? { [sort.field]: sort.direction } : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: true },
    });
  }

  // Ownership check inside the query: someone else's order looks exactly like a missing one (404).
  async findOwned(userId: number, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, payment: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  // Public tracking page: shows only the status, never who ordered what.
  async track(trackingCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { trackingCode },
      select: {
        trackingCode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!order)
      throw new NotFoundException(
        `No order with tracking code ${trackingCode}`,
      );
    return order;
  }

  updateStatus(id: string, status: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException(`Order ${id} not found`);
      if (!ADMIN_TRANSITIONS[order.status]?.includes(status)) {
        throw new ConflictException(
          `Cannot change status from ${order.status} to ${status}`,
        );
      }

      if (status === OrderStatus.CANCELLED) {
        await this.cancel(order, tx);
        return tx.order.findUniqueOrThrow({
          where: { id },
          include: { items: true },
        });
      }
      return tx.order.update({
        where: { id },
        data: { status },
        include: { items: true },
      });
    });
  }

  // Called by Finance (PaymentsService) inside its own transaction, hence the optional `db`.
  async markPaid(orderId: string, db: Prisma.TransactionClient = this.prisma) {
    const { count } = await db.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING },
      data: { status: OrderStatus.PAID },
    });
    if (count === 0) throw new ConflictException('Order is not pending');
  }

  // Called by UserDeletedListener when HR announces that a user was deleted.
  async cancelPendingForUser(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId, status: OrderStatus.PENDING },
      include: { items: true },
    });
    for (const order of orders) {
      await this.prisma.$transaction((tx) => this.cancel(order, tx));
    }
    return orders.length;
  }

  // Cancelling puts the items back on the shelf.
  private async cancel(order: OrderWithItems, tx: Prisma.TransactionClient) {
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CANCELLED },
    });
    if (count === 0) return; // someone else changed it in the meantime
    for (const item of order.items) {
      await this.productsService.restock(item.productId, item.quantity, tx);
    }
  }
}
