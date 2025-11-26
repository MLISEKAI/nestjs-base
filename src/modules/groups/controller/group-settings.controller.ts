import {
  Controller,
  Get,
  Patch,
  Post,
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
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GroupService } from '../service/group.service';
import {
  ReportGroupDto,
  UpdateGroupSettingsDto,
} from '../dto/group-settings.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Group Settings')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('groups/:group_id')
export class GroupSettingsController {
  constructor(private readonly groupService: GroupService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Lấy cài đặt nhóm' })
  @ApiParam({ name: 'group_id', description: 'ID nhóm' })
  @ApiOkResponse({
    description: 'Cài đặt nhóm',
    example: {
      group: {
        id: 'group-1',
        name: 'Nhóm bạn thân',
        avatar: 'https://example.com/avatar.jpg',
        introduction: 'Chào mừng đến với nhóm của chúng tôi!',
        classification: 'making_friends',
        max_members: 100,
      },
      notifications: { enabled: true },
      giftSounds: { enabled: true },
    },
  })
  async getGroupSettings(@Param('group_id') group_id: string, @Req() req: AuthenticatedRequest) {
    return this.groupService.getGroupSettings(group_id, req.user.id);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Cập nhật cài đặt nhóm (gộp)' })
  @ApiParam({ name: 'group_id', description: 'ID nhóm' })
  @ApiBody({ type: UpdateGroupSettingsDto })
  @ApiOkResponse({
    description: 'Cập nhật cài đặt nhóm thành công',
    example: {
      group: {
        id: 'group-1',
        name: 'Nhóm bạn thân 2025',
        avatar: 'https://example.com/new-avatar.jpg',
        introduction: 'Giới thiệu mới',
        classification: 'games',
        max_members: 100,
      },
      notifications: { enabled: true },
      giftSounds: { enabled: true },
    },
  })
  async updateSettings(
    @Param('group_id') group_id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateGroupSettingsDto,
  ) {
    return this.groupService.updateGroupSettings(group_id, req.user.id, dto);
  }

  @Get('classification')
  @ApiOperation({ summary: 'Lấy phân loại nhóm' })
  @ApiParam({ name: 'group_id', description: 'ID nhóm' })
  @ApiOkResponse({
    description: 'Phân loại nhóm',
    example: {
      classification: 'making_friends',
    },
  })
  async getClassification(@Param('group_id') group_id: string) {
    const group = await this.groupService.getGroup(group_id);
    return { classification: group.classification };
  }


  @Post('report')
  @ApiOperation({ summary: 'Báo cáo nhóm' })
  @ApiParam({ name: 'group_id', description: 'ID nhóm' })
  @ApiBody({ type: ReportGroupDto })
  @ApiOkResponse({
    description: 'Báo cáo nhóm thành công',
    example: {
      message: 'Báo cáo nhóm thành công',
      reportId: 'report-1',
    },
  })
  async reportGroup(
    @Param('group_id') group_id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReportGroupDto,
  ) {
    return this.groupService.reportGroup(group_id, req.user.id, dto);
  }
}
