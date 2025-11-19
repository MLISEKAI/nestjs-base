-- CreateTable
CREATE TABLE "res_block" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,

    CONSTRAINT "res_block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_block_blocker_id_idx" ON "res_block"("blocker_id");

-- CreateIndex
CREATE INDEX "res_block_blocked_id_idx" ON "res_block"("blocked_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_block_blocker_id_blocked_id_key" ON "res_block"("blocker_id", "blocked_id");

-- AddForeignKey
ALTER TABLE "res_block" ADD CONSTRAINT "res_block_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_block" ADD CONSTRAINT "res_block_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
