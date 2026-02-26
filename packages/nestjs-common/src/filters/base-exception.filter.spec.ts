import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerException } from '@nestjs/throttler';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BaseGlobalExceptionsFilter } from './base-exception.filter';

type HandleAuditingArgs = [
  exception: unknown,
  request: unknown,
  statusCode: number,
  errorCode: string,
  clientMessage?: string | string[],
];

class TestGlobalExceptionsFilter extends BaseGlobalExceptionsFilter {
  handleAuditingCalls: HandleAuditingArgs[] = [];

  protected handleException(
    exception: unknown,
    request: unknown,
    statusCode: number,
    errorCode: string,
    clientMessage?: string | string[],
  ): void {
    this.handleAuditingCalls.push([exception, request, statusCode, errorCode, clientMessage]);
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

describe('BaseGlobalExceptionsFilter', () => {
  let filter: TestGlobalExceptionsFilter;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TestGlobalExceptionsFilter,
          useFactory: () => new TestGlobalExceptionsFilter(),
        },
      ],
    }).compile();

    filter = module.get<TestGlobalExceptionsFilter>(TestGlobalExceptionsFilter);
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

  describe('handleAuditing invocation', () => {
    it('should call handleAuditing with exception, request, statusCode, errorCode, and clientMessage', () => {
      const { host, mockRequest } = createMockHost();

      filter.catch(new NotFoundException('Not here'), host as never);

      expect(filter.handleAuditingCalls).toHaveLength(1);
      const call = filter.handleAuditingCalls[0];
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

      const call = filter.handleAuditingCalls[0];
      expect(call).toBeDefined();
      expect(call![4]).toBe('db crash');
    });

    it('should pass "An unexpected error occurred" for non-Error thrown value', () => {
      const { host } = createMockHost();

      filter.catch(42, host as never);

      const call = filter.handleAuditingCalls[0];
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

    it('should pass validation-style array message to response and handleAuditing', () => {
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
      const call = filter.handleAuditingCalls[0];
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

    it('should call handleAuditing with exception and request (tracker is subclass concern)', () => {
      const { host } = createMockHost();
      const exception = new ThrottlerException();

      filter.catch(exception, host as never);

      expect(filter.handleAuditingCalls).toHaveLength(1);
      const call = filter.handleAuditingCalls[0];
      expect(call).toBeDefined();
      expect(call![0]).toBe(exception);
      expect(call![2]).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(call![3]).toBe('Too Many Requests');
    });
  });
});
