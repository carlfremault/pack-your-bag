import { AuditLogEventType } from '@repo/db';

declare global {
  namespace Express {
    interface User {
      userId: string;
      tokenId?: string;
      tokenFamilyId?: string;
    }
    interface Request {
      id: string; // populated by request-ID middleware
      user?: User;
      auditOverride?: AuditLogEventType;
    }
  }
}
