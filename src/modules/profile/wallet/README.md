# 💎 Diamond Wallet API Documentation

## 📋 **Tổng quan**

Hệ thống Diamond Wallet cung cấp các API để quản lý:

- **Kim Cương (Diamond/Gem)**: Đơn vị tiền tệ chính trong game
- **VEX**: Đơn vị tiền tệ blockchain
- **Thẻ Tháng (Monthly Cards)**: Subscription service
- **Giao dịch**: Nạp, rút, chuyển đổi, quà tặng

---

## 🔗 **Base URL**

```
http://localhost:3001/users/{user_id}
```

---

## 📚 **API Endpoints**

### **1. Wallet Summary**

Lấy tổng quan số dư và trạng thái.

```http
GET /users/{user_id}/wallet/summary
```

**Response:**

```json
{
  "totalDiamondBalance": 1200,
  "vexBalance": 5000,
  "monthlyCardStatus": "active"
}
```

---

### **2. Recharge Packages**

Lấy danh sách gói nạp Kim Cương.

```http
GET /users/{user_id}/recharge/packages
```

**Response:**

```json
[
  {
    "packageId": 1,
    "diamonds": 100,
    "price": 10000,
    "bonus": "Bonus 10 diamonds"
  },
  {
    "packageId": 2,
    "diamonds": 500,
    "price": 45000,
    "bonus": "Bonus 50 diamonds"
  }
]
```

---

### **3. Monthly Cards**

Lấy danh sách Thẻ Tháng.

```http
GET /users/{user_id}/recharge/monthly-cards
```

**Response:**

```json
[
  {
    "cardId": 1,
    "price": 99000,
    "diamondsDaily": 50,
    "name": "Basic Monthly Card",
    "duration": 30
  },
  {
    "cardId": 2,
    "price": 199000,
    "diamondsDaily": 120,
    "name": "Premium Monthly Card",
    "duration": 30
  }
]
```

---

### **4. Checkout Recharge**

Khởi tạo giao dịch mua gói nạp Kim Cương.

```http
POST /users/{user_id}/recharge/checkout
Content-Type: application/json

{
  "packageId": 2
}
```

**Response:**

```json
{
  "transactionId": "TX123456",
  "amount": 45000,
  "status": "pending",
  "paymentUrl": "https://payment.gateway/checkout/TX123456"
}
```

---

### **5. Purchase Subscription**

Đăng ký Thẻ Tháng.

```http
POST /users/{user_id}/subscription/purchase
Content-Type: application/json

{
  "cardId": 1
}
```

**Response:**

```json
{
  "subscriptionId": "SUB123",
  "status": "active",
  "startDate": "2025-11-07",
  "nextRenewal": "2025-12-07"
}
```

---

### **6. Subscription Details**

Lấy chi tiết đăng ký Thẻ Tháng.

```http
GET /users/{user_id}/subscription/details
```

**Response:**

```json
{
  "subscriptionId": "SUB123",
  "status": "active",
  "nextRenewal": "2025-12-07",
  "username": "loctran"
}
```

---

### **7. Transaction History**

Lấy lịch sử giao dịch với pagination.

```http
GET /users/{user_id}/wallet/transactions/history?page=1&limit=20
```

**Response:**

```json
{
  "items": [
    {
      "id": "TX001",
      "type": "recharge",
      "amount": 500,
      "date": "2025-11-01T10:00:00Z",
      "status": "success",
      "description": "deposit - TX123456"
    },
    {
      "id": "TX002",
      "type": "gift",
      "amount": -100,
      "date": "2025-11-03T12:00:00Z",
      "status": "success",
      "description": "gift - GIFT-001"
    }
  ],
  "meta": {
    "item_count": 20,
    "total_items": 150,
    "items_per_page": 20,
    "total_pages": 8,
    "current_page": 1
  }
}
```

---

### **8. Convert VEX to Diamond**

Chuyển đổi VEX sang Kim Cương.

```http
POST /users/{user_id}/wallet/vex/convert
Content-Type: application/json

{
  "vexAmount": 1000
}
```

**Response:**

```json
{
  "diamondsReceived": 100,
  "newDiamondBalance": 1300,
  "newVexBalance": 4000
}
```

**Lưu ý:** Tỷ lệ chuyển đổi: **1 VEX = 0.1 Diamond** (có thể config)

---

### **9. Create Deposit**

Tạo địa chỉ Deposit để nhận VEX.

```http
POST /users/{user_id}/wallet/deposit/create
```

**Response:**

```json
{
  "depositAddress": "0xabc123...",
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0xabc123...",
  "network": "Ethereum"
}
```

---

### **10. Withdraw VEX**

Khởi tạo yêu cầu rút VEX.

```http
POST /users/{user_id}/wallet/withdraw
Content-Type: application/json

{
  "address": "0xdef456...",
  "amount": 1000,
  "network": "Ethereum"
}
```

**Response:**

