import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { VipService } from '../service/vip.service';

/**
 * Public VIP Controller - Không cần authentication
 * Dùng để xem VIP status của user khác (public profile)
 */
@ApiTags('VIP (Public)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('public/users/:user_id/vip-status')
export class VipPublicController {
  constructor(private readonly vip: VipService) {}

  @Get()
  @ApiOperation({ summary: '[PUBLIC] Xem VIP status của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem VIP status' })
  @ApiOkResponse({
    description: 'VIP status (chỉ trả về is_vip và expiry)',
    schema: {
      type: 'object',
      properties: {
        is_vip: { type: 'boolean', example: true },
        expiry: { type: 'string', example: '2025-12-31T00:00:00.000Z' },
      },
    },
  })
  getVipStatus(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.vip.getVipStatus(userId, query).then((status) => {
      // Chỉ trả về thông tin public
      if (status) {
        return {
          is_vip: status.is_vip,
          expiry: status.expiry,
        };
      }
      return { is_vip: false, expiry: null };
    });
  }
}

