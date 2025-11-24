// Import Module và Global decorator từ NestJS
import { Module, Global } from '@nestjs/common';
// Import services và guards
import { UserRateLimitService } from './user-rate-limit.service';
import { UserRateLimitGuard } from './guards/user-rate-limit.guard';
// Import CacheModule để sử dụng Redis
import { CacheModule } from '../cache/cache.module';

/**
 * @Global() - Module này là global, có thể được inject vào bất kỳ module nào mà không cần import
 * @Module() - Đánh dấu class này là NestJS module
 * RateLimitModule - Module xử lý rate limiting
 *
 * Chức năng chính:
 * - User-based rate limiting
 * - API rate limiting
 * - Prevent abuse và spam
 *
 * Dependencies:
 * - CacheModule: Redis để track rate limits
 *
 * Exports:
 * - UserRateLimitService: Để các modules khác sử dụng
 * - UserRateLimitGuard: Để các controllers sử dụng
 *
 * Lưu ý:
 * - Rate limits được track trong Redis
 * - Có thể config rate limits per user, per endpoint, etc.
 */
@Global()
@Module({
  imports: [CacheModule],
  providers: [UserRateLimitService, UserRateLimitGuard],
  exports: [UserRateLimitService, UserRateLimitGuard],
})
export class RateLimitModule {}
