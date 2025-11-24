// Import decorators từ Swagger để tạo API documentation
import { ApiProperty, PartialType } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import { IsString, IsOptional, IsNumber, IsNotEmpty, Min, IsUUID } from 'class-validator';
// Import decorators từ class-transformer để transform dữ liệu
import { Type } from 'class-transformer';

/**
 * CreateGiftItemDto - DTO để tạo gift item mới (admin only)
 *
 * Lưu ý:
 * - category_id: Bắt buộc, ID của category (UUID)
 * - name: Bắt buộc, tên gift item
 * - image_url: Optional, URL hình ảnh gift
 * - price: Bắt buộc, giá gift (diamond value), tối thiểu 0
 * - type: Optional, loại gift (hot, event, lucky, friendship, vip, normal)
 * - event_id: Optional, ID của event (nếu là gift của event)
 */
export class CreateGiftItemDto {
  @ApiProperty({ example: 'category-uuid', description: 'ID của category (UUID)' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  category_id: string;

  @ApiProperty({ example: 'Rose', description: 'Tên gift item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'https://example.com/images/rose.png',
    description: 'URL hình ảnh gift',
    required: false,
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({ example: 10, description: 'Giá gift (diamond value)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({
    example: 'hot',
    description: 'Loại gift: hot, event, lucky, friendship, vip, normal',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    example: 'event-uuid',
    description: 'ID của event (nếu là gift của event)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  event_id?: string;
}

/**
 * UpdateGiftItemDto - DTO để update gift item
 * Extends PartialType(CreateGiftItemDto) → tất cả fields đều optional
 * Cho phép update một phần thông tin của gift item
 */
export class UpdateGiftItemDto extends PartialType(CreateGiftItemDto) {}
