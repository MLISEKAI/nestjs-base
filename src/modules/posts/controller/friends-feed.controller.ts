import {
  Controller,
  Get,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FriendsFeedService } from '../service/friends-feed.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { FriendsFeedResponseDto } from '../dto/feed.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Friends Feed')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('friends')
export class FriendsFeedController {
  constructor(private readonly friendsFeedService: FriendsFeedService) {}

  @Get('feed')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy feed của bạn bè' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
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
    description: 'Danh sách posts từ bạn bè với pagination',
    type: FriendsFeedResponseDto,
  })
  getFeed(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    return this.friendsFeedService.getFeed(req.user.id, query);
  }

  @Get('feed/:posts_id')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết 1 bài viết' })
  @ApiParam({ name: 'posts_id', description: 'Posts ID' })
  @ApiOkResponse({ description: 'Chi tiết post' })
  getPost(@Param('posts_id') postsId: string, @Req() req: AuthenticatedRequest) {
    return this.friendsFeedService.getPost(postsId, req.user.id);
  }
}
