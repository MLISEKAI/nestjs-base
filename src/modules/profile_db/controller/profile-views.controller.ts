import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfileViewsServiceDb } from '../profile-views_db/profile-views_db.service';

@ApiTags('ProfileViews')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/views')
export class ProfileViewsController {
  constructor(private readonly views: ProfileViewsServiceDb) {}

  @Post()
  @ApiOperation({ summary: 'Ghi log lượt xem hồ sơ' })
  logView(@Param('user_id') targetUserId: string, @Body('viewer_id') viewerId: string) {
    return this.views.logProfileView(targetUserId, viewerId);
  }

  @Get('last')
  @ApiOperation({ summary: 'Lần xem cuối cùng' })
  getLast(@Param('user_id') targetUserId: string, @Query('viewer_id') viewerId: string) {
    return this.views.getLastView(targetUserId, viewerId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách lượt xem' })
  getViews(@Param('user_id') userId: string, @Query('full') full?: string) {
    return this.views.getProfileViews(userId, full === 'true');
  }
}
