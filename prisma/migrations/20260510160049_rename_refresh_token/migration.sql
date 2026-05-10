/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refreshHashToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/

-- Drop old unique index
DROP INDEX "users_refreshToken_key";

-- Rename column
ALTER TABLE "users"
RENAME COLUMN "refreshToken" TO "refreshHashToken";

-- Recreate unique index
CREATE UNIQUE INDEX "users_refreshHashToken_key"
ON "users"("refreshHashToken");

-- -- DropIndex
-- DROP INDEX "users_refreshToken_key";

-- -- AlterTable
-- ALTER TABLE "users" DROP COLUMN "refreshToken",
-- ADD COLUMN     "refreshHashToken" TEXT;

-- -- CreateIndex
-- CREATE UNIQUE INDEX "users_refreshHashToken_key" ON "users"("refreshHashToken");
