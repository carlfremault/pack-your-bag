import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Prisma } from '@prisma-client';
import { UAParser } from 'ua-parser-js';
import { uuidv7 } from 'uuidv7';

import type { AuditLogData } from '@/common/interfaces/audit-log-data.interface';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name, { timestamp: true });
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('audit.log', { async: true })
  async handleAuditLog(data: AuditLogData) {
    try {
      const uuid = uuidv7();
      const { userAgent, ...rest } = data;
      const deviceInfo = this.parseDeviceInfo(userAgent);

      const tasks: Promise<unknown>[] = [
        this.prisma.auditLog.create({
          data: {
            ...rest,
            id: uuid,
            deviceInfo: deviceInfo as Prisma.JsonObject,
            metadata: (rest.metadata as Prisma.JsonObject) ?? {},
          },
        }),
      ];

      if (rest.severity === 'CRITICAL') {
        tasks.push(this.triggerAlert(rest));
      }

      const results = await Promise.allSettled(tasks);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.error(`Audit task ${index} failed:`, result.reason);
        }
      });
    } catch (error) {
      this.logger.error('Audit logging failed internally:', error);
    }
  }

  private parseDeviceInfo(userAgent?: string) {
    if (!userAgent) return null;

    try {
      const parser = new UAParser(userAgent);
      const res = parser.getResult();

      return {
        browser: res.browser.name || 'Unknown',
        os: res.os.name || 'Unknown',
        device: res.device.type || 'desktop',
      };
    } catch {
      return { error: 'Parsing failed' };
    }
  }

  async anonymizeAuditLogs(
    where: Prisma.AuditLogWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Prisma.BatchPayload> {
    const validateUserIdFilter = (filter: Prisma.AuditLogWhereInput): boolean => {
      if (!filter || typeof filter !== 'object') return false;

      if ('NOT' in filter || 'AND' in filter || 'OR' in filter) {
        throw new BadRequestException(
          'Complex filters (AND, OR, NOT) are not allowed in audit log anonymization for safety reasons.',
        );
      }

      return 'userId' in filter;
    };

    if (!validateUserIdFilter(where)) {
      throw new BadRequestException(
        'A userId filter must be provided for bulk Audit log anonymization.',
      );
    }

    const prisma = tx || this.prisma;

    const result = await prisma.auditLog.updateMany({
      where,
      data: {
        userId: null,
      },
    });
    return result;
  }

  async deleteAuditLogs(where: Prisma.AuditLogWhereInput): Promise<Prisma.BatchPayload> {
    // Ensure there's a meaningful time-based filter to prevent accidental mass deletion
    const validateCreatedAtFilter = (filter: Prisma.AuditLogWhereInput): boolean => {
      if (!filter || typeof filter !== 'object') return false;

      if ('NOT' in filter) {
        throw new Error('NOT clauses are not allowed in audit log deletion for safety reasons.');
      }

      if ('createdAt' in filter) return true;

      if (filter.AND && Array.isArray(filter.AND)) {
        const andFilters = Array.isArray(filter.AND) ? filter.AND : [filter.AND];
        return andFilters.some(validateCreatedAtFilter);
      }
      if (filter.OR) {
        return filter.OR.every(validateCreatedAtFilter);
      }

      return false;
    };

    if (!validateCreatedAtFilter(where)) {
      throw new Error('A createdAt filter must be provided for bulk audit log deletion.');
    }

    return this.prisma.auditLog.deleteMany({ where });
  }

  // Temporary eslint disable. Should be removed after implementing email alerting
  // 'async' is needed to make Promise.allSettled happy
  // eslint-disable-next-line @typescript-eslint/require-await
  private async triggerAlert(data: AuditLogData): Promise<void> {
    // TODO: Implement email alerting
    // For now, just log
    this.logger.error('CRITICAL SECURITY EVENT:', data);
  }
}
