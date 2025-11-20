import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

// Posts
import { PostController } from './controller/post.controller';
import { PostService } from './service/post.service';
import { PostMediaService } from './service/post-media.service';

// Comments
import { CommentController } from './controller/comment.controller';
import { CommentService } from './service/comment.service';

// Likes
import { LikeController } from './controller/like.controller';
import { LikeService } from './service/like.service';

@Module({
  imports: [PrismaModule, forwardRef(() => RealtimeModule)],
  controllers: [PostController, CommentController, LikeController],
  providers: [PostService, PostMediaService, CommentService, LikeService],
  exports: [PostService, CommentService, LikeService],
})
export class PostsModule {}
