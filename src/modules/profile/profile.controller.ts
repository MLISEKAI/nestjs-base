import { 
  ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiQuery 
} from '@nestjs/swagger';
import { Controller, Get, Post, Param, Body, Query, NotFoundException, Delete } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { FeedbackDto } from './dto/feedback.dto';
import {   mockAlbums,
  mockLocation,
  mockContribution,
  mockInterests,
  mockGiftsSummary,
  mockTopGifts,
  mockTopSupporters,
  mockRelationshipSummary,
  mockRelationships,
  mockRoomStatus,
  mockClanInfo,
  mockClans, mockCompanyInfo, mockHelpArticles, mockInventory, mockLoveSpace, mockPosts, mockReferrals, mockStats, mockStore, mockStoreByUser, mockSupportInfo, mockTaskSummary, mockUsers, mockVipStatus, mockWallet, 
  mockUserLevel,
  mockUserStatus} from './profile.mock';
import { UserProfileDto } from './dto/profile.dto';
import { UserStatsDto } from './dto/sats.dto';
import { WalletDto } from './dto/wallet.dto';
import { VipStatusDto } from './dto/vip.dto';
import { StoreDto } from './dto/store.dto';
import { LoveSpaceDto } from './dto/lovespace.dto';
import { ClanDto } from './dto/clan.dto';
import { QuestScanDto } from './dto/questscan.dto';


