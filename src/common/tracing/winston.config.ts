import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';

export interface TransformableInfo {
  level: string;
  message: any;
  [LEVEL]?: string;
  [MESSAGE]?: any;
  [SPLAT]?: any;
  [key: string | symbol]: any;
}
// format
function formatParams(info: TransformableInfo) {
  const { timestamp, level, message, context, ...args } = info;
  const traceId = ClsServiceManager.getClsService()?.get('traceId') || process.pid;
  return `[Nest] ${process.pid}  - ${timestamp}    ${level} [${context}] [${traceId}] ${message}`;
}

const logFormat = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.timestamp({ format: 'MM/DD/YYYY, HH:mm:ss A' }),
  winston.format.printf(formatParams),
);

export const WINSTON_CONFIG = {
  transports: [
    new winston.transports.Console({
      format: logFormat,
    }),
    // other transports...
  ],
  // other options
};

export { WINSTON_MODULE_NEST_PROVIDER };
