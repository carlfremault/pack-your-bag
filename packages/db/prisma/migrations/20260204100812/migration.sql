-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "requestId" UUID;

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");
