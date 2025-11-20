import { Controller, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { ReferralService } from '../service/referral.service';

/**
 * Public Referrals Controller - Không cần authentication
 * Dùng để xem số lượng referrals của user khác (social proof)
 */
@ApiTags('Referrals (Public)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('public/users/:user_id/referrals')
export class ReferralPublicController {
  constructor(private readonly referral: ReferralService) {}

  @Get()
  @ApiOperation({ summary: '[PUBLIC] Xem số lượng referrals của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Chỉ trả về tổng số referrals và tổng earned (không có danh sách chi tiết)',
    schema: {
      type: 'object',
      properties: {
        total_referrals: { type: 'number', example: 10 },
        total_earned: { type: 'number', example: 500 },
      },
    },
  })
  async getReferrals(@Param('user_id') userId: string) {
    const referrals = await this.referral.getReferrals(userId);
    // Chỉ trả về thông tin public
    const items = referrals?.items || [];
    const total_earned = items.reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0);

    return {
      total_referrals: referrals?.meta?.total_items || 0,
      total_earned,
    };
  }
}
