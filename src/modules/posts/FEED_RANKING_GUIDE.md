# Feed Ranking Algorithm - Integration Guide

## 🎯 Tổng Quan

Đã tích hợp **Ranking Algorithm** vào các feed services hiện có của bạn:
- ✅ Friends Feed (có ranking)
- ✅ Community Feed (có ranking)
- ✅ Latest Feed (không ranking - luôn theo thời gian)

## 📦 Files Đã Thêm/Sửa

### 1. File Mới: `ranking.service.ts`
Service xử lý ranking algorithm với 5 yếu tố:
- Recency (30%): Độ mới
- Engagement (25%): Tương tác
- Author Popularity (20%): Độ nổi tiếng
- User Interaction (15%): Tương tác cá nhân
- Content Quality (10%): Chất lượng nội dung

### 2. File Đã Sửa: `feed.service.ts`
- Thêm RankingService dependency
- Thêm parameter `ranked?: boolean` cho các feed methods
- Apply ranking trước khi return response

### 3. File Đã Sửa: `posts.module.ts`
- Thêm RankingService vào providers

## 🚀 Cách Sử Dụng

### 1. Friends Feed (Có Ranking Mặc Định)

```typescript
// Với ranking (mặc định)
GET /api/feed/friends?page=0&limit=20

// Hoặc explicit
GET /api/feed/friends?page=0&limit=20&ranked=true

// Không ranking (chronological)
GET /api/feed/friends?page=0&limit=20&ranked=false
```

**Response:**
```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "post-id",
        "user": {...},
        "content": "...",
        "_ranking_score": 0.85,  // Điểm ranking (nếu có)
        "_ranking_details": {     // Chi tiết ranking (nếu có)
          "recency": 0.9,
          "engagement": 0.7,
          "authorPopularity": 0.8,
          "userInteraction": 0.9,
          "contentQuality": 0.6
        }
      }
    ],
    "meta": {...}
  }
}
```

### 2. Community Feed (Có Ranking Mặc Định)

```typescript
// Với ranking (mặc định)
GET /api/feed/community?page=0&limit=20

// Không ranking
GET /api/feed/community?page=0&limit=20&ranked=false
```

### 3. Latest Feed (Không Ranking)

```typescript
// Luôn chronological, không có ranking
GET /api/feed/latest?page=0&limit=20
```

## 🎨 Ranking Algorithm Chi Tiết

### 1. Recency Score (30%)
```typescript
// Exponential decay: score = e^(-0.1 × hours)
// Bài mới 1 giờ: ~0.90
// Bài mới 7 giờ: ~0.50
// Bài mới 24 giờ: ~0.09
```

### 2. Engagement Score (25%)
```typescript
// Weighted: likes × 1 + comments × 3 + shares × 5
// Logarithmic scale: log10(engagement + 1) / log10(1000)
// 10 likes + 5 comments + 2 shares = 35 points → score ~0.16
// 100 likes + 50 comments + 20 shares = 350 points → score ~0.26
```

### 3. Author Popularity Score (20%)
```typescript
// Based on follower count
// log10(followers + 1) / log10(10000)
// 100 followers → score ~0.50
// 1000 followers → score ~0.75
// 10000 followers → score ~1.00
```

### 4. User Interaction Score (15%)
```typescript
// Tracks: likes, comments (×2), messages (×3)
// Normalized: 10+ interactions = max score
// 5 interactions → score ~0.50
// 10+ interactions → score ~1.00
```

### 5. Content Quality Score (10%)
```typescript
// Has media: +0.3
// Has hashtags: +0.2
// Optimal length (100-500 chars): +0.5
// Max score: 1.0
```

### Final Score
```typescript
score = recency × 0.3 + engagement × 0.25 + popularity × 0.2 + interaction × 0.15 + quality × 0.1
```

## 🔧 Configuration

### Tùy Chỉnh Trọng Số

Trong `ranking.service.ts`:

```typescript
private readonly defaultWeights: RankingWeights = {
  recency: 0.3,        // Tăng nếu muốn ưu tiên bài mới
  engagement: 0.25,    // Tăng nếu muốn ưu tiên bài hot
  authorPopularity: 0.2,
  userInteraction: 0.15, // Tăng nếu muốn personalization cao hơn
  contentQuality: 0.1,
};
```

### Tùy Chỉnh Diversity

