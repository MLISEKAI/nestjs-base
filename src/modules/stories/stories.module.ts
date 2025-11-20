import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StoryController } from './controller/story.controller';
import { StoryService } from './service/story.service';

@Module({
  imports: [PrismaModule],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoriesModule {}
