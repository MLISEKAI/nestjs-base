import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    example: '66c4df4e-9a44-4bbf-84b0-68661ca433f0',
    description: 'ID của user bị chặn',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  blocked_id: string;
}
