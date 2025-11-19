import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
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

// Recharge Packages
export class RechargePackageDto {
  @ApiProperty({ example: 1 })
  packageId: number;

  @ApiProperty({ example: 100, description: 'Số đá quý' })
  diamonds: number;

  @ApiProperty({ example: 10000, description: 'Giá tiền' })
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
}

export class CheckoutRechargeResponseDto {
  @ApiProperty({ example: 'TX123456' })
  transactionId: string;

  @ApiProperty({ example: 45000 })
  amount: number;

  @ApiProperty({ example: 'pending', description: 'Trạng thái: pending, success, failed' })
  status: string;

  @ApiPropertyOptional({ example: 'https://payment.gateway/...', description: 'URL thanh toán' })
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
    description: 'Loại giao dịch: recharge, withdraw, gift, convert, subscription',
    enum: ['recharge', 'withdraw', 'gift', 'convert', 'subscription'],
  })
  type: string;

  @ApiProperty({ example: 500, description: 'Số tiền' })
  amount: number;

  @ApiProperty({ example: '2025-11-01T10:00:00Z', description: 'Ngày giao dịch' })
  date: string;

  @ApiPropertyOptional({ example: 'success', description: 'Trạng thái: pending, success, failed' })
  status?: string;

  @ApiPropertyOptional({ example: 'Nạp đá quý', description: 'Mô tả' })
  description?: string;
}

// Convert VEX to Diamond
export class ConvertVexToDiamondDto {
  @ApiProperty({ example: 1000, description: 'Số VEX đổi' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  vexAmount: number;
}

export class ConvertVexToDiamondResponseDto {
  @ApiProperty({ example: 100, description: 'Đá quý nhận được' })
  diamondsReceived: number;

  @ApiProperty({ example: 1300, description: 'Số đá quý mới' })
  newDiamondBalance: number;

  @ApiProperty({ example: 4000, description: 'Số VEX mới' })
  newVexBalance: number;
}

// Create Deposit
export class CreateDepositResponseDto {
  @ApiProperty({ example: '0xabc123...', description: 'Địa chỉ nạp VEX' })
  depositAddress: string;

  @ApiProperty({ example: 'https://example.com/qr.png', description: 'QR code nạp VEX' })
  qrCode: string;

  @ApiPropertyOptional({ example: 'Ethereum', description: 'Mạng: Ethereum, BSC, etc.' })
  network?: string;
}

// Withdraw VEX
export class WithdrawVexDto {
  @ApiProperty({ example: '0xdef456...', description: 'Địa chỉ nhận VEX' })
  @IsString()
  address: string;

  @ApiProperty({ example: 1000, description: 'Số VEX rút' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Ethereum', description: 'Mạng: Ethereum, BSC, etc.' })
  @IsOptional()
  @IsString()
  network?: string;
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
  depositAddress: string;

  @ApiProperty({ example: 'https://example.com/qr.png', description: 'QR code nạp VEX' })
  qrCode: string;

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
