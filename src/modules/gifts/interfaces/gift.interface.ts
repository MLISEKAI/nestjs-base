/**
 * Gift item for inventory operations
 */
export interface GiftItemForInventory {
  id: string;
  name: string;
  image_url: string | null;
  price: number | string; // Can be number or Prisma Decimal
}
