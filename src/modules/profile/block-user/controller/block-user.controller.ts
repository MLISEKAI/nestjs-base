import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { BlockUserService } from '../service/block-user.service';
import { BlockUserDto } from '../dto/block-user.dto';

@ApiTags('Block User')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/block')
export class BlockUserController {
  constructor(private readonly blockUserService: BlockUserService) {}

  @Post()
  @ApiOperation({ summary: 'Chặn người dùng' })
  @ApiParam({ name: 'user_id', description: 'ID của user chặn người khác', type: String })
  @ApiBody({ type: BlockUserDto })
  @ApiCreatedResponse({
    description: 'Chặn user thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User blocked successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'block-123' },
            blocker_id: { type: 'string', example: 'user-1' },
            blocked_id: { type: 'string', example: 'user-123' },
            created_at: { type: 'string', example: '2025-11-19T00:00:00.000Z' },
            blocked: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nickname: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  blockUser(@Param('user_id') userId: string, @Body() dto: BlockUserDto) {
    return this.blockUserService.blockUser(userId, dto.blocked_id);
  }

  @Delete(':blocked_id')
  @ApiOperation({ summary: 'Bỏ chặn người dùng' })
  @ApiParam({ name: 'user_id', description: 'ID của user đang bỏ chặn', type: String })
  @ApiParam({ name: 'blocked_id', description: 'ID của user bị chặn', type: String })
  @ApiOkResponse({
    description: 'Bỏ chặn user thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User unblocked successfully' },
      },
    },
  })
  unblockUser(@Param('user_id') userId: string, @Param('blocked_id') blockedId: string) {
    return this.blockUserService.unblockUser(userId, blockedId);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Lấy danh sách người dùng đã chặn' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiOkResponse({
    description: 'Danh sách users đã bị chặn',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'block-123' },
          blocked_at: { type: 'string', example: '2025-11-19T00:00:00.000Z' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nickname: { type: 'string' },
              avatar: { type: 'string' },
              bio: { type: 'string' },
              gender: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getBlockedUsers(@Param('user_id') userId: string) {
    return this.blockUserService.getBlockedUsers(userId);
  }

  @Get('blocked-by')
  @ApiOperation({ summary: 'Lấy danh sách người dùng đã chặn mình' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiOkResponse({
    description: 'Danh sách users đã chặn mình',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'block-123' },
          blocked_at: { type: 'string', example: '2025-11-19T00:00:00.000Z' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nickname: { type: 'string' },
              avatar: { type: 'string' },
              bio: { type: 'string' },
              gender: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getBlockedByUsers(@Param('user_id') userId: string) {
    return this.blockUserService.getBlockedByUsers(userId);
  }
}
