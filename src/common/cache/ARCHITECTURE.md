# Cache Warming Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           CacheWarmingService (Scheduler)              │    │
│  │  • On server start (500ms delay)                       │    │
│  │  • Every 30 minutes (cron)                             │    │
│  │  • Manual trigger via admin endpoint                   │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Warmup Process (with TraceId)             │    │
│  │  1. Acquire atomic Redis lock (SET NX EX)              │    │
│  │  2. Warm DB connection pool                            │    │
│  │  3. Warm top users (parallel)                          │    │
│  │  4. Warm user search                                   │    │
│  │  5. Release lock                                       │    │
│  │                                                         │    │
│  │  Features:                                             │    │
│  │  • Retry with exponential backoff (3x)                 │    │
│  │  • Timeout per operation (1s)                          │    │
│  │  • Graceful degradation (Promise.allSettled)           │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  CacheService (2-Layer)                │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │  L1: Memory Cache (LRU, <1ms)                │     │    │
│  │  │  • Max 1000 items                            │     │    │
│  │  │  • Tracks hits/misses                        │     │    │
│  │  └──────────────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │  L2: Redis Cache (~50-100ms)                 │     │    │
│  │  │  • Unlimited size                            │     │    │
│  │  │  • Persistent across restarts                │     │    │
│  │  └──────────────────────────────────────────────┘     │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              MetricsService (Prometheus)               │    │
│  │  • cache_warmup_duration_seconds                       │    │
│  │  • cache_warmup_status                                 │    │
│  │  • cache_hits_total / cache_misses_total               │    │
│  │  • cache_keys_warmed                                   │    │
│  │  • redis_memory_usage_bytes                            │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────┐
    │         External Monitoring               │
    ├───────────────────────────────────────────┤
    │  • Prometheus (scrapes /metrics)          │
    │  • Grafana (dashboards)                   │
    │  • AlertManager (notifications)           │
    └───────────────────────────────────────────┘
```

## Request Flow

### Cache Hit Flow
```
User Request
    │
    ▼
┌─────────────────┐
│  CacheService   │
└────────┬────────┘
         │
         ▼
    Check L1 (Memory)
         │
    ┌────┴────┐
    │  Hit?   │
    └────┬────┘
         │ Yes
         ▼
    Record Hit Metric
         │
         ▼
    Return Data
```

### Cache Miss Flow
```
User Request
    │
    ▼
┌─────────────────┐
│  CacheService   │
└────────┬────────┘
         │
         ▼
    Check L1 (Memory)
         │
    ┌────┴────┐
    │  Hit?   │
    └────┬────┘
         │ No
         ▼
    Check L2 (Redis)
         │
    ┌────┴────┐
    │  Hit?   │
    └────┬────┘
         │ No
         ▼
    Record Miss Metric
         │
         ▼
    Fetch from Database
         │
         ▼
    Store in L1 + L2
         │
         ▼
    Return Data
```

## Warmup Flow with Reliability

```
┌─────────────────────────────────────────────────────────────┐
│                    Warmup Triggered                         │
│  (Server start / Cron / Manual)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  Generate TraceId
                         │
                         ▼
            ┌────────────────────────┐
            │  Try Acquire Lock      │
            │  (SET NX EX 30s)       │
            └────────┬───────────────┘
                     │
            ┌────────┴────────┐
            │  Lock Acquired? │
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        │ No         │ Yes        │
        ▼            ▼            │
    Skip (Log)   Start Warmup    │
                     │            │
                     ▼            │
        ┌────────────────────┐   │
        │  Warm DB Connection│   │
        │  (with retry 3x)   │   │
        └────────┬───────────┘   │
                 │                │
                 ▼                │
        ┌────────────────────┐   │
        │  Warm Top Users    │   │
        │  (parallel)        │   │
        │  (with retry 3x)   │   │
        └────────┬───────────┘   │
                 │                │
                 ▼                │
        ┌────────────────────┐   │
        │  Warm User Search  │   │
        │  (with retry 3x)   │   │
        └────────┬───────────┘   │
                 │                │
                 ▼                │
        ┌────────────────────┐   │
        │  Record Metrics    │   │
        │  • Duration        │   │
        │  • Keys warmed     │   │
        │  • Status          │   │
        └────────┬───────────┘   │
                 │                │
                 ▼                │
        ┌────────────────────┐   │
        │  Release Lock      │   │
        │  (if still owner)  │   │
        └────────────────────┘   │
                                  │
                                  ▼
                            Log Complete
                         (with traceId)
