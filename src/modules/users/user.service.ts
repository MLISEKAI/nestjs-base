import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ResUser, UserBasicRole } from '@prisma/client';
import * as ld from 'lodash';
import { DecodedIdToken } from 'node_modules/firebase-admin/lib/auth/token-verifier';
import path from 'path';
import { mappingPagination, UserAuthRequest } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisCachingService } from 'src/redis/cache.service';
import { KeyCachingSystem } from 'src/redis/dto/cache.dto';
import { generateNumberUnique } from 'src/utils';
import { getProviderAssociate } from 'src/utils/string-utils';
import { v4 as uuid } from 'uuid';
import { PaginationAssociates, PaginationUser, UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class ResUserService {
  private logger = new Logger(ResUserService.name);
  constructor(
    private cachingManager: RedisCachingService,
    private prismaService: PrismaService, // private awsService: AwsService,
  ) {}

  async createAccount(payload: {
    name: string;
    email?: string;
    phone_number?: string;
    uid: string;
    identities: {
      sign_in_provider: string;
      hash_password: string;
    };
  }): Promise<ResUser> {
    try {
      const {
        name,
        email,
        phone_number,
        uid,
        identities: { sign_in_provider, hash_password },
      } = payload;
      // Create a new account
      const account = await this.prismaService.resUser.create({
        data: {
          union_id: generateNumberUnique(8).toString(),
          associates: {
            create: {
              email,
              phone_number,
              ref_id: uid,
              hash: hash_password,
              provider: getProviderAssociate(sign_in_provider),
            },
          },
          nickname: name || `User ${generateNumberUnique(4)}`,
        },
      });

      this.logger.log('✅ Func createAccount Success: ' + JSON.stringify(account));
      return account;
    } catch (error: any) {
      this.logger.log('❎ Func createAccount: ' + error?.message);
      throw new BadRequestException(error.message);
    }
  }

  async changeRoleUser(userId: ResUser['id'], role: UserBasicRole) {
    try {
      const account = await this.prismaService.resUser.findUnique({
        where: { id: userId },
      });
      if (!account) {
        throw new BadRequestException('User not found!');
      }
      await this.prismaService.resUser.update({
        where: { id: userId },
        data: {
          role: role,
        },
      });
      await this.handlerCachingUserById(account.id);
      this.logger.log(`Fn Update Profile By Id ${userId} - Successfully!`);
      return true;
    } catch (err: any) {
      throw err;
    }
  }

  async changeBlockUser(userId: ResUser['id'], is_blocked: ResUser['is_blocked']) {
    try {
      const account = await this.prismaService.resUser.findUnique({
        where: { id: userId },
      });
      if (!account) {
        throw new BadRequestException('User not found!');
      }
      await this.prismaService.resUser.update({
        where: { id: userId },
        data: {
          is_blocked: is_blocked,
        },
      });
      await this.handlerCachingUserById(account.id);
      this.logger.log(`Fn Update Profile By Id ${userId} - Successfully!`);
      return true;
    } catch (err: any) {
      throw err;
    }
  }

  async updateAccountByUid(userId: ResUser['id'], payload: UpdateProfileDto) {
    try {
      const account = await this.prismaService.resUser.findUnique({
        where: { id: userId },
      });
      if (!account) {
        throw new BadRequestException('User not found!');
      }
      await this.prismaService.resUser.update({
        where: { id: userId },
        data: ld.pickBy(payload, ld.identity),
      });
      // TODO:Update Caching To Redis
      await this.handlerCachingUserById(account.id);
      this.logger.log(`Fn Update Profile By Id ${userId} - Successfully!`);
      return true;
    } catch (err: any) {
      this.logger.error(`❎ Func updateAccountByUid Error ${userId}:` + err.message);
      throw new BadRequestException(err.message);
    }
  }

  async handlerCachingUserById(userId: ResUser['id']) {
    try {
      const account = await this.prismaService.resUser.findUnique({
        where: { id: userId, is_deleted: false },
        select: {
          id: true,
          is_deleted: true,
          union_id: true,
          is_blocked: true,
          nickname: true,
          role: true,
        },
      });
      if (!account) {
        throw new BadRequestException(`Account ${userId} not found!`);
      }
      await this.cachingManager.setItem(
        KeyCachingSystem.USER_INFO(userId),
        JSON.stringify(account),
      );
      this.logger.log(`Fn caching profile userId ${userId} - Successfully!`);
      return account;
    } catch (error: any) {
      this.logger.log(`❌ Error updateCacheInfoUser Error: ` + error.message);
    }
  }

  async getAccountByAssociate(refId: string): Promise<ResUser | null> {
    try {
      const user = await this.prismaService.resUser.findFirst({
        where: {
          associates: {
            some: {
              ref_id: refId,
            },
          },
        },
      });
      if (!user) return null;
      return user;
    } catch (error: any) {
      this.logger.log('❎ Func getAccountByAssociate: ' + error?.message);
      throw new Error(error?.message);
    }
  }

  async getUserCachingByUid(userId: string): Promise<ResUser> {
    try {
      const userCached = await this.cachingManager.getItem(KeyCachingSystem.USER_INFO(userId));

      let userInfo: any;
      if (userCached) {
        userInfo = userCached;
      } else {
        userInfo = await this.handlerCachingUserById(userId);
      }
      return userInfo;
    } catch (error) {
      this.logger.error(`❌ Func getUserInfoCached: ${error?.message}`);
      throw new Error(error.message);
    }
  }

  async paginationAssociates(userId: ResUser['id'], query: PaginationAssociates) {
    try {
      const { limit, page, searchText } = query;
      const where: Prisma.ResAssociateWhereInput = {
        is_deleted: false,
        user_id: userId,
      };

      const [items, total] = await Promise.all([
        this.prismaService.resAssociate.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            provider: true,
            phone_number: true,
            email: true,
            ref_id: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prismaService.resAssociate.count({
          where,
        }),
      ]);

      return mappingPagination(items, { total, page, limit });
    } catch (error: any) {
      throw error;
    }
  }
}
