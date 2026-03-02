import { Test, TestingModule } from '@nestjs/testing';

import { List, Pack, Trip } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { ListService } from './list.service';

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

  describe('createList', () => {
    it('should build correct create data with userId and id', async () => {
      const userId = 'user-1';
      const dto = { name: 'Test List', description: 'Test Description', colorCode: '#000000' };
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
        colorCode: '#000000',
        userId: 'user-1',
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
        colorCode: '#000000',
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
        colorCode: '#000000',
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

  describe('getListDeleteImpact', () => {
    it('should return the list, packs, and trips', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.pack.findMany.mockResolvedValue([{ id: '123' } as Pack]);
      mockPrismaService.trip.findMany.mockResolvedValue([{ id: '123' } as Trip]);

      const result = await service.getListDeleteImpact(id, userId);

      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.pack.findMany).toHaveBeenCalledWith({
        where: { lists: { some: { listId: id } } },
      });
      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { packId: { in: ['123'] } },
      });

      expect(result).toEqual({
        list: { id, userId },
        packs: [{ id: '123' } as Pack],
        trips: [{ id: '123' } as Trip],
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
      expect(result).toEqual({
        list: { id, userId },
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
        where: { packId: { in: ['p1', 'p2'] } },
      });
      expect(result.packs).toHaveLength(2);
      expect(result.trips).toEqual([trip1]);
    });

    it('should return empty Trips when list is in packs but those packs have no trips', async () => {
      const id = 'list-1';
      const userId = 'user-1';
      const pack1 = { id: 'p1' } as Pack;
      mockPrismaService.list.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.pack.findMany.mockResolvedValue([pack1]);
      mockPrismaService.trip.findMany.mockResolvedValue([]);

      const result = await service.getListDeleteImpact(id, userId);

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { packId: { in: ['p1'] } },
      });
      expect(result.trips).toEqual([]);
      expect(result.packs).toEqual([pack1]);
    });
  });
});
