// Import Module decorator từ NestJS
import { Module } from '@nestjs/common';
// Import ConfigModule từ @nestjs/config
import { ConfigModule } from '@nestjs/config';
// Import config files
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * AppConfigModule - Module cấu hình global configuration
 *
 * Chức năng chính:
 * - Load environment variables từ .env file
 * - Register database và JWT configurations
 * - Global module, tất cả modules có thể sử dụng ConfigService
 *
 * Configurations:
 * - database: Database connection config
 * - jwt: JWT token config
 *
 * Lưu ý:
 * - isGlobal: true - Module này là global, không cần import vào các modules khác
 * - Load từ .env file trong project root
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
  ],
})
export class AppConfigModule {}
