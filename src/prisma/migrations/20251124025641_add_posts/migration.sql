/*
  Warnings:

  - Added the required column `updated_at` to the `res_post` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PostPrivacy" AS ENUM ('public', 'private', 'friends');

-- AlterTable
ALTER TABLE "res_post" ADD COLUMN     "privacy" "PostPrivacy" NOT NULL DEFAULT 'public',
ADD COLUMN     "share_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "res_post_media" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "thumbnail_url" TEXT,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "res_hashtag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "post_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "cover_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_post_hashtag" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "hashtag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_post_hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_hashtag_follow" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hashtag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_hashtag_follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_post_share" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_post_share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_hashtag_name_key" ON "res_hashtag"("name");

-- CreateIndex
CREATE INDEX "res_hashtag_name_idx" ON "res_hashtag"("name");

-- CreateIndex
CREATE INDEX "res_hashtag_post_count_idx" ON "res_hashtag"("post_count");

-- CreateIndex
CREATE INDEX "res_post_hashtag_post_id_idx" ON "res_post_hashtag"("post_id");

-- CreateIndex
CREATE INDEX "res_post_hashtag_hashtag_id_idx" ON "res_post_hashtag"("hashtag_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_post_hashtag_post_id_hashtag_id_key" ON "res_post_hashtag"("post_id", "hashtag_id");

-- CreateIndex
CREATE INDEX "res_hashtag_follow_user_id_idx" ON "res_hashtag_follow"("user_id");

-- CreateIndex
CREATE INDEX "res_hashtag_follow_hashtag_id_idx" ON "res_hashtag_follow"("hashtag_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_hashtag_follow_user_id_hashtag_id_key" ON "res_hashtag_follow"("user_id", "hashtag_id");

-- CreateIndex
CREATE INDEX "res_post_share_post_id_idx" ON "res_post_share"("post_id");

-- CreateIndex
CREATE INDEX "res_post_share_user_id_idx" ON "res_post_share"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_post_share_post_id_user_id_key" ON "res_post_share"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "res_post_privacy_idx" ON "res_post"("privacy");

-- AddForeignKey
ALTER TABLE "res_post_hashtag" ADD CONSTRAINT "res_post_hashtag_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "res_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_post_hashtag" ADD CONSTRAINT "res_post_hashtag_hashtag_id_fkey" FOREIGN KEY ("hashtag_id") REFERENCES "res_hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_hashtag_follow" ADD CONSTRAINT "res_hashtag_follow_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_hashtag_follow" ADD CONSTRAINT "res_hashtag_follow_hashtag_id_fkey" FOREIGN KEY ("hashtag_id") REFERENCES "res_hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_post_share" ADD CONSTRAINT "res_post_share_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "res_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_post_share" ADD CONSTRAINT "res_post_share_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
