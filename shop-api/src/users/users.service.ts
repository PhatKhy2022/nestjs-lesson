import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { USER_DELETED, type UserDeletedEvent } from './user-deleted.event.js';

// Never send the password hash out of the building.
const omitSecrets = { passwordHash: true } as const;
const PAGE_SIZE = 20;

// HR staff. Exported by UsersModule, so Auth and Orders can ask HR for help.
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService, // from the @Global PrismaModule, no import needed
    private readonly events: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: { email: dto.email, name: dto.name, passwordHash },
        omit: omitSecrets,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }
  }

  findAll(page: number) {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      omit: omitSecrets,
      orderBy: { id: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      omit: omitSecrets,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  // Only for AuthService: the one place that needs the hash, to check a password.
  findByEmailWithPassword(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id); // 404 if missing or deleted
    return this.prisma.user.update({
      where: { id },
      data: dto,
      omit: omitSecrets,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    // Post a notice instead of calling OrdersService: Users never needs to import Orders,
    // so there is no circular dependency (Orders already imports Users).
    this.events.emit(USER_DELETED, { userId: id } satisfies UserDeletedEvent);
  }
}
