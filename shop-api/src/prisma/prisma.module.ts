import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global: the filing room is open to every department without importing it.
// Use sparingly: only for true infrastructure like the database.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
