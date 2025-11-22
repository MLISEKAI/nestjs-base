import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateGiftDto {
  @ApiProperty({ example: 'user-1', description: 'Người nhận quà (sender tự động từ JWT token)' })
  @IsString()
  @IsNotEmpty()
  receiver_id: string;

  @ApiProperty({
    example: 'gift-item-1',
    description:
      'ID món quà từ catalog (gift_item_id) hoặc ID item từ inventory (item_id). Nếu dùng item_id, hệ thống sẽ tự động tìm gift_item_id tương ứng.',
  })
  @IsString()
  gift_item_id: string;

  @ApiProperty({
    example: 'item-uuid',
    description:
      'ID item từ inventory (optional). Nếu có, sẽ ưu tiên dùng item_id này và tìm gift_item_id tương ứng.',
    required: false,
  })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiProperty({ example: 1, description: 'Số lượng' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: 'For you', description: 'Lời nhắn kèm quà' })
  @IsOptional()
  @IsString()
  message?: string;
}
export class UpdateGiftDto extends PartialType(CreateGiftDto) {}

export class GiftSummaryItemDto {
  @ApiProperty({ example: 'gift-1' })
  id: string;

  @ApiProperty({ example: 'user-2' })
  sender_id: string;

  @ApiProperty({ example: 'user-1' })
  receiver_id: string;

  @ApiProperty({ example: 'gift-item-1' })
  gift_item_id: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 'For you' })
  message: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: string;
}

export class GiftSummaryResponseDto {
  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ type: [GiftSummaryItemDto] })
  gifts: GiftSummaryItemDto[];
}

export class TopSupporterDto {
  @ApiProperty({ example: 'sup-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'user-2' })
  supporter_id: string;

  @ApiProperty({ example: 500 })
  amount: number;
}

export class PurchaseGiftDto {
  @ApiProperty({ example: 'gift-item-1', description: 'ID món quà muốn mua' })
  @IsString()
  @IsNotEmpty()
  gift_item_id: string;

  @ApiProperty({ example: 1, description: 'Số lượng muốn mua' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class PurchaseGiftResponseDto {
  @ApiProperty({ example: 'gift-item-1' })
  gift_item_id: string;

  @ApiProperty({ example: 'Rose' })
  gift_name: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 100 })
  total_price: number;

  @ApiProperty({ example: 500 })
  remaining_balance: number;

  @ApiProperty({ example: 'item-uuid' })
  item_id: string;
}