```json
{
  "withdrawalId": "WD123",
  "status": "pending",
  "message": "Withdrawal request submitted. Processing..."
}
```

---

### **11. Deposit Info**

Lấy thông tin địa chỉ Deposit hiện tại.

```http
GET /users/{user_id}/wallet/deposit/info
```

**Response:**

```json
{
  "depositAddress": "0xabc123...",
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0xabc123...",
  "network": "Ethereum"
}
```

---

### **12. IAP Verify Receipt**

Xác minh giao dịch In-App Purchase (iOS/Android).

```http
POST /users/{user_id}/iap/verify-receipt
Content-Type: application/json

{
  "receipt": "base64-encoded-receipt",
  "platform": "ios",
  "productId": "com.app.product.id"
}
```

**Response:**

```json
{
  "status": "success",
  "diamondsAdded": 500,
  "newDiamondBalance": 1800
}
```

---

## 🔧 **Cấu trúc Database**

### **ResWallet**

- Mỗi user có thể có nhiều wallets với các currency khác nhau:
  - `gem` hoặc `diamond`: Kim Cương
  - `vex`: VEX token

### **ResWalletTransaction**

- Lưu tất cả giao dịch:
  - `type`: `deposit`, `withdraw`, `gift`, `convert`
  - `status`: `pending`, `success`, `failed`

### **ResVipStatus**

- Dùng để quản lý Monthly Card subscription:
  - `is_vip`: true nếu có subscription
  - `expiry`: Ngày hết hạn

---

## ⚙️ **Cấu hình**

### **Exchange Rate**

Tỷ lệ chuyển đổi VEX → Diamond có thể config trong service:

```typescript
private readonly VEX_TO_DIAMOND_RATE = 0.1; // 1 VEX = 0.1 Diamond
```

### **Recharge Packages & Monthly Cards**

Hiện tại hardcode trong service. Có thể:

- Tạo table `ResRechargePackage` và `ResMonthlyCard` trong DB
- Hoặc config trong environment variables

---

## 🧪 **Test Examples**

### **1. Get Wallet Summary:**

```bash
curl -X GET http://localhost:3001/users/{user_id}/wallet/summary
```

### **2. Get Recharge Packages:**

```bash
curl -X GET http://localhost:3001/users/{user_id}/recharge/packages
```

### **3. Checkout Recharge:**

```bash
curl -X POST http://localhost:3001/users/{user_id}/recharge/checkout \
  -H "Content-Type: application/json" \
  -d '{"packageId": 2}'
```

### **4. Convert VEX to Diamond:**

```bash
curl -X POST http://localhost:3001/users/{user_id}/wallet/vex/convert \
  -H "Content-Type: application/json" \
  -d '{"vexAmount": 1000}'
```

### **5. Get Transaction History:**

```bash
curl -X GET "http://localhost:3001/users/{user_id}/wallet/transactions/history?page=1&limit=20"
```

---

## 📝 **Lưu ý**

### **1. Wallet Currency**

- Diamond wallet: `currency = 'gem'` hoặc `'diamond'`
- VEX wallet: `currency = 'vex'`
- Mỗi user có thể có cả 2 wallets

### **2. Transaction Types**

- `deposit`: Nạp tiền (recharge, IAP)
- `withdraw`: Rút tiền
- `gift`: Tặng quà
- `convert`: Chuyển đổi VEX ↔ Diamond

### **3. Monthly Card**

- Dùng `ResVipStatus` để quản lý
- `is_vip = true` và `expiry > now()` → `active`
- Có thể mở rộng thêm model `ResSubscription` riêng

### **4. Deposit Address**

- Hiện tại generate mock address
- Cần tích hợp với blockchain service để generate thật
- Có thể lưu vào DB table `ResDepositAddress`

### **5. IAP Verification**

- Hiện tại mock verification
- Cần tích hợp với:
  - **iOS**: Apple App Store API
  - **Android**: Google Play Billing API

---

## 🚀 **Next Steps**

1. **Tạo DB tables** (nếu cần):
   - `ResRechargePackage`
   - `ResMonthlyCard`
   - `ResDepositAddress`
   - `ResSubscription` (nếu tách riêng khỏi VIP)

2. **Tích hợp Payment Gateway**:
   - Thay thế mock `paymentUrl` bằng gateway thật

3. **Tích hợp Blockchain Service**:
   - Generate deposit addresses
   - Process withdrawals
   - Verify transactions

4. **Tích hợp IAP APIs**:
   - Apple App Store verification
   - Google Play Billing verification

5. **Add Webhooks**:
   - Payment gateway callbacks
   - Blockchain transaction confirmations

---

## ✅ **Checklist**

- [x] Tạo DTOs cho tất cả endpoints
- [x] Tạo DiamondWalletService
- [x] Tạo DiamondWalletController
- [x] Register trong ProfileModuleDb
- [x] Build thành công
- [ ] Test các endpoints
- [ ] Tích hợp payment gateway
- [ ] Tích hợp blockchain service
- [ ] Tích hợp IAP APIs
