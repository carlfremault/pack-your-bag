import { type MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AuditLogEventType, AuditLogSeverity, Prisma } from '@repo/db';

export function getRmqConsumerOptions(url: string, queue: string): MicroserviceOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': `${queue}.dlq`,
        },
      },
      noAck: false,
      prefetchCount: 10,
    },
  };
}

export interface AuditLogMessage {
  readonly requestId: string | null;
  readonly eventType: AuditLogEventType;
  readonly severity: AuditLogSeverity;
  readonly userId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly path: string | null;
  readonly method: string | null;
  readonly statusCode: number | null;
  readonly errorCode?: string;
  readonly source?: string;
  readonly message: Prisma.InputJsonValue;
  readonly metadata?: Prisma.InputJsonValue;
}

export interface AuditLogsAnonymizeMessage {
  readonly userIds: string[];
}
