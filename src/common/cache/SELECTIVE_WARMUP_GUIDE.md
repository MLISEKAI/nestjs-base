# 🎯 Selective Cache Warmup Guide

## 📖 Tổng quan

Selective Cache Warmup cho phép bạn warmup cache cho specific users, posts, feeds, hoặc search queries thay vì warmup toàn bộ cache.

## 🚀 Use Cases

### 1. After Batch User Import
Sau khi import batch users mới, warmup cache cho những users đó:

```bash
curl -X POST http://localhost:3000/api/admin/cache/selective-warmup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "user",
    "targetIds": ["user-id-1", "user-id-2", "user-id-3"],
    "reason": "After batch user import"
  }'
```

### 2. After Config Update
Sau khi update config hoặc featured users, warmup cache:

```bash
curl -X POST http://localhost:3000/api/admin/cache/selective-warmup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "user",
    "targetIds": ["featured-user-1", "featured-user-2"],
    "reason": "Featured users updated"
  }'
```

### 3. Warmup Popular Posts
Warmup cache cho trending posts:

```bash
curl -X POST http://localhost:3000/api/admin/cache/selective-warmup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "post",
    "targetIds": ["post-id-1", "post-id-2"],
    "reason": "Trending posts"
  }'
```

### 4. Warmup User Feeds
Warmup personalized feeds cho specific users:

```bash
curl -X POST http://localhost:3000/api/admin/cache/selective-warmup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "feed",
    "targetIds": ["user-id-1", "user-id-2"],
    "reason": "VIP users feed warmup"
  }'
```

### 5. Warmup Search Results
Warmup cache cho popular search queries:

```bash
curl -X POST http://localhost:3000/api/admin/cache/selective-warmup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "search",
    "targetIds": ["john", "jane", "popular query"],
    "reason": "Popular search queries"
  }'
```

## 📊 API Endpoints

### 1. Selective Warmup (General)
**Endpoint**: `POST /api/admin/cache/selective-warmup`

**Request Body**:
```typescript
{
  targetType: 'user' | 'post' | 'feed' | 'search',
  targetIds: string[],  // Max 100 items
  reason?: string       // Optional, for logging
}
```

**Response**:
```typescript
{
  success: boolean,
  keysWarmed: number,
  durationMs: number,
  targetType: string,
  targetsProcessed: number,
  failedTargets: string[],
  traceId: string
}
```

**Rate Limit**: 10 requests per minute

### 2. Warmup Single User
**Endpoint**: `POST /api/admin/cache/warmup-user`

**Request Body**:
```typescript
{
  userId: string,
  includePosts?: boolean,
  includeNotifications?: boolean
}
```

**Response**: Same as above

**Rate Limit**: 20 requests per minute

## 🎯 Target Types

### USER
Warmup user profile và stats:
- `user:{id}:detail` - User profile
- `connections:{id}:stats` - Followers, following, friends count

**Data warmed**:
- User profile (nickname, avatar, bio)
- Connection stats (followers, following, friends)

### POST
Warmup post detail và stats:
- `post:{id}:detail` - Post content
- `post:{id}:stats` - Likes, comments count

**Data warmed**:
- Post content (text, media)
- Post stats (likes, comments)

### FEED
Warmup personalized feed cho user:
- `feed:{userId}:page:1` - User's feed (first page)

**Data warmed**:
- Recent posts from followed users (top 20)

### SEARCH
Warmup search results:
- `search:users:{query}:page:1` - Search results

**Data warmed**:
- User search results (top 20)

## 📝 Examples

### Example 1: Warmup VIP Users
```typescript
// After promoting users to VIP
const vipUserIds = ['user-1', 'user-2', 'user-3'];

await fetch('http://localhost:3000/api/admin/cache/selective-warmup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    targetType: 'user',
    targetIds: vipUserIds,
    reason: 'VIP users promotion',
  }),
});
```

### Example 2: Warmup After Content Moderation
```typescript
// After approving posts
const approvedPostIds = ['post-1', 'post-2'];

await fetch('http://localhost:3000/api/admin/cache/selective-warmup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    targetType: 'post',
    targetIds: approvedPostIds,
    reason: 'Posts approved by moderator',
  }),
});
```

