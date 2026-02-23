-- AlterTable
ALTER TABLE "app_auth"."RefreshToken" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';
