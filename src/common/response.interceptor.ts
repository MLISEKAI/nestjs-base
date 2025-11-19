import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rsp, generateTraceId } from './response';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Rsp<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Rsp<T>> {
    const traceId = generateTraceId();
    return next.handle().pipe(
      map((data: any) => ({
        error: false,
        code: 0,
        message: 'Success',
        data,
        traceId,
      })),
    );
  }
}
