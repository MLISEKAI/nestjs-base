/*
  Warnings:

  - You are about to drop the column `image` on the `res_gift` table. All the data in the column will be lost.
  - You are about to drop the column `item_name` on the `res_gift` table. All the data in the column will be lost.
  - You are about to drop the column `item_name` on the `res_inventory` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `res_wallet` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - A unique constraint covering the columns `[user_id,item_id]` on the table `res_inventory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,supporter_id]` on the table `res_supporter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gift_item_id` to the `res_gift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_id` to the `res_inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `res_wallet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('deposit', 'withdraw', 'gift', 'convert');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "WalletCurrency" AS ENUM ('gem', 'vex');

-- DropForeignKey
ALTER TABLE "res_gift" DROP CONSTRAINT "res_gift_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "res_gift" DROP CONSTRAINT "res_gift_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "res_inventory" DROP CONSTRAINT "res_inventory_user_id_fkey";

-- DropForeignKey
ALTER TABLE "res_supporter" DROP CONSTRAINT "res_supporter_user_id_fkey";

-- DropForeignKey
ALTER TABLE "res_wallet" DROP CONSTRAINT "res_wallet_user_id_fkey";

-- AlterTable
ALTER TABLE "res_gift" DROP COLUMN "image",
DROP COLUMN "item_name",
ADD COLUMN     "gift_item_id" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "res_inventory" DROP COLUMN "item_name",
ADD COLUMN     "item_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "res_supporter" ADD COLUMN     "resUserId" TEXT;

-- AlterTable
ALTER TABLE "res_wallet" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "res_gift_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "res_gift_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_gift_item" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "type" TEXT,

    CONSTRAINT "res_gift_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_gift_milestone" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "reward_name" TEXT,
    "icon_url" TEXT,
    "is_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_gift_milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_wallet_transaction" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance_before" DECIMAL(12,2),
    "balance_after" DECIMAL(12,2),
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'pending',
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_wallet_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "rarity" TEXT,
    "price" DECIMAL(10,2),
    "image_url" TEXT,

    CONSTRAINT "res_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "res_wallet_transaction_user_id_idx" ON "res_wallet_transaction"("user_id");

-- CreateIndex
CREATE INDEX "res_wallet_transaction_wallet_id_idx" ON "res_wallet_transaction"("wallet_id");

-- CreateIndex
CREATE INDEX "res_wallet_transaction_created_at_idx" ON "res_wallet_transaction"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "res_inventory_user_id_item_id_key" ON "res_inventory"("user_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_supporter_user_id_supporter_id_key" ON "res_supporter"("user_id", "supporter_id");

-- AddForeignKey
ALTER TABLE "res_gift" ADD CONSTRAINT "res_gift_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_gift" ADD CONSTRAINT "res_gift_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_gift" ADD CONSTRAINT "res_gift_gift_item_id_fkey" FOREIGN KEY ("gift_item_id") REFERENCES "res_gift_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_gift_item" ADD CONSTRAINT "res_gift_item_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "res_gift_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_gift_milestone" ADD CONSTRAINT "res_gift_milestone_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_wallet" ADD CONSTRAINT "res_wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_wallet_transaction" ADD CONSTRAINT "res_wallet_transaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "res_wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_wallet_transaction" ADD CONSTRAINT "res_wallet_transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_inventory" ADD CONSTRAINT "res_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_inventory" ADD CONSTRAINT "res_inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "res_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_supporter" ADD CONSTRAINT "res_supporter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_supporter" ADD CONSTRAINT "res_supporter_supporter_id_fkey" FOREIGN KEY ("supporter_id") REFERENCES "res_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_supporter" ADD CONSTRAINT "res_supporter_resUserId_fkey" FOREIGN KEY ("resUserId") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
