// Import registerAs từ @nestjs/config để register configuration
import { registerAs } from '@nestjs/config';

// Default values
const DEFAULT_REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const DEFAULT_EXPIRES_IN = '1h';

/**
 * parseDurationToSeconds - Parse duration string (e.g., "1h", "30m", "7d") thành seconds
 *
 * @param value - Duration string (e.g., "1h", "30m", "7d", "3600")
 * @returns Duration in seconds
 *
 * Supported formats:
 * - "1s" = 1 second
 * - "1m" = 60 seconds
 * - "1h" = 3600 seconds
 * - "1d" = 86400 seconds
 * - "3600" = 3600 seconds (numeric string)
 */
const parseDurationToSeconds = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)([smhd])$/i);

  if (!match) {
    return Number(trimmed) || 3600;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return amount;
  }
};

/**
 * JWT configuration
 * Register JWT config với key 'jwt'
 *
 * Config values:
 * - secret: JWT secret key (default: 'default_secret')
 * - expiresIn: Access token expiration in seconds (default: 3600 = 1 hour)
 * - issuer: JWT issuer (default: 'my-app')
 * - refreshTtlMs: Refresh token TTL in milliseconds (default: 30 days)
 *
 * Environment variables:
 * - JWT_TOKEN_SECRET
 * - JWT_EXPIRES_IN (supports: "1h", "30m", "7d", or numeric seconds)
 * - JWT_ISSUER
 * - JWT_REFRESH_TTL_MS
 */
export default registerAs('jwt', () => {
  const rawExpiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;
  const expiresInSeconds = parseDurationToSeconds(rawExpiresIn);

  return {
    secret: process.env.JWT_TOKEN_SECRET || 'default_secret',
    expiresIn: expiresInSeconds,
    issuer: process.env.JWT_ISSUER || 'my-app',
    refreshTtlMs: Number(process.env.JWT_REFRESH_TTL_MS ?? DEFAULT_REFRESH_TTL_MS),
  };
});
