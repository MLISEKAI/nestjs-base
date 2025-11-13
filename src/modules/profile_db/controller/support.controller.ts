import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { SupportService } from '../service/support.service';

@ApiTags('Support')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('info')
  @ApiOperation({ summary: 'Lấy thông tin hỗ trợ của công ty' })
  @ApiOkResponse({
    description: 'Thông tin hỗ trợ theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'sup-1' },
        email: { type: 'string', example: 'support@company.com' },
        phone: { type: 'string', example: '+84901234567' },
        created_at: { type: 'string', example: '2025-11-12T00:00:00.000Z' },
        updated_at: { type: 'string', example: '2025-11-12T00:10:00.000Z' },
      },
    },
  })
  getSupportInfo() {
    return this.support.getSupportInfo();
  }

  @Get('company')
  @ApiOperation({ summary: 'Thông tin công ty' })
  getCompanyInfo() {
    return this.support.getCompanyInfo();
  }

  @Get('help-articles')
  @ApiOperation({ summary: 'Danh sách bài viết trợ giúp' })
  getHelpArticles() {
    return this.support.getHelpArticles();
  }
}