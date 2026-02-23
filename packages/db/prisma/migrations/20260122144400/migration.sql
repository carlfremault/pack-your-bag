/*
  Warnings:

  - You are about to drop the column `userAgent` on the `AuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_auth"."AuditLog" DROP COLUMN "userAgent";
