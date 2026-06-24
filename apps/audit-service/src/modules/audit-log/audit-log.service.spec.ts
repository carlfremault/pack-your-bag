import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import type { AuditLogMessage } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { AuditLogService } from './audit-log.service';

vi.mock('uuid', () => ({
  v7: vi.fn(() => '00000000-0000-7000-8000-000000000001'),
}));

describe('AuditLogService', () => {
  let service: AuditLogService;

  const mockPrismaService = {
    auditLogEntry: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleAuditLog', () => {
    const baseMessage: AuditLogMessage = {
      requestId: 'req-123',
      eventType: 'USER_LOGIN_SUCCESS',
      severity: 'INFO',
      userId: 'user-123',
      ipAddress: '192.168.0.***',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      path: '/auth/login',
      method: 'POST',
      statusCode: 200,
      message: 'User logged in',
    };

    it('should create an audit log entry with parsed device info', async () => {
      mockPrismaService.auditLogEntry.create.mockResolvedValue({});

      await service.handleAuditLog(baseMessage);

      expect(mockPrismaService.auditLogEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: '00000000-0000-7000-8000-000000000001',
          requestId: 'req-123',
          eventType: 'USER_LOGIN_SUCCESS',
          severity: 'INFO',
          userId: 'user-123',
          ipAddress: '192.168.0.***',
          path: '/auth/login',
          method: 'POST',
          statusCode: 200,
          message: 'User logged in',
          metadata: {},
          deviceInfo: expect.objectContaining({
            browser: expect.any(String) as string,
            os: expect.any(String) as string,
          }) as object,
        }) as object,
      });
    });

    it('should set deviceInfo to null when userAgent is null', async () => {
      mockPrismaService.auditLogEntry.create.mockResolvedValue({});

      await service.handleAuditLog({ ...baseMessage, userAgent: null });

      expect(mockPrismaService.auditLogEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceInfo: null,
        }) as object,
      });
    });

    it('should pass through metadata when provided', async () => {
      mockPrismaService.auditLogEntry.create.mockResolvedValue({});

      await service.handleAuditLog({ ...baseMessage, metadata: { key: 'value' } });

      expect(mockPrismaService.auditLogEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { key: 'value' },
        }) as object,
      });
    });

    it('should propagate errors from the database', async () => {
      mockPrismaService.auditLogEntry.create.mockRejectedValue(new Error('DB failure'));

      await expect(service.handleAuditLog(baseMessage)).rejects.toThrow('DB failure');
    });
  });

  describe('anonymizeAuditLogs', () => {
    it('should anonymize audit logs matching the userId filter', async () => {
      mockPrismaService.auditLogEntry.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.anonymizeAuditLogs({ userId: { in: ['user-1', 'user-2'] } });

      expect(mockPrismaService.auditLogEntry.updateMany).toHaveBeenCalledWith({
        where: { userId: { in: ['user-1', 'user-2'] } },
        data: { userId: null, metadata: expect.anything() as object },
      });
      expect(result).toEqual({ count: 3 });
    });

    it('should throw BadRequestException when no userId filter is provided', async () => {
      await expect(service.anonymizeAuditLogs({ severity: 'INFO' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when complex filters are used', async () => {
      await expect(service.anonymizeAuditLogs({ NOT: { userId: 'user-1' } })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteAuditLogs', () => {
    it('should delete audit logs matching the createdAt filter', async () => {
      const cutoff = new Date('2026-01-01');
      mockPrismaService.auditLogEntry.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.deleteAuditLogs({ createdAt: { lt: cutoff } });

      expect(mockPrismaService.auditLogEntry.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: cutoff } },
      });
      expect(result).toEqual({ count: 10 });
    });

    it('should throw when no createdAt filter is provided', async () => {
      await expect(service.deleteAuditLogs({ userId: 'user-1' })).rejects.toThrow(
        'A createdAt filter must be provided for bulk audit log deletion.',
      );
    });

    it('should throw when NOT clause is used', async () => {
      await expect(
        service.deleteAuditLogs({ NOT: { createdAt: { lt: new Date() } } }),
      ).rejects.toThrow('NOT clauses are not allowed in audit log deletion for safety reasons.');
    });
  });
});
