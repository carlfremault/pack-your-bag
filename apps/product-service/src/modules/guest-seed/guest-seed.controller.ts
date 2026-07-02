import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

import { RMQ_PATTERNS } from '@repo/nestjs-common';

import type { Channel, ConsumeMessage } from 'amqplib';

import { GuestSeedService } from './guest-seed.service';

@Controller()
export class GuestSeedController {
  private readonly logger = new Logger(GuestSeedController.name, { timestamp: true });

  constructor(private readonly guestSeedService: GuestSeedService) {}

  @MessagePattern(RMQ_PATTERNS.SEED_GUEST_DATA)
  async seedGuestData(@Payload() guestId: string, @Ctx() context: RmqContext): Promise<boolean> {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;

    try {
      await this.guestSeedService.seedGuestData(guestId);
      channel.ack(originalMsg);
      return true;
    } catch (error) {
      this.logger.error('Failed to seed guest data, sending to DLQ', {
        guestId,
        error: error instanceof Error ? error.message : String(error),
      });
      channel.nack(originalMsg, false, false);
      throw error;
    }
  }
}
