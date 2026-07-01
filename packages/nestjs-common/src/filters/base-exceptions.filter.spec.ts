import {
  BadRequestException,
  Catch,
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

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogProvider } from '../audit/audit-log.provider';
import { BffAuthenticationException } from '../exceptions/unauthorized.exceptions';
import { safeCaptureSentryException } from '../utils/captureSentryException';

import { BaseGlobalExceptionsFilter } from './base-exceptions.filter';

vi.mock('../utils/captureSentryException', () => ({
  safeCaptureSentryException: vi.fn(),
}));

const mockAuditLogProvider = { auditRequest: vi.fn() };

type HandleExceptionArgs = [
  exception: unknown,
  request: unknown,
  statusCode: number,
  errorCode: string,
  clientMessage?: string | string[],
];

// Overrides handleException to record calls — for testing HTTP response formatting in isolation
class ResponseTestFilter extends BaseGlobalExceptionsFilter {
  handleExceptionCalls: HandleExceptionArgs[] = [];

  constructor() {
    super(mockAuditLogProvider as unknown as AuditLogProvider);
  }

  protected override handleException(
    exception: unknown,
    request: unknown,
    statusCode: number,
    errorCode: string,
    clientMessage?: string | string[],
  ): void {
    this.handleExceptionCalls.push([exception, request, statusCode, errorCode, clientMessage]);
  }
}

// Uses default handleException — for testing audit behavior
@Catch()
class AuditTestFilter extends BaseGlobalExceptionsFilter {
  constructor(auditLogProvider: AuditLogProvider) {
    super(auditLogProvider, AuditTestFilter.name);
  }
}

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

// ============================================
// HTTP RESPONSE FORMATTING
// ============================================

describe('BaseGlobalExceptionsFilter — response formatting', () => {
  let filter: ResponseTestFilter;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ResponseTestFilter,
          useFactory: () => new ResponseTestFilter(),
        },
      ],
    }).compile();

    filter = module.get<ResponseTestFilter>(ResponseTestFilter);
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

    it('should respond 500 for a plain non-HttpException Error', () => {
      const { host, mockStatus, mockJson } = createMockHost();

      filter.catch(new Error('something exploded'), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'something exploded',
          error: 'Internal Server Error',
        }),
      );
    });

    it('should respond 500 for a thrown non-Error value', () => {
      const { host, mockStatus, mockJson } = createMockHost();

      filter.catch('just a string', host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An unexpected error occurred',
          error: 'Internal Server Error',
        }),
      );
    });
  });

  describe('handleException invocation', () => {
    it('should call handleException with exception, request, statusCode, errorCode, and clientMessage', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new NotFoundException('Not here'), host as never);

      expect(filter.handleExceptionCalls).toHaveLength(1);
      const call = filter.handleExceptionCalls[0];
      expect(call).toBeDefined();
      const [exception, request, statusCode, errorCode, clientMessage] = call!;
      expect(exception).toBeInstanceOf(NotFoundException);
      expect(request).toBe(mockRequest);
      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(errorCode).toBe('Not Found');
      expect(clientMessage).toBe('Not here');
    });

    it('should pass client message from Error for non-HttpException', () => {
      const { host } = createMockHost();

      filter.catch(new Error('db crash'), host as never);

      const call = filter.handleExceptionCalls[0];
      expect(call).toBeDefined();
      expect(call![4]).toBe('db crash');
    });

    it('should pass "An unexpected error occurred" for non-Error thrown value', () => {
      const { host } = createMockHost();

      filter.catch(42, host as never);

      const call = filter.handleExceptionCalls[0];
      expect(call).toBeDefined();
      expect(call![4]).toBe('An unexpected error occurred');
    });
  });

  describe('getStatusCode behavior', () => {
    it('should use exception.getStatus() for HttpException', () => {
      const { host, mockStatus } = createMockHost();

      filter.catch(new UnauthorizedException(), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('should use 500 for non-HttpException', () => {
      const { host, mockStatus } = createMockHost();

      filter.catch(new Error('oops'), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('getExceptionResponse and extractClientMessage', () => {
    it('should handle HttpException with a plain string response', () => {
      const { host, mockJson } = createMockHost();

      const exception = new HttpException('Plain string message', HttpStatus.BAD_GATEWAY);

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Plain string message',
          error: 'Error',
        }),
      );
    });

    it('should handle HttpException with object response (message and optional error)', () => {
      const { host, mockJson } = createMockHost();

      const exception = new BadRequestException({
        message: 'Invalid input',
        error: 'BAD_REQUEST',
      });

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid input',
          error: 'BAD_REQUEST',
        }),
      );
    });

    it('should fall back to "An error occurred" for unexpected response object format', () => {
      const { host, mockJson } = createMockHost();

      const exception = new HttpException({ noMessageHere: true } as never, HttpStatus.CONFLICT);

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An error occurred',
          error: 'Conflict',
        }),
      );
    });

    it('should pass validation-style array message to response and handleException', () => {
      const { host, mockJson } = createMockHost();
      const messages = ['email must be valid', 'password is required'];
      const exception = new BadRequestException({
        message: messages,
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: messages,
          error: 'Bad Request',
        }),
      );
      const call = filter.handleExceptionCalls[0];
      expect(call).toBeDefined();
      expect(call![4]).toEqual(messages);
    });
  });

  describe('getErrorCode / getDefaultErrorCode', () => {
    it('should use error from exception response when present', () => {
      const { host, mockJson } = createMockHost();

      filter.catch(
        new BadRequestException({ message: 'Bad', error: 'CUSTOM_CODE' }),
        host as never,
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CUSTOM_CODE',
        }),
      );
    });

    it('should map known status codes to default error strings', () => {
      const cases: Array<[HttpException, string]> = [
        [new BadRequestException(), 'Bad Request'],
        [new UnauthorizedException(), 'Unauthorized'],
        [new NotFoundException(), 'Not Found'],
      ];

      for (const [exception, expectedError] of cases) {
        const { host, mockJson } = createMockHost();
        filter.catch(exception, host as never);
        expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expectedError }));
      }
    });

    it('should use "Error" for unknown status codes', () => {
      const { host, mockJson } = createMockHost();

      filter.catch(new HttpException('Weird', 499 as HttpStatus), host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error',
        }),
      );
    });
  });

  describe('ThrottlerException', () => {
    it('should return 429 status and Too Many Requests error code', () => {
      const { host, mockStatus, mockJson } = createMockHost();

      filter.catch(new ThrottlerException(), host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
        }),
      );
    });

    it('should call handleException with exception and request', () => {
      const { host } = createMockHost();
      const exception = new ThrottlerException();

      filter.catch(exception, host as never);

      expect(filter.handleExceptionCalls).toHaveLength(1);
      const call = filter.handleExceptionCalls[0];
      expect(call).toBeDefined();
      expect(call![0]).toBe(exception);
      expect(call![2]).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(call![3]).toBe('Too Many Requests');
    });
  });
});

// ============================================
// AUDIT BEHAVIOR
// ============================================

describe('BaseGlobalExceptionsFilter — audit behavior', () => {
  let filter: AuditTestFilter;
  let errorLogSpy: ReturnType<typeof vi.spyOn>;
  let warnLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditTestFilter, { provide: AuditLogProvider, useValue: mockAuditLogProvider }],
    }).compile();

    filter = module.get<AuditTestFilter>(AuditTestFilter);

    errorLogSpy = vi.spyOn(filter['logger'], 'error').mockImplementation(() => {});
    warnLogSpy = vi.spyOn(filter['logger'], 'warn').mockImplementation(() => {});
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
