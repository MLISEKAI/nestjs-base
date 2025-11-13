import { ApiProperty } from '@nestjs/swagger';

export class ClanDto {
  @ApiProperty({ example: 'clan-1' })
  id: string;

  @ApiProperty({ example: 'Warriors' })
  name: string;

  @ApiProperty({ example: 'Leader' })
  rank: string;
}
