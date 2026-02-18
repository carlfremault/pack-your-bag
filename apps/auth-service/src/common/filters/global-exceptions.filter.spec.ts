import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditEventType, AuditSeverity } from '@prisma-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import { AccountDeletedException } from '@/common/exceptions/forbidden.exceptions';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

import { GlobalExceptionsFilter } from './global-exceptions.filter';

function createMockHost(overrides?: { request?: object }) {
  const mockJson = vi.fn();
  const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
  const mockResponse = { status: mockStatus };
  const mockRequest = {
    url: '/test',
    method: 'POST',
    path: '/test',
    user: null,
    id: 'req-123',
    ...overrides?.request,
  };

  const host = {
    switchToHttp: vi.fn().mockReturnValue({
      getResponse: vi.fn().mockReturnValue(mockResponse),
      getRequest: vi.fn().mockReturnValue(mockRequest),
    }),
  };

  return { host, mockStatus, mockJson, mockRequest };
}

describe('GlobalExceptionsFilter', () => {
  let filter: GlobalExceptionsFilter;

  const mockAuditLogProvider = { auditRequest: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionsFilter,
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
      ],
    }).compile();

    filter = module.get<GlobalExceptionsFilter>(GlobalExceptionsFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('response shape', () => {
    it('should always return statusCode, message, error, and timestamp', () => {
      const { host, mockStatus, mockJson } = createMockHost();

      filter.catch(new NotFoundException('Not here'), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Not here',
          error: 'Not Found',
          timestamp: expect.any(String) as string,
        }),
      );
    });

    it('should respond 500 for a plain non-HttpException error', () => {
      const { host, mockStatus } = createMockHost();

      filter.catch(new Error('something exploded'), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should respond 500 for a thrown non-Error value', () => {
      const { host, mockStatus, mockJson } = createMockHost();

      filter.catch('just a string', host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An unexpected error occurred',
        }),
      );
    });
  });

  describe('ThrottlerException', () => {
    it('should audit SECURITY_RATE_LIMIT_EXCEEDED with WARN severity', () => {
      const { host } = createMockHost();

      filter.catch(new ThrottlerException(), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
          severity: AuditSeverity.WARN,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        }),
        expect.anything(),
      );
    });

    it('should include tracker in metadata when present on exception', () => {
      const { host } = createMockHost();
      const exception = new ThrottlerException() as ThrottlerException & { tracker: string };
      exception.tracker = 'user-ip-tracker';

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { tracker: 'user-ip-tracker' },
        }),
        expect.anything(),
      );
    });

    it('should include undefined tracker when not present on exception', () => {
      const { host } = createMockHost();

      filter.catch(new ThrottlerException(), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { tracker: undefined },
        }),
        expect.anything(),
      );
    });
  });

  describe('5xx - Internal Server Error', () => {
    it('should audit INTERNAL_SERVER_ERROR with ERROR severity', () => {
      const { host } = createMockHost();

      filter.catch(new Error('db crash'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.INTERNAL_SERVER_ERROR,
          severity: AuditSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'db crash',
        }),
        expect.anything(),
      );
    });

    it('should use "Unknown error" message for non-Error 5xx values', () => {
      const { host } = createMockHost();

      filter.catch({ weird: 'object' }, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.INTERNAL_SERVER_ERROR,
          message: 'Unknown error',
        }),
        expect.anything(),
      );
    });
  });

  describe('401 - Unauthorized', () => {
    it('should not call auditRequest (handled by AuthExceptionFilter)', () => {
      const { host } = createMockHost();

      filter.catch(new UnauthorizedException(), host as never);

      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });
  });

  describe('403 - AccountDeletedException', () => {
    it('should audit ACCOUNT_DELETION_ACCESS_ATTEMPT with INFO severity', () => {
      const { host } = createMockHost();

      filter.catch(new AccountDeletedException(20), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.ACCOUNT_DELETION_ACCESS_ATTEMPT,
          severity: AuditSeverity.INFO,
          statusCode: HttpStatus.FORBIDDEN,
        }),
        expect.anything(),
      );
    });

    it('should use the cause string as the audit message', () => {
      const { host } = createMockHost();

      filter.catch(new AccountDeletedException(3), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account deleted, 3 days remaining',
        }),
        expect.anything(),
      );
    });

    it('should include "0 days remaining" in the audit message when daysRemaining is 0', () => {
      const { host } = createMockHost();

      filter.catch(new AccountDeletedException(0), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account deleted, 0 days remaining',
        }),
        expect.anything(),
      );
    });
  });

  describe('403 - Generic ForbiddenException', () => {
    it('should audit AUTHORIZATION_FAILED with WARN severity', () => {
      const { host } = createMockHost();

      filter.catch(new ForbiddenException('No access'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.AUTHORIZATION_FAILED,
          severity: AuditSeverity.WARN,
          statusCode: HttpStatus.FORBIDDEN,
          message: 'No access',
        }),
        expect.anything(),
      );
    });
  });

  describe('400 - InvalidTokenException', () => {
    it('should audit INVALID_TOKEN with WARN severity', () => {
      const { host } = createMockHost();

      filter.catch(new InvalidTokenException('Token expired'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.INVALID_TOKEN,
          severity: AuditSeverity.WARN,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Token expired',
        }),
        expect.anything(),
      );
    });

    it('should fall back to the default cause when no internal detail is provided', () => {
      const { host } = createMockHost();

      filter.catch(new InvalidTokenException(), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired token',
        }),
        expect.anything(),
      );
    });
  });

  describe('400 - Validation Error (BadRequestException with array message)', () => {
    it('should audit VALIDATION_ERROR with INFO severity', () => {
      const { host } = createMockHost();
      const exception = new BadRequestException({
        message: ['email must be valid', 'password is required'],
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.VALIDATION_ERROR,
          severity: AuditSeverity.INFO,
          statusCode: HttpStatus.BAD_REQUEST,
        }),
        expect.anything(),
      );
    });

    it('should pass the array of validation messages to the audit log', () => {
      const { host } = createMockHost();
      const messages = ['email must be valid', 'password is required'];
      const exception = new BadRequestException({
        message: messages,
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: messages,
        }),
        expect.anything(),
      );
    });

    it('should NOT audit as validation error when BadRequestException message is a plain string', () => {
      const { host } = createMockHost();

      // Plain string message → isValidationError returns false → falls through to auditUnexpectedClientError
      filter.catch(new BadRequestException('bad input'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.HTTP_ERROR,
        }),
        expect.anything(),
      );
    });
  });

  describe('409 - Conflict', () => {
    it('should audit CONFLICT_ERROR with WARN severity', () => {
      const { host } = createMockHost();

      filter.catch(new ConflictException('Already exists'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.CONFLICT_ERROR,
          severity: AuditSeverity.WARN,
          statusCode: HttpStatus.CONFLICT,
        }),
        expect.anything(),
      );
    });
  });

  describe('404 - Not Found', () => {
    it('should NOT call auditRequest for 404 (intentionally silent)', () => {
      const { host } = createMockHost();

      filter.catch(new NotFoundException(), host as never);

      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });
  });

  describe('Other 4xx - unexpected client errors', () => {
    it('should audit HTTP_ERROR with WARN severity', () => {
      const { host } = createMockHost();

      filter.catch(new UnprocessableEntityException('Cannot process'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.HTTP_ERROR,
          severity: AuditSeverity.WARN,
        }),
        expect.anything(),
      );
    });
  });

  describe('getExceptionResponse edge cases', () => {
    it('should handle HttpException with a plain string response', () => {
      const { host, mockJson } = createMockHost();

      const exception = new HttpException('Plain string message', HttpStatus.BAD_GATEWAY);

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Plain string message',
        }),
      );
    });

    it('should fall back to "An error occurred" for unexpected response object format', () => {
      const { host, mockJson } = createMockHost();
      // Craft an HttpException whose getResponse() returns an object without a message key
      const exception = new HttpException({ noMessageHere: true } as never, HttpStatus.CONFLICT);

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An error occurred',
        }),
      );
    });
  });
});
