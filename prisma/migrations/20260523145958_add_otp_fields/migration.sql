/*
  Warnings:

  - You are about to drop the column `code` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `otps` table. All the data in the column will be lost.
  - Added the required column `hash` to the `otps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `otps` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'TWO_FACTOR');

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "code",
DROP COLUMN "updatedAt",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hash" TEXT NOT NULL,
ADD COLUMN     "purpose" "OtpPurpose" NOT NULL;

-- CreateIndex
CREATE INDEX "otps_userId_purpose_used_idx" ON "otps"("userId", "purpose", "used");

-- Manual addition
CREATE UNIQUE INDEX "otps_userId_purpose_active_uidx"
ON "otps" ("userId", "purpose")
WHERE "used" = false;
