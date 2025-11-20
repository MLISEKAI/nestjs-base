# Wallet Module - Sequence Diagrams

Tài liệu này mô tả sequence diagram cho từng use case trong Wallet Module.

---

## 1. Get Wallet Summary

**Use Case**: User xem tổng quan số dư Diamond, VEX và trạng thái Monthly Card

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as WalletSummaryService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: GET /wallet/summary
    Controller->>Service: getWalletSummary(userId)

    Service->>Prisma: findFirst(Diamond wallet)
    Prisma->>DB: SELECT * FROM res_wallet WHERE currency IN ('gem', 'diamond')
    DB-->>Prisma: Diamond wallet data
    Prisma-->>Service: diamondWallet

    Service->>Prisma: findFirst(VEX wallet)
    Prisma->>DB: SELECT * FROM res_wallet WHERE currency = 'vex'
    DB-->>Prisma: VEX wallet data

    alt VEX wallet không tồn tại
        Prisma-->>Service: null
        Service->>Prisma: create(VEX wallet)
        Prisma->>DB: INSERT INTO res_wallet
        DB-->>Prisma: New VEX wallet
        Prisma-->>Service: vexWallet
    else VEX wallet tồn tại
        Prisma-->>Service: vexWallet
    end

    Note over Service,DB: Monthly Card subscription được lưu trong res_vip_status<br/>Khi user mua Monthly Card, hệ thống update VIP status (is_vip=true, expiry=nextRenewal)
    Service->>Prisma: findUnique(VIP status)
    Prisma->>DB: SELECT * FROM res_vip_status WHERE user_id = ?
    DB-->>Prisma: VIP status data
    Prisma-->>Service: vipStatus

    Note over Service: Tính monthlyCardStatus:<br/>- active nếu vipStatus.is_vip = true AND expiry > now<br/>- inactive nếu không thỏa điều kiện trên
    Service->>Service: Tính monthlyCardStatus từ vipStatus
    Service-->>Controller: WalletSummaryResponseDto
    Controller-->>User: 200 OK (totalDiamondBalance, vexBalance, monthlyCardStatus)
```

---

## 2. Get Recharge Packages

**Use Case**: User xem danh sách các gói nạp Diamond

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as RechargeService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: GET /wallet/recharge/packages
    Controller->>Service: getRechargePackages()

    Service->>Prisma: findMany(Recharge packages)
    Prisma->>DB: SELECT * FROM res_recharge_package WHERE is_active = true ORDER BY package_id
    DB-->>Prisma: Packages array
    Prisma-->>Service: packages

    Service->>Service: Map packages to DTO
    Service-->>Controller: RechargePackageDto[]
    Controller-->>User: 200 OK (packages list)
```

---

## 3. Get Monthly Cards

**Use Case**: User xem danh sách các Monthly Card subscription

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as SubscriptionService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: GET /wallet/recharge/monthly-cards
    Controller->>Service: getMonthlyCards()

    Service->>Prisma: findMany(Monthly cards)
    Prisma->>DB: SELECT * FROM res_monthly_card WHERE is_active = true ORDER BY card_id
    DB-->>Prisma: Cards array
    Prisma-->>Service: cards

    Service->>Service: Map cards to DTO
    Service-->>Controller: MonthlyCardDto[]
    Controller-->>User: 200 OK (monthly cards list)
