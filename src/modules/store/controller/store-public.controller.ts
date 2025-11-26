import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { StoreService } from '../service/store.service';

/**
 * Public Store Controller - Không cần authentication
 * Dùng để xem store của user khác (marketplace)
 */
@ApiTags('Store (Public)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('public/users/:user_id/store')
export class StorePublicController {
  constructor(private readonly store: StoreService) {}

  @Get()
  @ApiOperation({ summary: '[PUBLIC] Xem store của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem store' })
  @ApiOkResponse({
    description: 'Store items của user (read-only)',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { example: 'item-1' },
              name: { example: 'Sword' },
              price: { example: 100 },
            },
          },
        },
      },
    },
  })
  getStore(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.store.getStore(userId, query);
  }
}
