import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

export interface PostScore {
  postId: string;
  score: number;
  recency: number;
  engagement: number;
  authorPopularity: number;
  userInteraction: number;
  contentQuality: number;
}

export interface RankingWeights {
  recency: number;
  engagement: number;
  authorPopularity: number;
  userInteraction: number;
  contentQuality: number;
}

/**
 * RankingService - Xếp hạng bài viết thông minh
 * 
 * Sử dụng 5 yếu tố để tính điểm:
 * 1. Recency (30%): Độ mới của bài viết
 * 2. Engagement (25%): Tương tác (likes, comments, shares)
 * 3. Author Popularity (20%): Độ nổi tiếng của tác giả
 * 4. User Interaction (15%): Tương tác cá nhân với tác giả
 * 5. Content Quality (10%): Chất lượng nội dung
 */
@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  // Trọng số mặc định cho ranking
  private readonly defaultWeights: RankingWeights = {
    recency: 0.3,
    engagement: 0.25,
    authorPopularity: 0.2,
    userInteraction: 0.15,
    contentQuality: 0.1,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Xếp hạng danh sách bài viết
   */
  async rankPosts(posts: any[], userId: string): Promise<any[]> {
    if (posts.length === 0) return posts;

    // Lấy user interactions từ cache hoặc database
    const interactions = await this.getUserInteractions(userId);

    // Tính điểm cho từng bài viết
    const postsWithScores = posts.map((post) => {
      const score = this.calculatePostScore(post, userId, interactions);
      return {
        ...post,
        _ranking_score: score.score,
        _ranking_details: score,
      };
    });

    // Sắp xếp theo điểm giảm dần
    postsWithScores.sort((a, b) => b._ranking_score - a._ranking_score);

    // Apply diversity: Tối đa 3 bài/tác giả
    const diversePosts = this.applyDiversity(postsWithScores, 3);

    return diversePosts;
  }

  /**
   * Tính điểm cho một bài viết
   */
  private calculatePostScore(
    post: any,
    userId: string,
    userInteractions: Map<string, number>,
  ): PostScore {
    const recency = this.calculateRecencyScore(post.created_at);
    const engagement = this.calculateEngagementScore(post);
    const authorPopularity = this.calculateAuthorPopularityScore(post);
    const userInteraction = this.calculateUserInteractionScore(post.user_id, userInteractions);
    const contentQuality = this.calculateContentQualityScore(post);

    const weights = this.defaultWeights;
    const score =
      recency * weights.recency +
      engagement * weights.engagement +
      authorPopularity * weights.authorPopularity +
      userInteraction * weights.userInteraction +
      contentQuality * weights.contentQuality;

    return {
      postId: post.id,
      score,
      recency,
      engagement,
      authorPopularity,
      userInteraction,
      contentQuality,
    };
  }

  /**
   * Điểm recency: Bài mới hơn → điểm cao hơn
   * Sử dụng exponential decay: score = e^(-λt)
   */
  private calculateRecencyScore(createdAt: Date): number {
    const now = Date.now();
    const postTime = new Date(createdAt).getTime();
    const ageInHours = (now - postTime) / (1000 * 60 * 60);

    // λ = 0.1 → half-life ~7 giờ
    const lambda = 0.1;
    const score = Math.exp(-lambda * ageInHours);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Điểm engagement: Nhiều tương tác → điểm cao hơn
   * Likes: 1x, Comments: 3x, Shares: 5x
   */
  private calculateEngagementScore(post: any): number {
    const likes = post._count?.likes || post.like_count || 0;
    const comments = post._count?.comments || post.comment_count || 0;
    const shares = post.share_count || 0;

    // Weighted engagement
    const totalEngagement = likes + comments * 3 + shares * 5;

    // Normalize bằng logarithmic scale
    const score = Math.log10(totalEngagement + 1) / Math.log10(1000);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Điểm author popularity: Tác giả nổi tiếng → điểm cao hơn
   * Dựa trên số followers
   */
  private calculateAuthorPopularityScore(post: any): number {
    // Nếu có follower count trong post data
    const followerCount = post.user?.follower_count || 0;

    // Normalize: 10,000 followers = max score
    const score = Math.log10(followerCount + 1) / Math.log10(10000);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Điểm user interaction: User hay tương tác với tác giả → điểm cao hơn
   */
  private calculateUserInteractionScore(
    authorId: string,
    userInteractions: Map<string, number>,
  ): number {
    const interactionCount = userInteractions.get(authorId) || 0;

    // Normalize: 10+ interactions = max score
    const score = interactionCount / 10;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Điểm content quality: Nội dung chất lượng → điểm cao hơn
   * Dựa trên: media, hashtags, độ dài content
   */
  private calculateContentQualityScore(post: any): number {
    let score = 0;

    // Có media: +0.3
    if (post.media && post.media.length > 0) {
      score += 0.3;
    }

    // Có hashtags: +0.2
    if (post.hashtags && post.hashtags.length > 0) {
      score += 0.2;
    }

    // Độ dài content tối ưu (100-500 chars): +0.5
    const contentLength = post.content?.length || 0;
    if (contentLength >= 100 && contentLength <= 500) {
      score += 0.5;
    } else if (contentLength > 50) {
      score += 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Apply diversity: Tránh quá nhiều bài từ 1 tác giả
   */
  private applyDiversity(posts: any[], maxPerAuthor: number = 3): any[] {
    const authorCounts = new Map<string, number>();
    const diversePosts: any[] = [];

    for (const post of posts) {
      const authorId = post.user_id || post.user?.id;
      const count = authorCounts.get(authorId) || 0;

      if (count < maxPerAuthor) {
        diversePosts.push(post);
        authorCounts.set(authorId, count + 1);
      }
    }

    return diversePosts;
  }

  /**
   * Lấy user interactions từ cache hoặc database
   */
  private async getUserInteractions(userId: string): Promise<Map<string, number>> {
    const cacheKey = `user:interactions:${userId}`;

    // Try cache first
    const cached = await this.cacheService.get<Record<string, number>>(cacheKey);
    if (cached) {
      return new Map(Object.entries(cached));
    }

    // Calculate from database
    const interactions = await this.calculateUserInteractions(userId);

    // Cache for 1 hour
    const data = Object.fromEntries(interactions);
    await this.cacheService.set(cacheKey, data, 3600);

    return interactions;
  }

  /**
   * Tính user interactions từ database
   */
  private async calculateUserInteractions(userId: string): Promise<Map<string, number>> {
    const interactions = new Map<string, number>();

    try {
      // Lấy likes, comments, messages song song
      const [likes, comments, messages] = await Promise.all([
        // Likes của user lên bài của người khác
        this.prisma.resPostLike.groupBy({
          by: ['user_id'],
          where: {
            post: {
              user_id: { not: userId },
            },
            user_id: userId,
          },
          _count: true,
        }),
        // Comments của user lên bài của người khác
        this.prisma.resComment.groupBy({
          by: ['user_id'],
          where: {
            post: {
              user_id: { not: userId },
            },
            user_id: userId,
          },
          _count: true,
        }),
        // Messages user gửi cho người khác
        this.prisma.resMessage.groupBy({
          by: ['receiver_id'],
          where: {
            sender_id: userId,
            receiver_id: { not: null },
          },
          _count: true,
        }),
      ]);

      // Aggregate interactions
      // Likes: 1 point
      likes.forEach((item) => {
        const count = interactions.get(item.user_id) || 0;
        interactions.set(item.user_id, count + item._count);
      });

      // Comments: 2 points (more valuable)
      comments.forEach((item) => {
        const count = interactions.get(item.user_id) || 0;
        interactions.set(item.user_id, count + item._count * 2);
      });

      // Messages: 3 points (most valuable)
      messages.forEach((item) => {
        if (item.receiver_id) {
          const count = interactions.get(item.receiver_id) || 0;
          interactions.set(item.receiver_id, count + item._count * 3);
        }
      });
    } catch (error) {
      this.logger.error(`Error calculating user interactions: ${error.message}`);
    }

    return interactions;
  }

  /**
   * Invalidate user interactions cache
   */
  async invalidateUserInteractions(userId: string): Promise<void> {
    const cacheKey = `user:interactions:${userId}`;
    await this.cacheService.del(cacheKey);
  }
}
