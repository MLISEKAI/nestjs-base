# PayPal Authentication Troubleshooting

## Lỗi: "Failed to authenticate with PayPal"

### Nguyên nhân phổ biến:

### 1. ✅ Client ID hoặc Client Secret không đúng

**Triệu chứng:**

- Lỗi 401 Unauthorized
- "Failed to authenticate with PayPal"

**Giải pháp:**

1. Vào PayPal Developer Dashboard: https://developer.paypal.com/
2. Đăng nhập
3. Vào **My Apps & Credentials**
4. Chọn app của bạn (Sandbox hoặc Live)
5. Copy **Client ID** và **Secret** mới
6. Cập nhật vào `.env`:
   ```env
   PAYPAL_CLIENT_ID=your-client-id-here
   PAYPAL_CLIENT_SECRET=your-client-secret-here
   ```
7. **Restart backend server**

**Lưu ý:**

- Không có khoảng trắng thừa
- Không có dấu ngoặc kép
- Copy chính xác từ PayPal Dashboard

---

### 2. ✅ Credentials không match với Mode

**Triệu chứng:**

- Lỗi 401 Unauthorized
- Credentials đúng nhưng vẫn lỗi

**Giải pháp:**

- **Sandbox mode** → Phải dùng **Sandbox Client ID/Secret**
- **Live mode** → Phải dùng **Live Client ID/Secret**

Kiểm tra:

```env
PAYPAL_MODE=sandbox  # hoặc live
PAYPAL_CLIENT_ID=... # Phải match với mode
PAYPAL_CLIENT_SECRET=... # Phải match với mode
```

**Cách kiểm tra:**

1. Vào PayPal Dashboard
2. Xem app của bạn là **Sandbox** hay **Live**
3. Đảm bảo credentials match với `PAYPAL_MODE`

---

### 3. ✅ Environment Variables không được load

**Triệu chứng:**

- `hasClientId: false` hoặc `hasClientSecret: false`
- Lỗi "PayPal credentials not configured"

**Giải pháp:**

1. Kiểm tra file `.env` có tồn tại không
2. Kiểm tra `.env` có các biến:
   ```env
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   PAYPAL_MODE=sandbox
   ```
3. **Restart backend server** (quan trọng!)
4. Kiểm tra không có comment `#` trước các biến

**Test:**

```bash
GET http://localhost:3001/payment/test/env-check
```

---

### 4. ✅ Format của Client ID/Secret không đúng

**Triệu chứng:**

- Credentials có vẻ đúng nhưng vẫn lỗi

**Giải pháp:**

- Client ID thường bắt đầu bằng chữ cái (ví dụ: `AeA1QIZX...`)
- Client Secret thường là chuỗi dài
- Không có khoảng trắng ở đầu/cuối
- Không có dấu ngoặc kép

**Ví dụ đúng:**

```env
PAYPAL_CLIENT_ID=AeA1QIZXIfGY2q0Z3byg5Fz3IV9VHxkWsuZG9rbU3Xxpc8Gqpd7ytZ
PAYPAL_CLIENT_SECRET=ELg1Y1cFtgagkGieuA8awzU5A2vWgHDFgbJN1zQ-8GxPx
```

**Ví dụ sai:**

```env
PAYPAL_CLIENT_ID="AeA1QIZX..."  # ❌ Có dấu ngoặc kép
PAYPAL_CLIENT_ID = AeA1QIZX...  # ❌ Có khoảng trắng
PAYPAL_CLIENT_ID=AeA1QIZX... # comment  # ❌ Comment trên cùng dòng
```

---

### 5. ✅ Network/Firewall Issues

**Triệu chứng:**

- Timeout errors
- Network errors
- Không thể kết nối đến PayPal API

**Giải pháp:**

1. Kiểm tra internet connection
2. Kiểm tra firewall không block PayPal API
3. Thử ping PayPal API:
   ```bash
   ping api.sandbox.paypal.com
   ```
4. Kiểm tra proxy settings nếu có

---

## Debug Steps

### Bước 1: Kiểm tra Environment Variables

```bash
GET http://localhost:3001/payment/test/env-check
```

**Kết quả mong đợi:**

```json
{
  "success": true,
  "envVars": {
    "PAYPAL_CLIENT_ID": {
      "exists": true,
      "value": "AeA1QIZX..."
    },
    "PAYPAL_CLIENT_SECRET": {
      "exists": true,
      "value": "ELg1Y1cF..."
    }
  }
}
```

### Bước 2: Xem Backend Logs

Backend logs sẽ hiển thị chi tiết lỗi:

- Status code từ PayPal
- Error message từ PayPal
- Client ID prefix (để verify)

**Ví dụ log:**

```
[PayPalService] Attempting to authenticate with PayPal Sandbox
[PayPalService] Base URL: https://api.sandbox.paypal.com
[PayPalService] Client ID: AeA1QIZXIf...
[PayPalService] Failed to get PayPal access token { status: 401, ... }
```

### Bước 3: Test với PayPal Dashboard

1. Vào PayPal Developer Dashboard
2. Vào **My Apps & Credentials**
3. Click vào app của bạn
4. Verify Client ID và Secret
5. Test với PayPal REST API tool (nếu có)

---

## Quick Fix Checklist

- [ ] Client ID và Secret được copy chính xác từ PayPal Dashboard
- [ ] Credentials match với mode (sandbox/live)
- [ ] `.env` file có format đúng (không có khoảng trắng thừa, không có dấu ngoặc kép)
- [ ] `PAYPAL_MODE=sandbox` (hoặc `live`)
- [ ] Backend server đã được restart sau khi thay đổi `.env`
- [ ] Internet connection hoạt động
- [ ] Không có firewall block PayPal API

---

## Test với cURL (Manual Test)

Nếu vẫn lỗi, thử test trực tiếp với PayPal API:

```bash
# Thay YOUR_CLIENT_ID và YOUR_CLIENT_SECRET
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
  "access_token": "...",
  "token_type": "Bearer",
  "app_id": "...",
  "expires_in": 32400
}
```

**Nếu lỗi:**

- 401: Credentials không đúng
- 400: Request format không đúng
- Network error: Không thể kết nối

---

## Liên hệ Support

Nếu vẫn không giải quyết được:

1. Xem backend logs chi tiết
2. Copy error message đầy đủ
3. Kiểm tra PayPal Dashboard xem app có active không
4. Thử tạo app mới trên PayPal Dashboard
