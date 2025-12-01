# 📋 Tasks TODO - Social Network Backend

## 🎯 Mục tiêu Dự án

Xây dựng một backend mạng xã hội hoàn chỉnh với:
- ✅ Performance cao (cache 2 lớp, query optimization)
- ✅ Scalability (multi-instance safe, Redis lock)
- ✅ Observability (Prometheus metrics, logging)
- ✅ Security (JWT, rate limiting, validation)
- 🔄 Reliability (retry logic, graceful degradation)

---

## ✅ Đã Hoàn Thành

### Phase 1: Core Infrastructure ✅
- [x] Setup NestJS project với TypeScript
- [x] Configure Prisma ORM với PostgreSQL
- [x] Setup Redis cache
- [x] Implement JWT authentication
- [x] Add OAuth (Google, Facebook)
- [x] Setup Swagger documentation
- [x] Add global exception filter
- [x] Add global validation pipe
- [x] Setup Winston logging

### Phase 2: Cache System ✅
- [x] Implement 2-layer cache (Memory + Redis)
- [x] Add cache warming service
- [x] Auto warmup on server start
- [x] Scheduled warmup (every 30 min)
- [x] Cache admin endpoints
- [x] Pattern-based cache invalidation
- [x] Multi-instance safe with Redis lock

### Phase 3: Monitoring & Observability ✅
- [x] Prometheus metrics service
- [x] Cache hit/miss tracking
- [x] Slow query detection
- [x] Performance monitoring
- [x] TraceId for request tracking
- [x] Alert system (warmup slow, failed, high miss rate)
- [x] Metrics endpoints (/metrics, /metrics/json, /metrics/alerts)

### Phase 4: Reliability Improvements ✅
- [x] Atomic Redis locks (SET NX EX)
- [x] Retry with exponential backoff
- [x] Timeout for operations
- [x] Graceful degradation (Promise.allSettled)
- [x] Rate limiting on admin endpoints

### Phase 5: Core Modules ✅
- [x] Users module (CRUD, profile, connections)
- [x] Auth module (login, register, OAuth, 2FA)
- [x] Associate module (follow, friend, block)
- [x] Posts module (create, read, update, delete)
- [x] Notifications module
- [x] Messaging module
- [x] Room module (chat rooms)
- [x] Realtime module (WebSocket)

---

## 🔄 Đang Làm (In Progress)

### Phase 6: Advanced Features
- [x] **Selective Cache Warmup** (Priority: High) ✅ COMPLETED
  - [x] Warmup specific users/data on demand
  - [x] Trigger warmup after batch import
  - [x] Trigger warmup after config update
  - [x] API: `POST /admin/cache/selective-warmup`
  - [x] Support for: users, posts, feeds, search
  - [x] Batch warmup (max 100 targets)
  - [x] Rate limiting (10-20 req/min)
  - [x] Metrics tracking with traceId
  - [x] Documentation complete

- [ ] **Feed Algorithm Optimization** (Priority: High)
  - Implement feed ranking algorithm
  - Cache personalized feeds
  - Optimize feed query performance
  - Add feed refresh mechanism

---

## 📝 Cần Làm (TODO)

### Phase 7: Performance Optimization (Priority: High)

#### Database Optimization
- [x] Add missing indexes ✅ COMPLETED
  - [x] `res_user.nickname` (for search) - Already exists
  - [x] `res_post.created_at` (for feed) - Already exists
  - [x] `res_notification.user_id, status` (composite) - Already exists
  - [x] `res_follow.follower_id, created_at` (composite) - Added
  - [x] `res_follow.following_id, created_at` (composite) - Added
  - [x] `res_post.user_id, created_at` (composite) - Added
  - [x] `res_post.privacy, created_at` (composite) - Added
  - [x] `res_comment.post_id, created_at` (composite) - Added
  - [x] `res_comment.user_id, created_at` (composite) - Added
  - [x] `res_friend.user_a_id, created_at` (composite) - Added
  - [x] `res_friend.user_b_id, created_at` (composite) - Added

- [ ] Optimize slow queries
  - [ ] User connections count (followers, following, friends)
  - [ ] Feed query (posts from followed users)
  - [ ] Notification list query
  - [ ] Search queries

- [ ] Implement query result caching
  - [ ] Cache user stats (followers, following, friends count)
  - [ ] Cache post stats (likes, comments count)
  - [ ] Cache feed pages

#### Cache Optimization
- [ ] Implement cache preloading
  - [ ] Preload popular users
  - [ ] Preload trending posts
  - [ ] Preload active rooms

- [ ] Add cache metrics
  - [ ] Cache size monitoring
  - [ ] Cache eviction rate
  - [ ] Cache memory usage per key type

