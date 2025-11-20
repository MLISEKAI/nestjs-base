-- CreateTable
CREATE TABLE "res_payment_method" (
    "id" TEXT NOT NULL,
    "method_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "masked_info" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_payment_method_method_id_key" ON "res_payment_method"("method_id");

-- CreateIndex
CREATE INDEX "res_payment_method_method_id_idx" ON "res_payment_method"("method_id");

-- CreateIndex
CREATE INDEX "res_payment_method_is_active_idx" ON "res_payment_method"("is_active");
