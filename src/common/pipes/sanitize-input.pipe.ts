// Import ArgumentMetadata, Injectable và PipeTransform từ NestJS
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
// Import sanitizeHtml để sanitize HTML content (XSS protection)
import sanitizeHtml from 'sanitize-html';

/**
 * @Injectable() - Đánh dấu class này là NestJS pipe
 * SanitizeInputPipe - Global pipe để sanitize tất cả input (XSS protection)
 *
 * Chức năng chính:
 * - Sanitize tất cả string inputs để loại bỏ HTML tags và scripts (XSS protection)
 * - Recursively sanitize objects và arrays
 * - Trim strings sau khi sanitize
 *
 * Lưu ý:
 * - Được apply globally trong main.ts
 * - Tự động sanitize tất cả inputs trước khi validate
 * - Không cho phép bất kỳ HTML tags nào (allowedTags: [])
 * - Không cho phép bất kỳ attributes nào (allowedAttributes: {})
 * - Preserve Date và Buffer objects (không sanitize)
 */
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
