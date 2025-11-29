import { objectToBase64 } from 'src/common/utils/string-utils';

export class KeyCachingSystem {
  static INIT_LOGIN_TRANSACTION = (transactionId: string) => `login:${transactionId}`;

  static USER_SESSION = (userId: string) => `users:${userId}:session`;
  static USER_INFO = (userId: string) => `users:${userId}:info`;

  //Cache Data
  static QUERY_MAPS_POINT = (query: Record<string, unknown>) =>
    `query:maps:points:${objectToBase64(query)}`;
  static ALL_COUNTRIES = 'ALL_COUNTRIES';
  static ALL_CURRENCY = 'ALL_CURRENCY';
  static ALL_LANGUAGE = 'ALL_LANGUAGE';
  static ALL_EXCHANGE_RATE = 'ALL_EXCHANGE_RATE';
}

export type CacheInterface = SessionUserCache | LoginTransaction;

export type SessionUserCache = string;

export type LoginTransaction = {
  message: string;
  address: string;
  challenge: string;
};
