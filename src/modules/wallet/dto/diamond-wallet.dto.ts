// Import decorators từ Swagger để tạo API documentation
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import { IsString, IsNumber, IsOptional, IsEnum, Min, IsEmail } from 'class-validator';
// Import decorators từ class-transformer để transform dữ liệu
import { Type } from 'class-transformer';
import { CurrencyType, TransactionType, TransactionStatus } from 'src/common/enums';

/**
 * WalletSummaryResponseDto - DTO cho response của GET /wallet/summary
 * Chứa tổng quan wallet: Diamond balance, VEX balance, Monthly card status
 */
export class WalletSummaryResponseDto {
  @ApiProperty({ example: 1200, description: 'Tổng số đá quý' })
  totalDiamondBalance: number;

  @ApiProperty({ example: 5000, description: 'Số VEX' })
  vexBalance: number;

  @ApiProperty({
    example: 'active',
    description: 'Trạng thái thẻ tháng: active, inactive, expired',
  })
  monthlyCardStatus: string;
}

/**
 * ExchangeRateDto - DTO cho exchange rate (tỷ giá)
 * Chứa tỷ giá VEX to USD và thời gian cập nhật
 */
export class ExchangeRateDto {
  @ApiProperty({ example: 0.01657, description: 'Tỷ giá VEX to USD' })
  vex_to_usd: number;

  @ApiProperty({ example: '2025-11-20T07:59:59Z', description: 'Thời gian cập nhật tỷ giá' })
  last_updated: string;
}

/**
 * DailyLimitsDto - DTO cho daily limits (giới hạn giao dịch trong ngày)
 * Chứa số tiền còn lại có thể deposit, withdraw, transfer trong ngày
 */
export class DailyLimitsDto {
  @ApiProperty({ example: 4500.0, description: 'Số tiền còn lại có thể nạp trong ngày' })
  deposit_remaining: number;

  @ApiProperty({ example: 2000.0, description: 'Số tiền còn lại có thể rút trong ngày' })
  withdraw_remaining: number;

  @ApiProperty({ example: 1000.0, description: 'Số tiền còn lại có thể chuyển trong ngày' })
  transfer_remaining: number;
}

/**
 * VexBalanceResponseDto - DTO cho response của GET /wallet/vex
 * Chứa VEX balance, VEX balance quy đổi sang USD, exchange rate, và daily limits
 */
export class VexBalanceResponseDto {
  @ApiProperty({ example: 54292.79, description: 'Số dư VEX' })
  vex_balance: number;

  @ApiProperty({ example: 900.0, description: 'Số dư VEX quy đổi sang USD' })
  vex_balance_usd: number;

  @ApiProperty({ type: ExchangeRateDto, description: 'Thông tin tỷ giá' })
  exchange_rate: ExchangeRateDto;

  @ApiProperty({ type: DailyLimitsDto, description: 'Giới hạn giao dịch trong ngày' })
  daily_limits: DailyLimitsDto;
}

/**
 * DiamondBalanceResponseDto - DTO cho response của GET /wallet/diamond
 * Chứa Diamond balance
 */
export class DiamondBalanceResponseDto {
  @ApiProperty({ example: 1500, description: 'Số dư Diamond' })
  diamond_balance: number;
}

/**
 * RechargePackageDto - DTO cho recharge package (gói nạp tiền)
 * Chứa thông tin gói nạp tiền: packageId, diamonds, price, bonus
 */
export class RechargePackageDto {
  @ApiProperty({ example: 1 })
  packageId: number;

  @ApiProperty({ example: 100, description: 'Số đá quý' })
  diamonds: number;

  @ApiProperty({ example: 1.0, description: 'Giá tiền (USD)' })
  price: number;

  @ApiPropertyOptional({ example: 'Bonus 10 đá quý' })
  bonus?: string;
}

/**
 * MonthlyCardDto - DTO cho monthly card (thẻ tháng)
 * Chứa thông tin thẻ tháng: cardId, price, diamondsDaily, name, duration
 */
export class MonthlyCardDto {
  @ApiProperty({ example: 1 })
  cardId: number;

  @ApiProperty({ example: 99000, description: 'Giá tiền' })
  price: number;

  @ApiProperty({ example: 50, description: 'Đá quý nhận được mỗi ngày' })
  diamondsDaily: number;

