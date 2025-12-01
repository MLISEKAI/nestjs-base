# Cache Monitoring & Operations Guide

## 📊 Prometheus Metrics

### Available Metrics

```
# Cache warmup duration
cache_warmup_duration_seconds - Duration of cache warmup in seconds

# Cache warmup status
cache_warmup_status{status="idle|running|completed|failed"} - Current warmup status

# Cache hits/misses
cache_hits_total - Total number of cache hits
cache_misses_total - Total number of cache misses

# Keys warmed
cache_keys_warmed - Number of keys warmed in last warmup

# Redis memory
redis_memory_usage_bytes - Redis memory usage in bytes

# Last warmup timestamp
cache_last_warmup_timestamp - Unix timestamp of last warmup
```

### Endpoints

- **Prometheus format**: `GET /metrics`
- **JSON format**: `GET /metrics/json`
- **Alerts**: `GET /metrics/alerts`

### Example Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: 'nestjs-cache'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

## 🚨 Alerting

### Alert Rules

```yaml
groups:
  - name: cache_alerts
    rules:
      # Alert when warmup takes too long
      - alert: CacheWarmupSlow
        expr: cache_warmup_duration_seconds > 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Cache warmup is slow"
          description: "Cache warmup took {{ $value }}s (threshold: 10s)"

      # Alert when warmup fails
      - alert: CacheWarmupFailed
        expr: cache_warmup_status{status="failed"} == 3
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Cache warmup failed"
          description: "Cache warmup has failed"

      # Alert on high cache miss rate
      - alert: HighCacheMissRate
        expr: |
          (
            rate(cache_misses_total[5m]) / 
            (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
          ) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High cache miss rate"
          description: "Cache miss rate is {{ $value | humanizePercentage }}"

      # Alert on slow queries spike
      - alert: SlowQueriesSpike
        expr: rate(slow_queries_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Slow queries spike detected"
          description: "Slow queries rate: {{ $value }}/s"
```

## 📝 Logging with TraceId

All cache warmup operations include a `traceId` for end-to-end tracing:

```typescript
// Example log output
{
  "level": "info",
  "message": "🔥 Starting cache warm-up...",
  "traceId": "warmup-1701432000000-abc123xyz",
  "timestamp": "2025-12-01T09:00:00.000Z"
}
```

### Searching Logs by TraceId

```bash
# Using grep
grep "warmup-1701432000000-abc123xyz" logs/app.log

# Using jq for JSON logs
cat logs/app.log | jq 'select(.traceId == "warmup-1701432000000-abc123xyz")'
```

## 📈 Dashboard Metrics

### Key Metrics to Display

1. **Last Warmup Time**: `cache_last_warmup_timestamp`
2. **Warmup Duration**: `cache_warmup_duration_seconds`
3. **Keys Warmed**: `cache_keys_warmed`
4. **Redis Memory**: `redis_memory_usage_bytes`
5. **Cache Hit Rate**: `cache_hits_total / (cache_hits_total + cache_misses_total)`
6. **Cache Miss Rate**: `cache_misses_total / (cache_hits_total + cache_misses_total)`

### Grafana Dashboard Example

```json
{
  "dashboard": {
    "title": "Cache Monitoring",
    "panels": [
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))"
          }
        ]
      },
      {
        "title": "Warmup Duration",
        "targets": [
          {
            "expr": "cache_warmup_duration_seconds"
          }
        ]
      },
      {
        "title": "Redis Memory Usage",
        "targets": [
          {
            "expr": "redis_memory_usage_bytes"
          }
        ]
      }
    ]
  }
}
```

## 🔧 Admin Operations

### Endpoints (Authenticated)

All admin endpoints require JWT authentication and are rate-limited:

- **Get Status**: `GET /admin/cache/status`
  - Rate limit: 5 requests/minute
  
- **Manual Warmup**: `POST /admin/cache/warm-up`
  - Rate limit: 2 requests/minute
  
- **Clear Cache**: `POST /admin/cache/clear`
  - Rate limit: 2 requests/minute

### Example Usage

```bash
# Get cache status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/admin/cache/status

# Manual warmup
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/admin/cache/warm-up

# Clear all cache
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/admin/cache/clear
```

## 🔄 Auto Refresh & Scheduling

### Scheduled Warmup

Cache automatically warms up:
- **On server start** (after 500ms delay)
- **Every 30 minutes** (via cron)

### Configuration

```bash
# Disable auto warmup
SKIP_CACHE_WARMUP=1

# Disable in test environment (automatic)
NODE_ENV=test
```

### Manual Trigger Events

You can trigger selective warmup on specific events:

```typescript
// Example: Trigger warmup after user batch import
await cacheWarmingService.manualWarmUp();

// Example: Trigger warmup after config update
await cacheWarmingService.manualWarmUp();
```

## 🛡️ Reliability Features

### 1. Atomic Redis Lock

Uses Redis `SET NX EX` for atomic lock acquisition:

```typescript
// Atomic lock with 30s expiry
const lockAcquired = await redis.set(lockKey, traceId, 'NX', 'EX', 30);
```

### 2. Retry with Exponential Backoff

Automatically retries failed operations:
- **Max retries**: 3
- **Initial delay**: 1s
- **Backoff**: Exponential (1s, 2s, 4s)

### 3. Timeouts

Each operation has a timeout:
- **Query timeout**: 1s per query
- **Total warmup timeout**: Managed by lock TTL (30s)

### 4. Rate Limiting

Admin endpoints are rate-limited to prevent abuse:
- **Default**: 5 requests/minute
- **Warmup/Clear**: 2 requests/minute

### 5. Graceful Degradation

- Operations fail gracefully if Redis is unavailable
- Logs errors without crashing the application
- Uses `Promise.allSettled` for parallel operations

## 🔍 Troubleshooting

### Warmup Taking Too Long

1. Check slow queries: `GET /admin/performance/slow-queries`
2. Review database indexes
3. Consider reducing warmup scope

### High Cache Miss Rate

1. Check if cache is being invalidated too frequently
2. Review TTL settings
3. Consider increasing memory cache size

### Redis Memory Issues

1. Monitor: `GET /metrics/json` → `redis_memory_usage_bytes`
2. Check Redis maxmemory policy
3. Consider eviction strategy (LRU, LFU)

### Lock Contention

If multiple instances are competing for lock:
1. Check logs for "already running" messages
2. Consider increasing lock TTL
3. Implement Redlock for distributed locks

## 📚 Best Practices

1. **Monitor metrics regularly** - Set up Grafana dashboards
2. **Configure alerts** - Don't wait for issues to be reported
3. **Use traceId** - Always include traceId when investigating issues
4. **Test warmup** - Regularly test manual warmup to ensure it works
5. **Review slow queries** - Use performance monitoring to optimize
6. **Adjust TTLs** - Based on data change frequency
7. **Scale Redis** - If memory usage is high, consider Redis cluster
8. **Rate limit wisely** - Adjust rate limits based on your needs

## 🚀 Future Improvements

- [ ] Selective warmup for specific users/data
- [ ] Distributed lock with Redlock
- [ ] Cache warming priority queue
- [ ] Predictive cache warming based on usage patterns
- [ ] Cache warming metrics per key type
- [ ] Integration with APM tools (New Relic, DataDog)
