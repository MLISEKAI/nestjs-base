import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../../common/guards/admin.guard';
import { ReferralService } from '../service/referral.service';

/**
 * Admin Referrals Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý referrals của bất kỳ user nào
 */
@ApiTags('Referrals (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/referrals')
export class ReferralAdminController {
  constructor(private readonly referral: ReferralService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Danh sách referral của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  getReferrals(@Param('user_id') user_id: string) {
    return this.referral.getReferrals(user_id);
  }

  @Post()
  @ApiOperation({ summary: '[ADMIN] Thêm referral cho user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  addReferral(@Param('user_id') user_id: string, @Body('referred_id') referredId: string) {
    return this.referral.addReferral(user_id, referredId);
  }

  @Delete(':referred_id')
  @ApiOperation({ summary: '[ADMIN] Xóa referral của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'referred_id', description: 'ID của referred user' })
  removeReferral(@Param('user_id') user_id: string, @Param('referred_id') referredId: string) {
    return this.referral.removeReferral(user_id, referredId);
  }
}
