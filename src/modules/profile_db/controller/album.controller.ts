import { Controller, Get, Post, Patch, Delete, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiExtraModels, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AlbumDto, PhotoDto, CreateAlbumDto, UpdateAlbumDto, AddPhotoDto } from '../dto/album.dto';
import { AlbumService } from '../service/album.service';

@ApiTags('Albums')
@ApiExtraModels(AlbumDto, PhotoDto)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/albums')
export class AlbumController {
  constructor(private readonly albums: AlbumService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách album của user' })
  @ApiOkResponse({
  description: 'Danh sách album của user',
    type: AlbumDto,
    isArray: true,
  })
  getUserAlbums(@Param('user_id') userId: string) {
    return this.albums.getAlbums(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo album mới' })
  @ApiBody({ type: CreateAlbumDto })
  @ApiCreatedResponse({
  description: 'Album được tạo',
    type: AlbumDto,
  })
  createAlbum(@Param('user_id') userId: string, @Body() dto: CreateAlbumDto) {
    return this.albums.createAlbum(userId, dto);
  }

  @Patch(':album_id')
  @ApiOperation({ summary: 'Cập nhật album' })
  @ApiBody({ type: UpdateAlbumDto })
  updateAlbum(
    @Param('user_id') userId: string,
    @Param('album_id') albumId: string,
    @Body() dto: UpdateAlbumDto,
  ) {
    return this.albums.updateAlbum(userId, albumId, dto);
  }

  @Get(':album_id/photos')
  @ApiOperation({ summary: 'Danh sách ảnh trong album' })
  @ApiOkResponse({
  description: 'Danh sách ảnh trong album',
  type: PhotoDto,
    isArray: true,
  })
  getAlbumPhotos(@Param('user_id') userId: string, @Param('album_id') albumId: string) {
    return this.albums.getAlbumPhotos(userId, albumId);
  }

  @Post(':album_id/photos')
  @ApiOperation({ summary: 'Thêm ảnh vào album' })
  @ApiBody({ type: AddPhotoDto })
  addPhotoToAlbum(
  @Param('user_id') userId: string,
  @Param('album_id') albumId: string,
  @Body() dto: AddPhotoDto,
  ) {
    return this.albums.addPhotoToAlbum(userId, albumId, dto.imageUrl);
  }


  @Delete(':album_id/photos/:photo_id')
  @ApiOperation({ summary: 'Xóa ảnh khỏi album' })
  deletePhotoFromAlbum(
    @Param('user_id') userId: string,
    @Param('album_id') albumId: string,
    @Param('photo_id') photoId: string,
  ) {
    return this.albums.deletePhotoFromAlbum(userId, albumId, photoId);
  }
}