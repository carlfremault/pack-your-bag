import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { AuditEventType, AuditSeverity } from '@repo/db';
import { AuditLogProvider } from '@repo/nestjs-common';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogProvider: AuditLogProvider,
  ) {}

  async deleteUserData(userIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
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

      const auditMessage = `Cleaned up product data for User IDs [${userIds.join(', ')}]: ${itemResult.count} item(s), ${categoryResult.count} category(s), ${listResult.count} list(s), ${packResult.count} pack(s), and ${tripResult.count} trip(s)`;

      this.logger.log(auditMessage);
      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
      });
    });
  }
}
