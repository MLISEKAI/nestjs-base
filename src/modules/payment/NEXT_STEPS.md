# 🎉 PayPal Integration Thành Công! - Next Steps

## ✅ Đã hoàn thành

- [x] PayPal credentials đã được cấu hình đúng
- [x] PayPal connection test thành công
- [x] Có thể tạo PayPal order

## 🚀 Các bước tiếp theo

### Bước 1: Test Payment Flow với Test Order

Bạn đã có `paymentUrl` từ test connection. Hãy test thanh toán:

1. **Copy `paymentUrl`** từ response:

   ```
   https://www.sandbox.paypal.com/checkoutnow?token=4DX9634218254182Y
   ```

2. **Mở URL trong browser**

3. **Đăng nhập bằng PayPal Sandbox account:**
   - Nếu chưa có Sandbox account:
     - Vào https://developer.paypal.com/
     - Vào **Sandbox** → **Accounts**
     - PayPal tự động tạo 2 test accounts
     - Click vào **Personal Account** → **Profile** → **Change password**
     - Đặt password dễ nhớ (ví dụ: `Test1234!`)

4. **Complete payment:**
   - Click **Pay Now**
   - PayPal sẽ redirect về `/payment/success`
   - Backend sẽ tự động capture order và cộng Diamond (nếu có transaction)

### Bước 2: Test với Wallet Recharge API

Test với API thật của wallet recharge:

#### 2.1. Đảm bảo có Recharge Package trong Database

Cần có ít nhất 1 package trong `res_recharge_package`:

```sql
INSERT INTO res_recharge_package (package_id, diamonds, price, is_active)
VALUES (1, 100, 1.00, true);
```

Hoặc dùng Prisma Studio:

```bash
npx prisma studio
```

#### 2.2. Gọi API Checkout

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

#### 2.3. Test Payment Flow

1. Mở `paymentUrl` trong browser
2. Đăng nhập PayPal Sandbox account
3. Complete payment
4. Kiểm tra:
   - Transaction status = "success" trong database
   - Diamond được cộng vào wallet
   - Backend logs hiển thị success

### Bước 3: Kiểm tra Database sau Payment

Sau khi thanh toán thành công:

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

### Bước 4: Test Webhook (Optional)

Nếu muốn test webhook riêng:

#### 4.1. Setup ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3001
```

#### 4.2. Cấu hình Webhook trên PayPal Dashboard

1. Vào PayPal Developer Dashboard
2. Chọn app của bạn
3. Vào **Webhooks** section
4. Add webhook URL: `https://your-ngrok-url.ngrok.io/payment/webhook/paypal`
5. Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

#### 4.3. Test Webhook

PayPal sẽ tự động gửi webhook khi có payment event. Check backend logs để xem webhook được nhận.

---

## 📋 Test Checklist

- [ ] Test connection thành công (`GET /payment/test/connection`)
- [ ] Có thể tạo test order (`POST /payment/test/create-order`)
- [ ] Mở `paymentUrl` thấy PayPal checkout page
- [ ] Có thể đăng nhập và thanh toán với PayPal Sandbox account
- [ ] Thanh toán thành công và redirect về success page
- [ ] Transaction trong database có `status = 'success'`
- [ ] Wallet balance được cộng Diamond (nếu test với wallet recharge)
- [ ] Backend logs không có lỗi

---

## 🎯 Test Scenarios

### Scenario 1: Test với $1 (Test Order)

```bash
POST /payment/test/create-order
{
  "amount": 1.0,
  "currency": "USD"
}
```

### Scenario 2: Test với Wallet Recharge

```bash
POST /wallet/recharge/checkout
{
  "packageId": 1
}
```

### Scenario 3: Test Cancel Payment

1. Tạo order
2. Mở `paymentUrl`
3. Click **Cancel** hoặc đóng tab
4. Kiểm tra transaction status = "failed"

---

## 🔍 Debug Tips

### Xem Backend Logs

Backend logs sẽ hiển thị:

- PayPal API calls
- Order creation
- Payment capture
- Webhook events

### Kiểm tra Transaction Status

```sql
SELECT
  id,
  reference_id,
  status,
  amount,
  balance_before,
  balance_after,
  created_at
FROM res_wallet_transaction
ORDER BY created_at DESC
LIMIT 10;
```

### Kiểm tra Wallet Balance

```sql
SELECT
  id,
  user_id,
  currency,
  balance,
  updated_at
FROM res_wallet
WHERE currency = 'diamond';
```

---

## 🚨 Troubleshooting

### Payment URL không mở được

- ✅ Kiểm tra URL đúng chưa
- ✅ Kiểm tra internet connection
- ✅ Thử mở trong incognito mode

### Thanh toán thành công nhưng Diamond không được cộng

- ✅ Check backend logs xem có lỗi gì không
- ✅ Kiểm tra transaction trong database có status = "success" không
- ✅ Kiểm tra webhook có được gọi không

### Redirect về error page

- ✅ Check backend logs
- ✅ Kiểm tra `FRONTEND_URL` trong `.env` đúng chưa
- ✅ Kiểm tra transaction có được tạo không

---

## 📚 Tài liệu tham khảo

- [PayPal Sandbox Testing Guide](./PAYPAL_SANDBOX_TESTING.md)
- [Payment Gateway Integration](./PAYMENT_GATEWAY_INTEGRATION.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

## 🎊 Chúc mừng!

PayPal integration đã hoạt động! Bây giờ bạn có thể:

1. ✅ Test thanh toán với PayPal Sandbox
2. ✅ Tích hợp vào wallet recharge flow
3. ✅ Xử lý payment success/failed
4. ✅ Cộng Diamond vào wallet sau khi thanh toán thành công

**Next:** Test full flow với wallet recharge API và verify Diamond được cộng vào wallet!
