import { Controller, Get, Post, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomMembersService } from '../services/room-members.service';

@ApiTags('Room Members')
@Controller('rooms')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
export class RoomMembersController {
  constructor(private readonly membersService: RoomMembersService) {}

  // GET /rooms/:room_id/viewers
  @Get(':room_id/viewers')
  async getViewers(
    @Param('room_id') room_id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.membersService.getViewers(
      room_id,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 50,
    );
  }

  // POST /rooms/:room_id/kick/:user_id
  @Post(':room_id/kick/:user_id')
  async kickUser(
    @Param('room_id') room_id: string,
    @Param('user_id') user_id: string,
    @Request() req: any,
  ) {
    const hostId = req.user.id;
    return this.membersService.kickUser(room_id, hostId, user_id);
  }

  // POST /rooms/:room_id/block/:user_id
  @Post(':room_id/block/:user_id')
  async blockUser(
    @Param('room_id') room_id: string,
    @Param('user_id') user_id: string,
    @Request() req: any,
  ) {
    const hostId = req.user.id;
    return this.membersService.blockUser(room_id, hostId, user_id);
  }

  // POST /rooms/:room_id/unblock/:user_id
  @Post(':room_id/unblock/:user_id')
  async unblockUser(
    @Param('room_id') room_id: string,
    @Param('user_id') user_id: string,
    @Request() req: any,
  ) {
    const hostId = req.user.id;
    return this.membersService.unblockUser(room_id, hostId, user_id);
  }

  // GET /rooms/:room_id/blacklist
  @Get(':room_id/blacklist')
  async getBlacklist(@Param('room_id') room_id: string) {
    return this.membersService.getBlacklist(room_id);
  }
}
