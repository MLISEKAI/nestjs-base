// Import Injectable, NestInterceptor và các types từ NestJS
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
// Import Observable từ RxJS
import { Observable } from 'rxjs';
// Import map operator từ RxJS
import { map } from 'rxjs/operators';
// Import utility functions
import { Rsp, generateTraceId } from '../utils';

/**
 * @Injectable() - Đánh dấu class này là NestJS interceptor
 * ResponseInterceptor<T> - Global interceptor để format tất cả API responses
 *
 * Chức năng chính:
 * - Format tất cả API responses với format chuẩn: { error, code, message, data, traceId }
 * - Generate traceId cho mỗi response
 * - Handle các loại response khác nhau (string, object with message, object without message)
 *
 * Format chuẩn:
 * {
 *   error: false,
 *   code: 0,
 *   message: "Success" hoặc message từ response,
 *   data: response data hoặc null,
 *   traceId: "trace-123456"
 * }
 *
 * Lưu ý:
 * - Được apply globally trong main.ts
 * - Tự động format tất cả responses trước khi trả về client
 */
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
