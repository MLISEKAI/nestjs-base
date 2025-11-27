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
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GroupService } from '../service/group.service';
import {
  CreateGroupDto,
  SendGroupMessageDto,
  GroupDto,
  GroupListResponseDto,
  GroupMemberListResponseDto,
  GroupMessageListResponseDto,
  GroupMemberQueryDto,
} from '../dto/group.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Groups')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get('classifications')
  @ApiOperation({ summary: 'Lấy danh sách group classifications' })
  @ApiOkResponse({
    description: 'Danh sách classifications',
    example: [
      { value: 'games', label: 'Trò chơi' },
      { value: 'making_friends', label: 'Kết bạn' },
      { value: 'enjoyment', label: 'Giải trí' },
      { value: 'entertainment', label: 'Showbiz' },
      { value: 'learning', label: 'Học tập' },
      { value: 'networking', label: 'Kết nối' },
      { value: 'others', label: 'Khác' },
    ],
  })
  getClassifications() {
    return this.groupService.getClassifications();
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách nhóm công khai',
    description:
      'Trả về danh sách tất cả các nhóm công khai (is_public = true) mà mọi người có thể tìm thấy và tham gia, có phân trang',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng nhóm mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    type: GroupListResponseDto,
    description: 'Danh sách nhóm công khai với thông tin chi tiết và phân trang',
    example: {
      items: [
        {
          id: 'group-1',
          name: 'Nhóm bạn thân',
          description: 'Nhóm dành cho những người bạn thân thiết',
          avatar: 'https://example.com/avatar.jpg',
          is_public: true,
          created_by: 'user-1',
          created_at: '2025-11-12T00:00:00.000Z',
          updated_at: '2025-11-12T00:00:00.000Z',
          members_count: 25,
        },
      ],
      meta: {
        item_count: 20,
        total_items: 150,
        items_per_page: 20,
        total_pages: 8,
        current_page: 1,
      },
    },
  })
  getGroups(@Query() query?: BaseQueryDto) {
    return this.groupService.getGroups(query);
  }

  @Get(':group_id')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết nhóm',
    description:
      'Trả về thông tin đầy đủ về một nhóm cụ thể bao gồm: tên, mô tả, avatar, số thành viên, người tạo, v.v.',
  })
  @ApiOkResponse({
    type: GroupDto,
    description: 'Thông tin chi tiết nhóm bao gồm tất cả các thuộc tính',
    example: {
      id: 'group-1',
      name: 'Nhóm bạn thân',
      description: 'Nhóm dành cho những người bạn thân thiết',
      avatar: 'https://example.com/avatar.jpg',
      is_public: true,
      created_by: 'user-1',
      created_at: '2025-11-12T00:00:00.000Z',
      updated_at: '2025-11-12T00:00:00.000Z',
      members_count: 25,
      classification: 'making_friends',
      introduction: 'Chào mừng đến với nhóm của chúng tôi!',
    },
  })
  getGroup(@Param('group_id') group_id: string) {
    return this.groupService.getGroup(group_id);
  }

  @Get('me')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách nhóm của người dùng hiện tại',
    description:
      'Trả về danh sách tất cả các nhóm mà người dùng hiện tại (từ JWT token) đang tham gia, có phân trang. Tự động lấy user_id từ JWT, không cần gửi trong request',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng nhóm mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    type: GroupListResponseDto,
    description: 'Danh sách nhóm mà người dùng đang tham gia với phân trang',
    example: {
      items: [
        {
          id: 'group-1',
          name: 'Nhóm bạn thân',
          description: 'Nhóm dành cho những người bạn thân thiết',
          avatar: 'https://example.com/avatar.jpg',
          is_public: true,
          created_by: 'user-1',
          created_at: '2025-11-12T00:00:00.000Z',
          updated_at: '2025-11-12T00:00:00.000Z',
          members_count: 25,
          role: 'owner',
          joined_at: '2025-11-12T00:00:00.000Z',
        },
      ],
      meta: {
        item_count: 20,
        total_items: 5,
        items_per_page: 20,
        total_pages: 1,
        current_page: 1,
      },
    },
  })
  getMyGroups(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    return this.groupService.getUserGroups(req.user.id, query);
  }

  @Get('user/:user_id')
  @ApiOperation({
    summary: '[PUBLIC] Lấy danh sách nhóm của người dùng khác (public endpoint)',
    description:
      'Trả về danh sách các nhóm công khai mà một người dùng cụ thể đang tham gia. Endpoint này là public, không cần authentication. Để lấy nhóm của chính mình, dùng GET /groups/me',
  })
  @ApiParam({ name: 'user_id', description: 'ID của người dùng muốn xem nhóm' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng nhóm mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    type: GroupListResponseDto,
    description: 'Danh sách nhóm công khai mà người dùng đang tham gia',
  })
  getUserGroups(@Param('user_id') userId: string, @Query() query?: BaseQueryDto) {
    return this.groupService.getUserGroups(userId, query);
  }

  @Post()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo nhóm mới',
    description:
      'Tạo một nhóm mới. Người tạo sẽ tự động trở thành owner (chủ sở hữu) của nhóm và được thêm vào nhóm với vai trò owner',
  })
  @ApiBody({ type: CreateGroupDto })
  @ApiCreatedResponse({
    type: GroupDto,
    description: 'Nhóm đã được tạo thành công và trả về thông tin nhóm vừa tạo',
    example: {
      id: 'group-1',
      name: 'Nhóm bạn thân',
      description: 'Nhóm dành cho những người bạn thân thiết',
      avatar: 'https://example.com/avatar.jpg',
      is_public: false,
      created_by: 'user-1',
      created_at: '2025-11-12T00:00:00.000Z',
      updated_at: '2025-11-12T00:00:00.000Z',
      members_count: 1,
    },
  })
  createGroup(@Req() req: AuthenticatedRequest, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(req.user.id, dto);
  }

  @Delete(':group_id')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa nhóm',
    description:
      'Xóa nhóm vĩnh viễn. Chỉ admin/owner mới có quyền xóa. Tất cả thành viên và tin nhắn sẽ bị xóa theo',
  })
  @ApiOkResponse({
    description: 'Nhóm đã được xóa thành công',
    example: {
      message: 'Group deleted',
    },
  })
  deleteGroup(@Param('group_id') group_id: string, @Req() req: AuthenticatedRequest) {
    return this.groupService.deleteGroup(req.user.id, group_id);
  }

  @Post(':group_id/join')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tham gia nhóm',
    description:
      'Tham gia một nhóm. Nếu đã từng tham gia và rời nhóm trước đó, sẽ tự động tham gia lại. Người tham gia sẽ có vai trò "member"',
  })
  @ApiOkResponse({
    description: 'Đã tham gia nhóm thành công và trả về thông tin membership',
  })
  joinGroup(@Param('group_id') group_id: string, @Req() req: AuthenticatedRequest) {
    return this.groupService.joinGroup(req.user.id, group_id);
  }

  @Delete(':group_id/leave')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Rời nhóm',
    description:
      'Rời khỏi nhóm. Bạn sẽ không còn nhận thông báo và không thể gửi tin nhắn trong nhóm nữa. Có thể tham gia lại sau',
  })
  @ApiOkResponse({
    description: 'Đã rời nhóm thành công',
    example: {
      message: 'Left group successfully',
    },
  })
  leaveGroup(@Param('group_id') group_id: string, @Req() req: AuthenticatedRequest) {
    return this.groupService.leaveGroup(req.user.id, group_id);
  }

  @Get(':group_id/members')
  @ApiOperation({
    summary: 'Lấy danh sách thành viên nhóm',
    description:
      'Trả về danh sách tất cả thành viên đang hoạt động trong nhóm (không bao gồm người đã rời), có phân trang. Sắp xếp theo vai trò (owner, admin, member)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng thành viên mỗi trang (mặc định: 20)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: MemberRole,
    description: 'Lọc theo vai trò thành viên',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Từ khóa tìm kiếm theo nickname',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sắp xếp: field:asc hoặc field:desc',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    type: String,
    description: 'Chỉ trả về thành viên join sau thời điểm này',
  })
  @ApiOkResponse({
    type: GroupMemberListResponseDto,
    description: 'Danh sách thành viên nhóm với thông tin người dùng và phân trang',
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
  getGroupMembers(@Param('group_id') group_id: string, @Query() query?: GroupMemberQueryDto) {
    return this.groupService.getGroupMembers(group_id, query);
  }

  @Post(':group_id/messages')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Gửi tin nhắn trong nhóm',
    description:
      'Gửi tin nhắn văn bản vào nhóm. Chỉ thành viên đang hoạt động (chưa rời nhóm) mới có thể gửi tin nhắn',
  })
  @ApiBody({ type: SendGroupMessageDto })
  @ApiCreatedResponse({
    description: 'Tin nhắn đã được gửi thành công và trả về thông tin tin nhắn vừa gửi',
    example: {
      id: 'message-1',
      group_id: 'group-1',
      user_id: 'user-1',
      content: 'Xin chào mọi người! Hôm nay có ai rảnh không?',
      created_at: '2025-11-12T10:00:00.000Z',
      user: {
        id: 'user-1',
        nickname: 'Nguyễn Văn A',
        avatar: 'https://example.com/avatar.jpg',
      },
    },
  })
  sendGroupMessage(
    @Param('group_id') group_id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendGroupMessageDto,
  ) {
    return this.groupService.sendGroupMessage(req.user.id, group_id, dto);
  }

  @Get(':group_id/messages')
  @ApiOperation({
    summary: 'Lấy danh sách tin nhắn trong nhóm',
    description:
      'Trả về danh sách tin nhắn đã được gửi trong nhóm, có phân trang. Tin nhắn được sắp xếp theo thời gian (mới nhất trước)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng tin nhắn mỗi trang (mặc định: 50)',
  })
  @ApiOkResponse({
    type: GroupMessageListResponseDto,
    description: 'Danh sách tin nhắn trong nhóm với thông tin người gửi và phân trang',
    example: {
      items: [
        {
          id: 'message-1',
          group_id: 'group-1',
          user_id: 'user-1',
          content: 'Xin chào mọi người!',
          created_at: '2025-11-12T10:00:00.000Z',
          user: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
        },
        {
          id: 'message-2',
          group_id: 'group-1',
          user_id: 'user-2',
          content: 'Chào bạn!',
          created_at: '2025-11-12T10:05:00.000Z',
          user: {
            id: 'user-2',
            nickname: 'Trần Thị B',
            avatar: 'https://example.com/avatar2.jpg',
          },
        },
      ],
      meta: {
        item_count: 50,
        total_items: 200,
        items_per_page: 50,
        total_pages: 4,
        current_page: 1,
      },
    },
  })
  getGroupMessages(@Param('group_id') group_id: string, @Query() query?: BaseQueryDto) {
    return this.groupService.getGroupMessages(group_id, query);
  }
}
import { MemberRole } from '../../../common/enums';
