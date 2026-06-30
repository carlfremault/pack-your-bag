-- AlterTable
ALTER TABLE "app_audit"."AuditLogEntry" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'auth-service';

-- CreateIndex
CREATE INDEX "AuditLogEntry_source_idx" ON "app_audit"."AuditLogEntry"("source");
