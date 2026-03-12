import { Test, TestingModule } from '@nestjs/testing';

import { ItemList } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { ItemListService } from './item-list.service';

vi.mock('uuid', () => ({
  v7: () => 'mocked-uuid',
}));

describe('ItemListService', () => {
  let service: ItemListService;
  let prisma: PrismaService;

  const mockPrismaService = {
    itemList: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    item: {
      findUnique: vi.fn(),
    },
    list: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<ItemList>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemListService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ItemListService>(ItemListService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('upsertItemOnList', () => {
    it('should upsert an item on a list', async () => {
      const upsertItemOnListDto = {
        itemId: '123',
        listId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: '123', userId });
      mockPrismaService.list.findUnique.mockResolvedValue({ id: '456', userId });

      mockPrismaService.itemList.upsert.mockResolvedValue({
        id: 'mocked-uuid',
        ...upsertItemOnListDto,
      });

      const result = await service.upsertItemOnList(upsertItemOnListDto, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: '123', userId },
      });
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id: '456', userId },
      });
      expect(mockPrismaService.itemList.upsert).toHaveBeenCalledWith({
        where: { itemId_listId: { itemId: '123', listId: '456' } },
        create: { id: 'mocked-uuid', itemId: '123', listId: '456', quantity: 1 },
        update: { quantity: 1 },
      });
      expect(result).toEqual({
        id: 'mocked-uuid',
        itemId: '123',
        listId: '456',
        quantity: 1,
      });
    });

    it('should throw an error if the item is not found', async () => {
      const upsertItemOnListDto = {
        itemId: '123',
        listId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.list.findUnique.mockResolvedValue({ id: '456', userId });

      await expect(service.upsertItemOnList(upsertItemOnListDto, userId)).rejects.toThrow(
        'Item not found',
      );

      expect(mockPrismaService.itemList.upsert).not.toHaveBeenCalled();
    });

    it('should throw an error if the list is not found', async () => {
      const upsertItemOnListDto = {
        itemId: '123',
        listId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue(null);
      mockPrismaService.item.findUnique.mockResolvedValue({ id: '123', userId });

      await expect(service.upsertItemOnList(upsertItemOnListDto, userId)).rejects.toThrow(
        'List not found',
      );
      expect(mockPrismaService.itemList.upsert).not.toHaveBeenCalled();
    });
  });

  describe('removeItemFromList', () => {
    it('should remove an item from a list', async () => {
      const itemId = '123';
      const listId = '456';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId, userId });
      mockPrismaService.list.findUnique.mockResolvedValue({ id: listId, userId });
      mockPrismaService.itemList.delete.mockResolvedValue({
        id: 'some-id',
        itemId,
        listId,
        quantity: 1,
      });

      const result = await service.removeItemFromList(itemId, listId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: itemId, userId },
      });
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id: listId, userId },
      });
      expect(mockPrismaService.itemList.delete).toHaveBeenCalledWith({
        where: { itemId_listId: { itemId, listId } },
      });
      expect(result).toEqual({ id: 'some-id', itemId, listId, quantity: 1 });
    });

    it('should throw an error if the item is not found', async () => {
      const itemId = '123';
      const listId = '456';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.list.findUnique.mockResolvedValue({ id: listId, userId });

      await expect(service.removeItemFromList(itemId, listId, userId)).rejects.toThrow(
        'Item not found',
      );

      expect(mockPrismaService.itemList.delete).not.toHaveBeenCalled();
    });

    it('should throw an error if the list is not found', async () => {
      const itemId = '123';
      const listId = '456';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId, userId });
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.removeItemFromList(itemId, listId, userId)).rejects.toThrow(
        'List not found',
      );

      expect(mockPrismaService.itemList.delete).not.toHaveBeenCalled();
    });
  });
});
