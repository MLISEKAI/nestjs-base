# Payment Gateway Integration Guide

## Tổng quan

Việc nạp tiền thật vào ví **CẦN được xử lý ở BACKEND**, không phải frontend. Backend cần tích hợp với Payment Gateway để xử lý thanh toán.

## Flow nạp tiền thật

```
1. User chọn gói nạp (Frontend)
   ↓
2. Frontend gọi POST /wallet/recharge/checkout (Backend)
   ↓
3. Backend tạo transaction với status "pending"
   ↓
4. Backend tích hợp Payment Gateway → tạo payment session
   ↓
5. Backend trả về paymentUrl cho Frontend
   ↓
6. Frontend redirect user đến paymentUrl (Payment Gateway)
   ↓
7. User thanh toán trên Payment Gateway
   ↓
8. Payment Gateway gửi webhook về Backend
   ↓
9. Backend xử lý webhook → cập nhật transaction status = "success"
   ↓
10. Backend cộng Diamond vào wallet của user
   ↓
11. Frontend nhận callback và hiển thị kết quả
```

## Các Payment Gateway phổ biến

### 1. VNPay (Việt Nam)

- **Website**: https://www.vnpay.vn/
- **Tài liệu**: https://sandbox.vnpayment.vn/apis/
- **Ưu điểm**: Hỗ trợ nhiều ngân hàng Việt Nam, phí thấp
- **Phù hợp**: Ứng dụng phục vụ thị trường Việt Nam

### 2. Stripe (Quốc tế)

- **Website**: https://stripe.com/
- **Tài liệu**: https://stripe.com/docs/api
- **Ưu điểm**: Hỗ trợ nhiều quốc gia, API dễ sử dụng, bảo mật cao
- **Phù hợp**: Ứng dụng quốc tế

### 3. PayPal

- **Website**: https://www.paypal.com/
- **Tài liệu**: https://developer.paypal.com/docs/api/overview/
- **Ưu điểm**: Phổ biến toàn cầu, dễ tích hợp
- **Phù hợp**: Ứng dụng quốc tế

### 4. Momo (Việt Nam)

- **Website**: https://developers.momo.vn/
- **Tài liệu**: https://developers.momo.vn/v3/docs/
- **Ưu điểm**: Phổ biến ở Việt Nam, thanh toán nhanh
- **Phù hợp**: Ứng dụng phục vụ thị trường Việt Nam

## Các bước implement

### Bước 1: Tạo Payment Gateway Service

Tạo service để tích hợp với payment gateway:

```typescript
// src/modules/wallet/service/payment-gateway.service.ts
@Injectable()
export class PaymentGatewayService {
  async createCheckoutSession(
    transactionId: string,
    amount: number,
    currency: string = 'VND',
  ): Promise<string> {
    // Tích hợp với payment gateway API
    // Trả về paymentUrl
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    // Verify webhook signature từ payment gateway
  }

  async handleWebhook(payload: any): Promise<{
    transactionId: string;
    status: 'success' | 'failed';
    amount: number;
  }> {
    // Xử lý webhook từ payment gateway
  }
}
```

### Bước 2: Cập nhật RechargeService

Cập nhật `recharge.service.ts` để sử dụng Payment Gateway Service:

```typescript
async checkoutRecharge(userId: string, dto: CheckoutRechargeDto) {
  // ... existing code ...

  // Tích hợp payment gateway
  const paymentUrl = await this.paymentGatewayService.createCheckoutSession(
    transactionId,
    Number(packageData.price),
    'VND'
  );

  return {
    transactionId,
    amount: Number(packageData.price),
    status: 'pending',
    paymentUrl, // ✅ Có paymentUrl thật
  };
}
```

### Bước 3: Tạo Webhook Controller

Tạo controller để nhận webhook từ payment gateway:

```typescript
// src/modules/wallet/controller/payment-webhook.controller.ts
@Controller('wallet/webhook')
export class PaymentWebhookController {
  @Post('vnpay')
  async handleVnpayWebhook(@Body() payload: any, @Headers() headers: any) {
    // Verify webhook signature
    // Xử lý payment success/failed
    // Cập nhật transaction và cộng Diamond
  }
}
```

### Bước 4: Cập nhật Transaction khi Payment thành công

Khi nhận webhook thành công từ payment gateway:

```typescript
// 1. Tìm transaction theo transactionId
const transaction = await prisma.resWalletTransaction.findFirst({
  where: { reference_id: transactionId },
});

// 2. Cập nhật transaction status = "success"
await prisma.resWalletTransaction.update({
  where: { id: transaction.id },
  data: { status: 'success' },
});

// 3. Cộng Diamond vào wallet
const wallet = await prisma.resWallet.findUnique({
  where: { id: transaction.wallet_id },
});

const newBalance = Number(wallet.balance) + Number(transaction.amount);

await prisma.resWallet.update({
  where: { id: wallet.id },
  data: { balance: new Prisma.Decimal(newBalance) },
});

// 4. Cập nhật transaction với balance_after
await prisma.resWalletTransaction.update({
  where: { id: transaction.id },
  data: { balance_after: new Prisma.Decimal(newBalance) },
});
```

## Lưu ý bảo mật

1. **Verify Webhook Signature**: Luôn verify signature từ payment gateway để đảm bảo webhook là thật
2. **Idempotency**: Xử lý webhook idempotent (tránh cộng Diamond 2 lần)
3. **HTTPS**: Chỉ nhận webhook qua HTTPS
4. **Environment Variables**: Lưu API keys trong environment variables, không hardcode

## Testing

1. **Sandbox Mode**: Sử dụng sandbox/test mode của payment gateway để test
2. **Webhook Testing**: Sử dụng tools như ngrok để test webhook locally
3. **Transaction Logs**: Log tất cả payment transactions để debug

## Next Steps

1. Chọn payment gateway phù hợp (VNPay, Stripe, PayPal, etc.)
2. Đăng ký tài khoản và lấy API keys
3. Implement Payment Gateway Service
4. Tạo Webhook Controller
5. Test với sandbox mode
6. Deploy và cấu hình webhook URL trên payment gateway dashboard
