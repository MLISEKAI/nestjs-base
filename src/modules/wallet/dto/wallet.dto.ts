// Import decorators từ Swagger để tạo API documentation
import { ApiProperty } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
// Import decorators từ class-transformer để transform dữ liệu
import { Type } from 'class-transformer';

/**
 * WalletDto - DTO cho wallet response
 * Chứa balance và currency của wallet
 */
export class WalletDto {
  @ApiProperty({ example: 1000 })
  balance: number;

  @ApiProperty({ example: 'gem' })
  currency: string;
}

/**
 * CreateWalletDto - DTO để tạo wallet mới
 * Chứa currency (diamond hoặc vex) và balance (optional, mặc định: 0)
 */
export class CreateWalletDto {
  @ApiProperty({
    example: 'diamond',
    enum: ['diamond', 'vex'],
    description: 'Currency type: "diamond" (Diamond) hoặc "vex" (VEX)',
  })
  @IsEnum(['diamond', 'vex'])
  @IsOptional()
  currency?: 'diamond' | 'vex';

  @ApiProperty({ example: 0, required: false, description: 'Initial balance' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance?: number;
}

/**
 * UpdateWalletDto - DTO để update wallet
 * Chứa balance và currency (optional)
 * Nếu không có currency, sẽ tự động tìm wallet với currency tương ứng
 */
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