```

---

## 4. Checkout Recharge (Purchase Diamond Package)

**Use Case**: User mua gói nạp Diamond

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as RechargeService
    participant Prisma as PrismaService
    participant DB as Database
    participant PaymentGateway as Payment Gateway (Future)

    User->>Controller: POST /wallet/recharge/checkout {packageId}
    Controller->>Service: checkoutRecharge(userId, dto)

    Service->>Prisma: findUnique(Recharge package)
    Prisma->>DB: SELECT * FROM res_recharge_package WHERE package_id = ?
    DB-->>Prisma: Package data
    Prisma-->>Service: packageData

    alt Package không tồn tại hoặc inactive
        Service-->>Controller: NotFoundException
        Controller-->>User: 404 Not Found
    else Package hợp lệ
        Service->>Service: Generate transactionId

        Service->>Prisma: findFirst(Diamond wallet)
        Prisma->>DB: SELECT * FROM res_wallet WHERE currency IN ('gem', 'diamond')
        DB-->>Prisma: Wallet data

        alt Diamond wallet không tồn tại
            Prisma-->>Service: null
            Service->>Prisma: create(Diamond wallet)
            Prisma->>DB: INSERT INTO res_wallet
            DB-->>Prisma: New wallet
            Prisma-->>Service: diamondWallet
        else Diamond wallet tồn tại
            Prisma-->>Service: diamondWallet
        end

        Service->>Prisma: create(Transaction)
        Prisma->>DB: INSERT INTO res_wallet_transaction (type='deposit', status='pending')
        DB-->>Prisma: Transaction created
        Prisma-->>Service: Transaction record

        Note over Service,PaymentGateway: TODO: Tích hợp Payment Gateway
        Service->>PaymentGateway: createCheckoutSession(transactionId, amount)
        PaymentGateway-->>Service: paymentUrl

        Service-->>Controller: CheckoutRechargeResponseDto
        Controller-->>User: 201 Created (transactionId, amount, status, paymentUrl)
    end
```

---

## 5. Purchase Subscription (Monthly Card)

**Use Case**: User đăng ký Monthly Card subscription

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as SubscriptionService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: POST /wallet/subscription/purchase {cardId}
    Controller->>Service: purchaseSubscription(userId, dto)

    Service->>Prisma: findUnique(Monthly card)
    Prisma->>DB: SELECT * FROM res_monthly_card WHERE card_id = ?
    DB-->>Prisma: Card data
    Prisma-->>Service: cardData

    alt Card không tồn tại hoặc inactive
        Service-->>Controller: NotFoundException
        Controller-->>User: 404 Not Found
    else Card hợp lệ
        Service->>Service: Generate subscriptionId
        Service->>Service: Tính startDate và nextRenewal

        Service->>Prisma: upsert(VIP status)
        Prisma->>DB: INSERT/UPDATE res_vip_status SET is_vip=true, expiry=nextRenewal
        DB-->>Prisma: VIP status updated
        Prisma-->>Service: VIP status

        Service-->>Controller: PurchaseSubscriptionResponseDto
        Controller-->>User: 201 Created (subscriptionId, status, startDate, nextRenewal)
    end
```

---

## 6. Get Subscription Details

**Use Case**: User xem chi tiết subscription Monthly Card

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as SubscriptionService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: GET /wallet/subscription/details
    Controller->>Service: getSubscriptionDetails(userId)

    Service->>Prisma: findUnique(VIP status)
    Prisma->>DB: SELECT * FROM res_vip_status WHERE user_id = ?
    DB-->>Prisma: VIP status data
    Prisma-->>Service: vipStatus

    alt VIP status không tồn tại
        Service-->>Controller: NotFoundException
        Controller-->>User: 404 Not Found
    else VIP status tồn tại
        alt is_vip = false
            Service-->>Controller: NotFoundException
            Controller-->>User: 404 No active subscription
        else Subscription đã hết hạn
            Service-->>Controller: NotFoundException
            Controller-->>User: 404 Subscription expired
        else Subscription hợp lệ
            Service->>Prisma: findUnique(User)
            Prisma->>DB: SELECT nickname FROM res_user WHERE id = ?
            DB-->>Prisma: User data
            Prisma-->>Service: user

            Service->>Service: Tính subscription status
            Service-->>Controller: SubscriptionDetailsResponseDto
            Controller-->>User: 200 OK (subscriptionId, status, nextRenewal, username)
        end
    end
```

---

## 7. Get Transaction History

