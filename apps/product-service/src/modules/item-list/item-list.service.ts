import { Injectable, NotFoundException } from '@nestjs/common';

import { ItemList } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { UpsertItemOnListDto } from './dto/upsert-item-list.dto';

@Injectable()
export class ItemListService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertItemOnList(
    upsertItemOnListDto: UpsertItemOnListDto,
    userId: string,
  ): Promise<ItemList> {
    const { itemId, listId, quantity } = upsertItemOnListDto;

    return this.prisma.$transaction(async (tx) => {
      const [item, list] = await Promise.all([
        tx.item.findUnique({ where: { id: itemId, userId } }),
        tx.list.findUnique({ where: { id: listId, userId } }),
      ]);

      if (!item) throw new NotFoundException('Item not found');
      if (!list) throw new NotFoundException('List not found');

      return tx.itemList.upsert({
        where: { itemId_listId: { itemId, listId } },
        create: { id: uuidv7(), itemId, listId, quantity },
        update: { quantity },
      });
    });
  }

  async removeItemFromList(itemId: string, listId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const [item, list] = await Promise.all([
        tx.item.findUnique({ where: { id: itemId, userId } }),
        tx.list.findUnique({ where: { id: listId, userId } }),
      ]);

      if (!item) throw new NotFoundException('Item not found');
      if (!list) throw new NotFoundException('List not found');

      await tx.itemList.delete({ where: { itemId_listId: { itemId, listId } } });
    });
  }
}
