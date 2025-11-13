/*
  Warnings:

  - You are about to drop the `res_user_gallery` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "res_user_gallery" DROP CONSTRAINT "res_user_gallery_user_id_fkey";

-- DropIndex
DROP INDEX "res_profile_view_viewer_id_target_user_id_key";

-- AlterTable
ALTER TABLE "res_store_item" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "res_wallet" ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(65,30);

-- DropTable
DROP TABLE "res_user_gallery";

-- CreateTable
CREATE TABLE "res_album" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "res_album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_album_photo" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_album_photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_album_user_id_idx" ON "res_album"("user_id");

-- CreateIndex
CREATE INDEX "res_album_photo_album_id_idx" ON "res_album_photo"("album_id");

-- CreateIndex
CREATE INDEX "res_profile_view_viewer_id_idx" ON "res_profile_view"("viewer_id");

-- CreateIndex
CREATE INDEX "res_profile_view_target_user_id_idx" ON "res_profile_view"("target_user_id");

-- AddForeignKey
ALTER TABLE "res_album" ADD CONSTRAINT "res_album_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_album_photo" ADD CONSTRAINT "res_album_photo_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "res_album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
