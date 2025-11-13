import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileViewsController } from './profile-views/profile-views.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [ProfileController, ProfileViewsController],
  providers: [ProfileService, PrismaService],
})
export class ProfileModule {}