- [ ] Optimize cache keys
  - [ ] Review and standardize key naming
  - [ ] Add key expiration monitoring
  - [ ] Implement cache key versioning

### Phase 8: Scalability (Priority: Medium)

#### Distributed Systems
- [ ] Implement Redlock for distributed locks
  - [ ] Replace simple Redis lock with Redlock
  - [ ] Test in multi-instance environment
  - [ ] Add lock monitoring

- [ ] Add message queue (BullMQ)
  - [ ] Queue for email sending
  - [ ] Queue for notification delivery
  - [ ] Queue for image processing
  - [ ] Queue for cache warming

- [ ] Implement event-driven architecture
  - [ ] User events (created, updated, deleted)
  - [ ] Post events (created, liked, commented)
  - [ ] Notification events
  - [ ] Use EventEmitter2 or RabbitMQ

#### Load Balancing
- [ ] Setup load balancer (Nginx)
- [ ] Implement sticky sessions for WebSocket
- [ ] Add health check endpoint
- [ ] Add graceful shutdown

### Phase 9: Advanced Monitoring (Priority: Medium)

#### Metrics & Dashboards
- [ ] Create Grafana dashboards
  - [ ] Cache performance dashboard
  - [ ] API performance dashboard
  - [ ] Database performance dashboard
  - [ ] Error rate dashboard

- [ ] Setup Prometheus alerts
  - [ ] High error rate alert
  - [ ] Slow query alert
  - [ ] High cache miss rate alert
  - [ ] Database connection pool alert

- [ ] Add custom metrics
  - [ ] User activity metrics
  - [ ] Post engagement metrics
  - [ ] Message delivery metrics

#### Logging & Tracing
- [ ] Implement distributed tracing
  - [ ] Add OpenTelemetry
  - [ ] Integrate with Jaeger or Zipkin
  - [ ] Trace cross-service calls

- [ ] Enhance logging
  - [ ] Add structured logging for all modules
  - [ ] Log user actions for audit
  - [ ] Add log aggregation (ELK stack)

### Phase 10: Security Enhancements (Priority: High)

#### Authentication & Authorization
- [ ] Implement refresh token rotation
- [ ] Add device tracking
- [ ] Add suspicious login detection
- [ ] Implement account lockout after failed attempts

#### Data Protection
- [ ] Add PII encryption
- [ ] Implement data masking for logs
- [ ] Add GDPR compliance features
  - [ ] Data export
  - [ ] Data deletion
  - [ ] Consent management

#### API Security
- [ ] Add API key authentication for external services
- [ ] Implement request signing
- [ ] Add CORS whitelist
- [ ] Add CSP headers

### Phase 11: Testing (Priority: Medium)

#### Unit Tests
- [ ] Write unit tests for services
  - [ ] UserService
  - [ ] CacheService
  - [ ] NotificationService
  - [ ] PostService

- [ ] Write unit tests for utilities
  - [ ] Cache key generator
  - [ ] Date utilities
  - [ ] String utilities

#### Integration Tests
- [ ] Test API endpoints
  - [ ] Auth endpoints
  - [ ] User endpoints
  - [ ] Post endpoints
  - [ ] Notification endpoints

- [ ] Test database operations
  - [ ] CRUD operations
  - [ ] Transactions
  - [ ] Migrations

#### E2E Tests
- [ ] Test user flows
  - [ ] Registration → Login → Create Post
  - [ ] Follow user → See feed
  - [ ] Send message → Receive notification

- [ ] Test error scenarios
  - [ ] Invalid input
  - [ ] Unauthorized access
  - [ ] Rate limit exceeded

### Phase 12: Documentation (Priority: Low)

#### API Documentation
- [ ] Complete Swagger documentation
  - [ ] Add examples for all endpoints
  - [ ] Add error responses
  - [ ] Add authentication requirements

- [ ] Create API usage guide
  - [ ] Authentication flow
  - [ ] Pagination guide
  - [ ] Error handling guide

#### Developer Documentation
- [ ] Create onboarding guide
- [ ] Document architecture decisions
- [ ] Create troubleshooting guide
- [ ] Document deployment process

### Phase 13: DevOps (Priority: Medium)

#### CI/CD
- [ ] Setup GitHub Actions
  - [ ] Run tests on PR
  - [ ] Run linting
  - [ ] Build Docker image
  - [ ] Deploy to staging

- [ ] Setup deployment pipeline
  - [ ] Staging environment
  - [ ] Production environment
  - [ ] Rollback mechanism

#### Infrastructure
- [ ] Setup Docker Compose for local dev
- [ ] Create Kubernetes manifests
- [ ] Setup database backups
- [ ] Setup Redis persistence

### Phase 14: Feature Enhancements (Priority: Low)

