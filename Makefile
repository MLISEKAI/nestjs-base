# Makefile for NestJS Docker Application
# Usage: make <command>

.PHONY: help build up down restart logs ps clean test migrate seed

# Default command
.DEFAULT_GOAL := help

# Colors for terminal output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Help command
help: ## Show this help message
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# ====================
# Docker Commands
# ====================

build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build --no-cache

build-prod: ## Build production Docker images
	@echo "$(GREEN)Building production Docker images...$(NC)"
	docker-compose -f docker-compose.yml build --no-cache

up: ## Start all services (production)
	@echo "$(GREEN)Starting all services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started! App: http://localhost:3001$(NC)"

up-build: ## Build and start all services
	@echo "$(GREEN)Building and starting all services...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)Services started! App: http://localhost:3001$(NC)"

dev: ## Start development mode (only databases)
	@echo "$(GREEN)Starting development databases...$(NC)"
	docker-compose up -d postgres redis
	@echo "$(GREEN)Databases started!$(NC)"
	@echo "$(GREEN)PostgreSQL: localhost:5432$(NC)"
	@echo "$(GREEN)Redis: localhost:6379$(NC)"
	@echo "$(YELLOW)Now run: npm run start:dev$(NC)"

dev-up: dev ## Alias for dev

local: ## Start local mode (only PostgreSQL)
	@echo "$(GREEN)Starting PostgreSQL only...$(NC)"
	docker-compose up -d postgres
	@echo "$(GREEN)PostgreSQL started on port 5432$(NC)"
	@echo "$(YELLOW)Now run: npm run start:dev$(NC)"

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose down

down-v: ## Stop all services and remove volumes (DELETE DATA)
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@echo "Press Ctrl+C to cancel or wait 5 seconds..."
	@sleep 5
	docker-compose down -v

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(NC)"
	docker-compose restart

stop: ## Stop services without removing containers
	@echo "$(YELLOW)Stopping services...$(NC)"
	docker-compose stop

start: ## Start stopped services
	@echo "$(GREEN)Starting services...$(NC)"
	docker-compose start

# ====================
# Logs & Monitoring
# ====================

logs: ## Show logs of all services
	docker-compose logs -f

logs-app: ## Show logs of app service only
	docker-compose logs -f app

logs-db: ## Show logs of database service
	docker-compose logs -f postgres

logs-redis: ## Show logs of redis service
	docker-compose logs -f redis

ps: ## Show status of all services
	docker-compose ps

stats: ## Show resource usage statistics
	docker stats

# ====================
# Database Commands
# ====================

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	@echo "$(YELLOW)Note: If container Prisma CLI fails, run from local:$(NC)"
	@echo "$(YELLOW)  npx prisma migrate deploy --schema=./src/prisma/schema.prisma$(NC)"
	@docker-compose exec app npx prisma migrate deploy --schema=./src/prisma/schema.prisma || \
		(echo "$(YELLOW)Container migration failed, trying from local...$(NC)" && \
		 npx prisma migrate deploy --schema=./src/prisma/schema.prisma)

migrate-dev: ## Create new migration (development)
	@echo "$(GREEN)Creating new migration...$(NC)"
	@read -p "Migration name: " name; \
	docker-compose exec app npx prisma migrate dev --name $$name --schema=./src/prisma/schema.prisma

migrate-reset: ## Reset database (DELETE ALL DATA)
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@echo "Press Ctrl+C to cancel or wait 5 seconds..."
	@sleep 5
	docker-compose exec app npx prisma migrate reset --schema=./src/prisma/schema.prisma

generate: ## Generate Prisma Client
	@echo "$(GREEN)Generating Prisma Client...$(NC)"
	@docker-compose exec app npx prisma generate --schema=./src/prisma/schema.prisma || \
		(echo "$(YELLOW)Container generation failed, trying from local...$(NC)" && \
		 npx prisma generate --schema=./src/prisma/schema.prisma)

studio: ## Open Prisma Studio (Database GUI)
	@echo "$(GREEN)Opening Prisma Studio...$(NC)"
	@echo "$(YELLOW)Note: If container Prisma CLI fails, run from local:$(NC)"
	@echo "$(YELLOW)  npx prisma studio --schema=./src/prisma/schema.prisma$(NC)"
	@docker-compose exec app npx prisma studio --schema=./src/prisma/schema.prisma || \
		(echo "$(YELLOW)Container studio failed, running from local...$(NC)" && \
		 npx prisma studio --schema=./src/prisma/schema.prisma)

