# 🚦 Rate Limiting per User Guide

## 📋 Tổng quan

Hệ thống rate limiting per user đã được implement để:

- Bảo vệ API khỏi abuse
- Giới hạn số requests mỗi user có thể thực hiện
- Hỗ trợ cả Redis (persistent) và in-memory (fallback)

## 🏗️ Architecture

### Components

1. **UserRateLimitService** - Service quản lý rate limiting
2. **UserRateLimitGuard** - Guard để check rate limit
3. **@UserRateLimit** - Decorator để enable rate limiting
4. **RateLimitModule** - Module export services và guards

## 📖 Usage

### Basic Usage

```typescript
import {
  UserRateLimit,
  RateLimitPresets,
} from 'src/common/rate-limit/decorators/user-rate-limit.decorator';
import { UseGuards } from '@nestjs/common';
import { UserRateLimitGuard } from 'src/common/rate-limit/guards/user-rate-limit.guard';

@Controller('profile/:user_id/gifts')
export class GiftsController {
  @Post()
  @UseGuards(UserRateLimitGuard)
  @UserRateLimit({ limit: 10, ttl: 60000 }) // 10 requests per minute
  async createGift(@Param('user_id') userId: string, @Body() dto: CreateGiftDto) {
    return this.giftService.create(dto);
  }
}
```

### Using Presets

```typescript
import { UserRateLimit, RateLimitPresets } from 'src/common/rate-limit/decorators/user-rate-limit.decorator';

@Post('send')
@UseGuards(UserRateLimitGuard)
@UserRateLimit(RateLimitPresets.STRICT) // 10 requests per minute
async sendGift() {
  // ...
}

@Get()
@UseGuards(UserRateLimitGuard)
@UserRateLimit(RateLimitPresets.NORMAL) // 30 requests per minute
async getGifts() {
  // ...
}
```

### Available Presets

```typescript
RateLimitPresets.STRICT; // 10 requests/minute
RateLimitPresets.NORMAL; // 30 requests/minute
RateLimitPresets.RELAXED; // 60 requests/minute
RateLimitPresets.HOURLY; // 100 requests/hour
RateLimitPresets.SENSITIVE; // 5 requests/minute
```

## 🔧 Configuration

### Custom Rate Limit

```typescript
@UserRateLimit({
  limit: 20,        // Số requests cho phép
  ttl: 60000,       // Time window (milliseconds) - 1 minute
})
```

### Examples

```typescript
// 5 requests per 30 seconds
@UserRateLimit({ limit: 5, ttl: 30000 })

// 100 requests per hour
@UserRateLimit({ limit: 100, ttl: 3600000 })

// 1 request per 5 seconds (very strict)
@UserRateLimit({ limit: 1, ttl: 5000 })
```

## 📊 Response Headers

Khi rate limit được apply, response sẽ có các headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1703123456
```

## ⚠️ Rate Limit Exceeded

Khi vượt quá rate limit, API sẽ trả về:

**Status Code:** `429 Too Many Requests`

**Response:**

```json
{
  "error": true,
  "code": 429,
  "message": "Rate limit exceeded. Please try again after 45 seconds.",
  "data": {
    "retryAfter": 45,
    "resetTime": "2025-01-20T10:00:00.000Z"
  }
}
```

## 🎯 Best Practices

### 1. **Different Limits for Different Endpoints**

```typescript
// Sensitive operations - strict limit
@Post('transfer')
@UserRateLimit(RateLimitPresets.SENSITIVE) // 5/min
async transferMoney() { }

