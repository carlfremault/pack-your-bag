import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AuditEventType, AuditSeverity } from '@/generated/prisma';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditLogProvider: AuditLogProvider,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async cleanupExpiredRefreshTokens() {
    this.logger.log('Starting cleanup of expired refresh tokens');

    const refreshTokenRetentionPeriod = this.configService.get<number>(
      'AUTH_REFRESH_TOKEN_DB_RETENTION_PERIOD_MS',
      1209600000,
    );

    try {
      const result = await this.refreshTokenService.deleteRefreshTokens({
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            revokedAt: { lt: new Date(Date.now() - refreshTokenRetentionPeriod) },
          },
        ],
      });

      const auditMessage = `Cleaned up ${result.count} expired/revoked tokens`;
      this.logger.log(auditMessage);

      this.auditLogProvider.safeEmit({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        userId: null,
        path: 'N/A',
        method: 'N/A',
        statusCode: 200,
        message: auditMessage,
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
        statusCode: 500,
        message: `Token cleanup failed: ${errorMessage}`,
      });
    }
  }
}