### Example 3: Warmup Feeds for Active Users
```typescript
// Get active users from analytics
const activeUserIds = await getActiveUsers();

await fetch('http://localhost:3000/api/admin/cache/selective-warmup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    targetType: 'feed',
    targetIds: activeUserIds,
    reason: 'Active users feed refresh',
  }),
});
```

## 🔧 Integration with Events

### Event-Driven Warmup

```typescript
// In your service
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheWarmingService } from '@/common/cache/cache-warming.service';

@Injectable()
export class UserService {
  constructor(
    private eventEmitter: EventEmitter2,
    private cacheWarmingService: CacheWarmingService,
  ) {}

  async batchImportUsers(users: User[]) {
    // Import users
    const imported = await this.importUsers(users);
    
    // Trigger selective warmup
    const userIds = imported.map(u => u.id);
    await this.cacheWarmingService.warmupUsers(userIds, 'Batch import');
    
    // Or emit event
    this.eventEmitter.emit('users.imported', { userIds });
  }
}
```

### Scheduled Warmup for Popular Content

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ContentService {
  constructor(private cacheWarmingService: CacheWarmingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async warmupTrendingContent() {
    // Get trending posts
    const trendingPosts = await this.getTrendingPosts();
    const postIds = trendingPosts.map(p => p.id);
    
    // Warmup cache
    await this.cacheWarmingService.warmupPosts(postIds, 'Hourly trending posts');
  }
}
```

## 📊 Monitoring

### Check Warmup Status
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/admin/cache/status
```

### View Metrics
```bash
# Prometheus format
curl http://localhost:3000/api/metrics

# JSON format
curl http://localhost:3000/api/metrics/json
```

### Logs with TraceId
All selective warmup operations include a `traceId`:

```json
{
  "level": "info",
  "message": "🎯 Starting selective user warmup for 5 users",
  "traceId": "selective-user-1701432000000-abc123",
  "userIds": ["user-1", "user-2", "user-3", "user-4", "user-5"],
  "reason": "After batch import"
}
```

Search logs:
```bash
grep "selective-user-1701432000000-abc123" logs/app.log
```

## ⚠️ Limitations

### Rate Limits
- **General selective warmup**: 10 requests/minute
- **Single user warmup**: 20 requests/minute
- **Max targets per request**: 100

### Performance Considerations
- Each user warmup: ~50-100ms
- Each post warmup: ~30-50ms
- Each feed warmup: ~200-500ms (depends on following count)
- Each search warmup: ~50-150ms

### Best Practices
1. **Batch requests**: Warmup multiple targets in one request (max 100)
2. **Use reason field**: Always provide reason for logging/debugging
3. **Monitor failures**: Check `failedTargets` in response
4. **Avoid over-warming**: Don't warmup too frequently
5. **Use traceId**: Track operations end-to-end

## 🐛 Troubleshooting

### High Failure Rate
```bash
# Check failed targets
curl -X POST http://localhost:3000/api/admin/cache/selective-warmup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "user",
    "targetIds": ["user-1", "user-2"]
  }' | jq '.failedTargets'
```

### Slow Warmup
- Check database performance
- Review slow queries: `GET /api/performance/slow-queries`
- Consider reducing batch size

### Memory Issues
- Monitor Redis memory: `GET /api/metrics/json`
- Adjust TTLs if needed
- Review cache eviction policy

## 📚 Related Documentation

- **Cache Monitoring Guide**: `CACHE_MONITORING_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`
- **Quick Reference**: `QUICK_REFERENCE.md`
- **Project Context**: `../../../PROJECT_CONTEXT.md`

## 🎯 Success Metrics

Track these metrics to measure effectiveness:

1. **Cache hit rate** after selective warmup
2. **API response time** for warmed resources
3. **Warmup duration** (should be < 5s for 100 targets)
4. **Failure rate** (should be < 1%)

## 💡 Future Enhancements

- [ ] Auto-detect popular content for warmup
- [ ] Predictive warmup based on user behavior
- [ ] Warmup priority queue
- [ ] Distributed warmup across instances
- [ ] Warmup scheduling UI
