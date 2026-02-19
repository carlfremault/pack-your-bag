import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditEventType, AuditSeverity, Prisma } from '@prisma-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

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

  return { host, mockStatus, mockJson };
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;

  const mockAuditLogProvider = { auditRequest: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaExceptionFilter,
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
      ],
    }).compile();

    filter = module.get<PrismaExceptionFilter>(PrismaExceptionFilter);
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

      it('should audit with ERROR severity for ID collision', () => {
        const { host } = createMockHost();
        const exception = createPrismaError('P2002', { target: ['id'] });

        filter.catch(exception, host as never);

        expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: AuditEventType.CONFLICT_ERROR,
            severity: AuditSeverity.ERROR,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: expect.stringContaining('ID Collision') as string,
          }),
          expect.anything(),
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

    describe('audit logging', () => {
      it('should audit with WARN severity for a standard duplicate', () => {
        const { host } = createMockHost();
        const exception = createPrismaError('P2002', { target: ['email'] });

        filter.catch(exception, host as never);

        expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: AuditEventType.CONFLICT_ERROR,
            severity: AuditSeverity.WARN,
            statusCode: HttpStatus.CONFLICT,
            message: expect.stringContaining('email') as string,
          }),
          expect.anything(),
        );
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

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('record') as string,
        }),
        expect.anything(),
      );
    });

    it('should prefer meta.model over meta.modelName', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P2025', {
        model: 'Post',
        modelName: 'OldModel',
        operation: 'findUnique',
      });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Post') as string,
        }),
        expect.anything(),
      );
    });

    it('should audit with WARN severity and RESOURCE_NOT_FOUND event type', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P2025', { modelName: 'User' });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.RESOURCE_NOT_FOUND,
          severity: AuditSeverity.WARN,
        }),
        expect.anything(),
      );
    });
  });

  describe('unhandled Prisma error codes', () => {
    it('should throw InternalServerErrorException for unknown error codes', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P1001'); // Connection error - not handled

      expect(() => filter.catch(exception, host as never)).toThrow(InternalServerErrorException);
    });

    it('should not call auditRequest for unknown error codes', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P3000');

      try {
        filter.catch(exception, host as never);
      } catch {
        // expected
      }

      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });
  });
});
