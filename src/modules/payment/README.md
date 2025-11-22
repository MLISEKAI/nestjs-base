# Payment Module

Module xử lý thanh toán (Payment Gateway) - tách biệt khỏi Wallet module để dễ quản lý.

## Cấu trúc

```
payment/
├── controller/
│   └── payment-webhook.controller.ts  # Webhook handler cho PayPal
├── service/
│   └── paypal.service.ts              # PayPal integration service
├── payment.module.ts                   # Payment module definition
├── PAYMENT_GATEWAY_INTEGRATION.md      # Hướng dẫn tích hợp payment gateway
└── PAYPAL_SANDBOX_TESTING.md          # Hướng dẫn test với PayPal Sandbox
```

## Chức năng

### 1. PayPal Integration

- Tạo PayPal order (checkout session)
- Capture PayPal order (xác nhận thanh toán)
- Verify webhook signature
- Hỗ trợ Sandbox và Live mode

### 2. Webhook Handler

- Nhận webhook từ PayPal
- Xử lý payment success/failed
- Cập nhật transaction và wallet balance

## Endpoints

### Webhook (Internal)

- `POST /payment/webhook/paypal` - PayPal webhook handler
- `GET /payment/success` - PayPal success callback
- `GET /payment/cancel` - PayPal cancel callback

## Environment Variables

```env
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # hoặc live
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
APP_NAME=Diamond Wallet
```

## Usage

Payment module được import vào Wallet module:

```typescript
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PaymentModule],
  // ...
})
export class WalletModule {}
```

Wallet service có thể sử dụng PayPalService:

```typescript
import { PayPalService } from '../../payment/service/paypal.service';

constructor(private paypalService: PayPalService) {}

async checkout() {
  const { paymentUrl } = await this.paypalService.createOrder(
    transactionId,
    amount,
    'USD'
  );
}
```

## Documentation

- [Payment Gateway Integration Guide](./PAYMENT_GATEWAY_INTEGRATION.md)
- [PayPal Sandbox Testing Guide](./PAYPAL_SANDBOX_TESTING.md)
