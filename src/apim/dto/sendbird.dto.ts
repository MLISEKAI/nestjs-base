import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SBCreateUserDto {
  @ApiPropertyOptional({ default: 'user_id' })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiPropertyOptional({ default: 'user_id' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiPropertyOptional({ default: 'user_id' })
  @IsString()
  profile_url: string;

  metadata?: any;
}

export class SBUpdateUserDto {
  @ApiPropertyOptional({ default: 'user_id' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ default: 'user_id' })
  @IsString()
  @IsOptional()
  profile_url?: string;

  metadata?: any;
}

export enum SBTypeGroupChannel {
  GAME = 'GAME',
  MAKE_FRIEND = 'MAKE_FRIEND',
  LEARN = 'LEARN',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER',
}

export type SBDataGroupChannel = {
  createdBy?: string;
  // summary?: string;
  // channel_type?: SBTypeGroupChannel;
  // channel_id?: string;
};

export class SBUpdateGroupChannelDto {
  @ApiPropertyOptional({ default: 'group name' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ default: 'cover_url' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cover_url?: string;

  data?: SBDataGroupChannel;

  @ApiPropertyOptional({ default: 'cover_url' })
  @IsArray()
  @IsNotEmpty()
  @IsOptional()
  operatorIds?: string[];
}
