import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { Prisma } from '@repo/db';
import type { AuditLogMessage } from '@repo/nestjs-common';

import { UAParser } from 'ua-parser-js';
import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name, { timestamp: true });

  constructor(private readonly prisma: PrismaService) {}

  async handleAuditLog(data: AuditLogMessage): Promise<void> {
    const uuid = uuidv7();
    const { userAgent, ...rest } = data;
    const deviceInfo = this.parseDeviceInfo(userAgent);

    await this.prisma.auditLogEntry.create({
      data: {
        ...rest,
        id: uuid,
        deviceInfo: deviceInfo as Prisma.JsonObject,
        metadata: (rest.metadata as Prisma.JsonObject) ?? {},
      },
    });
  }

  async anonymizeAuditLogs(where: Prisma.AuditLogEntryWhereInput): Promise<Prisma.BatchPayload> {
    const validateUserIdFilter = (filter: Prisma.AuditLogEntryWhereInput): boolean => {
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

    return this.prisma.auditLogEntry.updateMany({
      where,
      data: {
        userId: null,
        metadata: Prisma.DbNull,
      },
    });
  }

  async deleteAuditLogs(where: Prisma.AuditLogEntryWhereInput): Promise<Prisma.BatchPayload> {
    // Ensure there's a meaningful time-based filter to prevent accidental mass deletion
    const validateCreatedAtFilter = (filter: Prisma.AuditLogEntryWhereInput): boolean => {
      if (!filter || typeof filter !== 'object') return false;

      if ('NOT' in filter) {
        throw new Error('NOT clauses are not allowed in audit log deletion for safety reasons.');
      }

      if ('createdAt' in filter) return true;

      if (filter.AND) {
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

    return this.prisma.auditLogEntry.deleteMany({ where });
  }

  private parseDeviceInfo(userAgent: string | null): {
    browser: string;
    os: string;
    device: string;
  } | null {
    if (!userAgent) return null;

    try {
      const parser = new UAParser(userAgent);
      const res = parser.getResult();

      return {
        browser: res.browser.name || 'Unknown',
        os: res.os.name || 'Unknown',
        device: res.device.type || 'desktop',
      };
    } catch (error) {
      this.logger.warn('Failed to parse user agent', { userAgent, error });
      return null;
    }
  }
}
