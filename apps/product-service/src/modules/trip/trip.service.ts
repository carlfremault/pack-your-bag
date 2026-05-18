import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@repo/db';

import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';

import { computeItemCount, computeTotalWeight } from '@/common/helpers/pack-summary.helpers';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto, TripSummaryResponseDto } from './dto/trip-response.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getTrips(where: Prisma.TripWhereInput): Promise<TripSummaryResponseDto[]> {
    const results = await this.prisma.trip.findMany({
      where,
      include: {
        pack: {
          include: {
            items: { include: { item: true } },
            lists: { include: { list: { include: { items: { include: { item: true } } } } } },
          },
        },
        tripItemStatuses: true,
      },
    });

    const shaped = results.map((trip) => ({
      ...trip,
      packedItemCount: trip.tripItemStatuses.reduce((sum, s) => sum + s.packedQuantity, 0),
      pack: trip.pack
        ? {
            ...trip.pack,
            itemCount: computeItemCount(trip.pack),
            totalWeight: computeTotalWeight(trip.pack),
          }
        : null,
    }));

    return plainToInstance(TripSummaryResponseDto, shaped);
  }

  async getTrip(where: Prisma.TripWhereUniqueInput): Promise<TripResponseDto> {
    const result = await this.prisma.trip.findUnique({
      where,
      include: {
        pack: {
          include: {
            items: { include: { item: { include: { category: true } } } },
            lists: {
              include: {
                list: {
                  include: { items: { include: { item: { include: { category: true } } } } },
                },
              },
            },
          },
        },
        tripItemStatuses: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Trip not found');
    }

    if (result.pack) {
      const statusMap = new Map(result.tripItemStatuses.map((s) => [s.itemId, s.packedQuantity]));
      for (const ip of result.pack.items) {
        (ip as Record<string, unknown>).packedQuantity = statusMap.get(ip.itemId) ?? 0;
      }
      for (const lp of result.pack.lists) {
        for (const il of lp.list.items) {
          (il as Record<string, unknown>).packedQuantity = statusMap.get(il.itemId) ?? 0;
        }
      }
    }

    return plainToInstance(TripResponseDto, result);
  }

  async createTrip(trip: CreateTripDto, userId: string): Promise<TripResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const uuid = uuidv7();
      const { packId, ...rest } = trip;

      if (packId) {
        const pack = await tx.pack.findUnique({ where: { id: packId, userId } });
        if (!pack) {
          throw new NotFoundException('Pack not found');
        }
      }

      const data: Prisma.TripCreateInput = {
        ...rest,
        id: uuid,
        userId: userId,
        ...(packId && {
          pack: {
            connect: { id: packId },
          },
        }),
      };

      const result = await tx.trip.create({ data, include: { pack: true } });

      return plainToInstance(TripResponseDto, result);
    });
  }

  async updateTrip(id: string, trip: UpdateTripDto, userId: string): Promise<TripResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const storedTrip = await tx.trip.findUnique({ where: { id, userId } });
      if (!storedTrip) {
        throw new NotFoundException('Trip not found');
      }

      const { packId, ...rest } = trip;

      if (packId) {
        const pack = await tx.pack.findUnique({ where: { id: packId, userId } });
        if (!pack) {
          throw new NotFoundException('Pack not found');
        }
      }

      const data: Prisma.TripUpdateInput = {
        ...rest,
        ...(packId !== undefined && {
          pack: packId ? { connect: { id: packId } } : { disconnect: true },
        }),
      };

      const result = await tx.trip.update({ where: { id, userId }, data, include: { pack: true } });

      return plainToInstance(TripResponseDto, result);
    });
  }

  async deleteTrip(id: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const storedTrip = await tx.trip.findUnique({ where: { id, userId } });
      if (!storedTrip) {
        throw new NotFoundException('Trip not found');
      }

      await tx.trip.delete({ where: { id, userId } });
    });
  }

  async setTripItemStatus(
    tripId: string,
    itemId: string,
    userId: string,
    packedQuantity: number,
  ): Promise<void> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId, userId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (packedQuantity === 0) {
      await this.prisma.tripItemStatus.deleteMany({ where: { tripId, itemId } });
    } else {
      await this.prisma.tripItemStatus.upsert({
        where: { tripId_itemId: { tripId, itemId } },
        create: { id: uuidv7(), tripId, itemId, packedQuantity },
        update: { packedQuantity },
      });
    }
  }
}
