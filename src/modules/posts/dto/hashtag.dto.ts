// Import decorators từ Swagger để tạo API documentation
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import { IsString, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

/**
 * CreateHashtagDto - DTO để tạo hashtag mới
 *
 * Lưu ý:
 * - name: Bắt buộc, tên hashtag (không có dấu #)
 */
export class CreateHashtagDto {
  @ApiProperty({ example: 'Sayhi2025', description: 'Tên hashtag (không có dấu #)' })
  @IsString()
  name: string;
}

/**
 * AttachHashtagsDto - DTO để attach hashtags vào post
 *
 * Lưu ý:
 * - hashtags: Bắt buộc, mảng hashtag IDs (tối thiểu 1 hashtag)
 * - Dùng để gắn nhiều hashtags vào một post
 */
export class AttachHashtagsDto {
  @ApiProperty({
    example: ['hashtag-id-1', 'hashtag-id-2'],
    description: 'Danh sách hashtag IDs',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  hashtags: string[];
}
