import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator.js';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/health: "is the company open, and can it reach the filing room?"
  @Public()
  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'up' };
  }
}
