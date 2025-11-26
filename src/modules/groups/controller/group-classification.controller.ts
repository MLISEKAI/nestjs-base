import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { GroupService } from '../service/group.service';

@ApiTags('Group Classifications')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('groups')
export class GroupClassificationController {
  constructor(private readonly groupService: GroupService) {}

  @Get('classifications')
  @ApiOperation({ summary: 'Lấy danh sách group classifications' })
  @ApiOkResponse({
    description: 'Danh sách classifications',
    example: [
      { value: 'games', label: 'Trò chơi' },
      { value: 'making_friends', label: 'Kết bạn' },
      { value: 'enjoyment', label: 'Giải trí' },
      { value: 'entertainment', label: 'Showbiz' },
      { value: 'learning', label: 'Học tập' },
      { value: 'networking', label: 'Kết nối' },
      { value: 'others', label: 'Khác' },
    ],
  })
  async getClassifications() {
    return this.groupService.getClassifications();
  }
}
