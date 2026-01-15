import { AuditEventType, AuditSeverity, Prisma } from '@prisma-client';

export interface AuditLogData {
  readonly eventType: AuditEventType;
  readonly severity: AuditSeverity;
  readonly userId: string | null;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly path: string;
  readonly method: string;
  readonly statusCode: number;
  readonly errorCode?: string;
  readonly message: string;
  readonly metadata?: Prisma.InputJsonValue;
}
