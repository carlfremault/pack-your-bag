import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AuditEventType, AuditSeverity, Prisma } from '@repo/db';
import { MS_PER_DAY, MS_PER_HOUR } from '@repo/nestjs-common';

import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { ServiceClientService } from '@/modules/service-client/service-client.service';
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
    private readonly serviceClientService: ServiceClientService,
    private readonly configService: ConfigService,
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

        auditMessage = `Cleaned up ${result.deletedUsers} deleted user${result.deletedUsers === 1 ? '' : 's'} and ${result.deletedTokens} token${result.deletedTokens === 1 ? '' : 's'}, deleted before ${deletedUsersCutoff.toISOString()}`;

        metadata = {
          ...result,
          deletedUsersCutoff: deletedUsersCutoff.toISOString(),
        };

        const downstreamResult = await this.cleanupDownstreamServices(userIds);
        metadata = { ...metadata, downstream: downstreamResult };
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

        auditMessage = `Cleaned up ${result.deletedUsers} expired guest${result.deletedUsers === 1 ? '' : 's'} and ${result.deletedTokens} token${result.deletedTokens === 1 ? '' : 's'}, last active before ${guestCutoff.toISOString()}`;

        metadata = {
          ...result,
          guestCutoff: guestCutoff.toISOString(),
        };

        const downstreamResult = await this.cleanupDownstreamServices(userIds);
        metadata = { ...metadata, downstream: downstreamResult };
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

  private async cleanupDownstreamServices(userIds: string[]): Promise<Prisma.InputJsonValue> {
    const [productResult, userDataResult] = await Promise.allSettled([
      this.serviceClientService.cleanupProductData(userIds),
      this.serviceClientService.cleanupUserData(userIds),
    ]);

    const downstream: Record<string, Prisma.InputJsonValue> = {};

    if (productResult.status === 'fulfilled') {
      downstream.product = productResult.value as unknown as Prisma.InputJsonValue;
      this.logger.log(`Product cleanup succeeded: ${JSON.stringify(productResult.value)}`);
    } else {
      const errorMessage =
        productResult.reason instanceof Error
          ? productResult.reason.message
          : String(productResult.reason);
      downstream.product = { error: errorMessage };
      this.logger.warn(
        `Product cleanup failed for user IDs [${userIds.join(', ')}]: ${errorMessage}`,
      );
    }

    if (userDataResult.status === 'fulfilled') {
      downstream.userData = userDataResult.value as unknown as Prisma.InputJsonValue;
      this.logger.log(`User data cleanup succeeded: ${JSON.stringify(userDataResult.value)}`);
    } else {
      const errorMessage =
        userDataResult.reason instanceof Error
          ? userDataResult.reason.message
          : String(userDataResult.reason);
      downstream.userData = { error: errorMessage };
      this.logger.warn(
        `User data cleanup failed for user IDs [${userIds.join(', ')}]: ${errorMessage}`,
      );
    }

    return downstream as Prisma.InputJsonValue;
  }
}
