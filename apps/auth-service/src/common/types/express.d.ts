import { AuditEventType } from '@prisma-client';
import { User as PrismaUser } from '@prisma-client';

declare global {
  namespace Express {
    interface User extends Partial<PrismaUser> {
      userId: string;
      tokenId?: string;
      tokenFamilyId?: string;
    }
    interface Request {
      user?: User;
      auditOverride?: AuditEventType;
    }
  }
}
