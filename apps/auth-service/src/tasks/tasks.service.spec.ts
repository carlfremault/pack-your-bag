import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditEventType, AuditSeverity } from '@repo/db';
import { MS_PER_DAY } from '@repo/nestjs-common';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { UserService } from '@/modules/user/user.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';

import { TasksService } from './tasks.service';

const MOCK_CONFIG = {
  AUTH_REFRESH_TOKEN_DB_RETENTION_DAYS: 14,
  AUDIT_LOG_INFO_RETENTION_DAYS: 30,
  AUDIT_LOG_ERROR_WARN_RETENTION_DAYS: 60,
  AUDIT_LOG_CRITICAL_RETENTION_DAYS: 90,
  AUTH_USER_DELETE_RETENTION_DAYS: 30,
  AUTH_VERIFICATION_TOKEN_RETENTION_DAYS: 1,
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
  const mockAuditLogService = { deleteAuditLogs: vi.fn() };
  const mockAuditLogProvider = { auditRequest: vi.fn() };
  const mockUserService = { getUsers: vi.fn(), hardDeleteUsers: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-17T12:00:00Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: VerificationTokenService, useValue: mockVerificationTokenService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
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
          eventType: AuditEventType.SCHEDULED_TASK,
          severity: AuditSeverity.INFO,
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
          eventType: AuditEventType.SCHEDULED_TASK,
          severity: AuditSeverity.ERROR,
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
          severity: AuditSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Refresh token cleanup failed: raw string error',
        }),
      );
    });
  });

  describe('cleanupAuditLogs', () => {
    it('should call deleteAuditLogs with correct cutoffs', async () => {
      const now = new Date().getTime();
      const infoCutoff = mockConfigService.getOrThrow('AUDIT_LOG_INFO_RETENTION_DAYS') as number;
      const errorCutoff = mockConfigService.getOrThrow(
        'AUDIT_LOG_ERROR_WARN_RETENTION_DAYS',
      ) as number;
      const criticalCutoff = mockConfigService.getOrThrow(
        'AUDIT_LOG_CRITICAL_RETENTION_DAYS',
      ) as number;

      mockAuditLogService.deleteAuditLogs.mockResolvedValue({ count: 10 });

      await service.cleanupAuditLogs();

      expect(mockAuditLogService.deleteAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          OR: expect.arrayContaining([
            {
              severity: AuditSeverity.INFO,
              createdAt: { lt: new Date(now - infoCutoff * MS_PER_DAY) },
            },
            {
              severity: { in: [AuditSeverity.WARN, AuditSeverity.ERROR] },
              createdAt: { lt: new Date(now - errorCutoff * MS_PER_DAY) },
            },
            {
              severity: AuditSeverity.CRITICAL,
              createdAt: { lt: new Date(now - criticalCutoff * MS_PER_DAY) },
            },
          ]) as object[],
        }),
      );
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            infoCutoff: new Date(now - infoCutoff * MS_PER_DAY).toISOString(),
            errorWarnCutoff: new Date(now - errorCutoff * MS_PER_DAY).toISOString(),
            criticalCutoff: new Date(now - criticalCutoff * MS_PER_DAY).toISOString(),
          }) as object,
        }),
      );
    });

    it('should catch and log errors when audit log deletion fails', async () => {
      mockAuditLogService.deleteAuditLogs.mockRejectedValue(new Error('Audit DB Fail'));

      await service.cleanupAuditLogs();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: AuditSeverity.ERROR,
          message: expect.stringContaining('Audit log cleanup failed: Audit DB Fail') as string,
        }),
      );
    });

    it('should fall back to String(error) when a non-Error value is thrown', async () => {
      mockAuditLogService.deleteAuditLogs.mockRejectedValue({ code: 'CUSTOM_ERR' });

      await service.cleanupAuditLogs();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: AuditSeverity.ERROR,
          message: expect.stringContaining('Audit log cleanup failed:') as string,
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

    it('should perform hard delete when users are found', async () => {
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }];
      mockUserService.getUsers.mockResolvedValue(mockUsers);
      mockUserService.hardDeleteUsers.mockResolvedValue({
        deletedUsers: 2,
        deletedTokens: 4,
        anonymizedAuditLogs: 10,
      });

      await service.cleanupDeletedUsers();

      expect(mockUserService.hardDeleteUsers).toHaveBeenCalledWith(['user-1', 'user-2']);
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.SCHEDULED_TASK,
          severity: AuditSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          message: expect.stringContaining('Cleaned up 2 deleted users') as string,
        }),
      );
    });

    it('should handle errors during user cleanup', async () => {
      mockUserService.getUsers.mockRejectedValue(new Error('User Fetch Failed'));

      await service.cleanupDeletedUsers();

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.SCHEDULED_TASK,
          severity: AuditSeverity.ERROR,
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
          severity: AuditSeverity.ERROR,
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
          eventType: AuditEventType.SCHEDULED_TASK,
          severity: AuditSeverity.INFO,
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
          eventType: AuditEventType.SCHEDULED_TASK,
          severity: AuditSeverity.ERROR,
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
          severity: AuditSeverity.ERROR,
          message: 'Verification token cleanup failed: null',
        }),
      );
    });
  });
});
