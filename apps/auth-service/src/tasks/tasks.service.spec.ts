import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import { MS_PER_DAY, MS_PER_HOUR, RMQ_PUBLISHERS } from '@repo/nestjs-common';
import { AuditLogProvider } from '@repo/nestjs-common';

import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { UserService } from '@/modules/user/user.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';

import { TasksService } from './tasks.service';

const MOCK_CONFIG = {
  AUTH_REFRESH_TOKEN_DB_RETENTION_DAYS: 14,
  AUTH_USER_DELETE_RETENTION_DAYS: 30,
  AUTH_VERIFICATION_TOKEN_RETENTION_DAYS: 1,
  AUTH_GUEST_SESSION_TTL_HOURS: 24,
} as const;

describe('TasksService', () => {
  let service: TasksService;

  const mockConfigService = {
    getOrThrow: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      const value = MOCK_CONFIG[key as keyof typeof MOCK_CONFIG];
      if (value === undefined && defaultValue === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return (value ?? defaultValue) as T;
    }),
  };

  const mockRefreshTokenService = { deleteRefreshTokens: vi.fn() };
  const mockVerificationTokenService = { deleteVerificationTokens: vi.fn() };
  const mockAuditLogProvider = { auditRequest: vi.fn(), requestAnonymization: vi.fn() };
  const mockUserService = { getUsers: vi.fn(), hardDeleteUsers: vi.fn() };
  const mockCleanupProductClient = {
    emit: vi.fn().mockReturnValue(of(undefined)),
  };
  const mockCleanupUserDataClient = {
    emit: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-17T12:00:00Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: VerificationTokenService, useValue: mockVerificationTokenService },
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RMQ_PUBLISHERS.USER_CLEANUP_PRODUCT, useValue: mockCleanupProductClient },
        { provide: RMQ_PUBLISHERS.USER_CLEANUP_USER_DATA, useValue: mockCleanupUserDataClient },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupExpiredRefreshTokens', () => {
    it('should successfully clean up refresh tokens and audit the result', async () => {
      mockRefreshTokenService.deleteRefreshTokens.mockResolvedValue({ count: 5 });

      await service.cleanupExpiredRefreshTokens();

      expect(mockRefreshTokenService.deleteRefreshTokens).toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          message: expect.stringContaining('Cleaned up 5 expired/revoked tokens') as string,
        }),
      );
    });

    it('should catch errors and audit them with ERROR severity', async () => {
      mockRefreshTokenService.deleteRefreshTokens.mockRejectedValue(new Error('DB Failure'));

      await service.cleanupExpiredRefreshTokens();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: expect.stringContaining('Refresh token cleanup failed: DB Failure') as string,
        }),
      );
    });

    it('should fall back to String(error) when a non-Error value is thrown', async () => {
      mockRefreshTokenService.deleteRefreshTokens.mockRejectedValue('raw string error');

      await service.cleanupExpiredRefreshTokens();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: AuditLogSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Refresh token cleanup failed: raw string error',
        }),
      );
    });
  });

  describe('cleanupDeletedUsers', () => {
    it('should do nothing if no users are pending deletion', async () => {
      mockUserService.getUsers.mockResolvedValue([]);

      await service.cleanupDeletedUsers();

      expect(mockUserService.hardDeleteUsers).not.toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No users to delete',
        }),
      );
    });

    it('should perform hard delete and emit cleanup events when users are found', async () => {
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }];
      mockUserService.getUsers.mockResolvedValue(mockUsers);
      mockUserService.hardDeleteUsers.mockResolvedValue({
        deletedUsers: 2,
        deletedTokens: 4,
      });

      await service.cleanupDeletedUsers();
      await vi.runAllTimersAsync();

      expect(mockUserService.hardDeleteUsers).toHaveBeenCalledWith(['user-1', 'user-2']);
      expect(mockAuditLogProvider.requestAnonymization).toHaveBeenCalledWith(['user-1', 'user-2']);
      expect(mockCleanupProductClient.emit).toHaveBeenCalledWith('user.cleanup.product', [
        'user-1',
        'user-2',
      ]);
      expect(mockCleanupUserDataClient.emit).toHaveBeenCalledWith('user.cleanup.user_data', [
        'user-1',
        'user-2',
      ]);
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          message: expect.stringContaining('Cleaned up 2 deleted users') as string,
        }),
      );
    });

    it('should not emit cleanup events when no users are deleted', async () => {
      mockUserService.getUsers.mockResolvedValue([]);

      await service.cleanupDeletedUsers();

      expect(mockCleanupProductClient.emit).not.toHaveBeenCalled();
      expect(mockCleanupUserDataClient.emit).not.toHaveBeenCalled();
    });

    it('should handle errors during user cleanup', async () => {
      mockUserService.getUsers.mockRejectedValue(new Error('User Fetch Failed'));

      await service.cleanupDeletedUsers();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: expect.stringContaining(
            'Deleted users cleanup failed: User Fetch Failed',
          ) as string,
        }),
      );
    });

    it('should fall back to String(error) when a non-Error value is thrown', async () => {
      mockUserService.getUsers.mockRejectedValue(42);

      await service.cleanupDeletedUsers();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: AuditLogSeverity.ERROR,
          message: 'Deleted users cleanup failed: 42',
        }),
      );
    });
  });

  describe('cleanupVerificationTokens', () => {
    it('should successfully clean up verification tokens and audit the result', async () => {
      const now = new Date().getTime();
      const cutoff = new Date(now - 1 * MS_PER_DAY);
      mockVerificationTokenService.deleteVerificationTokens.mockResolvedValue({ count: 10 });

      await service.cleanupVerificationTokens();

      expect(mockVerificationTokenService.deleteVerificationTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          OR: [{ expiresAt: { lt: cutoff } }, { used: true }],
        }),
      );

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          message: expect.stringContaining(
            `Cleaned up 10 expired/used verification tokens. Cutoff: ${cutoff.toISOString()}`,
          ) as string,
          metadata: { count: 10, cutoff: cutoff.toISOString() },
        }),
      );
    });

    it('should catch errors and audit them with ERROR severity', async () => {
      mockVerificationTokenService.deleteVerificationTokens.mockRejectedValue(
        new Error('DB Failure'),
      );

      await service.cleanupVerificationTokens();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: expect.stringContaining(
            'Verification token cleanup failed: DB Failure',
          ) as string,
        }),
      );
    });

    it('should fall back to String(error) when a non-Error value is thrown', async () => {
      mockVerificationTokenService.deleteVerificationTokens.mockRejectedValue(null);

      await service.cleanupVerificationTokens();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: AuditLogSeverity.ERROR,
          message: 'Verification token cleanup failed: null',
        }),
      );
    });
  });

  describe('cleanupExpiredGuests', () => {
    const expectedCutoff = new Date(new Date('2026-02-17T12:00:00Z').getTime() - 24 * MS_PER_HOUR);

    it('should do nothing if no expired guest sessions are found', async () => {
      mockUserService.getUsers.mockResolvedValue([]);

      await service.cleanupExpiredGuests();

      expect(mockUserService.getUsers).toHaveBeenCalledWith({
        isGuest: true,
        lastActiveAt: { lt: expectedCutoff },
      });
      expect(mockUserService.hardDeleteUsers).not.toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No expired guest sessions to clean up',
        }),
      );
    });

    it('should hard delete expired guests and emit cleanup events', async () => {
      mockUserService.getUsers.mockResolvedValue([{ id: 'guest-1' }, { id: 'guest-2' }]);
      mockUserService.hardDeleteUsers.mockResolvedValue({
        deletedUsers: 2,
        deletedTokens: 3,
      });

      await service.cleanupExpiredGuests();
      await vi.runAllTimersAsync();

      expect(mockUserService.hardDeleteUsers).toHaveBeenCalledWith(['guest-1', 'guest-2']);
      expect(mockAuditLogProvider.requestAnonymization).toHaveBeenCalledWith([
        'guest-1',
        'guest-2',
      ]);
      expect(mockCleanupProductClient.emit).toHaveBeenCalledWith('user.cleanup.product', [
        'guest-1',
        'guest-2',
      ]);
      expect(mockCleanupUserDataClient.emit).toHaveBeenCalledWith('user.cleanup.user_data', [
        'guest-1',
        'guest-2',
      ]);
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          message: expect.stringContaining('Cleaned up 2 expired guests') as string,
          metadata: expect.objectContaining({
            guestCutoff: expectedCutoff.toISOString(),
          }) as object,
        }),
      );
    });

    it('should catch errors and audit them with ERROR severity', async () => {
      mockUserService.getUsers.mockRejectedValue(new Error('Guest Fetch Failed'));

      await service.cleanupExpiredGuests();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: expect.stringContaining(
            'Guest session cleanup failed: Guest Fetch Failed',
          ) as string,
        }),
      );
    });
  });
});
