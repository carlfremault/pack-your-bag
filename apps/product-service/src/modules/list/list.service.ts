import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, Trip } from '@repo/db';

import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';

import {
  computeListItemCount,
  computeListTotalWeight,
} from '@/common/helpers/list-summary.helpers';
import { PrismaService } from '@/prisma/prisma.service';

import { PackResponseDto } from '../pack/dto/pack-response.dto';
import { TripResponseDto } from '../trip/dto/trip-response.dto';

import { CreateListDto } from './dto/create-list.dto';
import { ListDeleteImpactDto } from './dto/list-delete-impact.dto';
import {
  ListBaseResponseDto,
  ListResponseDto,
  ListSummaryResponseDto,
} from './dto/list-response.dto';
import { UpdateListDto } from './dto/update-list.dto';

@Injectable()
export class ListService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getLists(where: Prisma.ListWhereInput): Promise<ListSummaryResponseDto[]> {
    const results = await this.prisma.list.findMany({
      where,
      include: {
        items: { include: { item: true } },
      },
    });

    const shaped = results.map((list) => ({
      ...list,
      itemCount: computeListItemCount(list),
      totalWeight: computeListTotalWeight(list),
    }));

    return plainToInstance(ListSummaryResponseDto, shaped);
  }

  async getList(where: Prisma.ListWhereUniqueInput): Promise<ListResponseDto> {
    const result = await this.prisma.list.findUnique({
      where,
      include: { items: { include: { item: { include: { category: true } } } } },
    });

    if (!result) {
      throw new NotFoundException('List not found');
    }

    return plainToInstance(ListResponseDto, result);
  }

  async createList(list: CreateListDto, userId: string): Promise<ListResponseDto> {
    const uuid = uuidv7();

    const data: Prisma.ListCreateInput = {
      ...list,
      id: uuid,
      userId: userId,
    };

    const result = await this.prisma.list.create({ data });

    return plainToInstance(ListResponseDto, result);
  }

  async updateList(id: string, list: UpdateListDto, userId: string): Promise<ListResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const storedList = await tx.list.findUnique({ where: { id, userId } });
      if (!storedList) {
        throw new NotFoundException('List not found');
      }

      const result = await tx.list.update({ where: { id, userId }, data: list });

      return plainToInstance(ListResponseDto, result);
    });
  }

  async cloneList(id: string, newName: string, userId: string): Promise<ListResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const storedList = await tx.list.findUnique({ where: { id, userId } });
      if (!storedList) {
        throw new NotFoundException('List not found');
      }

      const { id: _id, name: _name, createdAt: _ca, updatedAt: _ua, ...listData } = storedList;

      const result = await tx.list.create({
        data: {
          ...listData,
          id: uuidv7(),
          name: newName,
          userId,
        },
      });

      const itemsInList = await tx.itemList.findMany({ where: { listId: id } });
      await tx.itemList.createMany({
        data: itemsInList.map((itemList) => ({
          ...itemList,
          id: uuidv7(),
          listId: result.id,
        })),
      });

      return plainToInstance(ListResponseDto, result);
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

  async getListDeleteImpact(id: string, userId: string): Promise<ListDeleteImpactDto> {
    const list = await this.prisma.list.findUnique({
      where: { id, userId },
    });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const packs = await this.prisma.pack.findMany({
      where: {
        userId,
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
          userId,
          packId: { in: packIds },
        },
      });
    }

    return {
      list: plainToInstance(ListBaseResponseDto, list),
      packs: plainToInstance(PackResponseDto, packs),
      trips: plainToInstance(TripResponseDto, trips),
    };
  }
}
