import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { IPaginatedResponse } from 'src/common/interfaces/pagination.interface';
import { SearchMessagesDto } from '../dto/search.dto';
import { RecommendationService } from '../../search/service/recommendation.service';
import { SearchService as DiscoverySearchService } from '../../search/service/search.service';
import { SearchQueryDto } from '../../search/dto/search.dto';
import { SearchType } from 'src/common/enums/search';
import { MessageType } from 'src/common/enums';

type SuggestionItem = {
  userId: string;
  nickname: string;
  avatar: string | null;
  preview: string | null;
  conversationId: string | null;
  lastInteractionAt: Date | null;
};

@Injectable()
export class MessagingSearchService {
  constructor(
    private prisma: PrismaService,
    private recommendationService: RecommendationService,
    private discoverySearchService: DiscoverySearchService,
  ) {}

  /**
   * Tìm kiếm người dùng để bắt đầu cuộc trò chuyện + gợi ý nhanh
   */
  async searchPeople(userId: string, query: SearchMessagesDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const keyword = query?.search?.trim();
    const suggestionLimit = query?.suggestions && query.suggestions > 0 ? query.suggestions : 8;

    const suggestions = await this.buildSuggestions(userId, suggestionLimit);
    let results: IPaginatedResponse<any> = buildPaginatedResponse([], 0, page, take);

    if (keyword) {
      const payload: SearchQueryDto = {
        q: keyword,
        type: SearchType.USERS,
        page,
        limit: take,
      };
      const searchResponse = await this.discoverySearchService.search(payload, userId);
      results = searchResponse as IPaginatedResponse<any>;
    }

    return {
      suggestions,
      results,
    };
  }

  async getSuggestions(userId: string, type?: 'message' | 'group', limit = 8) {
    if (type === 'message' || !type) {
      const users = await this.buildSuggestions(userId, limit);
      return {
        users,
      };
    }

    // Nếu type = group → chỉ trả groups
    if (type === 'group') {
      const groups = await this.prisma.resGroup.findMany({
        where: {
          is_public: true,
        },
        take: limit,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          avatar: true,
          _count: {
            select: { members: true },
          },
        },
      });

      const formattedGroups = groups.map((g) => ({
        id: g.id,
        name: g.name,
        avatar: g.avatar,
        members_count: g._count.members ?? 0,
      }));

      return {
        groups: formattedGroups,
      };
    }
  }

  private async buildSuggestions(userId: string, limit: number): Promise<SuggestionItem[]> {
    if (limit <= 0) {
      return [];
    }

    const recentConversations = await this.prisma.resConversation.findMany({
      where: {
        deleted_at: null,
        participants: {
          some: { user_id: userId, left_at: null },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: limit * 2, // lấy dư để bỏ trùng
      include: {
        participants: {
          where: { user_id: { not: userId }, left_at: null },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                bio: true,
                created_at: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            type: true,
            content: true,
            media_url: true,
            created_at: true,
          },
        },
      },
    });

    const suggestionMap = new Map<string, SuggestionItem>();

    for (const conversation of recentConversations) {
      const lastMessage = conversation.messages[0];
      const preview = this.buildPreview(
        lastMessage?.type as MessageType | undefined,
        lastMessage?.content,
      );
      const lastInteractionAt = lastMessage?.created_at ?? conversation.updated_at ?? null;

      for (const participant of conversation.participants) {
        const user = participant.user;
        if (!user || suggestionMap.has(user.id)) {
          continue;
        }

        suggestionMap.set(user.id, {
          userId: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          preview: preview ?? user.bio ?? null,
          conversationId: conversation.id,
          lastInteractionAt,
        });
      }

      if (suggestionMap.size >= limit) {
        break;
      }
    }

    if (suggestionMap.size < limit) {
      const needed = limit - suggestionMap.size;
      const recommended = (await this.recommendationService.getRecommendedUsers(userId, {
        limit: needed,
      })) as Array<Record<string, any>>;

      for (const user of recommended) {
        if (suggestionMap.has(user.id)) {
          continue;
        }
        suggestionMap.set(user.id, {
          userId: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          preview: user.bio ?? 'Người dùng được đề xuất',
          conversationId: null,
          lastInteractionAt: user.created_at ?? null,
        });
        if (suggestionMap.size >= limit) {
          break;
        }
      }
    }

    return Array.from(suggestionMap.values()).slice(0, limit);
  }

  private buildPreview(type?: MessageType, content?: string | null) {
    if (!type) {
      return content ?? null;
    }

    switch (type) {
      case MessageType.TEXT:
        return content ?? 'Tin nhắn văn bản';
      case MessageType.IMAGE:
        return 'Đã gửi một hình ảnh';
      case MessageType.VIDEO:
        return 'Đã gửi một video';
      case MessageType.AUDIO:
        return 'Đã gửi một audio';
      case MessageType.GIFT:
        return 'Đã gửi một món quà';
      case MessageType.BUSINESS_CARD:
        return 'Đã chia sẻ danh thiếp';
      default:
        return content ?? 'Tin nhắn mới';
    }
  }
}
