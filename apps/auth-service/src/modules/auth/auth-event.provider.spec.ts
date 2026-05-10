import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { formatLocaleDate } from '@/common/utils/formatLocaleDate';

import { AuthEventProvider } from './auth-event.provider';

describe('AuthEventProvider', () => {
  let authEventProvider: AuthEventProvider;

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthEventProvider, { provide: EventEmitter2, useValue: mockEventEmitter }],
    }).compile();

    authEventProvider = module.get<AuthEventProvider>(AuthEventProvider);
  });

  it('should be defined', () => {
    expect(authEventProvider).toBeDefined();
  });

  describe('emitPasswordResetRequested', () => {
    it('should emit password reset requested event with correct data', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetToken: 'abc123token',
      };

      authEventProvider.emitPasswordResetRequested(eventData);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.PASSWORD_RESET_REQUESTED,
        eventData,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should not block execution (event emission is async)', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'test@example.com',
        resetToken: 'abc123token',
      };

      authEventProvider.emitPasswordResetRequested(eventData);

      // Event should not be emitted immediately (before setImmediate executes)
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      await new Promise((resolve) => setImmediate(resolve));
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle emission errors gracefully', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'test@example.com',
        resetToken: 'abc123token',
      };

      mockEventEmitter.emit.mockImplementation(() => {
        throw new Error('EventEmitter error');
      });

      expect(() => authEventProvider.emitPasswordResetRequested(eventData)).not.toThrow();

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('emitPasswordResetConfirmed', () => {
    it('should emit password reset confirmed event with correct data', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: formatLocaleDate(new Date(), 'en-GB'),
      };

      authEventProvider.emitPasswordResetConfirmed(eventData);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.PASSWORD_RESET_CONFIRMED,
        eventData,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should not block execution', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: formatLocaleDate(new Date(), 'en-GB'),
      };

      authEventProvider.emitPasswordResetConfirmed(eventData);

      // Event should not be emitted immediately (before setImmediate executes)
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      await new Promise((resolve) => setImmediate(resolve));
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle emission errors gracefully', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: formatLocaleDate(new Date(), 'en-GB'),
      };

      mockEventEmitter.emit.mockImplementation(() => {
        throw new Error('EventEmitter error');
      });

      expect(() => authEventProvider.emitPasswordResetConfirmed(eventData)).not.toThrow();

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('emitAccountVerificationRequested', () => {
    it('should emit account verification requested event with correct data', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        verificationToken: 'abc123token',
      };

      authEventProvider.emitAccountVerificationRequested(eventData);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.ACCOUNT_VERIFICATION_REQUESTED,
        eventData,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should not block execution', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        verificationToken: 'abc123token',
      };

      authEventProvider.emitAccountVerificationRequested(eventData);

      // Event should not be emitted immediately (before setImmediate executes)
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      await new Promise((resolve) => setImmediate(resolve));
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle emission errors gracefully', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        verificationToken: 'abc123token',
      };

      mockEventEmitter.emit.mockImplementation(() => {
        throw new Error('EventEmitter error');
      });

      expect(() => authEventProvider.emitAccountVerificationRequested(eventData)).not.toThrow();

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });
});
