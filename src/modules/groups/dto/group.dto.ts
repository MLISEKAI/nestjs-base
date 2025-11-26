import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import type { GroupMessageUserInfo } from '../../../common/interfaces';
import type {
  IPaginatedResponse,
  IPaginationMeta,
} from '../../../common/interfaces/pagination.interface';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { MemberRole } from '../../../common/enums';

/**
 * DTO trả về thông tin nhóm (response)
 * Chứa đầy đủ thông tin về một nhóm bao gồm ID, tên, mô tả, avatar, v.v.
 */
export class GroupDto {
  @ApiProperty({ example: 'group-1', description: 'ID của nhóm' })
  id: string;

  @ApiProperty({ example: 'Nhóm bạn thân', description: 'Tên nhóm' })
  name: string;

  @ApiPropertyOptional({
    example: 'Nhóm dành cho những người bạn thân thiết',
    description: 'Mô tả về nhóm - Giới thiệu ngắn gọn về mục đích của nhóm',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL ảnh đại diện của nhóm - Link đến ảnh avatar của nhóm',
  })
  avatar?: string;

  @ApiProperty({
    example: false,
    description:
      'Nhóm có công khai hay không - true = ai cũng có thể tìm thấy và tham gia, false = chỉ thành viên mới thấy',
  })
  is_public: boolean;

  @ApiProperty({ example: 'user-1', description: 'ID người tạo nhóm' })
  created_by: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z', description: 'Thời gian tạo nhóm' })
  created_at: Date;

  @ApiProperty({
    example: '2025-11-12T00:00:00.000Z',
    description: 'Thời gian cập nhật nhóm lần cuối',
  })
  updated_at: Date;

  @ApiPropertyOptional({ example: 25, description: 'Số lượng thành viên trong nhóm' })
  members_count?: number;
}

/**
 * DTO để tạo nhóm mới
 * Người tạo nhóm sẽ tự động trở thành owner (chủ sở hữu) của nhóm
 */
export class CreateGroupDto {
  @ApiProperty({
    example: 'Nhóm bạn thân',
    description: 'Tên nhóm (bắt buộc) - Tên mà bạn muốn đặt cho nhóm',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Nhóm dành cho những người bạn thân thiết, cùng nhau chia sẻ khoảnh khắc đẹp',
    description: 'Mô tả về nhóm (tùy chọn) - Giới thiệu ngắn gọn về mục đích và nội dung của nhóm',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL ảnh đại diện của nhóm (tùy chọn) - Link đến ảnh avatar đã upload lên server',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    example: false,
    description:
      'Nhóm có công khai hay không (bắt buộc) - true = công khai (ai cũng tìm thấy), false = riêng tư (chỉ thành viên thấy)',
  })
  @IsBoolean()
  is_public: boolean;
}

/**
 * DTO để cập nhật thông tin nhóm
 * Chỉ admin/owner mới có quyền cập nhật
 * Tất cả các trường đều tùy chọn, chỉ cập nhật các trường được gửi lên
 */
