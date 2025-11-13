import { ApiProperty } from '@nestjs/swagger';

export class WalletDto {
  @ApiProperty({ example: 1000 })
  balance: number;

  @ApiProperty({ example: 'gem' })
  currency: string;
}
