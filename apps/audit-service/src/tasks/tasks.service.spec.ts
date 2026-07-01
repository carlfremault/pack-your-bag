import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import { MS_PER_DAY } from '@repo/nestjs-common';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogService } from '@/modules/audit-log/audit-log.service';

import { TasksService } from './tasks.service';

const MOCK_CONFIG = {
  AUDIT_LOG_INFO_RETENTION_DAYS: 30,
  AUDIT_LOG_ERROR_WARN_RETENTION_DAYS: 60,
  AUDIT_LOG_CRITICAL_RETENTION_DAYS: 90,
} as const;

describe('TasksService', () => {
  let service: TasksService;

  const mockConfigService = {
    getOrThrow: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      const value = MOCK_CONFIG[key as keyof typeof MOCK_CONFIG];
      if (value === undefined && defaultValue === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return (value ?? defaultValue) as T;
    }),
  };

  const mockAuditLogService = {
    deleteAuditLogs: vi.fn(),
    handleAuditLog: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-17T01:00:00Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupAuditLogs', () => {
    it('should call deleteAuditLogs with correct severity-based cutoffs and write an audit log', async () => {
      const now = Date.now();
      const infoCutoff = new Date(now - 30 * MS_PER_DAY);
      const errorWarnCutoff = new Date(now - 60 * MS_PER_DAY);
      const criticalCutoff = new Date(now - 90 * MS_PER_DAY);

      mockAuditLogService.deleteAuditLogs.mockResolvedValue({ count: 10 });
      mockAuditLogService.handleAuditLog.mockResolvedValue(undefined);

      await service.cleanupAuditLogs();

      expect(mockAuditLogService.deleteAuditLogs).toHaveBeenCalledWith({
        OR: [
          {
            severity: AuditLogSeverity.INFO,
            createdAt: { lt: infoCutoff },
          },
          {
            severity: { in: [AuditLogSeverity.WARN, AuditLogSeverity.ERROR] },
            createdAt: { lt: errorWarnCutoff },
          },
          {
            severity: AuditLogSeverity.CRITICAL,
            createdAt: { lt: criticalCutoff },
          },
        ],
      });

      expect(mockAuditLogService.handleAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          source: 'audit-service',
          message: expect.stringContaining('Cleaned up 10 audit log(s)') as string,
          metadata: expect.objectContaining({
            count: 10,
            infoCutoff: infoCutoff.toISOString(),
            errorWarnCutoff: errorWarnCutoff.toISOString(),
            criticalCutoff: criticalCutoff.toISOString(),
          }) as object,
        }) as object,
      );
    });

    it('should write an error audit log when cleanup fails', async () => {
      mockAuditLogService.deleteAuditLogs.mockRejectedValue(new Error('DB failure'));
      mockAuditLogService.handleAuditLog.mockResolvedValue(undefined);

      await service.cleanupAuditLogs();

      expect(mockAuditLogService.handleAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          source: 'audit-service',
          message: 'Audit log cleanup failed: DB failure',
        }) as object,
      );
    });

    it('should not throw when both cleanup and audit log writing fail', async () => {
      mockAuditLogService.deleteAuditLogs.mockRejectedValue(new Error('DB failure'));
      mockAuditLogService.handleAuditLog.mockRejectedValue(new Error('Write failure'));

      await expect(service.cleanupAuditLogs()).resolves.toBeUndefined();
    });
  });
});
