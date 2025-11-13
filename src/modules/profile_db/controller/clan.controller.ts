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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BaseQueryDto } from '../dto/base-query.dto';
import { UpdateClanRankDto, CreateClanDto, UserClanDto, ClanDetailDto, ClanBasicDto } from '../dto/clan.dto';
import { ClanService } from '../service/clan.service';

@ApiTags('Clans')
 @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/clans')
export class ClanController {
  constructor(private readonly clans: ClanService) {}

  @Get('all')
  @ApiOperation({ summary: 'Danh sách tất cả clan có sẵn để tham gia' })
  @ApiOkResponse({
    description: 'Danh sách clan khả dụng',
    type: ClanBasicDto,
    isArray: true,
  })
  getAllClans() {
    return this.clans.getAllClans();
  }

  // ----------------------- [GET] Danh sách clan của user -----------------------
  @Get()
  @ApiOperation({ summary: 'Danh sách clan của user' })
  @ApiParam({
    name: 'user_id',
    type: String,
    description: 'ID của user muốn lấy danh sách clan',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Giới hạn số kết quả trả về',
  })
  @ApiOkResponse({ description: 'Danh sách clan mà user tham gia', type: UserClanDto, isArray: true })
  getClans(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.clans.getClans(userId, query);
  }

  // ----------------------- [POST] Tạo clan -----------------------
  @Post()
  @ApiOperation({ summary: 'Tạo clan mới' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID của user tạo clan' })
  @ApiBody({ description: 'Thông tin clan', type: CreateClanDto })
  @ApiCreatedResponse({
  description: 'Clan được tạo',
  type: ClanDetailDto,
})
  createClan(@Param('user_id') userId: string, @Body() dto: CreateClanDto) {
    return this.clans.createClan(userId, dto);
  }

  // ----------------------- [POST] Tham gia clan -----------------------
  @Post(':clan_id/join')
  @ApiOperation({ summary: 'Tham gia clan' })
  @ApiParam({
    name: 'user_id',
    type: String,
    description: 'ID của user tham gia clan',
  })
  @ApiParam({
    name: 'clan_id',
    type: String,
    description: 'ID của clan mà user muốn tham gia', 
  })
  @ApiCreatedResponse({
  description: 'Kết quả khi user tham gia clan',
    type: UserClanDto,
  })
  joinClan(@Param('user_id') userId: string, @Param('clan_id') clanId: string) {
    return this.clans.joinClan(userId, clanId);
  }

  // ----------------------- [DELETE] Rời clan -----------------------
  @Delete(':clan_id/leave')
  @ApiOperation({ summary: 'Rời clan' })
  @ApiParam({
    name: 'user_id',
    type: String,
    description: 'ID của user rời clan',
  })
  @ApiParam({
    name: 'clan_id',
    type: String,
    description: 'ID của clan mà user muốn rời',
  })
  @ApiOkResponse({
  description: 'Kết quả rời clan',
  schema: { type: 'object', properties: { message: { example: 'Left clan' } } }
  })
  leaveClan(@Param('user_id') userId: string, @Param('clan_id') clanId: string) {
    return this.clans.leaveClan(userId, clanId);
  }

  // ----------------------- [PATCH] Cập nhật vai trò -----------------------
  @Patch(':clan_id/role')
  @ApiOperation({ summary: 'Cập nhật vai trò trong clan' })
  @ApiParam({
    name: 'user_id',
    type: String,
    description: 'ID của user cập nhật vai trò trong clan',
  })
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
    @Param('user_id') userId: string,
    @Param('clan_id') clanId: string,
    @Body() dto: UpdateClanRankDto,
  ) {
    return this.clans.updateClanRole(userId, clanId, dto);
  }

  // ----------------------- [GET] Thông tin clan của user -----------------------
  @Get('info')
  @ApiOperation({ summary: 'Thông tin clan hiện tại của user' })
  @ApiParam({
    name: 'user_id',
    type: String,
    description: 'ID của user muốn lấy thông tin clan',
  })
  @ApiOkResponse({
  description: 'Thông tin clan mà user đang tham gia',
    type: UserClanDto,
  })
  getClanInfo(@Param('user_id') userId: string) {
    return this.clans.getClanInfo(userId);
  }
}
