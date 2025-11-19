import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { generateTraceId, Rsp } from '../response';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const traceId = generateTraceId();
    let code = 0;
    let message = 'GENERAL_FAILURE';
    let status = 200;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      const msg = typeof res === 'string' ? res : res?.message;
      message = Array.isArray(msg) ? msg.join(', ') : msg || exception.message;
      const url: string = request?.url || '';
      if (status === 401) code = url.includes('/auth/login') ? 3 : 401;
      else if (status === 403) code = 403;
      else if (status === 404) code = 404;
      else if (status === 400) code = 2;
      else if (status === 503) code = 503;
      else code = 2;
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 0;
      status = 200;
    } else {
      message = '';
      code = 0;
      status = 200;
    }

    const body: Rsp<null> = {
      error: true,
      code,
      message,
      data: null,
      traceId,
    };
    response.status(status).json(body);
  }
}
