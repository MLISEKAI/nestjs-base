/**
 * Wallet transaction type enum (from Prisma schema)
 */
export enum WalletTransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  GIFT = 'gift',
  CONVERT = 'convert',
}

/**
 * Wallet transaction status enum (from Prisma schema)
 */
export enum WalletTransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * TransactionType - Enum cho các loại transaction
 * Flutter Model Compatible - tương thích với Flutter app
 */
export enum TransactionType {
  deposit = 'deposit',
  withdrawal = 'withdrawal',
  exchange = 'exchange',
  gift_sent = 'gift_sent',
  gift_received = 'gift_received',
  refund = 'refund',
  reward = 'reward',
}

/**
 * TransactionStatus - Enum cho trạng thái transaction
 * Flutter Model Compatible - tương thích với Flutter app
 */
export enum TransactionStatus {
  completed = 'completed',
  pending = 'pending',
  failed = 'failed',
  cancelled = 'cancelled',
}

/**
 * CurrencyType - Enum cho loại currency
 * Flutter Model Compatible - tương thích với Flutter app
 */
export enum CurrencyType {
  Diamonds = 'Diamonds',
  VEX = 'VEX',
}