db-shell: ## Connect to PostgreSQL shell
	@echo "$(GREEN)Connecting to PostgreSQL...$(NC)"
	docker-compose exec postgres psql -U postgres -d nestjs_db

redis-cli: ## Connect to Redis CLI
	@echo "$(GREEN)Connecting to Redis CLI...$(NC)"
	docker-compose exec redis redis-cli -a redis_password

# ====================
# Seed Commands
# ====================

seed: ## Seed all data
	@echo "$(GREEN)Seeding database...$(NC)"
	docker-compose exec app npm run seed:gifts
	docker-compose exec app npm run seed:wallet
	docker-compose exec app npm run seed:posts

seed-gifts: ## Seed gifts data
	docker-compose exec app npm run seed:gifts

seed-wallet: ## Seed wallet data
	docker-compose exec app npm run seed:wallet

seed-posts: ## Seed posts data
	docker-compose exec app npm run seed:posts

seed-clear: ## Clear posts data
	docker-compose exec app npm run clear:posts

# ====================
# Backup & Restore
# ====================

backup: ## Backup database
	@echo "$(GREEN)Backing up database...$(NC)"
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U postgres nestjs_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup saved to backups/$(NC)"

restore: ## Restore database from backup (usage: make restore FILE=backup.sql)
	@echo "$(YELLOW)Restoring database from $(FILE)...$(NC)"
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify FILE=backup.sql$(NC)"; \
		exit 1; \
	fi
	docker-compose exec -T postgres psql -U postgres -d nestjs_db < $(FILE)
	@echo "$(GREEN)Database restored!$(NC)"

# ====================
# Maintenance
# ====================

clean: ## Clean up Docker resources
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker-compose down
	docker system prune -f
	@echo "$(GREEN)Cleanup completed!$(NC)"

clean-all: ## Clean everything including volumes (DELETE ALL DATA)
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@echo "Press Ctrl+C to cancel or wait 5 seconds..."
	@sleep 5
	docker-compose down -v
	docker system prune -a -f
	docker volume prune -f
	@echo "$(GREEN)Complete cleanup done!$(NC)"

rebuild: ## Rebuild everything from scratch
	@echo "$(YELLOW)Rebuilding everything...$(NC)"
	make down
	make build
	make up

reset: clean-all rebuild ## Reset everything and rebuild

# ====================
# Shell Access
# ====================

shell: ## Access app container shell
	docker-compose exec app sh

shell-db: ## Access database container shell
	docker-compose exec postgres sh

shell-redis: ## Access redis container shell
	docker-compose exec redis sh

# ====================
# Testing & Development
# ====================

test: ## Run tests in container
	docker-compose exec app npm test

test-e2e: ## Run E2E tests
	docker-compose exec app npm run test:e2e

lint: ## Run linter
	docker-compose exec app npm run lint

format: ## Format code
	docker-compose exec app npm run format

# ====================
# Health & Status
# ====================

health: ## Check health status
	@echo "$(GREEN)Checking health status...$(NC)"
	@echo "App: $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/ || echo 'DOWN')"
	@docker-compose ps

api: ## Open API documentation in browser
	@echo "$(GREEN)Opening Swagger API docs...$(NC)"
	@which xdg-open > /dev/null && xdg-open http://localhost:3001/api || open http://localhost:3001/api || start http://localhost:3001/api

# ====================
# Environment Setup
# ====================

env: ## Create .env file from example
	@if [ -f .env ]; then \
		echo "$(YELLOW).env file already exists!$(NC)"; \
	else \
		cp env.example .env; \
		echo "$(GREEN).env file created from env.example$(NC)"; \
		echo "$(YELLOW)Please edit .env file with your settings$(NC)"; \
	fi

init: env ## Initialize project (create .env, install deps)
	@echo "$(GREEN)Initializing project...$(NC)"
	npm install
	@echo "$(GREEN)Project initialized!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Edit .env file with your configuration"
	@echo "  2. Run: make dev (for development)"
	@echo "  3. Run: npm run start:dev"
	@echo "  OR"
	@echo "  1. Run: make up-build (for production in Docker)"

# ====================
# Quick Commands
# ====================

dev-run: dev ## Start dev databases and run app locally
	@echo "$(GREEN)Starting development environment...$(NC)"
	npm run start:dev

prod-run: up-build ## Build and run production environment
	@echo "$(GREEN)Production environment started!$(NC)"
	@echo "$(GREEN)API: http://localhost:3001$(NC)"
	@echo "$(GREEN)Swagger: http://localhost:3001/api$(NC)"

