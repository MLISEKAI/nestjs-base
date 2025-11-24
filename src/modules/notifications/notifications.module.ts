// Import Module decorator và forwardRef từ NestJS
import { Module, forwardRef } from '@nestjs/common';
// Import các modules khác để sử dụng
import { PrismaModule } from 'src/prisma/prisma.module';
// Import controllers
import { NotificationController } from './controller/notification.controller';
import { NotificationAdminController } from './controller/notification-admin.controller';
// Import services
import { NotificationService } from './service/notification.service';
// Import RealtimeModule với forwardRef để tránh circular dependency
import { RealtimeModule } from '../realtime/realtime.module';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * NotificationsModule - Module xử lý notifications operations
 *
 * Chức năng chính:
 * - CRUD notifications
 * - Push notifications (real-time)
 * - Notification statistics (unread count, etc.)
 * - Admin operations (quản lý notifications)
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - RealtimeModule: Real-time notifications (forwardRef để tránh circular dependency)
 *
 * Exports:
 * - NotificationService: Để các modules khác sử dụng (ví dụ: PostsModule để tạo notification khi có like/comment)
 */
@Module({
  imports: [PrismaModule, forwardRef(() => RealtimeModule)],
  controllers: [NotificationController, NotificationAdminController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
