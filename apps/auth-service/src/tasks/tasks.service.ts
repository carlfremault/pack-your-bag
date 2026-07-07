import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AuditEventType, AuditSeverity, Prisma } from '@repo/db';
import { MS_PER_DAY, MS_PER_HOUR, RMQ_PATTERNS, RMQ_PUBLISHERS } from '@repo/nestjs-common';
import { AuditLogProvider } from '@repo/nestjs-common';

import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { UserService } from '@/modules/user/user.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly refreshTokenRetentionDays: number;
  private readonly deletedUsersRetentionDays: number;
  private readonly verificationTokenRetentionDays: number;
  private readonly guestSessionTtlHours: number;

  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly auditLogProvider: AuditLogProvider,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @Inject(RMQ_PUBLISHERS.USER_CLEANUP_PRODUCT) private readonly cleanupProductClient: ClientProxy,
    @Inject(RMQ_PUBLISHERS.USER_CLEANUP_USER_DATA)
    private readonly cleanupUserDataClient: ClientProxy,
  ) {
    this.refreshTokenRetentionDays = this.configService.getOrThrow(
      'AUTH_REFRESH_TOKEN_DB_RETENTION_DAYS',
    );
    this.deletedUsersRetentionDays = this.configService.getOrThrow(
      'AUTH_USER_DELETE_RETENTION_DAYS',
    );
    this.verificationTokenRetentionDays = this.configService.getOrThrow(
      'AUTH_VERIFICATION_TOKEN_RETENTION_DAYS',
    );
    this.guestSessionTtlHours = this.configService.getOrThrow('AUTH_GUEST_SESSION_TTL_HOURS');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
        metadata: { count: result.count, cutoff: refreshTokenCutoff.toISOString() },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to cleanup expired refresh tokens: ${errorMessage}`, errorStack);

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Refresh token cleanup failed: ${errorMessage}`,
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
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

        this.auditLogProvider.requestAnonymization(userIds);
        this.cleanupDownstreamServices(userIds);

        auditMessage = `Cleaned up ${result.deletedUsers} deleted user${result.deletedUsers === 1 ? '' : 's'} and ${result.deletedTokens} token${result.deletedTokens === 1 ? '' : 's'}, deleted before ${deletedUsersCutoff.toISOString()}`;

        metadata = {
          ...result,
          deletedUsersCutoff: deletedUsersCutoff.toISOString(),
        };
      }

      this.logger.log(auditMessage);

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
        metadata,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to cleanup deleted users: ${errorMessage}`, errorStack);

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Deleted users cleanup failed: ${errorMessage}`,
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupVerificationTokens() {
    this.logger.log('Starting cleanup of expired/used verification tokens');

    const verificationTokenCutoff = new Date(
      Date.now() - this.verificationTokenRetentionDays * MS_PER_DAY,
    );

    try {
      const result = await this.verificationTokenService.deleteVerificationTokens({
        OR: [{ expiresAt: { lt: verificationTokenCutoff } }, { used: true }],
      });

      const auditMessage = `Cleaned up ${result.count} expired/used verification token${result.count === 1 ? '' : 's'}. Cutoff: ${verificationTokenCutoff.toISOString()}`;
      this.logger.log(auditMessage);

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
        metadata: { count: result.count, cutoff: verificationTokenCutoff.toISOString() },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to cleanup expired verification tokens: ${errorMessage}`,
        errorStack,
      );

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Verification token cleanup failed: ${errorMessage}`,
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupExpiredGuests() {
    this.logger.log('Starting cleanup of expired guest sessions');

    const guestCutoff = new Date(Date.now() - this.guestSessionTtlHours * MS_PER_HOUR);

    try {
      let auditMessage: string;
      let metadata: Prisma.InputJsonValue;

      const expiredGuests = await this.userService.getUsers({
        isGuest: true,
        lastActiveAt: { lt: guestCutoff },
      });

      if (!expiredGuests || expiredGuests.length === 0) {
        auditMessage = 'No expired guest sessions to clean up';
        metadata = { guestCutoff: guestCutoff.toISOString() };
      } else {
        const userIds = expiredGuests.map((u) => u.id);
        const result = await this.userService.hardDeleteUsers(userIds);

        this.auditLogProvider.requestAnonymization(userIds);
        this.cleanupDownstreamServices(userIds);

        auditMessage = `Cleaned up ${result.deletedUsers} expired guest${result.deletedUsers === 1 ? '' : 's'} and ${result.deletedTokens} token${result.deletedTokens === 1 ? '' : 's'}, last active before ${guestCutoff.toISOString()}`;

        metadata = {
          ...result,
          guestCutoff: guestCutoff.toISOString(),
        };
      }

      this.logger.log(auditMessage);

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.INFO,
        statusCode: HttpStatus.NO_CONTENT,
        message: auditMessage,
        metadata,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to cleanup expired guest sessions: ${errorMessage}`, errorStack);

      this.auditLogProvider.auditRequest({
        eventType: AuditEventType.SCHEDULED_TASK,
        severity: AuditSeverity.ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Guest session cleanup failed: ${errorMessage}`,
      });
    }
  }

  private cleanupDownstreamServices(userIds: string[]): void {
    setImmediate(() => {
      this.cleanupProductClient
        .emit<string, string[]>(RMQ_PATTERNS.USER_CLEANUP_PRODUCT_REQUESTED, userIds)
        .subscribe({
          error: (err: unknown) => {
            this.logger.error(
              `Product cleanup failed for user IDs [${userIds.join(', ')}]: ${err}`,
            );
          },
        });
    });
    setImmediate(() => {
      this.cleanupUserDataClient
        .emit<string, string[]>(RMQ_PATTERNS.USER_CLEANUP_USER_DATA_REQUESTED, userIds)
        .subscribe({
          error: (err: unknown) => {
            this.logger.error(
              `User data cleanup failed for user IDs [${userIds.join(', ')}]: ${err}`,
            );
          },
        });
    });
  }
}
