import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import type { AuditLogMessage } from '@repo/nestjs-common';
import { MS_PER_DAY } from '@repo/nestjs-common';

import { AuditLogService } from '@/modules/audit-log/audit-log.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly infoLogsRetentionDays: number;
  private readonly errorWarnLogsRetentionDays: number;
  private readonly criticalLogsRetentionDays: number;

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {
    this.infoLogsRetentionDays = this.configService.getOrThrow('AUDIT_LOG_INFO_RETENTION_DAYS');
    this.errorWarnLogsRetentionDays = this.configService.getOrThrow(
      'AUDIT_LOG_ERROR_WARN_RETENTION_DAYS',
    );
    this.criticalLogsRetentionDays = this.configService.getOrThrow(
      'AUDIT_LOG_CRITICAL_RETENTION_DAYS',
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async cleanupAuditLogs() {
    this.logger.log('Starting cleanup of audit logs');

    const infoCutoff = new Date(Date.now() - this.infoLogsRetentionDays * MS_PER_DAY);
    const errorWarnCutoff = new Date(Date.now() - this.errorWarnLogsRetentionDays * MS_PER_DAY);
    const criticalCutoff = new Date(Date.now() - this.criticalLogsRetentionDays * MS_PER_DAY);

    try {
      const result = await this.auditLogService.deleteAuditLogs({
        OR: [
          {
            severity: AuditLogSeverity.INFO,
            createdAt: { lt: infoCutoff },
          },
          {
            severity: { in: [AuditLogSeverity.WARN, AuditLogSeverity.ERROR] },
            createdAt: { lt: errorWarnCutoff },
          },
          {
            severity: AuditLogSeverity.CRITICAL,
            createdAt: { lt: criticalCutoff },
          },
        ],
      });

      const auditMessage = `Cleaned up ${result.count} audit log(s): INFO before ${infoCutoff.toISOString()}, ERROR/WARN before ${errorWarnCutoff.toISOString()}, CRITICAL before ${criticalCutoff.toISOString()}`;
      this.logger.log(auditMessage);

      await this.writeAuditLog({
        severity: AuditLogSeverity.INFO,
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
        metadata: {
          count: result.count,
          infoCutoff: infoCutoff.toISOString(),
          errorWarnCutoff: errorWarnCutoff.toISOString(),
          criticalCutoff: criticalCutoff.toISOString(),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to cleanup audit logs: ${errorMessage}`, errorStack);

      await this.writeAuditLog({
        severity: AuditLogSeverity.ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Audit log cleanup failed: ${errorMessage}`,
      });
    }
  }

  private async writeAuditLog(
    data: Pick<AuditLogMessage, 'severity' | 'statusCode' | 'message' | 'metadata'>,
  ): Promise<void> {
    try {
      await this.auditLogService.handleAuditLog({
        requestId: null,
        eventType: AuditLogEventType.SCHEDULED_TASK,
        severity: data.severity,
        statusCode: data.statusCode,
        userId: null,
        ipAddress: null,
        userAgent: null,
        path: null,
        method: null,
        source: 'audit-service',
        message: data.message,
        metadata: data.metadata,
      });
    } catch (error) {
      this.logger.error('Failed to write audit log entry for scheduled task', error);
    }
  }
}
