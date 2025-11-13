-- CreateTable
CREATE TABLE "res_post" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_post_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "res_post" ADD CONSTRAINT "res_post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
