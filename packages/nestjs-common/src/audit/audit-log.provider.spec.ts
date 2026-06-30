import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RMQ_PATTERNS, RMQ_PUBLISHERS } from '../rmq/rmq.constants';

import { AUDIT_SOURCE, AuditLogProvider, AuditRequestInput } from './audit-log.provider';

function createMockRequest(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'req-uuid-123',
    headers: { 'user-agent': 'Mozilla/5.0 Test Agent' },
    user: { userId: 'user-uuid-456' },
    path: '/test/endpoint',
    method: 'POST',
    ip: '192.168.1.100',
    ...overrides,
  };
}

describe('AuditLogProvider', () => {
  let provider: AuditLogProvider;
  const mockEmit = vi.fn().mockReturnValue({ subscribe: vi.fn() });
  const mockClient = { emit: mockEmit } as unknown as ClientProxy;
  const testSource = 'test-service';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogProvider,
        { provide: RMQ_PUBLISHERS.AUDIT, useValue: mockClient },
        { provide: AUDIT_SOURCE, useValue: testSource },
      ],
    }).compile();

    provider = module.get<AuditLogProvider>(AuditLogProvider);
  });

  describe('auditRequest', () => {
    const baseInput: AuditRequestInput = {
      eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
      severity: AuditLogSeverity.ERROR,
      statusCode: 500,
      message: 'Test error',
    };

    it('should publish to RMQ via setImmediate', () => {
      const request = createMockRequest();

      provider.auditRequest(baseInput, request as never);

      expect(mockEmit).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(mockEmit).toHaveBeenCalledWith(
        RMQ_PATTERNS.AUDIT_LOG_CREATED,
        expect.objectContaining({
          eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
          severity: AuditLogSeverity.ERROR,
          source: testSource,
        }),
      );
    });

    it('should include request context in the message', () => {
      const request = createMockRequest();

      provider.auditRequest(baseInput, request as never);
      vi.runAllTimers();

      expect(mockEmit).toHaveBeenCalledWith(
        RMQ_PATTERNS.AUDIT_LOG_CREATED,
        expect.objectContaining({
          requestId: 'req-uuid-123',
          path: '/test/endpoint',
          method: 'POST',
          userAgent: 'Mozilla/5.0 Test Agent',
          userId: 'user-uuid-456',
        }),
      );
    });

    it('should anonymize IP address', () => {
      const request = createMockRequest({ ip: '192.168.1.100' });

      provider.auditRequest(baseInput, request as never);
      vi.runAllTimers();

      expect(mockEmit).toHaveBeenCalledWith(
        RMQ_PATTERNS.AUDIT_LOG_CREATED,
        expect.objectContaining({
          ipAddress: expect.not.stringContaining('192.168.1.100') as string,
        }),
      );
    });

    it('should set null fields when no request is provided', () => {
      provider.auditRequest(baseInput);
      vi.runAllTimers();

      expect(mockEmit).toHaveBeenCalledWith(
        RMQ_PATTERNS.AUDIT_LOG_CREATED,
        expect.objectContaining({
          requestId: null,
          ipAddress: null,
          userAgent: null,
          path: null,
          method: null,
          source: testSource,
        }),
      );
    });

    it('should prefer data.userId over request.user.userId', () => {
      const request = createMockRequest({ user: { userId: 'request-user' } });

      provider.auditRequest({ ...baseInput, userId: 'explicit-user' }, request as never);
      vi.runAllTimers();

      expect(mockEmit).toHaveBeenCalledWith(
        RMQ_PATTERNS.AUDIT_LOG_CREATED,
        expect.objectContaining({ userId: 'explicit-user' }),
      );
    });

    it('should fall back to request.user.userId when data.userId is not set', () => {
      const request = createMockRequest({ user: { userId: 'request-user' } });

      provider.auditRequest(baseInput, request as never);
      vi.runAllTimers();

      expect(mockEmit).toHaveBeenCalledWith(
        RMQ_PATTERNS.AUDIT_LOG_CREATED,
        expect.objectContaining({ userId: 'request-user' }),
      );
    });

    it('should always include the configured source', () => {
      provider.auditRequest(baseInput);
      vi.runAllTimers();

      expect(mockEmit).toHaveBeenCalledWith(
        RMQ_PATTERNS.AUDIT_LOG_CREATED,
        expect.objectContaining({ source: testSource }),
      );
    });
  });

  describe('requestAnonymization', () => {
    it('should publish anonymization request with user IDs', () => {
      provider.requestAnonymization(['user-1', 'user-2']);

      expect(mockEmit).toHaveBeenCalledWith(RMQ_PATTERNS.AUDIT_LOGS_ANONYMIZE, {
        userIds: ['user-1', 'user-2'],
      });
    });

    it('should not publish when userIds array is empty', () => {
      provider.requestAnonymization([]);

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });
});
