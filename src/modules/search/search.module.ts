import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { SearchController } from './controller/search.controller';
import { SearchService } from './service/search.service';
import { RecommendationService } from './service/recommendation.service';
import { TrendingService } from './service/trending.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, CacheModule, UsersModule],
  controllers: [SearchController],
  providers: [SearchService, RecommendationService, TrendingService],
  exports: [SearchService, RecommendationService, TrendingService],
})
export class SearchModule {}
