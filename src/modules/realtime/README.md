# 🚀 Real-time Features Implementation

## ✅ Đã hoàn thành

### 1. **WebSocket Gateway**
- ✅ Đã cài đặt `@nestjs/websockets` và `socket.io`
- ✅ Tạo `WebSocketGateway` với JWT authentication
- ✅ Hỗ trợ real-time messaging
- ✅ Hỗ trợ typing indicators
- ✅ Hỗ trợ room/group chat
- ✅ Track online users

### 2. **Notification System**
- ✅ Tạo `ResNotification` model trong Prisma
- ✅ Notification types: MESSAGE, FOLLOW, LIKE, COMMENT, GIFT, POST, SYSTEM
- ✅ Notification status: UNREAD, READ
- ✅ REST API endpoints cho notifications
- ✅ Real-time notifications qua WebSocket
- ✅ Pagination cho notification history

### 3. **Live Updates**
- ✅ Live updates cho posts (create, update, delete)
- ✅ Emit updates đến followers khi có post mới
- ✅ Real-time post updates

### 4. **Integration**
- ✅ Tích hợp WebSocket với messaging service
- ✅ Tích hợp WebSocket với notification service
- ✅ Tích hợp WebSocket với post service

---

## 📝 API Endpoints

### **Notifications**
- `GET /notifications` - Lấy danh sách notifications (pagination)
- `GET /notifications/unread/count` - Lấy số lượng unread
- `POST /notifications` - Tạo notification (admin/system)
- `PUT /notifications/:id/status` - Cập nhật status
- `PUT /notifications/mark-all-read` - Đánh dấu tất cả đã đọc
- `DELETE /notifications/:id` - Xóa notification

---

## 🔌 WebSocket Events

### **Client → Server**

1. **send_message**
   ```json
   {
     "receiverId": "user-id",
     "content": "Message content",
     "messageId": "optional-message-id"
   }
   ```

2. **send_notification**
   ```json
   {
     "user_id": "user-id",
     "notification": { ... }
   }
   ```

3. **typing**
   ```json
   {
     "receiverId": "user-id",
     "isTyping": true
   }
   ```

4. **join_room**
   ```json
   {
     "roomId": "room-id"
   }
   ```

5. **leave_room**
   ```json
   {
     "roomId": "room-id"
   }
   ```

### **Server → Client**

1. **connected** - Khi client kết nối thành công
2. **new_message** - Khi có message mới
3. **new_notification** - Khi có notification mới
4. **user_typing** - Khi user đang typing
5. **live_update** - Live updates (posts, likes, comments)

---

## 🔐 Authentication

WebSocket connection yêu cầu JWT token, có thể gửi qua:
- `auth.token` trong handshake
- `token` query parameter
- `Authorization: Bearer <token>` header

---

## 📊 Database Schema

### **ResNotification**
```prisma
model ResNotification {
  id         String             @id @default(uuid())
  created_at DateTime           @default(now())
  updated_at DateTime           @updatedAt
  user_id    String
  sender_id  String?
  type       NotificationType
  status     NotificationStatus @default(UNREAD)
  title      String
  content    String
  data       String?
  link       String?
  ...
}
```

---

## 🎯 Next Steps

- [ ] Implement likes/comments với live updates
- [ ] Notification preferences
- [ ] Push notifications (FCM)
- [ ] Email notifications
- [ ] Group chat rooms
- [ ] Message read receipts
- [ ] Online/offline status

---

## 📚 Usage Examples

### **Connect to WebSocket**
```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.on('new_message', (message) => {
  console.log('New message:', message);
});

socket.on('new_notification', (notification) => {
  console.log('New notification:', notification);
});

socket.on('live_update', (update) => {
  console.log('Live update:', update);
});
```

### **Send Message**
```javascript
socket.emit('send_message', {
  receiverId: 'user-id',
  content: 'Hello!',
  messageId: 'msg-123'
});
```

### **Typing Indicator**
```javascript
socket.emit('typing', {
  receiverId: 'user-id',
  isTyping: true
});
```

