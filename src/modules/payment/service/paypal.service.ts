import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
  purchase_units?: Array<{
    reference_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        amount: {
          value: string;
          currency_code: string;
        };
        status: string;
      }>;
    };
  }>;
}

interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        amount: {
          value: string;
          currency_code: string;
        };
        status: string;
      }>;
    };
  }>;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isSandbox: boolean;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.isSandbox = this.configService.get<string>('PAYPAL_MODE', 'sandbox') === 'sandbox';
    this.baseUrl = this.isSandbox ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com';
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn(
        'PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env',
      );
    }
  }

  /**
   * Get PayPal access token
   * Token được cache để tránh request nhiều lần
   */
  private async getAccessToken(): Promise<string> {
    // Kiểm tra token còn hợp lệ không
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException(
        'PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET',
      );
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      this.logger.debug(
        `Attempting to authenticate with PayPal ${this.isSandbox ? 'Sandbox' : 'Live'}`,
      );
      this.logger.debug(`Base URL: ${this.baseUrl}`);
      this.logger.debug(`Client ID: ${this.clientId.substring(0, 10)}...`);

      const response = await firstValueFrom(
        this.httpService.post<PayPalAccessToken>(
          `${this.baseUrl}/v1/oauth2/token`,
          'grant_type=client_credentials',
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${auth}`,
            },
          },
        ),
      );

      this.accessToken = response.data.access_token;
      // Token expires sau (expires_in - 60) seconds để có buffer
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

      this.logger.log('PayPal access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      // Log chi tiết lỗi từ PayPal
      const errorDetails = error.response?.data || error.message;
      this.logger.error('Failed to get PayPal access token', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        baseUrl: this.baseUrl,
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
        clientIdPrefix: this.clientId ? this.clientId.substring(0, 10) : 'N/A',
      });

      // Trả về lỗi chi tiết hơn
      if (error.response?.status === 401) {
        throw new BadRequestException(
          `PayPal authentication failed (401 Unauthorized). Please check your CLIENT_ID and CLIENT_SECRET. Error: ${JSON.stringify(errorDetails)}`,
        );
      } else if (error.response?.status === 400) {
        throw new BadRequestException(
          `PayPal authentication failed (400 Bad Request). Error: ${JSON.stringify(errorDetails)}`,
        );
      } else {
        throw new BadRequestException(
          `Failed to authenticate with PayPal: ${JSON.stringify(errorDetails)}`,
        );
      }
    }
  }

  /**
   * Create PayPal order (checkout session)
   * @param transactionId - Transaction ID từ hệ thống
   * @param amount - Số tiền cần thanh toán
   * @param currency - Loại tiền tệ (USD, VND, etc.)
   * @param returnUrl - URL để redirect về sau khi thanh toán thành công
   * @param cancelUrl - URL để redirect về nếu user hủy thanh toán
   */
  async createOrder(
    transactionId: string,
    amount: number,
    currency: string = 'USD',
    returnUrl?: string,
    cancelUrl?: string,
  ): Promise<{ orderId: string; paymentUrl: string }> {
    const token = await this.getAccessToken();

    // Default URLs nếu không được cung cấp
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3001';
    const defaultReturnUrl = `${baseUrl}/payment/success?transactionId=${transactionId}`;
    const defaultCancelUrl = `${baseUrl}/payment/cancel?transactionId=${transactionId}`;

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: transactionId,
          description: `Wallet Recharge - Transaction ${transactionId}`,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: this.configService.get<string>('APP_NAME') || 'Diamond Wallet',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: returnUrl || defaultReturnUrl,
        cancel_url: cancelUrl || defaultCancelUrl,
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<PayPalOrderResponse>(
          `${this.baseUrl}/v2/checkout/orders`,
          orderData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      // Tìm approval URL từ links
      const approvalLink = response.data.links.find((link) => link.rel === 'approve');
      if (!approvalLink) {
        throw new BadRequestException('Failed to get PayPal approval URL');
      }

      this.logger.log(`PayPal order created: ${response.data.id} for transaction ${transactionId}`);

      return {
        orderId: response.data.id,
        paymentUrl: approvalLink.href,
      };
    } catch (error) {
      this.logger.error('Failed to create PayPal order', error.response?.data || error);
      throw new BadRequestException(
        `Failed to create PayPal order: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Capture PayPal order (xác nhận thanh toán)
   * @param orderId - PayPal order ID
   */
  async captureOrder(orderId: string): Promise<{
    orderId: string;
    status: string;
    transactionId: string;
    amount: number;
    currency: string;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.post<PayPalCaptureResponse>(
          `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      const purchaseUnit = response.data.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];

      if (!capture) {
        throw new BadRequestException('No capture found in PayPal order');
      }

      this.logger.log(`PayPal order captured: ${orderId}`);

      return {
        orderId: response.data.id,
        status: response.data.status,
        transactionId: purchaseUnit.reference_id || orderId,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
      };
    } catch (error) {
      this.logger.error('Failed to capture PayPal order', error.response?.data || error);
      throw new BadRequestException(
        `Failed to capture PayPal order: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get PayPal order details
   * @param orderId - PayPal order ID
   */
  async getOrder(orderId: string): Promise<PayPalOrder> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get<PayPalOrder>(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get PayPal order', error.response?.data || error);
      throw new BadRequestException(
        `Failed to get PayPal order: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Create PayPal payout (gửi tiền về PayPal account)
   * @param email - Email PayPal của người nhận
   * @param amount - Số tiền (USD)
   * @param currency - Loại tiền tệ (USD)
   * @param note - Ghi chú
   */
  async createPayout(
    email: string,
    amount: number,
    currency: string = 'USD',
    note?: string,
  ): Promise<{ payoutId: string; status: string }> {
    const token = await this.getAccessToken();

    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email_subject: 'VEX Withdrawal',
        email_message: note || 'You have received a withdrawal from Diamond Wallet',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: currency,
          },
          receiver: email,
          note: note || 'VEX withdrawal',
          sender_item_id: `WITHDRAW-${Date.now()}`,
        },
      ],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.baseUrl}/v1/payments/payouts`, payoutData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      this.logger.log(
        `PayPal payout created: ${response.data.batch_header.payout_batch_id} for ${email}`,
      );

      return {
        payoutId: response.data.batch_header.payout_batch_id,
        status: response.data.batch_header.batch_status,
      };
    } catch (error) {
      this.logger.error('Failed to create PayPal payout', error.response?.data || error);
      throw new BadRequestException(
        `Failed to create PayPal payout: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Verify webhook signature (PayPal webhook verification)
   * @param headers - Request headers từ PayPal webhook
   * @param body - Request body từ PayPal webhook
   */
  async verifyWebhook(headers: any, body: any): Promise<boolean> {
    // TODO: Implement PayPal webhook signature verification
    // PayPal có webhook verification API riêng
    // Xem: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/

    // Tạm thời return true, nhưng trong production cần verify signature
    this.logger.warn(
      'Webhook signature verification not implemented. Please implement for production.',
    );
    return true;
  }
}
