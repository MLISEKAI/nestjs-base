// Import Module decorator từ NestJS
import { Module } from '@nestjs/common';
// Import HttpModule để gọi external APIs (PayPal)
import { HttpModule } from '@nestjs/axios';
// Import PrismaModule để query database
import { PrismaModule } from 'src/prisma/prisma.module';
// Import PayPalService để xử lý business logic
import { PayPalService } from './service/paypal.service';
// Import controllers
import { PaymentWebhookController } from './controller/payment-webhook.controller';
import { PaymentTestController } from './controller/payment-test.controller';
import { PaymentRedirectController } from './controller/payment-redirect.controller';
import { PaymentCaptureController } from './controller/payment-capture.controller';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * PaymentModule - Module xử lý payment operations (PayPal)
 *
 * Chức năng chính:
 * - PayPal integration (create order, capture payment)
 * - PayPal webhook handling
 * - Payment testing (development only)
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - HttpModule: HTTP requests to PayPal API
 *
 * Exports:
 * - PayPalService: Để các modules khác sử dụng (ví dụ: WalletModule để tạo PayPal payment)
 */
@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [
    PaymentWebhookController,
    PaymentTestController,
    PaymentRedirectController,
    PaymentCaptureController,
  ],
  providers: [PayPalService],
  exports: [PayPalService], // Export để Wallet module có thể sử dụng
})
export class PaymentModule {}
