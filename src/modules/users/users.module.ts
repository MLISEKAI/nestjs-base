import { Module } from '@nestjs/common';
import { ResUserController } from './controller/users.controller';
import { ResUserService } from './service/res-user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserProfileService } from './service/user-profile.service';
import { UserConnectionsService } from './service/user-connections.service';
import { UserMessagingService } from './service/user-messaging.service';
import { UserAlbumsService } from './service/user-albums.service';

@Module({
  controllers: [ResUserController],
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
