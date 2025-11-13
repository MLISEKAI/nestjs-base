-- CreateTable
CREATE TABLE "res_love_space" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_love_space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_support_info" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_support_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_help_article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_help_article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "res_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_location" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_contribution" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "res_contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_interest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "res_interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_supporter" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "supporter_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "res_supporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_relationship" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "related_user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "res_relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "res_room_status" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "res_room_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "res_love_space_user_id_key" ON "res_love_space"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_location_user_id_key" ON "res_location"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_contribution_user_id_key" ON "res_contribution"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "res_room_status_user_id_key" ON "res_room_status"("user_id");

-- AddForeignKey
ALTER TABLE "res_love_space" ADD CONSTRAINT "res_love_space_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_feedback" ADD CONSTRAINT "res_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_location" ADD CONSTRAINT "res_location_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_contribution" ADD CONSTRAINT "res_contribution_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_interest" ADD CONSTRAINT "res_interest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_supporter" ADD CONSTRAINT "res_supporter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_relationship" ADD CONSTRAINT "res_relationship_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "res_room_status" ADD CONSTRAINT "res_room_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
