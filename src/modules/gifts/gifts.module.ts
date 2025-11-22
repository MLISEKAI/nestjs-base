import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { ProfileModuleDb } from '../profile/profile.module';
import { GiftsController } from './controller/gifts.controller';
import { GiftCatalogController } from './controller/gift-catalog.controller';
import { GiftsPublicController } from './controller/gifts-public.controller';
import { GiftsAdminController } from './controller/gifts-admin.controller';
import { GiftItemAdminController } from './controller/gift-item-admin.controller';
import { GiftCrudService } from './service/gift-crud.service';
import { GiftSummaryService } from './service/gift-summary.service';
import { GiftCatalogService } from './service/gift-catalog.service';
import { GiftItemAdminService } from './service/gift-item-admin.service';
import { UserGiftWallService } from '../users/service/user-gift-wall.service';

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
