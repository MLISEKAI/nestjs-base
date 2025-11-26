import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * DTO cho màn hình tìm kiếm người để nhắn tin
 * Kế thừa BaseQueryDto => có sẵn page, limit, search (keyword)
 * Bổ sung thêm số lượng gợi ý muốn lấy ở phần đầu trang
 */
export class SearchMessagesDto extends BaseQueryDto {
  @ApiPropertyOptional({
    example: 8,
    description: 'Số lượng gợi ý (recent contacts / suggested users)',
    default: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  suggestions?: number = 8;
}
