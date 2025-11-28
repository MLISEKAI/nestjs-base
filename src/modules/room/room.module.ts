import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

// Controllers
import { RoomController } from './controllers/room.controller';
import { RoomChatController } from './controllers/room-chat.controller';
import { RoomSettingsController } from './controllers/room-settings.controller';
import { RoomBoostController } from './controllers/room-boost.controller';
import { RoomChallengeController } from './controllers/room-challenge.controller';
import { RoomMembersController } from './controllers/room-members.controller';

// Services
import { RoomService } from './services/room.service';
import { RoomChatService } from './services/room-chat.service';
import { RoomSettingsService } from './services/room-settings.service';
import { RoomBoostService } from './services/room-boost.service';
import { RoomChallengeService } from './services/room-challenge.service';
import { RoomMembersService } from './services/room-members.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    RoomController,
    RoomChatController,
    RoomSettingsController,
    RoomBoostController,
    RoomChallengeController,
    RoomMembersController,
  ],
  providers: [
    RoomService,
    RoomChatService,
    RoomSettingsService,
    RoomBoostService,
    RoomChallengeService,
    RoomMembersService,
  ],
  exports: [RoomService],
})
export class RoomModule {}
