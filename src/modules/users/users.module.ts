// Import Module decorator và forwardRef từ NestJS
import { Module, forwardRef } from '@nestjs/common';
// Import các modules khác để sử dụng
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from '../../auth/guards/guards.module';
// Import services
import { UserProfileService } from './service/user-profile.service';
import { UserConnectionsService } from './service/user-connections.service';
import { UserAlbumsService } from './service/user-albums.service';
import { UserLevelService } from './service/user-level.service';
import { UserGiftWallService } from './service/user-gift-wall.service';
import { ResUserService } from './service/user.service';
// Import controllers
import { ConnectionsController } from './controller/connections.controller';
import { ConnectionsAdminController } from './controller/connections-admin.controller';
import { ConnectionsPublicController } from './controller/connections-public.controller';
import { UserController } from './controller/users.controller';
import { UsersAdminController } from './controller/users-admin.controller';
import { UsersPublicController } from './controller/users-public.controller';
// Import modules với forwardRef để tránh circular dependency
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
// Import Block User module
import { BlockUserController } from './block-user/controller/block-user.controller';
import { UserStatusController } from './controller/user-status.controller';
import { BlockUserService } from './block-user/service/block-user.service';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * UsersModule - Module xử lý user operations
 *
 * Chức năng chính:
 * - User profile management (CRUD, search, update)
 * - User connections (follow, unfollow, friends)
 * - User messaging
 * - User albums
 * - User level và balance
 * - Gift wall
 * - Block user functionality
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - GuardsModule: Authentication guards
 * - NotificationsModule: Notifications (forwardRef để tránh circular dependency)
 * - RealtimeModule: Real-time features (forwardRef để tránh circular dependency)
 *
 * Exports:
 * - ResUserService: Để các modules khác sử dụng
 * - BlockUserService: Để các modules khác sử dụng
 * - UserConnectionsService: Để các modules khác sử dụng
 */
@Module({
  imports: [
    PrismaModule,
    GuardsModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [
    UserController,
    UsersAdminController,
    UsersPublicController,
    ConnectionsController,
    ConnectionsAdminController,
    ConnectionsPublicController,
    // Block User
    BlockUserController,
    UserStatusController,
  ],
  providers: [
    ResUserService,
    UserProfileService,
    UserConnectionsService,
    UserAlbumsService,
    UserLevelService,
    UserGiftWallService,
    // Block User
    BlockUserService,
  ],
  exports: [ResUserService, BlockUserService, UserConnectionsService],
})
export class UsersModule {}
