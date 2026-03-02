import { Injectable, NotFoundException } from '@nestjs/common';

import { Pack, Prisma, Trip } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

export interface PackDeleteImpact {
  pack: Pack;
  trips: Trip[];
}

@Injectable()
export class PackService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getPacks(where: Prisma.PackWhereInput): Promise<Pack[]> {
    return this.prisma.pack.findMany({ where });
  }

  async getPack(where: Prisma.PackWhereUniqueInput): Promise<Pack> {
    const result = await this.prisma.pack.findUnique({ where });

    if (!result) {
      throw new NotFoundException('Pack not found');
    }

    return result;
  }

  async createPack(pack: CreatePackDto, userId: string): Promise<Pack> {
    const uuid = uuidv7();

    const data: Prisma.PackCreateInput = {
      ...pack,
      id: uuid,
      userId: userId,
    };

    return this.prisma.pack.create({ data });
  }

  async updatePack(id: string, pack: UpdatePackDto, userId: string): Promise<Pack> {
    return this.prisma.$transaction(async (tx) => {
      const storedPack = await tx.pack.findUnique({ where: { id, userId } });
      if (!storedPack) {
        throw new NotFoundException('Pack not found');
      }

      return tx.pack.update({ where: { id, userId }, data: pack });
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

  async getPackDeleteImpact(id: string, userId: string): Promise<PackDeleteImpact> {
    const pack = await this.prisma.pack.findUnique({ where: { id, userId } });
    if (!pack) {
      throw new NotFoundException('Pack not found');
    }

    const trips = await this.prisma.trip.findMany({ where: { packId: id } });

    return { pack, trips };
  }
}
