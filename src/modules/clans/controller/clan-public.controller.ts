import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { ClanService } from '../service/clan.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { ClanBasicDto, UserClanDto } from '../dto/clan.dto';

/**
 * Public Clans Controller - Không cần authentication
 * Dùng để xem danh sách clans và clans của user khác
 */
@ApiTags('Clans (Public)')
@Controller('public')
export class ClanPublicController {
  constructor(private readonly clans: ClanService) {}

  @Get('clans/all')
  @ApiOperation({
    summary: '[PUBLIC] Danh sách tất cả clan có sẵn để tham gia (không cần đăng nhập)',
  })
  @ApiOkResponse({
    description: 'Danh sách clan khả dụng',
    type: ClanBasicDto,
    isArray: true,
  })
  getAllClans() {
    return this.clans.getAllClans();
  }

  @Get('users/:user_id/clans')
  @ApiOperation({ summary: '[PUBLIC] Xem clans của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Giới hạn số kết quả trả về',
  })
  @ApiOkResponse({
    description: 'Danh sách clan mà user tham gia (read-only)',
    type: UserClanDto,
    isArray: true,
  })
  getClans(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    return this.clans.getClans(user_id, query);
  }
}
