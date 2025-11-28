import { Injectable, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationException } from './system-exception';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  protected flattenValidationErrors(validationErrors: ValidationError[]): any[] {
    return validationErrors.map((error) => {
      return {
        field: error.property,
        errors: Object.values(error.constraints || {}),
      };
    });
  }

  createExceptionFactory() {
    return (validationErrors: ValidationError[] = []) => {
      const errors = this.flattenValidationErrors(validationErrors);
      return new ValidationException(errors);
    };
  }
}
