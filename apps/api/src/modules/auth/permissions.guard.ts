import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './permissions.decorator';
import { PermissionsService } from './permissions.service';

/**
 * Runs after FirebaseAuthGuard. Always resolves the real User row (+ their
 * full permission set) and stashes it on `req.resolvedUser` — handlers that
 * just need the user's Prisma id/tenantId no longer need their own
 * `resolveUser`/`user()` helper. If the route also has @RequirePermission(),
 * denies unless the resolved user's role grants that permission; routes
 * with no decorator just get the resolved user attached, same as before
 * RBAC's per-controller "fetch user by firebaseUid" boilerplate.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const uid = req.user?.uid;
    const tenantId = req.headers['x-tenant-id'];
    if (!uid) throw new UnauthorizedException();

    const user = await this.permissions.resolveUser(uid, tenantId);
    if (!user) throw new ForbiddenException('User not found');
    req.resolvedUser = user;

    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required && !this.permissions.hasPermission(user, required)) {
      throw new ForbiddenException(`Missing permission: ${required}`);
    }

    return true;
  }
}