  @ApiPropertyOptional({ example: 'Thẻ tháng Premium' })
  name?: string;

  @ApiPropertyOptional({ example: 30, description: 'Thời gian' })
  duration?: number;
}

/**
 * CheckoutRechargeDto - DTO để checkout recharge (nạp tiền)
 * Chứa packageId và currency (diamond hoặc vex)
 */
export class CheckoutRechargeDto {
  @ApiProperty({ example: 1, description: 'ID gói' })
  @IsNumber()
  @Type(() => Number)
  packageId: number;

  @ApiPropertyOptional({
    example: 'diamond',
    enum: ['diamond', 'vex'],
    description: 'Loại tiền tệ muốn mua: diamond (Kim Cương) hoặc vex (VEX). Mặc định: diamond',
  })
  @IsOptional()
  @IsEnum(['diamond', 'vex'])
  currency?: 'diamond' | 'vex';
}

/**
 * CheckoutRechargeResponseDto - DTO cho response sau khi checkout recharge
 * Chứa transactionId, price, status, và paymentUrl (PayPal)
 */
export class CheckoutRechargeResponseDto {
  @ApiProperty({ example: 'TX123456', description: 'ID giao dịch' })
  transactionId: string;

  @ApiProperty({
    example: 1.0,
    description: 'Giá tiền phải thanh toán (USD)',
  })
  price: number;

  @ApiProperty({
    example: 'pending',
    description: 'Trạng thái: pending, success, failed',
  })
  status: string;

  @ApiPropertyOptional({
    example: 'https://payment.gateway/...',
    description: 'URL thanh toán PayPal',
  })
  paymentUrl?: string;
}

/**
 * PurchaseSubscriptionDto - DTO để mua subscription (Monthly Card)
 * Chứa cardId (ID của monthly card muốn mua)
 */
export class PurchaseSubscriptionDto {
  @ApiProperty({ example: 1, description: 'ID thẻ tháng' })
  @IsNumber()
  @Type(() => Number)
  cardId: number;
}

/**
 * PurchaseSubscriptionResponseDto - DTO cho response sau khi mua subscription
 * Chứa subscriptionId, status, startDate, nextRenewal
 */
export class PurchaseSubscriptionResponseDto {
  @ApiProperty({ example: 'SUB123', description: 'ID đăng ký' })
  subscriptionId: string;

  @ApiProperty({ example: 'active', description: 'Trạng thái: active, inactive, expired' })
  status: string;

  @ApiProperty({ example: '2025-11-07', description: 'Ngày bắt đầu' })
  startDate: string;

  @ApiProperty({ example: '2025-12-07', description: 'Ngày gia hạn' })
  nextRenewal: string;
}

/**
 * SubscriptionDetailsResponseDto - DTO cho response của GET /wallet/subscription
 * Chứa thông tin chi tiết subscription: subscriptionId, status, nextRenewal, username
 */
export class SubscriptionDetailsResponseDto {
  @ApiProperty({ example: 'SUB123', description: 'ID đăng ký' })
  subscriptionId: string;

  @ApiProperty({ example: 'active', description: 'Trạng thái: active, inactive, expired' })
  status: string;

  @ApiProperty({ example: '2025-12-07', description: 'Ngày gia hạn' })
  nextRenewal: string;

  @ApiProperty({ example: 'loctran', description: 'Tên người dùng' })
  username: string;
}

/**
 * TransactionItemDto - DTO cho item trong transaction
 * Dùng cho gift transactions, chứa thông tin item (name, quantity, icon, value)
 */
export class TransactionItemDto {
  @ApiProperty({ example: 'Ice Cream Cone', description: 'Tên item' })
  name: string;

  @ApiProperty({ example: 12, description: 'Số lượng' })
  quantity: number;

  @ApiPropertyOptional({ example: '/images/ice-cream.png', description: 'Icon URL' })
  icon?: string;

  @ApiPropertyOptional({ example: 100, description: 'Giá trị' })
  value?: number;
}

/**
 * RelatedUserDto - DTO cho user liên quan đến transaction
 * Dùng cho transfer, gift transactions, chứa thông tin user (id, username, displayName, avatar, isVerified)
 */
