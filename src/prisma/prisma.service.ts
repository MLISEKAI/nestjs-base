// Import Injectable, OnModuleInit, OnModuleDestroy và Logger từ NestJS
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
// Import PrismaClient từ @prisma/client
import { PrismaClient } from '@prisma/client';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * PrismaService - Service xử lý database operations với Prisma ORM
 *
 * Chức năng chính:
 * - Kết nối database khi module khởi động
 * - Ngắt kết nối database khi module destroy
 * - Cung cấp PrismaClient để query database
 *
 * Lưu ý:
 * - Extends PrismaClient để có tất cả Prisma methods
 * - Implements OnModuleInit và OnModuleDestroy để quản lý lifecycle
 * - Log errors và warnings
 * - Error format: 'pretty' (dễ đọc)
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }
}
