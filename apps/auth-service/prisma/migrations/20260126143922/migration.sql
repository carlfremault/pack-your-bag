-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'VALIDATION_ERROR';
ALTER TYPE "AuditEventType" ADD VALUE 'AUTHORIZATION_FAILED';
ALTER TYPE "AuditEventType" ADD VALUE 'RESOURCE_NOT_FOUND';
ALTER TYPE "AuditEventType" ADD VALUE 'CONFLICT_ERROR';
