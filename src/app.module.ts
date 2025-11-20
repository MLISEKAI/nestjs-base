import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ProfileModuleDb } from './modules/profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
// New modules
import { PostsModule } from './modules/posts/posts.module';
import { StoriesModule } from './modules/stories/stories.module';
import { GroupsModule } from './modules/groups/groups.module';
import { EventsModule } from './modules/events/events.module';
import { StoreModule } from './modules/store/store.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { SupportModule } from './modules/support/support.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ClansModule } from './modules/clans/clans.module';
import { GiftsModule } from './modules/gifts/gifts.module';
import { CacheModule } from './common/cache/cache.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    CommonModule,
    UsersModule,
    ProfileModuleDb,
    NotificationsModule,
    RealtimeModule,
    // New modules
    PostsModule,
    StoriesModule,
    GroupsModule,
    EventsModule,
    StoreModule,
    TasksModule,
    FeedbackModule,
    SupportModule,
    WalletModule,
    ClansModule,
    GiftsModule,
    CacheModule,
    MonitoringModule,
    RateLimitModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
