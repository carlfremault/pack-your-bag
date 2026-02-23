/*
  Warnings:

  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'FORGOT_PASSWORD';

-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_userId_fkey";

-- DropTable
DROP TABLE "VerificationToken";

-- DropEnum
DROP TYPE "TokenType";
