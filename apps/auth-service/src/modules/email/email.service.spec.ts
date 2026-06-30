import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { AuditEventType, AuditSeverity } from '@repo/db';
import { safeCaptureSentryException } from '@repo/nestjs-common';
import { AuditLogProvider } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BrevoService } from '@/modules/email/brevo.service';
import { EmailService } from '@/modules/email/email.service';

vi.mock('@repo/nestjs-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/nestjs-common')>();
  return {
    ...actual,
    safeCaptureSentryException: vi.fn(),
  };
});

const MOCK_CONFIG = {
  AUTH_MAIL_MAX_RETRIES: 3,
  AUTH_MAIL_RETRY_DELAY_MS: 1000,
} as const;

describe('EmailService', () => {
  let service: EmailService;

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

  const mockBrevoService = {
    isEnabled: true,
    sendTemplate: vi.fn(),
    isFatalBrevoError: vi.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
        { provide: BrevoService, useValue: mockBrevoService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailWithRetry', () => {
    const mockMailOptions = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'Test email content',
      html: '<p>Test email content</p>',
    };

    const mockErrorContext = {
      userId: 'user-123',
      emailType: 'PASSWORD_RESET_REQUEST' as const,
      metadata: { resetToken: 'token123...' },
    };

    it('should send email successfully on first attempt', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendEmailWithRetry(mockMailOptions, mockErrorContext);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(mockMailOptions);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(safeCaptureSentryException).not.toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });

    it('should retry on transient failures', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockMailerService.sendMail
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce(undefined);

      await service.sendEmailWithRetry(mockMailOptions, mockErrorContext);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(maxRetries);
      expect(safeCaptureSentryException).not.toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });

    it('should use exponential backoff for retries', async () => {
      const retryDelayMs = mockConfigService.getOrThrow('AUTH_MAIL_RETRY_DELAY_MS') as number;
      vi.useFakeTimers();

      mockMailerService.sendMail
        .mockRejectedValueOnce(new Error('Retry 1'))
        .mockRejectedValueOnce(new Error('Retry 2'))
        .mockResolvedValueOnce(undefined);

      const promise = service.sendEmailWithRetry(mockMailOptions, mockErrorContext);

      // First attempt
      await vi.advanceTimersByTimeAsync(0);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);

      // Second attempt (after 1x delay)
      await vi.advanceTimersByTimeAsync(retryDelayMs * 1);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);

      // Third attempt (after 2x delay)
      await vi.advanceTimersByTimeAsync(retryDelayMs * 2);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(3);

      await promise;

      vi.useRealTimers();
    });

    it('should not retry on fatal errors - invalid address', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('invalid address'));

      await service.sendEmailWithRetry(mockMailOptions, mockErrorContext);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(safeCaptureSentryException).toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalled();
    });

    it('should report to Sentry after max retries', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP timeout'));

      await service.sendEmailWithRetry(mockMailOptions, mockErrorContext);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(maxRetries);
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception: expect.any(Error) as Error,
          errorCode: AuditEventType.EMAIL_SEND_FAILED,
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          fingerprint: ['PASSWORD_RESET_REQUEST', 'EMAIL_SEND_FAILED'],
          level: 'error',
        }),
        expect.anything(),
      );
    });

    it('should report to audit log after max retries', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP timeout'));

      await service.sendEmailWithRetry(mockMailOptions, mockErrorContext);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(maxRetries);
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          severity: AuditSeverity.ERROR,
          userId: mockErrorContext.userId,
          message: expect.stringContaining('Failed to send PASSWORD_RESET_REQUEST') as string,
          metadata: expect.objectContaining({
            emailType: 'PASSWORD_RESET_REQUEST',
            attempts: maxRetries,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should report to Sentry and audit log on fatal errors', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('invalid address'));

      await service.sendEmailWithRetry(mockMailOptions, mockErrorContext);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception: expect.any(Error) as Error,
          errorCode: AuditEventType.EMAIL_SEND_FAILED,
        }),
        expect.anything(),
      );
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          severity: AuditSeverity.ERROR,
        }),
      );
    });
  });

  describe('isBrevoEnabled', () => {
    it('should return true when brevo service is enabled', () => {
      mockBrevoService.isEnabled = true;
      expect(service.isBrevoEnabled).toBe(true);
    });

    it('should return false when brevo service is disabled', () => {
      mockBrevoService.isEnabled = false;
      expect(service.isBrevoEnabled).toBe(false);
    });
  });

  describe('sendTemplateWithRetry', () => {
    const mockTemplateOptions = {
      templateId: 1,
      to: 'test@example.com',
      params: { resetLink: 'https://test.com/reset' },
    };

    const mockErrorContext = {
      userId: 'user-123',
      emailType: 'PASSWORD_RESET_REQUEST' as const,
    };

    it('should send template successfully on first attempt', async () => {
      mockBrevoService.sendTemplate.mockResolvedValue(undefined);

      await service.sendTemplateWithRetry(mockTemplateOptions, mockErrorContext);

      expect(mockBrevoService.sendTemplate).toHaveBeenCalledWith(mockTemplateOptions);
      expect(mockBrevoService.sendTemplate).toHaveBeenCalledTimes(1);
      expect(safeCaptureSentryException).not.toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });

    it('should retry on transient failures', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockBrevoService.sendTemplate
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce(undefined);

      await service.sendTemplateWithRetry(mockTemplateOptions, mockErrorContext);

      expect(mockBrevoService.sendTemplate).toHaveBeenCalledTimes(maxRetries);
      expect(safeCaptureSentryException).not.toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });

    it('should use exponential backoff for retries', async () => {
      const retryDelayMs = mockConfigService.getOrThrow('AUTH_MAIL_RETRY_DELAY_MS') as number;
      vi.useFakeTimers();

      mockBrevoService.sendTemplate
        .mockRejectedValueOnce(new Error('Retry 1'))
        .mockRejectedValueOnce(new Error('Retry 2'))
        .mockResolvedValueOnce(undefined);

      const promise = service.sendTemplateWithRetry(mockTemplateOptions, mockErrorContext);

      await vi.advanceTimersByTimeAsync(0);
      expect(mockBrevoService.sendTemplate).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(retryDelayMs * 1);
      expect(mockBrevoService.sendTemplate).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(retryDelayMs * 2);
      expect(mockBrevoService.sendTemplate).toHaveBeenCalledTimes(3);

      await promise;

      vi.useRealTimers();
    });

    it('should not retry on fatal Brevo errors', async () => {
      mockBrevoService.sendTemplate.mockRejectedValue(new Error('Unauthorized'));
      mockBrevoService.isFatalBrevoError.mockReturnValue(true);

      await service.sendTemplateWithRetry(mockTemplateOptions, mockErrorContext);

      expect(mockBrevoService.sendTemplate).toHaveBeenCalledTimes(1);
      expect(safeCaptureSentryException).toHaveBeenCalled();
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalled();
    });

    it('should report to Sentry and audit log after max retries', async () => {
      const maxRetries = mockConfigService.getOrThrow('AUTH_MAIL_MAX_RETRIES') as number;
      mockBrevoService.sendTemplate.mockRejectedValue(new Error('API timeout'));
      mockBrevoService.isFatalBrevoError.mockReturnValue(false);

      await service.sendTemplateWithRetry(mockTemplateOptions, mockErrorContext);

      expect(mockBrevoService.sendTemplate).toHaveBeenCalledTimes(maxRetries);
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception: expect.any(Error) as Error,
          errorCode: AuditEventType.EMAIL_SEND_FAILED,
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          fingerprint: ['PASSWORD_RESET_REQUEST', 'EMAIL_SEND_FAILED'],
          level: 'error',
        }),
        expect.anything(),
      );
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.EMAIL_SEND_FAILED,
          severity: AuditSeverity.ERROR,
          userId: mockErrorContext.userId,
          message: expect.stringContaining('Failed to send PASSWORD_RESET_REQUEST') as string,
          metadata: expect.objectContaining({
            emailType: 'PASSWORD_RESET_REQUEST',
            attempts: maxRetries,
          }) as Record<string, unknown>,
        }),
      );
    });
  });
});
