import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomChallengeService } from '../services/room-challenge.service';

@ApiTags('Room Challenge')
@Controller('rooms')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
export class RoomChallengeController {
  constructor(private readonly challengeService: RoomChallengeService) {}

  // GET /rooms/:room_id/challenge
  @Get(':room_id/challenge')
  async getChallenge(@Param('room_id') room_id: string) {
    return this.challengeService.getChallenge(room_id);
  }

  // POST /rooms/:room_id/challenge/progress
  @Post(':room_id/challenge/progress')
  async addProgress(@Param('room_id') room_id: string, @Body('points') points: number) {
    return this.challengeService.addProgress(room_id, points);
  }

  // GET /rooms/:room_id/contributors/:period
  @Get(':room_id/contributors/:period')
  async getContributors(
    @Param('room_id') room_id: string,
    @Param('period') period: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.challengeService.getContributors(room_id, period);
  }
}
