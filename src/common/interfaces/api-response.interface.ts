/**
 * Standard API Response interface
 */
export interface IApiResponse<T> {
  error: boolean;
  code: number;
  message: string;
  data: T | null;
  traceId: string;
}

/**
 * Error response interface
 */
export interface IErrorResponse {
  error: true;
  code: number;
  message: string;
  data: null;
  traceId: string;
}

/**
 * Success response interface
 */
export interface ISuccessResponse<T> {
  error: false;
  code: 1;
  message: string;
  data: T;
  traceId: string;
}
