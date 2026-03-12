-- CreateEnum
CREATE TYPE "app_auth"."TokenType" AS ENUM ('PASSWORD_RESET');

-- CreateTable
CREATE TABLE "app_auth"."VerificationToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "type" "app_auth"."TokenType" NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + '7 days'::interval),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "app_auth"."VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "app_auth"."VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
