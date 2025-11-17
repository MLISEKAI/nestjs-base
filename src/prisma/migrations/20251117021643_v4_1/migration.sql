/*
  Warnings:

  - You are about to drop the `res_supporter` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "res_supporter" DROP CONSTRAINT "res_supporter_resUserId_fkey";

-- DropForeignKey
ALTER TABLE "res_supporter" DROP CONSTRAINT "res_supporter_supporter_id_fkey";

-- DropForeignKey
ALTER TABLE "res_supporter" DROP CONSTRAINT "res_supporter_user_id_fkey";

-- DropTable
DROP TABLE "res_supporter";

-- CreateTable
CREATE TABLE "ResSupporter" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "supporter_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "ResSupporter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_post_user_id_idx" ON "res_post"("user_id");

-- AddForeignKey
ALTER TABLE "ResSupporter" ADD CONSTRAINT "ResSupporter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResSupporter" ADD CONSTRAINT "ResSupporter_supporter_id_fkey" FOREIGN KEY ("supporter_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_relationship" ADD CONSTRAINT "res_relationship_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
