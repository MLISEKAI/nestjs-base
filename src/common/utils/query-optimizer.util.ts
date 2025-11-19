import { Prisma } from '@prisma/client';

/**
 * Select only necessary fields to reduce data transfer
 */
export const UserSelectMinimal = {
  id: true,
  nickname: true,
  avatar: true,
  bio: true,
} satisfies Prisma.ResUserSelect;

export const UserSelectBasic = {
  id: true,
  nickname: true,
  avatar: true,
  bio: true,
  gender: true,
  created_at: true,
} satisfies Prisma.ResUserSelect;

/**
 * Optimize include to only fetch necessary relations
 */
export function optimizeInclude<T extends Prisma.JsonObject>(
  include: T,
  fields: string[],
): Partial<T> {
  const optimized: any = {};
  for (const field of fields) {
    if (include[field]) {
      optimized[field] = include[field];
    }
  }
  return optimized;
}

/**
 * Build optimized select for common queries
 */
export function buildOptimizedSelect(fields: string[]): Record<string, boolean> {
  const select: Record<string, boolean> = {};
  for (const field of fields) {
    select[field] = true;
  }
  return select;
}
