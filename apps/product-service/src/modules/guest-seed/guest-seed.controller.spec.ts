import { RmqContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GuestSeedController } from './guest-seed.controller';
import { GuestSeedService } from './guest-seed.service';

describe('GuestSeedController', () => {
  let controller: GuestSeedController;

  const mockGuestSeedService = {
    seedGuestData: vi.fn(),
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
      controllers: [GuestSeedController],
      providers: [{ provide: GuestSeedService, useValue: mockGuestSeedService }],
    }).compile();

    controller = module.get<GuestSeedController>(GuestSeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('seedGuestData', () => {
    const guestId = 'guest-uuid-123';

    it('should call service with guestId and ack the message', async () => {
      mockGuestSeedService.seedGuestData.mockResolvedValue(undefined);

      await controller.seedGuestData(guestId, createMockContext());

      expect(mockGuestSeedService.seedGuestData).toHaveBeenCalledWith(guestId);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockOriginalMsg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should nack without requeue when service throws an Error', async () => {
      mockGuestSeedService.seedGuestData.mockRejectedValue(new Error('DB failure'));

      await controller.seedGuestData(guestId, createMockContext());

      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it('should nack without requeue when service throws a non-Error value', async () => {
      mockGuestSeedService.seedGuestData.mockRejectedValue('raw string failure');

      await controller.seedGuestData(guestId, createMockContext());

      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });
  });
});
