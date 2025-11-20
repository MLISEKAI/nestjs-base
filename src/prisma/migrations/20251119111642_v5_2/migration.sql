-- CreateTable
CREATE TABLE "res_comment" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_post_like" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction" TEXT NOT NULL DEFAULT 'like',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_post_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_post_media" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_story" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT,
    "media_url" TEXT,
    "media_type" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_group_member" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_group_message" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_group_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_event" (
    "id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "max_participants" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_event_participant" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_event_participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_comment_post_id_idx" ON "res_comment"("post_id");

-- CreateIndex
CREATE INDEX "res_comment_user_id_idx" ON "res_comment"("user_id");

-- CreateIndex
CREATE INDEX "res_comment_parent_id_idx" ON "res_comment"("parent_id");

-- CreateIndex
CREATE INDEX "res_comment_created_at_idx" ON "res_comment"("created_at");

-- CreateIndex
CREATE INDEX "res_post_like_post_id_idx" ON "res_post_like"("post_id");

-- CreateIndex
CREATE INDEX "res_post_like_user_id_idx" ON "res_post_like"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_post_like_post_id_user_id_key" ON "res_post_like"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "res_post_media_post_id_idx" ON "res_post_media"("post_id");

-- CreateIndex
CREATE INDEX "res_post_media_post_id_order_idx" ON "res_post_media"("post_id", "order");

-- CreateIndex
CREATE INDEX "res_story_user_id_idx" ON "res_story"("user_id");

-- CreateIndex
CREATE INDEX "res_story_expires_at_idx" ON "res_story"("expires_at");

-- CreateIndex
CREATE INDEX "res_story_created_at_idx" ON "res_story"("created_at");

-- CreateIndex
CREATE INDEX "res_group_created_by_idx" ON "res_group"("created_by");

-- CreateIndex
CREATE INDEX "res_group_is_public_idx" ON "res_group"("is_public");

-- CreateIndex
CREATE INDEX "res_group_member_group_id_idx" ON "res_group_member"("group_id");

-- CreateIndex
CREATE INDEX "res_group_member_user_id_idx" ON "res_group_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_group_member_group_id_user_id_key" ON "res_group_member"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "res_group_message_group_id_idx" ON "res_group_message"("group_id");

-- CreateIndex
CREATE INDEX "res_group_message_user_id_idx" ON "res_group_message"("user_id");

-- CreateIndex
CREATE INDEX "res_group_message_group_id_created_at_idx" ON "res_group_message"("group_id", "created_at");

-- CreateIndex
CREATE INDEX "res_event_created_by_idx" ON "res_event"("created_by");

-- CreateIndex
CREATE INDEX "res_event_start_time_idx" ON "res_event"("start_time");

-- CreateIndex
CREATE INDEX "res_event_is_public_idx" ON "res_event"("is_public");

-- CreateIndex
CREATE INDEX "res_event_participant_event_id_idx" ON "res_event_participant"("event_id");

-- CreateIndex
CREATE INDEX "res_event_participant_user_id_idx" ON "res_event_participant"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_event_participant_event_id_user_id_key" ON "res_event_participant"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "res_post_created_at_idx" ON "res_post"("created_at");

-- AddForeignKey
ALTER TABLE "res_comment" ADD CONSTRAINT "res_comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "res_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_comment" ADD CONSTRAINT "res_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_comment" ADD CONSTRAINT "res_comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "res_comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_post_like" ADD CONSTRAINT "res_post_like_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "res_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_post_like" ADD CONSTRAINT "res_post_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_post_media" ADD CONSTRAINT "res_post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "res_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_story" ADD CONSTRAINT "res_story_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_group_member" ADD CONSTRAINT "res_group_member_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "res_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_group_member" ADD CONSTRAINT "res_group_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_group_message" ADD CONSTRAINT "res_group_message_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "res_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_group_message" ADD CONSTRAINT "res_group_message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_event" ADD CONSTRAINT "res_event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_event_participant" ADD CONSTRAINT "res_event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "res_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_event_participant" ADD CONSTRAINT "res_event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
