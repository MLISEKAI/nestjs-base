import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserProfileService } from './service/user-profile.service';
import { UserConnectionsService } from './service/user-connections.service';
import { UserMessagingService } from './service/user-messaging.service';
import { UserAlbumsService } from './service/user-albums.service';
import { MessagesController } from './controller/messages.controller';
import { ResUserService } from './res-user.service';
import { ConnectionsController } from './controller/connections.controller';
import { UserController } from './controller/users.controller';

@Module({
  controllers: [UserController, MessagesController, ConnectionsController],
  providers: [
    ResUserService,
    PrismaService,
    UserProfileService,
    UserConnectionsService,
    UserMessagingService,
    UserAlbumsService,
  ],
  exports: [ResUserService],
})
export class UsersModule {}
