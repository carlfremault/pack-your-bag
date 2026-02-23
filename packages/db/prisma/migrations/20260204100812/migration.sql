-- AlterTable
ALTER TABLE "app_auth"."AuditLog" ADD COLUMN     "requestId" UUID;

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "app_auth"."AuditLog"("requestId");
