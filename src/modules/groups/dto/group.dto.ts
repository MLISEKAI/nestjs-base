import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class GroupDto {
  @ApiProperty({ example: 'group-1' })
  id: string;

  @ApiProperty({ example: 'My Group' })
  name: string;

  @ApiPropertyOptional({ example: 'Group description' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: false })
  is_public: boolean;

  @ApiProperty({ example: 'user-1' })
  created_by: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Members count' })
  members_count?: number;
}

export class CreateGroupDto {
  @ApiProperty({ example: 'My Group' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: false, description: 'Is group public?' })
  @IsBoolean()
  is_public: boolean;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Updated Group Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class GroupMessageDto {
  @ApiProperty({ example: 'message-1' })
  id: string;

  @ApiProperty({ example: 'group-1' })
  group_id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'Hello everyone!' })
  content: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ description: 'User info' })
  user?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
}

export class SendGroupMessageDto {
  @ApiProperty({ example: 'Hello everyone!' })
  @IsString()
  content: string;
}

export class JoinGroupDto {
  @ApiProperty({ example: 'group-1' })
  @IsString()
  group_id: string;
}