#### Social Features
- [ ] Add post scheduling
- [ ] Add post drafts
- [ ] Add post analytics
- [ ] Add user mentions (@username)
- [ ] Add hashtags (#topic)

#### Messaging Features
- [ ] Add message reactions
- [ ] Add message forwarding
- [ ] Add voice messages
- [ ] Add video calls

#### Notification Features
- [ ] Add notification preferences
- [ ] Add notification grouping
- [ ] Add push notification (FCM)
- [ ] Add email notifications

#### Search Features
- [ ] Implement full-text search (Elasticsearch)
- [ ] Add search suggestions
- [ ] Add search filters
- [ ] Add search history

---

## 🐛 Known Issues

### High Priority
- [ ] Fix slow query: User connections count
  - Current: 3 separate queries
  - Target: 1 query with joins or cached result

- [ ] Fix cache invalidation race condition
  - Issue: Cache might be stale after update
  - Solution: Use cache versioning or TTL

### Medium Priority
- [ ] Optimize feed query performance
  - Current: ~500ms for 20 posts
  - Target: <100ms

- [ ] Fix WebSocket connection drops
  - Issue: Connections drop after 5 minutes
  - Solution: Implement heartbeat

### Low Priority
- [ ] Improve error messages
  - Make error messages more user-friendly
  - Add error codes for client handling

---

## 💡 Ideas for Future

### AI Features
- [ ] Content moderation with AI
- [ ] Smart feed ranking
- [ ] Spam detection
- [ ] Image recognition for auto-tagging

### Analytics
- [ ] User behavior analytics
- [ ] Content performance analytics
- [ ] Engagement metrics
- [ ] Revenue analytics (if monetized)

### Gamification
- [ ] User levels and badges
- [ ] Daily tasks and rewards
- [ ] Leaderboards
- [ ] Achievements

### Monetization
- [ ] Premium subscriptions
- [ ] Ads system
- [ ] Virtual goods marketplace
- [ ] Creator monetization

---

## 📊 Progress Tracking

### Overall Progress
- ✅ Core Infrastructure: 100%
- ✅ Cache System: 100%
- ✅ Monitoring: 100%
- ✅ Reliability: 100%
- ✅ Core Modules: 100%
- 🔄 Advanced Features: 50% (Selective Warmup ✅)
- 🔄 Performance Optimization: 30% (Database Indexes ✅)
- ⏳ Scalability: 0%
- ⏳ Advanced Monitoring: 0%
- ⏳ Security Enhancements: 0%
- ⏳ Testing: 0%
- ⏳ Documentation: 30%
- ⏳ DevOps: 0%
- ⏳ Feature Enhancements: 0%

### Sprint Planning

#### Current Sprint (Sprint 6)
**Goal**: Advanced Features & Performance Optimization
- [ ] Selective cache warmup
- [ ] Feed algorithm optimization
- [ ] Add missing database indexes
- [ ] Optimize slow queries

#### Next Sprint (Sprint 7)
**Goal**: Scalability & Distributed Systems
- [ ] Implement Redlock
- [ ] Add message queue (BullMQ)
- [ ] Setup load balancer
- [ ] Add health check endpoint

#### Future Sprints
- Sprint 8: Advanced Monitoring & Logging
- Sprint 9: Security Enhancements
- Sprint 10: Testing & Documentation

---

## 🎯 Success Metrics

### Performance
- ✅ API response time < 200ms (95th percentile)
- ✅ Cache hit rate > 80%
- ⏳ Database query time < 100ms (95th percentile)
- ⏳ Feed load time < 500ms

### Reliability
- ✅ Uptime > 99.9%
- ✅ Error rate < 0.1%
- ⏳ Zero data loss
- ⏳ Graceful degradation on failures

### Scalability
- ⏳ Support 10,000 concurrent users
- ⏳ Handle 1,000 requests/second
- ⏳ Horizontal scaling ready
- ⏳ Multi-region deployment ready

### Security
- ✅ No critical vulnerabilities
- ✅ All inputs validated
- ⏳ GDPR compliant
- ⏳ SOC 2 compliant

---

## 📝 Notes

### Khi làm task mới:
1. Đọc `PROJECT_STRUCTURE.md` để hiểu cấu trúc
2. Đọc `PROJECT_CONTEXT.md` để hiểu conventions
3. Check task trong file này
4. Tạo branch mới: `feature/task-name`
5. Implement + test
6. Update documentation
7. Create PR

### Khi gặp vấn đề:
1. Check logs với traceId
2. Check metrics (/metrics/json)
3. Check slow queries (/admin/performance/slow-queries)
4. Check cache status (/admin/cache/status)
5. Review related documentation

### Khi optimize performance:
1. Measure first (metrics, logs)
2. Identify bottleneck
3. Implement fix
4. Measure again
5. Document the change
