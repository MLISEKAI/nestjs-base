import { ApiProperty } from '@nestjs/swagger';

export class UserBalanceDto {
  @ApiProperty({ example: 34, description: 'Cấp độ hiện tại của user' })
  level: number;

  @ApiProperty({ example: 12, description: 'XP hiện tại' })
  current_xp: number;

  @ApiProperty({ example: 200, description: 'XP cần để thăng cấp tiếp theo' })
  xp_to_next_level: number;
}
