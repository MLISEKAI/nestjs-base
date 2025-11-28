import { Module } from '@nestjs/common';
import { RedisBaseModule } from 'src/redis/redis-base.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResAssociateModule } from '../associate/associate.module';
import { ResUserController } from './user.controller';
import { ResUserService } from './user.service';

@Module({
  imports: [PrismaModule, RedisBaseModule, ResAssociateModule],
  exports: [ResUserService],
  controllers: [ResUserController],
  providers: [ResUserService],
})
export class ResUserModule {}
