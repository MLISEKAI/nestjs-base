import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsMockService } from './posts.mock.service';
import { MockDataService } from '../../common/mock-data.service';

@Module({
  controllers: [PostsController],
  providers: [PostsMockService, MockDataService],
  exports: [PostsMockService],
})
export class PostsModule {}
