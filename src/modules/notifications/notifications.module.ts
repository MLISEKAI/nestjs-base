import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationController } from './controller/notification.controller';
import { NotificationService } from './service/notification.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, forwardRef(() => RealtimeModule)],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
