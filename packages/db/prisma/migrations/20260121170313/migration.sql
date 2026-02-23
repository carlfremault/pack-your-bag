-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'SECURITY_RATE_LIMIT_EXCEEDED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "userAgent" TEXT;
