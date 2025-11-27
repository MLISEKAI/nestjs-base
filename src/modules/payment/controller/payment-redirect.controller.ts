import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

/**
 * PaymentRedirectController - Handle redirect từ PayPal về mobile app
 * 
 * Flow:
 * 1. PayPal redirect về: https://yourapp.com/payment-redirect/success?transactionId=TX123&token=XXX
 * 2. Controller này render HTML page với JavaScript để redirect về deep link
 * 3. JavaScript redirect về: jt291://payment/success?transactionId=TX123&token=XXX
 */
@ApiTags('Payment Redirect')
@Controller('payment-redirect')
export class PaymentRedirectController {
  constructor(private readonly configService: ConfigService) {}

  @Get('success')
  @ApiOperation({ summary: 'PayPal success redirect to mobile app' })
  @ApiExcludeEndpoint()
  paymentSuccess(@Query() query: any, @Res() res: Response) {
    const mobileDeepLink = this.configService.get<string>('MOBILE_DEEP_LINK') || 'jt291://';
    const transactionId = query.transactionId || '';
    const token = query.token || '';
    const payerId = query.PayerID || '';

    // Build deep link URL
    const deepLinkUrl = `${mobileDeepLink}payment/success?transactionId=${transactionId}&token=${token}&PayerID=${payerId}`;

    // Return HTML page với JavaScript để redirect về mobile app
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Success - Redirecting...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid white;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 { margin: 0 0 1rem; font-size: 1.5rem; }
    p { margin: 0.5rem 0; opacity: 0.9; }
    .button {
      display: inline-block;
      margin-top: 1rem;
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
    <div class="spinner"></div>
    <h1>✅ Payment Successful!</h1>
    <p>Redirecting to app...</p>
    <p style="font-size: 0.875rem; margin-top: 1rem;">
      Transaction ID: ${transactionId}
    </p>
    <a href="${deepLinkUrl}" class="button" id="manualLink">
      Open App Manually
    </a>
  </div>

  <script>
    // Attempt to redirect to mobile app
    window.location.href = '${deepLinkUrl}';
    
    // Fallback: If app doesn't open after 3 seconds, show manual link
    setTimeout(function() {
      document.getElementById('manualLink').style.display = 'inline-block';
    }, 3000);
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('cancel')
  @ApiOperation({ summary: 'PayPal cancel redirect to mobile app' })
  @ApiExcludeEndpoint()
  paymentCancel(@Query() query: any, @Res() res: Response) {
    const mobileDeepLink = this.configService.get<string>('MOBILE_DEEP_LINK') || 'jt291://';
    const transactionId = query.transactionId || '';
    const token = query.token || '';

    // Build deep link URL
    const deepLinkUrl = `${mobileDeepLink}payment/cancel?transactionId=${transactionId}&token=${token}`;

    // Return HTML page với JavaScript để redirect về mobile app
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Cancelled</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    h1 { margin: 0 0 1rem; font-size: 1.5rem; }
    p { margin: 0.5rem 0; opacity: 0.9; }
    .button {
      display: inline-block;
      margin-top: 1rem;
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
    <h1>❌ Payment Cancelled</h1>
    <p>Your payment was cancelled.</p>
    <p style="font-size: 0.875rem; margin-top: 1rem;">
      Transaction ID: ${transactionId}
    </p>
    <a href="${deepLinkUrl}" class="button">
      Return to App
    </a>
  </div>

  <script>
    // Attempt to redirect to mobile app
    window.location.href = '${deepLinkUrl}';
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
