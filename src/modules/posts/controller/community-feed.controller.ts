import { Controller, Get, Query, UseGuards, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { FeedService } from '../service/feed.service';
import { CommunityFeedResponseDto } from '../dto/feed.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Community Feed')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('community')
export class CommunityFeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy community feed với hot topics' })
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
  @ApiOkResponse({
    description: 'Community feed với hot topics và posts',
    type: CommunityFeedResponseDto,
  })
  getCommunityFeed(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    return this.feedService.getCommunityFeed(req.user.id, query);
  }
}
