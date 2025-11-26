import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { GroupClassification, MemberRole } from '../../../common/enums';

/**
 * DTO để cập nhật lời giới thiệu nhóm
 * Lời giới thiệu hiển thị ở đầu trang nhóm, mô tả chi tiết về nhóm
 */
export class UpdateGroupIntroductionDto {
  @ApiProperty({
    example: 'Chào mừng đến với nhóm của chúng tôi! Đây là nơi để chia sẻ và kết nối.',
    description:
      'Lời giới thiệu về nhóm (bắt buộc) - Văn bản giới thiệu chi tiết về nhóm, mục đích và nội dung',
  })
  @IsString()
  introduction: string;
}

/**
 * DTO để cập nhật tên nhóm
 * Chỉ admin/owner mới có quyền đổi tên nhóm
 */
export class UpdateGroupNameDto {
  @ApiProperty({
    example: 'Nhóm bạn thân 2025',
    description: 'Tên nhóm mới (bắt buộc) - Tên mới bạn muốn đặt cho nhóm',
  })
  @IsString()
  name: string;
}

/**
 * DTO để cập nhật ảnh đại diện nhóm
 * Chỉ admin/owner mới có quyền đổi avatar
 */
export class UpdateGroupAvatarDto {
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL ảnh đại diện mới (bắt buộc) - Link đến ảnh avatar mới đã upload lên server',
  })
  @IsString()
  avatar: string;
}

/**
 * DTO để cập nhật cài đặt thông báo nhóm
 * Cho phép bật/tắt thông báo khi có tin nhắn mới trong nhóm
 */
export class UpdateGroupNotificationsDto {
  @ApiProperty({
    example: false,
    description:
      'Bật/tắt thông báo nhóm - true = bật thông báo (nhận thông báo khi có tin nhắn mới), false = tắt thông báo',
  })
  @IsBoolean()
  enabled: boolean;
}

/**
 * DTO để cập nhật cài đặt âm thanh quà tặng trong nhóm
 * Cho phép bật/tắt âm thanh khi có người gửi quà trong nhóm
 */
export class UpdateGroupGiftEffectDto {
  @ApiProperty({
    example: true,
    description: 'Bật/tắt âm thanh quà tặng - true = bật âm thanh khi có quà, false = tắt âm thanh',
  })
  @IsBoolean()
  enabled: boolean;
}

/**
 * DTO để cập nhật phân loại nhóm
 * Giúp nhóm được tìm thấy dễ dàng hơn theo danh mục
 * Chỉ admin/owner mới có quyền thay đổi
 */
export class UpdateGroupClassificationDto {
  @ApiProperty({
    example: 'games',
    enum: [
      'games',
      'making_friends',
      'enjoyment',
      'entertainment',
      'learning',
      'networking',
      'others',
    ],
    description:
      'Phân loại nhóm - Chọn một trong các loại: games (trò chơi), making_friends (kết bạn), enjoyment (giải trí), entertainment (showbiz), learning (học tập), networking (kết nối), others (khác)',
  })
  @IsEnum(GroupClassification)
  classification: GroupClassification;
}

export class UpdateGroupSettingsDto {
  @ApiPropertyOptional({
    example: 'Chào mừng đến với nhóm của chúng tôi! Đây là nơi để chia sẻ và kết nối.',
  })
  @IsOptional()
  @IsString()
  introduction?: string;

  @ApiPropertyOptional({ example: 'Nhóm bạn thân 2025' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Mô tả mới về nhóm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: GroupClassification, example: 'games' })
  @IsOptional()
  @IsEnum(GroupClassification)
  classification?: GroupClassification;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  gift_sounds_enabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

/**
 * DTO để báo cáo nhóm
 * Cho phép báo cáo nhóm vi phạm quy tắc cộng đồng
 */
export class ReportGroupDto {
  @ApiProperty({
    example: 'spam',
    description:
      'Lý do báo cáo nhóm (bắt buộc) - Ví dụ: "spam", "harassment", "inappropriate_content", "fake_group"',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    example: 'Nhóm này đăng nội dung spam liên tục',
    description:
      'Chi tiết bổ sung về lý do báo cáo (tùy chọn) - Mô tả thêm về vấn đề bạn gặp phải với nhóm này',
  })
  @IsOptional()
  @IsString()
  details?: string;
}

/**
 * DTO để thêm thành viên vào nhóm
 * Chỉ admin/owner mới có quyền thêm thành viên
 * Có thể thêm nhiều thành viên cùng lúc
 */
export class AddGroupMembersDto {
  @ApiProperty({
    example: ['user-1', 'user-2', 'user-3'],
    description:
      'Danh sách ID người dùng muốn thêm vào nhóm (bắt buộc) - Mảng các ID người dùng bạn muốn mời vào nhóm',
  })
  @IsString({ each: true })
  userIds: string[];
}

/**
 * DTO để cập nhật vai trò thành viên trong nhóm
 * Chỉ admin/owner mới có quyền thay đổi vai trò
 * - owner: Chủ sở hữu nhóm (quyền cao nhất, không thể thay đổi)
 * - admin: Quản trị viên (có quyền quản lý nhóm)
 * - member: Thành viên thường (chỉ có quyền cơ bản)
 */
export class UpdateMemberRoleDto {
  @ApiProperty({
    type: String,
    example: 'admin',
    enum: MemberRole,
    description:
      'Vai trò mới của thành viên - "owner" (chủ sở hữu), "admin" (quản trị viên), "member" (thành viên thường)',
  })
  @IsEnum(MemberRole)
  role: string;
}

/**
 * DTO trả về thống kê thành viên trong nhóm
 * Chứa số lượng tổng thể và số lượng theo từng vai trò
 */
export class MemberSummaryDto {
  @ApiProperty({ example: 25, description: 'Tổng số thành viên trong nhóm' })
  total: number;

  @ApiProperty({ example: 1, description: 'Số lượng chủ sở hữu (owner)' })
  owners: number;

  @ApiProperty({ example: 3, description: 'Số lượng quản trị viên (admin)' })
  admins: number;

  @ApiProperty({ example: 21, description: 'Số lượng thành viên thường (member)' })
  members: number;
}

/**
 * DTO để cập nhật thông tin nhóm
 * Chỉ admin/owner mới có quyền cập nhật
 * Tất cả các trường đều tùy chọn, chỉ cập nhật các trường được gửi lên
 */
