import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Query,
  Res,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { PayPalService } from '../service/paypal.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { PayPalWebhookHeaders, PayPalWebhookPayload } from '../interfaces/webhook.interface';

/**
 * Payment Webhook Controller
 * Nhận webhook và callback từ Payment Gateway (PayPal, etc.)
 *
 * Lưu ý: Controller này KHÔNG yêu cầu authentication vì webhook
 * được gọi trực tiếp từ Payment Gateway
 */
@ApiTags('Payment Webhook')
@ApiExcludeController() // Ẩn khỏi Swagger vì đây là internal endpoint
@Controller('payment')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly paypalService: PayPalService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * PayPal Webhook Handler
   * Nhận webhook từ PayPal khi có sự kiện thanh toán
   */
  @Post('webhook/paypal')
  @ApiOperation({ summary: 'PayPal webhook handler (internal)' })
  async handlePayPalWebhook(
    @Body() payload: PayPalWebhookPayload,
    @Headers() headers: PayPalWebhookHeaders,
  ) {
    this.logger.log('Received PayPal webhook', { eventType: payload.event_type });

    // Verify webhook signature
    const isValid = await this.paypalService.verifyWebhook(headers, payload);
    if (!isValid) {
      this.logger.warn('Invalid PayPal webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    // Xử lý các loại event khác nhau
    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      return this.handlePaymentCompleted(payload);
    } else if (payload.event_type === 'PAYMENT.CAPTURE.DENIED') {
      return this.handlePaymentFailed(payload);
    }

    return { received: true };
  }

  /**
   * PayPal Return URL Handler (Success)
   * User được redirect về đây sau khi thanh toán thành công
   */
  @Get('success')
  @ApiOperation({ summary: 'PayPal payment success callback' })
  async handlePaymentSuccess(
    @Query('token') orderId: string,
    @Query('transactionId') transactionId: string,
    @Res() res: Response,
  ) {
    this.logger.log('Payment success callback', { orderId, transactionId });

    try {
      // Capture order từ PayPal
      const captureResult = await this.paypalService.captureOrder(orderId);

      // Lấy transactionId từ capture result (reference_id từ PayPal order)
      const actualTransactionId = captureResult.transactionId || transactionId;

      this.logger.log('Payment captured', {
        orderId,
        transactionId: actualTransactionId,
        amount: captureResult.amount,
      });

      // Kiểm tra xem có phải test transaction không
      const isTestTransaction = actualTransactionId.startsWith('TEST-');

      if (isTestTransaction) {
        // Test transaction - không cần update database, chỉ log
        this.logger.log(
          `Test transaction ${actualTransactionId} completed. Skipping database update.`,
        );

        // Redirect về frontend với success message
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(
          `${frontendUrl}/wallet/recharge/success?transactionId=${actualTransactionId}&test=true`,
        );
      } else {
        // Real transaction - cập nhật transaction và cộng Diamond
        await this.updateTransactionAndWallet(actualTransactionId, 'success');

        // Redirect về frontend với success status
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/wallet/recharge/success?transactionId=${actualTransactionId}`);
      }
    } catch (error) {
      this.logger.error('Failed to process payment success', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = error.message || 'Payment processing failed';
      res.redirect(
        `${frontendUrl}/wallet/recharge/error?message=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  /**
   * PayPal Cancel URL Handler
   * User được redirect về đây nếu hủy thanh toán
   */
  @Get('cancel')
  @ApiOperation({ summary: 'PayPal payment cancel callback' })
  async handlePaymentCancel(
    @Query('token') orderId: string,
    @Query('transactionId') transactionId: string,
    @Res() res: Response,
  ) {
    this.logger.log('Payment cancel callback', { orderId, transactionId });

    // Cập nhật transaction status = failed
    if (transactionId) {
      await this.updateTransactionAndWallet(transactionId, 'failed');
    }

    // Redirect về frontend với cancel status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/wallet/recharge/cancel?transactionId=${transactionId}`);
  }

  /**
   * Xử lý khi payment completed từ webhook
   */
  private async handlePaymentCompleted(payload: PayPalWebhookPayload) {
    const resource = payload.resource;
    const referenceId = resource?.supplementary_data?.related_ids?.order_id;

    if (!referenceId) {
      this.logger.warn('No reference ID found in PayPal webhook');
      return { received: true };
    }

    // Tìm transaction theo reference_id
    const transaction = await this.prisma.resWalletTransaction.findFirst({
      where: { reference_id: referenceId },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found: ${referenceId}`);
      return { received: true };
    }

    // Chỉ cập nhật nếu transaction đang pending
    if (transaction.status === 'pending') {
      await this.updateTransactionAndWallet(referenceId, 'success');
    }

    return { received: true, processed: true };
  }

  /**
   * Xử lý khi payment failed từ webhook
   */
  private async handlePaymentFailed(payload: PayPalWebhookPayload) {
    const resource = payload.resource;
    const referenceId = resource?.supplementary_data?.related_ids?.order_id;

    if (!referenceId) {
      return { received: true };
    }

    // Cập nhật transaction status = failed
    const transaction = await this.prisma.resWalletTransaction.findFirst({
      where: { reference_id: referenceId },
    });

    if (transaction && transaction.status === 'pending') {
      await this.prisma.resWalletTransaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });
    }

    return { received: true, processed: true };
  }

  /**
   * Cập nhật transaction và cộng Diamond vào wallet
   */
  private async updateTransactionAndWallet(transactionId: string, status: 'success' | 'failed') {
    // Kiểm tra xem có phải test transaction không
    if (transactionId.startsWith('TEST-')) {
      this.logger.log(`Skipping database update for test transaction: ${transactionId}`);
      return;
    }

    // Tìm transaction
    const transaction = await this.prisma.resWalletTransaction.findFirst({
      where: { reference_id: transactionId },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found: ${transactionId}`);
      return;
    }

    // Nếu đã xử lý rồi, không xử lý lại (idempotency)
    if (transaction.status !== 'pending') {
      this.logger.log(
        `Transaction ${transactionId} already processed with status: ${transaction.status}`,
      );
      return;
    }

    if (status === 'success') {
      // Cộng tiền vào wallet (có thể là Diamond hoặc VEX)
      const wallet = await this.prisma.resWallet.findUnique({
        where: { id: transaction.wallet_id },
      });

      if (!wallet) {
        this.logger.error(`Wallet not found: ${transaction.wallet_id}`);
        return;
      }

      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + Number(transaction.amount);

      // Update trong transaction để đảm bảo atomicity
      await this.prisma.$transaction(async (tx) => {
        // Update wallet balance
        await tx.resWallet.update({
          where: { id: wallet.id },
          data: { balance: new Prisma.Decimal(newBalance) },
        });

        // Update transaction status và balance_after
        await tx.resWalletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'success',
            balance_after: new Prisma.Decimal(newBalance),
          },
        });
      });

      this.logger.log(
        `Transaction ${transactionId} completed. Added ${transaction.amount} ${wallet.currency} to wallet ${wallet.id}`,
      );
    } else {
      // Chỉ update status = failed
      await this.prisma.resWalletTransaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });

      this.logger.log(`Transaction ${transactionId} failed`);
    }
  }
}
