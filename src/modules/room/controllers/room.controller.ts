import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoomService } from '../services/room.service';
import { CreateRoomDto, SetPasswordDto, VerifyPasswordDto, JoinRoomDto } from '../dto/create-room.dto';

@ApiTags('Rooms')
@Controller('rooms')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // POST /rooms - Tạo phòng mới
  @Post()
  @ApiOperation({
    summary: 'Tạo phòng mới',
    description: 'Tạo một phòng chat/voice mới với các cấu hình như mode, labels, password protection',
  })
  @ApiBody({
    type: CreateRoomDto,
    examples: {
      'Công khai': {
        value: {
          title: 'From Hani With Love',
          mode: 'party',
          labels: ['Giải trí', 'Trò chuyện'],
          is_protected: false,
          maxParticipants: 10,
        },
      },
      'Phòng có mật khẩu': {
        value: {
          title: 'Hani Private Party',
          mode: 'auction',
          labels: ['Kết bạn', 'Âm nhạc'],
          is_protected: true,
          password: 'hani123',
          maxParticipants: 8,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Phòng được tạo thành công',
    schema: {
      example: {
        success: true,
        data: {
          room_id: 'r987',
          title: 'From Hani With Love',
          mode: 'party',
          labels: ['Giải trí', 'Trò chuyện'],
          is_protected: false,
          password_set: false,
          status: 'created',
          host: {
            id: 'u123',
            name: 'Darlene Bears',
            avatar: 'https://cdn/avatar.png',
            badges: ['xác_thực', 'idol'],
          },
          maxParticipants: 10,
          currentParticipants: 1,
          createdAt: '2024-11-28T19:02:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async createRoom(@Request() req: any, @Body() dto: CreateRoomDto) {
    const user_id = req.user.id;
    return this.roomService.createRoom(user_id, dto);
  }

  // POST /rooms/:room_id/password - Đặt mật khẩu phòng
  @Post(':room_id/password')
  @ApiOperation({ summary: 'Đặt mật khẩu phòng', description: 'Host đặt mật khẩu 4 số cho phòng' })
  @ApiParam({ name: 'room_id', example: 'r987', description: 'ID phòng' })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Đặt mật khẩu thành công',
    schema: {
      example: {
        room_id: 'r987',
        is_protected: true,
        password_set: true,
        status: 'active',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Chỉ host mới có quyền đặt mật khẩu' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng' })
  async setPassword(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: SetPasswordDto,
  ) {
    const user_id = req.user.id;
    return this.roomService.setPassword(room_id, user_id, dto);
  }

  // POST /rooms/:room_id/verify-password - Xác thực mật khẩu
  @Post(':room_id/verify-password')
  @ApiOperation({ summary: 'Xác thực mật khẩu', description: 'Kiểm tra mật khẩu phòng trước khi join' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiBody({ type: VerifyPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công',
    schema: {
      example: {
        verified: true,
        accessToken: 'room_access_token_xyz',
        expiresAt: '2024-11-28T23:02:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Sai mật khẩu' })
  async verifyPassword(
    @Param('room_id') room_id: string,
    @Body() dto: VerifyPasswordDto,
  ) {
    return this.roomService.verifyPassword(room_id, dto);
  }

  // POST /rooms/:room_id/join - Tham gia phòng
  @Post(':room_id/join')
  @ApiOperation({ summary: 'Tham gia phòng', description: 'User join vào phòng, nhận WebRTC token và WebSocket URLs' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiBody({ type: JoinRoomDto })
  @ApiResponse({
    status: 200,
    description: 'Join thành công',
    schema: {
      example: {
        room_id: 'r987',
        join_status: 'success',
        slot_assigned: 3,
        participantId: 'participant_456',
        isMuted: false,
        isCameraOn: false,
        webRtcToken: 'webrtc_token_xyz',
        chatWebSocketUrl: 'wss://chat.example.com/rooms/r987',
        voiceWebSocketUrl: 'wss://voice.example.com/rooms/r987',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Phòng đầy hoặc bị ban' })
  async joinRoom(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: JoinRoomDto,
  ) {
    const user_id = req.user.id;
    return this.roomService.joinRoom(room_id, user_id, dto);
  }

  // GET /rooms/:room_id - Lấy thông tin phòng
  @Get(':room_id')
  @ApiOperation({ summary: 'Lấy thông tin phòng', description: 'Lấy chi tiết phòng bao gồm host, slots, members' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin phòng',
    schema: {
      example: {
        room_id: 'r987',
        title: 'From Hani With Love',
        mode: 'party',
        labels: ['giải trí'],
        is_protected: true,
        host: {
          id: 'u123',
          name: 'Darlene Bears',
          avatar: 'https://cdn/avatar.png',
        },
        members_count: 5,
        maxParticipants: 10,
        status: 'active',
        slots: [
          { slot: 1, user: { id: 'u123', name: 'Darlene', avatar: 'url' }, locked: false },
          { slot: 2, user: null, locked: false },
        ],
        createdAt: '2024-11-28T19:00:00Z',
      },
    },
  })
  async getRoomInfo(@Param('room_id') room_id: string) {
    return this.roomService.getRoomInfo(room_id);
  }

  // POST /rooms/:room_id/leave - Rời phòng
  @Post(':room_id/leave')
  @ApiOperation({ summary: 'Rời phòng', description: 'User rời khỏi phòng' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message: 'left_room',
        room_id: 'r987',
        user_id: 'u123',
      },
    },
  })
  async leaveRoom(@Param('room_id') room_id: string, @Request() req: any) {
    const user_id = req.user.id;
    return this.roomService.leaveRoom(room_id, user_id);
  }

  // POST /rooms/:room_id/close - Đóng phòng
  @Post(':room_id/close')
  @ApiOperation({ summary: 'Đóng phòng', description: 'Host đóng phòng (chỉ host)' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiResponse({ status: 200, description: 'Đóng phòng thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ host mới có quyền đóng phòng' })
  async closeRoom(@Param('room_id') room_id: string, @Request() req: any) {
    const user_id = req.user.id;
    return this.roomService.closeRoom(room_id, user_id);
  }

  // GET /rooms - Lấy danh sách phòng
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phòng', description: 'Lấy danh sách phòng với filter theo tab/mode' })
  @ApiQuery({ name: 'tab', required: false, example: 'all', description: 'Tab: all (phòng công khai), my_rooms (phòng của tôi), follow (người follow), friends (bạn bè)' })
  @ApiQuery({ name: 'mode', required: false, example: 'party', description: 'Mode: game, party, auction, make_friends' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Số phòng mỗi trang' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phòng',
    schema: {
      example: {
        rooms: [
          {
            room_id: 'r001',
            title: 'Heloo ae',
            mode: 'game',
            host: { id: 'u456', name: 'Livia', avatar: 'url' },
            viewer_count: 8,
            status: 'active',
            has_password: false,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 156,
          hasMore: true,
        },
      },
    },
  })
  async getRooms(
    @Request() req: any,
    @Query('tab') tab?: string,
    @Query('mode') mode?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user_id = req.user?.id;
    return this.roomService.getRooms({
      tab,
      mode,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      user_id,
    });
  }
}
