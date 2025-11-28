// Import các decorator và class từ NestJS
import { Injectable, Inject, Logger } from '@nestjs/common';
// Import decorator để inject Redis client
import { InjectRedis } from '@nestjs-modules/ioredis';
// Import Redis client type
import Redis from 'ioredis';

/**
 * @Injectable() - Decorator đánh dấu class này là một NestJS service
 * CacheService - Service quản lý Redis cache để tối ưu performance
 * Cache giúp giảm số lần query database bằng cách lưu kết quả vào Redis
 */
@Injectable()
export class CacheService {
  // Logger để ghi log, giúp debug và theo dõi hoạt động
  private readonly logger = new Logger(CacheService.name);
  // Default TTL (Time To Live) = 3600 giây (1 giờ)
  // Đây là thời gian mặc định mà cache sẽ tồn tại trước khi expire
  private readonly defaultTtl = 3600; // 1 hour
  // Flag để track trạng thái kết nối Redis
  // Nếu false, các operations sẽ fail gracefully (không throw error)
  private isRedisConnected = false;
  // Flag để tránh log connection error nhiều lần (tránh spam log)
  private hasLoggedConnectionError = false;

  /**
   * Constructor - Dependency Injection
   * @InjectRedis() - Inject Redis client được cấu hình trong module
   */
  constructor(@InjectRedis() private readonly redis: Redis) {
    // Setup Redis event handlers để theo dõi trạng thái kết nối

    // Event: Khi Redis kết nối thành công
    this.redis.on('connect', () => {
      this.isRedisConnected = true; // Đánh dấu đã kết nối
      this.hasLoggedConnectionError = false; // Reset flag để có thể log lại nếu có lỗi sau này
      this.logger.log('Redis connected successfully');
    });

    // Event: Khi có lỗi kết nối Redis
    this.redis.on('error', (error) => {
      this.isRedisConnected = false; // Đánh dấu đã mất kết nối
      // Chỉ log connection error 1 lần để tránh spam log
      if (!this.hasLoggedConnectionError) {
        const errorMsg = error.message || String(error);
        // Nếu là lỗi connection refused (Redis chưa start) thì log warning
        if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Connection')) {
          this.logger.warn(
            'Redis is not available. Cache will be disabled. To enable caching, start Redis server.',
          );
        } else {
          // Các lỗi khác thì log warning với message
          this.logger.warn('Redis connection error:', errorMsg);
        }
        this.hasLoggedConnectionError = true; // Đánh dấu đã log để không log lại
      }
    });

    // Event: Khi Redis đóng kết nối
    this.redis.on('close', () => {
      this.isRedisConnected = false; // Đánh dấu đã mất kết nối
      // Không log close events để tránh spam log
    });

