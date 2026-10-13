import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

// A unit test: the real UsersService with fake helpers, so no database is needed.
describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = { user: { findFirst: vi.fn(), update: vi.fn() } };
  const eventsMock = { emit: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock }, // swap the real filing room for a fake one
        { provide: EventEmitter2, useValue: eventsMock },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('throws NotFoundException when the user does not exist', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('soft-deletes a user and announces it on the event board', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 7,
      email: 'an@shop.dev',
    });

    await service.remove(7);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { deletedAt: expect.any(Date) },
    });
    expect(eventsMock.emit).toHaveBeenCalledWith('user.deleted', { userId: 7 });
  });
});
