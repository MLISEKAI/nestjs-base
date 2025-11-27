-- AlterTable
ALTER TABLE "res_comment" ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "res_comment_media" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "media_type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_comment_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_comment_media_comment_id_idx" ON "res_comment_media"("comment_id");

-- CreateIndex
CREATE INDEX "res_comment_media_comment_id_order_idx" ON "res_comment_media"("comment_id", "order");

-- AddForeignKey
ALTER TABLE "res_comment_media" ADD CONSTRAINT "res_comment_media_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "res_comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
