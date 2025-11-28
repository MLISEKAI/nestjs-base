import { Body, Controller, Get, Logger, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthClient } from 'src/auth/auth.decorator';
import * as common from 'src/common';
import { GetUserAuth, handlerErrorSystem } from 'src/common/decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationAssociates, UpdateProfileDto } from './dto/user.dto';
import { ResUserService } from './user.service';
import { UserAuthRequest } from 'src/common/types/user-request';

@Controller('users')
@ApiTags('Users General')
@AuthClient()
@ApiBearerAuth('access-token')
export class ResUserController {
  constructor(
    private userService: ResUserService,
    private prismaService: PrismaService,
  ) {}
  logger = new Logger(ResUserController.name);

  @Get('me')
  async getMe(@GetUserAuth() user: common.UserAuthRequest): Promise<common.ApiResponse> {
    try {
      return common.ApiResponse.success(user);
    } catch (error: any) {
      return handlerErrorSystem(error, { message: error?.message });
    }
  }

  @Put('profile')
  async updateUser(
    @Body() body: UpdateProfileDto,
    @GetUserAuth() user: common.UserAuthRequest,
  ): Promise<common.ApiResponse> {
    try {
      return common.ApiResponse.success(await this.userService.updateAccountByUid(user.id, body));
    } catch (error: any) {
      return handlerErrorSystem(error, { message: error?.message });
    }
  }

  @Get('profile/:userId')
  async getAccountByOpenId(
    @GetUserAuth() owner: common.UserAuthRequest,
    @Param('userId') userId: string,
  ): Promise<common.ApiResponse> {
    try {
      const user = await this.userService.getUserCachingByUid(userId);
      return common.ApiResponse.success({ ...user });
    } catch (error: any) {
      return handlerErrorSystem(error, { message: error?.message });
    }
  }

  @Get('me/relation/associates')
  async paginationAssociates(
    @Query() query: PaginationAssociates,
    @GetUserAuth() user: common.UserAuthRequest,
  ) {
    try {
      const users = await this.userService.paginationAssociates(user.id, query);
      return common.ApiResponse.success(users);
    } catch (error: any) {
      return handlerErrorSystem(error?.message);
    }
  }
}
