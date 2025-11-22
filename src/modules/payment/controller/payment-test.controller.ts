import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PayPalService } from '../service/paypal.service';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Payment Test Controller
 * Dùng để test PayPal integration
 * Chỉ nên dùng trong development/testing
 */
@ApiTags('Payment Test')
@Controller('payment/test')
export class PaymentTestController {
  constructor(
    private readonly paypalService: PayPalService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Test PayPal Connection
   * Kiểm tra xem PayPal credentials có hoạt động không
   */
  @Get('connection')
  @ApiOperation({
    summary: 'Test PayPal connection',
    description: 'Kiểm tra kết nối với PayPal API. Trả về thông tin về PayPal configuration.',
  })
  @ApiOkResponse({
    description: 'PayPal connection test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        config: {
          type: 'object',
          properties: {
            mode: { type: 'string' },
            baseUrl: { type: 'string' },
            hasClientId: { type: 'boolean' },
            hasClientSecret: { type: 'boolean' },
          },
        },
      },
    },
  })
  async testConnection() {
    try {
      // Test connection bằng cách tạo một order nhỏ (sẽ tự động test token)
      const testTransactionId = `TEST-CONN-${Date.now()}`;
      const result = await this.paypalService.createOrder(
        testTransactionId,
        0.01, // $0.01 để test
        'USD',
      );

      return {
        success: true,
        message: 'PayPal connection successful! ✅',
        config: {
          mode: process.env.PAYPAL_MODE || 'sandbox',
          baseUrl:
            process.env.PAYPAL_MODE === 'live'
              ? 'https://api.paypal.com'
              : 'https://api.sandbox.paypal.com',
          hasClientId: !!process.env.PAYPAL_CLIENT_ID,
          hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
        },
        testOrder: {
          orderId: result.orderId,
          paymentUrl: result.paymentUrl,
          note: 'Test order created successfully. You can use this paymentUrl to test payment flow.',
        },
      };
    } catch (error) {
      // Extract chi tiết lỗi từ PayPal
      const errorDetails = error.response?.data || error.message;
      const errorMessage = error.message || 'Unknown error';

      return {
        success: false,
        message: `PayPal connection failed: ${errorMessage}`,
        error: errorDetails,
        errorDetails: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          fullError: error.response?.data ? JSON.stringify(error.response.data, null, 2) : null,
        },
        config: {
          mode: process.env.PAYPAL_MODE || 'sandbox',
          baseUrl:
            process.env.PAYPAL_MODE === 'live'
              ? 'https://api.paypal.com'
              : 'https://api.sandbox.paypal.com',
          hasClientId: !!process.env.PAYPAL_CLIENT_ID,
          hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
          clientIdPrefix: process.env.PAYPAL_CLIENT_ID
            ? `${process.env.PAYPAL_CLIENT_ID.substring(0, 15)}...`
            : 'NOT SET',
        },
        troubleshooting: [
          '1. ✅ Kiểm tra PAYPAL_CLIENT_ID và PAYPAL_CLIENT_SECRET đúng chưa (copy từ PayPal Dashboard)',
          '2. ✅ Kiểm tra credentials match với mode:',
          '   - Sandbox mode → Dùng Sandbox Client ID/Secret',
          '   - Live mode → Dùng Live Client ID/Secret',
          '3. ✅ Kiểm tra PAYPAL_MODE=sandbox (không phải live)',
          '4. ✅ Restart backend server sau khi thay đổi .env',
          '5. ✅ Kiểm tra không có khoảng trắng thừa trong .env file',
          '6. ✅ Kiểm tra internet connection',
          '7. ✅ Xem backend logs để có thông tin chi tiết hơn',
        ],
        commonIssues: {
          '401 Unauthorized':
            'Client ID hoặc Client Secret không đúng, hoặc không match với mode (sandbox/live)',
          '400 Bad Request': 'Request format không đúng hoặc thiếu thông tin',
          'Network Error': 'Không thể kết nối đến PayPal API, kiểm tra internet',
        },
      };
    }
  }

  /**
   * Test Create PayPal Order
   * Tạo một test order để kiểm tra PayPal integration
   */
  @Post('create-order')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Test create PayPal order',
    description:
      'Tạo một test PayPal order với số tiền nhỏ để kiểm tra integration. Yêu cầu authentication.',
  })
  @ApiOkResponse({
    description: 'Test order created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        orderId: { type: 'string' },
        paymentUrl: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async testCreateOrder(@Body() body: { amount?: number; currency?: string }) {
    const testTransactionId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amount = body.amount || 1.0; // Default $1 for testing
    const currency = body.currency || 'USD';

    try {
      const result = await this.paypalService.createOrder(testTransactionId, amount, currency);

      return {
        success: true,
        message: 'Test order created successfully! ✅',
        orderId: result.orderId,
        paymentUrl: result.paymentUrl,
        transactionId: testTransactionId,
        amount,
        currency,
        instructions: [
          '1. Copy paymentUrl và mở trong browser',
          '2. Đăng nhập bằng PayPal Sandbox account',
          '3. Complete payment để test full flow',
          '4. Check backend logs để xem webhook được gọi',
        ],
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create test order: ${error.message}`,
        error: error.response?.data || error.message,
        transactionId: testTransactionId,
      };
    }
  }

  /**
   * Test Get Order Details
   * Lấy thông tin order từ PayPal
   */
  @Post('get-order')
  @ApiOperation({
    summary: 'Test get PayPal order details',
    description: 'Lấy thông tin chi tiết của một PayPal order để test.',
  })
  @ApiOkResponse({
    description: 'Order details retrieved successfully',
  })
  async testGetOrder(@Body() body: { orderId: string }) {
    if (!body.orderId) {
      return {
        success: false,
        message: 'orderId is required',
      };
    }

    try {
      const order = await this.paypalService.getOrder(body.orderId);

      return {
        success: true,
        message: 'Order details retrieved successfully! ✅',
        order: {
          id: order.id,
          status: order.status,
          links: order.links,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get order: ${error.message}`,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Check Environment Variables
   * Kiểm tra xem các environment variables đã được cấu hình chưa
   */
  @Get('env-check')
  @ApiOperation({
    summary: 'Check payment environment variables',
    description: 'Kiểm tra xem các environment variables cần thiết đã được cấu hình chưa.',
  })
  @ApiOkResponse({
    description: 'Environment variables check result',
  })
  async checkEnv() {
    const envVars = {
      PAYPAL_CLIENT_ID: {
        exists: !!process.env.PAYPAL_CLIENT_ID,
        value: process.env.PAYPAL_CLIENT_ID
          ? `${process.env.PAYPAL_CLIENT_ID.substring(0, 10)}...`
          : 'NOT SET',
      },
      PAYPAL_CLIENT_SECRET: {
        exists: !!process.env.PAYPAL_CLIENT_SECRET,
        value: process.env.PAYPAL_CLIENT_SECRET
          ? `${process.env.PAYPAL_CLIENT_SECRET.substring(0, 10)}...`
          : 'NOT SET',
      },
      PAYPAL_MODE: {
        exists: !!process.env.PAYPAL_MODE,
        value: process.env.PAYPAL_MODE || 'NOT SET (default: sandbox)',
      },
      APP_URL: {
        exists: !!process.env.APP_URL,
        value: process.env.APP_URL || 'NOT SET',
      },
      FRONTEND_URL: {
        exists: !!process.env.FRONTEND_URL,
        value: process.env.FRONTEND_URL || 'NOT SET',
      },
      APP_NAME: {
        exists: !!process.env.APP_NAME,
        value: process.env.APP_NAME || 'NOT SET',
      },
    };

    const allSet =
      envVars.PAYPAL_CLIENT_ID.exists &&
      envVars.PAYPAL_CLIENT_SECRET.exists &&
      envVars.PAYPAL_MODE.exists;

    return {
      success: allSet,
      message: allSet
        ? 'All required environment variables are set! ✅'
        : 'Some environment variables are missing! ⚠️',
      envVars,
      recommendations: allSet
        ? ['All good! You can test PayPal integration now.']
        : [
            'Please set the following in your .env file:',
            !envVars.PAYPAL_CLIENT_ID.exists && '- PAYPAL_CLIENT_ID',
            !envVars.PAYPAL_CLIENT_SECRET.exists && '- PAYPAL_CLIENT_SECRET',
            !envVars.PAYPAL_MODE.exists && '- PAYPAL_MODE (sandbox or live)',
          ].filter(Boolean),
    };
  }
}
