import { Test, TestingModule } from '@nestjs/testing';

import { ListPack } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { ListPackService } from './list-pack.service';

vi.mock('uuid', () => ({
  v7: () => 'mocked-uuid',
}));

describe('ListPackService', () => {
  let service: ListPackService;
  let prisma: PrismaService;

  const mockPrismaService = {
    listPack: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    list: {
      findUnique: vi.fn(),
    },
    pack: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<ListPack>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListPackService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ListPackService>(ListPackService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('upsertListInPack', () => {
    it('should upsert a list in a pack', async () => {
      const upsertListInPackDto = {
        listId: '123',
        packId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue({ id: '123', userId });
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: '456', userId });

      mockPrismaService.listPack.upsert.mockResolvedValue({
        id: 'mocked-uuid',
        ...upsertListInPackDto,
        userId,
      });

      const result = await service.upsertListInPack(upsertListInPackDto, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id: '123', userId },
      });
      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id: '456', userId },
      });
      expect(mockPrismaService.listPack.upsert).toHaveBeenCalledWith({
        where: { listId_packId: { listId: '123', packId: '456' } },
        create: { id: 'mocked-uuid', ...upsertListInPackDto },
        update: { quantity: 1 },
      });
      expect(result).toEqual({
        id: 'mocked-uuid',
        ...upsertListInPackDto,
        userId,
      });
    });

    it('should throw an error if the list is not found', async () => {
      const upsertListInPackDto = {
        listId: '123',
        packId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue(null);
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: '456', userId });

      await expect(service.upsertListInPack(upsertListInPackDto, userId)).rejects.toThrow(
        'List not found',
      );

      expect(mockPrismaService.listPack.upsert).not.toHaveBeenCalled();
    });

    it('should throw an error if the pack is not found', async () => {
      const upsertListInPackDto = {
        listId: '123',
        packId: '456',
        quantity: 1,
      };
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue({ id: '123', userId });
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.upsertListInPack(upsertListInPackDto, userId)).rejects.toThrow(
        'Pack not found',
      );

      expect(mockPrismaService.listPack.upsert).not.toHaveBeenCalled();
    });
  });

  describe('removeListFromPack', () => {
    it('should remove a list from a pack', async () => {
      const listId = '123';
      const packId = '456';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue({ id: listId, userId });
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: packId, userId });

      mockPrismaService.listPack.delete.mockResolvedValue({
        id: 'mocked-uuid',
        listId,
        packId,
        quantity: 1,
      });

      const result = await service.removeListFromPack(listId, packId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id: listId, userId },
      });
      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id: packId, userId },
      });
      expect(mockPrismaService.listPack.delete).toHaveBeenCalledWith({
        where: { listId_packId: { listId, packId } },
      });
      expect(result).toEqual({
        id: 'mocked-uuid',
        listId,
        packId,
        quantity: 1,
      });
    });

    it('should throw an error if the list is not found', async () => {
      const listId = '123';
      const packId = '456';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue(null);
      mockPrismaService.pack.findUnique.mockResolvedValue({ id: packId, userId });

      await expect(service.removeListFromPack(listId, packId, userId)).rejects.toThrow(
        'List not found',
      );

      expect(mockPrismaService.listPack.delete).not.toHaveBeenCalled();
    });

    it('should throw an error if the pack is not found', async () => {
      const listId = '123';
      const packId = '456';
      const userId = 'user-1';
      mockPrismaService.list.findUnique.mockResolvedValue({ id: listId, userId });
      mockPrismaService.pack.findUnique.mockResolvedValue(null);

      await expect(service.removeListFromPack(listId, packId, userId)).rejects.toThrow(
        'Pack not found',
      );

      expect(mockPrismaService.listPack.delete).not.toHaveBeenCalled();
    });
  });
});
