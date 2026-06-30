import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import {
  AuditLogProvider,
  BffAuthenticationException,
  safeCaptureSentryException,
} from '@repo/nestjs-common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GlobalExceptionsFilter } from './global-exceptions.filter';

vi.mock('@repo/nestjs-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/nestjs-common')>();
  return {
    ...actual,
    safeCaptureSentryException: vi.fn(),
  };
});

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
  let errorLogSpy: ReturnType<typeof vi.spyOn>;
  let warnLogSpy: ReturnType<typeof vi.spyOn>;
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

    // Suppress console output from the filter's logger during tests
    errorLogSpy = vi.spyOn(filter['logger'], 'error').mockImplementation(() => {});
    warnLogSpy = vi.spyOn(filter['logger'], 'warn').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('response shape (integration with base filter)', () => {
    it('should return statusCode, message, error, and timestamp for a typical exception', () => {
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
  });

  describe('ThrottlerException', () => {
    it('should log a warning', () => {
      const { host } = createMockHost();

      filter.catch(new ThrottlerException(), host as never);

      expect(warnLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded') as string,
      );
    });

    it('should emit an audit event with SECURITY_RATE_LIMIT_EXCEEDED', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new ThrottlerException(), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SECURITY_RATE_LIMIT_EXCEEDED,
          severity: AuditLogSeverity.WARN,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        }),
        mockRequest,
      );
    });

    it('should NOT call safeCaptureSentryException', () => {
      const { host } = createMockHost();

      filter.catch(new ThrottlerException(), host as never);

      expect(safeCaptureSentryException).not.toHaveBeenCalled();
    });

    it('should return 429 (base filter handles response)', () => {
      const { host, mockStatus } = createMockHost();

      filter.catch(new ThrottlerException(), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('BffAuthenticationException', () => {
    it('should log a warning', () => {
      const { host } = createMockHost();

      filter.catch(new BffAuthenticationException('bad secret'), host as never);

      expect(warnLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('BFF authentication exception') as string,
      );
    });

    it('should call safeCaptureSentryException with BFF_SECRET_MISMATCH event type', () => {
      const { host } = createMockHost();

      filter.catch(new BffAuthenticationException('bad secret'), host as never);

      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.BFF_SECRET_MISMATCH,
        }),
        filter['logger'],
      );
    });

    it('should emit an audit event with BFF_SECRET_MISMATCH and CRITICAL severity', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new BffAuthenticationException('bad secret'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.BFF_SECRET_MISMATCH,
          severity: AuditLogSeverity.CRITICAL,
          statusCode: HttpStatus.UNAUTHORIZED,
        }),
        mockRequest,
      );
    });

    it('should pass the exception and request to safeCaptureSentryException', () => {
      const { host, mockRequest } = createMockHost();
      const exception = new BffAuthenticationException('bad secret');

      filter.catch(exception, host as never);

      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception,
          request: mockRequest,
        }),
        filter['logger'],
      );
    });

    it('should return 401 (base filter handles response)', () => {
      const { host, mockStatus } = createMockHost();

      filter.catch(new BffAuthenticationException(), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('5xx - Internal Server Error', () => {
    it('should log an error with the exception message', () => {
      const { host } = createMockHost();

      filter.catch(new Error('db crash'), host as never);

      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('db crash') as string,
        expect.anything(),
      );
    });

    it('should log "Unknown error" for non-Error thrown values', () => {
      const { host } = createMockHost();

      filter.catch({ weird: 'object' }, host as never);

      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error') as string,
        expect.anything(),
      );
    });

    it('should call safeCaptureSentryException with INTERNAL_SERVER_ERROR event type', () => {
      const { host } = createMockHost();

      filter.catch(new Error('db crash'), host as never);

      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
        }),
        filter['logger'],
      );
    });

    it('should emit an audit event with INTERNAL_SERVER_ERROR and ERROR severity', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new Error('db crash'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
          severity: AuditLogSeverity.ERROR,
          message: 'db crash',
        }),
        mockRequest,
      );
    });

    it('should pass the exception and request to safeCaptureSentryException', () => {
      const { host, mockRequest } = createMockHost();
      const exception = new Error('db crash');

      filter.catch(exception, host as never);

      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception,
          request: mockRequest,
        }),
        filter['logger'],
      );
    });

    it('should return 500 (base filter handles response)', () => {
      const { host, mockStatus } = createMockHost();

      filter.catch(new Error('db crash'), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('401 - Unauthorized', () => {
    it('should log a warning', () => {
      const { host } = createMockHost();

      filter.catch(new UnauthorizedException(), host as never);

      expect(warnLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unauthorized') as string);
    });

    it('should emit an audit event with AUTHORIZATION_FAILED', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new UnauthorizedException(), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.AUTHORIZATION_FAILED,
          severity: AuditLogSeverity.WARN,
          statusCode: HttpStatus.UNAUTHORIZED,
        }),
        mockRequest,
      );
    });

    it('should NOT call safeCaptureSentryException', () => {
      const { host } = createMockHost();

      filter.catch(new UnauthorizedException(), host as never);

      expect(safeCaptureSentryException).not.toHaveBeenCalled();
    });
  });

  describe('403 - Forbidden', () => {
    it('should log a warning', () => {
      const { host } = createMockHost();

      filter.catch(new ForbiddenException(), host as never);

      expect(warnLogSpy).toHaveBeenCalledWith(expect.stringContaining('Forbidden') as string);
    });

    it('should emit an audit event with AUTHORIZATION_FAILED', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new ForbiddenException(), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.AUTHORIZATION_FAILED,
          severity: AuditLogSeverity.WARN,
          statusCode: HttpStatus.FORBIDDEN,
        }),
        mockRequest,
      );
    });

    it('should NOT call safeCaptureSentryException', () => {
      const { host } = createMockHost();

      filter.catch(new ForbiddenException(), host as never);

      expect(safeCaptureSentryException).not.toHaveBeenCalled();
    });
  });

  describe('400 - Validation Error', () => {
    it('should emit an audit event with VALIDATION_ERROR and INFO severity', () => {
      const { host, mockRequest } = createMockHost();
      const exception = new BadRequestException({
        statusCode: 400,
        message: ['field must not be empty'],
        error: 'Bad Request',
      });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.VALIDATION_ERROR,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.BAD_REQUEST,
        }),
        mockRequest,
      );
    });
  });

  describe('409 - Conflict', () => {
    it('should emit an audit event with CONFLICT_ERROR and WARN severity', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new ConflictException('Already exists'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.CONFLICT_ERROR,
          severity: AuditLogSeverity.WARN,
          statusCode: HttpStatus.CONFLICT,
        }),
        mockRequest,
      );
    });
  });

  describe('Other client errors', () => {
    it('should emit an audit event with HTTP_ERROR for unexpected client errors', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new UnprocessableEntityException('Bad data'), host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.HTTP_ERROR,
          severity: AuditLogSeverity.WARN,
        }),
        mockRequest,
      );
    });

    it('should log a warning for unexpected client errors', () => {
      const { host } = createMockHost();

      filter.catch(new UnprocessableEntityException('Bad data'), host as never);

      expect(warnLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected') as string,
        expect.anything(),
      );
    });
  });

  describe('404 - Not Found', () => {
    it('should NOT log anything', () => {
      const { host } = createMockHost();

      filter.catch(new NotFoundException(), host as never);

      expect(warnLogSpy).not.toHaveBeenCalled();
      expect(errorLogSpy).not.toHaveBeenCalled();
    });

    it('should NOT emit an audit event', () => {
      const { host } = createMockHost();

      filter.catch(new NotFoundException(), host as never);

      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });

    it('should NOT call safeCaptureSentryException', () => {
      const { host } = createMockHost();

      filter.catch(new NotFoundException(), host as never);

      expect(safeCaptureSentryException).not.toHaveBeenCalled();
    });
  });
});
