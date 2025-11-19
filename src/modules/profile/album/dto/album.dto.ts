import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class PhotoDto {
  @ApiProperty({ example: 'photo-1' })
  id: string;

  @ApiProperty({ example: 'album-1' })
  albumId: string;

  @ApiProperty({ example: 'https://img.com/1.png' })
  imageUrl: string;
}

export class AlbumDto {
  @ApiProperty({ example: 'album-1' })
  id: string;

  @ApiProperty({ example: 'Summer Memories' })
  title: string;

  @ApiProperty({ example: 'https://img.com/cover1.png' })
  imageUrl: string;

  @ApiProperty({ type: [PhotoDto] })
  photos: PhotoDto[];
}

export class CreateAlbumDto {
  @ApiProperty({ example: 'Summer Memories' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'https://img.com/cover1.png' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class UpdateAlbumDto {
  @ApiProperty({ example: 'New Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'https://img.com/newcover.png', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class AddPhotoDto {
  @ApiProperty({ example: 'https://image.com/3.png' })
  @IsString()
  imageUrl: string;
}
