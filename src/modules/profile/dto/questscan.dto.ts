import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class QuestScanDto {
  @ApiProperty({ example: 'QR123456', description: 'Mã QR để scan nhiệm vụ' })
  @IsNotEmpty()
  @IsString()
  qrCode: string;
}
