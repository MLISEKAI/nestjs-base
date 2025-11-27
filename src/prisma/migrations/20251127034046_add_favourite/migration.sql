-- CreateTable
CREATE TABLE "res_favourite" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "favourite_id" TEXT NOT NULL,

    CONSTRAINT "res_favourite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_favourite_user_id_idx" ON "res_favourite"("user_id");

-- CreateIndex
CREATE INDEX "res_favourite_favourite_id_idx" ON "res_favourite"("favourite_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_favourite_user_id_favourite_id_key" ON "res_favourite"("user_id", "favourite_id");

-- AddForeignKey
ALTER TABLE "res_favourite" ADD CONSTRAINT "res_favourite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_favourite" ADD CONSTRAINT "res_favourite_favourite_id_fkey" FOREIGN KEY ("favourite_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
