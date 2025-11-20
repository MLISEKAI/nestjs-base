import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rsp, generateTraceId } from '../response';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Rsp<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Rsp<T>> {
    const traceId = generateTraceId();
    return next.handle().pipe(
      map((data: any) => {
        // If data is a string, use it as message
        if (typeof data === 'string') {
          return {
            error: false,
            code: 0,
            message: data,
            data: null,
            traceId,
          };
        }

        // If data is an object with a message property, extract it
        if (data && typeof data === 'object' && 'message' in data) {
          return {
            error: false,
            code: 0,
            message: data.message,
            data: null,
            traceId,
          };
        }

        // Default: use data as-is with "Success" message
        return {
          error: false,
          code: 0,
          message: 'Success',
          data,
          traceId,
        };
      }),
    );
  }
}
