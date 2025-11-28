import { ErrorSystemCode } from '../enum/error.enum';
import { currentTraceId } from '../tracing/tracing.utils';

export class ApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: any;
  traceId: string;

  constructor(payload: {
    error?: boolean;
    code?: number;
    message?: string;
    data?: any;
    traceId?: string;
  }) {
    this.error = payload.error || false;
    this.code = payload.code || 200;
    this.message = payload.message || 'success';
    this.data = payload.data || null;
    this.traceId = payload.traceId || '';
  }

  static success(data: any = null, message = 'success'): ApiResponse {
    return new ApiResponse({
      error: false,
      code: 200,
      message: message,
      data: data,
      traceId: currentTraceId(),
    });
  }

  static error(message: string = 'error', code: ErrorSystemCode): ApiResponse {
    return new ApiResponse({
      error: true,
      code: code,
      message: message,
      traceId: currentTraceId(),
    });
  }
}
