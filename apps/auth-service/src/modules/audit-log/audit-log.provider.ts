import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { AuditEventType, AuditSeverity, Prisma } from '@repo/db';
import {
  anonymizeIp,
  type AuditLogMessage,
  type AuditLogsAnonymizeMessage,
  RMQ_PATTERNS,
  RMQ_PUBLISHERS,
} from '@repo/nestjs-common';

import { Request } from 'express';

import { getUserAgentFromHeaders } from '@/common/utils/getUserAgentFromHeaders';

interface AuditRequestInput {
  readonly eventType: AuditEventType;
  readonly severity: AuditSeverity;
  readonly userId?: string | null;
  readonly statusCode: number | null;
  readonly errorCode?: string;
  readonly message: Prisma.InputJsonValue;
  readonly metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogProvider {
  private readonly logger = new Logger(AuditLogProvider.name, { timestamp: true });

  constructor(@Inject(RMQ_PUBLISHERS.AUDIT) private readonly client: ClientProxy) {}

  auditRequest(data: AuditRequestInput, request?: Request): void {
    const message = this.buildMessage(data, request);

    setImmediate(() => {
      this.client.emit<string, AuditLogMessage>(RMQ_PATTERNS.AUDIT_LOG_CREATED, message).subscribe({
        error: (err: unknown) => {
          this.logger.error('Failed to publish audit log', err);
        },
      });
    });
  }

  requestAnonymization(userIds: string[]): void {
    if (userIds.length === 0) return;

    const message: AuditLogsAnonymizeMessage = { userIds };

    this.client
      .emit<string, AuditLogsAnonymizeMessage>(RMQ_PATTERNS.AUDIT_LOGS_ANONYMIZE, message)
      .subscribe({
        error: (err: unknown) => {
          this.logger.error('Failed to publish audit log anonymization request', err);
        },
      });
  }

  private buildMessage(data: AuditRequestInput, request?: Request): AuditLogMessage {
    if (!request) {
      return {
        ...data,
        userId: data.userId ?? null,
        requestId: null,
        ipAddress: null,
        userAgent: null,
        path: null,
        method: null,
      };
    }

    const { id, headers, user, path = 'N/A', method = 'N/A', ip } = request;
    const userAgent = headers ? getUserAgentFromHeaders(headers) : null;

    return {
      ...data,
      userId: data.userId ?? user?.userId ?? null,
      requestId: id ?? null,
      ipAddress: ip ? anonymizeIp(ip) : null,
      userAgent,
      path,
      method,
    };
  }
}
