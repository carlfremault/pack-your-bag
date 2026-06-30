import { Controller, Logger, UseFilters } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import {
  type AuditLogMessage,
  type AuditLogsAnonymizeMessage,
  RMQ_PATTERNS,
} from '@repo/nestjs-common';

import type { Channel, ConsumeMessage } from 'amqplib';

import { RpcExceptionFilter } from '@/common/filters/rpc-exception.filter';

import { AuditLogService } from './audit-log.service';

@UseFilters(RpcExceptionFilter)
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

    await this.auditLogService.handleAuditLog(data);
    channel.ack(originalMsg);
  }

  @EventPattern(RMQ_PATTERNS.AUDIT_LOGS_ANONYMIZE)
  async handleAnonymize(
    @Payload() data: AuditLogsAnonymizeMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;

    const result = await this.auditLogService.anonymizeAuditLogs({
      userId: { in: data.userIds },
    });
    this.logger.log(`Anonymized ${result.count} audit log(s) for ${data.userIds.length} user(s)`);
    channel.ack(originalMsg);
  }
}
