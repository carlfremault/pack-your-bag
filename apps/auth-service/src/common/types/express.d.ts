import { AuditEventType, User as PrismaUser } from '@repo/db';

declare global {
  namespace Express {
    interface User extends Partial<PrismaUser> {
      userId: string;
      tokenId?: string;
      tokenFamilyId?: string;
    }
    interface Request {
      id: string;
      user?: User;
      auditOverride?: AuditEventType;
    }
  }
}
