-- CreateIndex
CREATE INDEX "res_user_nickname_created_at_idx" ON "res_user"("nickname", "created_at");

-- CreateIndex
CREATE INDEX "res_user_is_deleted_is_blocked_created_at_idx" ON "res_user"("is_deleted", "is_blocked", "created_at");
