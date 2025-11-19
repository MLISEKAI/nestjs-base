import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserProfileService } from './service/user-profile.service';
import { UserConnectionsService } from './service/user-connections.service';
import { UserMessagingService } from './service/user-messaging.service';
import { UserAlbumsService } from './service/user-albums.service';
import { UserLevelService } from './service/user-level.service';
import { UserGiftWallService } from './service/user-gift-wall.service';
import { MessagesController } from './controller/messages.controller';
import { ResUserService } from './service/res-user.service';
import { ConnectionsController } from './controller/connections.controller';
import { UserController } from './controller/users.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule), forwardRef(() => RealtimeModule)],
  controllers: [UserController, MessagesController, ConnectionsController],
  providers: [
    ResUserService,
    UserProfileService,
    UserConnectionsService,
    UserMessagingService,
    UserAlbumsService,
    UserLevelService,
    UserGiftWallService,
  ],
  exports: [ResUserService],
})
export class UsersModule {}
