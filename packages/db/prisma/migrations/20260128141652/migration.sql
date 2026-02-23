-- AlterEnum
ALTER TYPE "app_auth"."AuditEventType" ADD VALUE 'USER_DELETED';

-- AlterTable
ALTER TABLE "app_auth"."User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
