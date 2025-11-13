-- CreateEnum
CREATE TYPE "UserBasicRole" AS ENUM ('admin', 'user', 'guest');

-- CreateEnum
CREATE TYPE "ProviderEnum" AS ENUM ('anonymous', 'phone', 'facebook', 'microsoft', 'google', 'apple', 'password');

-- CreateTable
CREATE TABLE "res_user" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "union_id" TEXT NOT NULL,
    "role" "UserBasicRole" NOT NULL DEFAULT 'guest',
    "nickname" TEXT NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "avatar" TEXT,
    "gender" TEXT,
    "birthday" TIMESTAMP(3),

    CONSTRAINT "res_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_associate" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "email" TEXT,
    "phone_number" TEXT,
    "ref_id" TEXT NOT NULL,
    "hash" TEXT,
    "provider" "ProviderEnum" NOT NULL,

    CONSTRAINT "res_associate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_user_gallery" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "res_user_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_follow" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,

    CONSTRAINT "res_follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_friend" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,

    CONSTRAINT "res_friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_message" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "res_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_gift" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "image" TEXT,
    "message" TEXT,

    CONSTRAINT "res_gift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_user_union_id_key" ON "res_user"("union_id");

-- CreateIndex
CREATE INDEX "res_user_union_id_deleted_at_idx" ON "res_user"("union_id", "deleted_at");

-- CreateIndex
CREATE INDEX "res_user_union_id_idx" ON "res_user"("union_id");

-- CreateIndex
CREATE INDEX "res_associate_ref_id_idx" ON "res_associate"("ref_id");

-- CreateIndex
CREATE INDEX "res_associate_user_id_idx" ON "res_associate"("user_id");

-- CreateIndex
CREATE INDEX "res_user_gallery_user_id_idx" ON "res_user_gallery"("user_id");

-- CreateIndex
CREATE INDEX "res_follow_follower_id_idx" ON "res_follow"("follower_id");

-- CreateIndex
CREATE INDEX "res_follow_following_id_idx" ON "res_follow"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_follow_follower_id_following_id_key" ON "res_follow"("follower_id", "following_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_friend_user_a_id_user_b_id_key" ON "res_friend"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "res_message_sender_id_idx" ON "res_message"("sender_id");

-- CreateIndex
CREATE INDEX "res_message_receiver_id_idx" ON "res_message"("receiver_id");

-- CreateIndex
CREATE INDEX "res_gift_sender_id_idx" ON "res_gift"("sender_id");

-- CreateIndex
CREATE INDEX "res_gift_receiver_id_idx" ON "res_gift"("receiver_id");

-- AddForeignKey
ALTER TABLE "res_associate" ADD CONSTRAINT "res_associate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_user_gallery" ADD CONSTRAINT "res_user_gallery_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_follow" ADD CONSTRAINT "res_follow_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_follow" ADD CONSTRAINT "res_follow_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_friend" ADD CONSTRAINT "res_friend_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_friend" ADD CONSTRAINT "res_friend_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_message" ADD CONSTRAINT "res_message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_message" ADD CONSTRAINT "res_message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_gift" ADD CONSTRAINT "res_gift_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_gift" ADD CONSTRAINT "res_gift_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
