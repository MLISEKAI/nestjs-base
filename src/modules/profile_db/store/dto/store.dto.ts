import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class StoreItemDto {
  @ApiProperty({ example: 'item-1' })
  id: string;

  @ApiProperty({ example: 'Sword' })
  name: string;

  @ApiProperty({ example: 100 })
  price: number;
}

export class StoreDto {
  @ApiProperty({ type: [StoreItemDto] })
  items: StoreItemDto[];
}

export class CreateStoreItemDto {
  @ApiProperty({ example: 'Sword' })
  @IsString()
  name: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Type(() => Number)
  price: number;
}

export class UpdateStoreItemDto {
  @ApiProperty({ example: 'Shield', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 200, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;
}
