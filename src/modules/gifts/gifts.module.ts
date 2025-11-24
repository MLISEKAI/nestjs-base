// Import Module decorator từ NestJS
import { Module } from '@nestjs/common';
// Import các modules khác để sử dụng
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { ProfileModuleDb } from '../profile/profile.module';
// Import controllers
import { GiftsController } from './controller/gifts.controller';
import { GiftCatalogController } from './controller/gift-catalog.controller';
import { GiftsPublicController } from './controller/gifts-public.controller';
import { GiftsAdminController } from './controller/gifts-admin.controller';
import { GiftItemAdminController } from './controller/gift-item-admin.controller';
// Import services
import { GiftCrudService } from './service/gift-crud.service';
import { GiftSummaryService } from './service/gift-summary.service';
import { GiftCatalogService } from './service/gift-catalog.service';
import { GiftItemAdminService } from './service/gift-item-admin.service';
import { UserGiftWallService } from '../users/service/user-gift-wall.service';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * GiftsModule - Module xử lý gifts operations
 *
 * Chức năng chính:
 * - CRUD gifts (gửi/nhận quà)
 * - Gift catalog (danh sách quà có sẵn)
 * - Gift summary và statistics
 * - Gift wall (tổng quan quà đã nhận)
 * - Admin operations (quản lý gift items)
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - CacheModule: Caching
 * - ProfileModuleDb: Profile operations
 *
 * Exports:
 * - GiftCrudService: Để các modules khác sử dụng
 * - GiftSummaryService: Để các modules khác sử dụng
 * - GiftCatalogService: Để các modules khác sử dụng
 */
@Module({
  imports: [PrismaModule, CacheModule, ProfileModuleDb],
  controllers: [
    GiftCatalogController,
    GiftsController,
    GiftsPublicController,
    GiftsAdminController,
    GiftItemAdminController,
  ],
  providers: [
    GiftCrudService,
    GiftSummaryService,
    GiftCatalogService,
    GiftItemAdminService,
    UserGiftWallService,
  ],
  exports: [GiftCrudService, GiftSummaryService, GiftCatalogService],
})
export class GiftsModule {}
