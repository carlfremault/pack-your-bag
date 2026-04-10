-- AlterEnum
ALTER TYPE "app_auth"."AuditEventType" ADD VALUE 'EMAIL_VERIFIED';

-- AlterEnum
ALTER TYPE "app_auth"."TokenType" ADD VALUE 'EMAIL_VERIFICATION';

-- AlterTable
ALTER TABLE "app_auth"."User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);
