import { Controller, Get, Param, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserConnectionsService } from '../service/user-connections.service';
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('User Status')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserStatusController {
  constructor(
    private readonly connectionsService: UserConnectionsService,
    private readonly websocketGateway: WebSocketGateway,
  ) {}

  @Get(':userId/status')
  @ApiOperation({ summary: 'Lấy user status' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({
    description: 'User status',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user-123' },
        isOnline: { type: 'boolean', example: true },
        status: { type: 'string', example: 'Active' },
        lastSeen: { type: 'string', example: '2025-01-15T19:02:00Z' },
      },
    },
  })
  async getUserStatus(@Param('userId') userId: string, @Req() req: AuthenticatedRequest) {
    const isOnline = this.websocketGateway.isUserOnline(userId);

    return {
      userId,
      isOnline,
      status: isOnline ? 'Online' : 'Offline',
      lastSeen: new Date().toISOString(),
    };
  }
}