export class UpdateGroupDto {
  @ApiPropertyOptional({
    example: 'Nhóm bạn thân 2025',
    description: 'Tên nhóm mới (tùy chọn) - Tên mới bạn muốn đổi cho nhóm',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Mô tả mới về nhóm',
    description: 'Mô tả mới về nhóm (tùy chọn) - Mô tả mới bạn muốn cập nhật',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/new-avatar.jpg',
    description: 'URL ảnh đại diện mới (tùy chọn) - Link đến ảnh avatar mới đã upload',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Thay đổi trạng thái công khai (tùy chọn) - true = công khai, false = riêng tư',
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

/**
 * DTO trả về thông tin tin nhắn trong nhóm (response)
 * Chứa thông tin tin nhắn và người gửi
 */
export class GroupMessageDto {
  @ApiProperty({ example: 'message-1', description: 'ID của tin nhắn' })
  id: string;

  @ApiProperty({ example: 'group-1', description: 'ID của nhóm chứa tin nhắn' })
  group_id: string;

  @ApiProperty({ example: 'user-1', description: 'ID người gửi tin nhắn' })
  user_id: string;

  @ApiProperty({ example: 'Xin chào mọi người!', description: 'Nội dung tin nhắn' })
  content: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z', description: 'Thời gian gửi tin nhắn' })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'Thông tin người gửi tin nhắn - Bao gồm ID, tên hiển thị và avatar',
  })
  user?: GroupMessageUserInfo;
}

/**
 * DTO để gửi tin nhắn trong nhóm
 * Chỉ thành viên của nhóm mới có thể gửi tin nhắn
 */
export class SendGroupMessageDto {
  @ApiProperty({
    example: 'Xin chào mọi người! Hôm nay có ai rảnh không?',
    description: 'Nội dung tin nhắn (bắt buộc) - Văn bản tin nhắn bạn muốn gửi đến nhóm',
  })
  @IsString()
  content: string;
}

/**
 * DTO để tham gia nhóm (deprecated - không dùng nữa)
 * Hiện tại endpoint join không cần body, chỉ cần group_id trong URL
 */
export class JoinGroupDto {
  @ApiProperty({ example: 'group-1', description: 'ID của nhóm muốn tham gia' })
  @IsString()
  group_id: string;
}

/**
 * Response DTO cho danh sách nhóm với pagination
 */
export class GroupListResponseDto implements IPaginatedResponse<GroupDto> {
  @ApiProperty({
    type: [GroupDto],
    example: [
      {
        id: 'group-1',
        name: 'Nhóm bạn thân',
        description: 'Nhóm dành cho những người bạn thân thiết',
        avatar: 'https://example.com/avatar.jpg',
        is_public: true,
        created_by: 'user-1',
        created_at: '2025-11-12T00:00:00.000Z',
        updated_at: '2025-11-12T00:00:00.000Z',
        members_count: 25,
      },
    ],
    description: 'Danh sách các nhóm',
  })
  items: GroupDto[];

  @ApiProperty({
    example: {
      item_count: 20,
      total_items: 150,
      items_per_page: 20,
      total_pages: 8,
      current_page: 1,
    },
    description: 'Thông tin phân trang',
  })
  meta: IPaginationMeta;
}

/**
 * Response DTO cho thông tin thành viên nhóm
 */
export class GroupMemberResponseDto {
  @ApiProperty({ example: 'user-1', description: 'ID người dùng' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên hiển thị' })
  nickname: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL avatar' })
  avatar?: string;

  @ApiProperty({
    example: 'owner',
    enum: ['owner', 'admin', 'member'],
    description: 'Vai trò trong nhóm',
  })
  role: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z', description: 'Thời gian tham gia nhóm' })
  joined_at: Date;
}

/**
 * Response DTO cho danh sách thành viên nhóm với pagination
 */
export class GroupMemberListResponseDto implements IPaginatedResponse<GroupMemberResponseDto> {
  @ApiProperty({
    type: [GroupMemberResponseDto],
    example: [
      {
        id: 'user-1',
        nickname: 'Nguyễn Văn A',
        avatar: 'https://example.com/avatar.jpg',
        role: 'owner',
        joined_at: '2025-11-12T00:00:00.000Z',
      },
      {
        id: 'user-2',
        nickname: 'Trần Thị B',
        avatar: 'https://example.com/avatar2.jpg',
        role: 'admin',
        joined_at: '2025-11-13T00:00:00.000Z',
      },
    ],
    description: 'Danh sách thành viên nhóm',
  })
  items: GroupMemberResponseDto[];

  @ApiProperty({
    example: {
      item_count: 20,
      total_items: 25,
      items_per_page: 20,
      total_pages: 2,
      current_page: 1,
    },
    description: 'Thông tin phân trang',
  })
  meta: IPaginationMeta;
}

/**
 * Response DTO cho tin nhắn nhóm với pagination
 */
export class GroupMessageListResponseDto implements IPaginatedResponse<GroupMessageDto> {
  @ApiProperty({
    type: [GroupMessageDto],
    example: [
      {
        id: 'message-1',
        group_id: 'group-1',
        user_id: 'user-1',
        content: 'Xin chào mọi người!',
        created_at: '2025-11-12T10:00:00.000Z',
        user: {
          id: 'user-1',
          nickname: 'Nguyễn Văn A',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    ],
    description: 'Danh sách tin nhắn trong nhóm',
  })
  items: GroupMessageDto[];

  @ApiProperty({
    example: {
      item_count: 50,
      total_items: 200,
      items_per_page: 50,
      total_pages: 4,
      current_page: 1,
    },
    description: 'Thông tin phân trang',
  })
  meta: IPaginationMeta;
}

export class GroupMemberQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: MemberRole, description: 'Lọc theo vai trò thành viên' })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}
