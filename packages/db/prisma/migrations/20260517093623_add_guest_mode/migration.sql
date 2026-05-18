-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "app_auth"."AuditEventType" ADD VALUE 'GUEST_SESSION_CREATED';
ALTER TYPE "app_auth"."AuditEventType" ADD VALUE 'GUEST_SESSION_EXPIRED';

-- AlterTable
ALTER TABLE "app_auth"."User" ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3);
