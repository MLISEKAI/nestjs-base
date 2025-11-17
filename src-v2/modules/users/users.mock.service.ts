import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../../common/mock-data.service';
import { PaginatedResponse, PaginationQuery } from '../../common/interfaces/paginated.interface';
import { generateId } from '../../common/utils/uuid.util';

export interface MockUser {
  id: string;
  union_id: string;
  role: string;
  nickname: string;
  is_blocked: boolean;
  bio?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_deleted: boolean;
}

@Injectable()
export class UsersMockService {
  constructor(private readonly mockData: MockDataService) {}

  findAll(query: PaginationQuery): PaginatedResponse<MockUser> {
    let users = this.mockData.loadData<MockUser>('users.json');
    
    // Filter deleted
    users = users.filter(u => !u.is_deleted);

    // Search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      users = users.filter(
        u =>
          u.nickname.toLowerCase().includes(searchLower) ||
          u.id.toLowerCase().includes(searchLower) ||
          (u.bio && u.bio.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      users.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        if (order === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Paginate
    const page = query.page || 1;
    const limit = query.limit || 20;
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = users.slice(start, end);

    return {
      data: paginatedUsers,
      page,
      limit,
      total,
      totalPages,
    };
  }

  findOne(id: string): MockUser {
    const users = this.mockData.loadData<MockUser>('users.json');
    const user = users.find(u => u.id === id && !u.is_deleted);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  create(userData: Partial<MockUser>): MockUser {
    const users = this.mockData.loadData<MockUser>('users.json');
    const newUser: MockUser = {
      id: generateId(),
      union_id: `union-${Date.now()}`,
      role: userData.role || 'user',
      nickname: userData.nickname || 'New User',
      is_blocked: false,
      bio: userData.bio,
      avatar: userData.avatar,
      gender: userData.gender,
      birthday: userData.birthday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false,
    };

    users.push(newUser);
    this.mockData.saveData('users.json', users);
    return newUser;
  }

  update(id: string, userData: Partial<MockUser>): MockUser {
    const users = this.mockData.loadData<MockUser>('users.json');
    const index = users.findIndex(u => u.id === id && !u.is_deleted);
    
    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    users[index] = {
      ...users[index],
      ...userData,
      updated_at: new Date().toISOString(),
    };

    this.mockData.saveData('users.json', users);
    return users[index];
  }

  delete(id: string): void {
    const users = this.mockData.loadData<MockUser>('users.json');
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    users[index].is_deleted = true;
    users[index].deleted_at = new Date().toISOString();
    this.mockData.saveData('users.json', users);
  }
}

