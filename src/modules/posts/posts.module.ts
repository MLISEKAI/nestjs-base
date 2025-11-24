import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
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

// Feed
import { FeedService } from './service/feed.service';

// Feed Controllers
import { CommunityFeedController } from './controller/community-feed.controller';
import { FriendsFeedController } from './controller/friends-feed.controller';
import { LatestFeedController } from './controller/latest-feed.controller';

@Module({
  imports: [PrismaModule, CacheModule, forwardRef(() => RealtimeModule)],
  controllers: [
    PostController,
    CommentController,
    LikeController,
    // Feed controllers
    CommunityFeedController,
    FriendsFeedController,
    LatestFeedController,
  ],
  providers: [PostService, PostMediaService, CommentService, LikeService, FeedService],
  exports: [PostService, CommentService, LikeService, FeedService],
})
export class PostsModule {}
