import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AuditEventType, AuditSeverity } from '@/generated/prisma';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditLogProvider: AuditLogProvider,
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async cleanupExpiredRefreshTokens() {
    this.logger.log('Starting cleanup of expired refresh tokens');

    const refreshTokenRetentionDays = this.configService.get<number>(
      'AUTH_REFRESH_TOKEN_DB_RETENTION_DAYS',
      14,
    );

    const refreshTokenCutoff = new Date(Date.now() - refreshTokenRetentionDays * this.MS_PER_DAY);

    try {
      const result = await this.refreshTokenService.deleteRefreshTokens({
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            revokedAt: { lt: refreshTokenCutoff },
          },
        ],
      });

      const auditMessage = `Cleaned up ${result.count} expired/revoked tokens. Revoked cutoff: ${refreshTokenCutoff.toISOString()}`;
      this.logger.log(auditMessage);

      this.auditLogProvider.safeEmit({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        userId: null,
        path: 'N/A',
        method: 'N/A',
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
        metadata: { count: result.count, cutoff: refreshTokenCutoff.toISOString() },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to cleanup expired refresh tokens: ${errorMessage}`, errorStack);

      this.auditLogProvider.safeEmit({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.ERROR,
        userId: null,
        path: 'N/A',
        method: 'N/A',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Token cleanup failed: ${errorMessage}`,
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupAuditLogs() {
    this.logger.log('Starting cleanup of audit logs');

    const infoLogsRetentionDays = this.configService.get<number>(
      'AUDIT_LOG_INFO_RETENTION_DAYS',
      30,
    );
    const errorWarnLogsRetentionDays = this.configService.get<number>(
      'AUDIT_LOG_ERROR_WARN_RETENTION_DAYS',
      60,
    );
    const criticalLogsRetentionDays = this.configService.get<number>(
      'AUDIT_LOG_CRITICAL_RETENTION_DAYS',
      90,
    );

    const infoCutoff = new Date(Date.now() - infoLogsRetentionDays * this.MS_PER_DAY);
    const errorWarnCutoff = new Date(Date.now() - errorWarnLogsRetentionDays * this.MS_PER_DAY);
    const criticalCutoff = new Date(Date.now() - criticalLogsRetentionDays * this.MS_PER_DAY);

    try {
      const result = await this.auditLogService.deleteAuditLogs({
        OR: [
          {
            severity: AuditSeverity.INFO,
            createdAt: { lt: infoCutoff },
          },
          {
            severity: { in: [AuditSeverity.WARN, AuditSeverity.ERROR] },
            createdAt: { lt: errorWarnCutoff },
          },
          {
            severity: AuditSeverity.CRITICAL,
            createdAt: { lt: criticalCutoff },
          },
        ],
      });

      const auditMessage = `Cleaned up ${result.count} audit logs: INFO before ${infoCutoff.toISOString()}, ERROR/WARN before ${errorWarnCutoff.toISOString()}, CRITICAL before ${criticalCutoff.toISOString()}`;

      this.logger.log(auditMessage);

      this.auditLogProvider.safeEmit({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        userId: null,
        path: 'N/A',
        method: 'N/A',
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

      this.auditLogProvider.safeEmit({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.ERROR,
        userId: null,
        path: 'N/A',
        method: 'N/A',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Audit log cleanup failed: ${errorMessage}`,
      });
    }
  }
}
