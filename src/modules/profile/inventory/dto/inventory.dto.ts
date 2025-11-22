import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryItemDto {
  @ApiProperty({ example: 'item-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'res-item-1' })
  item_id: string;

  @ApiProperty({ example: 'Rose', description: 'Tên của item' })
  name?: string;

  @ApiProperty({
    example: 'https://example.com/rose.png',
    description: 'URL ảnh của item',
    required: false,
  })
  image_url?: string | null;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 1 })
  quantity?: number;
}

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'res-item-1' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

export class UpdateInventoryItemDto {
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}
