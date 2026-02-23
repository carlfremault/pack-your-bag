CREATE SCHEMA IF NOT EXISTS "app_auth";
CREATE SCHEMA IF NOT EXISTS "app_product";

-- CreateTable
CREATE TABLE "app_auth"."Role" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_auth"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "app_auth"."User"("email");

-- AddForeignKey
ALTER TABLE "app_auth"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "app_auth"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