@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  // Thông tin cơ bản
  @Get(':user_id')
  @ApiOperation({ summary: 'Lấy thông tin cơ bản của user' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin user',
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'Thông tin user mock',
            value: mockUsers[0],
          },
        },
      },
    },
  })
  getProfile(@Param('user_id') userId: string, @Query() dto: UserProfileDto) {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    return {
      ...user,
      level: mockUserLevel,
      statusBadge: mockUserStatus.statusBadge,
      isAccountLocked: mockUserStatus.isAccountLocked,
      isBlockedByMe: mockUserStatus.isBlockedByMe,
      hasBlockedMe: mockUserStatus.hasBlockedMe,
      relationshipStatus: mockUserStatus.relationshipStatus,
    };
  }   
      
  // Thống kê
  @Get(':user_id/stats')
  @ApiOperation({ summary: 'Lấy thống kê của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thống kê user trả về thành công.',
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'Stats mock',
            value: mockStats,
          },
        },
      },
    },
  })
  getStats(@Param('user_id') userId: string, @Query() dto: UserStatsDto) {
    return this.service.getStats(userId, dto);
  }

  // Ví
  @Get(':user_id/wallet')
  @ApiOperation({ summary: 'Lấy thông tin ví của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin ví của user',
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'Wallet mock',
            value: mockWallet,
          },
        },
      },
    },
  })
  getWallet(@Param('user_id') userId: string, @Query() dto: WalletDto) {
    return this.service.getWallet(userId, dto);
  }

  // VIP
  @Get(':user_id/vip-status')
  @ApiOperation({ summary: 'Lấy trạng thái VIP của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trạng thái VIP',
    content: { 'application/json': { examples: { success: { summary: 'VIP mock', value: mockVipStatus } } } },
  })
  getVipStatus(@Param('user_id') userId: string, @Query() dto: VipStatusDto) {
    return this.service.getVipStatus(userId, dto);
  }

  // Store
   @Get(':user_id/store')
  @ApiOperation({ summary: 'Lấy danh sách store của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách store',
    content: { 'application/json': { examples: { success: { summary: 'Store mock', value: mockStore } } } },
  })
  getStore(@Param('user_id') userId: string, @Query() dto: StoreDto) {
    return this.service.getStore(userId, dto);
  }

  // Nhiệm vụ
  @Get(':user_id/tasks/summary')
  @ApiOperation({ summary: 'Lấy tóm tắt nhiệm vụ của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tóm tắt nhiệm vụ',
    content: { 'application/json': { examples: { success: { summary: 'Task summary mock', value: mockTaskSummary } } } },
  })
    getTaskSummary(@Param('user_id') userId: string, @Query() dto: any) {
    return this.service.getTaskSummary(userId, dto);
  }


  // Love Space
  @Get(':user_id/love-space')
  @ApiOperation({ summary: 'Lấy thông tin Love Space của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Love Space info',
    content: { 'application/json': { examples: { success: { summary: 'Love Space mock', value: mockLoveSpace } } } },
  })
  getLoveSpace(@Param('user_id') userId: string, @Query() dto: LoveSpaceDto) {
    return this.service.getLoveSpace(userId, dto);
  }

  // Bài đăng
  @Get(':user_id/posts')
  @ApiOperation({ summary: 'Lấy danh sách bài đăng của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách bài đăng',
    content: { 'application/json': { examples: { success: { summary: 'Posts mock', value: [] } } } },
  })
  getPosts(@Param('user_id') userId: string, @Query() dto: any) {
      return this.service.getPosts(userId, dto);
  }
  
  // Vật phẩm
  @Get(':user_id/inventory')
  @ApiOperation({ summary: 'Lấy danh sách vật phẩm của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Inventory info',
    content: { 'application/json': { examples: { success: { summary: 'Inventory mock', value: mockInventory } } } },
  })
  getInventory(@Param('user_id') userId: string, @Query() dto: any) {
    return this.service.getInventory(userId, dto);
  }

  // Clan
  @Get(':user_id/clans')
  @ApiOperation({ summary: 'Lấy danh sách clan của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Clans list',
    content: { 'application/json': { examples: { success: { summary: 'Clans mock', value: mockClans } } } },
  })
  getClans(@Param('user_id') userId: string, @Query() dto: ClanDto) {
    return this.service.getClans(userId, dto);
  }

  // Clan Info
  @Get(':user_id/clan/info')
  @ApiOperation({ summary: 'Lấy thông tin clan của user' })
  @ApiResponse({ status: 200, description: 'Clan info', schema: { example: mockClanInfo } })
  getClanInfo(@Param('user_id') userId: string) {
      return this.service.getClanInfo(userId);
  }

  // Referrals
  @Get(':user_id/referrals')
  @ApiOperation({ summary: 'Lấy danh sách referrals của user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Referrals info',
    content: { 'application/json': { examples: { success: { summary: 'Referrals mock', value: mockReferrals } } } },
  })
  getReferrals(@Param('user_id') userId: string, @Query() dto: any) {
    return this.service.getReferrals(userId, dto);
  }

   // Bài viết hướng dẫn
  @Get('help/articles')
  @ApiOperation({ summary: 'Lấy danh sách bài viết hướng dẫn' })
  @ApiResponse({ 
    status: 200,
    description: 'Help articles',
    content: { 'application/json': { examples: { success: { summary: 'Help articles mock', value: mockHelpArticles } } } },
  })
  getHelpArticles() {
    return this.service.getHelpArticles();
  }

  // Thông tin công ty
  @Get('company/contact-info')
  @ApiOperation({ summary: 'Lấy thông tin liên hệ công ty' })
  @ApiResponse({ 
    status: 200,
    description: 'Company info',
    content: { 'application/json': { examples: { success: { summary: 'Company info mock', value: mockCompanyInfo } } } },
  })
  getCompanyInfo() {
    return this.service.getCompanyInfo();
  }

  // Phản hồi
 @Post('feedback')
  @ApiOperation({ summary: 'Gửi phản hồi từ user' })
  @ApiBody({ type: FeedbackDto, description: 'Dữ liệu phản hồi từ user' })
  @ApiResponse({
    status: 201,
    description: 'Phản hồi được gửi thành công.',
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'Feedback mock',
            value: { message: 'Feedback received successfully' },
          },
        },
      },
    },
  })
  postFeedback(@Body() dto: FeedbackDto) {
    return this.service.postFeedback(dto);
  }

  // Quét nhiệm vụ
  @Post(':user_id/quests/scan')
  @ApiOperation({ summary: 'Quét nhiệm vụ của user' })
  @ApiResponse({
    status: 201,
    description: 'Quét nhiệm vụ thành công',
    content: { 'application/json': { examples: { success: { summary: 'Quest scan mock', value: { message: 'Quest scanned successfully' } } } } },
  })
  postQuestScan(@Param('user_id') userId: string, @Body() dto: QuestScanDto) {
    return this.service.postQuestScan(userId, dto);
  }

  // Lấy thông tin hỗ trợ
  @Get('support/info')
  @ApiOperation({ summary: 'Lấy thông tin hỗ trợ của công ty' })
  @ApiResponse({
    status: 200,
    description: 'Company support info',
    content: { 'application/json': { examples: { success: { summary: 'Support info mock', value: mockSupportInfo } } } },
  })
  getSupportInfo() {
     return this.service.getSupportInfo();
  }

  // Location 
  @Get(':user_id/location')
  @ApiOperation({ summary: 'Lấy vị trí/khoảng cách của user' })
  @ApiResponse({ status: 200, description: 'Location info', schema: { example: mockLocation } })
  getUserLocation(@Param('user_id') userId: string) {
     return this.service.getUserLocation(userId);
  }

  // Contribution (Kim cương / Points)
  @Get(':user_id/contribution')
  @ApiOperation({ summary: 'Lấy đóng góp (kim cương/điểm) của user' })
  @ApiResponse({ status: 200, description: 'Contribution info', schema: { example: mockContribution } })
  getUserContribution(@Param('user_id') userId: string) {
      return this.service.getUserContribution(userId);
  }

  // Interests
  @Get(':user_id/interests')
  @ApiOperation({ summary: 'Lấy danh sách sở thích của user' })
  @ApiResponse({ status: 200, description: 'Interests', schema: { example: mockInterests } })
  getUserInterests(@Param('user_id') userId: string) {
    return this.service.getUserInterests(userId);
  }

  // Gifts
  @Get(':user_id/gifts/summary')
  @ApiOperation({ summary: 'Lấy tổng quan quà tặng của user' })
  @ApiResponse({ status: 200, description: 'Gifts summary', schema: { example: mockGiftsSummary } })
  getGiftsSummary(@Param('user_id') userId: string) {
    return this.service.getGiftsSummary(userId);
  }

  @Get(':user_id/gifts/top')
  @ApiOperation({ summary: 'Lấy top quà tặng của user' })
  @ApiResponse({ status: 200, description: 'Top gifts', schema: { example: mockTopGifts } })
  getTopGifts(@Param('user_id') userId: string) {
    return mockTopGifts;
  }

  // Top Supporters
  @Get(':user_id/supporters/top')
  @ApiOperation({ summary: 'Lấy top người ủng hộ user' })
  @ApiResponse({ status: 200, description: 'Top supporters', schema: { example: mockTopSupporters } })
  getTopSupporters(@Param('user_id') userId: string) {
    return this.service.getTopSupporters(userId);
  }

  // Relationships
  @Get(':user_id/relationships/summary')
  @ApiOperation({ summary: 'Lấy tóm tắt mối quan hệ của user' })
  @ApiResponse({ status: 200, description: 'Relationship summary', schema: { example: mockRelationshipSummary } })
  getRelationshipSummary(@Param('user_id') userId: string) {
    return this.service.getRelationshipSummary(userId);
  }

  @Get(':user_id/relationships')
  @ApiOperation({ summary: 'Lấy chi tiết mối quan hệ của user' })
  @ApiResponse({ status: 200, description: 'Relationships', schema: { example: mockRelationships } })
  getRelationships(@Param('user_id') userId: string) {
    return this.service.getRelationships(userId);
  }

  // Room Status
  @Get(':user_id/room/status')
  @ApiOperation({ summary: 'Lấy trạng thái phòng của user' })
  @ApiResponse({ status: 200, description: 'Room status', schema: { example: mockRoomStatus } })
  getRoomStatus(@Param('user_id') userId: string) {
    return this.service.getRoomStatus(userId);
  }

