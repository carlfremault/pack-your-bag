import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CleanupResultDto } from './dto/cleanup-users.dto';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteUserData(userIds: string[]): Promise<CleanupResultDto> {
    return this.prisma.$transaction(async (tx) => {
      const [itemListResult, itemPackResult, listPackResult] = await Promise.all([
        tx.itemList.deleteMany({ where: { item: { userId: { in: userIds } } } }),
        tx.itemPack.deleteMany({ where: { item: { userId: { in: userIds } } } }),
        tx.listPack.deleteMany({ where: { list: { userId: { in: userIds } } } }),
      ]);

      this.logger.debug(
        `Deleted join table records: ${itemListResult.count} ItemList, ${itemPackResult.count} ItemPack, ${listPackResult.count} ListPack`,
      );

      const [tripResult, packResult, listResult, itemResult, categoryResult] = await Promise.all([
        tx.trip.deleteMany({ where: { userId: { in: userIds } } }),
        tx.pack.deleteMany({ where: { userId: { in: userIds } } }),
        tx.list.deleteMany({ where: { userId: { in: userIds } } }),
        tx.item.deleteMany({ where: { userId: { in: userIds } } }),
        tx.category.deleteMany({ where: { userId: { in: userIds } } }),
      ]);

      return {
        deletedItems: itemResult.count,
        deletedCategories: categoryResult.count,
        deletedLists: listResult.count,
        deletedPacks: packResult.count,
        deletedTrips: tripResult.count,
      };
    });
  }
}
