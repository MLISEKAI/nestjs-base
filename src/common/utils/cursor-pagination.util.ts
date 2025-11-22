import { Prisma } from '@prisma/client';
import { CursorPaginationParams, CursorPaginationResult } from '../interfaces';

/**
 * Cursor-based pagination for better performance on large datasets
 * Use this instead of offset-based pagination for better performance
 */
export function buildCursorPagination<T extends { id: string; created_at: Date }>(
  items: T[],
  limit: number,
): CursorPaginationResult<T> {
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && resultItems.length > 0 ? resultItems[resultItems.length - 1].id : null;

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}

/**
 * Build cursor where clause for Prisma queries
 */
export function buildCursorWhere(
  cursor?: string,
  orderBy: Prisma.SortOrder = 'desc',
): Prisma.JsonObject | undefined {
  if (!cursor) return undefined;

  return {
    id: orderBy === 'desc' ? { lt: cursor } : { gt: cursor },
  } as Prisma.JsonObject;
}
