// Import registerAs từ @nestjs/config để register configuration
import { registerAs } from '@nestjs/config';

/**
 * Database configuration
 * Register database config với key 'database'
 *
 * Config values:
 * - host: Database host (default: 127.0.0.1)
 * - port: Database port (default: 5432)
 * - username: Database username (default: postgres)
 * - password: Database password (default: postgres)
 * - database: Database name (default: mydb)
 * - ssl: SSL connection (default: false)
 *
 * Environment variables:
 * - DB_HOST
 * - DB_PORT
 * - DB_USER
 * - DB_PASSWORD
 * - DB_NAME
 * - DB_SSL
 */
export default registerAs('database', () => ({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mydb',
  ssl: process.env.DB_SSL === 'true',
}));
