# Fix PayPal Credentials Error - "invalid_client"

## 🔴 Lỗi hiện tại

```
error: "invalid_client"
error_description: "Client Authentication failed"
status: 401 Unauthorized
```

## ✅ Giải pháp từng bước

### Bước 1: Kiểm tra PayPal Dashboard

1. **Vào PayPal Developer Dashboard:**
   - Truy cập: https://developer.paypal.com/
   - Đăng nhập bằng tài khoản PayPal của bạn

2. **Kiểm tra App Type:**
   - Vào **My Apps & Credentials**
   - Xem app của bạn là **Sandbox** hay **Live**
   - **QUAN TRỌNG:** Nếu `PAYPAL_MODE=sandbox` → Phải dùng **Sandbox** app
   - Nếu `PAYPAL_MODE=live` → Phải dùng **Live** app

3. **Lấy Credentials mới:**
   - Click vào app **Sandbox** (nếu đang dùng sandbox mode)
   - Copy **Client ID** (bắt đầu bằng `A...`)
   - Click **Show** để hiện **Secret**
   - Copy **Secret**

### Bước 2: Tạo App mới (Nếu cần)

Nếu không chắc app hiện tại đúng chưa, tạo app mới:

1. Vào **My Apps & Credentials**
2. Click **Create App**
3. Đặt tên: `Diamond Wallet Test`
4. Chọn **Sandbox** (không chọn Live)
5. Click **Create App**
6. Copy **Client ID** và **Secret** mới

### Bước 3: Cập nhật .env file

**Format đúng:**

```env
PAYPAL_CLIENT_ID=AXqKkOqQwafXZtU1234567890
PAYPAL_CLIENT_SECRET=ELg1Y1cFtgagkGieuA8awzU5A2vWgHDFgbJN1zQ-8GxPx
PAYPAL_MODE=sandbox
```

**Lưu ý:**

- ❌ KHÔNG có dấu ngoặc kép: `PAYPAL_CLIENT_ID="..."` (SAI)
- ❌ KHÔNG có khoảng trắng: `PAYPAL_CLIENT_ID = ...` (SAI)
- ❌ KHÔNG có comment trên cùng dòng: `PAYPAL_CLIENT_ID=... # comment` (SAI)
- ✅ Đúng: `PAYPAL_CLIENT_ID=AXqKkOqQwafXZtU1234567890`

### Bước 4: Verify Credentials

**Test với cURL (trong terminal):**

```bash
# Thay YOUR_CLIENT_ID và YOUR_CLIENT_SECRET bằng credentials thật
curl -X POST https://api.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

**Nếu thành công:**

```json
{
  "scope": "...",
  "access_token": "A21AA...",
  "token_type": "Bearer",
  "app_id": "APP-...",
  "expires_in": 32400
}
```

**Nếu vẫn lỗi 401:**

- Credentials vẫn không đúng
- Kiểm tra lại copy/paste
- Thử tạo app mới

### Bước 5: Restart Backend Server

**QUAN TRỌNG:** Sau khi thay đổi `.env`, **BẮT BUỘC** phải restart server:

```bash
# Dừng server (Ctrl+C trong terminal đang chạy server)
# Sau đó start lại:
npm run start:dev
```

### Bước 6: Test lại

```bash
GET http://localhost:3001/payment/test/connection
```

**Kết quả mong đợi:**

```json
{
  "success": true,
  "message": "PayPal connection successful! ✅"
}
```

---

## 🔍 Debug Checklist

- [ ] Đã vào PayPal Developer Dashboard
- [ ] Đã chọn đúng app (Sandbox nếu `PAYPAL_MODE=sandbox`)
- [ ] Đã copy **Client ID** và **Secret** mới
- [ ] Đã cập nhật `.env` với format đúng (không có dấu ngoặc kép, không có khoảng trắng)
- [ ] Đã test với cURL và thành công
- [ ] Đã **restart backend server**
- [ ] Đã test lại endpoint `/payment/test/connection`

---

## 🚨 Các lỗi thường gặp

### 1. Dùng Live credentials với Sandbox mode

**Triệu chứng:** Lỗi 401 mặc dù credentials đúng
**Giải pháp:** Đảm bảo dùng **Sandbox** credentials với `PAYPAL_MODE=sandbox`

### 2. Copy thiếu ký tự

**Triệu chứng:** Client ID hoặc Secret không đủ dài
**Giải pháp:** Copy lại toàn bộ, không bỏ sót ký tự nào

### 3. Có khoảng trắng thừa

**Triệu chứng:** Credentials có vẻ đúng nhưng vẫn lỗi
**Giải pháp:** Kiểm tra không có khoảng trắng ở đầu/cuối

### 4. Chưa restart server

**Triệu chứng:** Thay đổi `.env` nhưng vẫn dùng credentials cũ
**Giải pháp:** **Restart backend server**

### 5. App bị disable hoặc expired

**Triệu chứng:** Credentials đúng nhưng vẫn lỗi
**Giải pháp:** Tạo app mới trên PayPal Dashboard

---

## 📝 Ví dụ .env file đúng

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=AXqKkOqQwafXZtU1234567890abcdefghijklmnopqrstuvwxyz
PAYPAL_CLIENT_SECRET=ELg1Y1cFtgagkGieuA8awzU5A2vWgHDFgbJN1zQ-8GxPxABCDEFGHIJKLMNOPQRSTUVWXYZ
PAYPAL_MODE=sandbox

# App URLs
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
APP_NAME=Diamond Wallet
```

---

## 💡 Tips

1. **Luôn dùng Sandbox credentials** khi development
2. **Tạo app riêng** cho mỗi môi trường (dev, staging, production)
3. **Không commit** `.env` file vào git
4. **Verify credentials** với cURL trước khi dùng trong code
5. **Restart server** sau mỗi lần thay đổi `.env`

---

## 🆘 Vẫn không được?

Nếu đã làm tất cả các bước trên mà vẫn lỗi:

1. **Tạo app hoàn toàn mới** trên PayPal Dashboard
2. **Copy credentials mới** vào `.env`
3. **Test với cURL** để verify credentials đúng
4. **Restart server** và test lại
5. **Check backend logs** để xem error chi tiết

Nếu vẫn không được, có thể:

- PayPal account có vấn đề
- Network/firewall block PayPal API
- Credentials đã bị revoke

Trong trường hợp này, liên hệ PayPal Support hoặc tạo PayPal account mới để test.
