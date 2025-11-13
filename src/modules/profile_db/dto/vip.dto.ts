import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate } from 'class-validator';

export class VipStatusDto {
  @ApiProperty({ example: true })
  is_vip: boolean;

  @ApiProperty({ example: '2025-12-31' })
  expiry: string;
}

export class CreateVipStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  is_vip: boolean;

  @ApiProperty({ example: '2025-12-31' })
  @IsDate()
  @Type(() => Date)
  expiry: Date;
}

export class UpdateVipStatusDto {
  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  is_vip?: boolean;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsDate()
  @Type(() => Date)
  expiry?: Date;
}
