// Import decorators từ Swagger để tạo API documentation
import { ApiPropertyOptional } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import { IsOptional, IsString, IsEnum } from 'class-validator';
// Import BaseQueryDto để extend pagination và filtering
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * GiftItemsQueryDto - DTO cho query parameters của GET /gifts/items
 * Extends BaseQueryDto với type filter
 *
 * Chức năng:
 * - Pagination (page, limit)
 * - Search và sorting (từ BaseQueryDto)
 * - Filter theo gift type (hot, event, lucky, friendship, vip, normal)
 */
export class GiftItemsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    example: 'hot',
    enum: ['hot', 'event', 'lucky', 'friendship', 'vip', 'normal'],
    description: 'Loại quà: hot, event, lucky, friendship, vip, normal',
  })
  @IsOptional()
  @IsEnum(['hot', 'event', 'lucky', 'friendship', 'vip', 'normal'])
  type?: 'hot' | 'event' | 'lucky' | 'friendship' | 'vip' | 'normal';
}
