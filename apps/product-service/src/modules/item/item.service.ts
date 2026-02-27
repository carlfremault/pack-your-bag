import { Injectable, NotFoundException } from '@nestjs/common';

import { Item, List, Pack, Prisma, Trip } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

export interface ItemDeleteImpact {
  item: Item;
  lists: List[];
  packs: Pack[];
  trips: Trip[];
}

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getItems(where: Prisma.ItemWhereInput): Promise<Item[]> {
    return this.prisma.item.findMany({
      where,
    });
  }

  async getItem(where: Prisma.ItemWhereUniqueInput): Promise<Item | null> {
    return this.prisma.item.findUnique({
      where,
    });
  }

  async createItem(item: CreateItemDto, userId: string): Promise<Item> {
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

    return this.prisma.item.create({
      data,
    });
  }

  async updateItem(id: string, item: UpdateItemDto, userId: string): Promise<Item> {
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

      return tx.item.update({
        where: { id, userId },
        data,
      });
    });
  }

  async deleteItem(id: string, userId: string, tx: Prisma.TransactionClient): Promise<Item> {
    const storedItem = await tx.item.findUnique({ where: { id, userId } });
    if (!storedItem) {
      throw new NotFoundException('Item not found');
    }

    return tx.item.delete({
      where: { id, userId },
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

      await tx.itemList.deleteMany({
        where: {
          itemId: id,
        },
      });
      await tx.itemPack.deleteMany({
        where: {
          itemId: id,
        },
      });
      await this.deleteItem(id, userId, tx);
    });
  }

  async getItemDeleteImpact(id: string, userId: string): Promise<ItemDeleteImpact> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id, userId } });
      if (!item) {
        throw new NotFoundException('Item not found');
      }

      const [lists, packs] = await Promise.all([
        tx.list.findMany({
          where: {
            items: {
              some: { itemId: id },
            },
          },
        }),
        tx.pack.findMany({
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
        trips = await tx.trip.findMany({
          where: {
            packId: { in: packIds },
          },
        });
      }

      return { item, lists, packs, trips };
    });
  }
}
