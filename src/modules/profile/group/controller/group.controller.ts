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
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { GroupService } from '../service/group.service';
import { CreateGroupDto, UpdateGroupDto, SendGroupMessageDto } from '../dto/group.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

@ApiTags('Groups')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách public groups' })
  @ApiOkResponse({ description: 'Danh sách groups với pagination' })
  getGroups(@Query() query?: BaseQueryDto) {
    return this.groupService.getGroups(query);
  }

  @Get(':group_id')
  @ApiOperation({ summary: 'Lấy thông tin group' })
  @ApiOkResponse({ description: 'Thông tin group' })
  getGroup(@Param('group_id') groupId: string) {
    return this.groupService.getGroup(groupId);
  }

  @Get('user/:user_id')
  @ApiOperation({ summary: 'Lấy danh sách groups của user' })
  @ApiOkResponse({ description: 'Danh sách groups user tham gia' })
  getUserGroups(@Param('user_id') userId: string, @Query() query?: BaseQueryDto) {
    return this.groupService.getUserGroups(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo group mới' })
  @ApiBody({ type: CreateGroupDto })
  @ApiCreatedResponse({ description: 'Group đã được tạo' })
  createGroup(@Param('user_id') userId: string, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(userId, dto);
  }

  @Patch(':group_id')
  @ApiOperation({ summary: 'Cập nhật group' })
  @ApiBody({ type: UpdateGroupDto })
  @ApiOkResponse({ description: 'Group đã được cập nhật' })
  updateGroup(
    @Param('user_id') userId: string,
    @Param('group_id') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(userId, groupId, dto);
  }

  @Delete(':group_id')
  @ApiOperation({ summary: 'Xóa group' })
  @ApiOkResponse({ description: 'Group đã được xóa' })
  deleteGroup(@Param('user_id') userId: string, @Param('group_id') groupId: string) {
    return this.groupService.deleteGroup(userId, groupId);
  }

  @Post(':group_id/join')
  @ApiOperation({ summary: 'Tham gia group' })
  @ApiOkResponse({ description: 'Đã tham gia group' })
  joinGroup(@Param('user_id') userId: string, @Param('group_id') groupId: string) {
    return this.groupService.joinGroup(userId, groupId);
  }

  @Delete(':group_id/leave')
  @ApiOperation({ summary: 'Rời group' })
  @ApiOkResponse({ description: 'Đã rời group' })
  leaveGroup(@Param('user_id') userId: string, @Param('group_id') groupId: string) {
    return this.groupService.leaveGroup(userId, groupId);
  }

  @Get(':group_id/members')
  @ApiOperation({ summary: 'Lấy danh sách members của group' })
  @ApiOkResponse({ description: 'Danh sách members với pagination' })
  getGroupMembers(@Param('group_id') groupId: string, @Query() query?: BaseQueryDto) {
    return this.groupService.getGroupMembers(groupId, query);
  }

  @Post(':group_id/messages')
  @ApiOperation({ summary: 'Gửi message trong group' })
  @ApiBody({ type: SendGroupMessageDto })
  @ApiCreatedResponse({ description: 'Message đã được gửi' })
  sendGroupMessage(
    @Param('user_id') userId: string,
    @Param('group_id') groupId: string,
    @Body() dto: SendGroupMessageDto,
  ) {
    return this.groupService.sendGroupMessage(userId, groupId, dto);
  }

  @Get(':group_id/messages')
  @ApiOperation({ summary: 'Lấy danh sách messages của group' })
  @ApiOkResponse({ description: 'Danh sách messages với pagination' })
  getGroupMessages(@Param('group_id') groupId: string, @Query() query?: BaseQueryDto) {
    return this.groupService.getGroupMessages(groupId, query);
  }
}
