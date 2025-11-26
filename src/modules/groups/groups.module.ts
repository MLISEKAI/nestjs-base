import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from '../../auth/guards/guards.module';
import { MessagingModule } from '../messaging/messaging.module';
import { GroupController } from './controller/group.controller';
import { GroupSettingsController } from './controller/group-settings.controller';
import { GroupMemberController } from './controller/group-member.controller';
import { GroupService } from './service/group.service';

@Module({
  imports: [PrismaModule, GuardsModule, forwardRef(() => MessagingModule)],
  controllers: [GroupController, GroupSettingsController, GroupMemberController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupsModule {}
