import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

// Wallet Summary
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

// VEX Balance Response
export class ExchangeRateDto {
  @ApiProperty({ example: 0.01657, description: 'Tỷ giá VEX to USD' })
  vex_to_usd: number;

  @ApiProperty({ example: '2025-11-20T07:59:59Z', description: 'Thời gian cập nhật tỷ giá' })
  last_updated: string;
}

export class DailyLimitsDto {
  @ApiProperty({ example: 4500.0, description: 'Số tiền còn lại có thể nạp trong ngày' })
  deposit_remaining: number;

  @ApiProperty({ example: 2000.0, description: 'Số tiền còn lại có thể rút trong ngày' })
  withdraw_remaining: number;

  @ApiProperty({ example: 1000.0, description: 'Số tiền còn lại có thể chuyển trong ngày' })
  transfer_remaining: number;
}

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

// Diamond Balance Response
export class DiamondBalanceResponseDto {
  @ApiProperty({ example: 1500, description: 'Số dư Diamond' })
  diamond_balance: number;
}

// Recharge Packages
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

// Monthly Cards
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

// Checkout Recharge
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

// Purchase Subscription
export class PurchaseSubscriptionDto {
  @ApiProperty({ example: 1, description: 'ID thẻ tháng' })
  @IsNumber()
  @Type(() => Number)
  cardId: number;
}

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

// Subscription Details
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

// Transaction History
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

// VEX Package (Gói mua Diamond bằng VEX)
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

// Mua Diamond bằng VEX
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

// Transfer VEX
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

// Update Deposit Network
export class UpdateDepositNetworkDto {
  @ApiProperty({
    example: 'Polygon',
    enum: ['Ethereum', 'Polygon', 'BSC', 'Arbitrum'],
    description: 'Mạng blockchain',
  })
  @IsEnum(['Ethereum', 'Polygon', 'BSC', 'Arbitrum'])
  network: string;
}

// Payment Methods
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

// Create Deposit
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

export class CreateDepositResponseDto {
  @ApiProperty({ example: '0xabc123...', description: 'Địa chỉ nạp VEX' })
  deposit_address: string;

  @ApiProperty({ example: 'https://example.com/qr.png', description: 'QR code nạp VEX' })
  qr_code: string;

  @ApiProperty({ example: 'Polygon', description: 'Mạng: Ethereum, Polygon, BSC, etc.' })
  network: string;
}

// Withdraw VEX
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

export class WithdrawVexResponseDto {
  @ApiProperty({ example: 'WD123', description: 'ID rút VEX' })
  withdrawalId: string;

  @ApiProperty({ example: 'pending', description: 'Trạng thái: pending, success, failed' })
  status: string;

  @ApiPropertyOptional({ example: 'Processing...', description: 'Thông báo' })
  message?: string;
}

// Deposit Info
export class DepositInfoResponseDto {
  @ApiProperty({ example: '0xabc123...', description: 'Địa chỉ nạp VEX' })
  deposit_address: string;

  @ApiProperty({ example: 'https://example.com/qr.png', description: 'QR code nạp VEX' })
  qr_code: string;

  @ApiProperty({ example: 'Ethereum', description: 'Mạng: Ethereum, BSC, etc.' })
  network: string;
}

// IAP Verify Receipt
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

export class IapVerifyReceiptResponseDto {
  @ApiProperty({ example: 'success', description: 'Trạng thái: success, failed' })
  status: string;

  @ApiProperty({ example: 500, description: 'Đá quý thêm' })
  diamondsAdded: number;

  @ApiProperty({ example: 1800, description: 'Số đá quý mới' })
  newDiamondBalance: number;
}
