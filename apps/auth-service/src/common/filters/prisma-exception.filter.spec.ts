import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditEventType, AuditSeverity, Prisma } from '@repo/db';
import { AuditLogProvider } from '@repo/nestjs-common';

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

  describe('P2002 - audit logging', () => {
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

    it('should audit with ERROR severity for an ID collision', () => {
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

    it('should pass errorCode in the audit payload', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P2002', { target: ['email'] });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'Conflict' }),
        expect.anything(),
      );
    });

    it('should pass the request object to auditRequest', () => {
      const { host, mockRequest } = createMockHost();
      const exception = createPrismaError('P2002', { target: ['email'] });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.anything(),
        mockRequest,
      );
    });
  });

  describe('P2025 - audit logging', () => {
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

    it('should audit with the model name in the message', () => {
      const { host } = createMockHost();
      const exception = createPrismaError('P2025', { modelName: 'User', operation: 'findUnique' });

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User') as string,
        }),
        expect.anything(),
      );
    });

    it('should fall back to "record" in audit message when no model name is in meta', () => {
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

    it('should prefer meta.model over meta.modelName in audit message', () => {
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
  });

  describe('unhandled Prisma error codes', () => {
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
