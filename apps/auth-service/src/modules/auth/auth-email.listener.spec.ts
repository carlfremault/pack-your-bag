import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { safeCaptureSentryException } from '@/common/utils/captureSentryException';
import { AuditEventType, AuditSeverity } from '@/generated/prisma';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

import { AuthEmailListener } from './auth-email.listener';

vi.mock('@/common/utils/captureSentryException', () => ({
  safeCaptureSentryException: vi.fn(),
}));

const MOCK_CONFIG = {
  FRONTEND_URL: 'https://test.com',
  AUTH_MAIL_MAX_RETRIES: 3,
  AUTH_MAIL_RETRY_DELAY_MS: 1000,
} as const;

describe('AuthEmailListener', () => {
  let authEmailListener: AuthEmailListener;

  const mockConfigService = {
    getOrThrow: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      const value = MOCK_CONFIG[key as keyof typeof MOCK_CONFIG];
      if (value === undefined && defaultValue === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return (value ?? defaultValue) as T;
    }),
  };

  const mockMailerService = {
    sendMail: vi.fn(),
  };

  const mockAuditLogProvider = {
    auditRequest: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailListener,
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
      ],
    }).compile();

    authEmailListener = module.get<AuthEmailListener>(AuthEmailListener);
  });

  it('should be defined', () => {
    expect(authEmailListener).toBeDefined();
  });

  describe('handlePasswordResetRequested', () => {
    it('should send password reset email with correct content', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'abc123resettoken456',
      };

      await authEmailListener.handlePasswordResetRequested(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'testemail@test.com',
        subject: 'Password Reset Request',
        text: expect.stringContaining('https://test.com/reset-password?token=') as string,
        html: expect.stringContaining('https://test.com/reset-password?token=') as string,
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should URL encode the reset token', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'token+with/special&chars',
      };
      const encodedToken = encodeURIComponent(event.resetToken);

      await authEmailListener.handlePasswordResetRequested(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(encodedToken) as string,
          html: expect.stringContaining(encodedToken) as string,
        }),
      );
    });

    it('should retry on transient failures', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockMailerService.sendMail
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'token123',
      };

      await authEmailListener.handlePasswordResetRequested(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(maxRetries);
    });

    it('should not retry on fatal errors', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('invalid address'));

      const event = {
        userId: 'user-123',
        email: 'invalid@test.com',
        resetToken: 'token123',
      };

      await authEmailListener.handlePasswordResetRequested(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(safeCaptureSentryException).toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalled();
    });

    it('should report to Sentry and audit log after max retries', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP timeout'));

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'token123456',
      };

      await authEmailListener.handlePasswordResetRequested(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(maxRetries);
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception: expect.any(Error) as Error,
          errorCode: AuditEventType.EMAIL_SEND_FAILED,
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          fingerprint: ['PASSWORD_RESET_REQUEST', 'EMAIL_SEND_FAILED'],
        }),
        expect.anything(),
      );
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          severity: AuditSeverity.ERROR,
          userId: event.userId,
          message: expect.stringContaining('Failed to send PASSWORD_RESET_REQUEST') as string,
          metadata: expect.objectContaining({
            emailType: 'PASSWORD_RESET_REQUEST',
            attempts: 3,
            resetToken: expect.stringContaining('token123') as string,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should use exponential backoff for retries', async () => {
      const retryDelayMs = mockConfigService.getOrThrow('AUTH_MAIL_RETRY_DELAY_MS') as number;
      vi.useFakeTimers();

      mockMailerService.sendMail
        .mockRejectedValueOnce(new Error('Retry 1'))
        .mockRejectedValueOnce(new Error('Retry 2'))
        .mockResolvedValueOnce(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'token123',
      };

      const promise = authEmailListener.handlePasswordResetRequested(event);

      await vi.advanceTimersByTimeAsync(0);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(retryDelayMs * 1);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(retryDelayMs * 2);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(3);

      await promise;

      vi.useRealTimers();
    });
  });

  describe('handlePasswordResetConfirmed', () => {
    it('should send password reset confirmation email', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: new Date('2024-01-15T10:30:00Z'),
      };

      await authEmailListener.handlePasswordResetConfirmed(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'testemail@test.com',
        subject: 'Password Reset Confirmation',
        text: expect.stringContaining('successfully reset') as string,
        html: expect.stringContaining('successfully reset') as string,
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should include formatted timestamp in email', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const resetTimestamp = new Date('2024-01-15T10:30:00Z');
      const expectedTimestamp = resetTimestamp.toLocaleString();
      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp,
      };

      await authEmailListener.handlePasswordResetConfirmed(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(expectedTimestamp) as string,
          html: expect.stringContaining(expectedTimestamp) as string,
        }),
      );
    });

    it('should retry on transient failures', async () => {
      mockMailerService.sendMail
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: new Date(),
      };

      await authEmailListener.handlePasswordResetConfirmed(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should report errors after max retries', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: new Date(),
      };

      await authEmailListener.handlePasswordResetConfirmed(event);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(maxRetries);
      expect(safeCaptureSentryException).toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          metadata: expect.objectContaining({
            emailType: 'PASSWORD_RESET_CONFIRMATION',
          }) as Record<string, unknown>,
        }),
      );
    });
  });
});
