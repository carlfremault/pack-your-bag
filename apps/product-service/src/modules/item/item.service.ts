import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, Trip } from '@repo/db';

import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';

import { ItemResponseDto } from '@/common/dto/item-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { ListResponseDto } from '../list/dto/list-response.dto';
import { PackResponseDto } from '../pack/dto/pack-response.dto';
import { TripResponseDto } from '../trip/dto/trip-response.dto';

import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

export interface ItemDeleteImpact {
  item: ItemResponseDto;
  lists: ListResponseDto[];
  packs: PackResponseDto[];
  trips: TripResponseDto[];
}

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getItems(where: Prisma.ItemWhereInput): Promise<ItemResponseDto[]> {
    const result = await this.prisma.item.findMany({
      where,
      include: { category: true },
    });

    return plainToInstance(ItemResponseDto, result);
  }

  async getItem(where: Prisma.ItemWhereUniqueInput): Promise<ItemResponseDto> {
    const result = await this.prisma.item.findUnique({
      where,
      include: { category: true },
    });

    if (!result) {
      throw new NotFoundException('Item not found');
    }

    return plainToInstance(ItemResponseDto, result);
  }

  async createItem(item: CreateItemDto, userId: string): Promise<ItemResponseDto> {
    const uuid = uuidv7();
    const { categoryId, ...rest } = item;

    const data: Prisma.ItemCreateInput = {
      ...rest,
      id: uuid,
      userId: userId,
      ...(categoryId && {
        category: {
          connect: { id: categoryId },
        },
      }),
    };

    const result = await this.prisma.item.create({
      data,
      include: { category: true },
    });

    return plainToInstance(ItemResponseDto, result);
  }

  async updateItem(id: string, item: UpdateItemDto, userId: string): Promise<ItemResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const storedItem = await tx.item.findUnique({ where: { id, userId } });
      if (!storedItem) {
        throw new NotFoundException('Item not found');
      }

      const { categoryId, ...rest } = item;

      const data: Prisma.ItemUpdateInput = {
        ...rest,
        ...(categoryId !== undefined && {
          category: categoryId ? { connect: { id: categoryId } } : { disconnect: true },
        }),
      };
      const result = await tx.item.update({
        where: { id, userId },
        data,
        include: { category: true },
      });

      return plainToInstance(ItemResponseDto, result);
    });
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  async handleItemDeletion(id: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id, userId } });
      if (!item) {
        throw new NotFoundException('Item not found');
      }

      // Both ItemList and ItemPack use Restrict on item deletion, so records must be manually removed first.
      await Promise.all([
        tx.itemList.deleteMany({ where: { itemId: id } }),
        tx.itemPack.deleteMany({ where: { itemId: id } }),
      ]);

      await tx.item.delete({ where: { id, userId } });
    });
  }

  async getItemDeleteImpact(id: string, userId: string): Promise<ItemDeleteImpact> {
    const item = await this.prisma.item.findUnique({ where: { id, userId } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const [lists, packs] = await Promise.all([
      this.prisma.list.findMany({
        where: {
          items: {
            some: { itemId: id },
          },
        },
      }),
      this.prisma.pack.findMany({
        where: {
          items: {
            some: { itemId: id },
          },
        },
      }),
    ]);

    let trips: Trip[] = [];
    const packIds = packs.map((pack) => pack.id);
    if (packIds.length > 0) {
      trips = await this.prisma.trip.findMany({
        where: {
          packId: { in: packIds },
        },
      });
    }

    return {
      item: plainToInstance(ItemResponseDto, item),
      lists: plainToInstance(ListResponseDto, lists),
      packs: plainToInstance(PackResponseDto, packs),
      trips: plainToInstance(TripResponseDto, trips),
    };
  }
}