export class RelatedUserDto {
  @ApiProperty({ example: 'user-uuid', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'john_doe', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  displayName: string;

  @ApiProperty({ example: '/avatars/john.jpg', description: 'Avatar URL' })
  avatar: string;

  @ApiPropertyOptional({ example: true, description: 'Is verified' })
  isVerified?: boolean;
}

/**
 * ExchangeDetailsDto - DTO cho chi tiết exchange (chuyển đổi currency)
 * Chứa thông tin: fromCurrency, fromAmount, toCurrency, toAmount, rate
 */
export class ExchangeDetailsDto {
  @ApiProperty({ enum: CurrencyType, example: CurrencyType.VEX, description: 'From currency' })
  fromCurrency: CurrencyType;

  @ApiProperty({ example: 1000, description: 'From amount' })
  fromAmount: number;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.Diamonds, description: 'To currency' })
  toCurrency: CurrencyType;

  @ApiProperty({ example: 100, description: 'To amount' })
  toAmount: number;

  @ApiProperty({ example: 0.1, description: 'Exchange rate' })
  rate: number;
}

/**
 * TransactionModelDto - DTO cho transaction model (Flutter compatible)
 * Chứa đầy đủ thông tin transaction: id, type, status, currency, amount, description, etc.
 * Format tương thích với Flutter app
 */
export class TransactionModelDto {
  @ApiProperty({ example: 'TX001', description: 'ID giao dịch' })
  id: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.deposit,
    description: 'Loại giao dịch',
  })
  type: TransactionType;

  @ApiProperty({ example: 500, description: 'Số tiền' })
  amount: number;

  @ApiPropertyOptional({ example: 1500, description: 'Số dư sau giao dịch' })
  balanceAfter?: number;

  @ApiProperty({ example: '2025-11-01T10:00:00Z', description: 'Thời gian giao dịch' })
  timestamp: string;

  @ApiProperty({ example: 'Deposit diamonds from the app', description: 'Mô tả' })
  description: string;

  @ApiPropertyOptional({ type: TransactionItemDto, description: 'Item thông tin (cho gift)' })
  item?: TransactionItemDto;

  @ApiPropertyOptional({ type: RelatedUserDto, description: 'User liên quan (cho gift/transfer)' })
  relatedUser?: RelatedUserDto;

  @ApiPropertyOptional({
    type: ExchangeDetailsDto,
    description: 'Chi tiết exchange (cho convert)',
  })
  exchange?: ExchangeDetailsDto;

  @ApiProperty({
    enum: TransactionStatus,
    example: TransactionStatus.completed,
    description: 'Trạng thái',
  })
  status: TransactionStatus;
}

/**
 * TransactionHistoryResponseDto - DTO cho response của GET /wallet/transactions
 * Flutter compatible - format tương thích với Flutter app
 * Chứa danh sách transactions và pagination metadata
 */
export class TransactionHistoryResponseDto {
  @ApiProperty({ type: [TransactionModelDto], description: 'Danh sách giao dịch' })
  data: TransactionModelDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * TransactionHistoryItemDto - Legacy DTO (deprecated)
 * Giữ lại để backward compatibility
 * Nên sử dụng TransactionModelDto thay thế
 */
export class TransactionHistoryItemDto {
  @ApiProperty({ example: 'TX001', description: 'ID giao dịch' })
  id: string;

  @ApiProperty({
    example: 'recharge',
    description: 'Loại giao dịch: recharge, withdraw, gift, convert, subscription, transfer',
    enum: ['recharge', 'withdraw', 'gift', 'convert', 'subscription', 'transfer'],
  })
  type: string;

  @ApiProperty({ example: 500, description: 'Số tiền' })
  amount: number;

  @ApiProperty({ example: '2025-11-01T10:00:00Z', description: 'Ngày giao dịch' })
  date: string;

  @ApiPropertyOptional({ example: 'success', description: 'Trạng thái: pending, success, failed' })
  status?: string;

  @ApiPropertyOptional({ example: 'Deposit diamonds from the app', description: 'Mô tả' })
  description?: string;

  @ApiPropertyOptional({
    example: 'Ahmed Vetrovs',
    description: 'Tên người gửi (cho gift/transfer)',
  })
  sender_name?: string;

  @ApiPropertyOptional({
    example: 'Angel Saris',
    description: 'Tên người nhận (cho gift/transfer)',
  })
  receiver_name?: string;

  @ApiPropertyOptional({ example: 'Ice Cream Cone x12', description: 'Tên quà (cho gift)' })
  gift_name?: string;

