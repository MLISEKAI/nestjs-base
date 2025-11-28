import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomBoostService } from '../services/room-boost.service';

@ApiTags('Room Boost')
@Controller('rooms')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
export class RoomBoostController {
  constructor(private readonly boostService: RoomBoostService) {}

  // GET /rooms/:room_id/boost/items
  @Get(':room_id/boost/items')
  async getBoostItems(@Param('room_id') room_id: string, @Request() req: any) {
    const user_id = req.user.id;
    return this.boostService.getBoostItems(room_id, user_id);
  }

  // GET /rooms/:room_id/boost/super-packages
  @Get(':room_id/boost/super-packages')
  async getSuperPackages() {
    return this.boostService.getSuperPackages();
  }

  // POST /rooms/:room_id/boost/use-item
  @Post(':room_id/boost/use-item')
  async useBoostItem(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body('item_id') itemId: string,
  ) {
    const user_id = req.user.id;
    return this.boostService.useBoostItem(room_id, user_id, itemId);
  }

  // POST /rooms/:room_id/boost/purchase
  @Post(':room_id/boost/purchase')
  async purchaseBoost(
    @Param('room_id') room_id: string,
    @Request() req: any,
    @Body('package_id') packageId: string,
  ) {
    const user_id = req.user.id;
    return this.boostService.purchaseBoost(room_id, user_id, packageId);
  }

  // GET /rooms/:room_id/boost/history
  @Get(':room_id/boost/history')
  async getBoostHistory(@Param('room_id') room_id: string) {
    return this.boostService.getBoostHistory(room_id);
  }
}
