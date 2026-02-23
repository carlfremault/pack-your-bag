/*
  Warnings:

  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "app_auth"."AuditEventType" ADD VALUE 'FORGOT_PASSWORD';

-- DropForeignKey
ALTER TABLE "app_auth"."VerificationToken" DROP CONSTRAINT "VerificationToken_userId_fkey";

-- DropTable
DROP TABLE "app_auth"."VerificationToken";

-- DropEnum
DROP TYPE "app_auth"."TokenType";
