import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from '../../auth/guards/guards.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SearchModule } from '../search/search.module';

// Controllers
import { ConversationsController } from './controller/conversations.controller';
import { MessagesController } from './controller/messages.controller';
import { SearchController } from './controller/search.controller';
import { TypingController } from './controller/typing.controller';
import { ForwardController } from './controller/forward.controller';

// Services
import { ConversationService } from './service/conversation.service';
import { MessageService } from './service/message.service';
import { MessagingSearchService } from './service/search.service';
import { TypingService } from './service/typing.service';

@Module({
  imports: [
    PrismaModule,
    GuardsModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => RealtimeModule),
    SearchModule,
  ],
  controllers: [
    SearchController,
    ConversationsController,
    MessagesController,
    TypingController,
    ForwardController,
  ],
  providers: [ConversationService, MessageService, MessagingSearchService, TypingService],
  exports: [ConversationService, MessageService],
})
export class MessagingModule {}
