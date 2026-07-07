import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { RMQ_PATTERNS } from '@repo/nestjs-common';

import type { Channel, ConsumeMessage } from 'amqplib';

import { CleanupService } from './cleanup.service';

@Controller()
export class CleanupController {
  private readonly logger = new Logger(CleanupController.name, { timestamp: true });
  constructor(private readonly cleanupService: CleanupService) {}

  @EventPattern(RMQ_PATTERNS.USER_CLEANUP_PRODUCT_REQUESTED)
  async cleanupUsers(@Payload() userIds: string[], @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;

    try {
      await this.cleanupService.deleteUserData(userIds);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Product cleanup failed for user IDs [${userIds.join(', ')}]`, {
        userIds,
        error: error instanceof Error ? error.message : String(error),
      });
      channel.nack(originalMsg, false, false);
      throw error;
    }
  }
}
