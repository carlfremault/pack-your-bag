/*
  Warnings:

  - Changed the type of `message` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "message",
ADD COLUMN     "message" JSONB NOT NULL;
