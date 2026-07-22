import { Test, TestingModule } from '@nestjs/testing';

import { Pack } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { PackService } from './pack.service';

const makeItem = (id: string, weight: number | null = null) => ({
  id,
  name: 'Item',
  description: null,
  weight,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const PACK_INCLUDE = {
  items: { include: { item: true } },
  lists: { include: { list: { include: { items: { include: { item: true } } } } } },
};

describe('PackService', () => {
  let service: PackService;
  let prisma: PrismaService;

  const mockPrismaService = {
    pack: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemPack: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    listPack: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    trip: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<Pack>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PackService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<PackService>(PackService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('getPacks', () => {
    it('should query with items and lists include', async () => {
      mockPrismaService.pack.findMany.mockResolvedValue([]);

      await service.getPacks({ userId: 'user-1' });

      expect(mockPrismaService.pack.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: PACK_INCLUDE,
      });
    });

    it('should return itemCount as sum of direct item quantities when no lists', async () => {
      const now = new Date();
      mockPrismaService.pack.findMany.mockResolvedValue([
        {
          id: 'pack-1',
          name: 'Test Pack',
          description: null,
          colorTheme: null,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1',
          items: [
            { quantity: 2, item: makeItem('i-1') },
            { quantity: 3, item: makeItem('i-2') },
          ],
          lists: [],
        },
      ]);

      const result = await service.getPacks({ userId: 'user-1' });

      expect(result[0]?.itemCount).toBe(5);
    });

    it('should include items from lists in itemCount', async () => {
      const now = new Date();
      mockPrismaService.pack.findMany.mockResolvedValue([
        {
          id: 'pack-1',
          name: 'Test Pack',
          description: null,
          colorTheme: null,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1',
          items: [{ quantity: 5, item: makeItem('i-1') }], // 5 direct
          lists: [
            {
              quantity: 5,
              list: { items: [{ quantity: 5, item: makeItem('i-2') }] }, // 5 lists × 5 items = 25
            },
          ],
        },
      ]);

      const result = await service.getPacks({ userId: 'user-1' });

      expect(result[0]?.itemCount).toBe(30);
    });

    it('should compute totalWeight from direct items and list items', async () => {
      const now = new Date();
      mockPrismaService.pack.findMany.mockResolvedValue([
        {
          id: 'pack-1',
          name: 'Test Pack',
          description: null,
          colorTheme: null,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1',
          items: [{ quantity: 2, item: makeItem('i-1', 500) }], // 2 * 500 = 1000
          lists: [
            {
              quantity: 2,
              list: {
                items: [{ quantity: 3, item: makeItem('i-2', 200) }], // 2 * 3 * 200 = 1200
              },
            },
          ],
        },
      ]);

      const result = await service.getPacks({ userId: 'user-1' });

      expect(result[0]?.totalWeight).toBe(2200);
    });

    it('should treat null item weight as 0 in totalWeight', async () => {
      const now = new Date();
      mockPrismaService.pack.findMany.mockResolvedValue([
        {
          id: 'pack-1',
          name: 'Test Pack',
          description: null,
          colorTheme: null,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1',
          items: [{ quantity: 1, item: makeItem('i-1', null) }],
          lists: [
            {
              quantity: 1,
              list: { items: [{ quantity: 1, item: makeItem('i-2', null) }] },
            },
          ],
        },
      ]);

      const result = await service.getPacks({ userId: 'user-1' });

      expect(result[0]?.totalWeight).toBe(0);
    });
  });

  describe('createPack', () => {
    it('should build correct create data with userId and id', async () => {
      const userId = 'user-1';
      const dto = { name: 'Test Pack', description: 'Test Description', colorTheme: 'slate' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.pack.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: capturedData.id, ...dto, userId });
        },
      );

      await service.createPack(dto as never, userId);

      expect(capturedData).toMatchObject({
        name: 'Test Pack',
        description: 'Test Description',
        colorTheme: 'slate',
        userId: 'user-1',
      });
      expect(capturedData.id).toBeDefined();
      expect(typeof capturedData.id).toBe('string');
    });
  });

  describe('updatePack', () => {
    it('should update a pack', async () => {
      const userId = 'user-1';
      const id = 'pack-1';
      const dto = {
        name: 'Updated Pack',
        description: 'Updated Description',
        colorTheme: 'slate',
      };
      mockPrismaService.pack.findUnique.mockResolvedValue({ id, userId });

      await service.updatePack(id, dto as never, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.pack.update).toHaveBeenCalledWith({
        where: { id, userId },
        data: dto,
      });
    });

    it('should throw an error if the pack is not found', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      const dto = {
        name: 'Updated Pack',
        description: 'Updated Description',
        colorTheme: 'slate',
      };
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.updatePack(id, dto as never, userId)).rejects.toThrow('Pack not found');

      expect(mockPrismaService.pack.update).not.toHaveBeenCalled();
    });
  });

  describe('deletePack', () => {
    it('should run in transaction and delete pack with id and userId', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      mockPrismaService.pack.findUnique.mockResolvedValue({ id, userId });

      await service.deletePack(id, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.pack.delete).toHaveBeenCalledWith({
        where: { id, userId },
      });
    });

    it('should throw an error if the pack is not found', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.deletePack(id, userId)).rejects.toThrow('Pack not found');

      expect(mockPrismaService.pack.delete).not.toHaveBeenCalled();
    });
  });

  describe('clonePack', () => {
    const userId = 'user-1';
    const originalId = 'pack-1';
    const newName = 'Cloned Pack';
    const now = new Date();

    const storedPack = {
      id: originalId,
      name: 'Original Pack',
      description: 'Original Description',
      colorTheme: 'slate',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    it('should create a new pack with a new id and name, excluding timestamps', async () => {
      mockPrismaService.pack.findUnique.mockResolvedValue(storedPack);
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.pack.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ ...args.data });
        },
      );
      mockPrismaService.itemPack.findMany.mockResolvedValue([]);
      mockPrismaService.listPack.findMany.mockResolvedValue([]);

      await service.clonePack(originalId, newName, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
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

    it('should clone items in the pack', async () => {
      const clonedPackId = 'cloned-pack-id';
      mockPrismaService.pack.findUnique.mockResolvedValue(storedPack);
      mockPrismaService.pack.create.mockResolvedValue({ ...storedPack, id: clonedPackId });
      mockPrismaService.itemPack.findMany.mockResolvedValue([
        { id: 'ip-1', quantity: 2, itemId: 'item-1', packId: originalId },
        { id: 'ip-2', quantity: 3, itemId: 'item-2', packId: originalId },
      ]);
      mockPrismaService.listPack.findMany.mockResolvedValue([]);
      let capturedData: Array<Record<string, unknown>> = [];
      mockPrismaService.itemPack.createMany.mockImplementation(
        (args: { data: Array<Record<string, unknown>> }) => {
          capturedData = args.data;
          return Promise.resolve({ count: args.data.length });
        },
      );

      await service.clonePack(originalId, newName, userId);

      expect(mockPrismaService.itemPack.findMany).toHaveBeenCalledWith({
        where: { packId: originalId },
      });
      expect(capturedData).toHaveLength(2);
      expect(capturedData).toContainEqual(
        expect.objectContaining({ quantity: 2, itemId: 'item-1', packId: clonedPackId }),
      );
      expect(capturedData).toContainEqual(
        expect.objectContaining({ quantity: 3, itemId: 'item-2', packId: clonedPackId }),
      );
      for (const entry of capturedData) {
        expect(entry.id).toBeDefined();
        expect(entry.id).not.toBe('ip-1');
        expect(entry.id).not.toBe('ip-2');
      }
    });

    it('should clone lists in the pack', async () => {
      const clonedPackId = 'cloned-pack-id';
      mockPrismaService.pack.findUnique.mockResolvedValue(storedPack);
      mockPrismaService.pack.create.mockResolvedValue({ ...storedPack, id: clonedPackId });
      mockPrismaService.itemPack.findMany.mockResolvedValue([]);
      mockPrismaService.listPack.findMany.mockResolvedValue([
        { id: 'lp-1', quantity: 1, listId: 'list-1', packId: originalId },
        { id: 'lp-2', quantity: 4, listId: 'list-2', packId: originalId },
      ]);
      let capturedData: Array<Record<string, unknown>> = [];
      mockPrismaService.listPack.createMany.mockImplementation(
        (args: { data: Array<Record<string, unknown>> }) => {
          capturedData = args.data;
          return Promise.resolve({ count: args.data.length });
        },
      );

      await service.clonePack(originalId, newName, userId);

      expect(mockPrismaService.listPack.findMany).toHaveBeenCalledWith({
        where: { packId: originalId },
      });
      expect(capturedData).toHaveLength(2);
      expect(capturedData).toContainEqual(
        expect.objectContaining({ quantity: 1, listId: 'list-1', packId: clonedPackId }),
      );
      expect(capturedData).toContainEqual(
        expect.objectContaining({ quantity: 4, listId: 'list-2', packId: clonedPackId }),
      );
      for (const entry of capturedData) {
        expect(entry.id).toBeDefined();
        expect(entry.id).not.toBe('lp-1');
        expect(entry.id).not.toBe('lp-2');
      }
    });

    it('should throw an error if the pack is not found', async () => {
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.clonePack(originalId, newName, userId)).rejects.toThrow(
        'Pack not found',
      );

      expect(mockPrismaService.pack.create).not.toHaveBeenCalled();
      expect(mockPrismaService.itemPack.findMany).not.toHaveBeenCalled();
      expect(mockPrismaService.listPack.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getPackDeleteImpact', () => {
    it('should return the pack and trips', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      mockPrismaService.pack.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.trip.findMany.mockResolvedValue([{ id: 'trip-1', userId }]);

      const result = await service.getPackDeleteImpact(id, userId);

      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { userId, packId: id },
      });

      expect(result).toMatchObject({
        pack: { id },
        trips: [{ id: 'trip-1' }],
      });
    });

    it('should throw an error if the pack is not found', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.getPackDeleteImpact(id, userId)).rejects.toThrow('Pack not found');
    });

    it('should return empty trips if the pack is not in any trips', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      mockPrismaService.pack.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.trip.findMany.mockResolvedValue([]);

      const result = await service.getPackDeleteImpact(id, userId);

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { userId, packId: id },
      });

      expect(result).toMatchObject({
        pack: { id },
        trips: [],
      });
    });
  });

  describe('response mapping', () => {
    it('should map the pack and trips to corresponding response dtos', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      const date = new Date();
      const pack = {
        id,
        name: 'Test Pack',
        description: 'Test Description',
        colorTheme: 'slate',
        userId,
      };
      const trips = [{ id: 'trip-1', name: 'Test Trip', date, remarks: 'Test Remarks', userId }];
      mockPrismaService.pack.findUnique.mockResolvedValue(pack);
      mockPrismaService.trip.findMany.mockResolvedValue(trips);

      const result = await service.getPackDeleteImpact(id, userId);

      expect(result).toMatchObject({
        pack: { id, name: 'Test Pack', description: 'Test Description', colorTheme: 'slate' },
        trips: [{ id: 'trip-1', name: 'Test Trip', date, remarks: 'Test Remarks' }],
      });
    });
  });
});
