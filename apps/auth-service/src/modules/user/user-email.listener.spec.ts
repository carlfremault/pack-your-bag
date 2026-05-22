import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatLocaleDate } from '@/common/utils/formatLocaleDate';
import { EmailService } from '@/modules/email/email.service';

import { UserEmailListener } from './user-email.listener';

vi.mock('@repo/nestjs-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/nestjs-common')>();
  return {
    ...actual,
    safeCaptureSentryException: vi.fn(),
  };
});

const MOCK_CONFIG: Record<string, unknown> = {
  FRONTEND_URL: 'https://test.com',
};

describe('UserEmailListener', () => {
  let userEmailListener: UserEmailListener;

  const mockConfigService = {
    getOrThrow: vi.fn(<T = string>(key: string, defaultValue?: T): T => {
      const value = MOCK_CONFIG[key];
      if (value === undefined && defaultValue === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return (value ?? defaultValue) as T;
    }),
  };

  const mockEmailService = {
    sendEmailWithRetry: vi.fn(),
    sendTemplateWithRetry: vi.fn(),
    isBrevoEnabled: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockEmailService.isBrevoEnabled = false;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEmailListener,

        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    userEmailListener = module.get<UserEmailListener>(UserEmailListener);
  });

  it('should be defined', () => {
    expect(userEmailListener).toBeDefined();
  });

  describe('handleAccountDeletionRequested', () => {
    it('should call emailService with correct email content and context', async () => {
      mockEmailService.sendEmailWithRetry.mockResolvedValue(undefined);
      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        cancellationToken: 'abc123resettoken456',
        cancellationDate: formatLocaleDate(new Date(), 'en-GB'),
      };

      await userEmailListener.handleAccountDeletionRequested(event);

      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledWith(
        {
          to: 'testemail@test.com',
          subject: 'Account Deletion Request',
          text: expect.stringContaining('https://test.com/cancel-deletion?token=') as string,
          html: expect.stringContaining('https://test.com/cancel-deletion?token=') as string,
        },
        {
          userId: 'user-123',
          emailType: 'ACCOUNT_DELETION_REQUEST',
        },
      );
      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should URL encode the cancellation reset token', async () => {
      mockEmailService.sendEmailWithRetry.mockResolvedValue(undefined);
      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        cancellationToken: 'token+with/special&chars',
        cancellationDate: formatLocaleDate(new Date(), 'en-GB'),
      };

      const encodedToken = encodeURIComponent(event.cancellationToken);

      await userEmailListener.handleAccountDeletionRequested(event);

      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(encodedToken) as string,
          html: expect.stringContaining(encodedToken) as string,
        }),
        {
          userId: 'user-123',
          emailType: 'ACCOUNT_DELETION_REQUEST',
        },
      );
    });

    it('should use Brevo template when enabled', async () => {
      mockEmailService.isBrevoEnabled = true;
      mockEmailService.sendTemplateWithRetry.mockResolvedValue(undefined);
      MOCK_CONFIG['BREVO_TEMPLATE_ACCOUNT_DELETION_REQUEST'] = 40;

      const cancellationDate = formatLocaleDate(new Date(), 'en-GB');
      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        cancellationToken: 'abc123resettoken456',
        cancellationDate,
      };

      await userEmailListener.handleAccountDeletionRequested(event);

      expect(mockEmailService.sendTemplateWithRetry).toHaveBeenCalledWith(
        {
          templateId: 40,
          to: 'testemail@test.com',
          params: {
            cancellationLink: expect.stringContaining(
              'https://test.com/cancel-deletion?token=',
            ) as string,
            cancellationDate,
          },
        },
        {
          userId: 'user-123',
          emailType: 'ACCOUNT_DELETION_REQUEST',
        },
      );
      expect(mockEmailService.sendEmailWithRetry).not.toHaveBeenCalled();

      delete MOCK_CONFIG['BREVO_TEMPLATE_ACCOUNT_DELETION_REQUEST'];
    });
  });
});
