# 📝 Posts Seed Data

File seed để tạo dữ liệu mẫu cho hệ thống Posts.

## 📋 Nội dung seed

Seed script sẽ tạo:

1. **Users** (10 users):
   - Sử dụng users có sẵn nếu có
   - Nếu không đủ, tạo thêm users mới với nickname và avatar từ mock data

2. **Hashtags** (~30+ hashtags):
   - Tạo hashtags từ tất cả posts
   - Bao gồm hot topics: `#Sayhi2025`, `#TravelTuesday`, `#FoodieFriday`, etc.
   - Tự động update `post_count` sau khi tạo posts

3. **Posts** (28 posts):
   - 13 posts mẫu với nội dung đa dạng (home decor, travel, food, fashion, tech, fitness, etc.)
   - 15 posts bổ sung cho pagination testing
   - Mỗi post có:
     - Content với hashtags
     - Media (images, videos, audio)
     - Privacy settings (public, friends, private)
     - Timestamps (spread over multiple days)

4. **Post Media**:
   - Images với thumbnail
   - Videos với thumbnail
   - Audio files
   - Mixed media (image + audio)

5. **Post Interactions**:
   - Likes (random users)
   - Comments (random users)
   - Shares (random users)

6. **Post Hashtags**:
   - Link posts với hashtags
   - Tự động update hashtag `post_count`

## 🚀 Cách chạy

### Option 1: Dùng npm script

```bash
npm run seed:posts
```

### Option 2: Chạy trực tiếp với ts-node

```bash
npx ts-node -r tsconfig-paths/register src/prisma/seed-posts.ts
```

### Option 3: Dùng tsx (nếu đã cài)

```bash
npx tsx src/prisma/seed-posts.ts
```

## ⚠️ Lưu ý

1. **Cần có users**: Seed script sẽ sử dụng users có sẵn hoặc tạo mới nếu cần.

2. **Idempotent**: Script có thể chạy nhiều lần an toàn:
   - Hashtags: Kiểm tra theo tên, nếu đã có thì dùng lại
   - Posts: Tạo mới mỗi lần (có thể tạo duplicate nếu chạy nhiều lần)
   - Media, likes, comments, shares: Tạo mới mỗi lần

3. **Database connection**: Đảm bảo file `.env` có `DATABASE_URL` đúng.

4. **Performance**: Script có thể mất vài phút để chạy vì tạo nhiều relationships (likes, comments, shares).

## 📊 Dữ liệu được tạo

### Posts Categories

- **Home Decor**: 1 post
- **Travel**: 1 post (multiple images)
- **Food**: 1 post (video)
- **Fashion**: 1 post
- **Tech**: 1 post (multiple images)
- **Fitness**: 1 post (video, friends privacy)
- **Photography**: 1 post
- **Books**: 1 post
- **Music Festival**: 1 post (mixed media)
- **Wellness/Yoga**: 1 post
- **Podcast**: 1 post (audio)
- **Music**: 1 post (audio)
- **Mixed Media**: 1 post (image + audio)
- **Daily Posts**: 15 posts (for pagination testing)

### Media Types

- **Images**: Single và multiple images
- **Videos**: Với thumbnails
- **Audio**: MP3 files
- **Mixed**: Image + Audio combinations

### Privacy Settings

- **Public**: Hầu hết posts
- **Friends**: 1 post (fitness)

### Hot Topics

- `#Sayhi2025` (120,000 posts)
- `#TravelTuesday` (89,500 posts)
- `#FoodieFriday` (76,300 posts)
- `#FitnessMotivation` (65,400 posts)
- `#TechTrends` (54,200 posts)
- `#OOTD` (45,900 posts)
- `#Photography` (39,800 posts)
- `#Wellness` (34,600 posts)

## 🎯 Sử dụng

Sau khi seed, bạn có thể test các API endpoints:

- `GET /posts` - Lấy danh sách posts
- `GET /posts/:id` - Lấy chi tiết post
- `GET /posts/hashtags/:hashtag` - Lấy posts theo hashtag
- `GET /posts/feed` - Feed posts
- `GET /posts/trending` - Trending posts

## 🔄 Reset Data

Nếu muốn reset và seed lại:

```bash
npm run prisma:reset
npm run seed:posts
```

⚠️ **Cảnh báo**: `prisma:reset` sẽ xóa TẤT CẢ dữ liệu trong database!
