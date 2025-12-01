import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '../../../../common/interceptors/cache.interceptor';
import { CacheResult } from '../../../../common/decorators/cache-result.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BlockUserService } from '../service/block-user.service';
import { BlockUserDto } from '../dto/block-user.dto';
import type { AuthenticatedRequest } from '../../../../common/interfaces/request.interface';

@ApiTags('Block User')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('block')
export class BlockUserController {
  constructor(private readonly blockUserService: BlockUserService) {}

  @Post()
  @ApiOperation({ summary: 'Chặn người dùng' })
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
  blockUser(@Body() dto: BlockUserDto, @Req() req: AuthenticatedRequest) {
    return this.blockUserService.blockUser(req.user.id, dto.blocked_id);
  }

  @Delete(':blocked_id')
  @ApiOperation({ summary: 'Bỏ chặn người dùng' })
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
  unblockUser(@Param('blocked_id') blockedId: string, @Req() req: AuthenticatedRequest) {
    return this.blockUserService.unblockUser(req.user.id, blockedId);
  }

  @Get('blocked')
  @UseInterceptors(CacheInterceptor)
  @CacheResult(300) // Cache 5 phút
  @ApiOperation({ summary: 'Lấy danh sách người dùng đã chặn' })
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
  getBlockedUsers(@Req() req: AuthenticatedRequest) {
    return this.blockUserService.getBlockedUsers(req.user.id);
  }

  @Get('blocked-by')
  @UseInterceptors(CacheInterceptor)
  @CacheResult(300) // Cache 5 phút
  @ApiOperation({ summary: 'Lấy danh sách người dùng đã chặn mình' })
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
  getBlockedByUsers(@Req() req: AuthenticatedRequest) {
    return this.blockUserService.getBlockedByUsers(req.user.id);
  }
}
