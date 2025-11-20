import { Controller, Get, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from '../service/search.service';
import { RecommendationService } from '../service/recommendation.service';
import { TrendingService } from '../service/trending.service';
import { SearchQueryDto, RecommendationQueryDto, TrendingQueryDto } from '../dto/search.dto';

@ApiTags('Search & Discovery')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly recommendationService: RecommendationService,
    private readonly trendingService: TrendingService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Universal search - Tìm kiếm trong tất cả loại nội dung',
    description:
      'Tìm kiếm trong users, posts, và comments. Hỗ trợ filter theo type, date range. Sử dụng PostgreSQL full-text search (có thể nâng cấp lên Elasticsearch/Meilisearch sau).',
  })
  @ApiOkResponse({
    description: 'Kết quả tìm kiếm với pagination',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            users: { type: 'array', description: 'Danh sách users (nếu type=all hoặc users)' },
            posts: { type: 'array', description: 'Danh sách posts (nếu type=all hoặc posts)' },
            comments: {
              type: 'array',
              description: 'Danh sách comments (nếu type=all hoặc comments)',
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                total_pages: { type: 'number' },
              },
            },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  async search(@Query() query: SearchQueryDto, @Req() req: any) {
    const userId = req?.user?.id;
    return this.searchService.search(query, userId);
  }

  @Get('users')
  @ApiOperation({
    summary: 'Tìm kiếm users',
    description: 'Tìm kiếm users theo nickname hoặc ID. Hỗ trợ filter theo date range.',
  })
  @ApiOkResponse({ description: 'Danh sách users với pagination' })
  async searchUsers(@Query() query: SearchQueryDto, @Req() req: any) {
    const userId = req?.user?.id;
    return this.searchService.search({ ...query, type: 'users' as any }, userId);
  }

  @Get('posts')
  @ApiOperation({
    summary: 'Tìm kiếm posts',
    description: 'Tìm kiếm posts theo content hoặc title. Hỗ trợ filter theo date range.',
  })
  @ApiOkResponse({ description: 'Danh sách posts với pagination' })
  async searchPosts(@Query() query: SearchQueryDto, @Req() req: any) {
    const userId = req?.user?.id;
    return this.searchService.search({ ...query, type: 'posts' as any }, userId);
  }

  @Get('recommendations/users')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách users được đề xuất',
    description:
      'Gợi ý users dựa trên mutual connections (bạn của bạn). Nếu không có mutual connections, sẽ trả về random active users.',
  })
  @ApiOkResponse({
    description: 'Danh sách recommended users',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nickname: { type: 'string' },
              avatar: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true },
              is_following: { type: 'boolean' },
              is_friend: { type: 'boolean' },
            },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  async getRecommendedUsers(@Req() req: any, @Query() query: RecommendationQueryDto) {
    const userId = req.user.id;
    return this.recommendationService.getRecommendedUsers(userId, query);
  }

  @Get('recommendations/posts')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách posts được đề xuất',
    description:
      'Gợi ý posts từ users mà bạn đang follow. Nếu không đủ, sẽ bổ sung bằng trending posts.',
  })
  @ApiOkResponse({ description: 'Danh sách recommended posts' })
  async getRecommendedPosts(@Req() req: any, @Query() query: RecommendationQueryDto) {
    const userId = req.user.id;
    return this.recommendationService.getRecommendedPosts(userId, query);
  }

  @Get('trending/posts')
  @ApiOperation({
    summary: 'Lấy danh sách trending posts',
    description:
      'Lấy posts trending dựa trên engagement metrics (likes, comments) trong khoảng thời gian (24h, 7d, 30d). Trending score = (likes * 2) + (comments * 3) + time_decay_factor.',
  })
  @ApiOkResponse({
    description: 'Danh sách trending posts',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              title: { type: 'string', nullable: true },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nickname: { type: 'string' },
                  avatar: { type: 'string', nullable: true },
                },
              },
              trending_score: { type: 'number' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  async getTrendingPosts(@Query() query: TrendingQueryDto) {
    return this.trendingService.getTrendingPosts(query);
  }

  @Get('trending/users')
  @ApiOperation({
    summary: 'Lấy danh sách trending users',
    description:
      'Lấy users trending dựa trên số lượng followers mới trong khoảng thời gian (24h, 7d, 30d). Trending score = số followers mới.',
  })
  @ApiOkResponse({
    description: 'Danh sách trending users',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nickname: { type: 'string' },
              avatar: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true },
              followers_count: { type: 'number' },
              new_followers: { type: 'number' },
              trending_score: { type: 'number' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  async getTrendingUsers(@Query() query: TrendingQueryDto) {
    return this.trendingService.getTrendingUsers(query);
  }
}
