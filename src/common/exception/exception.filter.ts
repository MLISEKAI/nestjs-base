import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../types/response.type';
import { currentTraceId } from '../tracing/tracing.utils';

class ErrorData {
  message?: any;
  error?: any;
  details?: any;
  code?: any;
  statusCode?: any;
  response?: any;
  data?: object;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  logger: Logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const errorData: ErrorData = exception.getResponse() as ErrorData;
    return response.status(status).send(
      new ApiResponse({
        error: errorData.code !== 200,
        code: errorData.code,
        message: errorData.message,
        data: errorData.data,
        traceId: currentTraceId(),
      }),
    );
  }
}
