import { ForbiddenException, Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

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

      // Soft-deactivated users are blocked everywhere, not just on
      // permission-gated routes — a plain email/password lookup by
      // firebaseUid (globally unique), no tenant needed here. A user not
      // found yet (e.g. mid-registration) is allowed through — register()
      // creates them.
      const user = await this.prisma.user.findFirst({
        where: { firebaseUid: decodedToken.uid },
        select: { isActive: true },
      });
      if (user && !user.isActive) {
        throw new ForbiddenException('Your account has been deactivated');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      return false;
    }
  }
}
