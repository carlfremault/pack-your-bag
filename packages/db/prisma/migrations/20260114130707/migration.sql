-- CreateEnum
CREATE TYPE "app_auth"."AuditEventType" AS ENUM ('USER_REGISTERED', 'USER_LOGIN_SUCCESS', 'USER_LOGIN_FAILED', 'TOKEN_REFRESHED', 'TOKEN_REFRESHED_RACE_CONDITION', 'TOKEN_REUSE_DETECTED', 'SESSION_EXPIRED', 'INVALID_SESSION', 'SUSPICIOUS_ACTIVITY', 'USER_LOGOUT', 'USER_LOGOUT_ALL_DEVICES', 'PASSWORD_CHANGED');

-- CreateEnum
CREATE TYPE "app_auth"."AuditSeverity" AS ENUM ('INFO', 'WARN', 'ERROR', 'CRITICAL');

-- AlterTable
ALTER TABLE "app_auth"."RefreshToken" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';

-- CreateTable
CREATE TABLE "app_auth"."AuditLog" (
    "id" UUID NOT NULL,
    "eventType" "app_auth"."AuditEventType" NOT NULL,
    "severity" "app_auth"."AuditSeverity" NOT NULL,
    "userId" UUID,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "errorCode" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "app_auth"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "app_auth"."AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "app_auth"."AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "app_auth"."AuditLog"("createdAt");
