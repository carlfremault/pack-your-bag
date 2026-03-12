-- AlterTable
ALTER TABLE "app_auth"."RefreshToken" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "app_auth"."RefreshToken"("expiresAt");
