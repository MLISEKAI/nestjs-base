import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Query DTO for GET /gifts/items
 * Extends BaseQueryDto with type filter
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
