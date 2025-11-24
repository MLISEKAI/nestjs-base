// Import Module decorator và forwardRef từ NestJS
import { Module, forwardRef } from '@nestjs/common';
// Import các modules khác để sử dụng
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
// Import modules với forwardRef để tránh circular dependency
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';

// ==================== User Profile ====================
import { ProfileServiceDb } from './profile.service';
import { UserProfileService } from './profile-user/service/profile-user.service';
import { UserProfileController } from './profile-user/controller/profile-user.controller';
import { ProfileAdminController } from './profile-user/controller/profile-admin.controller';
import { ProfilePublicController } from './profile-user/controller/profile-public.controller';
import { ProfileViewsControllerDb } from './profile-views/profile-views.controller';
import { ProfileViewsAdminController } from './profile-views/profile-views-admin.controller';
import { ProfileViewsPublicController } from './profile-views/profile-views-public.controller';
import { ProfileViewsServiceDb } from './profile-views/profile-views.service';

// ==================== Album ====================
import { AlbumController } from './album/controller/album.controller';
import { AlbumAdminController } from './album/controller/album-admin.controller';
import { AlbumPublicController } from './album/controller/album-public.controller';
import { AlbumService } from './album/service/album.service';

// ==================== Inventory ====================
import { InventoryController } from './inventory/controller/inventory.controller';
import { InventoryAdminController } from './inventory/controller/inventory-admin.controller';
import { InventoryService } from './inventory/service/inventory.service';

// ==================== LoveSpace ====================
import { LoveSpaceController } from './love-space/controller/love-space.controller';
import { LoveSpacePublicController } from './love-space/controller/love-space-public.controller';
import { LoveSpaceService } from './love-space/service/love-space.service';

// ==================== Vip ====================
import { VipController } from './vip/controller/vip.controller';
import { VipAdminController } from './vip/controller/vip-admin.controller';
import { VipPublicController } from './vip/controller/vip-public.controller';
import { VipService } from './vip/service/vip.service';

// ==================== Referral ====================
import { ReferralController } from './referral/controller/referral.controller';
import { ReferralAdminController } from './referral/controller/referral-admin.controller';
import { ReferralPublicController } from './referral/controller/referral-public.controller';
import { ReferralService } from './referral/service/referral.service';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * ProfileModuleDb - Module xử lý profile operations
 *
 * Chức năng chính:
 * - User profile management
 * - Profile views tracking
 * - Albums management
 * - Inventory management
 * - VIP system
 * - Referral system
 * - LoveSpace
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - CacheModule: Caching
 * - RealtimeModule: Real-time features (forwardRef để tránh circular dependency)
 * - UsersModule: User operations (forwardRef để tránh circular dependency)
 *
 * Exports:
 * - InventoryService: Để các modules khác sử dụng (ví dụ: GiftsModule)
 */
@Module({
  imports: [
    PrismaModule,
    CacheModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    ProfileViewsControllerDb,
    ProfileViewsAdminController,
    ProfileViewsPublicController,
    // User Profile
    UserProfileController,
    ProfileAdminController,
    ProfilePublicController,
    // Album
    AlbumController,
    AlbumAdminController,
    AlbumPublicController,
    // Vip
    VipController,
    VipAdminController,
    VipPublicController,
    // Inventory
    InventoryController,
    InventoryAdminController,
    // Referral
    ReferralController,
    ReferralAdminController,
    ReferralPublicController,
    // LoveSpace
    LoveSpaceController,
    LoveSpacePublicController,
  ],
  providers: [
    ProfileServiceDb,
    ProfileViewsServiceDb,
    // User Profile
    UserProfileService,
    // Album
    AlbumService,
    // Inventory
    InventoryService,
    // Vip
    VipService,
    // Referral
    ReferralService,
    // LoveSpace
    LoveSpaceService,
  ],
  exports: [InventoryService],
})
export class ProfileModuleDb {}
