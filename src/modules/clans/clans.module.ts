import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClanController } from './controller/clan.controller';
import { ClanAdminController } from './controller/clan-admin.controller';
import { ClanPublicController } from './controller/clan-public.controller';
import { ClanService } from './service/clan.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClanController, ClanAdminController, ClanPublicController],
  providers: [ClanService],
  exports: [ClanService],
})
export class ClansModule {}
