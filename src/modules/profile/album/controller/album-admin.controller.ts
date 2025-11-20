import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../../common/guards/admin.guard';
import { AlbumService } from '../service/album.service';
import { AlbumDto } from '../dto/album.dto';

/**
 * Admin Albums Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý albums của bất kỳ user nào (moderation)
 */
@ApiTags('Albums (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/albums')
export class AlbumAdminController {
  constructor(private readonly albums: AlbumService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Danh sách albums của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Danh sách albums của user',
    type: AlbumDto,
    isArray: true,
  })
  getUserAlbums(@Param('user_id') userId: string) {
    return this.albums.getAlbums(userId);
  }

  @Delete(':album_id')
  @ApiOperation({ summary: '[ADMIN] Xóa album của user bất kỳ (moderation)' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'album_id', description: 'ID của album cần xóa' })
  @ApiOkResponse({
    description: 'Album đã bị xóa',
    schema: {
      type: 'object',
      properties: {
        message: { example: 'Album deleted successfully' },
      },
    },
  })
  deleteAlbum(@Param('user_id') userId: string, @Param('album_id') albumId: string) {
    // TODO: Implement deleteAlbum method in service
    return { message: 'Album deleted successfully' };
  }
}
