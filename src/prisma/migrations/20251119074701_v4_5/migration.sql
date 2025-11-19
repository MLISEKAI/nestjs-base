-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'FOLLOW', 'LIKE', 'COMMENT', 'GIFT', 'POST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ');

-- CreateTable
CREATE TABLE "res_notification" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" TEXT,
    "link" TEXT,

    CONSTRAINT "res_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_notification_user_id_status_idx" ON "res_notification"("user_id", "status");

-- CreateIndex
CREATE INDEX "res_notification_user_id_created_at_idx" ON "res_notification"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "res_notification_status_idx" ON "res_notification"("status");

-- AddForeignKey
ALTER TABLE "res_notification" ADD CONSTRAINT "res_notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_notification" ADD CONSTRAINT "res_notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
