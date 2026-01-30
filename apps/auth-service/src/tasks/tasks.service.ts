import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MS_PER_DAY } from '@/common/constants/auth.constants';
import { AuditEventType, AuditSeverity, Prisma } from '@/generated/prisma';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { UserService } from '@/modules/user/user.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly refreshTokenRetentionDays: number;
  private readonly infoLogsRetentionDays: number;
  private readonly errorWarnLogsRetentionDays: number;
  private readonly criticalLogsRetentionDays: number;
  private readonly deletedUsersRetentionDays: number;

  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditLogProvider: AuditLogProvider,
    private readonly auditLogService: AuditLogService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenRetentionDays = this.configService.get<number>(
      'AUTH_REFRESH_TOKEN_DB_RETENTION_DAYS',
      14,
    );
    this.infoLogsRetentionDays = this.configService.get<number>(
      'AUDIT_LOG_INFO_RETENTION_DAYS',
      30,
    );
    this.errorWarnLogsRetentionDays = this.configService.get<number>(
      'AUDIT_LOG_ERROR_WARN_RETENTION_DAYS',
      60,
    );
    this.criticalLogsRetentionDays = this.configService.get<number>(
      'AUDIT_LOG_CRITICAL_RETENTION_DAYS',
      90,
    );
    this.deletedUsersRetentionDays = this.configService.get<number>(
      'AUTH_USER_DELETE_RETENTION_DAYS',
      30,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async cleanupExpiredRefreshTokens() {
    this.logger.log('Starting cleanup of expired refresh tokens');

    const refreshTokenCutoff = new Date(Date.now() - this.refreshTokenRetentionDays * MS_PER_DAY);

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

      const auditMessage = `Cleaned up ${result.count} expired/revoked token${result.count === 1 ? '' : 's'}. Revoked cutoff: ${refreshTokenCutoff.toISOString()}`;
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

    const infoCutoff = new Date(Date.now() - this.infoLogsRetentionDays * MS_PER_DAY);
    const errorWarnCutoff = new Date(Date.now() - this.errorWarnLogsRetentionDays * MS_PER_DAY);
    const criticalCutoff = new Date(Date.now() - this.criticalLogsRetentionDays * MS_PER_DAY);

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

      const auditMessage = `Cleaned up ${result.count} audit log${result.count === 1 ? '' : 's'}: INFO before ${infoCutoff.toISOString()}, ERROR/WARN before ${errorWarnCutoff.toISOString()}, CRITICAL before ${criticalCutoff.toISOString()}`;

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

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupDeletedUsers() {
    this.logger.log('Starting cleanup of deleted users');

    const deletedUsersCutoff = new Date(Date.now() - this.deletedUsersRetentionDays * MS_PER_DAY);

    try {
      let auditMessage: string;
      let metadata: Prisma.InputJsonValue;

      const usersToDelete = await this.userService.getUsers({
        isDeleted: true,
        deletedAt: { lt: deletedUsersCutoff },
      });

      if (!usersToDelete || usersToDelete.length === 0) {
        auditMessage = 'No users to delete';
        metadata = { deletedUsersCutoff: deletedUsersCutoff.toISOString() };
      } else {
        const userIds = usersToDelete.map((u) => u.id);
        const result = await this.userService.hardDeleteUsers(userIds);

        auditMessage = `Cleaned up ${result.deletedUsers} deleted user${result.deletedUsers === 1 ? '' : 's'}, ${result.deletedTokens} token${result.deletedTokens === 1 ? '' : 's'}, and anonymized ${result.anonymizedAuditLogs} audit log${result.anonymizedAuditLogs === 1 ? '' : 's'}, deleted before ${deletedUsersCutoff.toISOString()}`;

        metadata = {
          ...result,
          deletedUsersCutoff: deletedUsersCutoff.toISOString(),
        };
      }

      this.logger.log(auditMessage);

      this.auditLogProvider.safeEmit({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        userId: null,
        path: 'N/A',
        method: 'N/A',
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
        metadata,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to cleanup deleted users: ${errorMessage}`, errorStack);

      this.auditLogProvider.safeEmit({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.ERROR,
        userId: null,
        path: 'N/A',
        method: 'N/A',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Deleted users cleanup failed: ${errorMessage}`,
      });
    }
  }
}
