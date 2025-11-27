# Multi-stage build for NestJS application
# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies including devDependencies for build
# Sử dụng npm install thay vì npm ci để tránh lỗi lock file sync
RUN npm install --legacy-peer-deps

# Đảm bảo dùng đúng Prisma version từ package.json
RUN npm install prisma@^6.19.0 --legacy-peer-deps --save-dev

# Copy source code and prisma schema
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate --schema=./src/prisma/schema.prisma

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine3.19 AS production

# Install required tools
RUN apk add --no-cache wget postgresql-client bash

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma

# Generate Prisma Client for production (sử dụng binaryTargets từ schema)
RUN npx prisma generate --schema=./src/prisma/schema.prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

