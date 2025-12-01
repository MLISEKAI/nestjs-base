import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    example: 'user_id',
    description: 'ID của user bị chặn',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  blocked_id: string;
}
