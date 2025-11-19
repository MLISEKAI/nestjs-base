-- CreateIndex
CREATE INDEX "res_gift_receiver_id_created_at_idx" ON "res_gift"("receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "res_gift_created_at_idx" ON "res_gift"("created_at");

-- CreateIndex
CREATE INDEX "res_gift_item_category_id_idx" ON "res_gift_item"("category_id");

-- CreateIndex
CREATE INDEX "res_gift_item_type_idx" ON "res_gift_item"("type");

-- CreateIndex
CREATE INDEX "res_gift_item_category_id_type_idx" ON "res_gift_item"("category_id", "type");

-- CreateIndex
CREATE INDEX "res_gift_milestone_user_id_idx" ON "res_gift_milestone"("user_id");

-- CreateIndex
CREATE INDEX "res_gift_milestone_user_id_is_unlocked_idx" ON "res_gift_milestone"("user_id", "is_unlocked");

-- CreateIndex
CREATE INDEX "res_message_receiver_id_created_at_idx" ON "res_message"("receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "res_message_created_at_idx" ON "res_message"("created_at");
