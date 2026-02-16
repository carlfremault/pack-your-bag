import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatLocaleDate } from '@/common/utils/formatLocaleDate';
import { EmailService } from '@/modules/email/email.service';

import { AuthEmailListener } from './auth-email.listener';

vi.mock('@/common/utils/captureSentryException', () => ({
  safeCaptureSentryException: vi.fn(),
}));

const MOCK_CONFIG = {
  FRONTEND_URL: 'https://test.com',
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

  const mockEmailService = {
    sendEmailWithRetry: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailListener,

        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authEmailListener = module.get<AuthEmailListener>(AuthEmailListener);
  });

  it('should be defined', () => {
    expect(authEmailListener).toBeDefined();
  });

  describe('handlePasswordResetRequested', () => {
    it('should call emailService with correct email content and context', async () => {
      mockEmailService.sendEmailWithRetry.mockResolvedValue(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'abc123resettoken456',
      };

      await authEmailListener.handlePasswordResetRequested(event);

      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledWith(
        {
          to: 'testemail@test.com',
          subject: 'Password Reset Request',
          text: expect.stringContaining('https://test.com/reset-password?token=') as string,
          html: expect.stringContaining('https://test.com/reset-password?token=') as string,
        },
        {
          userId: 'user-123',
          emailType: 'PASSWORD_RESET_REQUEST',
        },
      );
      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should URL encode the reset token', async () => {
      mockEmailService.sendEmailWithRetry.mockResolvedValue(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'token+with/special&chars',
      };
      const encodedToken = encodeURIComponent(event.resetToken);

      await authEmailListener.handlePasswordResetRequested(event);

      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(encodedToken) as string,
          html: expect.stringContaining(encodedToken) as string,
        }),
        {
          userId: 'user-123',
          emailType: 'PASSWORD_RESET_REQUEST',
        },
      );
    });
  });

  describe('handlePasswordResetConfirmed', () => {
    it('should call emailService with correct confirmation email content', async () => {
      mockEmailService.sendEmailWithRetry.mockResolvedValue(undefined);

      const event = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: formatLocaleDate(new Date('2024-01-15T10:30:00Z')),
      };

      await authEmailListener.handlePasswordResetConfirmed(event);

      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledWith(
        {
          to: 'testemail@test.com',
          subject: 'Password Reset Confirmation',
          text: expect.stringContaining('successfully reset') as string,
          html: expect.stringContaining('successfully reset') as string,
        },
        {
          userId: 'user-123',
          emailType: 'PASSWORD_RESET_CONFIRMATION',
        },
      );
      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledTimes(1);
    });
  });
});
