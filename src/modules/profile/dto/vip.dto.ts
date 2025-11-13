import { ApiProperty } from '@nestjs/swagger';

export class VipStatusDto {
  @ApiProperty({ example: true })
  is_vip: boolean;

  @ApiProperty({ example: '2025-12-31' })
  expiry: string;
}
