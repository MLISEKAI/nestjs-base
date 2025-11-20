# Search & Discovery Module - Implementation Plan

## 📋 Tổng quan

Module này sẽ cung cấp các tính năng tìm kiếm và khám phá nội dung nâng cao cho platform.

## 🎯 Các tính năng cần implement

### 1. **Advanced Search** (Full-text search)

- ✅ Basic search đã có (Prisma contains)
- ⚠️ Cần nâng cấp: PostgreSQL full-text search hoặc Elasticsearch/Meilisearch
- Tìm kiếm trong: Users, Posts, Comments, Hashtags

### 2. **User Recommendations**

- Gợi ý users dựa trên:
  - Mutual connections
  - Similar interests
  - Location (nếu có)
  - Activity patterns

### 3. **Trending Posts/Users**

- Trending posts: Dựa trên likes, comments, views trong 24h/7 ngày
- Trending users: Dựa trên followers growth, posts engagement

### 4. **Search Filters**

- Filter by:
  - Type (users, posts, comments)
  - Date range
  - Engagement metrics
  - Location
  - Tags/Hashtags

## 🏗️ Kiến trúc

```
src/modules/search/
├── controller/
│   ├── search.controller.ts          # Main search endpoint
│   ├── recommendations.controller.ts # User recommendations
│   └── trending.controller.ts        # Trending content
├── service/
│   ├── search.service.ts             # Core search logic
│   ├── recommendation.service.ts     # Recommendation algorithms
│   └── trending.service.ts           # Trending calculation
├── dto/
│   ├── search.dto.ts                # Search query DTOs
│   └── recommendation.dto.ts          # Recommendation DTOs
└── search.module.ts
```

## 📝 API Endpoints

### Search

- `GET /search` - Universal search (users, posts, comments)
- `GET /search/users` - Search users only
- `GET /search/posts` - Search posts only
- `GET /search/comments` - Search comments only

### Recommendations

- `GET /recommendations/users` - Recommended users
- `GET /recommendations/posts` - Recommended posts

### Trending

- `GET /trending/posts` - Trending posts (24h, 7d, 30d)
- `GET /trending/users` - Trending users (24h, 7d, 30d)

## 🔧 Implementation Steps

1. **Phase 1: Basic Search Enhancement**
   - Upgrade từ Prisma contains → PostgreSQL full-text search
   - Add search filters (type, date, etc.)

2. **Phase 2: Recommendations**
   - Implement user recommendation algorithm
   - Implement post recommendation algorithm

3. **Phase 3: Trending**
   - Calculate trending scores
   - Cache trending results

4. **Phase 4: Advanced Search (Optional)**
   - Integrate Elasticsearch/Meilisearch
   - Add fuzzy search, typo tolerance
