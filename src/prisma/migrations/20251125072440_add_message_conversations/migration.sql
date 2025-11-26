/*
  Warnings:

  - Added the required column `updated_at` to the `res_message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "res_message" DROP CONSTRAINT "res_message_receiver_id_fkey";

-- AlterTable
ALTER TABLE "res_group" ADD COLUMN     "classification" TEXT,
ADD COLUMN     "introduction" TEXT,
ADD COLUMN     "max_members" INTEGER NOT NULL DEFAULT 120;

-- AlterTable
ALTER TABLE "res_group_member" ADD COLUMN     "left_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "res_message" ADD COLUMN     "business_card_user_id" TEXT,
ADD COLUMN     "conversation_id" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "gift_id" TEXT,
ADD COLUMN     "is_forwarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "media_duration" INTEGER,
ADD COLUMN     "media_size" INTEGER,
ADD COLUMN     "media_thumbnail" TEXT,
ADD COLUMN     "media_url" TEXT,
ADD COLUMN     "original_message_id" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "waveform" TEXT,
ALTER COLUMN "receiver_id" DROP NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "res_conversation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "res_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_conversation_participant" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "gift_sounds_enabled" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "res_conversation_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_conversation_settings" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "gift_sounds_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_conversation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_conversation_group_id_key" ON "res_conversation"("group_id");

-- CreateIndex
CREATE INDEX "res_conversation_created_by_idx" ON "res_conversation"("created_by");

-- CreateIndex
CREATE INDEX "res_conversation_type_idx" ON "res_conversation"("type");

-- CreateIndex
CREATE INDEX "res_conversation_updated_at_idx" ON "res_conversation"("updated_at");

-- CreateIndex
CREATE INDEX "res_conversation_deleted_at_idx" ON "res_conversation"("deleted_at");

-- CreateIndex
CREATE INDEX "res_conversation_participant_conversation_id_idx" ON "res_conversation_participant"("conversation_id");

-- CreateIndex
CREATE INDEX "res_conversation_participant_user_id_idx" ON "res_conversation_participant"("user_id");

-- CreateIndex
CREATE INDEX "res_conversation_participant_conversation_id_left_at_idx" ON "res_conversation_participant"("conversation_id", "left_at");

-- CreateIndex
CREATE UNIQUE INDEX "res_conversation_participant_conversation_id_user_id_key" ON "res_conversation_participant"("conversation_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_conversation_settings_conversation_id_key" ON "res_conversation_settings"("conversation_id");

-- CreateIndex
CREATE INDEX "res_group_classification_idx" ON "res_group"("classification");

-- CreateIndex
CREATE INDEX "res_group_member_group_id_role_idx" ON "res_group_member"("group_id", "role");

-- CreateIndex
CREATE INDEX "res_group_member_group_id_left_at_idx" ON "res_group_member"("group_id", "left_at");

-- CreateIndex
CREATE INDEX "res_message_conversation_id_idx" ON "res_message"("conversation_id");

-- CreateIndex
CREATE INDEX "res_message_conversation_id_created_at_idx" ON "res_message"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "res_message_conversation_id_is_read_idx" ON "res_message"("conversation_id", "is_read");

-- CreateIndex
CREATE INDEX "res_message_deleted_at_idx" ON "res_message"("deleted_at");

-- AddForeignKey
ALTER TABLE "res_conversation" ADD CONSTRAINT "res_conversation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_conversation" ADD CONSTRAINT "res_conversation_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "res_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_conversation_participant" ADD CONSTRAINT "res_conversation_participant_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "res_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_conversation_participant" ADD CONSTRAINT "res_conversation_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_conversation_settings" ADD CONSTRAINT "res_conversation_settings_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "res_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_message" ADD CONSTRAINT "res_message_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "res_gift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_message" ADD CONSTRAINT "res_message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "res_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_message" ADD CONSTRAINT "res_message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
