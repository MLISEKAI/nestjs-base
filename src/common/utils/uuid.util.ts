import { randomUUID } from 'crypto';

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Generate a short ID (first part of UUID)
 */
export function generateShortId(): string {
  return randomUUID().split('-')[0];
}
