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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary: #00c853;
        --primary-dark: #00b140;
        --bg-start: #1a2a6c;
        --bg-mid: #b21f1f;
        --bg-end: #fdbb2d;
        --text: #ffffff;
        --card-bg: rgba(255, 255, 255, 0.12);
        --shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text);
        overflow: hidden;
        position: relative;
      }

      body::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 30% 70%, rgba(0, 200, 83, 0.3), transparent 50%),
                    radial-gradient(circle at 70% 30%, rgba(118, 75, 162, 0.3), transparent 50%);
        animation: pulse 8s infinite alternate;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .container {
        position: relative;
        z-index: 10;
        background: var(--card-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 28px;
        padding: 3rem 2rem;
        width: 90%;
        max-width: 420px;
        text-align: center;
        box-shadow: var(--shadow);
        border: 1px solid rgba(255, 255, 255, 0.15);
        animation: floatIn 0.8s ease-out forwards;
      }

      @keyframes floatIn {
        0% { transform: translateY(50px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }

      .success-icon {
        width: 100px;
        height: 100px;
        margin: 0 auto 1.5rem;
        position: relative;
      }

      .circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: white;
        position: relative;
        animation: pop 0.6s ease-out 0.4s both;
      }

      .circle::after {
        content: '';
        position: absolute;
        inset: 10px;
        border-radius: 50%;
        background: var(--primary);
        transform: scale(0);
        animation: fill 0.6s ease-out 0.6s forwards;
      }

      .check {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 28px;
        height: 50px;
        border-bottom: 7px solid white;
        border-right: 7px solid white;
        transform: translate(-50%, -70%) rotate(45deg) scale(0);
        animation: drawCheck 0.6s ease-out 1s forwards;
      }

      @keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
      @keyframes fill { to { transform: scale(1); } }
      @keyframes drawCheck { to { transform: translate(-50%, -70%) rotate(45deg) scale(1); } }

      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 1rem 0 0.5rem;
        background: linear-gradient(90deg, #ffffff, #e0f7fa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .status {
        font-size: 1.1rem;
        margin: 0.75rem 0;
        font-weight: 500;
        opacity: 0.95;
      }

      .transaction-id {
        font-size: 0.85rem;
        opacity: 0.7;
        margin: 1.5rem 0 2rem;
        word-break: break-all;
        padding: 0.75rem 1rem;
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        display: inline-block;
      }

      .button {
        display: inline-block;
        padding: 1rem 2.5rem;
        background: white;
        color: #667eea;
        font-weight: 600;
        font-size: 1.1rem;
        text-decoration: none;
        border-radius: 50px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        min-width: 200px;
      }

      .button:hover {
        transform: translateY(-4px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.3);
      }

      .auto-redirect {
        margin-top: 2rem;
        font-size: 0.9rem;
        opacity: 0.8;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="success-icon">
        <div class="circle">
          <div class="check"></div>
        </div>
      </div>

      <h1>Wooohooo!</h1>
      <p class="status">${captureSuccess ? 'Thanh toán thành công!' : 'Đang xử lý thanh toán...'}</p>
      <div class="transaction-id">ID: ${transactionId}</div>
      
      <a href="${redirectUrl}" class="button">Tiếp tục</a>
      <p class="auto-redirect">Tự động chuyển hướng trong <strong>3</strong> giây...</p>
    </div>

    <script>
      let seconds = 3;
      const counter = document.querySelector('.auto-redirect strong');
      const interval = setInterval(() => {
        seconds--;
        counter.textContent = seconds;
        if (seconds <= 0) {
          clearInterval(interval);
          window.location.href = '${redirectUrl}';
        }
      }, 1000);

      setTimeout(() => window.location.href = '${redirectUrl}', 3000);
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary: #ff5252;
        --bg: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Inter', sans-serif;
        background: var(--bg);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
        overflow: hidden;
      }

      body::before {
        content: '';
        position: absolute;
        inset: 0;
        background: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 x=%220%22 y=%220%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%221%22 fill=%22rgba(255,255,255,0.05)%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>');
        animation: drift 20s linear infinite;
      }

      @keyframes drift {
        from { transform: translate(0, 0); }
        to { transform: translate(100px, 100px); }
      }

      .container {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(16px);
        border-radius: 28px;
        padding: 3rem 2rem;
        width: 90%;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        animation: slideUp 0.7s ease-out;
      }

      @keyframes slideUp {
        from { transform: translateY(60px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .cancel-icon {
        font-size: 5.5rem;
        margin-bottom: 1rem;
        display: block;
        animation: shake 0.6s ease-in-out 0.5s;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-10px); }
        40%, 80% { transform: translateX(10px); }
      }

      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 1rem 0;
      }

      p {
        opacity: 0.9;
        margin: 1rem 0;
        font-size: 1.1rem;
      }

      .transaction-id {
        font-size: 0.85rem;
        opacity: 0.7;
        margin: 1.5rem 0;
        padding: 0.75rem 1rem;
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        display: inline-block;
      }

      .button {
        display: inline-block;
        padding: 1rem 2.5rem;
        background: white;
        color: #ff5252;
        font-weight: 600;
        text-decoration: none;
        border-radius: 50px;
        margin-top: 1rem;
        min-width: 200px;
        transition: all 0.3s;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      }

      .button:hover {
        transform: translateY(-4px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.3);
      }

      .tip {
        margin-top: 2rem;
        font-size: 0.9rem;
        opacity: 0.8;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="cancel-icon">Thanh toán bị hủy</div>
      <h1>Đã hủy thanh toán</h1>
      <p>Bạn đã hủy quá trình thanh toán. Không có khoản phí nào được trừ.</p>
      <div class="transaction-id">ID: ${transactionId}</div>
      
      <a href="${redirectUrl}" class="button">Quay lại ứng dụng</a>
      <p class="tip">Tự động chuyển hướng sau 3 giây...</p>
    </div>

    <script>
      setTimeout(() => window.location.href = '${redirectUrl}', 3000);
    </script>
  </body>
  </html>`;
  }
}
