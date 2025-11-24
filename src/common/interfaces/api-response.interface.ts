/**
 * IApiResponse<T> - Interface cho standard API response
 *
 * @template T - Type của data trong response
 *
 * Lưu ý:
 * - error: Error flag (false = success, true = error)
 * - code: Response code (0 = success, > 0 = error code)
 * - message: Response message
 * - data: Response data (null nếu error)
 * - traceId: Trace ID để debug
 */
export interface IApiResponse<T> {
  /** Error flag (false = success, true = error) */
  readonly error: boolean;
  /** Response code (0 = success, > 0 = error code) */
  readonly code: number;
  /** Response message */
  readonly message: string;
  /** Response data (null nếu error) */
  readonly data: T | null;
  /** Trace ID để debug */
  readonly traceId: string;
}

/**
 * IErrorResponse - Interface cho error response
 *
 * Lưu ý:
 * - error: Luôn là true
 * - code: Error code (> 0)
 * - message: Error message
 * - data: Luôn là null
 * - traceId: Trace ID để debug
 */
export interface IErrorResponse {
  /** Error flag (luôn là true) */
  readonly error: true;
  /** Error code (> 0) */
  readonly code: number;
  /** Error message */
  readonly message: string;
  /** Response data (luôn là null) */
  readonly data: null;
  /** Trace ID để debug */
  readonly traceId: string;
}

/**
 * ISuccessResponse<T> - Interface cho success response
 *
 * @template T - Type của data trong response
 *
 * Lưu ý:
 * - error: Luôn là false
 * - code: Luôn là 1 (success code)
 * - message: Success message
 * - data: Response data (không null)
 * - traceId: Trace ID để debug
 */
export interface ISuccessResponse<T> {
  /** Error flag (luôn là false) */
  readonly error: false;
  /** Success code (luôn là 1) */
  readonly code: 1;
  /** Success message */
  readonly message: string;
  /** Response data (không null) */
  readonly data: T;
  /** Trace ID để debug */
  readonly traceId: string;
}
