# PayPal Testing Guide - Hướng dẫn Test PayPal Integration

## 🎯 Bước 1: Kiểm tra Environment Variables

Trước tiên, kiểm tra xem các biến môi trường đã được cấu hình đúng chưa:

```bash
GET http://localhost:3001/payment/test/env-check
```

**Response mong đợi:**

```json
{
  "success": true,
  "message": "All required environment variables are set! ✅",
  "envVars": {
    "PAYPAL_CLIENT_ID": {
      "exists": true,
      "value": "AeA1QIZX..."
    },
    "PAYPAL_CLIENT_SECRET": {
      "exists": true,
      "value": "ELg1Y..."
    },
    "PAYPAL_MODE": {
      "exists": true,
      "value": "sandbox"
    }
  }
}
```

**Nếu thiếu biến môi trường:**

- Kiểm tra file `.env` có các biến sau:
  ```env
  PAYPAL_CLIENT_ID=your-client-id
  PAYPAL_CLIENT_SECRET=your-client-secret
  PAYPAL_MODE=sandbox
  APP_URL=http://localhost:3001
  FRONTEND_URL=http://localhost:3000
  ```
- **Restart backend server** sau khi thay đổi `.env`

---

## 🎯 Bước 2: Test PayPal Connection

Kiểm tra xem có thể kết nối với PayPal API không:

```bash
GET http://localhost:3001/payment/test/connection
```

**Response thành công:**

```json
{
  "success": true,
  "message": "PayPal connection successful! ✅",
  "config": {
    "mode": "sandbox",
    "baseUrl": "https://api.sandbox.paypal.com",
    "hasClientId": true,
    "hasClientSecret": true
  },
  "token": "Token obtained successfully"
}
```

**Nếu lỗi:**

- Kiểm tra `PAYPAL_CLIENT_ID` và `PAYPAL_CLIENT_SECRET` đúng chưa
- Kiểm tra `PAYPAL_MODE=sandbox` (không phải `live`)
- Kiểm tra internet connection

---

## 🎯 Bước 3: Test Tạo Order (Test với $1)

Tạo một test order để kiểm tra toàn bộ flow:

```bash
POST http://localhost:3001/payment/test/create-order
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "amount": 1.0,
  "currency": "USD"
}
```

**Response thành công:**

```json
{
  "success": true,
  "message": "Test order created successfully! ✅",
  "orderId": "5O190127TN364715T",
  "paymentUrl": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "transactionId": "TEST-1234567890-abc123",
  "amount": 1.0,
  "currency": "USD",
  "instructions": [
    "1. Copy paymentUrl và mở trong browser",
    "2. Đăng nhập bằng PayPal Sandbox account",
    "3. Complete payment để test full flow",
    "4. Check backend logs để xem webhook được gọi"
  ]
}
```

**Các bước tiếp theo:**

1. Copy `paymentUrl` từ response
2. Mở URL trong browser
3. Đăng nhập bằng **PayPal Sandbox account** (tài khoản test)
4. Click **Pay Now** để thanh toán
5. PayPal sẽ redirect về `/payment/success`
6. Check backend logs để xem transaction được xử lý

---

## 🎯 Bước 4: Test Full Flow với Wallet Recharge

Test với API thật của wallet recharge:

### 4.1. Tạo Recharge Package (nếu chưa có)

Cần có ít nhất 1 package trong database `res_recharge_package`:

- `package_id`: 1
- `diamonds`: 100
- `price`: 1.00
- `is_active`: true

### 4.2. Gọi API Checkout

```bash
POST http://localhost:3001/wallet/recharge/checkout
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "packageId": 1
}
```

**Response:**

```json
{
  "transactionId": "TX1234567890-abc123",
  "amount": 1.0,
  "status": "pending",
  "paymentUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
}
```

### 4.3. Test Payment Flow

1. Mở `paymentUrl` trong browser
2. Đăng nhập PayPal Sandbox account
3. Complete payment
4. Kiểm tra:
   - Transaction status = "success" trong database
   - Diamond được cộng vào wallet
   - Backend logs hiển thị success

---

## 🎯 Bước 5: Kiểm tra Database

Sau khi thanh toán thành công, kiểm tra database:

```sql
-- Kiểm tra transaction
SELECT * FROM res_wallet_transaction
WHERE reference_id = 'TX1234567890-abc123'
ORDER BY created_at DESC;

-- Kiểm tra wallet balance
SELECT * FROM res_wallet
WHERE user_id = 'your-user-id' AND currency = 'diamond';
```

**Kết quả mong đợi:**

- Transaction có `status = 'success'`
- Transaction có `balance_after` được cập nhật
- Wallet `balance` tăng lên

---

## 🎯 Bước 6: Test Webhook (Optional)

Nếu muốn test webhook riêng:

### 6.1. Setup ngrok (để test webhook locally)

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3001
```

### 6.2. Cấu hình Webhook trên PayPal Dashboard

1. Vào PayPal Developer Dashboard
2. Chọn app của bạn
3. Vào **Webhooks** section
4. Add webhook URL: `https://your-ngrok-url.ngrok.io/payment/webhook/paypal`
5. Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

### 6.3. Test Webhook

PayPal sẽ tự động gửi webhook khi có payment event. Check backend logs để xem webhook được nhận.

---

## ✅ Checklist - Đã hoạt động khi:

- [ ] `GET /payment/test/env-check` trả về `success: true`
- [ ] `GET /payment/test/connection` trả về `success: true`
- [ ] `POST /payment/test/create-order` tạo được order và có `paymentUrl`
- [ ] Mở `paymentUrl` thấy PayPal checkout page
- [ ] Thanh toán thành công và redirect về success page
- [ ] Transaction trong database có `status = 'success'`
- [ ] Wallet balance được cộng Diamond
- [ ] Backend logs không có lỗi

---

## 🐛 Troubleshooting

### Lỗi: "PayPal credentials not configured"

- ✅ Kiểm tra `.env` file có `PAYPAL_CLIENT_ID` và `PAYPAL_CLIENT_SECRET`
- ✅ Restart backend server

### Lỗi: "Failed to authenticate with PayPal"

- ✅ Kiểm tra Client ID và Secret đúng chưa (copy từ PayPal Dashboard)
- ✅ Kiểm tra `PAYPAL_MODE=sandbox` (không phải `live`)
- ✅ Kiểm tra internet connection

### Payment URL không mở được

- ✅ Kiểm tra `APP_URL` trong `.env` đúng chưa
- ✅ Kiểm tra backend server đang chạy

### Diamond không được cộng sau khi thanh toán

- ✅ Check backend logs xem có lỗi gì không
- ✅ Kiểm tra transaction trong database có status = "success" không
- ✅ Kiểm tra webhook có được gọi không

### Không có PayPal Sandbox account

1. Vào https://developer.paypal.com/
2. Đăng nhập
3. Vào **Sandbox** → **Accounts**
4. PayPal tự động tạo 2 test accounts
5. Click vào **Personal Account** → **Profile** → **Change password**
6. Đặt password dễ nhớ để test

---

## 📚 Tài liệu tham khảo

- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [PayPal Sandbox Guide](./PAYPAL_SANDBOX_TESTING.md)
- [Payment Gateway Integration](./PAYMENT_GATEWAY_INTEGRATION.md)
