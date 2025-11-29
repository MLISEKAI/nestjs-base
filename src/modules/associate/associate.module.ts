import { Module } from '@nestjs/common';
import { ApiModule } from 'src/apim/apim.module';
import { RedisBaseModule } from 'src/common/redis/redis-base.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResAssociateController } from './associate.controller';
import { ResAssociateService } from './associate.service';

@Module({
  imports: [PrismaModule, ApiModule, RedisBaseModule],
  controllers: [ResAssociateController],
  providers: [ResAssociateService],
  exports: [ResAssociateService],
})
export class ResAssociateModule {}
