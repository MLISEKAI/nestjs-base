/**
 * Các loại tin nhắn có thể gửi
 * - text: Tin nhắn văn bản thông thường
 * - image: Tin nhắn hình ảnh
 * - video: Tin nhắn video
 * - audio: Tin nhắn âm thanh/giọng nói
 * - icon: Icon/Emoji/Sticker
 * - gift: Tin nhắn quà tặng
 * - business_card: Danh thiếp (chia sẻ thông tin người dùng)
 * - system: Tin nhắn hệ thống (tự động)
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ICON = 'icon',
  GIFT = 'gift',
  BUSINESS_CARD = 'business_card',
  SYSTEM = 'system',
}
