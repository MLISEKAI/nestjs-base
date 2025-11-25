@echo off
REM Docker Helper Script for Windows
REM Usage: docker.bat <command>

setlocal enabledelayedexpansion

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="build" goto build
if "%1"=="up" goto up
if "%1"=="down" goto down
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="ps" goto ps
if "%1"=="dev" goto dev
if "%1"=="migrate" goto migrate
if "%1"=="seed" goto seed
if "%1"=="backup" goto backup
if "%1"=="clean" goto clean
if "%1"=="shell" goto shell
if "%1"=="generate" goto generate
if "%1"=="studio" goto studio
goto unknown

:help
echo.
echo ====================================
echo   NestJS Docker Helper - Windows
echo ====================================
echo.
echo Available commands:
echo.
echo   build       - Build Docker images
echo   up          - Start all services
echo   down        - Stop all services
echo   restart     - Restart all services
echo   logs        - Show logs
echo   ps          - Show container status
echo   dev         - Start development mode
echo   migrate     - Run database migrations
echo   seed        - Seed database
echo   backup      - Backup database
echo   clean       - Clean Docker resources
echo   shell       - Access container shell
echo   generate    - Generate Prisma Client
echo   studio      - Open Prisma Studio
echo   help        - Show this help
echo.
goto end

:build
echo Building Docker images...
docker-compose build --no-cache
echo Done!
goto end

:up
echo Starting all services...
docker-compose up -d --build
echo.
echo Services started!
echo API: http://localhost:3001
echo Swagger: http://localhost:3001/api
goto end

:down
echo Stopping all services...
docker-compose down
echo Done!
goto end

:restart
echo Restarting all services...
docker-compose restart
echo Done!
goto end

:logs
if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
goto end

:ps
docker-compose ps
goto end

:dev
echo Starting development mode (databases only)...
docker-compose up -d postgres redis
echo.
echo Databases started!
echo PostgreSQL: localhost:5432
echo Redis: localhost:6379
echo.
echo Now run: npm run start:dev
goto end

:migrate
echo Running database migrations...
echo.
echo Option 1: Run in container (if Prisma CLI works)
docker-compose exec app npx prisma migrate deploy --schema=./src/prisma/schema.prisma 2>nul || (
    echo.
    echo Option 2: Run from local machine (recommended for Neon/external DB)
    npx prisma migrate deploy --schema=./src/prisma/schema.prisma
)
echo Done!
goto end

:seed
echo Seeding database...
docker-compose exec app npm run seed:gifts
docker-compose exec app npm run seed:wallet
docker-compose exec app npm run seed:posts
echo Done!
goto end

:backup
echo Backing up database...
if not exist backups mkdir backups
set timestamp=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
docker-compose exec postgres pg_dump -U postgres nestjs_db > backups\backup_%timestamp%.sql
echo Backup saved to backups\backup_%timestamp%.sql
goto end

:clean
echo Cleaning Docker resources...
docker-compose down
docker system prune -f
echo Done!
goto end

:shell
if "%2"=="" (
    echo Accessing app container...
    docker-compose exec app sh
) else (
    echo Accessing %2 container...
    docker-compose exec %2 sh
)
goto end

:generate
echo Generating Prisma Client...
echo.
echo Option 1: Run in container
docker-compose exec app npx prisma generate --schema=./src/prisma/schema.prisma 2>nul || (
    echo.
    echo Option 2: Run from local machine
    npx prisma generate --schema=./src/prisma/schema.prisma
)
echo Done!
goto end

:studio
echo Opening Prisma Studio...
echo.
echo Note: If container Prisma CLI doesn't work, run from local:
echo   npx prisma studio --schema=./src/prisma/schema.prisma
echo.
docker-compose exec app npx prisma studio --schema=./src/prisma/schema.prisma 2>nul || (
    echo Running from local machine instead...
    npx prisma studio --schema=./src/prisma/schema.prisma
)
goto end

:unknown
echo Unknown command: %1
echo Run "docker.bat help" for available commands
goto end

:end
endlocal

