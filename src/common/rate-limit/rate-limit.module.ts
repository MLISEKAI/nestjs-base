import { Module, Global } from '@nestjs/common';
import { UserRateLimitService } from './user-rate-limit.service';
import { UserRateLimitGuard } from './guards/user-rate-limit.guard';
import { CacheModule } from '../cache/cache.module';

@Global()
@Module({
  imports: [CacheModule],
  providers: [UserRateLimitService, UserRateLimitGuard],
  exports: [UserRateLimitService, UserRateLimitGuard],
})
export class RateLimitModule {}
