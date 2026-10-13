import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// The filing room clerk: one database client shared by the whole company.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    // Prisma 7 talks to PostgreSQL through a driver adapter (the `pg` package).
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({
      adapter,
      // Errors are thrown to our code (and unexpected ones logged by AllExceptionsFilter),
      // so only warnings are printed here. Add 'query' to see every SQL statement.
      log: ['warn'],
    });
  }

  async onModuleInit() {
    await this.$connect(); // fail fast at startup if the DB is unreachable
  }

  async onModuleDestroy() {
    await this.$disconnect(); // close the connection pool on shutdown
  }
}
