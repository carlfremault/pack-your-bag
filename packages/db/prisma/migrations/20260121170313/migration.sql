-- AlterEnum
ALTER TYPE "app_auth"."AuditEventType" ADD VALUE 'SECURITY_RATE_LIMIT_EXCEEDED';

-- AlterTable
ALTER TABLE "app_auth"."AuditLog" ADD COLUMN     "userAgent" TEXT;
