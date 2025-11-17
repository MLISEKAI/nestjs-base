import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../../common/mock-data.service';
import { generateId } from '../../common/utils/uuid.util';
import * as bcrypt from 'bcrypt';

export interface MockAssociate {
  id: string;
  user_id: string;
  email?: string;
  phone_number?: string;
  ref_id: string;
  hash?: string;
  provider: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_deleted: boolean;
}

@Injectable()
export class AuthMockService {
  constructor(private readonly mockData: MockDataService) {}

  async register(data: {
    email?: string;
    phone_number?: string;
    password: string;
    nickname: string;
    avatar?: string;
    bio?: string;
    gender?: string;
    birthday?: string;
    role?: string;
  }) {
    const users = this.mockData.loadData<any>('users.json');
    const associates = this.mockData.loadData<MockAssociate>('associates.json');

    // Check email exists
    if (data.email) {
      const emailExists = associates.find(
        a => a.email === data.email && !a.is_deleted
      );
      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Check phone exists
    if (data.phone_number) {
      const phoneExists = associates.find(
        a => a.phone_number === data.phone_number && !a.is_deleted
      );
      if (phoneExists) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userId = generateId();
    const unionId = `union-${Date.now()}`;

    // Create user
    const newUser = {
      id: userId,
      union_id: unionId,
      role: data.role || 'user',
      nickname: data.nickname,
      is_blocked: false,
      bio: data.bio,
      avatar: data.avatar,
      gender: data.gender,
      birthday: data.birthday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false,
    };

    // Create associate
    const newAssociate: MockAssociate = {
      id: generateId(),
      user_id: userId,
      email: data.email,
      phone_number: data.phone_number,
      ref_id: data.email || data.phone_number || '',
      hash: hashedPassword,
      provider: 'password',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false,
    };

    users.push(newUser);
    associates.push(newAssociate);

    this.mockData.saveData('users.json', users);
    this.mockData.saveData('associates.json', associates);

    return newUser;
  }

  async login(refId: string, password: string) {
    const users = this.mockData.loadData<any>('users.json');
    const associates = this.mockData.loadData<MockAssociate>('associates.json');

    const associate = associates.find(
      a =>
        (a.email === refId || a.phone_number === refId) &&
        !a.is_deleted &&
        a.provider === 'password'
    );

    if (!associate) {
      throw new UnauthorizedException('User not found');
    }

    if (!associate.hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, associate.hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const user = users.find(u => u.id === associate.user_id && !u.is_deleted);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate mock token
    const token = `mock-token-${generateId()}`;

    return {
      access_token: token,
      user,
    };
  }
}

