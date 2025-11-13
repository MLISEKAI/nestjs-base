import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClanBasicDto {
  @ApiProperty({ example: 'clan-1' })
  id: string;

  @ApiProperty({ example: 'Warriors' })
  name: string;
}

export class ClanDetailDto {
  @ApiProperty({ example: 'clan-1' })
  id: string;

  @ApiProperty({ example: 'Warriors' })
  name: string;

  @ApiPropertyOptional({ example: 'Clan mạnh nhất thế giới' })
  description?: string;
}

export class UserClanDto {
  @ApiProperty({ example: 'uc-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'clan-1' })
  clan_id: string;

  @ApiProperty({ example: 'Member' })
  rank: string;

  @ApiProperty({ type: () => ClanDetailDto })
  clan: ClanDetailDto;
}

export class ClanDto {
  @ApiPropertyOptional({ example: 'clan-1' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'Warriors' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Leader' })
  @IsString()
  rank: string;
}

export class UpdateClanRankDto {
  @ApiPropertyOptional({ example: 'Officer' })
  @IsString()
  rank?: string;
}

export class CreateClanDto {
@ApiProperty({ example: 'Warriors' })
@IsString()
name: string;

@ApiPropertyOptional({ example: 'Clan mạnh nhất thế giới' })
@IsOptional()
@IsString()
description?: string;
}
