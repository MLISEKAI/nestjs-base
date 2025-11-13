import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('Profile Views')
@Controller('/profile')
export class ProfileViewsController {
  
  // POST: Ghi log khi user A xem hồ sơ user B
  @Post(':target_user_id/profile-views')
  @ApiOperation({ summary: 'Ghi log khi user A xem hồ sơ của user B' })
  @ApiParam({ name: 'target_user_id', description: 'ID của user được xem hồ sơ', type: String })
  @ApiResponse({ 
    status: 201, 
    description: 'Profile view được ghi log thành công.',
    examples: {
      success: { value: { message: 'Profile view logged for u123' }, summary: '' }
    }
  })
  logProfileView(@Param('target_user_id') id: string) {
    return { message: `Profile view logged for ${id}` };
  }
  
  // GET: Lấy danh sách hoặc tổng lượt xem hồ sơ
  @Get(':user_id/profile-views')
  @ApiOperation({ summary: 'Lấy danh sách hoặc tổng lượt xem hồ sơ của user' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiQuery({ name: 'full', required: false, description: 'Có lấy chi tiết đầy đủ không (true/false)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách lượt xem hồ sơ trả về thành công.',
    content: {
      'application/json': {
        examples: {
          summary: {
            summary: 'Chỉ lấy tổng lượt xem (summary)',
            value: [
              { viewer_id: 'u001', viewed_at: '2025-11-10T10:00:00Z' },
              { viewer_id: 'u002', viewed_at: '2025-11-10T11:00:00Z' }
            ]
          },
          full: {
            summary: 'Lấy chi tiết đầy đủ (full)',
            value: [
              { viewer_id: 'u001', viewed_at: '2025-11-10T10:00:00Z', viewer_name: 'Alice' },
              { viewer_id: 'u002', viewed_at: '2025-11-10T11:00:00Z', viewer_name: 'Bob' }
            ]
          }
        }
      }
    }
  })
  getProfileViews(@Param('user_id') id: string, @Query('full') full?: string) {
    const summary = [
      { viewer_id: 'u001', viewed_at: '2025-11-10T10:00:00Z' },
      { viewer_id: 'u002', viewed_at: '2025-11-10T11:00:00Z' },
    ];
    const fullList = [
      { viewer_id: 'u001', viewed_at: '2025-11-10T10:00:00Z', viewer_name: 'Alice' },
      { viewer_id: 'u002', viewed_at: '2025-11-10T11:00:00Z', viewer_name: 'Bob' },
    ];
    return full === 'true' ? fullList : summary;
  }

  // GET: Lấy thời gian cuối cùng user xem hồ sơ người khác
  @Get(':target_user_id/last-view')
  @ApiOperation({ summary: 'Lấy thời gian cuối cùng user xem hồ sơ của người khác' })
  @ApiParam({ name: 'target_user_id', description: 'ID của user được xem hồ sơ', type: String })
  @ApiQuery({ name: 'viewer_id', description: 'ID của user xem hồ sơ', type: String })
  @ApiResponse({ status: 200, description: 'Thời gian lần xem cuối cùng trả về thành công.' })
  getLastView(@Param('target_user_id') targetId: string, @Query('viewer_id') viewerId: string) {
    return { viewer_id: viewerId, target_id: targetId, last_viewed_at: '2025-11-10T11:00:00Z' };
  }
  
  // GET: Lấy thông tin các tính năng user đã kích hoạt
  @Get(':user_id/features')
  @ApiOperation({ summary: 'Lấy danh sách tính năng user đã kích hoạt (mock data)' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiResponse({ status: 200, description: 'Thông tin tính năng user trả về thành công.' })
  getUserFeatures(@Param('user_id') userId: string) {
    const features = {
      profile_view_full: false,
      boost_post: false,
      invisible_mode: false,
    };
    return { user_id: userId, features };
  }
}
