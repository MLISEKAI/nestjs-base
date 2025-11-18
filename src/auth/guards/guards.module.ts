import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OptionalAuthGuard } from './optional-auth.guard';

/**
 * GuardsModule - Module riêng cho các guards
 * Tách ra để tránh circular dependency giữa AuthModule và UsersModule
 *
 * Note: PassportModule đủ để OptionalAuthGuard hoạt động vì AccountStrategy
 * đã được đăng ký global trong AuthModule
 */
@Module({
  imports: [PassportModule],
  providers: [OptionalAuthGuard],
  exports: [OptionalAuthGuard],
})
export class GuardsModule {}
