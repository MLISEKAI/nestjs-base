import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: unknown, _metadata?: ArgumentMetadata): unknown {
    return this.cleanValue(value);
  }

  private cleanValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      const sanitized = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
      });
      return sanitized.trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.cleanValue(item));
    }

    if (value instanceof Date || value instanceof Buffer) {
      return value;
    }

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
        (acc, [key, val]) => {
          acc[key] = this.cleanValue(val);
          return acc;
        },
        {},
      );
    }

    return value;
  }
}
