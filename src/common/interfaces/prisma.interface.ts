import { Prisma } from '@prisma/client';

/**
 * Date filter for Prisma queries
 */
export interface DateFilter {
  gt?: Date;
  gte?: Date;
  lt?: Date;
  lte?: Date;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generic Prisma where clause type
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
 * Generic Prisma orderBy type
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
