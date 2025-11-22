import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class WalletDto {
  @ApiProperty({ example: 1000 })
  balance: number;

  @ApiProperty({ example: 'gem' })
  currency: string;
}

export class CreateWalletDto {
  @ApiProperty({
    example: 'diamond',
    description: 'Currency type: chỉ hỗ trợ "diamond" (Diamond) hoặc "vex" (VEX)',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 0, required: false, description: 'Initial balance' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance?: number;
}

export class UpdateWalletDto {
  @ApiProperty({ example: 1500, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance?: number;

  @ApiProperty({
    example: 'diamond',
    required: false,
    description:
      'Currency type: chỉ hỗ trợ "diamond" (Diamond) hoặc "vex" (VEX). Nếu không có, sẽ tự động tìm wallet với currency tương ứng.',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
