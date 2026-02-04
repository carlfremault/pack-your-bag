import { AuditEventType, AuditSeverity, Prisma } from '@prisma-client';

export interface AuditLogData {
  readonly requestId: string | null;
  readonly eventType: AuditEventType;
  readonly severity: AuditSeverity;
  readonly userId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent?: string;
  readonly path: string;
  readonly method: string;
  readonly statusCode: number;
  readonly errorCode?: string;
  readonly message: Prisma.InputJsonValue;
  readonly metadata?: Prisma.InputJsonValue;
}
