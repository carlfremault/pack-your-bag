import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AuditEventType, AuditSeverity, Prisma } from '@repo/db';

import { UAParser } from 'ua-parser-js';
import { v7 as uuidv7 } from 'uuid';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { PrismaService } from '@/prisma/prisma.service';

interface AuditLogData {
  readonly requestId: string | null;
  readonly eventType: AuditEventType;
  readonly severity: AuditSeverity;
  readonly userId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly path: string | null;
  readonly method: string | null;
  readonly statusCode: number | null;
  readonly errorCode?: string;
  readonly message: Prisma.InputJsonValue;
  readonly metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name, { timestamp: true });

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(AUTH_EVENTS.AUDIT_LOG, { async: true })
  async handleAuditLog(data: AuditLogData) {
    try {
      const uuid = uuidv7();
      const { userAgent, ...rest } = data;
      const deviceInfo = this.parseDeviceInfo(userAgent);

      await this.prisma.auditLog.create({
        data: {
          ...rest,
          id: uuid,
          deviceInfo: deviceInfo as Prisma.JsonObject,
          metadata: (rest.metadata as Prisma.JsonObject) ?? {},
        },
      });
    } catch (error) {
      this.logger.error('Audit logging failed internally:', error);
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
        metadata: Prisma.DbNull,
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

    return this.prisma.auditLog.deleteMany({ where });
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

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