**Use Case**: User xem lịch sử giao dịch

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as TransactionService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: GET /wallet/transactions/history?page=1&limit=20
    Controller->>Service: getTransactionHistory(userId, query)

    Service->>Service: Tính pagination (skip, take)

    Service->>Prisma: findMany(User wallets)
    Prisma->>DB: SELECT id FROM res_wallet WHERE user_id = ?
    DB-->>Prisma: Wallets array
    Prisma-->>Service: wallets

    Service->>Service: Extract walletIds

    par Parallel queries
        Service->>Prisma: findMany(Transactions)
        Prisma->>DB: SELECT * FROM res_wallet_transaction WHERE user_id = ? AND wallet_id IN (?) ORDER BY created_at DESC LIMIT ? OFFSET ?
        DB-->>Prisma: Transactions array
        Prisma-->>Service: transactions
    and
        Service->>Prisma: count(Transactions)
        Prisma->>DB: SELECT COUNT(*) FROM res_wallet_transaction WHERE user_id = ? AND wallet_id IN (?)
        DB-->>Prisma: Total count
        Prisma-->>Service: total
    end

    alt Có gift transactions
        Service->>Service: Extract gift referenceIds
        Service->>Prisma: findMany(Gifts with relations)
        Prisma->>DB: SELECT * FROM res_gift WHERE id IN (?) INCLUDE sender, receiver, giftItem
        DB-->>Prisma: Gifts array
        Prisma-->>Service: gifts
        Service->>Service: Build giftMap
    end

    Service->>Service: Map transactions to DTOs
    loop For each transaction
        alt Transaction type = 'gift'
            Service->>Service: Add gift details (sender_name, receiver_name, gift_name)
        else Transaction type = 'transfer'
            Service->>Prisma: findFirst(Related transaction)
            Prisma->>DB: SELECT * FROM res_wallet_transaction WHERE reference_id = ? AND user_id != ?
            DB-->>Prisma: Related transaction
            Prisma-->>Service: relatedTx
            Service->>Service: Add transfer details (sender_name or receiver_name)
        end
    end

    Service->>Service: buildPaginatedResponse(data, total, page, take)
    Service-->>Controller: IPaginatedResponse<TransactionHistoryItemDto>
    Controller-->>User: 200 OK (transactions with pagination)
```

---

## 8. Convert VEX to Diamond

**Use Case**: User chuyển đổi VEX sang Diamond (có bonus)

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as ConvertService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: POST /wallet/vex/convert {vexAmount}
    Controller->>Service: convertVexToDiamond(userId, dto)

    Service->>Prisma: findFirst(VEX wallet)
    Prisma->>DB: SELECT * FROM res_wallet WHERE currency = 'vex' AND user_id = ?
    DB-->>Prisma: Wallet data

    alt VEX wallet không tồn tại
        Prisma-->>Service: null
        Service->>Prisma: create(VEX wallet)
        Prisma->>DB: INSERT INTO res_wallet (balance=0)
        DB-->>Prisma: New wallet
        Prisma-->>Service: vexWallet
    else VEX wallet tồn tại
        Prisma-->>Service: vexWallet
    end

    Service->>Service: Check vexBalance >= vexAmount

    alt Insufficient balance
        Service-->>Controller: BadRequestException
        Controller-->>User: 400 Insufficient VEX balance
    else Balance đủ
        Service->>Service: Tính baseDiamonds = vexAmount * 0.1
        Service->>Service: calculateBonus(vexAmount)
        Service->>Service: Tính totalDiamondsReceived = baseDiamonds + bonusDiamonds

        Service->>Prisma: findFirst(Diamond wallet)
        Prisma->>DB: SELECT * FROM res_wallet WHERE currency IN ('gem', 'diamond')
        DB-->>Prisma: Wallet data

        alt Diamond wallet không tồn tại
            Prisma-->>Service: null
            Service->>Prisma: create(Diamond wallet)
            Prisma->>DB: INSERT INTO res_wallet
            DB-->>Prisma: New wallet
            Prisma-->>Service: diamondWallet
        else Diamond wallet tồn tại
            Prisma-->>Service: diamondWallet
        end

        Service->>Prisma: $transaction([Update VEX wallet, Update Diamond wallet, Create transaction])
        Prisma->>DB: BEGIN TRANSACTION

        Prisma->>DB: UPDATE res_wallet SET balance = balance - ? WHERE id = ?
        Prisma->>DB: UPDATE res_wallet SET balance = balance + ? WHERE id = ?
        Prisma->>DB: INSERT INTO res_wallet_transaction (type='convert', status='success')

        Prisma->>DB: COMMIT
        DB-->>Prisma: Transaction committed
        Prisma-->>Service: Transaction completed

        Service->>Prisma: findUnique(Updated wallets)
        Prisma->>DB: SELECT * FROM res_wallet WHERE id IN (?, ?)
        DB-->>Prisma: Updated wallets
        Prisma-->>Service: updatedWallets

        Service-->>Controller: ConvertVexToDiamondResponseDto
        Controller-->>User: 200 OK (diamondsReceived, bonusDiamonds, totalDiamondsReceived, newBalances)
    end
```

