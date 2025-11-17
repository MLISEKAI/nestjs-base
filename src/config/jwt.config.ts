import { registerAs } from '@nestjs/config';

const DEFAULT_REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const DEFAULT_EXPIRES_IN = '1h';

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
