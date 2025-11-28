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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReferralService } from '../service/referral.service';
import type { AuthenticatedRequest } from '../../../../common/interfaces/request.interface';

/**
 * User Referrals Controller - Yêu cầu authentication
 * User chỉ có thể xem/sửa referrals của chính mình
 */
@ApiTags('Referrals (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referral: ReferralService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách referral của user' })
  getReferrals(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.referral.getReferrals(user_id);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm referral cho user hiện tại' })
  addReferral(@Req() req: AuthenticatedRequest, @Body('referred_id') referredId: string) {
    const user_id = req.user.id;
    return this.referral.addReferral(user_id, referredId);
  }

  @Delete(':referred_id')
  @ApiOperation({ summary: 'Xóa referral của user hiện tại' })
  removeReferral(@Req() req: AuthenticatedRequest, @Param('referred_id') referredId: string) {
    const user_id = req.user.id;
    return this.referral.removeReferral(user_id, referredId);
  }
}
