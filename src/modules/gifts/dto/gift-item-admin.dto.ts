import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

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

export class UpdateGiftItemDto extends PartialType(CreateGiftItemDto) {}
