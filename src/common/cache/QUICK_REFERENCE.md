# Cache Warming - Quick Reference Card

## 🚀 Quick Start

### Check Status
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/admin/cache/status
```

### Manual Warmup
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/admin/cache/warm-up
```

### View Metrics
```bash
# Prometheus format
curl http://localhost:3000/metrics

# JSON format
curl http://localhost:3000/metrics/json

# Alerts
curl http://localhost:3000/metrics/alerts
```

## 📊 Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `cache_warmup_duration_seconds` | Warmup time | > 10s ⚠️ |
| `cache_warmup_status` | Current status | failed 🔴 |
| `cache_hits_total` | Total hits | - |
| `cache_misses_total` | Total misses | > 50% miss rate ⚠️ |
| `cache_keys_warmed` | Keys in last warmup | - |
| `redis_memory_usage_bytes` | Redis memory | Monitor trend |

## 🔧 Configuration

### Environment Variables
```bash
SKIP_CACHE_WARMUP=1    # Disable warmup
NODE_ENV=test          # Auto-disables warmup
```

### Code Configuration
```typescript
// src/common/cache/cache-warming.service.ts
MAX_RETRIES = 3              // Retry attempts
RETRY_DELAY_MS = 1000        // Initial retry delay
QUERY_TIMEOUT_MS = 1000      // Per-query timeout
WARMUP_LOCK_TTL = 30         // Lock expiry (seconds)
```

## 🔄 Scheduling

| Trigger | Timing | Can Disable? |
|---------|--------|--------------|
| Server start | After 500ms | ✅ Yes (env var) |
| Cron | Every 30 min | ✅ Yes (env var) |
| Manual | On-demand | ❌ No |

## 🛡️ Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /admin/cache/status` | 5 | 1 minute |
| `POST /admin/cache/warm-up` | 2 | 1 minute |
| `POST /admin/cache/clear` | 2 | 1 minute |

## 📝 Log Searching

### Find by TraceId
```bash
# Grep
grep "warmup-1701432000000-abc123xyz" logs/app.log

# jq (JSON logs)
cat logs/app.log | jq 'select(.traceId == "warmup-1701432000000-abc123xyz")'
```

### Find Warmup Events
```bash
grep "cache warm-up" logs/app.log
```

### Find Failures
```bash
grep "Cache warm-up failed" logs/app.log
```

## 🚨 Common Issues

### Issue: Warmup Taking Too Long
**Check:**
1. Slow queries: `GET /admin/performance/slow-queries`
2. Database indexes
3. Network latency

**Fix:**
- Optimize queries
- Add indexes
- Reduce warmup scope

### Issue: High Cache Miss Rate
**Check:**
1. Cache invalidation frequency
2. TTL settings
3. Memory cache size

**Fix:**
- Increase TTL
- Increase memory cache size
- Review invalidation logic

### Issue: Lock Contention
**Check:**
1. Logs for "already running" messages
2. Multiple instances competing

**Fix:**
- Increase lock TTL
- Stagger warmup schedules
- Consider Redlock

### Issue: Redis Memory High
**Check:**
1. `GET /metrics/json` → `redis_memory_usage_bytes`
2. Redis maxmemory policy

**Fix:**
- Reduce TTLs
- Configure eviction policy (LRU)
- Scale Redis

## 📈 Prometheus Queries

### Cache Hit Rate
```promql
rate(cache_hits_total[5m]) / 
(rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

### Cache Miss Rate
```promql
rate(cache_misses_total[5m]) / 
(rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

### Average Warmup Duration (5min)
```promql
avg_over_time(cache_warmup_duration_seconds[5m])
```

### Warmup Failures (last hour)
```promql
changes(cache_warmup_status{status="failed"}[1h])
```

## 🎯 Best Practices

### ✅ DO
- Monitor metrics regularly
- Set up alerts for failures
- Use traceId when debugging
- Test manual warmup periodically
- Review slow queries weekly
- Adjust TTLs based on data change frequency

### ❌ DON'T
- Don't disable warmup in production without reason
- Don't ignore slow warmup warnings
- Don't set TTLs too low (causes churn)
- Don't skip authentication on admin endpoints
- Don't manually clear cache frequently

## 🔗 Related Documentation

- **Full Guide**: `CACHE_MONITORING_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`
- **Summary**: `../../../CACHE_IMPROVEMENTS_SUMMARY.md`

## 📞 Support

### Debugging Checklist
1. ✅ Check `/admin/cache/status`
2. ✅ Check `/metrics/alerts`
3. ✅ Search logs by traceId
4. ✅ Review slow queries
5. ✅ Check Redis connection
6. ✅ Verify rate limits not hit

### Useful Commands
```bash
# Check Redis connection
redis-cli ping

# Check Redis memory
redis-cli info memory

# Check Redis keys
redis-cli keys "cache:*"

# Monitor Redis commands
redis-cli monitor

# Check app logs
tail -f logs/app.log | grep "cache"
```

## 🎨 Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `idle` | Not running | Normal |
| `running` | In progress | Wait |
| `completed` | Success | ✅ Good |
| `failed` | Error occurred | 🔴 Investigate |

## 📊 Typical Values

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Warmup duration | < 5s | 5-10s | > 10s |
| Cache hit rate | > 80% | 50-80% | < 50% |
| Keys warmed | 20-30 | 10-20 | < 10 |
| Redis memory | < 1GB | 1-2GB | > 2GB |

## 🔄 Maintenance Tasks

### Daily
- ✅ Check alerts
- ✅ Review metrics dashboard

### Weekly
- ✅ Review slow queries
- ✅ Check cache hit rate trends
- ✅ Verify warmup success rate

### Monthly
- ✅ Review and adjust TTLs
- ✅ Optimize warmup scope
- ✅ Review Redis memory usage
- ✅ Update alert thresholds