  @ApiPropertyOptional({
    example: 'Live: Ice Cream Cone x12',
    description: 'Thông tin live stream',
  })
  live_stream_info?: string;
}

/**
 * VexPackageDto - DTO cho VEX package (gói mua Diamond bằng VEX)
 * Chứa thông tin gói: packageId, vexAmount, baseDiamonds, bonusDiamonds, totalDiamonds
 */
export class VexPackageDto {
  @ApiProperty({ example: 1, description: 'ID gói' })
  packageId: number;

  @ApiProperty({ example: 20, description: 'Số VEX cần thanh toán' })
  vexAmount: number;

  @ApiProperty({ example: 435, description: 'Số Diamond nhận được (base)' })
  baseDiamonds: number;

  @ApiProperty({ example: 115, description: 'Bonus Diamond' })
  bonusDiamonds: number;

  @ApiProperty({ example: 550, description: 'Tổng Diamond nhận được (base + bonus)' })
  totalDiamonds: number;
}

/**
 * ConvertVexToDiamondDto - DTO để chuyển đổi VEX sang Diamond
 * Chứa vexAmount (chỉ hỗ trợ các gói cố định: 20, 50, 80, 120, 200, 420 VEX)
 */
export class ConvertVexToDiamondDto {
  @ApiProperty({
    example: 20,
    description:
      'Số VEX muốn dùng để mua Diamond. Chỉ hỗ trợ các gói: 20, 50, 80, 120, 200, 420 VEX (mỗi gói có bonus Diamond khác nhau)',
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  vexAmount: number;
}

/**
 * ConvertVexToDiamondResponseDto - DTO cho response sau khi chuyển đổi VEX sang Diamond
 * Chứa diamondsReceived, bonusDiamonds, totalDiamondsReceived, newDiamondBalance, newVexBalance
 */
export class ConvertVexToDiamondResponseDto {
  @ApiProperty({ example: 100, description: 'Đá quý nhận được (base)' })
  diamondsReceived: number;

  @ApiProperty({ example: 20, description: 'Bonus đá quý' })
  bonusDiamonds: number;

  @ApiProperty({ example: 120, description: 'Tổng đá quý nhận được (base + bonus)' })
  totalDiamondsReceived: number;

  @ApiProperty({ example: 1300, description: 'Số đá quý mới' })
  newDiamondBalance: number;

  @ApiProperty({ example: 4000, description: 'Số VEX mới' })
  newVexBalance: number;
}

/**
 * TransferVexDto - DTO để chuyển VEX từ user này sang user khác
 * Chứa receiver_id, amount, và note (optional)
 */
export class TransferVexDto {
  @ApiProperty({ example: 'user-receiver-id', description: 'ID người nhận' })
  @IsString()
  receiver_id: string;

  @ApiProperty({ example: 1000, description: 'Số VEX chuyển' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Gift from friend', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * TransferVexResponseDto - DTO cho response sau khi chuyển VEX
 * Chứa transferId, status, newSenderBalance, newReceiverBalance
 */
export class TransferVexResponseDto {
  @ApiProperty({ example: 'TRF123', description: 'ID giao dịch chuyển' })
  transferId: string;

  @ApiProperty({ example: 'success', description: 'Trạng thái: success, failed' })
  status: string;

  @ApiProperty({ example: 4000, description: 'Số VEX mới của người gửi' })
  newSenderBalance: number;

  @ApiProperty({ example: 5000, description: 'Số VEX mới của người nhận' })
  newReceiverBalance: number;
}

/**
 * UpdateDepositNetworkDto - DTO để update deposit network
 * Chứa network (Ethereum, Polygon, BSC, Arbitrum)
 */
export class UpdateDepositNetworkDto {
  @ApiProperty({
    example: 'Polygon',
    enum: ['Ethereum', 'Polygon', 'BSC', 'Arbitrum'],
    description: 'Mạng blockchain',
  })
  @IsEnum(['Ethereum', 'Polygon', 'BSC', 'Arbitrum'])
  network: string;
}

/**
 * PaymentMethodDto - DTO cho payment method (phương thức thanh toán)
 * Chứa id, name, type, masked_info, is_active
 */
export class PaymentMethodDto {
  @ApiProperty({ example: 'visa', description: 'ID phương thức thanh toán' })
  id: string;

  @ApiProperty({ example: 'Visa Avocado Bank', description: 'Tên phương thức' })
  name: string;

  @ApiProperty({ example: 'card', enum: ['card', 'subscription', 'crypto'], description: 'Loại' })
  type: string;

  @ApiPropertyOptional({ example: '...1519', description: 'Thông tin bổ sung (masked)' })
  masked_info?: string;

  @ApiPropertyOptional({ example: true, description: 'Có active không' })
  is_active?: boolean;
}

/**
 * CreateDepositDto - DTO để tạo deposit address
 * Chứa network (optional, mặc định: Ethereum)
 */
export class CreateDepositDto {
  @ApiPropertyOptional({
    example: 'Polygon',
    enum: ['Ethereum', 'Polygon', 'BSC', 'Arbitrum'],
    description: 'Mạng blockchain (mặc định: Ethereum)',
  })
  @IsOptional()
  @IsEnum(['Ethereum', 'Polygon', 'BSC', 'Arbitrum'])
  network?: string;
}

/**
 * CreateDepositResponseDto - DTO cho response sau khi tạo deposit address
 * Chứa deposit_address, qr_code, network
 */
export class CreateDepositResponseDto {
  @ApiProperty({ example: '0xabc123...', description: 'Địa chỉ nạp VEX' })
  deposit_address: string;

  @ApiProperty({ example: 'https://example.com/qr.png', description: 'QR code nạp VEX' })
  qr_code: string;

  @ApiProperty({ example: 'Polygon', description: 'Mạng: Ethereum, Polygon, BSC, etc.' })
  network: string;
}

/**
 * WithdrawVexDto - DTO để withdraw VEX về PayPal
 * Chứa amount và paypalEmail
 */
export class WithdrawVexDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email PayPal để nhận tiền (rút về PayPal)',
  })
  @IsString()
  @IsEmail()
  paypalEmail: string;

  @ApiProperty({ example: 1000, description: 'Số VEX rút (sẽ convert sang USD: 1 VEX = 1 USD)' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  amount: number;
}

/**
 * WithdrawVexResponseDto - DTO cho response sau khi withdraw VEX
 * Chứa withdrawalId, status, message (optional)
 */
export class WithdrawVexResponseDto {
  @ApiProperty({ example: 'WD123', description: 'ID rút VEX' })
  withdrawalId: string;

  @ApiProperty({ example: 'pending', description: 'Trạng thái: pending, success, failed' })
  status: string;

  @ApiPropertyOptional({ example: 'Processing...', description: 'Thông báo' })
  message?: string;
}

/**
 * DepositInfoResponseDto - DTO cho response của GET /wallet/deposit/info
 * Chứa deposit_address, qr_code, network
 */
export class DepositInfoResponseDto {
  @ApiProperty({ example: '0xabc123...', description: 'Địa chỉ nạp VEX' })
  deposit_address: string;

  @ApiProperty({ example: 'https://example.com/qr.png', description: 'QR code nạp VEX' })
  qr_code: string;

  @ApiProperty({ example: 'Ethereum', description: 'Mạng: Ethereum, BSC, etc.' })
  network: string;
}

/**
 * IapVerifyReceiptDto - DTO để verify IAP receipt (iOS/Android)
 * Chứa receipt, platform (ios/android), và productId (optional)
 */
export class IapVerifyReceiptDto {
  @ApiProperty({
    example: 'base64-encoded-receipt',
    description: 'Receipt từ App Store/Play Store',
  })
  @IsString()
  receipt: string;

  @ApiProperty({ example: 'ios', enum: ['ios', 'android'], description: 'Nền tảng: ios, android' })
  @IsEnum(['ios', 'android'])
  platform: 'ios' | 'android';

  @ApiPropertyOptional({ example: 'com.app.product.id', description: 'ID sản phẩm' })
  @IsOptional()
  @IsString()
  productId?: string;
}

/**
 * IapVerifyReceiptResponseDto - DTO cho response sau khi verify IAP receipt
 * Chứa status, diamondsAdded, newBalance
 */
export class IapVerifyReceiptResponseDto {
  @ApiProperty({ example: 'success', description: 'Trạng thái: success, failed' })
  status: string;

  @ApiProperty({ example: 500, description: 'Đá quý thêm' })
  diamondsAdded: number;

  @ApiProperty({ example: 1800, description: 'Số đá quý mới' })
  newDiamondBalance: number;
}
