/**
 * Auth module interfaces
 */
export interface GoogleProfile {
  provider: 'google';
  providerId: string;
  email?: string;
  nickname?: string;
}
