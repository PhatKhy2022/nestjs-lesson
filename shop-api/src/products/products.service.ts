import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception.js';

// Warehouse staff. Exported by ProductsModule, so Sales (Orders) can reserve stock.
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  // A duplicate sku throws Prisma error P2002, which PrismaExceptionFilter turns into 409.
  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  // A product that appears in an order can't be deleted (foreign key, Prisma error P2003),
  // which PrismaExceptionFilter turns into 400.
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
  }

  /**
   * Takes `qty` items off the shelf. Pass a transaction client (`tx`) to make this part of a bigger
   * all-or-nothing operation (see OrdersService.create). Without one it uses the normal client.
   */
  async reserveStock(
    productId: number,
    qty: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    // One atomic UPDATE ... WHERE stock >= qty: two shoppers can't both buy the last item.
    const { count } = await db.product.updateMany({
      where: { id: productId, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (count === 0)
      throw new InsufficientStockException(product.id, product.stock);
    return product;
  }

  // Puts items back on the shelf, e.g. when an order is cancelled.
  async restock(
    productId: number,
    qty: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    await db.product.update({
      where: { id: productId },
      data: { stock: { increment: qty } },
    });
  }
}
