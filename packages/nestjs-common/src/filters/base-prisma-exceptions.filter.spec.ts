import { HttpStatus, InternalServerErrorException } from '@nestjs/common';

import { Prisma } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BasePrismaExceptionsFilter, ErrorContext } from './base-prisma-exceptions.filter';

class TestPrismaExceptionsFilter extends BasePrismaExceptionsFilter {
  public handleException = vi.fn();

  constructor() {
    super(TestPrismaExceptionsFilter.name);
  }
}

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

  return { host, mockStatus, mockJson };
}

describe('BasePrismaExceptionsFilter', () => {
  let filter: TestPrismaExceptionsFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new TestPrismaExceptionsFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('P2002 - Unique constraint violation', () => {
    describe('standard fields (target array)', () => {
      it('should respond 409 Conflict for a duplicate field', () => {
        const { host, mockStatus, mockJson } = createMockHost();
        const exception = createPrismaError('P2002', { target: ['email'] });

        filter.catch(exception, host as never);

        expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: 'Email already exists.',
          }),
        );
      });

      it('should include multiple fields capitalized in the message', () => {
        const { host, mockJson } = createMockHost();
        const exception = createPrismaError('P2002', { target: ['email', 'username'] });

        filter.catch(exception, host as never);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Email, username already exist.',
          }),
        );
      });

      it('should use generic message when fields array is empty', () => {
        const { host, mockJson } = createMockHost();
        const exception = createPrismaError('P2002', { target: [] });

        filter.catch(exception, host as never);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.CONFLICT,
            message: 'Record already exists.',
          }),
        );
      });
    });

    describe('ID collision (System Error)', () => {
      it('should respond 500 when the conflicting field is id', () => {
        const { host, mockStatus, mockJson } = createMockHost();
        const exception = createPrismaError('P2002', { target: ['id'] });

        filter.catch(exception, host as never);

        expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
          }),
        );
      });
    });

    describe('driver adapter fields (driverAdapterError)', () => {
      it('should fall back to driverAdapterError fields when target is absent', () => {
        const { host, mockStatus } = createMockHost();
        const exception = createPrismaError('P2002', {
          driverAdapterError: {
            cause: {
              constraint: {
                fields: ['email'],
              },
            },
          },
        });

        filter.catch(exception, host as never);

        expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      });
    });
  });

  describe('P2025 - Record not found', () => {
    it('should respond 404 Not Found for a standard missing record', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createPrismaError('P2025', {
        modelName: 'User',
        operation: 'findUnique',
      });

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        }),
      );
    });

    it('should respond 400 Bad Request for a nested connect operation', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createPrismaError('P2025', {
        modelName: 'Role',
        operation: 'nested connect',
      });

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        }),
      );
    });

    it('should fall back to "record" when no model name is available in meta', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P2025', {});

      filter.catch(exception, host as never);

      const [errorContext] = filter.handleException.mock.calls[0] as [ErrorContext];
      expect(errorContext.auditMessage).toContain('record');
    });

    it('should prefer meta.model over meta.modelName', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P2025', {
        model: 'Post',
        modelName: 'OldModel',
        operation: 'findUnique',
      });

      filter.catch(exception, host as never);

      const [errorContext] = filter.handleException.mock.calls[0] as [ErrorContext];
      expect(errorContext.auditMessage).toContain('Post');
    });
  });

  describe('handleException delegation', () => {
    it('should call handleException with the resolved ErrorContext and request', () => {
      const { host, mockJson } = createMockHost();
      const exception = createPrismaError('P2002', { target: ['email'] });

      filter.catch(exception, host as never);

      expect(filter.handleException).toHaveBeenCalledOnce();
      const [errorContext, caughtException, request] = filter.handleException.mock.calls[0] as [
        ErrorContext,
        Prisma.PrismaClientKnownRequestError,
        Request,
      ];
      expect(errorContext.statusCode).toBe(HttpStatus.CONFLICT);
      expect(caughtException).toBe(exception);
      expect(request).toBeDefined();
      // Response JSON is sent by the base class after handleException returns
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: HttpStatus.CONFLICT }),
      );
    });

    it('should send the JSON response after handleException returns', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createPrismaError('P2025', { modelName: 'User', operation: 'findUnique' });

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          timestamp: expect.any(String) as string,
        }),
      );
    });
  });

  describe('unhandled Prisma error codes', () => {
    it('should throw InternalServerErrorException for unknown error codes', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P1001'); // Connection error - not handled

      expect(() => filter.catch(exception, host as never)).toThrow(InternalServerErrorException);
    });

    it('should not call handleException for unknown error codes', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P3000');

      try {
        filter.catch(exception, host as never);
      } catch {
        // expected
      }

      expect(filter.handleException).not.toHaveBeenCalled();
    });
  });
});
