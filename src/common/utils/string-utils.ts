import { ProviderEnum } from '@prisma/client';
import { z } from 'zod';

var format = require('string-template');

export function mappingStringWithContext(str: string, context: { [key: string]: any }) {
  try {
    return format(str, context);
  } catch (error: any) {
    throw error;
  }
}

export function getProviderAssociate(sign_in_provider: string): ProviderEnum {
  switch (sign_in_provider) {
    case 'phone':
      return ProviderEnum.phone;
    case 'facebook.com':
      return ProviderEnum.facebook;
    case 'google.com':
      return ProviderEnum.google;
    case 'apple.com':
      return ProviderEnum.apple;
    case 'gc.apple.com':
      return ProviderEnum.apple;
    case 'password':
      return ProviderEnum.password;
    default:
      return 'anonymous';
  }
}

export function objectToBase64(obj: Object) {
  const jsonString = JSON.stringify(obj);
  return Buffer.from(jsonString).toString('base64');
}

export function base64ToObject(base64String: string) {
  const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
  return JSON.parse(jsonString);
}
export function generateSlug(name: string): string {
  return name
    .normalize('NFD') // Separation of characters + signs
    .replace(/[\u0300-\u036f]/g, '') //Delete accent (accent)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_') // space → underscore
    .replace(/[^\w_]+/g, ''); // remove Special characters
}

export const booleanParam = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    return val === 'true' ? true : val === 'false' ? false : undefined;
  });

export function firstTwoLettersOfName(name: string): string {
  if (!name) return 'XX';
  const cleaned = name.replace(/\s+/g, '');
  if (cleaned.length === 0) return 'XX';
  return cleaned.slice(0, 2).toUpperCase().padEnd(2, 'X');
}
