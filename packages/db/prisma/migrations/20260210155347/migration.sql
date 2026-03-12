-- AlterEnum
ALTER TYPE "app_auth"."AuditEventType" ADD VALUE 'EMAIL_SEND_FAILED';

-- AlterTable
ALTER TABLE "app_auth"."AuditLog" ALTER COLUMN "path" DROP NOT NULL,
ALTER COLUMN "method" DROP NOT NULL,
ALTER COLUMN "statusCode" DROP NOT NULL;