---

## 9. Create Deposit Address

**Use Case**: User tạo địa chỉ deposit để nhận VEX

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as DepositService
    participant Prisma as PrismaService
    participant DB as Database
    participant BlockchainService as Blockchain Service (Future)

    User->>Controller: POST /wallet/deposit/create {network?}
    Controller->>Service: createDeposit(userId, dto)

    Service->>Service: Set network = dto?.network || 'Ethereum'

    Service->>Prisma: findUnique(Deposit address)
    Prisma->>DB: SELECT * FROM res_deposit_address WHERE user_id = ?
    DB-->>Prisma: Deposit address data
    Prisma-->>Service: existing

    alt Deposit address đã tồn tại
        alt Network giống nhau
            Service->>Service: generateQrCode(existing.deposit_address)
            Service-->>Controller: CreateDepositResponseDto (existing address)
            Controller-->>User: 200 OK (deposit_address, qr_code, network)
        else Network khác
            Service-->>Controller: BadRequestException
            Controller-->>User: 400 Cannot change network
        end
    else Deposit address chưa tồn tại
        Note over Service,BlockchainService: TODO: Tích hợp Blockchain Service
        Service->>BlockchainService: generateAddress(network)
        BlockchainService-->>Service: deposit_address

        Service->>Prisma: create(Deposit address)
        Prisma->>DB: INSERT INTO res_deposit_address
        DB-->>Prisma: Deposit address created
        Prisma-->>Service: depositAddress

        Service->>Service: generateQrCode(deposit_address)
        Service-->>Controller: CreateDepositResponseDto
        Controller-->>User: 201 Created (deposit_address, qr_code, network)
    end
```

---

## 10. Get Deposit Info

**Use Case**: User xem thông tin địa chỉ deposit hiện tại

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as DepositService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: GET /wallet/deposit/info
    Controller->>Service: getDepositInfo(userId)

    Service->>Service: createDeposit(userId) - Lấy hoặc tạo deposit address

    Note over Service: Logic tương tự Create Deposit Address

    Service-->>Controller: DepositInfoResponseDto
    Controller-->>User: 200 OK (deposit_address, qr_code, network)
```

---

## 11. Withdraw VEX

**Use Case**: User rút VEX từ wallet

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as DepositService
    participant Prisma as PrismaService
    participant DB as Database
    participant BlockchainService as Blockchain Service (Future)

    User->>Controller: POST /wallet/withdraw {amount, address}
    Controller->>Service: withdrawVex(userId, dto)

    Service->>Prisma: findFirst(VEX wallet)
    Prisma->>DB: SELECT * FROM res_wallet WHERE currency = 'vex' AND user_id = ?
    DB-->>Prisma: Wallet data

    alt VEX wallet không tồn tại
        Prisma-->>Service: null
        Service->>Prisma: create(VEX wallet)
        Prisma->>DB: INSERT INTO res_wallet (balance=0)
        DB-->>Prisma: New wallet
        Prisma-->>Service: vexWallet
    else VEX wallet tồn tại
        Prisma-->>Service: vexWallet
    end

    Service->>Service: Check vexBalance >= amount

    alt Insufficient balance
        Service-->>Controller: BadRequestException
        Controller-->>User: 400 Insufficient VEX balance
    else Balance đủ
        Service->>Service: Generate withdrawalId

        Service->>Prisma: create(Withdrawal transaction)
        Prisma->>DB: INSERT INTO res_wallet_transaction (type='withdraw', status='pending')
        DB-->>Prisma: Transaction created
        Prisma-->>Service: Transaction record

        Note over Service,BlockchainService: TODO: Tích hợp Blockchain Service
        Service->>BlockchainService: processWithdrawal(amount, address)
        BlockchainService-->>Service: withdrawal_status

        alt Withdrawal thành công
            Service->>Prisma: update(Transaction status='success')
            Prisma->>DB: UPDATE res_wallet_transaction SET status='success'
            Service->>Prisma: update(Wallet balance)
            Prisma->>DB: UPDATE res_wallet SET balance = balance - ?
        else Withdrawal thất bại
            Service->>Prisma: update(Transaction status='failed')
            Prisma->>DB: UPDATE res_wallet_transaction SET status='failed'
        end

        Service-->>Controller: WithdrawVexResponseDto
        Controller-->>User: 201 Created (withdrawalId, status, message)
    end
