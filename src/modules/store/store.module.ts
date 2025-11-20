import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StoreController } from './controller/store.controller';
import { StoreAdminController } from './controller/store-admin.controller';
import { StorePublicController } from './controller/store-public.controller';
import { StoreService } from './service/store.service';

@Module({
  imports: [PrismaModule],
  controllers: [StoreController, StoreAdminController, StorePublicController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
