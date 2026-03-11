import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@repo/db';

import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getTrips(where: Prisma.TripWhereInput): Promise<TripResponseDto[]> {
    const result = await this.prisma.trip.findMany({ where, include: { pack: true } });
    return plainToInstance(TripResponseDto, result);
  }

  async getTrip(where: Prisma.TripWhereUniqueInput): Promise<TripResponseDto> {
    const result = await this.prisma.trip.findUnique({ where, include: { pack: true } });

    if (!result) {
      throw new NotFoundException('Trip not found');
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
}
