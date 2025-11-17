import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { PostsMockService } from './posts.mock.service';
import { PaginationQuery } from '../../common/interfaces/paginated.interface';

@ApiTags('Posts (Mock)')
@Controller('api/v2/posts')
export class PostsController {
  constructor(private readonly postsService: PostsMockService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách posts (Mock)' })
  @ApiQuery({ name: 'user_id', required: false, example: 'user-1' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ description: 'Danh sách posts' })
  findAll(@Query('user_id') userId?: string, @Query() query?: PaginationQuery) {
    return this.postsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin post theo ID (Mock)' })
  @ApiParam({ name: 'id', example: 'post-1' })
  @ApiOkResponse({ description: 'Thông tin post' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo post mới (Mock)' })
  @ApiBody({ schema: { properties: { user_id: { example: 'user-1' }, content: { example: 'Hello world!' } } } })
  @ApiOkResponse({ description: 'Post đã được tạo' })
  create(@Body() body: { user_id: string; content: string }) {
    return this.postsService.create(body.user_id, body.content);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật post (Mock)' })
  @ApiParam({ name: 'id', example: 'post-1' })
  @ApiBody({ schema: { properties: { content: { example: 'Updated content' } } } })
  @ApiOkResponse({ description: 'Post đã được cập nhật' })
  update(@Param('id') id: string, @Body() body: { content: string }) {
    return this.postsService.update(id, body.content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa post (Mock)' })
  @ApiParam({ name: 'id', example: 'post-1' })
  @ApiOkResponse({ description: 'Post đã được xóa' })
  delete(@Param('id') id: string) {
    this.postsService.delete(id);
    return { message: 'Post deleted successfully' };
  }
}

