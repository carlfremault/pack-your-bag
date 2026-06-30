import { ArgumentsHost } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';

import { Prisma } from '@repo/db';
import { safeCaptureSentryException } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogService } from '@/modules/audit-log/audit-log.service';

import { RpcExceptionFilter } from './rpc-exception.filter';

vi.mock('@repo/nestjs-common', async (importOriginal) => {
  const original = await importOriginal<typeof import('@repo/nestjs-common')>();
  return {
    ...original,
    safeCaptureSentryException: vi.fn(),
  };
});

function createMockRpcHost(data: unknown = { some: 'payload' }) {
  const mockChannel = { ack: vi.fn(), nack: vi.fn() };
  const mockOriginalMsg = { fields: {}, properties: {}, content: Buffer.from('') };
  const mockContext = {
    getChannelRef: () => mockChannel,
    getMessage: () => mockOriginalMsg,
    getPattern: () => 'audit.log.created',
  } as unknown as RmqContext;

  const host = {
    getType: () => 'rpc',
    switchToRpc: () => ({
      getContext: () => mockContext,
      getData: () => data,
    }),
  } as unknown as ArgumentsHost;

  return { host, mockChannel, mockOriginalMsg };
}

describe('RpcExceptionFilter', () => {
  let filter: RpcExceptionFilter;
  let mockAuditLogService: { handleAuditLog: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockAuditLogService = { handleAuditLog: vi.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RpcExceptionFilter, { provide: AuditLogService, useValue: mockAuditLogService }],
    }).compile();

    filter = module.get<RpcExceptionFilter>(RpcExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('Prisma errors (database) → Sentry only', () => {
    it('should nack and report PrismaClientKnownRequestError to Sentry', async () => {
      const { host, mockChannel, mockOriginalMsg } = createMockRpcHost();
      const exception = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      await filter.catch(exception, host);

      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, false);
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception,
          request: null,
          errorCode: 'AUDIT_DB_ERROR_P2002',
          eventType: 'INTERNAL_SERVER_ERROR',
        }),
        expect.anything(),
      );
      expect(mockAuditLogService.handleAuditLog).not.toHaveBeenCalled();
    });

    it('should nack and report PrismaClientUnknownRequestError to Sentry', async () => {
      const { host, mockChannel } = createMockRpcHost();
      const exception = new Prisma.PrismaClientUnknownRequestError('Unknown error', {
        clientVersion: '5.0.0',
      });

      await filter.catch(exception, host);

      expect(mockChannel.nack).toHaveBeenCalled();
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'AUDIT_DB_ERROR_PrismaClientUnknownRequestError',
        }),
        expect.anything(),
      );
      expect(mockAuditLogService.handleAuditLog).not.toHaveBeenCalled();
    });

    it('should nack and report PrismaClientInitializationError to Sentry', async () => {
      const { host, mockChannel } = createMockRpcHost();
      const exception = new Prisma.PrismaClientInitializationError('Connection failed', '5.0.0');

      await filter.catch(exception, host);

      expect(mockChannel.nack).toHaveBeenCalled();
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'AUDIT_DB_ERROR_PrismaClientInitializationError',
        }),
        expect.anything(),
      );
      expect(mockAuditLogService.handleAuditLog).not.toHaveBeenCalled();
    });
  });

  describe('non-Prisma errors (processing) → DB audit log', () => {
    it('should nack and write error to DB audit log', async () => {
      const { host, mockChannel, mockOriginalMsg } = createMockRpcHost();
      const exception = new Error('Validation failed');

      await filter.catch(exception, host);

      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, false);
      expect(mockAuditLogService.handleAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'INTERNAL_SERVER_ERROR',
          severity: 'ERROR',
          errorCode: 'AUDIT_PROCESSING_ERROR',
          message: 'Validation failed',
        }),
      );
      expect(safeCaptureSentryException).not.toHaveBeenCalled();
    });

    it('should include pattern and payload in audit log metadata', async () => {
      const payload = { requestId: 'req-1', eventType: 'USER_LOGIN_SUCCESS' };
      const { host } = createMockRpcHost(payload);
      const exception = new Error('Parse error');

      await filter.catch(exception, host);

      expect(mockAuditLogService.handleAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            pattern: 'audit.log.created',
            originalPayload: expect.any(String) as string,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should handle non-Error thrown values', async () => {
      const { host, mockChannel } = createMockRpcHost();

      await filter.catch('string error', host);

      expect(mockChannel.nack).toHaveBeenCalled();
      expect(mockAuditLogService.handleAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unknown error',
        }),
      );
    });
  });

  describe('DB write failure fallback', () => {
    it('should fall back to Sentry when audit log DB write fails', async () => {
      mockAuditLogService.handleAuditLog.mockRejectedValue(new Error('DB connection lost'));
      const { host, mockChannel } = createMockRpcHost();
      const exception = new Error('Processing error');

      await filter.catch(exception, host);

      expect(mockChannel.nack).toHaveBeenCalled();
      expect(safeCaptureSentryException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception,
          request: null,
          errorCode: 'AUDIT_PROCESSING_ERROR_DB_FALLBACK',
          eventType: 'INTERNAL_SERVER_ERROR',
        }),
        expect.anything(),
      );
    });
  });
});