    // Không cố gắng kết nối ngay lập tức - để nó kết nối khi có request đầu tiên
    // Điều này tránh connection spam khi khởi động nếu Redis không available
  }

  /**
   * Lấy giá trị từ cache
   * @param key - Cache key cần lấy
   * @returns Giá trị đã được parse từ JSON, hoặc null nếu không tìm thấy hoặc Redis không kết nối
   * @template T - Type của giá trị trả về
   */
  async get<T>(key: string): Promise<T | null> {
    // Kiểm tra Redis đã kết nối chưa
    // Nếu chưa kết nối, trả về null ngay (fail gracefully)
    if (!this.isRedisConnected) {
      return null; // Fail silently if Redis is not connected
    }
    try {
      // Lấy giá trị từ Redis (dạng string JSON)
      const value = await this.redis.get(key);
      // Nếu không tìm thấy (null hoặc undefined), trả về null
      if (!value) return null;
      // Parse JSON string thành object/array và cast về type T
      return JSON.parse(value) as T;
    } catch (error) {
      // Không log connection errors nhiều lần (tránh spam log)
      // Chỉ log các lỗi khác (parse error, etc.)
      if (!error.message?.includes('ECONNREFUSED') && !error.message?.includes('Connection')) {
        this.logger.debug(`Cache get error for key ${key}:`, error.message);
      }
      // Trả về null nếu có lỗi (fail gracefully)
      return null;
    }
  }

  /**
   * Lưu giá trị vào cache
   * @param key - Cache key để lưu
   * @param value - Giá trị cần lưu (sẽ được serialize thành JSON)
   * @param ttl - Thời gian sống của cache (giây), mặc định 1 giờ
   */
  async set(key: string, value: any, ttl: number = this.defaultTtl): Promise<void> {
    // Kiểm tra Redis đã kết nối chưa
    if (!this.isRedisConnected) {
      return; // Fail silently if Redis is not connected
    }
    try {
      // Serialize value thành JSON string để lưu vào Redis
      const serialized = JSON.stringify(value);
      // Lưu vào Redis với TTL (Time To Live)
      // setex = set với expire time (key, ttl seconds, value)
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      // Không log connection errors nhiều lần
      if (!error.message?.includes('ECONNREFUSED') && !error.message?.includes('Connection')) {
        this.logger.debug(`Cache set error for key ${key}:`, error.message);
      }
    }
  }

  /**
   * Xóa một key khỏi cache
   * @param key - Cache key cần xóa
   */
  async del(key: string): Promise<void> {
    // Kiểm tra Redis đã kết nối chưa
    if (!this.isRedisConnected) {
      return; // Fail silently if Redis is not connected
    }
    try {
      // Xóa key khỏi Redis
      await this.redis.del(key);
    } catch (error) {
      // Không log connection errors nhiều lần
      // Bao gồm cả lỗi "Stream isn't writeable" (Redis đang disconnect)
      if (
        !error.message?.includes('ECONNREFUSED') &&
        !error.message?.includes('Connection') &&
        !error.message?.includes("Stream isn't writeable")
      ) {
        this.logger.debug(`Cache delete error for key ${key}:`, error.message);
      }
    }
  }

  /**
   * Xóa nhiều keys khớp với pattern
   * @param pattern - Pattern để tìm keys (ví dụ: "post:123:*" sẽ xóa tất cả keys bắt đầu bằng "post:123:")
   *
   * Ví dụ:
   * - Pattern: "notifications:user-123:*"
   * - Sẽ tìm và xóa: "notifications:user-123:page:1:limit:20", "notifications:user-123:unread:count", etc.
   */
  async delPattern(pattern: string): Promise<void> {
    // Kiểm tra Redis đã kết nối chưa
    if (!this.isRedisConnected) {
      return; // Fail silently if Redis is not connected
    }
    try {
      // Tìm tất cả keys khớp với pattern
      // Lưu ý: keys() có thể chậm nếu có nhiều keys, nhưng phù hợp cho invalidate cache
      const keys = await this.redis.keys(pattern);
      // Nếu có keys thì xóa tất cả
      if (keys.length > 0) {
        // del() có thể nhận nhiều keys cùng lúc
        await this.redis.del(...keys);
      }
    } catch (error) {
      // Không log connection errors nhiều lần
      if (
        !error.message?.includes('ECONNREFUSED') &&
        !error.message?.includes('Connection') &&
        !error.message?.includes("Stream isn't writeable")
      ) {
        this.logger.debug(`Cache delete pattern error for ${pattern}:`, error.message);
      }
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isRedisConnected) {
      return false; // Fail silently if Redis is not connected
    }
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      // Don't log connection errors repeatedly
      if (
        !error.message?.includes('ECONNREFUSED') &&
        !error.message?.includes('Connection') &&
        !error.message?.includes("Stream isn't writeable")
      ) {
        this.logger.debug(`Cache exists error for key ${key}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Pattern cache-aside: Lấy từ cache nếu có, không thì fetch từ source và cache lại
   * Đây là pattern phổ biến nhất để sử dụng cache
   * @param key - Cache key
   * @param fetchFn - Function để fetch dữ liệu từ source (database, API, etc.) nếu không có trong cache
   * @param ttl - Thời gian sống của cache (giây), mặc định 1 giờ
   * @returns Giá trị từ cache hoặc từ source
   * @template T - Type của giá trị trả về
   *
   * Flow:
   * 1. Kiểm tra cache có giá trị không
   * 2. Nếu có => trả về ngay (cache hit)
   * 3. Nếu không => gọi fetchFn() để lấy từ source
   * 4. Cache giá trị vừa fetch
   * 5. Trả về giá trị
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>, // Function async để fetch dữ liệu từ source
    ttl: number = this.defaultTtl, // TTL mặc định 1 giờ
  ): Promise<T> {
    // Thử lấy từ cache, nhưng nếu Redis không kết nối thì bỏ qua cache
    if (this.isRedisConnected) {
      const cached = await this.get<T>(key);
      // Nếu có trong cache (cache hit), trả về ngay
      if (cached !== null) {
        return cached;
      }
    }

    // Nếu không có trong cache (cache miss), fetch từ source (database, API, etc.)
    const value = await fetchFn();

    // Thử cache giá trị vừa fetch, nhưng không fail nếu Redis không kết nối
    if (this.isRedisConnected) {
      await this.set(key, value, ttl);
    }

    // Trả về giá trị (từ source)
    return value;
  }

  /**
   * Xóa tất cả cache liên quan đến một user
   * Hữu ích khi user update profile, settings, etc.
   * @param user_id - ID của user cần invalidate cache
   */
  async invalidateUserCache(user_id: string): Promise<void> {
    // Xóa tất cả cache keys bắt đầu bằng "user:${user_id}:*"
    // Ví dụ: user:123:profile, user:123:settings, user:123:posts, etc.
    await this.delPattern(`user:${user_id}:*`);
    // Xóa tất cả cache keys bắt đầu bằng "profile:${user_id}:*"
    // Ví dụ: profile:123:info, profile:123:stats, etc.
    await this.delPattern(`profile:${user_id}:*`);
  }

  /**
   * Xóa tất cả cache trong Redis
   * CẢNH BÁO: Method này sẽ xóa toàn bộ cache, chỉ dùng khi cần thiết (ví dụ: maintenance)
   */
  async flushAll(): Promise<void> {
    // Kiểm tra Redis đã kết nối chưa
    if (!this.isRedisConnected) {
      return; // Fail silently if Redis is not connected
    }
    try {
      // Xóa tất cả keys trong Redis (flushall command)
      await this.redis.flushall();
    } catch (error) {
      // Không log connection errors nhiều lần
      if (
        !error.message?.includes('ECONNREFUSED') &&
        !error.message?.includes('Connection') &&
        !error.message?.includes("Stream isn't writeable")
      ) {
        this.logger.debug('Cache flush all error:', error.message);
      }
    }
  }
}
