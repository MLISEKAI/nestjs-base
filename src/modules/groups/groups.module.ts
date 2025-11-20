import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GroupController } from './controller/group.controller';
import { GroupService } from './service/group.service';

@Module({
  imports: [PrismaModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupsModule {}
