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
  @ApiProperty({ example: 'gem', description: 'Currency type (gem, gold, coin, etc.)' })
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

  @ApiProperty({ example: 'gold', required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}
