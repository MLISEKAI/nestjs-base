import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AlbumDto } from './album.dto';

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
