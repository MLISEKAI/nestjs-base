import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ClsModule } from 'nestjs-cls';
import { WINSTON_CONFIG } from './winston.config';
import { generateMemorable } from '../utils/random-memorable';

@Module({
  imports: [
    ClsModule.forRoot({
      middleware: {
        mount: true,
        setup: (cls /*, req*/) => {
          cls.set('traceId', generateMemorable());
        },
      },
      global: true,
    }),
    WinstonModule.forRoot(WINSTON_CONFIG),
  ],
})
export class TracingModule {}
