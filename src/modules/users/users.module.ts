import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from '../../auth/guards/guards.module';
import { UserProfileService } from './service/user-profile.service';
import { UserConnectionsService } from './service/user-connections.service';
import { UserMessagingService } from './service/user-messaging.service';
import { UserAlbumsService } from './service/user-albums.service';
import { UserLevelService } from './service/user-level.service';
import { UserGiftWallService } from './service/user-gift-wall.service';
import { MessagesController } from './controller/messages.controller';
import { MessagesAdminController } from './controller/messages-admin.controller';
import { ResUserService } from './service/res-user.service';
import { ConnectionsController } from './controller/connections.controller';
import { ConnectionsAdminController } from './controller/connections-admin.controller';
import { ConnectionsPublicController } from './controller/connections-public.controller';
import { UserController } from './controller/users.controller';
import { UsersAdminController } from './controller/users-admin.controller';
import { UsersPublicController } from './controller/users-public.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

// ==================== Block User ====================
import { BlockUserController } from './block-user/controller/block-user.controller';
import { BlockUserService } from './block-user/service/block-user.service';

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
    MessagesController,
    MessagesAdminController,
    ConnectionsController,
    ConnectionsAdminController,
    ConnectionsPublicController,
    // Block User
    BlockUserController,
  ],
  providers: [
    ResUserService,
    UserProfileService,
    UserConnectionsService,
    UserMessagingService,
    UserAlbumsService,
    UserLevelService,
    UserGiftWallService,
    // Block User
    BlockUserService,
  ],
  exports: [ResUserService, BlockUserService, UserConnectionsService],
})
export class UsersModule {}