```

## Retry Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    Execute Operation                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Try with Timeout (1s) │
            └────────┬───────────────┘
                     │
            ┌────────┴────────┐
            │   Success?      │
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        │ Yes        │ No         │
        ▼            ▼            │
    Return       Attempt < 3?    │
                     │            │
        ┌────────────┼────────────┤
        │ Yes        │ No         │
        ▼            ▼            │
    Wait (exp)   Throw Error     │
    1s→2s→4s                      │
        │                         │
        └─────────────────────────┘
```

## Multi-Instance Safety

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Instance 1  │    │  Instance 2  │    │  Instance 3  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │ Warmup trigger    │ Warmup trigger    │ Warmup trigger
       │                   │                   │
       ▼                   ▼                   ▼
   Try Lock            Try Lock            Try Lock
       │                   │                   │
       ▼                   ▼                   ▼
   ┌────────────────────────────────────────────┐
   │              Redis Lock                    │
   │  Key: cache:warmup:lock                    │
   │  Value: traceId                            │
   │  TTL: 30s                                  │
   └────────────────────────────────────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   SUCCESS             FAIL (skip)         FAIL (skip)
       │
       ▼
   Execute Warmup
       │
       ▼
   Release Lock
```

## Admin Endpoints with Rate Limiting

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Request                            │
│  (with JWT authentication)                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Check Authentication  │
            └────────┬───────────────┘
                     │
            ┌────────┴────────┐
            │  Authenticated? │
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        │ No         │ Yes        │
        ▼            ▼            │
    401 Error   Check Rate Limit │
                     │            │
            ┌────────┴────────┐  │
            │  Within Limit?  │  │
            └────────┬────────┘  │
                     │            │
        ┌────────────┼────────────┤
        │ No         │ Yes        │
        ▼            ▼            │
    429 Error   Execute Action   │
                     │            │
                     ▼            │
                Return Result    │
                                  │
Rate Limits:                      │
• GET /status: 5/min              │
• POST /warm-up: 2/min            │
• POST /clear: 2/min              │
```

## Monitoring & Alerting Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Events                       │
│  • Cache hit/miss                                           │
│  • Warmup start/complete/fail                               │
│  • Redis memory usage                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   MetricsService       │
            │  (in-memory counters)  │
            └────────┬───────────────┘
                     │
                     ▼
            ┌────────────────────────┐
            │  /metrics endpoint     │
            │  (Prometheus format)   │
            └────────┬───────────────┘
                     │
                     ▼
            ┌────────────────────────┐
            │    Prometheus          │
            │  (scrapes every 15s)   │
            └────────┬───────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Grafana │  │ Alert   │  │  Logs   │
   │Dashboard│  │ Manager │  │ (TraceId)│
   └─────────┘  └─────────┘  └─────────┘
                     │
                     ▼
            ┌────────────────────────┐
            │   Notifications        │
            │  • Slack               │
            │  • PagerDuty           │
            │  • Email               │
            └────────────────────────┘
```

## Key Design Decisions

### 1. Two-Layer Cache
- **L1 (Memory)**: Ultra-fast, limited size
- **L2 (Redis)**: Slower but persistent and unlimited

### 2. Atomic Lock
- Uses Redis `SET NX EX` for atomicity
- Prevents race conditions in multi-instance deployments
- Lock owner verification before release

### 3. Retry Strategy
- Exponential backoff prevents thundering herd
- Max 3 retries balances reliability vs. speed
- Per-operation timeout prevents hanging

### 4. Graceful Degradation
- `Promise.allSettled` continues on partial failures
- Logs errors without crashing
- Returns partial results when possible

### 5. Observability
- TraceId for end-to-end tracing
- Prometheus metrics for monitoring
- Built-in alerting logic

### 6. Security
- JWT authentication for admin endpoints
- Rate limiting prevents abuse
- Separate limits for dangerous operations
