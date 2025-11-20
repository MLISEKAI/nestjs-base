import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { AlbumDto } from '../../album/dto/album.dto';

export class UserProfileDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'NguyenVanA' })
  nickname: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'https://avatar.com/a.png' })
  avatar: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'I love coding' })
  bio: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'male' })
  gender: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '2000-01-01' })
  birthday: string;

  @IsOptional()
  @ApiProperty({ type: [AlbumDto] })
  albums?: AlbumDto[];
}

export class CreateUserProfileDto {
  @ApiProperty({ example: 'NguyenVanA', required: false })
  nickname?: string;

  @ApiProperty({ example: 'https://avatar.com/a.png', required: false })
  avatar?: string;

  @ApiProperty({ example: 'I love coding', required: false })
  bio?: string;

  @ApiProperty({ example: 'male', required: false })
  gender?: string;

  @ApiProperty({ example: '2000-01-01', required: false })
  birthday?: string;
}

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'NewName', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ example: 'https://avatar.com/new.png', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'Updated bio', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'female', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: '2001-01-01', required: false })
  @IsOptional()
  @IsDateString()
  birthday?: string;
}
