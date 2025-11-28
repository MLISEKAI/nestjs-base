import { Controller, Get, Query, Res, Logger, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PayPalService } from '../service/paypal.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@ApiTags('Payment Redirect')
@Controller('payment-redirect')
export class PaymentRedirectController {
  private readonly logger = new Logger(PaymentRedirectController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly paypalService: PayPalService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('success')
  @ApiOperation({ summary: 'PayPal success redirect' })
  @ApiExcludeEndpoint()
  async paymentSuccess(@Query() query: any, @Res() res: Response) {
    const transactionId = query.transactionId || '';
    const token = query.token || '';
    const payerId = query.PayerID || '';

    this.logger.log(`Payment redirect success. TransactionId: ${transactionId}, Token: ${token}`);

    // Auto-capture payment
    let captureSuccess = false;
    try {
      const captureResult = await this.paypalService.captureOrder(token);
      this.logger.log(`PayPal capture successful. OrderId: ${captureResult.orderId}`);

      const transaction = await this.prisma.resWalletTransaction.findFirst({
        where: { reference_id: transactionId },
        include: { wallet: true },
      });

      if (transaction && transaction.status !== 'success') {
        const amount = Number(transaction.amount);
        const currentBalance = Number(transaction.wallet.balance);
        const newBalance = currentBalance + amount;

        await this.prisma.$transaction(async (tx) => {
          await tx.resWallet.update({
            where: { id: transaction.wallet_id },
            data: { balance: new Prisma.Decimal(newBalance) },
          });

          await tx.resWalletTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'success',
              balance_after: new Prisma.Decimal(newBalance),
            },
          });
        });

        this.logger.log(`Payment captured. Amount: ${amount}, New Balance: ${newBalance}`);
        captureSuccess = true;
      } else if (transaction?.status === 'success') {
        captureSuccess = true;
      }
    } catch (error) {
      this.logger.error(`Failed to capture payment: ${error.message}`);
    }

    // Determine redirect URL
    const mobileDeepLink = this.configService.get<string>('MOBILE_DEEP_LINK');
    const webFrontendUrl = this.configService.get<string>('WEB_FRONTEND_URL');
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3001';

    let redirectUrl = '';
    if (mobileDeepLink) {
      redirectUrl = `${mobileDeepLink}payment/success?transactionId=${transactionId}&token=${token}&captured=${captureSuccess}`;
    } else {
      const webUrl = webFrontendUrl || appUrl;
      redirectUrl = `${webUrl}/payment/success?transactionId=${transactionId}&token=${token}&captured=${captureSuccess}`;
    }

    // Return HTML page with success animation
    const html = this.buildSuccessPage(transactionId, captureSuccess, redirectUrl);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private buildSuccessPage(transactionId: string, captureSuccess: boolean, redirectUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      max-width: 400px;
      width: 90%;
    }
    .checkmark-circle {
      width: 80px;
      height: 80px;
      position: relative;
      display: inline-block;
      vertical-align: top;
      margin-bottom: 1rem;
    }
    .checkmark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: block;
      stroke-width: 3;
      stroke: #4CAF50;
      stroke-miterlimit: 10;
      box-shadow: inset 0px 0px 0px #4CAF50;
      animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
    }
    .checkmark-circle-bg {
      width: 80px;
      height: 80px;
      position: absolute;
      border-radius: 50%;
      background: white;
      top: 0;
      left: 0;
    }
    .checkmark-check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }
    @keyframes stroke {
      100% { stroke-dashoffset: 0; }
    }
    @keyframes scale {
      0%, 100% { transform: none; }
      50% { transform: scale3d(1.1, 1.1, 1); }
    }
    @keyframes fill {
      100% { box-shadow: inset 0px 0px 0px 40px #4CAF50; }
    }
    h1 {
      font-size: 1.5rem;
      margin: 1rem 0 0.5rem;
      font-weight: 600;
    }
    p {
      margin: 0.5rem 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }
    .transaction-id {
      font-size: 0.85rem;
      opacity: 0.7;
      margin-top: 1rem;
      word-break: break-all;
    }
    .button {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark-circle">
      <div class="checkmark-circle-bg"></div>
      <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
        <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </div>
    <h1>Payment Successful!</h1>
    <p>${captureSuccess ? '✅ Payment captured successfully' : '⏳ Processing payment...'}</p>
    <p class="transaction-id">Transaction ID: ${transactionId}</p>
    <a href="${redirectUrl}" class="button">Continue</a>
  </div>
  <script>
    setTimeout(function() {
      window.location.href = '${redirectUrl}';
    }, 3000);
  </script>
</body>
</html>`;
  }

  @Get('cancel')
  @ApiOperation({ summary: 'PayPal cancel redirect' })
  @ApiExcludeEndpoint()
  paymentCancel(@Query() query: any, @Res() res: Response) {
    const transactionId = query.transactionId || '';
    const token = query.token || '';

    const mobileDeepLink = this.configService.get<string>('MOBILE_DEEP_LINK');
    const webFrontendUrl = this.configService.get<string>('WEB_FRONTEND_URL');
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3001';

    let redirectUrl = '';
    if (mobileDeepLink) {
      redirectUrl = `${mobileDeepLink}payment/cancel?transactionId=${transactionId}&token=${token}`;
    } else {
      const webUrl = webFrontendUrl || appUrl;
      redirectUrl = `${webUrl}/payment/cancel?transactionId=${transactionId}&token=${token}`;
    }

    const html = this.buildCancelPage(transactionId, redirectUrl);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private buildCancelPage(transactionId: string, redirectUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Cancelled</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      max-width: 400px;
      width: 90%;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      margin: 1rem 0 0.5rem;
      font-weight: 600;
    }
    p {
      margin: 0.5rem 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }
    .transaction-id {
      font-size: 0.85rem;
      opacity: 0.7;
      margin-top: 1rem;
      word-break: break-all;
    }
    .button {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      color: #f5576c;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Payment Cancelled</h1>
    <p>Your payment was cancelled.</p>
    <p class="transaction-id">Transaction ID: ${transactionId}</p>
    <a href="${redirectUrl}" class="button">Return to App</a>
  </div>
  <script>
    setTimeout(function() {
      window.location.href = '${redirectUrl}';
    }, 3000);
  </script>
</body>
</html>`;
  }
}
