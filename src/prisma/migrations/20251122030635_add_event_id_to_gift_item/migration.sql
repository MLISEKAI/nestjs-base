-- AlterTable
ALTER TABLE "res_gift_item" ADD COLUMN     "event_id" TEXT;

-- CreateIndex
CREATE INDEX "res_gift_item_event_id_idx" ON "res_gift_item"("event_id");

-- AddForeignKey
ALTER TABLE "res_gift_item" ADD CONSTRAINT "res_gift_item_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "res_event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
