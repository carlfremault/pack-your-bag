import { HttpStatus, InternalServerErrorException } from '@nestjs/common';

import { Prisma } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaExceptionFilter } from './prisma-exception.filter';

function createPrismaError(
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Test prisma error', {
    code,
    clientVersion: '5.0.0',
    meta,
  });
}

function createMockHost() {
  const mockJson = vi.fn();
  const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
  const mockResponse = { status: mockStatus };
  const mockRequest = { url: '/test', method: 'POST' };

  const host = {
    switchToHttp: vi.fn().mockReturnValue({
      getResponse: vi.fn().mockReturnValue(mockResponse),
      getRequest: vi.fn().mockReturnValue(mockRequest),
    }),
  };

  return { host, mockStatus, mockJson, mockRequest };
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;

  beforeEach(() => {
    vi.clearAllMocks();

    filter = new PrismaExceptionFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('logging', () => {
    it('should log an error for a P2002 conflict', () => {
      const { host } = createMockHost();
      const loggerSpy = vi.spyOn(filter['logger'], 'error');
      const exception = createPrismaError('P2002', { target: ['email'] });

      filter.catch(exception, host as never);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Data Integrity Error') as string,
        exception.stack,
      );
    });

    it('should log an error for a P2025 not found', () => {
      const { host } = createMockHost();
      const loggerSpy = vi.spyOn(filter['logger'], 'error');
      const exception = createPrismaError('P2025', { modelName: 'User', operation: 'findUnique' });

      filter.catch(exception, host as never);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Data Integrity Error') as string,
        exception.stack,
      );
    });

    it('should include the auditMessage in the log', () => {
      const { host } = createMockHost();
      const loggerSpy = vi.spyOn(filter['logger'], 'error');
      const exception = createPrismaError('P2002', { target: ['email'] });

      filter.catch(exception, host as never);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('email') as string,
        exception.stack,
      );
    });
  });

  describe('unhandled Prisma error codes', () => {
    it('should throw InternalServerErrorException for unknown error codes', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P1001');

      expect(() => filter.catch(exception, host as never)).toThrow(InternalServerErrorException);
    });
  });

  describe('HTTP responses (delegated to base class)', () => {
    it('should respond 409 Conflict for a P2002 duplicate', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createPrismaError('P2002', { target: ['email'] });

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
        }),
      );
    });

    it('should respond 404 Not Found for a P2025 missing record', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createPrismaError('P2025', { modelName: 'User', operation: 'findUnique' });

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        }),
      );
    });
  });
});
