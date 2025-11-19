import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

import { ProfileServiceDb } from './profile_db.service';
import { ProfileViewsControllerDb } from './profile-views_db/profile-views_db.controller';
import { ProfileViewsServiceDb } from './profile-views_db/profile-views_db.service';

import { AlbumController } from './controller/album.controller';
import { ClanController } from './controller/clan.controller';
import { FeedbackController } from './controller/feedback.controller';
import { GiftsController } from './controller/gifts.controller';
import { InventoryController } from './controller/inventory.controller';
import { LoveSpaceController } from './controller/love-space.controller';
import { PostController } from './controller/post.controller';
import { StoreController } from './controller/store.controller';
import { SupportController } from './controller/support.controller';
import { TaskController } from './controller/task.controller';
import { UserProfileController } from './controller/user-profile.controller';
import { VipController } from './controller/vip.controller';
import { ReferralController } from './controller/referral.controller';
import { WalletController } from './wallet/controller/wallet.controller';

import { AlbumService } from './service/album.service';
import { ClanService } from './service/clan.service';
import { FeedbackService } from './service/feedback.service';
import { InventoryService } from './service/inventory.service';
import { LoveSpaceService } from './service/love-space.service';
import { PostService } from './service/post.service';
import { StoreService } from './service/store.service';
import { SupportService } from './service/support.service';
import { TaskService } from './service/task.service';
import { UserProfileService } from './service/user-profile.service';
import { VipService } from './service/vip.service';
import { GiftsService } from './service/gifts.service';
import { WalletService } from './wallet/service/wallet.service';
import { WalletSummaryService } from './wallet/service/wallet-summary.service';
import { RechargeService } from './wallet/service/recharge.service';
import { SubscriptionService } from './wallet/service/subscription.service';
import { TransactionService } from './wallet/service/transaction.service';
import { ConvertService } from './wallet/service/convert.service';
import { DepositService } from './wallet/service/deposit.service';
import { IapService } from './wallet/service/iap.service';
import { ReferralService } from './service/referral.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProfileViewsControllerDb,
    UserProfileController,
    WalletController,
    VipController,
    StoreController,
    TaskController,
    LoveSpaceController,
    InventoryController,
    GiftsController,
    ClanController,
    FeedbackController,
    SupportController,
    ReferralController,
    AlbumController,
    PostController,
  ],
  providers: [
    ProfileServiceDb,
    UserProfileService,
    ProfileViewsServiceDb,
    WalletService,
    WalletSummaryService,
    RechargeService,
    SubscriptionService,
    TransactionService,
    ConvertService,
    DepositService,
    IapService,
    VipService,
    StoreService,
    TaskService,
    LoveSpaceService,
    InventoryService,
    ClanService,
    FeedbackService,
    SupportService,
    ReferralService,
    PostService,
    AlbumService,
    GiftsService,
  ],
})
export class ProfileModuleDb {}
