import { Test, TestingModule } from '@nestjs/testing';

import { Item, List, Pack, Trip } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { ItemService } from './item.service';

describe('ItemService', () => {
  let service: ItemService;
  let prisma: PrismaService;

  const mockPrismaService = {
    item: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemList: {
      deleteMany: vi.fn(),
    },
    itemPack: {
      deleteMany: vi.fn(),
    },
    list: {
      findMany: vi.fn(),
    },
    pack: {
      findMany: vi.fn(),
    },
    trip: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<Item>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ItemService>(ItemService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('createItem', () => {
    it('should build correct create data with userId and id, without category when categoryId missing', async () => {
      const userId = 'user-1';
      const dto = { name: 'Shoes', description: 'Comfy', weight: 200 };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.item.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: capturedData.id, ...dto, userId });
        },
      );

      await service.createItem(dto as never, userId);

      expect(capturedData).toMatchObject({
        name: 'Shoes',
        description: 'Comfy',
        weight: 200,
      });
      expect(capturedData.id).toBeDefined();
      expect(typeof capturedData.id).toBe('string');
      expect(capturedData.category).toBeUndefined();
    });

    it('should connect category when categoryId is provided', async () => {
      const userId = 'user-1';
      const dto = { name: 'Hat', categoryId: 'cat-1' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.item.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: capturedData.id, ...dto, userId });
        },
      );

      await service.createItem(dto as never, userId);

      expect(capturedData.category).toEqual({ connect: { id: 'cat-1' } });
    });
  });

  describe('updateItem', () => {
    it('should build correct update data without category when categoryId missing', async () => {
      const id = 'item-1';
      const userId = 'user-1';
      const dto = { name: 'Updated name' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.item.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.item.update.mockImplementation(
        (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id, ...dto });
        },
      );

      await service.updateItem(id, dto as never, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(capturedData).toMatchObject({ name: 'Updated name' });
      expect(capturedData.category).toBeUndefined();
    });

    it('should connect category when categoryId is provided', async () => {
      const id = 'item-1';
      const userId = 'user-1';
      const dto = { name: 'Shirt', categoryId: 'cat-2' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.item.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.item.update.mockImplementation(
        (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id, ...dto });
        },
      );

      await service.updateItem(id, dto as never, userId);

      expect(capturedData.category).toEqual({ connect: { id: 'cat-2' } });
    });

    it('should disconnect category when categoryId is null', async () => {
      const id = 'item-1';
      const userId = 'user-1';
      const dto = { name: 'Shirt', categoryId: null };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.item.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.item.update.mockImplementation(
        (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id, ...dto });
        },
      );

      await service.updateItem(id, dto as never, userId);

      expect(capturedData.category).toEqual({ disconnect: true });
    });

    it('should throw if item is not found for user', async () => {
      const id = 'item-1';
      const userId = 'user-1';
      const dto = { name: 'Updated name' };
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.updateItem(id, dto as never, userId)).rejects.toThrow('Item not found');

      expect(mockPrismaService.item.update).not.toHaveBeenCalled();
    });
  });

  describe('handleItemDeletion', () => {
    it('should run in transaction and delete itemList, itemPack, then item with id and userId', async () => {
      const itemId = '123';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId, userId });

      await service.handleItemDeletion(itemId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: itemId, userId },
      });
      expect(mockPrismaService.itemList.deleteMany).toHaveBeenCalledWith({ where: { itemId } });
      expect(mockPrismaService.itemPack.deleteMany).toHaveBeenCalledWith({ where: { itemId } });
      expect(mockPrismaService.item.delete).toHaveBeenCalledWith({
        where: { id: itemId, userId },
      });
    });

    it('should throw an error if the item is not found', async () => {
      const itemId = '123';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.handleItemDeletion(itemId, userId)).rejects.toThrow('Item not found');

      expect(mockPrismaService.itemList.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.itemPack.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.item.delete).not.toHaveBeenCalled();
    });
  });

  describe('getItemDeleteImpact', () => {
    it('should return the item, lists, packs, and trips', async () => {
      const itemId = '123';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId, userId });
      mockPrismaService.list.findMany.mockResolvedValue([{ id: '123' } as List]);
      mockPrismaService.pack.findMany.mockResolvedValue([{ id: '123' } as Pack]);
      mockPrismaService.trip.findMany.mockResolvedValue([{ id: '123' } as Trip]);

      const result = await service.getItemDeleteImpact(itemId, userId);

      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: itemId, userId },
      });
      expect(mockPrismaService.list.findMany).toHaveBeenCalledWith({
        where: { items: { some: { itemId } } },
      });
      expect(mockPrismaService.pack.findMany).toHaveBeenCalledWith({
        where: { items: { some: { itemId } } },
      });
      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { packId: { in: ['123'] } },
      });

      expect(result).toMatchObject({
        item: { id: itemId },
        lists: [{ id: '123' } as List],
        packs: [{ id: '123' } as Pack],
        trips: [{ id: '123' } as Trip],
      });
    });

    it('should throw an error if the item is not found', async () => {
      const itemId = '123';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.getItemDeleteImpact(itemId, userId)).rejects.toThrow('Item not found');

      expect(mockPrismaService.list.findMany).not.toHaveBeenCalled();
      expect(mockPrismaService.pack.findMany).not.toHaveBeenCalled();
      expect(mockPrismaService.trip.findMany).not.toHaveBeenCalled();
    });

    it('should not search for trips if the item is not in any packs', async () => {
      const itemId = '123';
      const userId = 'user-1';
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId, userId });
      mockPrismaService.list.findMany.mockResolvedValue([]);
      mockPrismaService.pack.findMany.mockResolvedValue([]);

      const result = await service.getItemDeleteImpact(itemId, userId);

      expect(mockPrismaService.trip.findMany).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        item: { id: itemId },
        lists: [],
        packs: [],
        trips: [],
      });
    });

    it('should return empty Trips when item is in packs but those packs have no trips', async () => {
      const itemId = '123';
      const userId = 'user-1';
      const pack1 = { id: 'pack-1' } as Pack;
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId });
      mockPrismaService.list.findMany.mockResolvedValue([]);
      mockPrismaService.pack.findMany.mockResolvedValue([pack1]);
      mockPrismaService.trip.findMany.mockResolvedValue([]);

      const result = await service.getItemDeleteImpact(itemId, userId);

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { packId: { in: ['pack-1'] } },
      });
      expect(result.trips).toEqual([]);
    });

    it('should pass all pack ids to trip find when item is in multiple packs', async () => {
      const itemId = '123';
      const userId = 'user-1';
      const pack1 = { id: 'p1' } as Pack;
      const pack2 = { id: 'p2' } as Pack;
      const trip1 = { id: 't1' } as Trip;
      mockPrismaService.item.findUnique.mockResolvedValue({ id: itemId });
      mockPrismaService.list.findMany.mockResolvedValue([]);
      mockPrismaService.pack.findMany.mockResolvedValue([pack1, pack2]);
      mockPrismaService.trip.findMany.mockResolvedValue([trip1]);

      const result = await service.getItemDeleteImpact(itemId, userId);

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { packId: { in: ['p1', 'p2'] } },
      });
      expect(result.packs).toHaveLength(2);
      expect(result.trips).toEqual([trip1]);
    });
  });

  describe('response mapping', () => {
    it('should map the item, lists, packs, and trips to corresponding response dtos', async () => {
      const userId = 'user-1';
      const date = new Date();
      const item = {
        id: 'item-1',
        name: 'Test Item',
        description: 'Test Description',
        weight: 1,
        userId,
      };
      const list = {
        id: 'list-1',
        name: 'Test List',
        description: 'Test Description',
        colorCode: '#000000',
        userId,
      };
      const pack = {
        id: 'pack-1',
        name: 'Test Pack',
        description: 'Test Description',
        colorCode: '#000000',
        userId,
      };
      const trip = {
        id: 'trip-1',
        name: 'Test Trip',
        date,
        remarks: 'Test Remarks',
        userId,
      };
      mockPrismaService.item.findUnique.mockResolvedValue(item);
      mockPrismaService.list.findMany.mockResolvedValue([list]);
      mockPrismaService.pack.findMany.mockResolvedValue([pack]);
      mockPrismaService.trip.findMany.mockResolvedValue([trip]);

      const result = await service.getItemDeleteImpact(item.id, userId);

      expect(result).toMatchObject({
        item: { id: 'item-1', name: 'Test Item', description: 'Test Description', weight: 1 },
        lists: [
          {
            id: 'list-1',
            name: 'Test List',
            description: 'Test Description',
            colorCode: '#000000',
          },
        ],
        packs: [
          {
            id: 'pack-1',
            name: 'Test Pack',
            description: 'Test Description',
            colorCode: '#000000',
          },
        ],
        trips: [{ id: 'trip-1', name: 'Test Trip', date, remarks: 'Test Remarks' }],
      });
    });
  });
});
