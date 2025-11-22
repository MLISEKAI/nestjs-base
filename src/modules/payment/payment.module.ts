import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PayPalService } from './service/paypal.service';
import { PaymentWebhookController } from './controller/payment-webhook.controller';
import { PaymentTestController } from './controller/payment-test.controller';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [PaymentWebhookController, PaymentTestController],
  providers: [PayPalService],
  exports: [PayPalService], // Export để Wallet module có thể sử dụng
})
export class PaymentModule {}
