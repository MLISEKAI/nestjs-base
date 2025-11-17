-- CreateEnum
CREATE TYPE "VerificationCodeType" AS ENUM ('email', 'phone');

-- AlterTable
ALTER TABLE "res_associate" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "res_token_blacklist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "jti" TEXT NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_token_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_verification_code" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "target" TEXT NOT NULL,
    "type" "VerificationCodeType" NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_verification_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_refresh_token" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_ip" TEXT,
    "replaced_by_id" TEXT,

    CONSTRAINT "res_refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_two_factor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_token_blacklist_jti_key" ON "res_token_blacklist"("jti");

-- CreateIndex
CREATE INDEX "res_token_blacklist_expires_at_idx" ON "res_token_blacklist"("expires_at");

-- CreateIndex
CREATE INDEX "res_verification_code_target_type_idx" ON "res_verification_code"("target", "type");

-- CreateIndex
CREATE INDEX "res_refresh_token_user_id_idx" ON "res_refresh_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_two_factor_user_id_key" ON "res_two_factor"("user_id");

-- AddForeignKey
ALTER TABLE "res_token_blacklist" ADD CONSTRAINT "res_token_blacklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_verification_code" ADD CONSTRAINT "res_verification_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_refresh_token" ADD CONSTRAINT "res_refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_two_factor" ADD CONSTRAINT "res_two_factor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
