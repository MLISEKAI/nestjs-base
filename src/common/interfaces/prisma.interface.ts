// Import Prisma types
import { Prisma } from '@prisma/client';

/**
 * DateFilter - Interface cho date filtering trong Prisma queries
 *
 * Lưu ý:
 * - gt: Greater than (lớn hơn)
 * - gte: Greater than or equal (lớn hơn hoặc bằng)
 * - lt: Less than (nhỏ hơn)
 * - lte: Less than or equal (nhỏ hơn hoặc bằng)
 */
export interface DateFilter {
  /** Greater than date */
  gt?: Date;
  /** Greater than or equal date */
  gte?: Date;
  /** Less than date */
  lt?: Date;
  /** Less than or equal date */
  lte?: Date;
}

/**
 * PaginationMeta - Interface cho pagination metadata
 *
 * Lưu ý:
 * - total: Tổng số items
 * - page: Trang hiện tại (1-based)
 * - limit: Số items mỗi trang
 * - totalPages: Tổng số trang
 */
export interface PaginationMeta {
  /** Tổng số items */
  readonly total: number;
  /** Trang hiện tại (1-based) */
  readonly page: number;
  /** Số items mỗi trang */
  readonly limit: number;
  /** Tổng số trang */
  readonly totalPages: number;
}

/**
 * PrismaWhereInput<T> - Generic type cho Prisma where clause
 *
 * @template T - Prisma ModelName
 *
 * Lưu ý:
 * - Type-safe where clause cho các Prisma models
 * - Hỗ trợ: ResUser, ResPost, ResGiftItem, ResInventory, ResEvent
 * - Fallback về JsonObject cho các models khác
 */
export type PrismaWhereInput<T extends Prisma.ModelName> = T extends 'ResUser'
  ? Prisma.ResUserWhereInput
  : T extends 'ResPost'
    ? Prisma.ResPostWhereInput
    : T extends 'ResGiftItem'
      ? Prisma.ResGiftItemWhereInput
      : T extends 'ResInventory'
        ? Prisma.ResInventoryWhereInput
        : T extends 'ResEvent'
          ? Prisma.ResEventWhereInput
          : Prisma.JsonObject;

/**
 * PrismaOrderByInput<T> - Generic type cho Prisma orderBy clause
 *
 * @template T - Prisma ModelName
 *
 * Lưu ý:
 * - Type-safe orderBy clause cho các Prisma models
 * - Hỗ trợ: ResUser, ResPost, ResGiftItem, ResInventory, ResEvent
 * - Fallback về JsonObject cho các models khác
 */
export type PrismaOrderByInput<T extends Prisma.ModelName> = T extends 'ResUser'
  ? Prisma.ResUserOrderByWithRelationInput
  : T extends 'ResPost'
    ? Prisma.ResPostOrderByWithRelationInput
    : T extends 'ResGiftItem'
      ? Prisma.ResGiftItemOrderByWithRelationInput
      : T extends 'ResInventory'
        ? Prisma.ResInventoryOrderByWithRelationInput
        : T extends 'ResEvent'
          ? Prisma.ResEventOrderByWithRelationInput
          : Prisma.JsonObject;

/**
 * PrismaMiddlewareParams - Interface cho Prisma middleware parameters
 *
 * Lưu ý:
 * - Được sử dụng trong Prisma middleware để log query performance
 * - model: Tên Prisma model (optional)
 * - action: Prisma action (findMany, create, update, etc.)
 * - args: Query arguments
 * - dataPath: Path trong data structure
 * - runInTransaction: Có đang chạy trong transaction không
 */
export interface PrismaMiddlewareParams {
  /** Tên Prisma model (optional) */
  readonly model?: string;
  /** Prisma action (findMany, create, update, delete, etc.) */
  readonly action: string;
  /** Query arguments */
  readonly args: unknown;
  /** Path trong data structure */
  readonly dataPath: string[];
  /** Có đang chạy trong transaction không */
  readonly runInTransaction: boolean;
}
