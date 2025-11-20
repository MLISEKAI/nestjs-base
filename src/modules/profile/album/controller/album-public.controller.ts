import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { AlbumService } from '../service/album.service';
import { AlbumDto } from '../dto/album.dto';

/**
 * Public Albums Controller - Không cần authentication
 * Dùng để xem albums của user khác (public gallery)
 */
@ApiTags('Albums (Public)')
@Controller('public/users/:user_id/albums')
export class AlbumPublicController {
  constructor(private readonly albums: AlbumService) {}

  @Get()
  @ApiOperation({ summary: '[PUBLIC] Xem albums của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem albums' })
  @ApiOkResponse({
    description: 'Danh sách albums của user (read-only)',
    type: AlbumDto,
    isArray: true,
  })
  getUserAlbums(@Param('user_id') userId: string) {
    return this.albums.getAlbums(userId);
  }
}
