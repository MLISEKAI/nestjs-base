/*
  Warnings:

  - A unique constraint covering the columns `[user_id,currency]` on the table `res_wallet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "res_wallet_user_id_key";

-- CreateTable
CREATE TABLE "res_recharge_package" (
    "id" TEXT NOT NULL,
    "package_id" INTEGER NOT NULL,
    "diamonds" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "bonus" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_recharge_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_monthly_card" (
    "id" TEXT NOT NULL,
    "card_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "diamonds_daily" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_monthly_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_deposit_address" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deposit_address" TEXT NOT NULL,
    "qr_code" TEXT,
    "network" TEXT NOT NULL DEFAULT 'Ethereum',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_deposit_address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_recharge_package_package_id_key" ON "res_recharge_package"("package_id");

-- CreateIndex
CREATE INDEX "res_recharge_package_package_id_idx" ON "res_recharge_package"("package_id");

-- CreateIndex
CREATE INDEX "res_recharge_package_is_active_idx" ON "res_recharge_package"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "res_monthly_card_card_id_key" ON "res_monthly_card"("card_id");

-- CreateIndex
CREATE INDEX "res_monthly_card_card_id_idx" ON "res_monthly_card"("card_id");

-- CreateIndex
CREATE INDEX "res_monthly_card_is_active_idx" ON "res_monthly_card"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "res_deposit_address_user_id_key" ON "res_deposit_address"("user_id");

-- CreateIndex
CREATE INDEX "res_deposit_address_user_id_idx" ON "res_deposit_address"("user_id");

-- CreateIndex
CREATE INDEX "res_wallet_user_id_idx" ON "res_wallet"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_wallet_user_id_currency_key" ON "res_wallet"("user_id", "currency");

-- AddForeignKey
ALTER TABLE "res_deposit_address" ADD CONSTRAINT "res_deposit_address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
