/**
 * Interface cho dữ liệu danh thiếp
 * Dùng trong tin nhắn loại business_card để chia sẻ thông tin người dùng
 */
export interface BusinessCardData {
  user_id: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  [key: string]: any; // Cho phép thêm các trường tùy chỉnh
}

/**
 * Interface cho thông tin người dùng trong tin nhắn nhóm
 * Dùng để hiển thị thông tin người gửi tin nhắn trong nhóm
 */
export interface GroupMessageUserInfo {
  id: string;
  nickname: string;
  avatar?: string;
}
