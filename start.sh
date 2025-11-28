#!/bin/bash
# start.sh – Production Start Script cho NestJS + Prisma + Postgres (Docker & External DB)

set -euo pipefail  # Tốt hơn set -e (bắt cả lỗi undefined variable)

echo "Starting NestJS Application..."

# =================================================================
# 1. Chờ PostgreSQL (chỉ khi dùng Docker container tên "postgres")
# =================================================================
if echo "${DATABASE_URL:-}" | grep -q "postgres:\|postgresql:"; then
  # Nếu DATABASE_URL có dạng postgres://... thì mới cần chờ DB
  echo "Waiting for database to be ready..."

  # Extract host từ DATABASE_URL (ví dụ: postgres, db, localhost...)
  DB_HOST=$(echo $DATABASE_URL | sed -E 's|.*/@(.*):[0-9]+/.*|\1|' || echo "postgres")

  until pg_isready -h "$DB_HOST" -p 5432 -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; do
    echo "PostgreSQL ($DB_HOST) is not ready yet - sleeping 2s..."
    sleep 2
  done
  echo "PostgreSQL is up and running!"
else
  echo "No PostgreSQL DATABASE_URL detected → skipping DB health check"
fi

# =================================================================
# 2. Chạy Prisma migrations (production = deploy)
# =================================================================
echo "Applying database migrations..."
if npx prisma migrate deploy --schema=./src/prisma/schema.prisma; then
  echo "Migrations applied successfully"
else
  echo "Migration failed or no migrations to apply (this is often normal in prod)"
fi

# =================================================================
# 3. Generate Prisma Client (bắt buộc nếu có thay đổi schema)
# =================================================================
echo "Generating Prisma Client..."
npx prisma generate --schema=./src/prisma/schema.prisma || {
  echo "Prisma generate failed – but continuing (might be cached)"
}

# =================================================================
# 4. Build TypeScript (nếu chưa build – Render/Railway/Fly.io cần)
# =================================================================
if [ ! -d "dist" ] || [ -z "$(ls -A dist/*.js 2>/dev/null)" ]; then
  echo "dist/ not found or empty → building project..."
  yarn build || npm run build
else
  echo "dist/ already exists → skipping build"
fi

# =================================================================
# 5. Khởi động ứng dụng (cách pro nhất)
# =================================================================
echo "Starting NestJS application..."

# Cách 1: Dùng node thuần (tốt cho Docker, Render, Railway, Fly.io)
exec node dist/main.js

# Cách 2: Nếu bạn cài PM2 trong production (zero-downtime reload, cluster)
# pm2-runtime start dist/main.js --name "my-nest-app" --env production

# Cách 3: Nếu muốn graceful shutdown (nhận SIGTERM từ Docker)
# exec node dist/main.js