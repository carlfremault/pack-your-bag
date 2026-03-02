import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, Trip } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getTrips(where: Prisma.TripWhereInput): Promise<Trip[]> {
    return this.prisma.trip.findMany({ where });
  }

  async getTrip(where: Prisma.TripWhereUniqueInput): Promise<Trip> {
    const result = await this.prisma.trip.findUnique({ where });

    if (!result) {
      throw new NotFoundException('Trip not found');
    }

    return result;
  }

  async createTrip(trip: CreateTripDto, userId: string): Promise<Trip> {
    const uuid = uuidv7();

    const { packId, ...rest } = trip;

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

    return this.prisma.trip.create({ data });
  }

  async updateTrip(id: string, trip: UpdateTripDto, userId: string): Promise<Trip> {
    return this.prisma.$transaction(async (tx) => {
      const storedTrip = await tx.trip.findUnique({ where: { id, userId } });
      if (!storedTrip) {
        throw new NotFoundException('Trip not found');
      }

      const { packId, ...rest } = trip;

      const data: Prisma.TripUpdateInput = {
        ...rest,
        ...(packId !== undefined && {
          pack: packId ? { connect: { id: packId } } : { disconnect: true },
        }),
      };

      return tx.trip.update({ where: { id, userId }, data });
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
}
