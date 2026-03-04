import { Test, TestingModule } from '@nestjs/testing';

import { Trip } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { TripService } from './trip.service';

describe('TripService', () => {
  let service: TripService;
  let prisma: PrismaService;

  const mockPrismaService = {
    trip: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<Trip>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TripService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<TripService>(TripService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('createTrip', () => {
    it('should build correct create data with userId and id, without pack when packId missing', async () => {
      const userId = 'user-1';
      const date = new Date();
      const dto = { name: 'Trip 1', date, remarks: 'Remarks' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.trip.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: capturedData.id, ...dto, userId });
        },
      );

      await service.createTrip(dto as never, userId);

      expect(capturedData).toMatchObject({
        name: 'Trip 1',
        date,
        remarks: 'Remarks',
        userId: 'user-1',
      });
      expect(capturedData.id).toBeDefined();
      expect(typeof capturedData.id).toBe('string');
      expect(capturedData.pack).toBeUndefined();
    });

    it('should connect pack when packId is provided', async () => {
      const userId = 'user-1';
      const dto = { name: 'Trip 1', packId: 'pack-1' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.trip.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: capturedData.id, ...dto, userId });
        },
      );

      await service.createTrip(dto as never, userId);
      expect(capturedData.pack).toEqual({ connect: { id: 'pack-1' } });
    });
  });

  describe('updateTrip', () => {
    it('should build correct update data without pack when packId missing', async () => {
      const id = 'trip-1';
      const userId = 'user-1';
      const dto = { name: 'Updated name' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.trip.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.trip.update.mockImplementation(
        (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id, ...dto });
        },
      );

      await service.updateTrip(id, dto as never, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.trip.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(capturedData).toMatchObject({ name: 'Updated name' });
      expect(capturedData.pack).toBeUndefined();
    });

    it('should connect pack when packId is provided', async () => {
      const id = 'trip-1';
      const userId = 'user-1';
      const dto = { name: 'Updated name', packId: 'pack-1' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.trip.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.trip.update.mockImplementation(
        (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id, ...dto });
        },
      );

      await service.updateTrip(id, dto as never, userId);

      expect(capturedData.pack).toEqual({ connect: { id: 'pack-1' } });
    });

    it('should disconnect pack when packId is null', async () => {
      const id = 'trip-1';
      const userId = 'user-1';
      const dto = { name: 'Updated name', packId: null };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.trip.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.trip.update.mockImplementation(
        (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id, ...dto });
        },
      );

      await service.updateTrip(id, dto as never, userId);

      expect(capturedData.pack).toEqual({ disconnect: true });
    });

    it('should throw if trip is not found for user', async () => {
      const id = 'trip-1';
      const userId = 'user-1';
      const dto = { name: 'Updated name' };
      mockPrismaService.trip.findUnique.mockResolvedValue(null);

      await expect(service.updateTrip(id, dto as never, userId)).rejects.toThrow('Trip not found');

      expect(mockPrismaService.trip.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTrip', () => {
    it('should run in transaction and delete trip with id and userId', async () => {
      const id = 'trip-1';
      const userId = 'user-1';
      mockPrismaService.trip.findUnique.mockResolvedValue({ id, userId });

      await service.deleteTrip(id, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.trip.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.trip.delete).toHaveBeenCalledWith({
        where: { id, userId },
      });
    });

    it('should throw if trip is not found for user', async () => {
      const id = 'trip-1';
      const userId = 'user-1';
      mockPrismaService.trip.findUnique.mockResolvedValue(null);

      await expect(service.deleteTrip(id, userId)).rejects.toThrow('Trip not found');

      expect(mockPrismaService.trip.delete).not.toHaveBeenCalled();
    });
  });

  describe('response mapping', () => {
    it('should map the trip data to corresponding response dto', async () => {
      const id = 'trip-1';
      const userId = 'user-1';
      const testDate = new Date();
      const trip = { id, name: 'Test Trip', date: testDate, remarks: 'Test Remarks', userId };

      mockPrismaService.trip.findUnique.mockResolvedValue(trip);

      const result = await service.getTrip({ id, userId });

      expect(result).toMatchObject({
        id,
        name: 'Test Trip',
        date: testDate,
        remarks: 'Test Remarks',
        pack: undefined,
      });
    });
  });
});