```

---

## 12. Transfer VEX

**Use Case**: User chuyển VEX cho user khác

```mermaid
sequenceDiagram
    participant User as Sender
    participant Controller as WalletController
    participant Service as TransferService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: POST /wallet/vex/transfer {receiver_id, amount}
    Controller->>Service: transferVex(senderId, dto)

    Service->>Service: Validate senderId != receiver_id

    alt Transfer to self
        Service-->>Controller: BadRequestException
        Controller-->>User: 400 Cannot transfer to yourself
    else Valid receiver
        Service->>Prisma: findUnique(Receiver)
        Prisma->>DB: SELECT * FROM res_user WHERE id = ?
        DB-->>Prisma: User data
        Prisma-->>Service: receiver

        alt Receiver không tồn tại
            Service-->>Controller: NotFoundException
            Controller-->>User: 404 Receiver not found
        else Receiver hợp lệ
            Service->>Prisma: findFirst(Sender VEX wallet)
            Prisma->>DB: SELECT * FROM res_wallet WHERE currency = 'vex' AND user_id = ?
            DB-->>Prisma: Wallet data

            alt Sender wallet không tồn tại
                Prisma-->>Service: null
                Service->>Prisma: create(Sender VEX wallet)
                Prisma->>DB: INSERT INTO res_wallet
                DB-->>Prisma: New wallet
                Prisma-->>Service: senderVexWallet
            else Sender wallet tồn tại
                Prisma-->>Service: senderVexWallet
            end

            Service->>Service: Check senderBalance >= amount

            alt Insufficient balance
                Service-->>Controller: BadRequestException
                Controller-->>User: 400 Insufficient VEX balance
            else Balance đủ
                Service->>Prisma: findFirst(Receiver VEX wallet)
                Prisma->>DB: SELECT * FROM res_wallet WHERE currency = 'vex' AND user_id = ?
                DB-->>Prisma: Wallet data

                alt Receiver wallet không tồn tại
                    Prisma-->>Service: null
                    Service->>Prisma: create(Receiver VEX wallet)
                    Prisma->>DB: INSERT INTO res_wallet
                    DB-->>Prisma: New wallet
                    Prisma-->>Service: receiverVexWallet
                else Receiver wallet tồn tại
                    Prisma-->>Service: receiverVexWallet
                end

                Service->>Service: Generate transferId

                Service->>Prisma: $transaction([Update sender wallet, Update receiver wallet, Create 2 transactions])
                Prisma->>DB: BEGIN TRANSACTION

                Prisma->>DB: UPDATE res_wallet SET balance = balance - ? WHERE id = ?
                Prisma->>DB: UPDATE res_wallet SET balance = balance + ? WHERE id = ?
                Prisma->>DB: INSERT INTO res_wallet_transaction (sender, type='transfer', amount=-amount)
                Prisma->>DB: INSERT INTO res_wallet_transaction (receiver, type='transfer', amount=+amount)

                Prisma->>DB: COMMIT
                DB-->>Prisma: Transaction committed
                Prisma-->>Service: Transaction completed

                Service->>Prisma: findUnique(Updated wallets)
                Prisma->>DB: SELECT * FROM res_wallet WHERE id IN (?, ?)
                DB-->>Prisma: Updated wallets
                Prisma-->>Service: updatedWallets

                Service-->>Controller: TransferVexResponseDto
                Controller-->>User: 201 Created (transferId, status, newBalances)
            end
        end
    end
