import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { LoveSpaceDto, CreateLoveSpaceDto, UpdateLoveSpaceDto } from '../dto/lovespace.dto';
import { LoveSpaceService } from '../service/love-space.service';

@ApiTags('Love Space')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/love-space')
export class LoveSpaceController {
  constructor(private readonly loveSpace: LoveSpaceService) {}

  @Get()
  @ApiOperation({ summary: 'Thông tin Love Space' })
  @ApiOkResponse({
    description: 'Love Space theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'ls-1' },
        user_id: { example: 'user-1' },
        bio: { example: 'We met in 2020' },
        created_at: { example: '2025-11-12T00:00:00.000Z' },
        updated_at: { example: '2025-11-12T00:10:00.000Z' },
      },
    },
  })
  getLoveSpace(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.loveSpace.getLoveSpace(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo Love Space' })
  @ApiBody({ type: CreateLoveSpaceDto })
  @ApiCreatedResponse({
    description: 'Love Space được tạo theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'ls-1' },
        user_id: { example: 'user-1' },
        bio: { example: 'We met in 2020' },
        created_at: { example: '2025-11-12T00:00:00.000Z' },
        updated_at: { example: '2025-11-12T00:10:00.000Z' },
      },
    },
  })
  createLoveSpace(@Param('user_id') userId: string, @Body() dto: CreateLoveSpaceDto) {
    return this.loveSpace.createLoveSpace(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật Love Space' })
  @ApiBody({ type: UpdateLoveSpaceDto })
  @ApiOkResponse({
    description: 'Love Space sau cập nhật theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'ls-1' },
        user_id: { example: 'user-1' },
        bio: { example: 'We met in 2020' },
        created_at: { example: '2025-11-12T00:00:00.000Z' },
        updated_at: { example: '2025-11-12T00:10:00.000Z' },
      },
    },
  })
  updateLoveSpace(@Param('user_id') userId: string, @Body() dto: UpdateLoveSpaceDto) {
    return this.loveSpace.updateLoveSpace(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa Love Space' })
  @ApiOkResponse({
    description: 'Kết quả xóa',
    schema: { type: 'object', properties: { message: { example: 'Love Space deleted' } } },
  })
  deleteLoveSpace(@Param('user_id') userId: string) {
    return this.loveSpace.deleteLoveSpace(userId);
  }
}
