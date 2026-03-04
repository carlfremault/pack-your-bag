import { Test, TestingModule } from '@nestjs/testing';

import { ItemPack } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { ItemPackService } from './item-pack.service';

vi.mock('uuid', () => ({
  v7: () => 'mocked-uuid',
}));

describe('ItemPackService', () => {
  let service: ItemPackService;
  let prisma: PrismaService;

  const mockPrismaService = {
    itemPack: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    item: {
      findUnique: vi.fn(),
    },
    pack: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<ItemPack>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemPackService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ItemPackService>(ItemPackService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('upsertItemInPack', () => {
    it('should upsert an item in a pack', async () => {
      const upsertItemInPackDto = {
        itemId: '123',
        packId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: '123', userId });
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: '456', userId });

      mockPrismaService.itemPack.upsert.mockResolvedValue({
        id: 'mocked-uuid',
        ...upsertItemInPackDto,
      });

      const result = await service.upsertItemInPack(upsertItemInPackDto, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: '123', userId },
      });
      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id: '456', userId },
      });
      expect(mockPrismaService.itemPack.upsert).toHaveBeenCalledWith({
        where: { itemId_packId: { itemId: '123', packId: '456' } },
        create: { id: 'mocked-uuid', itemId: '123', packId: '456', quantity: 1 },
        update: { quantity: 1 },
      });
      expect(result).toEqual({
        id: 'mocked-uuid',
        itemId: '123',
        packId: '456',
        quantity: 1,
      });
    });

    it('should throw an error if the item is not found', async () => {
      const upsertItemInPackDto = {
        itemId: '123',
        packId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: '456', userId });

      await expect(service.upsertItemInPack(upsertItemInPackDto, userId)).rejects.toThrow(
        'Item not found',
      );
      expect(mockPrismaService.itemPack.upsert).not.toHaveBeenCalled();
    });

    it('should throw an error if the pack is not found', async () => {
      const upsertItemInPackDto = {
        itemId: '123',
        packId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: '123', userId });
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.upsertItemInPack(upsertItemInPackDto, userId)).rejects.toThrow(
        'Pack not found',
      );
      expect(mockPrismaService.itemPack.upsert).not.toHaveBeenCalled();
    });
  });

  describe('removeItemFromPack', () => {
    it('should remove an item from a pack', async () => {
      const itemId = '123';
      const packId = '456';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId, userId });
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: packId, userId });

      mockPrismaService.itemPack.delete.mockResolvedValue({
        id: 'mocked-uuid',
        itemId,
        packId,
        quantity: 1,
      });

      const result = await service.removeItemFromPack(itemId, packId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: itemId, userId },
      });
      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id: packId, userId },
      });
      expect(mockPrismaService.itemPack.delete).toHaveBeenCalledWith({
        where: { itemId_packId: { itemId, packId } },
      });
      expect(result).toEqual({ id: 'mocked-uuid', itemId, packId, quantity: 1 });
    });

    it('should throw an error if the item is not found', async () => {
      const itemId = '123';
      const packId = '456';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: packId, userId });

      await expect(service.removeItemFromPack(itemId, packId, userId)).rejects.toThrow(
        'Item not found',
      );
      expect(mockPrismaService.itemPack.delete).not.toHaveBeenCalled();
    });

    it('should throw an error if the pack is not found', async () => {
      const itemId = '123';
      const packId = '456';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId, userId });
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.removeItemFromPack(itemId, packId, userId)).rejects.toThrow(
        'Pack not found',
      );
      expect(mockPrismaService.itemPack.delete).not.toHaveBeenCalled();
    });
  });
});