```

---

## 13. Update Deposit Network

**Use Case**: User cập nhật network cho deposit address

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as DepositService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: PATCH /wallet/deposit/network {network}
    Controller->>Service: updateDepositNetwork(userId, dto)

    Service->>Service: createDeposit(userId, {network: dto.network})

    Note over Service: Logic tương tự Create Deposit Address

    Service-->>Controller: CreateDepositResponseDto
    Controller-->>User: 200 OK (deposit_address, qr_code, network)
```

---

## 14. Verify IAP Receipt

**Use Case**: User xác minh giao dịch In-App Purchase (iOS/Android)

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as IapService
    participant AppleStore as Apple App Store API (Future)
    participant GooglePlay as Google Play API (Future)
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: POST /wallet/iap/verify-receipt {receipt, platform}
    Controller->>Service: verifyIapReceipt(userId, dto)

    Service->>Service: Log verification request

    alt Platform = iOS
        Note over Service,AppleStore: TODO: Tích hợp Apple App Store API
        Service->>AppleStore: verifyReceipt(receipt)
        AppleStore-->>Service: verification_result

        alt Verification thành công
            Service->>Service: Extract product info
            Service->>Prisma: findFirst(Diamond wallet)
            Prisma->>DB: SELECT * FROM res_wallet WHERE currency IN ('gem', 'diamond')
            DB-->>Prisma: Wallet data

            alt Diamond wallet không tồn tại
                Service->>Prisma: create(Diamond wallet)
                Prisma->>DB: INSERT INTO res_wallet
            end

            Service->>Prisma: update(Wallet balance)
            Prisma->>DB: UPDATE res_wallet SET balance = balance + ?

            Service->>Prisma: create(Transaction)
            Prisma->>DB: INSERT INTO res_wallet_transaction (type='deposit', status='success')

            Service-->>Controller: IapVerifyReceiptResponseDto
            Controller-->>User: 200 OK (verified, diamondsAdded)
        else Verification thất bại
            Service-->>Controller: BadRequestException
            Controller-->>User: 400 Invalid receipt
        end
    else Platform = Android
        Note over Service,GooglePlay: TODO: Tích hợp Google Play API
        Service->>GooglePlay: verifyPurchase(receipt)
        GooglePlay-->>Service: verification_result

        Note over Service: Logic tương tự iOS
    else Platform không hợp lệ
        Service-->>Controller: BadRequestException
        Controller-->>User: 400 Invalid platform
    end
```

---

## 15. Get Payment Methods

**Use Case**: User xem danh sách phương thức thanh toán

```mermaid
sequenceDiagram
    participant User
    participant Controller as WalletController
    participant Service as PaymentMethodService
    participant Prisma as PrismaService
    participant DB as Database

    User->>Controller: GET /wallet/payment-methods
    Controller->>Service: getPaymentMethods()

    Service->>Prisma: findMany(Payment methods)
    Prisma->>DB: SELECT * FROM res_payment_method WHERE is_active = true ORDER BY created_at
    DB-->>Prisma: Methods array
    Prisma-->>Service: methods

    Service->>Service: Map methods to DTO
    Service-->>Controller: PaymentMethodDto[]
    Controller-->>User: 200 OK (payment methods list)
```

---

## Notes

### Authentication

- Tất cả các endpoints đều yêu cầu authentication thông qua `AuthGuard('account-auth')`
- User chỉ có thể truy cập wallet của chính mình

### Error Handling

- Các lỗi validation được xử lý bởi `ValidationPipe`
- Business logic errors được throw dưới dạng `BadRequestException`, `NotFoundException`
- Database errors được handle bởi Prisma

### Future Integrations

- **Payment Gateway**: Cần tích hợp với Stripe, PayPal, VNPay cho checkout recharge
- **Blockchain Service**: Cần tích hợp để generate deposit addresses và process withdrawals
- **IAP Services**: Cần tích hợp với Apple App Store và Google Play Store APIs

### Transaction Safety

- Các operations quan trọng (convert, transfer) sử dụng database transactions để đảm bảo data consistency
- Wallet balance updates được thực hiện atomic trong transactions
