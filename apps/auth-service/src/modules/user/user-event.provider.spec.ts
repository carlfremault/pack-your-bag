import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { formatLocaleDate } from '@/common/utils/formatLocaleDate';

import { UserEventProvider } from './user-event.provider';

describe('UserEventProvider', () => {
  let userEventProvider: UserEventProvider;

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserEventProvider, { provide: EventEmitter2, useValue: mockEventEmitter }],
    }).compile();

    userEventProvider = module.get<UserEventProvider>(UserEventProvider);
  });

  it('should be defined', () => {
    expect(userEventProvider).toBeDefined();
  });

  describe('emitAccountDeletionRequested', () => {
    it('should emit account deletion requested event with correct data', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'testemail@test.com',
        cancellationToken: 'abc123token',
        cancellationDate: formatLocaleDate(new Date(), 'en-GB'),
      };

      userEventProvider.emitAccountDeletionRequested(eventData);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.ACCOUNT_DELETION_REQUESTED,
        eventData,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should not block execution (event emission is async)', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'test@example.com',
        cancellationToken: 'abc123token',
        cancellationDate: formatLocaleDate(new Date(), 'en-GB'),
      };

      userEventProvider.emitAccountDeletionRequested(eventData);

      // Event should not be emitted immediately (before setImmediate executes)
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      await new Promise((resolve) => setImmediate(resolve));
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle emission errors gracefully', async () => {
      const eventData = {
        userId: 'user-123',
        email: 'test@example.com',
        cancellationToken: 'abc123token',
        cancellationDate: formatLocaleDate(new Date(), 'en-GB'),
      };

      mockEventEmitter.emit.mockImplementation(() => {
        throw new Error('EventEmitter error');
      });

      expect(() => userEventProvider.emitAccountDeletionRequested(eventData)).not.toThrow();

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });
});
