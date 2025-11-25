#!/bin/sh
set -e

echo "🚀 Starting NestJS Application..."

# Check if using Docker PostgreSQL or external database (Neon, etc.)
if echo "${DATABASE_URL:-}" | grep -q "@postgres:"; then
  # Using Docker PostgreSQL - wait for it to be ready
  echo "⏳ Waiting for PostgreSQL to be ready..."
  until pg_isready -h postgres -U ${POSTGRES_USER:-postgres}; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
  done
  echo "✅ PostgreSQL is ready!"
else
  # Using external database (Neon, etc.) - skip PostgreSQL check
  echo "ℹ️  Using external database (skipping PostgreSQL container check)"
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
if npx prisma migrate deploy --schema=./src/prisma/schema.prisma 2>&1; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migration failed (might be already applied or Prisma CLI issue)"
  echo "💡 You can run migrations manually: npx prisma migrate deploy"
fi

# Generate Prisma Client (just to be sure)
echo "📦 Generating Prisma Client..."
if npx prisma generate --schema=./src/prisma/schema.prisma 2>&1; then
  echo "✅ Prisma Client generated successfully"
else
  echo "⚠️  Prisma Client generation failed, but continuing..."
  echo "💡 Prisma Client might already be generated"
fi

echo "✨ Starting the application..."
# Start the application (file main.js ở dist/main.js)
exec node dist/main.js

