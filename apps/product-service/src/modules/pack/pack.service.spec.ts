import { Test, TestingModule } from '@nestjs/testing';

import { Pack } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { PackService } from './pack.service';

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

  describe('getPackDeleteImpact', () => {
    it('should return the pack and trips', async () => {
      const id = 'pack-1';
      const userId = 'user-1';
      mockPrismaService.pack.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.trip.findMany.mockResolvedValue([{ id: 'trip-1', userId }]);

      const result = await service.getPackDeleteImpact(id, userId);

      expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
        include: {
          _count: {
            select: { items: true, lists: true },
          },
        },
      });
      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith({
        where: { packId: id },
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
        where: { packId: id },
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