// Album routes
  @Get(':user_id/albums')
  @ApiOperation({ summary: 'Lấy danh sách album của user' })
  getUserAlbums(@Param('user_id') userId: string) {
    return this.service.getAlbums(userId);
  }

  @Get(':user_id/albums/:album_id/photos')
  @ApiOperation({ summary: 'Lấy danh sách ảnh trong album' })
  getAlbumPhotos(
    @Param('user_id') userId: string,
    @Param('album_id') albumId: string,
  ) {
    return this.service.getAlbumPhotos(userId, albumId);
  }

  @Post(':user_id/albums/:album_id/photos')
  @ApiOperation({ summary: 'Thêm ảnh vào album' })
  @ApiBody({ schema: { properties: { imageUrl: { type: 'string' } } } })
  addPhotoToAlbum(
    @Param('user_id') userId: string,
    @Param('album_id') albumId: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.service.addPhotoToAlbum(userId, albumId, imageUrl);
  }

  @Delete(':user_id/albums/:album_id/photos/:photo_id')
  @ApiOperation({ summary: 'Xóa ảnh khỏi album' })
  @ApiBody({ schema: { properties: { imageUrl: { type: 'string' } } } })
  deletePhotoFromAlbum(
    @Param('user_id') userId: string,
    @Param('album_id') albumId: string,
    @Param('photo_id') photoId: string,
  ) {
    return this.service.deletePhotoFromAlbum(userId, albumId, photoId);
  }

}
