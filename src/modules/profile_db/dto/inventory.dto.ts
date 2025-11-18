import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryItemDto {
  @ApiProperty({ example: 'item-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  userId: string;

  @ApiProperty({ example: 'res-item-1' })
  itemId: string;

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
