import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../../common/mock-data.service';
import { PaginatedResponse, PaginationQuery } from '../../common/interfaces/paginated.interface';
import { generateId } from '../../common/utils/uuid.util';

export interface MockPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

@Injectable()
export class PostsMockService {
  constructor(private readonly mockData: MockDataService) {}

  findAll(userId?: string, query?: PaginationQuery): PaginatedResponse<MockPost> {
    let posts = this.mockData.loadData<MockPost>('posts.json');

    if (userId) {
      posts = posts.filter((p) => p.user_id === userId);
    }

    if (query?.search) {
      const searchLower = query.search.toLowerCase();
      posts = posts.filter((p) => p.content.toLowerCase().includes(searchLower));
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: posts.slice(start, end),
      page,
      limit,
      total,
      totalPages,
    };
  }

  findOne(id: string): MockPost {
    const posts = this.mockData.loadData<MockPost>('posts.json');
    const post = posts.find((p) => p.id === id);

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  create(userId: string, content: string): MockPost {
    const posts = this.mockData.loadData<MockPost>('posts.json');
    const newPost: MockPost = {
      id: generateId(),
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    };

    posts.push(newPost);
    this.mockData.saveData('posts.json', posts);
    return newPost;
  }

  update(id: string, content: string): MockPost {
    const posts = this.mockData.loadData<MockPost>('posts.json');
    const index = posts.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    posts[index].content = content;
    this.mockData.saveData('posts.json', posts);
    return posts[index];
  }

  delete(id: string): void {
    const posts = this.mockData.loadData<MockPost>('posts.json');
    const filtered = posts.filter((p) => p.id !== id);
    this.mockData.saveData('posts.json', filtered);
  }
}
