-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "labels" TEXT[],
    "is_protected" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "host_id" TEXT NOT NULL,
    "max_participants" INTEGER NOT NULL DEFAULT 10,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "layout_id" TEXT NOT NULL DEFAULT 'layout_1',
    "background_id" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "cover_url" TEXT,
    "description" TEXT,
    "notice" TEXT,
    "settings" JSONB,
    "stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_participants" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seat_id" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'listener',
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_camera_on" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "room_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_messages" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_gifts" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "gift_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_cost" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_seats" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "seat_id" INTEGER NOT NULL,
    "user_id" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "room_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_blacklist" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_managers" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_challenges" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "current_points" INTEGER NOT NULL DEFAULT 0,
    "required_points" INTEGER NOT NULL DEFAULT 100000,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_boost_history" (
    "id" BIGSERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "boost_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "room_boost_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rooms_host_id_idx" ON "rooms"("host_id");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "rooms_mode_idx" ON "rooms"("mode");

-- CreateIndex
CREATE INDEX "rooms_created_at_idx" ON "rooms"("created_at");

-- CreateIndex
CREATE INDEX "room_participants_room_id_idx" ON "room_participants"("room_id");

-- CreateIndex
CREATE INDEX "room_participants_user_id_idx" ON "room_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_participants_room_id_user_id_key" ON "room_participants"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "room_messages_room_id_idx" ON "room_messages"("room_id");

-- CreateIndex
CREATE INDEX "room_messages_created_at_idx" ON "room_messages"("created_at");

-- CreateIndex
CREATE INDEX "room_gifts_room_id_idx" ON "room_gifts"("room_id");

-- CreateIndex
CREATE INDEX "room_gifts_sender_id_idx" ON "room_gifts"("sender_id");

-- CreateIndex
CREATE INDEX "room_gifts_recipient_id_idx" ON "room_gifts"("recipient_id");

-- CreateIndex
CREATE INDEX "room_gifts_created_at_idx" ON "room_gifts"("created_at");

-- CreateIndex
CREATE INDEX "room_seats_room_id_idx" ON "room_seats"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_seats_room_id_seat_id_key" ON "room_seats"("room_id", "seat_id");

-- CreateIndex
CREATE INDEX "room_blacklist_room_id_idx" ON "room_blacklist"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_blacklist_room_id_user_id_key" ON "room_blacklist"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "room_managers_room_id_idx" ON "room_managers"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_managers_room_id_user_id_key" ON "room_managers"("room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_challenges_room_id_key" ON "room_challenges"("room_id");

-- CreateIndex
CREATE INDEX "room_boost_history_room_id_idx" ON "room_boost_history"("room_id");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_gifts" ADD CONSTRAINT "room_gifts_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_gifts" ADD CONSTRAINT "room_gifts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_gifts" ADD CONSTRAINT "room_gifts_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_seats" ADD CONSTRAINT "room_seats_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_seats" ADD CONSTRAINT "room_seats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_blacklist" ADD CONSTRAINT "room_blacklist_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_blacklist" ADD CONSTRAINT "room_blacklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_managers" ADD CONSTRAINT "room_managers_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_managers" ADD CONSTRAINT "room_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_challenges" ADD CONSTRAINT "room_challenges_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_boost_history" ADD CONSTRAINT "room_boost_history_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_boost_history" ADD CONSTRAINT "room_boost_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "res_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
