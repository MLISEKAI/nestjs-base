import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import {
  UpdateClanRankDto,
  CreateClanDto,
  UserClanDto,
  ClanDetailDto,
  ClanBasicDto,
} from '../dto/clan.dto';
import { ClanService } from '../service/clan.service';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * User Clans Controller - Yêu cầu authentication
 * User chỉ có thể quản lý clans của chính mình
 */
@ApiTags('Clans (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('clans')
export class ClanController {
  constructor(private readonly clans: ClanService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách clan của user hiện tại' })
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
  getClans(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const user_id = req.user.id;
    return this.clans.getClans(user_id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo clan mới cho user hiện tại' })
  @ApiBody({ description: 'Thông tin clan', type: CreateClanDto })
  @ApiCreatedResponse({
    description: 'Clan được tạo',
    type: ClanDetailDto,
  })
  createClan(@Req() req: AuthenticatedRequest, @Body() dto: CreateClanDto) {
    const user_id = req.user.id;
    return this.clans.createClan(user_id, dto);
  }

  @Post(':clan_id/join')
  @ApiOperation({ summary: 'Tham gia clan' })
  @ApiParam({
    name: 'clan_id',
    type: String,
    description: 'ID của clan mà user muốn tham gia',
  })
  @ApiCreatedResponse({
    description: 'Kết quả khi user tham gia clan',
    type: UserClanDto,
  })
  joinClan(@Req() req: AuthenticatedRequest, @Param('clan_id') clanId: string) {
    const user_id = req.user.id;
    return this.clans.joinClan(user_id, clanId);
  }

  @Delete(':clan_id/leave')
  @ApiOperation({ summary: 'Rời clan' })
  @ApiParam({
    name: 'clan_id',
    type: String,
    description: 'ID của clan mà user muốn rời',
  })
  @ApiOkResponse({
    description: 'Kết quả rời clan',
    schema: { type: 'object', properties: { message: { example: 'Left clan' } } },
  })
  leaveClan(@Req() req: AuthenticatedRequest, @Param('clan_id') clanId: string) {
    const user_id = req.user.id;
    return this.clans.leaveClan(user_id, clanId);
  }

  @Patch(':clan_id/role')
  @ApiOperation({ summary: 'Cập nhật vai trò trong clan của user hiện tại' })
  @ApiParam({
    name: 'clan_id',
    type: String,
    description: 'ID của clan mà user muốn cập nhật vai trò',
  })
  @ApiBody({
    description: 'Vai trò mới trong clan',
    type: UpdateClanRankDto,
    examples: {
      admin: {
        summary: 'Nâng cấp lên Admin',
        value: { rank: 'Admin' },
      },
      moderator: {
        summary: 'Hạ cấp xuống Moderator',
        value: { rank: 'Moderator' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Thông tin thành viên sau khi cập nhật',
    type: UserClanDto,
  })
  updateClanRole(
    @Req() req: AuthenticatedRequest,
    @Param('clan_id') clanId: string,
    @Body() dto: UpdateClanRankDto,
  ) {
    const user_id = req.user.id;
    return this.clans.updateClanRole(user_id, clanId, dto);
  }

  @Get('info')
  @ApiOperation({ summary: 'Thông tin clan hiện tại của user hiện tại' })
  @ApiOkResponse({
    description: 'Thông tin clan mà user đang tham gia',
    type: UserClanDto,
  })
  getClanInfo(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.clans.getClanInfo(user_id);
  }
}
