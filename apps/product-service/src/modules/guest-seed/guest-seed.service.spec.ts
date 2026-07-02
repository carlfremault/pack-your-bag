import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { GuestSeedService } from './guest-seed.service';

vi.mock('uuid', () => {
  let counter = 0;
  return { v7: vi.fn(() => `mock-uuid-${++counter}`) };
});

describe('GuestSeedService', () => {
  let service: GuestSeedService;

  const mockPrismaService = {
    category: { createMany: vi.fn().mockResolvedValue({ count: 5 }) },
    item: { createMany: vi.fn().mockResolvedValue({ count: 17 }) },
    list: { createMany: vi.fn().mockResolvedValue({ count: 3 }) },
    itemList: { createMany: vi.fn().mockResolvedValue({ count: 12 }) },
    pack: { create: vi.fn().mockResolvedValue({}) },
    listPack: { createMany: vi.fn().mockResolvedValue({ count: 3 }) },
    itemPack: { createMany: vi.fn().mockResolvedValue({ count: 5 }) },
    trip: { create: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<unknown>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestSeedService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<GuestSeedService>(GuestSeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedGuestData', () => {
    const userId = 'test-user-id';

    it('should run inside a transaction', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalledOnce();
    });

    it('should create 5 categories with the correct userId', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.category.createMany).toHaveBeenCalledOnce();
      const { data } = mockPrismaService.category.createMany.mock.calls[0]![0] as {
        data: { userId: string; name: string; colorTheme: string }[];
      };
      expect(data).toHaveLength(5);
      expect(data.map((c) => c.name)).toEqual([
        'Clothing',
        'Shelter',
        'Gear',
        'Toiletries',
        'Food',
      ]);
      for (const category of data) {
        expect(category.userId).toBe(userId);
      }
    });

    it('should create 17 items with the correct userId', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.item.createMany).toHaveBeenCalledOnce();
      const { data } = mockPrismaService.item.createMany.mock.calls[0]![0] as {
        data: { userId: string; name: string }[];
      };
      expect(data).toHaveLength(17);
      for (const item of data) {
        expect(item.userId).toBe(userId);
      }
    });

    it('should create 3 lists with the correct userId', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.list.createMany).toHaveBeenCalledOnce();
      const { data } = mockPrismaService.list.createMany.mock.calls[0]![0] as {
        data: { userId: string; name: string }[];
      };
      expect(data).toHaveLength(3);
      expect(data.map((l) => l.name)).toEqual([
        'Hiking essentials',
        'Overnight gear',
        'Food one day',
      ]);
      for (const list of data) {
        expect(list.userId).toBe(userId);
      }
    });

    it('should create 12 item-list links', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.itemList.createMany).toHaveBeenCalledOnce();
      const { data } = mockPrismaService.itemList.createMany.mock.calls[0]![0] as {
        data: unknown[];
      };
      expect(data).toHaveLength(12);
    });

    it('should create a pack with the correct userId', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.pack.create).toHaveBeenCalledOnce();
      const { data } = mockPrismaService.pack.create.mock.calls[0]![0] as {
        data: { userId: string; name: string };
      };
      expect(data.userId).toBe(userId);
      expect(data.name).toBe('Weekend hike pack');
    });

    it('should create 3 list-pack links and 5 item-pack links', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.listPack.createMany).toHaveBeenCalledOnce();
      const { data: listPackData } = mockPrismaService.listPack.createMany.mock.calls[0]![0] as {
        data: unknown[];
      };
      expect(listPackData).toHaveLength(3);

      expect(mockPrismaService.itemPack.createMany).toHaveBeenCalledOnce();
      const { data: itemPackData } = mockPrismaService.itemPack.createMany.mock.calls[0]![0] as {
        data: unknown[];
      };
      expect(itemPackData).toHaveLength(5);
    });

    it('should create a trip linked to the pack and userId', async () => {
      await service.seedGuestData(userId);

      expect(mockPrismaService.trip.create).toHaveBeenCalledOnce();
      const { data } = mockPrismaService.trip.create.mock.calls[0]![0] as {
        data: { userId: string; name: string; packId: string };
      };
      expect(data.userId).toBe(userId);
      expect(data.name).toBe('Sample weekend hike');
      expect(data.packId).toBeDefined();
    });

    it('should propagate transaction errors', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(service.seedGuestData(userId)).rejects.toThrow('Transaction failed');
    });
  });
});
