import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import { HeaderRequest } from '../types/request.type';
import { UserAuthRequest } from '../types/user-request';
import { SystemException } from '../exception/system-exception';
import { ErrorSystemCode } from '../enum/error.enum';
import { Prisma } from '@prisma/client';

const logger: Logger = new Logger('MainDecorator');

export const GetRepHeader = createParamDecorator(async (_value: any, ctx: ExecutionContext) => {
  const headers = ctx.switchToHttp().getRequest().headers;
  logger.log('Header API: ' + JSON.stringify(headers));
  const dto: HeaderRequest = _.pick(
    headers,
    'lang',
    'dt',
    'di',
    'dm',
    'ov',
    'ot',
    'location',
    'timezone',
    'cf-ipcountry',
    'ip',
  );
  return dto;
});

export const GetUserAuth = createParamDecorator((_data, ctx: ExecutionContext): UserAuthRequest => {
  const req = ctx.switchToHttp().getRequest();
  return req?.user as UserAuthRequest;
});

export const handlerErrorSystem = (
  error: any,
  option?: {
    code?: ErrorSystemCode;
    message?: string;
  },
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new SystemException(
          option?.code || ErrorSystemCode.INVALID_VALUE,
          'This value already exists and must be unique.',
        );
      case 'P2003':
        throw new SystemException(
          option?.code || ErrorSystemCode.INVALID_VALUE,
          'Invalid reference: related record does not exist.',
        );
      case 'P2025':
        throw new SystemException(
          option?.code || ErrorSystemCode.INVALID_VALUE,
          'Requested record not found.',
        );
      default:
        throw new SystemException(
          option?.code || ErrorSystemCode.INVALID_VALUE,
          `Database error: ${error.message}`,
        );
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    throw new SystemException(
      option?.code || ErrorSystemCode.INVALID_VALUE,
      'Invalid input data format.',
    );
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new SystemException(
      option?.code || ErrorSystemCode.INVALID_VALUE,
      'Failed to connect to the database.',
    );
  }

  if (error instanceof SystemException) {
    throw error;
  }

  throw new SystemException(option?.code || ErrorSystemCode.INVALID_VALUE, option?.message);
};
