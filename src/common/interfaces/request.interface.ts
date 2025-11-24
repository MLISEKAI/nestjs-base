import { Request } from 'express';

/**
 * Authenticated user from JWT token
 */
export interface AuthenticatedUser {
  id: string;
  union_id?: string;
  role?: string;
  nickname?: string;
  avatar?: string;
}

/**
 * Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Request with optional authenticated user
 */
export interface OptionalAuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
