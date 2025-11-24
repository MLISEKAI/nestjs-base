import { Decimal } from '@prisma/client/runtime/library';

/**
 * Transaction interface for building descriptions
 */
export interface TransactionForDescription {
  type: string;
  amount: number | Decimal;
  currency?: string;
  description?: string;
  reference_id?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Gift interface for transaction description
 */
export interface GiftForDescription {
  id: string;
  name?: string;
  quantity?: number;
  [key: string]: any; // Allow additional fields
}
