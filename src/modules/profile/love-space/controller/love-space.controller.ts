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
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { LoveSpaceDto, CreateLoveSpaceDto, UpdateLoveSpaceDto } from '../dto/lovespace.dto';
import { LoveSpaceService } from '../service/love-space.service';
import type { AuthenticatedRequest } from '../../../../common/interfaces/request.interface';

/**
 * User Love Space Controller - Yêu cầu authentication
 * User chỉ có thể edit Love Space của chính mình
 */
@ApiTags('Love Space (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('love-space')
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
  getLoveSpace(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const user_id = req.user.id;
    return this.loveSpace.getLoveSpace(user_id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo Love Space cho user hiện tại' })
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
  createLoveSpace(@Req() req: AuthenticatedRequest, @Body() dto: CreateLoveSpaceDto) {
    const user_id = req.user.id;
    return this.loveSpace.createLoveSpace(user_id, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật Love Space của user hiện tại' })
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
  updateLoveSpace(@Req() req: AuthenticatedRequest, @Body() dto: UpdateLoveSpaceDto) {
    const user_id = req.user.id;
    return this.loveSpace.updateLoveSpace(user_id, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa Love Space của user hiện tại' })
  @ApiOkResponse({
    description: 'Kết quả xóa',
    schema: { type: 'object', properties: { message: { example: 'Love Space deleted' } } },
  })
  deleteLoveSpace(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.loveSpace.deleteLoveSpace(user_id);
  }
}
