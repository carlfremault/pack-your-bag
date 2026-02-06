import { AuditEventType, AuditSeverity, Prisma } from '@prisma-client';

export interface AuditRequestInput {
  readonly eventType: AuditEventType;
  readonly severity: AuditSeverity;
  readonly statusCode: number;
  readonly errorCode?: string;
  readonly message: Prisma.InputJsonValue;
  readonly metadata?: Prisma.InputJsonValue;
  readonly userId?: string | null; // Optional for input
}

export interface AuditLogData extends Omit<AuditRequestInput, 'userId'> {
  readonly userId: string | null; // Required for logs
  readonly requestId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent?: string;
  readonly path: string;
  readonly method: string;
}
