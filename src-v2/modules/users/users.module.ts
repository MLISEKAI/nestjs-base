import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersMockService } from './users.mock.service';
import { MockDataService } from '../../common/mock-data.service';

@Module({
  controllers: [UsersController],
  providers: [UsersMockService, MockDataService],
  exports: [UsersMockService],
})
export class UsersModule {}

