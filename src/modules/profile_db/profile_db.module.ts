import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

// ==================== User Profile ====================
import { ProfileServiceDb } from './profile_db.service';
import { ProfileViewsControllerDb } from './profile-views_db/profile-views_db.controller';
import { ProfileViewsServiceDb } from './profile-views_db/profile-views_db.service';
import { UserProfileController } from './user-profile/controller/user-profile.controller';
import { UserProfileService } from './user-profile/service/user-profile.service';

// ==================== Album ====================
import { AlbumController } from './album/controller/album.controller';
import { AlbumService } from './album/service/album.service';

// ==================== Clan ====================
import { ClanController } from './clan/controller/clan.controller';
import { ClanService } from './clan/service/clan.service';

// ==================== Gifts ====================
import { GiftsController } from './gifts/controller/gifts.controller';
import { GiftCrudService } from './gifts/service/gift-crud.service';
import { GiftSummaryService } from './gifts/service/gift-summary.service';
import { GiftCatalogService } from './gifts/service/gift-catalog.service';

// ==================== Wallet ====================
import { WalletController } from './wallet/controller/wallet.controller';
import { WalletService } from './wallet/service/wallet.service';
import { WalletSummaryService } from './wallet/service/wallet-summary.service';
import { RechargeService } from './wallet/service/recharge.service';
import { SubscriptionService } from './wallet/service/subscription.service';
import { TransactionService } from './wallet/service/transaction.service';
import { ConvertService } from './wallet/service/convert.service';
import { DepositService } from './wallet/service/deposit.service';
import { IapService } from './wallet/service/iap.service';

// ==================== Inventory ====================
import { InventoryController } from './inventory/controller/inventory.controller';
import { InventoryService } from './inventory/service/inventory.service';

// ==================== Store ====================
import { StoreController } from './store/controller/store.controller';
import { StoreService } from './store/service/store.service';

// ==================== Task ====================
import { TaskController } from './task/controller/task.controller';
import { TaskService } from './task/service/task.service';

// ==================== Feedback ====================
import { FeedbackController } from './feedback/controller/feedback.controller';
import { FeedbackService } from './feedback/service/feedback.service';

// ==================== Post ====================
import { PostController } from './post/controller/post.controller';
import { PostService } from './post/service/post.service';

// ==================== LoveSpace ====================
import { LoveSpaceController } from './love-space/controller/love-space.controller';
import { LoveSpaceService } from './love-space/service/love-space.service';

// ==================== Vip ====================
import { VipController } from './vip/controller/vip.controller';
import { VipService } from './vip/service/vip.service';

// ==================== Support ====================
import { SupportController } from './support/controller/support.controller';
import { SupportService } from './support/service/support.service';

// ==================== Referral ====================
import { ReferralController } from './referral/controller/referral.controller';
import { ReferralService } from './referral/service/referral.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProfileViewsControllerDb,
    // User Profile
    UserProfileController,
    // Album
    AlbumController,
    // Clan
    ClanController,
    // Gifts
    GiftsController,
    // Wallet
    WalletController,
    // Inventory
    InventoryController,
    // Store
    StoreController,
    // Task
    TaskController,
    // Feedback
    FeedbackController,
    // Post
    PostController,
    // LoveSpace
    LoveSpaceController,
    // Vip
    VipController,
    // Support
    SupportController,
    // Referral
    ReferralController,
  ],
  providers: [
    ProfileServiceDb,
    ProfileViewsServiceDb,
    // User Profile
    UserProfileService,
    // Album
    AlbumService,
    // Clan
    ClanService,
    // Gifts
    GiftCrudService,
    GiftSummaryService,
    GiftCatalogService,
    // Wallet
    WalletService,
    WalletSummaryService,
    RechargeService,
    SubscriptionService,
    TransactionService,
    ConvertService,
    DepositService,
    IapService,
    // Inventory
    InventoryService,
    // Store
    StoreService,
    // Task
    TaskService,
    // Feedback
    FeedbackService,
    // Post
    PostService,
    // LoveSpace
    LoveSpaceService,
    // Vip
    VipService,
    // Support
    SupportService,
    // Referral
    ReferralService,
  ],
})
export class ProfileModuleDb {}
