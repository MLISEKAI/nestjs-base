import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { UsersMockService } from './users.mock.service';
import { PaginationQuery } from '../../common/interfaces/paginated.interface';

@ApiTags('Users (Mock)')
@Controller('api/v2/users')
export class UsersController {
  constructor(private readonly usersService: UsersMockService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách users (Mock)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'Nguyen' })
  @ApiQuery({ name: 'sort', required: false, example: 'created_at:desc' })
  @ApiOkResponse({ description: 'Danh sách users' })
  findAll(@Query() query: PaginationQuery) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin user theo ID (Mock)' })
  @ApiParam({ name: 'id', example: 'user-1' })
  @ApiOkResponse({ description: 'Thông tin user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo user mới (Mock)' })
  @ApiBody({ schema: { properties: { nickname: { example: 'NewUser' }, bio: { example: 'Bio' } } } })
  @ApiOkResponse({ description: 'User đã được tạo' })
  create(@Body() userData: any) {
    return this.usersService.create(userData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật user (Mock)' })
  @ApiParam({ name: 'id', example: 'user-1' })
  @ApiBody({ schema: { properties: { nickname: { example: 'UpdatedName' } } } })
  @ApiOkResponse({ description: 'User đã được cập nhật' })
  update(@Param('id') id: string, @Body() userData: any) {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa user (Mock)' })
  @ApiParam({ name: 'id', example: 'user-1' })
  @ApiOkResponse({ description: 'User đã được xóa' })
  delete(@Param('id') id: string) {
    this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}

