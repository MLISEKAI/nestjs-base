import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Optional JWT Auth Guard
 * Tries to authenticate with JWT token if present, but doesn't fail if token is missing
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('account-auth') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Try to activate, but don't throw error if authentication fails
    const result = super.canActivate(context);

    // If it's a Promise, catch errors and allow request to continue
    if (result instanceof Promise) {
      return result.catch(() => {
        // If authentication fails, just continue without user
        return true;
      });
    }

    // If it's an Observable, catch errors
    if (result instanceof Observable) {
      return result.pipe(
        catchError(() => {
          // If authentication fails, just continue without user
          return of(true);
        }),
      );
    }

    // If it's a boolean, return as is
    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    // If there's an error or no user, just return null instead of throwing
    if (err || !user) {
      return null;
    }
    return user;
  }
}
