import { Injectable, NotFoundException } from '@nestjs/common';

import { List, Pack, Prisma, Trip } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

export interface ListDeleteImpact {
  list: List;
  packs: Pack[];
  trips: Trip[];
}

@Injectable()
export class ListService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getLists(where: Prisma.ListWhereInput): Promise<List[]> {
    return this.prisma.list.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async getList(where: Prisma.ListWhereUniqueInput): Promise<List> {
    const result = await this.prisma.list.findUnique({ where, include: { items: true } });

    if (!result) {
      throw new NotFoundException('List not found');
    }

    return result;
  }

  async createList(list: CreateListDto, userId: string): Promise<List> {
    const uuid = uuidv7();

    const data: Prisma.ListCreateInput = {
      ...list,
      id: uuid,
      userId: userId,
    };

    return this.prisma.list.create({ data });
  }

  async updateList(id: string, list: UpdateListDto, userId: string): Promise<List> {
    return this.prisma.$transaction(async (tx) => {
      const storedList = await tx.list.findUnique({ where: { id, userId } });
      if (!storedList) {
        throw new NotFoundException('List not found');
      }

      return tx.list.update({ where: { id, userId }, data: list });
    });
  }

  // ============================================
  // LIST MANAGEMENT
  // ============================================

  async handleListDeletion(id: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const list = await tx.list.findUnique({ where: { id, userId } });
      if (!list) {
        throw new NotFoundException('List not found');
      }

      // ListPack uses Restrict on list deletion, so must be manually removed first.
      // ItemList uses Cascade, so handled automatically by the DB.
      await tx.listPack.deleteMany({ where: { listId: id } });
      await tx.list.delete({ where: { id, userId } });
    });
  }

  async getListDeleteImpact(id: string, userId: string): Promise<ListDeleteImpact> {
    const list = await this.prisma.list.findUnique({ where: { id, userId } });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const packs = await this.prisma.pack.findMany({
      where: {
        lists: {
          some: { listId: id },
        },
      },
    });

    let trips: Trip[] = [];
    const packIds = packs.map((pack) => pack.id);
    if (packIds.length > 0) {
      trips = await this.prisma.trip.findMany({
        where: {
          packId: { in: packIds },
        },
      });
    }

    return { list, packs, trips };
  }
}
