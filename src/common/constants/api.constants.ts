/**
 * API Constants
 */
export const API_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Response codes
 */
export const RESPONSE_CODES = {
  SUCCESS: 1,
  VALIDATION_ERROR: 2,
  UNAUTHORIZED: 3,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  SERVER_ERROR: 500,
} as const;

/**
 * Response messages
 */
export const RESPONSE_MESSAGES = {
  SUCCESS: 'Success',
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Not found',
  FORBIDDEN: 'Forbidden',
  SERVER_ERROR: 'Internal server error',
} as const;

