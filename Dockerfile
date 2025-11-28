# Multi-stage build for NestJS application with Yarn
# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy package files
COPY package.json yarn.lock .yarnrc ./

# Install dependencies with frozen lockfile
RUN yarn install --frozen-lockfile --production=false

# Stage 2: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and config files
COPY package.json yarn.lock .yarnrc ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Generate Prisma Client
RUN yarn prisma generate --schema=./src/prisma/schema.prisma

# Build application
RUN yarn build

# Remove dev dependencies
RUN yarn install --production --frozen-lockfile --ignore-scripts

# Stage 3: Production
FROM node:20-alpine AS production

# Install required tools
RUN apk add --no-cache \
    wget \
    postgresql-client \
    bash \
    dumb-init

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Set environment to production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY --chown=nestjs:nodejs package.json yarn.lock .yarnrc ./

# Copy production dependencies from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy Prisma schema and generated client
COPY --from=builder --chown=nestjs:nodejs /app/src/prisma ./src/prisma

# Copy entrypoint script
COPY --chown=nestjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Use entrypoint script
CMD ["/usr/local/bin/docker-entrypoint.sh"]

