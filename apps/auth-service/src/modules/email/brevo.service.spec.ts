import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { BrevoError, BrevoTimeoutError } from '@getbrevo/brevo';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BrevoService } from '@/modules/email/brevo.service';

const mockSendTransacEmail = vi.fn();

vi.mock('@getbrevo/brevo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@getbrevo/brevo')>();

  class MockBrevoClient {
    transactionalEmails = {
      sendTransacEmail: mockSendTransacEmail,
    };
  }

  return {
    ...actual,
    BrevoClient: MockBrevoClient,
  };
});

describe('BrevoService', () => {
  describe('with API key configured', () => {
    let service: BrevoService;

    const mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'BREVO_API_KEY') return 'test-api-key';
        return undefined;
      }),
    };

    beforeEach(async () => {
      vi.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [BrevoService, { provide: ConfigService, useValue: mockConfigService }],
      }).compile();

      service = module.get<BrevoService>(BrevoService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should report as enabled', () => {
      expect(service.isEnabled).toBe(true);
    });

    it('should call sendTransacEmail with correct parameters', async () => {
      mockSendTransacEmail.mockResolvedValue({ messageId: 'msg-123' });

      await service.sendTemplate({
        templateId: 1,
        to: 'test@example.com',
        params: { resetLink: 'https://example.com/reset' },
      });

      expect(mockSendTransacEmail).toHaveBeenCalledWith({
        templateId: 1,
        to: [{ email: 'test@example.com' }],
        params: { resetLink: 'https://example.com/reset' },
      });
    });

    it('should propagate errors from Brevo API', async () => {
      mockSendTransacEmail.mockRejectedValue(new Error('API Error'));

      await expect(
        service.sendTemplate({
          templateId: 1,
          to: 'test@example.com',
          params: {},
        }),
      ).rejects.toThrow('API Error');
    });
  });

  describe('without API key configured', () => {
    let service: BrevoService;

    const mockConfigService = {
      get: vi.fn(() => undefined),
    };

    beforeEach(async () => {
      vi.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [BrevoService, { provide: ConfigService, useValue: mockConfigService }],
      }).compile();

      service = module.get<BrevoService>(BrevoService);
    });

    it('should report as disabled', () => {
      expect(service.isEnabled).toBe(false);
    });

    it('should throw when sendTemplate is called', async () => {
      await expect(
        service.sendTemplate({
          templateId: 1,
          to: 'test@example.com',
          params: {},
        }),
      ).rejects.toThrow('Brevo client is not configured');
    });
  });

  describe('isFatalBrevoError', () => {
    let service: BrevoService;

    const mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'BREVO_API_KEY') return 'test-api-key';
        return undefined;
      }),
    };

    beforeEach(async () => {
      vi.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [BrevoService, { provide: ConfigService, useValue: mockConfigService }],
      }).compile();

      service = module.get<BrevoService>(BrevoService);
    });

    it('should return false for timeout errors', () => {
      const error = new BrevoTimeoutError('Request timed out');
      expect(service.isFatalBrevoError(error)).toBe(false);
    });

    it('should return true for unauthorized errors', () => {
      const error = new BrevoError({ message: 'Unauthorized' });
      expect(service.isFatalBrevoError(error)).toBe(true);
    });

    it('should return true for template not found errors', () => {
      const error = new BrevoError({ message: 'Template not found' });
      expect(service.isFatalBrevoError(error)).toBe(true);
    });

    it('should return true for invalid parameter errors', () => {
      const error = new BrevoError({ message: 'Invalid parameter' });
      expect(service.isFatalBrevoError(error)).toBe(true);
    });

    it('should return false for generic BrevoErrors without matching message', () => {
      const error = new BrevoError({ message: 'Rate limit exceeded' });
      expect(service.isFatalBrevoError(error)).toBe(false);
    });

    it('should return false for non-Brevo errors', () => {
      const error = new Error('Network error');
      expect(service.isFatalBrevoError(error)).toBe(false);
    });
  });
});
