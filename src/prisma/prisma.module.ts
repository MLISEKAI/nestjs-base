// Import Module và Global decorator từ NestJS
import { Module, Global } from '@nestjs/common';
// Import PrismaService
import { PrismaService } from './prisma.service';

/**
 * @Global() - Module này là global, có thể được inject vào bất kỳ module nào mà không cần import
 * @Module() - Đánh dấu class này là NestJS module
 * PrismaModule - Module cung cấp PrismaService cho toàn bộ application
 *
 * Chức năng chính:
 * - Export PrismaService để tất cả modules có thể sử dụng
 * - Global module, không cần import vào các modules khác
 *
 * Exports:
 * - PrismaService: Database service để query database
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
