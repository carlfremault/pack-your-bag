import { Test, TestingModule } from '@nestjs/testing';

import { List, Pack, Trip } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { ListService } from './list.service';

const makeItem = (id: string, weight: number | null = null) => ({
  id,
  name: 'Item',
  description: null,
  weight,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('ListService', () => {
  let service: ListService;
  let prisma: PrismaService;

  const mockPrismaService = {
    list: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    pack: {
      findMany: vi.fn(),
    },
    trip: {
      findMany: vi.fn(),
    },
    itemList: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    listPack: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<List>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ListService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ListService>(ListService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('getLists', () => {
    it('should query with items include', async () => {
      mockPrismaService.list.findMany.mockResolvedValue([]);

      await service.getLists({ userId: 'user-1' });

      expect(mockPrismaService.list.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { items: { include: { item: true } } },
      });
    });

    it('should return itemCount as sum of item quantities', async () => {
      const now = new Date();
      mockPrismaService.list.findMany.mockResolvedValue([
        {
          id: 'list-1',
          name: 'Test List',
          description: null,
          colorTheme: null,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1',
          items: [
            { quantity: 2, item: makeItem('i-1') },
            { quantity: 3, item: makeItem('i-2') },
          ],
        },
      ]);

      const result = await service.getLists({ userId: 'user-1' });

      expect(result[0]?.itemCount).toBe(5);
    });

    it('should return totalWeight as sum of quantity times item weight', async () => {
      const now = new Date();
      mockPrismaService.list.findMany.mockResolvedValue([
        {
          id: 'list-1',
          name: 'Test List',
          description: null,
          colorTheme: null,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1',
          items: [
            { quantity: 2, item: makeItem('i-1', 1000) },
            { quantity: 3, item: makeItem('i-2', 500) },
          ],
        },
      ]);

      const result = await service.getLists({ userId: 'user-1' });

      expect(result[0]?.totalWeight).toBe(3500); // 2*1000 + 3*500
    });

    it('should treat null item weight as 0 in totalWeight', async () => {
      const now = new Date();
      mockPrismaService.list.findMany.mockResolvedValue([
        {
          id: 'list-1',
          name: 'Test List',
          description: null,
          colorTheme: null,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1',
          items: [{ quantity: 2, item: makeItem('i-1', null) }],
        },
      ]);

      const result = await service.getLists({ userId: 'user-1' });

      expect(result[0]?.totalWeight).toBe(0);
    });
  });

  describe('createList', () => {
    it('should build correct create data with userId and id', async () => {
      const userId = 'user-1';
      const dto = { name: 'Test List', description: 'Test Description', colorTheme: 'slate' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.list.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: capturedData.id, ...dto, userId });
        },
      );

      await service.createList(dto as never, userId);

      expect(capturedData).toMatchObject({
        name: 'Test List',
        description: 'Test Description',
        colorTheme: 'slate',
      });
      expect(capturedData.id).toBeDefined();
      expect(typeof capturedData.id).toBe('string');
    });
  });

  describe('updateList', () => {
    it('should update a list', async () => {
      const userId = 'user-1';
      const id = 'list-1';
      const dto = {
        name: 'Updated List',
        description: 'Updated Description',
        colorTheme: 'slate',
      };
      mockPrismaService.list.findUnique.mockResolvedValue({ id, userId });

      await service.updateList(id, dto as never, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.list.update).toHaveBeenCalledWith({
        where: { id, userId },
        data: dto,
      });
    });

    it('should throw an error if the list is not found', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      const dto = {
        name: 'Updated List',
        description: 'Updated Description',
        colorTheme: 'slate',
      };
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.updateList(id, dto as never, userId)).rejects.toThrow('List not found');

      expect(mockPrismaService.list.update).not.toHaveBeenCalled();
    });
  });

  describe('handleListDeletion', () => {
    it('should run in transaction and delete listPack, then list with id and userId', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue({ id, userId });

      await service.handleListDeletion(id, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.listPack.deleteMany).toHaveBeenCalledWith({ where: { listId: id } });
      expect(mockPrismaService.list.delete).toHaveBeenCalledWith({ where: { id, userId } });
    });

    it('should throw an error if the list is not found', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.handleListDeletion(id, userId)).rejects.toThrow('List not found');

      expect(mockPrismaService.listPack.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.list.delete).not.toHaveBeenCalled();
    });
  });

  describe('cloneList', () => {
    const userId = 'user-1';
    const originalId = 'list-1';
    const newName = 'Cloned List';
    const now = new Date();

    const storedList = {
      id: originalId,
      name: 'Original List',
      description: 'Original Description',
      colorTheme: 'slate',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    it('should create a new list with a new id and name, excluding timestamps', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(storedList);
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.list.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ ...args.data });
        },
      );
      mockPrismaService.itemList.findMany.mockResolvedValue([]);

      await service.cloneList(originalId, newName, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id: originalId, userId },
      });
      expect(capturedData.name).toBe(newName);
      expect(capturedData.description).toBe('Original Description');
      expect(capturedData.colorTheme).toBe('slate');
      expect(capturedData.userId).toBe(userId);
      expect(capturedData.id).toBeDefined();
      expect(capturedData.id).not.toBe(originalId);
      expect(capturedData.createdAt).toBeUndefined();
      expect(capturedData.updatedAt).toBeUndefined();
    });

    it('should clone items in the list', async () => {
      const clonedListId = 'cloned-list-id';
      mockPrismaService.list.findUnique.mockResolvedValue(storedList);
      mockPrismaService.list.create.mockResolvedValue({ ...storedList, id: clonedListId });
      mockPrismaService.itemList.findMany.mockResolvedValue([
        { id: 'il-1', quantity: 2, itemId: 'item-1', listId: originalId },
        { id: 'il-2', quantity: 3, itemId: 'item-2', listId: originalId },
      ]);
      let capturedData: Array<Record<string, unknown>> = [];
      mockPrismaService.itemList.createMany.mockImplementation(
        (args: { data: Array<Record<string, unknown>> }) => {
          capturedData = args.data;
          return Promise.resolve({ count: args.data.length });
        },
      );

      await service.cloneList(originalId, newName, userId);

      expect(mockPrismaService.itemList.findMany).toHaveBeenCalledWith({
        where: { listId: originalId },
      });
      expect(capturedData).toHaveLength(2);
      expect(capturedData).toContainEqual(
        expect.objectContaining({ quantity: 2, itemId: 'item-1', listId: clonedListId }),
      );
      expect(capturedData).toContainEqual(
        expect.objectContaining({ quantity: 3, itemId: 'item-2', listId: clonedListId }),
      );
      for (const entry of capturedData) {
        expect(entry.id).toBeDefined();
        expect(entry.id).not.toBe('il-1');
        expect(entry.id).not.toBe('il-2');
      }
    });

    it('should throw an error if the list is not found', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.cloneList(originalId, newName, userId)).rejects.toThrow(
        'List not found',
      );

      expect(mockPrismaService.list.create).not.toHaveBeenCalled();
      expect(mockPrismaService.itemList.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getListDeleteImpact', () => {
    it('should return the list, packs, and trips', async () => {
      const userId = 'user-1';
      const id = 'list-1';
      const now = new Date();
      const tripDate = new Date();

      const list = {
        id,
        name: 'Test List',
        description: 'Test Description',
        colorTheme: 'slate',
        createdAt: now,
        updatedAt: now,
        userId,
      };
      const pack = {
        id: 'pack-1',
        name: 'Test Pack',
        description: 'Test Description',
        colorTheme: 'slate',
        userId,
      };
      const trip = {
        id: 'trip-1',
        name: 'Test Trip',
        date: tripDate,
        remarks: 'Test Remarks',
        userId,
      };
      mockPrismaService.list.findUnique.mockResolvedValue(list);
      mockPrismaService.pack.findMany.mockResolvedValue([pack]);
      mockPrismaService.trip.findMany.mockResolvedValue([trip]);

      const result = await service.getListDeleteImpact(id, userId);

      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.pack.findMany).toHaveBeenCalledWith({
        where: { userId, lists: { some: { listId: id } } },
      });
      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { userId, packId: { in: ['pack-1'] } },
      });

      expect(result).toMatchObject({
        list: {
          id,
          name: 'Test List',
          description: 'Test Description',
          colorTheme: 'slate',
        },
        packs: [
          {
            id: 'pack-1',
            name: 'Test Pack',
            description: 'Test Description',
            colorTheme: 'slate',
            items: undefined,
            lists: undefined,
          },
        ],
        trips: [
          {
            id: 'trip-1',
            name: 'Test Trip',
            date: tripDate,
            remarks: 'Test Remarks',
            pack: undefined,
          },
        ],
      });
    });

    it('should throw an error if the list is not found', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.getListDeleteImpact(id, userId)).rejects.toThrow('List not found');
    });

    it('should not search for trips if the list is not in any packs', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.pack.findMany.mockResolvedValue([]);

      const result = await service.getListDeleteImpact(id, userId);

      expect(mockPrismaService.trip.findMany).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        list: { id },
        packs: [],
        trips: [],
      });
    });

    it('should pass all pack ids to trip find when list is in multiple packs', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      const pack1 = { id: 'p1' } as Pack;
      const pack2 = { id: 'p2' } as Pack;
      const trip1 = { id: 't1' } as Trip;
      mockPrismaService.list.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.pack.findMany.mockResolvedValue([pack1, pack2]);
      mockPrismaService.trip.findMany.mockResolvedValue([trip1]);

      const result = await service.getListDeleteImpact(id, userId);

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { userId, packId: { in: ['p1', 'p2'] } },
      });
      expect(result.packs).toHaveLength(2);
      expect(result.trips).toEqual([trip1]);
    });

    it('should return empty trips when list is in packs but those packs have no trips', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      const pack1 = { id: 'p1' } as Pack;
      mockPrismaService.list.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.pack.findMany.mockResolvedValue([pack1]);
      mockPrismaService.trip.findMany.mockResolvedValue([]);

      const result = await service.getListDeleteImpact(id, userId);

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { userId, packId: { in: ['p1'] } },
      });
      expect(result.trips).toEqual([]);
      expect(result.packs).toEqual([pack1]);
    });
  });

  describe('response mapping', () => {
    it('should map the list, packs, and trips to corresponding response dtos', async () => {
      const userId = 'user-1';
      const listId = 'list-1';
      const date = new Date();
      const list = {
        id: listId,
        name: 'Test List',
        description: 'Test Description',
        colorTheme: 'slate',
        userId,
      };
      const packs = [
        {
          id: 'pack-1',
          name: 'Test Pack',
          description: 'Test Description',
          colorTheme: 'slate',
          userId,
        },
      ];
      const trips = [{ id: 'trip-1', name: 'Test Trip', date, remarks: 'Test Remarks', userId }];
      mockPrismaService.list.findUnique.mockResolvedValue(list);
      mockPrismaService.pack.findMany.mockResolvedValue(packs);
      mockPrismaService.trip.findMany.mockResolvedValue(trips);

      const result = await service.getListDeleteImpact(listId, userId);

      expect(result).toMatchObject({
        list: {
          id: listId,
          name: 'Test List',
          description: 'Test Description',
          colorTheme: 'slate',
        },
        packs: [
          {
            id: 'pack-1',
            name: 'Test Pack',
            description: 'Test Description',
            colorTheme: 'slate',
            items: undefined,
            lists: undefined,
          },
        ],
        trips: [
          {
            id: 'trip-1',
            name: 'Test Trip',
            date,
            remarks: 'Test Remarks',
            pack: undefined,
          },
        ],
      });
    });
  });
});
