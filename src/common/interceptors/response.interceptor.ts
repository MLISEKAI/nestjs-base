import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rsp, generateTraceId } from '../utils';

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

        // If data is an object with a message property, extract message but keep other fields in data
        if (data && typeof data === 'object' && 'message' in data) {
          const { message, ...restData } = data;
          // If restData is empty, set data to null, otherwise keep the rest
          const hasOtherFields = Object.keys(restData).length > 0;
          return {
            error: false,
            code: 0,
            message: message,
            data: hasOtherFields ? restData : null,
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
