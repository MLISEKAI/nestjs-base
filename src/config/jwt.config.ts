import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_TOKEN_SECRET || 'default_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  issuer: process.env.JWT_ISSUER || 'my-app',
}));
