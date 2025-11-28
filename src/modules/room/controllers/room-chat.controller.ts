import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoomChatService } from '../services/room-chat.service';
import { SendMessageDto, SendGiftDto } from '../dto/room-message.dto';

@ApiTags('Room Chat & Messages')
@Controller('rooms')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
export class RoomChatController {
  constructor(private readonly chatService: RoomChatService) {}

  // GET /rooms/:room_id/messages - Lấy tin nhắn
  @Get(':room_id/messages')
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn', description: 'Lấy tin nhắn trong phòng với phân trang cursor-based' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiQuery({ name: 'cursor', required: false, example: '12345', description: 'Cursor để phân trang' })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Số tin nhắn mỗi trang' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tin nhắn',
    schema: {
      example: [
        {
          id: 'm1',
          type: 'system',
          text: 'Welcome to Darlene Bears\' live streaming room!',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'm3',
          type: 'text',
          user: { id: 'u001', name: 'Gustavo', avatar: 'url' },
          content: 'Hello everyone!',
          created_at: '2025-01-01T10:01:00Z',
        },
      ],
    },
  })
  async getMessages(
    @Param('room_id') room_id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(room_id, cursor, limit ? parseInt(limit) : 50);
  }

  // POST /rooms/:room_id/messages - Gửi tin nhắn
  @Post(':room_id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn', description: 'Gửi icon hoặc gift trong phòng (chỉ cho phép icon và gift)' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Tin nhắn đã gửi',
    schema: {
      example: {
        messageId: 'm789',
        room_id: 'r987',
        user_id: 'u123',
        username: 'John Doe',
        content: 'Hello everyone!',
        type: 'text',
        timestamp: '2024-11-28T19:05:00Z',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Không có quyền gửi tin nhắn' })
  async sendMessage(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: SendMessageDto,
  ) {
    const user_id = req.user.id;
    return this.chatService.sendMessage(room_id, user_id, dto);
  }

  // POST /rooms/:room_id/gifts - Gửi quà
  @Post(':room_id/gifts')
  @ApiOperation({ summary: 'Gửi quà tặng', description: 'Gửi quà cho user trong phòng' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiBody({ type: SendGiftDto })
  @ApiResponse({
    status: 201,
    description: 'Quà đã gửi',
    schema: {
      example: {
        gift_id: 'gift_id',
        quantity: 10,
        totalCost: 1000,
        sender: { user_id: 'u123' },
        recipient: { user_id: 'u789' },
        timestamp: '2024-11-28T19:06:00Z',
      },
    },
  })
  @ApiResponse({ status: 402, description: 'Không đủ số dư' })
  async sendGift(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: SendGiftDto,
  ) {
    const user_id = req.user.id;
    return this.chatService.sendGift(room_id, user_id, dto);
  }

  // GET /rooms/:room_id/stats - Thống kê phòng
  @Get(':room_id/stats')
  @ApiOperation({ summary: 'Thống kê phòng', description: 'Lấy thống kê tổng quà, người xem, điểm' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        totalGifts: 120,
        totalViewers: 110,
        totalPoints: 5000,
      },
    },
  })
  async getRoomStats(@Param('room_id') room_id: string) {
    return this.chatService.getRoomStats(room_id);
  }

  // GET /rooms/:room_id/speakers - Danh sách speakers
  @Get(':room_id/speakers')
  @ApiOperation({ summary: 'Danh sách speakers', description: 'Lấy danh sách người đang có mic (host + speakers)' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          user_id: 'u123',
          username: 'Darlene',
          avatar: 'url',
          isMuted: false,
          isCameraOn: true,
          role: 'host',
        },
      ],
    },
  })
  async getSpeakers(@Param('room_id') room_id: string) {
    return this.chatService.getSpeakers(room_id);
  }

  // GET /rooms/:room_id/listeners - Danh sách listeners
  @Get(':room_id/listeners')
  @ApiOperation({ summary: 'Danh sách listeners', description: 'Lấy danh sách người chỉ nghe' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          user_id: 'u456',
          username: 'John',
          avatar: 'url',
        },
      ],
    },
  })
  async getListeners(@Param('room_id') room_id: string) {
    return this.chatService.getListeners(room_id);
  }

  // POST /rooms/:room_id/system-messages - Gửi system message (admin only)
  @Post(':room_id/system-messages')
  @ApiOperation({ summary: 'Gửi system message', description: 'Admin gửi thông báo hệ thống (admin only)' })
  @ApiParam({ name: 'room_id', example: 'r987' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'Welcome to the room!' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        id: 'm1',
        type: 'system',
        text: 'Welcome to the room!',
        created_at: '2025-01-01T10:00:00Z',
      },
    },
  })
  async sendSystemMessage(
    @Param('room_id') room_id: string,
    @Body('text') text: string,
  ) {
    return this.chatService.sendSystemMessage(room_id, text);
  }
}
