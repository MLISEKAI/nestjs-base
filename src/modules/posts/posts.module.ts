import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommonModule } from 'src/common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

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

// Community Feed
import { CommunityFeedController } from './controller/community-feed.controller';
import { CommunityFeedService } from './service/community-feed.service';

// Friends Feed
import { FriendsFeedController } from './controller/friends-feed.controller';
import { FriendsFeedService } from './service/friends-feed.service';

// Latest Feed
import { LatestFeedController } from './controller/latest-feed.controller';
import { LatestFeedService } from './service/latest-feed.service';

// Hashtags
import { HashtagController } from './controller/hashtag.controller';
import { HashtagService } from './service/hashtag.service';

// Reports
import { ReportController } from './controller/report.controller';
import { ReportService } from './service/report.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    CommonModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    PostController,
    CommentController,
    LikeController,
    CommunityFeedController,
    FriendsFeedController,
    LatestFeedController,
    HashtagController,
    ReportController,
  ],
  providers: [
    PostService,
    PostMediaService,
    CommentService,
    LikeService,
    CommunityFeedService,
    FriendsFeedService,
    LatestFeedService,
    HashtagService,
    ReportService,
  ],
  exports: [PostService, CommentService, LikeService, HashtagService],
})
export class PostsModule {}