// Read operations - relaxed limit
@Get('balance')
@UserRateLimit(RateLimitPresets.RELAXED) // 60/min
async getBalance() { }
```

### 2. **Apply to Critical Endpoints**

Rate limiting nên được apply cho:

- ✅ Authentication endpoints (login, register)
- ✅ Payment/Transaction endpoints
- ✅ Gift sending
- ✅ Message sending
- ✅ Post creation
- ✅ File upload

### 3. **Don't Apply to Read-Only Endpoints**

Không cần rate limit cho:

- ❌ Public data endpoints
- ❌ Static content
- ❌ Health checks

## 🔍 How It Works

### 1. **User Identification**

Guard sẽ tự động lấy user ID từ:

- `request.user.id` (từ JWT token)
- `request.params.user_id`
- `request.body.user_id`
- `request.query.user_id`

Nếu không có user ID, sẽ dùng IP address làm fallback.

### 2. **Storage**

- **Primary**: Redis (nếu available)
- **Fallback**: In-memory Map (nếu Redis không available)

### 3. **Key Format**

```
rate_limit:user:{userId}:{endpoint}
```

Example:

```
rate_limit:user:user-123:/profile/user-123/gifts
```

## 🧪 Testing

### Test Rate Limit

```bash
# 1. Call API nhiều lần
for i in {1..15}; do
  curl -X POST http://localhost:3001/profile/{user_id}/gifts/send \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d '{"receiver_id": "...", "gift_item_id": "..."}'
done

# 2. Sau 10 requests (nếu limit = 10), sẽ nhận 429 error
```

### Check Rate Limit Status

```typescript
// In service
const status = await this.rateLimitService.getRateLimitStatus(
  userId,
  '/profile/:user_id/gifts/send',
  { limit: 10, ttl: 60000 },
);

console.log(`Remaining: ${status.remaining}`);
console.log(`Reset at: ${status.resetTime}`);
```

## 🔧 Advanced Usage

### Reset Rate Limit (Admin Only)

```typescript
// Reset rate limit for a user
await this.rateLimitService.resetRateLimit(userId, endpoint);
```

### Custom Guard Logic

```typescript
@Injectable()
export class CustomRateLimitGuard extends UserRateLimitGuard {
  protected getUserId(request: any): string | null {
    // Custom logic to get user ID
    return request.customUser?.id;
  }
}
```

## 📝 Implementation Examples

### Example 1: Gift Sending

```typescript
@Post('send')
@UseGuards(AuthGuard('account-auth'), UserRateLimitGuard)
@UserRateLimit({ limit: 10, ttl: 60000 }) // 10 gifts per minute
@ApiOperation({ summary: 'Gửi quà' })
async sendGift(
  @Param('user_id') userId: string,
  @Body() dto: CreateGiftDto,
) {
  return this.giftService.create({ ...dto, sender_id: userId });
}
```

### Example 2: Message Sending

```typescript
@Post('send')
@UseGuards(AuthGuard('account-auth'), UserRateLimitGuard)
@UserRateLimit(RateLimitPresets.NORMAL) // 30 messages per minute
async sendMessage(
  @Body() dto: SendMessageDto,
) {
  return this.messageService.send(dto);
}
```

### Example 3: Post Creation

```typescript
@Post()
@UseGuards(AuthGuard('account-auth'), UserRateLimitGuard)
@UserRateLimit({ limit: 5, ttl: 60000 }) // 5 posts per minute
async createPost(
  @Param('user_id') userId: string,
  @Body() dto: CreatePostDto,
) {
  return this.postService.create(userId, dto);
}
```

## ⚙️ Configuration per Endpoint

### Recommended Limits

| Endpoint Type   | Limit | TTL | Reason              |
| --------------- | ----- | --- | ------------------- |
| Authentication  | 5     | 60s | Prevent brute force |
| Gift Send       | 10    | 60s | Prevent spam        |
| Message Send    | 30    | 60s | Normal usage        |
| Post Create     | 5     | 60s | Prevent spam        |
| File Upload     | 10    | 60s | Prevent abuse       |
| Payment         | 3     | 60s | Security            |
| Read Operations | 60    | 60s | Normal usage        |

## 🚀 Performance

- **Redis**: O(1) operations, very fast
- **Memory**: O(1) operations, fast but limited to single instance
- **Cleanup**: Automatic cleanup of expired entries

## ✅ Checklist

- [x] UserRateLimitService với Redis + Memory fallback
- [x] UserRateLimitGuard
- [x] @UserRateLimit decorator
- [x] RateLimitModule
- [ ] Apply to critical endpoints
- [ ] Test rate limiting
- [ ] Monitor rate limit violations

## 🎯 Next Steps

1. Apply rate limiting to critical endpoints
2. Monitor rate limit violations
3. Adjust limits based on usage patterns
4. Add rate limit status endpoint for users
