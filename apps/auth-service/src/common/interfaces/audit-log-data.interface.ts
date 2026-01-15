import { AuditEventType, AuditSeverity, Prisma } from '@prisma-client';

export interface AuditLogData {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId: string | null;
  ipAddress?: string;
  userAgent?: string;
  path: string;
  method: string;
  statusCode: number;
  errorCode?: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}
