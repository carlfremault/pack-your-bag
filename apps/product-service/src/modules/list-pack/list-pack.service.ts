import { Injectable, NotFoundException } from '@nestjs/common';

import { ListPack } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { UpsertListInPackDto } from './dto/upsert-list-pack.dto';

@Injectable()
export class ListPackService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertListInPack(
    upsertListInPackDto: UpsertListInPackDto,
    userId: string,
  ): Promise<ListPack> {
    const { listId, packId, quantity } = upsertListInPackDto;

    return this.prisma.$transaction(async (tx) => {
      const [list, pack] = await Promise.all([
        tx.list.findUnique({ where: { id: listId, userId } }),
        tx.pack.findUnique({ where: { id: packId, userId } }),
      ]);

      if (!list) throw new NotFoundException('List not found');
      if (!pack) throw new NotFoundException('Pack not found');

      return tx.listPack.upsert({
        where: { listId_packId: { listId, packId } },
        create: { id: uuidv7(), listId, packId, quantity },
        update: { quantity },
      });
    });
  }

  async removeListFromPack(listId: string, packId: string, userId: string): Promise<ListPack> {
    return this.prisma.$transaction(async (tx) => {
      const [list, pack] = await Promise.all([
        tx.list.findUnique({ where: { id: listId, userId } }),
        tx.pack.findUnique({ where: { id: packId, userId } }),
      ]);

      if (!list) throw new NotFoundException('List not found');
      if (!pack) throw new NotFoundException('Pack not found');

      return tx.listPack.delete({ where: { listId_packId: { listId, packId } } });
    });
  }
}
