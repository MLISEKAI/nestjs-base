import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateGiftDto {
  @ApiProperty({ example: 'user-2', description: 'Người gửi quà' })
  @IsString()
  sender_id: string;

  @ApiProperty({ example: 'user-1', description: 'Người nhận quà' })
  @IsString()
  receiver_id: string;

  @ApiProperty({ example: 'gift-item-1', description: 'ID món quà' })
  @IsString()
  gift_item_id: string;

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
