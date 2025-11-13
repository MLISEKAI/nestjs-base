import { ApiProperty } from '@nestjs/swagger';

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
  name: string;

  @ApiProperty({ example: 'https://img.com/cover1.png' })
  coverUrl: string;

  @ApiProperty({ type: [PhotoDto] })
  photos: PhotoDto[];
}
