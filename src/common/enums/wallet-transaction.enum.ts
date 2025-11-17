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
 * Wallet currency enum (from Prisma schema)
 */
export enum WalletCurrency {
  GEM = 'gem',
  VEX = 'vex',
}

