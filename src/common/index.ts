// Export Type
export * from './types/request.type';
export * from './types/response.type';
export * from './types/user-request';
export * from './types/pagination.type';

// Export exceptions'
export * from './exception/exception.filter';
export * from './exception/status-request';

export * from './decorator';

export const MESSAGE_LOGIN_WALLET = `Welcome to {nameApp}!\n\nClick to sign in and accept the {nameApp} Terms of Service ({termsOfServiceLink}) and Privacy Policy ({privacyPolicyLink}).\n    \nThis request will not trigger a blockchain transaction.\n    \nYour authentication status will reset after 24 hours.\n    \nWallet address:\n{address}\n    \nNonce:\n{nonce}\n`;
