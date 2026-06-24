import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import {
  type AuditLogMessage,
  type AuditLogsAnonymizeMessage,
  RMQ_PATTERNS,
} from '@repo/nestjs-common';

import type { Channel, ConsumeMessage } from 'amqplib';

import { AuditLogService } from './audit-log.service';

@Controller()
export class AuditLogController {
  private readonly logger = new Logger(AuditLogController.name, { timestamp: true });

  constructor(private readonly auditLogService: AuditLogService) {}

  @EventPattern(RMQ_PATTERNS.AUDIT_LOG_CREATED)
  async handleLogCreated(
    @Payload() data: AuditLogMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;

    try {
      await this.auditLogService.handleAuditLog(data);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error('Failed to process audit log', error);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern(RMQ_PATTERNS.AUDIT_LOGS_ANONYMIZE)
  async handleAnonymize(
    @Payload() data: AuditLogsAnonymizeMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;

    try {
      const result = await this.auditLogService.anonymizeAuditLogs({
        userId: { in: data.userIds },
      });
      this.logger.log(`Anonymized ${result.count} audit log(s) for ${data.userIds.length} user(s)`);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error('Failed to anonymize audit logs', error);
      channel.nack(originalMsg, false, false);
    }
  }
}
