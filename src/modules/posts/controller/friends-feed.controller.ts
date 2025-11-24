import { Controller, Get, Query, UseGuards, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { FeedService } from '../service/feed.service';
import { FeedResponseDto } from '../dto/feed.dto';

@ApiTags('Friends Feed')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('friends')
export class FriendsFeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('feed')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách bài viết từ bạn bè' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 0)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 50)',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    type: String,
    description: 'Timestamp for pull-to-refresh',
  })
  @ApiOkResponse({
    description: 'Danh sách posts từ friends với pagination',
    type: FeedResponseDto,
  })
  getFeed(@Req() req: any, @Query() query?: BaseQueryDto & { since?: string }) {
    return this.feedService.getFriendsFeed(req.user.id, query);
  }
}
