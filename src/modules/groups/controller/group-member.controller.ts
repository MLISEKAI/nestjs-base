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
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GroupService } from '../service/group.service';
import {
  AddGroupMembersDto,
  UpdateMemberRoleDto,
  MemberSummaryDto,
} from '../dto/group-settings.dto';
import { GroupMemberListResponseDto } from '../dto/group.dto';
import { MemberRole } from '../../../common/enums';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Group Members')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('groups/:group_id/members')
export class GroupMemberController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách members của group' })
  @ApiParam({ name: 'group_id', description: 'Group ID' })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    enum: ['owner', 'admin', 'member'],
    description: 'Lọc theo vai trò thành viên',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: GroupMemberListResponseDto,
    description: 'Danh sách members với pagination',
    example: {
      items: [
        {
          id: 'user-1',
          nickname: 'Nguyễn Văn A',
          avatar: 'https://example.com/avatar.jpg',
          role: 'owner',
          joined_at: '2025-11-12T00:00:00.000Z',
        },
        {
          id: 'user-2',
          nickname: 'Trần Thị B',
          avatar: 'https://example.com/avatar2.jpg',
          role: 'admin',
          joined_at: '2025-11-13T00:00:00.000Z',
        },
      ],
      meta: {
        item_count: 20,
        total_items: 25,
        items_per_page: 20,
        total_pages: 2,
        current_page: 1,
      },
    },
  })
  async getMembers(
    @Param('group_id') group_id: string,
    @Query('role') role?: MemberRole,
    @Query() query?: BaseQueryDto,
  ) {
    // TODO: Filter by role
    return this.groupService.getGroupMembers(group_id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Lấy member summary (total, owners, admins, members)' })
  @ApiParam({ name: 'group_id', description: 'Group ID' })
  @ApiOkResponse({
    type: MemberSummaryDto,
    description: 'Member summary',
    example: {
      total: 25,
      owners: 1,
      admins: 3,
      members: 21,
    },
  })
  async getMemberSummary(@Param('group_id') group_id: string): Promise<MemberSummaryDto> {
    return this.groupService.getMemberSummary(group_id);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm members vào group' })
  @ApiParam({ name: 'group_id', description: 'Group ID' })
  @ApiBody({ type: AddGroupMembersDto })
  @ApiCreatedResponse({
    description: 'Members added successfully',
    example: {
      message: 'Members added successfully',
      addedCount: 3,
      members: [
        {
          group_id: 'group-1',
          user_id: 'user-1',
          role: 'member',
          joined_at: '2025-11-12T00:00:00.000Z',
        },
      ],
    },
  })
  async addMembers(
    @Param('group_id') group_id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddGroupMembersDto,
  ) {
    return this.groupService.addGroupMembers(group_id, req.user.id, dto);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove member from group' })
  @ApiParam({ name: 'group_id', description: 'Group ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiOkResponse({
    description: 'Member removed successfully',
    example: {
      message: 'Member removed successfully',
    },
  })
  async removeMember(
    @Param('group_id') group_id: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.groupService.removeGroupMember(group_id, req.user.id, userId);
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'group_id', description: 'Group ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiOkResponse({
    description: 'Member role updated successfully',
    example: {
      group_id: 'group-1',
      user_id: 'user-1',
      role: 'admin',
      joined_at: '2025-11-12T00:00:00.000Z',
    },
  })
  async updateRole(
    @Param('group_id') group_id: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.groupService.updateMemberRole(group_id, req.user.id, userId, dto);
  }
}
