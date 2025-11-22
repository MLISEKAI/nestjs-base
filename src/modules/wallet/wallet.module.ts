import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { PaymentModule } from '../payment/payment.module';
import { WalletController } from './controller/wallet.controller';
import { WalletAdminController } from './controller/wallet-admin.controller';
import { WalletService } from './service/wallet.service';
import { WalletSummaryService } from './service/wallet-summary.service';
import { RechargeService } from './service/recharge.service';
import { SubscriptionService } from './service/subscription.service';
import { TransactionService } from './service/transaction.service';
import { ConvertService } from './service/convert.service';
import { DepositService } from './service/deposit.service';
import { IapService } from './service/iap.service';
import { TransferService } from './service/transfer.service';
import { PaymentMethodService } from './service/payment-method.service';

@Module({
  imports: [PrismaModule, CacheModule, PaymentModule],
  controllers: [WalletController, WalletAdminController],
  providers: [
    WalletService,
    WalletSummaryService,
    RechargeService,
    SubscriptionService,
    TransactionService,
    ConvertService,
    DepositService,
    IapService,
    TransferService,
    PaymentMethodService,
  ],
  exports: [WalletService, WalletSummaryService],
})
export class WalletModule {}
