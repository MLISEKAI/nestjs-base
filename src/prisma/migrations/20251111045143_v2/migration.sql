-- CreateTable
CREATE TABLE "res_wallet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'gem',

    CONSTRAINT "res_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_vip_status" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "expiry" TIMESTAMP(3),

    CONSTRAINT "res_vip_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_store_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "res_store_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_task" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "res_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_inventory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "res_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_clan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "res_clan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_user_clan" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "rank" TEXT NOT NULL,

    CONSTRAINT "res_user_clan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_referral" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_id" TEXT NOT NULL,
    "reward_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_profile_view" (
    "id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_profile_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_wallet_user_id_key" ON "res_wallet"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_vip_status_user_id_key" ON "res_vip_status"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_referral_referrer_id_referred_id_key" ON "res_referral"("referrer_id", "referred_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_profile_view_viewer_id_target_user_id_key" ON "res_profile_view"("viewer_id", "target_user_id");

-- AddForeignKey
ALTER TABLE "res_wallet" ADD CONSTRAINT "res_wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_vip_status" ADD CONSTRAINT "res_vip_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_store_item" ADD CONSTRAINT "res_store_item_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_task" ADD CONSTRAINT "res_task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_inventory" ADD CONSTRAINT "res_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_user_clan" ADD CONSTRAINT "res_user_clan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_user_clan" ADD CONSTRAINT "res_user_clan_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "res_clan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_referral" ADD CONSTRAINT "res_referral_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_referral" ADD CONSTRAINT "res_referral_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_profile_view" ADD CONSTRAINT "res_profile_view_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_profile_view" ADD CONSTRAINT "res_profile_view_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
