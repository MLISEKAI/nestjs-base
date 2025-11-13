import { Controller, Get, Post, Delete, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ReferralService } from '../service/referral.service'

@ApiTags('Referrals')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/referrals')
export class ReferralController {
  constructor(private readonly referral: ReferralService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách referral của user' })
  getReferrals(@Param('user_id') userId: string) {
    return this.referral.getReferrals(userId)
  }

  @Post()
  @ApiOperation({ summary: 'Thêm referral' })
  addReferral(@Param('user_id') userId: string, @Body('referred_id') referredId: string) {
    return this.referral.addReferral(userId, referredId)
  }

  @Delete(':referred_id')
  @ApiOperation({ summary: 'Xóa referral' })
  removeReferral(@Param('user_id') userId: string, @Param('referred_id') referredId: string) {
    return this.referral.removeReferral(userId, referredId)
  }
}