import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AlbumDto, PhotoDto, CreateAlbumDto, UpdateAlbumDto, AddPhotoDto } from '../dto/album.dto';
import { AlbumService } from '../service/album.service';

/**
 * User Albums Controller - Yêu cầu authentication
 * User chỉ có thể quản lý albums của chính mình
 */
@ApiTags('Albums (User)')
@ApiExtraModels(AlbumDto, PhotoDto)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('albums')
export class AlbumController {
  constructor(private readonly albums: AlbumService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách album của user' })
  @ApiOkResponse({
    description: 'Danh sách album của user',
    type: AlbumDto,
    isArray: true,
  })
  getUserAlbums(@Req() req: any) {
    const userId = req.user.id;
    return this.albums.getAlbums(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo album mới cho user hiện tại' })
  @ApiBody({ type: CreateAlbumDto })
  @ApiCreatedResponse({
    description: 'Album được tạo',
    type: AlbumDto,
  })
  createAlbum(@Req() req: any, @Body() dto: CreateAlbumDto) {
    const userId = req.user.id;
    return this.albums.createAlbum(userId, dto);
  }

  @Patch(':album_id')
  @ApiOperation({ summary: 'Cập nhật album của user hiện tại' })
  @ApiBody({ type: UpdateAlbumDto })
  updateAlbum(@Req() req: any, @Param('album_id') albumId: string, @Body() dto: UpdateAlbumDto) {
    const userId = req.user.id;
    return this.albums.updateAlbum(userId, albumId, dto);
  }

  @Get(':album_id/photos')
  @ApiOperation({ summary: 'Danh sách ảnh trong album của user hiện tại' })
  @ApiOkResponse({
    description: 'Danh sách ảnh trong album',
    type: PhotoDto,
    isArray: true,
  })
  getAlbumPhotos(@Req() req: any, @Param('album_id') albumId: string) {
    const userId = req.user.id;
    return this.albums.getAlbumPhotos(userId, albumId);
  }

  @Post(':album_id/photos')
  @ApiOperation({ summary: 'Thêm ảnh vào album của user hiện tại' })
  @ApiBody({ type: AddPhotoDto })
  addPhotoToAlbum(@Req() req: any, @Param('album_id') albumId: string, @Body() dto: AddPhotoDto) {
    const userId = req.user.id;
    return this.albums.addPhotoToAlbum(userId, albumId, dto.image_url);
  }

  @Delete(':album_id/photos/:photo_id')
  @ApiOperation({ summary: 'Xóa ảnh khỏi album của user hiện tại' })
  deletePhotoFromAlbum(
    @Req() req: any,
    @Param('album_id') albumId: string,
    @Param('photo_id') photoId: string,
  ) {
    const userId = req.user.id;
    return this.albums.deletePhotoFromAlbum(userId, albumId, photoId);
  }
}
