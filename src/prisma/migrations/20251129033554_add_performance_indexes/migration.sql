-- CreateIndex
CREATE INDEX "res_user_nickname_idx" ON "res_user"("nickname");

-- CreateIndex
CREATE INDEX "res_user_created_at_idx" ON "res_user"("created_at");

-- CreateIndex
CREATE INDEX "res_user_is_deleted_is_blocked_idx" ON "res_user"("is_deleted", "is_blocked");
