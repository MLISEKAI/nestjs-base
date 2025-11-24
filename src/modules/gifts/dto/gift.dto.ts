// Import decorators từ Swagger để tạo API documentation
import { ApiProperty, PartialType } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import { IsString, IsOptional, IsInt, Min, IsNotEmpty, ValidateIf } from 'class-validator';

/**
 * CreateGiftDto - DTO để tạo gift mới
 *
 * Lưu ý:
 * - receiver_id: Bắt buộc, ID người nhận quà
 * - gift_item_id: Bắt buộc nếu không có item_id (ID món quà từ catalog)
 * - item_id: Optional, ID item từ inventory (nếu có sẽ ưu tiên dùng)
 * - quantity: Optional, số lượng (mặc định: 1)
 * - message: Optional, lời nhắn kèm quà
 *
 * Logic:
 * - Nếu có item_id → dùng item_id, không cần gift_item_id
 * - Nếu không có item_id → bắt buộc phải có gift_item_id
 */
export class CreateGiftDto {
  @ApiProperty({ example: 'user-1', description: 'Người nhận quà (sender tự động từ JWT token)' })
  @IsString()
  @IsNotEmpty()
  receiver_id: string;

  @ApiProperty({
    example: 'gift-item-1',
    description:
      'ID món quà từ catalog. Bắt buộc nếu không có item_id. Nếu có item_id, có thể bỏ qua field này.',
    required: false,
  })
  @ValidateIf((o) => !o.item_id) // Chỉ validate nếu không có item_id
  @IsString()
  @IsNotEmpty()
  gift_item_id?: string;

  @ApiProperty({
    example: 'item-uuid',
    description:
      'ID item từ inventory (optional). Nếu có, sẽ ưu tiên dùng item_id này và tìm gift_item_id tương ứng. Khi dùng item_id, không cần gift_item_id.',
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
/**
 * UpdateGiftDto - DTO để update gift
 * Extends PartialType(CreateGiftDto) → tất cả fields đều optional
 * Cho phép update một phần thông tin của gift
 */
export class UpdateGiftDto extends PartialType(CreateGiftDto) {}

/**
 * GiftSummaryItemDto - DTO cho một gift item trong summary
 * Dùng cho response của GET /gifts (gift summary)
 */
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

/**
 * GiftSummaryResponseDto - DTO cho response của GET /gifts
 * Chứa tổng số gifts và danh sách gifts
 */
export class GiftSummaryResponseDto {
  @ApiProperty({ example: 2, description: 'Tổng số gifts' })
  total: number;

  @ApiProperty({ type: [GiftSummaryItemDto], description: 'Danh sách gifts' })
  gifts: GiftSummaryItemDto[];
}

/**
 * TopSupporterDto - DTO cho top supporter (người tặng quà nhiều nhất)
 * Dùng cho response của GET /gifts/top-supporters
 */
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

/**
 * PurchaseGiftDto - DTO để mua gift từ catalog
 * User mua gift bằng Diamond, gift sẽ được thêm vào inventory
 */
export class PurchaseGiftDto {
  @ApiProperty({ example: 'gift-item-1', description: 'ID món quà muốn mua' })
  @IsString()
  @IsNotEmpty()
  gift_item_id: string;

  @ApiProperty({ example: 1, description: 'Số lượng muốn mua (mặc định: 1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

/**
 * PurchaseGiftResponseDto - DTO cho response sau khi mua gift thành công
 * Chứa thông tin về gift đã mua, tổng giá, số dư còn lại, và item_id mới tạo
 */
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
