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
import { CommunityFeedService } from '../service/community-feed.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { CommunityFeedResponseDto } from '../dto/feed.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Community Feed')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('community')
export class CommunityFeedController {
  constructor(private readonly communityFeedService: CommunityFeedService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách chủ đề/hashtag (Hot Topic)' })
  @ApiOkResponse({ description: 'Danh sách categories với số bài viết' })
  getCategories() {
    return this.communityFeedService.getCategories();
  }

  @Get('categories/:hashtag_id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 chủ đề' })
  @ApiParam({
    name: 'hashtag_id',
    description:
      'Hashtag ID (UUID) - ID của hashtag/chủ đề muốn xem chi tiết. Lấy từ danh sách categories hoặc từ response của các API khác.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiOkResponse({ description: 'Chi tiết category' })
  getCategory(@Param('hashtag_id') hashtagId: string) {
    return this.communityFeedService.getCategory(hashtagId);
  }

  @Get()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy community feed (public posts)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    description: 'Community feed với danh sách public posts',
    type: CommunityFeedResponseDto,
  })
  getCommunityFeed(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    return this.communityFeedService.getCommunityFeed(req.user.id, query);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Lấy danh sách bài viết theo chủ đề' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Lọc theo category ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'nocache',
    required: false,
    type: String,
    description: 'Bypass cache (set to "true" or "1" to refresh data)',
  })
  @ApiOkResponse({ description: 'Danh sách posts với pagination' })
  getPosts(
    @Query('categoryId') categoryId?: string,
    @Query() query?: BaseQueryDto & { nocache?: string },
    @Req() req?: AuthenticatedRequest,
  ) {
    const userId = req?.user?.id;
    return this.communityFeedService.getPosts(categoryId, query, userId);
  }

  @Get('posts/:posts_id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 bài viết' })
  @ApiParam({ name: 'posts_id', description: 'Posts ID' })
  @ApiOkResponse({ description: 'Chi tiết post' })
  getPost(@Param('posts_id') postsId: string, @Req() req?: AuthenticatedRequest) {
    const userId = req?.user?.id;
    return this.communityFeedService.getPost(postsId, userId);
  }
}
