import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthMockService } from './auth.mock.service';
import { MockDataService } from '../../common/mock-data.service';

@Module({
  controllers: [AuthController],
  providers: [AuthMockService, MockDataService],
  exports: [AuthMockService],
})
export class AuthModule {}
