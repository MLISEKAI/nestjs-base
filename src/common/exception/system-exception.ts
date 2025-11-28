import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorSystemCode, ErrorSystemMessage } from '../enum/error.enum';

export class SystemException extends HttpException {
  constructor(errorCode: ErrorSystemCode, message?: string) {
    const response = {
      error: true,
      code: errorCode,
      message: message || ErrorSystemMessage?.[errorCode] || 'Something went wrong.',
    };
    super(response, +String(errorCode).substring(0, 3));
  }
}

export class ValidationException extends HttpException {
  constructor(validationErrors: any[]) {
    const response = {
      error: true,
      code: ErrorSystemCode.INVALID_VALUE,
      message: ErrorSystemMessage?.[ErrorSystemCode.INVALID_VALUE] || 'The request specifies an invalid value.',
      data: validationErrors,
      traceId: Math.random().toString(36).substring(2, 15),
    };
    super(response, HttpStatus.BAD_REQUEST);
  }
}
