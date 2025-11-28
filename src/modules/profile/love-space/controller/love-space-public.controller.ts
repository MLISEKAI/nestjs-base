import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { LoveSpaceService } from '../service/love-space.service';

/**
 * Public Love Space Controller - Không cần authentication
 * Dùng để xem Love Space của user khác (public profile)
 */
@ApiTags('Love Space (Public)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('public/users/:user_id/love-space')
export class LoveSpacePublicController {
  constructor(private readonly loveSpace: LoveSpaceService) {}

  @Get()
  @ApiOperation({ summary: '[PUBLIC] Xem Love Space của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem Love Space' })
  @ApiOkResponse({
    description: 'Love Space của user (read-only)',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'ls-1' },
        user_id: { example: 'user-1' },
        bio: { example: 'We met in 2020' },
        created_at: { example: '2025-11-12T00:00:00.000Z' },
        updated_at: { example: '2025-11-12T00:10:00.000Z' },
      },
    },
  })
  getLoveSpace(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    return this.loveSpace.getLoveSpace(user_id, query);
  }
}
