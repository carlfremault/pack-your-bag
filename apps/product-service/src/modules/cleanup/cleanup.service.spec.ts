import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditEventType, AuditSeverity } from '@repo/db';
import { AuditLogProvider } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { CleanupService } from './cleanup.service';

describe('CleanupService', () => {
  let service: CleanupService;

  const mockPrismaService = {
    itemList: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    itemPack: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
    listPack: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
    trip: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
    pack: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    list: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    item: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
    category: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<unknown>) => {
      return callback(mockPrismaService);
    }),
  };

  const mockAuditLogProvider = { auditRequest: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteUserData', () => {
    const userIds = ['user-1', 'user-2'];

    it('should delete all user data in correct order and audit the result', async () => {
      await service.deleteUserData(userIds);

      expect(mockPrismaService.$transaction).toHaveBeenCalledOnce();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.SCHEDULED_TASK,
          severity: AuditSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          message: expect.stringContaining('5 item(s)') as string,
        }),
      );
    });

    it('should delete join tables with correct user filter', async () => {
      await service.deleteUserData(userIds);

      expect(mockPrismaService.itemList.deleteMany).toHaveBeenCalledWith({
        where: { item: { userId: { in: userIds } } },
      });
      expect(mockPrismaService.itemPack.deleteMany).toHaveBeenCalledWith({
        where: { item: { userId: { in: userIds } } },
      });
      expect(mockPrismaService.listPack.deleteMany).toHaveBeenCalledWith({
        where: { list: { userId: { in: userIds } } },
      });
    });

    it('should delete primary entities with correct user filter', async () => {
      await service.deleteUserData(userIds);

      expect(mockPrismaService.trip.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: userIds } },
      });
      expect(mockPrismaService.pack.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: userIds } },
      });
      expect(mockPrismaService.list.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: userIds } },
      });
      expect(mockPrismaService.item.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: userIds } },
      });
      expect(mockPrismaService.category.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: userIds } },
      });
    });

    it('should audit zero counts when no data exists for users', async () => {
      mockPrismaService.itemList.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.itemPack.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.listPack.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.trip.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.pack.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.list.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.item.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.category.deleteMany.mockResolvedValue({ count: 0 });

      await service.deleteUserData(userIds);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '0 item(s), 0 category(s), 0 list(s), 0 pack(s), and 0 trip(s)',
          ) as string,
        }),
      );
    });
  });
});
