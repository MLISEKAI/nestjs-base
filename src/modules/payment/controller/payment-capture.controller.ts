import { Controller, Post, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PayPalService } from '../service/paypal.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * PaymentCaptureController - Handle capture payment từ PayPal
 * 
 * Flow:
 * 1. Frontend nhận token và PayerID từ PayPal redirect
 * 2. Frontend gọi POST /payment/capture với token
 * 3. Backend capture payment từ PayPal
 * 4. Backend cập nhật transaction status và cộng tiền vào wallet
 */
@ApiTags('Payment')
@Controller('payment')
export class PaymentCaptureController {
  private readonly logger = new Logger(PaymentCaptureController.name);

  constructor(
    private readonly paypalService: PayPalService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('capture')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Capture PayPal payment và cập nhật wallet',
    description:
      'Sau khi PayPal redirect về success page, frontend gọi endpoint này với token để capture payment và cộng tiền vào wallet.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'PayPal order token từ redirect URL',
          example: '00Y298291Y1648311',
        },
        transactionId: {
          type: 'string',
          description: 'Transaction ID từ backend',
          example: 'TX1764240195364-2k7kq729v',
        },
      },
      required: ['token', 'transactionId'],
    },
  })
  async capturePayment(
    @Req() req: AuthenticatedRequest,
    @Body() body: { token: string; transactionId: string },
  ) {
    const user_id = req.user.id;
    const { token, transactionId } = body;

    this.logger.log(
      `User ${user_id} attempting to capture payment. Token: ${token}, TransactionId: ${transactionId}`,
    );

    try {
      // 1. Capture payment từ PayPal
      const captureResult = await this.paypalService.captureOrder(token);

      this.logger.log(
        `PayPal capture successful. OrderId: ${captureResult.orderId}, Status: ${captureResult.status}, Amount: ${captureResult.amount} ${captureResult.currency}`,
      );

      // 2. Tìm transaction trong database
      const transaction = await this.prisma.resWalletTransaction.findFirst({
        where: {
          reference_id: transactionId,
          user_id: user_id,
        },
        include: {
          wallet: true,
        },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found: ${transactionId} for user ${user_id}`);
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'success') {
        this.logger.warn(`Transaction ${transactionId} already completed`);
        return {
          message: 'Payment already processed',
          status: 'success',
          balance: Number(transaction.wallet.balance),
        };
      }

      // 3. Cập nhật transaction status và cộng tiền vào wallet
      const amount = Number(transaction.amount);
      const currentBalance = Number(transaction.wallet.balance);
      const newBalance = currentBalance + amount;

      await this.prisma.$transaction(async (tx) => {
        // Update wallet balance
        await tx.resWallet.update({
          where: { id: transaction.wallet_id },
          data: {
            balance: new Prisma.Decimal(newBalance),
          },
        });

        // Update transaction status
        await tx.resWalletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'success',
            balance_after: new Prisma.Decimal(newBalance),
          },
        });
      });

      this.logger.log(
        `Payment captured successfully. User: ${user_id}, Transaction: ${transactionId}, Amount: ${amount}, New Balance: ${newBalance}`,
      );

      return {
        message: 'Payment captured successfully',
        status: 'success',
        amount: amount,
        balance: newBalance,
        currency: transaction.wallet.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to capture payment: ${error.message}`, error.stack);
      throw error;
    }
  }
}
