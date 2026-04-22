/*
  Warnings:

  - You are about to drop the column `colorCode` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `colorCode` on the `List` table. All the data in the column will be lost.
  - You are about to drop the column `colorCode` on the `Pack` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_product"."Category" DROP COLUMN "colorCode",
ADD COLUMN     "colorTheme" TEXT NOT NULL DEFAULT 'slate';

-- AlterTable
ALTER TABLE "app_product"."List" DROP COLUMN "colorCode",
ADD COLUMN     "colorTheme" TEXT;

-- AlterTable
ALTER TABLE "app_product"."Pack" DROP COLUMN "colorCode",
ADD COLUMN     "colorTheme" TEXT;
