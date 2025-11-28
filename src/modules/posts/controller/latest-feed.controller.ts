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
import { LatestFeedService } from '../service/latest-feed.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { LatestFeedResponseDto } from '../dto/feed.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Latest Feed')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('latest')
export class LatestFeedController {
  constructor(private readonly latestFeedService: LatestFeedService) {}

  @Get('feed')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy latest feed (all posts)' })
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
    description: 'Danh sách posts mới nhất với pagination',
    type: LatestFeedResponseDto,
  })
  getFeed(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    return this.latestFeedService.getFeed(query, req.user.id);
  }

  @Get('feed/:posts_id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 bài viết' })
  @ApiParam({ name: 'posts_id', description: 'Posts ID' })
  @ApiOkResponse({ description: 'Chi tiết post' })
  getPost(@Param('posts_id') postsId: string, @Req() req?: AuthenticatedRequest) {
    const user_id = req?.user?.id;
    return this.latestFeedService.getPost(postsId, user_id);
  }
}
