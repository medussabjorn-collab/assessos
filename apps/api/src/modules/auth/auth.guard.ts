import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // DEV ONLY: bypass Firebase verification while auth is being deferred.
    // Never set AUTH_DISABLED=true in a real deployment — it grants every
    // request the seeded manager identity with no credential check.
    if (process.env.AUTH_DISABLED === 'true') {
      // Dev affordance: an `x-dev-uid` / `x-dev-email` header overrides the
      // injected identity per-request, so admin vs non-admin routes can be
      // exercised without restarting. Header only, dev only.
      request.user = {
        uid:
          request.headers['x-dev-uid'] ||
          process.env.AUTH_DISABLED_UID ||
          'seed-manager-uid',
        email:
          request.headers['x-dev-email'] ||
          process.env.AUTH_DISABLED_EMAIL ||
          'manager@assessos.test',
      };
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.authService.verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch (error) {
      return false;
    }
  }
}
