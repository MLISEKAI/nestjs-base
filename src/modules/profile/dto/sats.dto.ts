import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ example: 10 })
  followers: number;

  @ApiProperty({ example: 5 })
  following: number;

  @ApiProperty({ example: 50 })
  total_views: number;
}
