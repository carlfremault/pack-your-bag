import { Injectable, NotFoundException } from '@nestjs/common';

import { ItemPack } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { UpsertItemInPackDto } from './dto/upsert-item-pack.dto';

@Injectable()
export class ItemPackService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertItemInPack(
    upsertItemInPackDto: UpsertItemInPackDto,
    userId: string,
  ): Promise<ItemPack> {
    const { itemId, packId, quantity } = upsertItemInPackDto;

    return this.prisma.$transaction(async (tx) => {
      const [item, pack] = await Promise.all([
        tx.item.findUnique({ where: { id: itemId, userId } }),
        tx.pack.findUnique({ where: { id: packId, userId } }),
      ]);

      if (!item) throw new NotFoundException('Item not found');
      if (!pack) throw new NotFoundException('Pack not found');

      return tx.itemPack.upsert({
        where: { itemId_packId: { itemId, packId } },
        create: { id: uuidv7(), itemId, packId, quantity },
        update: { quantity },
      });
    });
  }

  async removeItemFromPack(itemId: string, packId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const [item, pack] = await Promise.all([
        tx.item.findUnique({ where: { id: itemId, userId } }),
        tx.pack.findUnique({ where: { id: packId, userId } }),
      ]);

      if (!item) throw new NotFoundException('Item not found');
      if (!pack) throw new NotFoundException('Pack not found');

      await tx.itemPack.delete({ where: { itemId_packId: { itemId, packId } } });
    });
  }
}
