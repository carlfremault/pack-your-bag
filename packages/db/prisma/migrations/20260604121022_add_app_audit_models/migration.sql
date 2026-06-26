-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app_audit";

-- CreateEnum
CREATE TYPE "app_audit"."AuditLogEventType" AS ENUM ('TOKEN_REUSE_DETECTED', 'SUSPICIOUS_ACTIVITY', 'BFF_SECRET_MISMATCH', 'INTERNAL_SERVER_ERROR', 'EMAIL_SEND_FAILED', 'USER_LOGIN_FAILED', 'INVALID_SESSION', 'INVALID_TOKEN', 'SECURITY_RATE_LIMIT_EXCEEDED', 'VALIDATION_ERROR', 'AUTHORIZATION_FAILED', 'RESOURCE_NOT_FOUND', 'CONFLICT_ERROR', 'USER_REGISTERED', 'USER_LOGIN_SUCCESS', 'USER_DELETED', 'TOKEN_REFRESHED', 'TOKEN_REFRESHED_RACE_CONDITION', 'SESSION_EXPIRED', 'USER_LOGOUT', 'USER_LOGOUT_ALL_DEVICES', 'PASSWORD_CHANGED', 'ACCOUNT_DELETION_ACCESS_ATTEMPT', 'SCHEDULED_TASK', 'HTTP_ERROR', 'PASSWORD_FORGOTTEN', 'PASSWORD_RESET', 'CANCEL_ACCOUNT_DELETION', 'EMAIL_VERIFIED', 'EMAIL_VERIFICATION_RESENT', 'GUEST_SESSION_CREATED', 'DELETED_GUEST_ACCESS');

-- CreateEnum
CREATE TYPE "app_audit"."AuditLogSeverity" AS ENUM ('INFO', 'WARN', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "app_audit"."AuditLogEntry" (
    "id" UUID NOT NULL,
    "eventType" "app_audit"."AuditLogEventType" NOT NULL,
    "severity" "app_audit"."AuditLogSeverity" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" JSONB NOT NULL,
    "metadata" JSONB,
    "requestId" UUID,
    "path" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "ipAddress" TEXT,
    "deviceInfo" JSONB,
    "userId" UUID,
    "errorCode" TEXT,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLogEntry_userId_idx" ON "app_audit"."AuditLogEntry"("userId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_eventType_idx" ON "app_audit"."AuditLogEntry"("eventType");

-- CreateIndex
CREATE INDEX "AuditLogEntry_severity_idx" ON "app_audit"."AuditLogEntry"("severity");

-- CreateIndex
CREATE INDEX "AuditLogEntry_createdAt_idx" ON "app_audit"."AuditLogEntry"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLogEntry_requestId_idx" ON "app_audit"."AuditLogEntry"("requestId");
