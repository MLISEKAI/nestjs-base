// Import các decorator và class từ NestJS để tạo controller
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import HashtagService để xử lý business logic
import { HashtagService } from '../service/hashtag.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateHashtagDto, AttachHashtagsDto } from '../dto/hashtag.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import interface để type-check request có user authenticated
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * @ApiTags('Hashtags') - Nhóm các endpoints này trong Swagger UI với tag "Hashtags"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @Controller('hashtags') - Định nghĩa base route là /hashtags
 * HashtagController - Controller xử lý các HTTP requests liên quan đến hashtags
 *
 * Chức năng chính:
 * - Lấy trending hashtags (public)
 * - Tìm kiếm hashtags (public)
 * - Lấy chi tiết hashtag (public, optional auth)
 * - Lấy posts theo hashtag với pagination (public, optional auth)
 * - Tạo hashtag mới (cần auth)
 * - Follow/unfollow hashtags (cần auth)
 * - Attach/detach hashtags vào/khỏi posts (cần auth)
 *
 * Lưu ý:
 * - Một số endpoints public, một số cần authentication
 * - Hashtag name không có dấu # (chỉ lưu tên)
 */
@ApiTags('Hashtags')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('hashtags')
export class HashtagController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject HashtagService khi tạo instance của controller
   */
  constructor(private readonly hashtagService: HashtagService) {}

  @Get('trending')
  @ApiOperation({ summary: 'Lấy danh sách hashtag trending/hot' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng hashtag (default: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách hashtag trending' })
  getTrending(@Query('limit') limit?: number) {
    return this.hashtagService.getTrending(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm hashtag' })
  @ApiQuery({ name: 'query', required: true, description: 'Từ khóa tìm kiếm' })
  @ApiOkResponse({ description: 'Kết quả tìm kiếm hashtag' })
  search(@Query('query') query: string) {
    return this.hashtagService.search(query);
  }

  @Get(':hashtag_id')
  @ApiOperation({ summary: 'Lấy chi tiết hashtag' })
  @ApiParam({
    name: 'hashtag_id',
    description: 'Hashtag ID (UUID) - ID của hashtag muốn xem chi tiết',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiOkResponse({ description: 'Chi tiết hashtag' })
  getHashtag(@Param('hashtag_id') hashtagId: string, @Req() req?: AuthenticatedRequest) {
    const user_id = req?.user?.id;
    return this.hashtagService.getHashtag(hashtagId, user_id);
  }

  @Get(':hashtag_id/posts')
  @ApiOperation({ summary: 'Lấy danh sách posts theo hashtag' })
  @ApiParam({
    name: 'hashtag_id',
    description: 'Hashtag ID (UUID) - ID của hashtag muốn xem posts',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['popular', 'latest'],
    description: 'Sắp xếp: popular hoặc latest',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Danh sách posts với pagination' })
  getHashtagPosts(
    @Param('hashtag_id') hashtagId: string,
    @Query('sort') sort?: 'popular' | 'latest',
    @Query() query?: BaseQueryDto,
    @Req() req?: AuthenticatedRequest,
  ) {
    const user_id = req?.user?.id;
    return this.hashtagService.getHashtagPosts(hashtagId, sort || 'latest', query, user_id);
  }

  @Post()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo hashtag mới' })
  @ApiBody({ type: CreateHashtagDto })
  @ApiCreatedResponse({ description: 'Hashtag đã được tạo' })
  createHashtag(@Body() dto: CreateHashtagDto) {
    return this.hashtagService.createHashtag(dto);
  }

  @Post(':hashtag_id/follow')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Follow hashtag' })
  @ApiParam({
    name: 'hashtag_id',
    description: 'Hashtag ID (UUID) - ID của hashtag muốn follow',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiOkResponse({ description: 'Đã follow hashtag' })
  followHashtag(@Param('hashtag_id') hashtagId: string, @Req() req: AuthenticatedRequest) {
    return this.hashtagService.followHashtag(req.user.id, hashtagId);
  }

  @Delete(':hashtag_id/follow')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unfollow hashtag' })
  @ApiParam({
    name: 'hashtag_id',
    description: 'Hashtag ID (UUID) - ID của hashtag muốn unfollow',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiOkResponse({ description: 'Đã unfollow hashtag' })
  unfollowHashtag(@Param('hashtag_id') hashtagId: string, @Req() req: AuthenticatedRequest) {
    return this.hashtagService.unfollowHashtag(req.user.id, hashtagId);
  }

  @Get(':hashtag_id/follow/status')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Kiểm tra trạng thái follow hashtag' })
  @ApiParam({
    name: 'hashtag_id',
    description: 'Hashtag ID (UUID) - ID của hashtag muốn kiểm tra',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiOkResponse({ description: 'Trạng thái follow' })
  getFollowStatus(@Param('hashtag_id') hashtagId: string, @Req() req: AuthenticatedRequest) {
    return this.hashtagService.getFollowStatus(req.user.id, hashtagId);
  }

  @Post('posts/:post_id/hashtags')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Gắn hashtags vào bài viết' })
  @ApiParam({ name: 'post_id', description: 'Post ID' })
  @ApiBody({ type: AttachHashtagsDto })
  @ApiOkResponse({ description: 'Đã gắn hashtags' })
  attachHashtags(
    @Param('post_id') postId: string,
    @Body() dto: AttachHashtagsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.hashtagService.attachHashtags(req.user.id, postId, dto);
  }

  @Delete('posts/:post_id/hashtags/:hashtag_id')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa hashtag khỏi bài viết' })
  @ApiParam({ name: 'post_id', description: 'Post ID' })
  @ApiParam({ name: 'hashtag_id', description: 'Hashtag ID' })
  @ApiOkResponse({ description: 'Đã xóa hashtag' })
  detachHashtag(
    @Param('post_id') postId: string,
    @Param('hashtag_id') hashtagId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.hashtagService.detachHashtag(req.user.id, postId, hashtagId);
  }

  @Get('posts/:post_id/hashtags')
  @ApiOperation({ summary: 'Lấy danh sách hashtag của bài viết' })
  @ApiParam({ name: 'post_id', description: 'Post ID' })
  @ApiOkResponse({ description: 'Danh sách hashtags' })
  getPostHashtags(@Param('post_id') postId: string) {
    return this.hashtagService.getPostHashtags(postId);
  }
}
