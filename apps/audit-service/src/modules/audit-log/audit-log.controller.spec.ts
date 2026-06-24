import { RmqContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';

import type { AuditLogMessage, AuditLogsAnonymizeMessage } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

describe('AuditLogController', () => {
  let controller: AuditLogController;

  const mockAuditLogService = {
    handleAuditLog: vi.fn(),
    anonymizeAuditLogs: vi.fn(),
  };

  const mockChannel = {
    ack: vi.fn(),
    nack: vi.fn(),
  };

  const mockOriginalMsg = { fields: {}, properties: {}, content: Buffer.from('') };

  const createMockContext = (): RmqContext =>
    ({
      getChannelRef: () => mockChannel,
      getMessage: () => mockOriginalMsg,
    }) as unknown as RmqContext;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [{ provide: AuditLogService, useValue: mockAuditLogService }],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleLogCreated', () => {
    const mockData: AuditLogMessage = {
      requestId: 'req-123',
      eventType: 'USER_LOGIN_SUCCESS',
      severity: 'INFO',
      userId: 'user-123',
      ipAddress: '192.168.0.***',
      userAgent: 'Mozilla/5.0',
      path: '/auth/login',
      method: 'POST',
      statusCode: 200,
      message: 'User logged in',
    };

    it('should process audit log and ack the message', async () => {
      mockAuditLogService.handleAuditLog.mockResolvedValue(undefined);

      await controller.handleLogCreated(mockData, createMockContext());

      expect(mockAuditLogService.handleAuditLog).toHaveBeenCalledWith(mockData);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockOriginalMsg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should nack the message when processing fails', async () => {
      mockAuditLogService.handleAuditLog.mockRejectedValue(new Error('DB failure'));

      await controller.handleLogCreated(mockData, createMockContext());

      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });
  });

  describe('handleAnonymize', () => {
    const mockData: AuditLogsAnonymizeMessage = {
      userIds: ['user-1', 'user-2'],
    };

    it('should anonymize audit logs and ack the message', async () => {
      mockAuditLogService.anonymizeAuditLogs.mockResolvedValue({ count: 5 });

      await controller.handleAnonymize(mockData, createMockContext());

      expect(mockAuditLogService.anonymizeAuditLogs).toHaveBeenCalledWith({
        userId: { in: ['user-1', 'user-2'] },
      });
      expect(mockChannel.ack).toHaveBeenCalledWith(mockOriginalMsg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should nack the message when anonymization fails', async () => {
      mockAuditLogService.anonymizeAuditLogs.mockRejectedValue(new Error('DB failure'));

      await controller.handleAnonymize(mockData, createMockContext());

      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });
  });
});
