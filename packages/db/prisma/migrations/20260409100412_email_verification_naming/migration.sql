/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_auth"."User" DROP COLUMN "emailVerified",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
