import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ClanService } from '../service/clan.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { UpdateClanRankDto, UserClanDto, ClanDetailDto } from '../dto/clan.dto';

/**
 * Admin Clans Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý clans (ban clans, moderation)
 */
@ApiTags('Clans (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class ClanAdminController {
  constructor(private readonly clans: ClanService) {}

  @Get('users/:user_id/clans')
  @ApiOperation({ summary: '[ADMIN] Danh sách clan của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Giới hạn số kết quả trả về',
  })
  @ApiOkResponse({
    description: 'Danh sách clan mà user tham gia',
    type: UserClanDto,
    isArray: true,
  })
  getClans(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.clans.getClans(userId, query);
  }

  @Patch('clans/:clan_id')
  @ApiOperation({ summary: '[ADMIN] Cập nhật thông tin clan (moderation)' })
  @ApiParam({ name: 'clan_id', description: 'ID của clan' })
  @ApiBody({ description: 'Thông tin cập nhật', type: ClanDetailDto })
  @ApiOkResponse({ description: 'Clan đã được cập nhật', type: ClanDetailDto })
  updateClan(@Param('clan_id') clanId: string, @Body() dto: any) {
    // TODO: Implement updateClan method in service
    return { message: 'Clan updated successfully' };
  }

  @Delete('clans/:clan_id')
  @ApiOperation({ summary: '[ADMIN] Xóa clan (moderation)' })
  @ApiParam({ name: 'clan_id', description: 'ID của clan cần xóa' })
  @ApiOkResponse({
    description: 'Clan đã bị xóa',
    schema: {
      type: 'object',
      properties: {
        message: { example: 'Clan deleted successfully' },
      },
    },
  })
  deleteClan(@Param('clan_id') clanId: string) {
    // TODO: Implement deleteClan method in service
    return { message: 'Clan deleted successfully' };
  }
}
