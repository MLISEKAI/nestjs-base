import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomSettingsService } from '../services/room-settings.service';
import { UpdateRoomSettingsDto, SetRoomModeDto, SetSeatLayoutDto, AssignSeatDto } from '../dto/room-settings.dto';

@ApiTags('Room Settings')
@Controller('rooms')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
export class RoomSettingsController {
  constructor(private readonly settingsService: RoomSettingsService) {}

  // GET /rooms/:room_id/modes
  @Get(':room_id/modes')
  async getModes(@Param('room_id') room_id: string) {
    return this.settingsService.getModes(room_id);
  }

  // POST /rooms/:room_id/set-mode
  @Post(':room_id/set-mode')
  async setMode(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: SetRoomModeDto,
  ) {
    const user_id = req.user.id;
    return this.settingsService.setMode(room_id, user_id, dto);
  }

  // GET /rooms/:room_id/seat-layouts
  @Get(':room_id/seat-layouts')
  async getSeatLayouts(@Param('room_id') room_id: string) {
    return this.settingsService.getSeatLayouts(room_id);
  }

  // POST /rooms/:room_id/set-seat-layout
  @Post(':room_id/set-seat-layout')
  async setSeatLayout(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: SetSeatLayoutDto,
  ) {
    const user_id = req.user.id;
    return this.settingsService.setSeatLayout(room_id, user_id, dto);
  }

  // GET /rooms/:room_id/seats
  @Get(':room_id/seats')
  async getSeats(@Param('room_id') room_id: string) {
    return this.settingsService.getSeats(room_id);
  }

  // POST /rooms/:room_id/seats/join
  @Post(':room_id/seats/join')
  async joinSeat(@Param('room_id') room_id: string, @Request() req: any) {
    const user_id = req.user.id;
    return this.settingsService.joinSeat(room_id, user_id);
  }

  // POST /rooms/:room_id/seats/assign
  @Post(':room_id/seats/assign')
  async assignSeat(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: AssignSeatDto,
  ) {
    const user_id = req.user.id;
    return this.settingsService.assignSeat(room_id, user_id, dto);
  }

  // POST /rooms/:room_id/seats/:seatId/lock
  @Post(':room_id/seats/:seatId/lock')
  async lockSeat(
    @Param('room_id') room_id: string,
    @Param('seatId') seatId: string,
    @Request() req: any,
  ) {
    const user_id = req.user.id;
    return this.settingsService.lockSeat(room_id, user_id, parseInt(seatId), true);
  }

  // DELETE /rooms/:room_id/seats/:seatId/lock
  @Delete(':room_id/seats/:seatId/lock')
  async unlockSeat(
    @Param('room_id') room_id: string,
    @Param('seatId') seatId: string,
    @Request() req: any,
  ) {
    const user_id = req.user.id;
    return this.settingsService.lockSeat(room_id, user_id, parseInt(seatId), false);
  }

  // POST /rooms/:room_id/seats/leave
  @Post(':room_id/seats/leave')
  async leaveSeat(@Param('room_id') room_id: string, @Request() req: any) {
    const user_id = req.user.id;
    return this.settingsService.leaveSeat(room_id, user_id);
  }

  // PATCH /rooms/:room_id/settings
  @Patch(':room_id/settings')
  async updateSettings(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body() dto: UpdateRoomSettingsDto,
  ) {
    const user_id = req.user.id;
    return this.settingsService.updateSettings(room_id, user_id, dto);
  }
}
