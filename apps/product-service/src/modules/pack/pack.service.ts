import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@repo/db';

import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';

import { computeItemCount, computeTotalWeight } from '@/common/helpers/pack-summary.helpers';
import { PrismaService } from '@/prisma/prisma.service';

import { TripResponseDto } from '../trip/dto/trip-response.dto';

import { CreateAssistantPackDto } from './dto/assistant-pack.dto';
import { CreatePackDto } from './dto/create-pack.dto';
import { PackDeleteImpactDto } from './dto/pack-delete-impact.dto';
import {
  PackBaseResponseDto,
  PackResponseDto,
  PackSummaryResponseDto,
} from './dto/pack-response.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

@Injectable()
export class PackService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getPacks(where: Prisma.PackWhereInput): Promise<PackSummaryResponseDto[]> {
    const results = await this.prisma.pack.findMany({
      where,
      include: {
        items: { include: { item: true } },
        lists: { include: { list: { include: { items: { include: { item: true } } } } } },
      },
    });

    const shaped = results.map((pack) => ({
      ...pack,
      itemCount: computeItemCount(pack),
      totalWeight: computeTotalWeight(pack),
    }));

    return plainToInstance(PackSummaryResponseDto, shaped);
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

  async createAssistantPack(
    assistantPack: CreateAssistantPackDto,
    userId: string,
  ): Promise<PackResponseDto> {
    const uuid = uuidv7();

    return this.prisma.$transaction(async (tx) => {
      const packName = assistantPack.packName;

      const categoryNames = Array.from(
        new Set(
          assistantPack.items.filter((item) => item.category).map((item) => item.category.name),
        ),
      );

      const existingCategories = categoryNames.length
        ? await tx.category.findMany({
            where: { userId, name: { in: categoryNames } },
          })
        : [];

      const categoryMap = new Map<string, { id: string; name: string; colorTheme: string }>();
      for (const existing of existingCategories) {
        categoryMap.set(existing.name, existing);
      }

      const categoriesToCreate: { id: string; name: string; colorTheme: string }[] = [];
      for (const item of assistantPack.items) {
        if (item.category && !categoryMap.has(item.category.name)) {
          const newCategory = { id: uuidv7(), ...item.category };
          categoryMap.set(newCategory.name, newCategory);
          categoriesToCreate.push(newCategory);
        }
      }

      if (categoriesToCreate.length > 0) {
        await tx.category.createMany({
          data: categoriesToCreate.map((category) => ({
            ...category,
            userId,
          })),
        });
      }

      const preparedItems = assistantPack.items.map((sourceItem) => ({
        id: uuidv7(),
        name: sourceItem.name,
        description: sourceItem.note,
        userId,
        categoryId: sourceItem.category
          ? (categoryMap.get(sourceItem.category.name)?.id ?? null)
          : null,
        quantity: sourceItem.quantity ?? 0,
      }));

      await tx.item.createManyAndReturn({
        data: preparedItems.map(({ quantity: _quantity, ...item }) => item),
        include: { category: true },
      });

      const data: Prisma.PackCreateInput = {
        name: packName,
        id: uuid,
        userId: userId,
      };

      const result = await tx.pack.create({ data });

      await tx.itemPack.createMany({
        data: preparedItems
          .map((item) => ({
            id: uuidv7(),
            packId: data.id,
            itemId: item.id,
            quantity: item.quantity,
          }))
          .filter((item) => item.quantity > 0),
      });

      return plainToInstance(PackResponseDto, result);
    });
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

  async clonePack(id: string, newName: string, userId: string): Promise<PackResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const storedPack = await tx.pack.findUnique({ where: { id, userId } });
      if (!storedPack) {
        throw new NotFoundException('Pack not found');
      }

      const { id: _id, name: _name, createdAt: _ca, updatedAt: _ua, ...packData } = storedPack;

      const result = await tx.pack.create({
        data: {
          ...packData,
          id: uuidv7(),
          name: newName,
          userId: userId,
        },
      });

      const itemsInPack = await tx.itemPack.findMany({ where: { packId: id } });
      await tx.itemPack.createMany({
        data: itemsInPack.map((itemPack) => ({
          ...itemPack,
          id: uuidv7(),
          packId: result.id,
        })),
      });

      const listsInPack = await tx.listPack.findMany({ where: { packId: id } });
      await tx.listPack.createMany({
        data: listsInPack.map((listPack) => ({
          ...listPack,
          id: uuidv7(),
          packId: result.id,
        })),
      });

      return plainToInstance(PackResponseDto, result);
    });
  }

  // ============================================
  // PACK MANAGEMENT
  // ============================================

  async getPackDeleteImpact(id: string, userId: string): Promise<PackDeleteImpactDto> {
    const pack = await this.prisma.pack.findUnique({
      where: { id, userId },
    });
    if (!pack) {
      throw new NotFoundException('Pack not found');
    }

    const trips = await this.prisma.trip.findMany({ where: { userId, packId: id } });

    return {
      pack: plainToInstance(PackBaseResponseDto, pack),
      trips: plainToInstance(TripResponseDto, trips),
    };
  }
}
