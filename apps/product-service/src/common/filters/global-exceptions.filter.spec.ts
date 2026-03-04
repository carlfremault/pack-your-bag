import {
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditEventType } from '@repo/db';
import { BffAuthenticationException, safeCaptureSentryException } from '@repo/nestjs-common';

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

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionsFilter],
    }).compile();

    filter = module.get<GlobalExceptionsFilter>(GlobalExceptionsFilter);
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
      const warnSpy = vi.spyOn(filter['logger'], 'warn');

      filter.catch(new ThrottlerException(), host as never);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded') as string,
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
      const warnSpy = vi.spyOn(filter['logger'], 'warn');

      filter.catch(new BffAuthenticationException('bad secret'), host as never);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('BFF authentication exception') as string,
      );
    });

    it('should call safeCaptureSentryException with BFF_SECRET_MISMATCH event type', () => {
      const { host } = createMockHost();

      filter.catch(new BffAuthenticationException('bad secret'), host as never);

      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.BFF_SECRET_MISMATCH,
        }),
        filter['logger'],
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
      const errorSpy = vi.spyOn(filter['logger'], 'error');

      filter.catch(new Error('db crash'), host as never);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('db crash') as string,
        expect.anything(),
      );
    });

    it('should log "Unknown error" for non-Error thrown values', () => {
      const { host } = createMockHost();
      const errorSpy = vi.spyOn(filter['logger'], 'error');

      filter.catch({ weird: 'object' }, host as never);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error') as string,
        expect.anything(),
      );
    });

    it('should call safeCaptureSentryException with INTERNAL_SERVER_ERROR event type', () => {
      const { host } = createMockHost();

      filter.catch(new Error('db crash'), host as never);

      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.INTERNAL_SERVER_ERROR,
        }),
        filter['logger'],
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
      const warnSpy = vi.spyOn(filter['logger'], 'warn');

      filter.catch(new UnauthorizedException(), host as never);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unauthorized') as string);
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
      const warnSpy = vi.spyOn(filter['logger'], 'warn');

      filter.catch(new ForbiddenException(), host as never);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Forbidden') as string);
    });

    it('should NOT call safeCaptureSentryException', () => {
      const { host } = createMockHost();

      filter.catch(new ForbiddenException(), host as never);

      expect(safeCaptureSentryException).not.toHaveBeenCalled();
    });
  });

  describe('404 - Not Found', () => {
    it('should NOT log anything', () => {
      const { host } = createMockHost();
      const warnSpy = vi.spyOn(filter['logger'], 'warn');
      const errorSpy = vi.spyOn(filter['logger'], 'error');

      filter.catch(new NotFoundException(), host as never);

      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should NOT call safeCaptureSentryException', () => {
      const { host } = createMockHost();

      filter.catch(new NotFoundException(), host as never);

      expect(safeCaptureSentryException).not.toHaveBeenCalled();
    });
  });
});
