import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminOnly } from '../auth/auth.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import { ParseSortPipe, type Sort } from '../common/pipes/parse-sort.pipe.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders.query.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';

// The sales counter. The customer id always comes from the token, never from the request body.
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post() // POST /api/orders
  create(@CurrentUser('sub') userId: number, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Get() // GET /api/orders?status=PENDING&page=1&limit=20&sort=-createdAt
  list(
    @CurrentUser('sub') userId: number,
    @Query() query: ListOrdersQueryDto,
    @Query('sort', new ParseSortPipe(['createdAt', 'total'])) sort?: Sort,
  ) {
    return this.ordersService.list(userId, query, sort);
  }

  @Public()
  @Get('track/:trackingCode') // GET /api/orders/track/TRK-1A2B3C4D (no login needed)
  track(@Param('trackingCode') code: string) {
    return this.ordersService.track(code);
  }

  @Get(':id') // GET /api/orders/<uuid>
  findOne(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findOwned(userId, id);
  }

  @AdminOnly()
  @Patch(':id/status') // PATCH /api/orders/<uuid>/status
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
