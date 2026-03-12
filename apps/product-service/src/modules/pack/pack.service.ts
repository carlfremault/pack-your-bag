import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@repo/db';

import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { TripResponseDto } from '../trip/dto/trip-response.dto';

import { CreatePackDto } from './dto/create-pack.dto';
import { PackDeleteImpactDto } from './dto/pack-delete-impact.dto';
import { PackResponseDto, PackSummaryResponseDto } from './dto/pack-response.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

@Injectable()
export class PackService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getPacks(where: Prisma.PackWhereInput): Promise<PackSummaryResponseDto[]> {
    const result = await this.prisma.pack.findMany({
      where,
      include: {
        _count: {
          select: { items: true, lists: true },
        },
      },
    });

    return plainToInstance(PackSummaryResponseDto, result);
  }

  async getPack(where: Prisma.PackWhereUniqueInput): Promise<PackResponseDto> {
    const result = await this.prisma.pack.findUnique({
      where,
      include: {
        items: { include: { item: { include: { category: true } } } },
        lists: {
          include: {
            list: { include: { items: { include: { item: { include: { category: true } } } } } },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Pack not found');
    }

    return plainToInstance(PackResponseDto, result);
  }

  async createPack(pack: CreatePackDto, userId: string): Promise<PackResponseDto> {
    const uuid = uuidv7();

    const data: Prisma.PackCreateInput = {
      ...pack,
      id: uuid,
      userId: userId,
    };

    const result = await this.prisma.pack.create({ data });

    return plainToInstance(PackResponseDto, result);
  }

  async updatePack(id: string, pack: UpdatePackDto, userId: string): Promise<PackResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const storedPack = await tx.pack.findUnique({ where: { id, userId } });
      if (!storedPack) {
        throw new NotFoundException('Pack not found');
      }

      const result = await tx.pack.update({ where: { id, userId }, data: pack });

      return plainToInstance(PackResponseDto, result);
    });
  }

  async deletePack(id: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const pack = await tx.pack.findUnique({ where: { id, userId } });
      if (!pack) {
        throw new NotFoundException('Pack not found');
      }

      // ItemPack and ListPack use Cascade, so handled automatically by the DB.
      // Trip uses SetNull, so handled automatically by the DB.
      await tx.pack.delete({ where: { id, userId } });
    });
  }

  // ============================================
  // PACK MANAGEMENT
  // ============================================

  async getPackDeleteImpact(id: string, userId: string): Promise<PackDeleteImpactDto> {
    const pack = await this.prisma.pack.findUnique({
      where: { id, userId },
      include: {
        _count: {
          select: { items: true, lists: true },
        },
      },
    });
    if (!pack) {
      throw new NotFoundException('Pack not found');
    }

    const trips = await this.prisma.trip.findMany({ where: { packId: id } });

    return {
      pack: plainToInstance(PackSummaryResponseDto, pack),
      trips: plainToInstance(TripResponseDto, trips),
    };
  }
}
