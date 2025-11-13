import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class QuestScanDto {
  @ApiProperty({ example: 'QR123456', description: 'Mã QR để scan nhiệm vụ' })
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @ApiProperty({ example: '50 coins', description: 'Coin' })
  @IsNotEmpty()
  @IsString()
  reward: string;
}