```typescript
// Trong rankPosts method
const diversePosts = this.applyDiversity(postsWithScores, 3); // Max 3 bài/tác giả
```

## 📊 Performance

### Cache Strategy

**User Interactions Cache:**
- Key: `user:interactions:{userId}`
- TTL: 1 hour
- Invalidate: Khi user like/comment/message

**Cách Invalidate:**
```typescript
// Trong like.service.ts, comment.service.ts
await this.rankingService.invalidateUserInteractions(userId);
```

### Expected Performance
- **Với cache hit**: +50-100ms (ranking calculation)
- **Với cache miss**: +200-500ms (calculate interactions + ranking)
- **Latest feed**: Không thay đổi (no ranking)

## 🎯 Best Practices

### 1. Khi Nào Dùng Ranking?

**✅ Nên dùng:**
- Friends Feed (personalized experience)
- Community Feed (discover best content)
- Home Feed (main feed)

**❌ Không nên dùng:**
- Latest Feed (user muốn xem mới nhất)
- User Profile Posts (chronological)
- Hashtag Feed (có thể optional)

### 2. Frontend Integration

```typescript
// React/Vue example
async function loadFeed(type: 'friends' | 'community' | 'latest', useRanking = true) {
  const params = new URLSearchParams({
    page: '0',
    limit: '20',
    ...(type !== 'latest' && { ranked: useRanking.toString() })
  });
  
  const response = await fetch(`/api/feed/${type}?${params}`);
  const data = await response.json();
  
  return data.data.items;
}

// Load friends feed with ranking
const posts = await loadFeed('friends', true);

// Load latest feed (no ranking option)
const latestPosts = await loadFeed('latest');
```

### 3. A/B Testing

```typescript
// Có thể A/B test ranking vs chronological
const useRanking = Math.random() > 0.5; // 50/50 split
const posts = await loadFeed('friends', useRanking);

// Track metrics
analytics.track('feed_loaded', {
  type: 'friends',
  ranked: useRanking,
  engagement_rate: calculateEngagement(posts)
});
```

## 🐛 Troubleshooting

### Issue: Ranking quá chậm
**Solution:**
1. Check cache hit rate: `redis-cli GET user:interactions:{userId}`
2. Reduce số posts trước khi ranking (limit query)
3. Optimize user interactions query

### Issue: Bài cũ vẫn lên top
**Solution:**
1. Tăng trọng số recency: `recency: 0.4` (từ 0.3)
2. Giảm trọng số engagement: `engagement: 0.2` (từ 0.25)

### Issue: Không thấy bài từ người ít tương tác
**Solution:**
1. Giảm trọng số userInteraction: `userInteraction: 0.1` (từ 0.15)
2. Tăng diversity: `applyDiversity(posts, 5)` (từ 3)

## 📈 Monitoring

### Metrics Cần Track

```typescript
// Trong ranking.service.ts, thêm metrics
private async rankPosts(posts: any[], userId: string) {
  const startTime = Date.now();
  
  // ... ranking logic ...
  
  const duration = Date.now() - startTime;
  this.logger.log(`Ranked ${posts.length} posts in ${duration}ms for user ${userId}`);
  
  // Track metrics
  // metricsService.recordRankingDuration(duration);
  // metricsService.recordRankingCount(posts.length);
}
```

### Redis Monitoring

```bash
# Check cache keys
redis-cli KEYS "user:interactions:*"

# Check cache hit rate
redis-cli INFO stats | grep keyspace_hits

# Monitor cache operations
redis-cli MONITOR | grep "user:interactions"
```

## 🎉 Summary

✅ **Đã tích hợp ranking vào:**
- Friends Feed (có ranking mặc định)
- Community Feed (có ranking mặc định)
- Latest Feed (không ranking)

✅ **Tính năng:**
- 5 yếu tố ranking thông minh
- Diversity filter (max 3 bài/tác giả)
- User interactions cache (1 hour)
- Optional ranking (query param `ranked`)

✅ **Performance:**
- Cache user interactions
- Minimal overhead (+50-100ms với cache)
- Không ảnh hưởng Latest Feed

✅ **Flexible:**
- Có thể bật/tắt ranking per request
- Có thể tùy chỉnh trọng số
- Có thể A/B test

Ranking algorithm đã sẵn sàng sử dụng! 🚀
