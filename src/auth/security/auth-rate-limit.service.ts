import { Injectable, BadRequestException } from '@nestjs/common';

interface CounterEntry {
  count: number;
  expiresAt: number;
}

@Injectable()
export class AuthRateLimitService {
  private readonly ttlMs = 15 * 60 * 1000; // 15 phút
  private readonly maxLoginFailures = 5;
  private readonly maxOtpFailures = 5;
  private readonly maxTwoFactorFailures = 6;

  private readonly store = new Map<string, CounterEntry>();

  private getKey(prefix: string, parts: (string | undefined)[]) {
    const safe = parts.map((v) => (v || '').toLowerCase().trim());
    return `${prefix}:${safe.join(':')}`;
  }

  private touch(key: string, limit: number) {
    const now = Date.now();
    const existing = this.store.get(key);
    if (existing && existing.expiresAt > now) {
      existing.count += 1;
      if (existing.count > limit) {
        throw new BadRequestException('Too many attempts, please try again later');
      }
      this.store.set(key, existing);
      return;
    }

    this.store.set(key, {
      count: 1,
      expiresAt: now + this.ttlMs,
    });
  }

  checkLogin(refId: string, ip?: string) {
    const key = this.getKey('login', [refId, ip]);
    this.touch(key, this.maxLoginFailures);
  }

  checkOtp(phone: string, ip?: string) {
    const key = this.getKey('otp', [phone, ip]);
    this.touch(key, this.maxOtpFailures);
  }

  checkTwoFactor(userId: string, ip?: string) {
    const key = this.getKey('2fa', [userId, ip]);
    this.touch(key, this.maxTwoFactorFailures);
  }
}


