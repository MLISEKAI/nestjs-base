# PayPal Sandbox Testing Guide

## 🎯 Trả lời câu hỏi: Có cần nạp tiền thật không?

**KHÔNG CẦN!** PayPal có **Sandbox Mode** (chế độ test) cho phép bạn test thanh toán mà **KHÔNG CẦN TIỀN THẬT**.

## PayPal Sandbox là gì?

PayPal Sandbox là môi trường test giống hệt PayPal thật, nhưng:

- ✅ **KHÔNG dùng tiền thật**
- ✅ **KHÔNG cần thẻ tín dụng thật**
- ✅ **Miễn phí** để test
- ✅ **An toàn** - không ảnh hưởng đến tài khoản PayPal thật

## Cách setup PayPal Sandbox

### Bước 1: Tạo PayPal Developer Account

1. Truy cập: https://developer.paypal.com/
2. Đăng nhập bằng tài khoản PayPal của bạn (hoặc tạo mới)
3. Vào **Dashboard** → **My Apps & Credentials**

### Bước 2: Tạo Sandbox App

1. Click **Create App**
2. Đặt tên app (ví dụ: "Diamond Wallet Test")
3. Chọn **Sandbox** (không chọn Live)
4. Click **Create App**
5. Copy **Client ID** và **Client Secret**

### Bước 3: Tạo Sandbox Test Accounts

1. Vào **Sandbox** → **Accounts**
2. PayPal tự động tạo 2 test accounts:
   - **Personal Account** (người mua) - có sẵn tiền test
   - **Business Account** (người bán) - nhận tiền test

3. Click vào **Personal Account** → **Profile** → **Change password**
   - Đặt password dễ nhớ (ví dụ: `Test1234!`)
   - Dùng account này để test thanh toán

### Bước 4: Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# PayPal Sandbox (Test Mode)
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_MODE=sandbox

# URLs
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
APP_NAME=Diamond Wallet
```

### Bước 5: Test Thanh Toán

1. **Start backend server**:

   ```bash
   npm run start:dev
   ```

2. **Gọi API checkout**:

   ```bash
   POST http://localhost:3001/wallet/recharge/checkout
   Authorization: Bearer <your-jwt-token>
   Body: {
     "packageId": 1
   }
   ```

3. **Response sẽ có `paymentUrl`**:

   ```json
   {
     "transactionId": "TX123456",
     "amount": 10.0,
     "status": "pending",
     "paymentUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
   }
   ```

4. **Mở `paymentUrl` trong browser**:
   - Đăng nhập bằng **Sandbox Personal Account** (email và password bạn đã set)
   - PayPal sẽ hiển thị màn hình thanh toán với **tiền test**
   - Click **Pay Now**

5. **Sau khi thanh toán**:
   - PayPal redirect về `/wallet/payment/success`
   - Backend tự động capture order và cộng Diamond vào wallet
   - Frontend nhận callback và hiển thị kết quả

## Test Cases

### ✅ Test Case 1: Thanh toán thành công

1. Chọn gói nạp
2. Click "Thanh toán"
3. Đăng nhập Sandbox account
4. Click "Pay Now"
5. **Kết quả**: Diamond được cộng vào wallet ✅

### ✅ Test Case 2: Hủy thanh toán

1. Chọn gói nạp
2. Click "Thanh toán"
3. Đăng nhập Sandbox account
4. Click "Cancel" hoặc đóng tab
5. **Kết quả**: Transaction status = "failed", không cộng Diamond ✅

### ✅ Test Case 3: Thanh toán với số tiền khác nhau

- Test với gói 10 USD
- Test với gói 50 USD
- Test với gói 100 USD
- **Kết quả**: Tất cả đều hoạt động với tiền test ✅

## Sandbox Test Cards (Nếu cần test với thẻ)

PayPal Sandbox cũng hỗ trợ test với thẻ tín dụng test:

- **Card Number**: `4032031925733692`
- **Expiry**: Bất kỳ tháng/năm trong tương lai
- **CVV**: Bất kỳ 3 số
- **Name**: Bất kỳ tên

## Chuyển sang Production (Live Mode)

Khi đã test xong và muốn dùng tiền thật:

1. **Tạo Live App** trên PayPal Dashboard
2. **Lấy Live Client ID và Secret**
3. **Cập nhật `.env`**:

   ```env
   PAYPAL_CLIENT_ID=your-live-client-id
   PAYPAL_CLIENT_SECRET=your-live-client-secret
   PAYPAL_MODE=live
   ```

4. **Deploy backend** với environment variables mới
5. **Cấu hình Webhook URL** trên PayPal Dashboard:
   - Webhook URL: `https://your-domain.com/wallet/webhook/paypal`

## Lưu ý quan trọng

1. **Sandbox và Live là 2 môi trường riêng biệt**:
   - Sandbox credentials chỉ hoạt động với Sandbox
   - Live credentials chỉ hoạt động với Live

2. **Webhook Testing**:
   - Dùng **ngrok** để test webhook locally:
     ```bash
     ngrok http 3001
     ```
   - Cấu hình webhook URL trên PayPal Dashboard: `https://your-ngrok-url.ngrok.io/wallet/webhook/paypal`

3. **Sandbox Accounts có giới hạn**:
   - Mỗi Sandbox account có số tiền test giới hạn
   - Có thể "nạp" thêm tiền test trong PayPal Dashboard

4. **Logs và Debugging**:
   - Check backend logs để xem PayPal API calls
   - PayPal Dashboard có **Transaction Logs** để xem tất cả transactions

## Troubleshooting

### Lỗi: "PayPal credentials not configured"

- ✅ Kiểm tra `.env` file có `PAYPAL_CLIENT_ID` và `PAYPAL_CLIENT_SECRET`
- ✅ Restart backend server sau khi thay đổi `.env`

### Lỗi: "Failed to authenticate with PayPal"

- ✅ Kiểm tra Client ID và Secret đúng chưa
- ✅ Kiểm tra `PAYPAL_MODE=sandbox` (không phải `live`)

### Payment URL không hoạt động

- ✅ Kiểm tra `APP_URL` trong `.env` đúng chưa
- ✅ Kiểm tra backend server đang chạy

### Diamond không được cộng sau khi thanh toán

- ✅ Check backend logs xem có lỗi gì không
- ✅ Kiểm tra transaction trong database có status = "success" không
- ✅ Kiểm tra webhook có được gọi không (dùng ngrok để test)

## Tài liệu tham khảo

- PayPal Developer Docs: https://developer.paypal.com/docs/
- PayPal Sandbox Guide: https://developer.paypal.com/docs/api-basics/sandbox/
- PayPal Orders API: https://developer.paypal.com/docs/api/orders/v2/
