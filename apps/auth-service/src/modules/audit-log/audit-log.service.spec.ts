import { Test, TestingModule } from '@nestjs/testing';

import { AuditEventType, AuditSeverity } from '@prisma-client';
import { UAParser } from 'ua-parser-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { AuditLogService } from './audit-log.service';

vi.mock('ua-parser-js', () => {
  return {
    UAParser: vi.fn(function () {
      return {
        getResult: () => ({
          browser: { name: 'Chrome' },
          os: { name: 'Windows' },
          device: { type: 'desktop' },
        }),
      };
    }),
  };
});

describe('AuditLogService', () => {
  let service: AuditLogService;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockPrismaService = {
    auditLog: {
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);

    loggerErrorSpy = vi.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleAuditLog', () => {
    it('should create audit log', async () => {
      const inputData = {
        eventType: AuditEventType.USER_REGISTERED,
        severity: AuditSeverity.INFO,
        userId: '123',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
        path: 'register',
        method: 'POST',
        statusCode: 200,
        message: 'User registered successfully',
      };

      await service.handleAuditLog(inputData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String) as string,
          eventType: inputData.eventType,
          severity: inputData.severity,
          userId: inputData.userId,
          ipAddress: inputData.ipAddress,
          path: inputData.path,
          method: inputData.method,
          statusCode: inputData.statusCode,
          message: inputData.message,
          deviceInfo: expect.objectContaining({
            browser: expect.any(String) as string,
            device: expect.any(String) as string,
            os: expect.any(String) as string,
          }) as object,
          metadata: {},
        }) as object,
      });
    });

    it('should create audit log with null deviceInfo when userAgent is not provided', async () => {
      const inputData = {
        eventType: AuditEventType.USER_REGISTERED,
        severity: AuditSeverity.INFO,
        userId: '123',
        ipAddress: '127.0.0.1',
        path: 'register',
        method: 'POST',
        statusCode: 200,
        message: 'User registered successfully',
      };

      await service.handleAuditLog(inputData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deviceInfo: null,
          }) as object,
        }),
      );
    });

    it('should handle invalid userAgent gracefully', async () => {
      vi.mocked(UAParser).mockImplementationOnce(function () {
        return {
          getResult: () => {
            throw new Error('Parser error');
          },
        };
      });

      const inputData = {
        eventType: AuditEventType.USER_LOGIN_SUCCESS,
        severity: AuditSeverity.INFO,
        userId: '123',
        ipAddress: '127.0.0.1',
        userAgent: 'invalid-user-agent-that-causes-error',
        path: 'login',
        method: 'POST',
        statusCode: 200,
        message: 'User logged in',
      };

      await service.handleAuditLog(inputData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceInfo: { error: 'Parsing failed' },
        }) as object,
      });
    });

    it('should trigger alert for CRITICAL severity events', async () => {
      const inputData = {
        eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
        severity: AuditSeverity.CRITICAL,
        userId: '123',
        ipAddress: '127.0.0.1',
        path: 'refresh-token',
        method: 'POST',
        statusCode: 403,
        message: 'Suspicious activity detected',
      };

      await service.handleAuditLog(inputData);

      // triggerAlert being a private method it is easier to test its side effect, the logger error
      expect(loggerErrorSpy).toHaveBeenCalledWith('CRITICAL SECURITY EVENT:', inputData);
    });

    it('should not trigger alert for non-CRITICAL severity events', async () => {
      const inputData = {
        eventType: AuditEventType.USER_LOGIN_SUCCESS,
        severity: AuditSeverity.INFO,
        userId: '123',
        ipAddress: '127.0.0.1',
        path: 'login',
        method: 'POST',
        statusCode: 200,
        message: 'User logged in',
      };

      await service.handleAuditLog(inputData);

      // triggerAlert being a private method it is easier to test its side effect, the logger error
      expect(loggerErrorSpy).not.toHaveBeenCalledWith('CRITICAL SECURITY EVENT:', inputData);
    });

    it('should handle prisma create failure gracefully and log error', async () => {
      mockPrismaService.auditLog.create.mockRejectedValueOnce(new Error('DB error'));

      const inputData = {
        eventType: AuditEventType.USER_REGISTERED,
        severity: AuditSeverity.INFO,
        userId: '123',
        ipAddress: '127.0.0.1',
        path: 'register',
        method: 'POST',
        statusCode: 200,
        message: 'User registered successfully',
      };

      await service.handleAuditLog(inputData);

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should include metadata when provided', async () => {
      const inputData = {
        eventType: AuditEventType.USER_REGISTERED,
        severity: AuditSeverity.INFO,
        userId: '123',
        ipAddress: '127.0.0.1',
        path: 'register',
        method: 'POST',
        statusCode: 200,
        message: 'User registered successfully',
        metadata: { customField: 'value', requestId: 'req-123' },
      };

      await service.handleAuditLog(inputData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { customField: 'value', requestId: 'req-123' },
        }) as object,
      });
    });
  });
});
