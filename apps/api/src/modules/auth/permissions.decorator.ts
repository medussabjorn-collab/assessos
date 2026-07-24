import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Gate a route on a named permission (see PermissionsService.CATALOG for the
 * full list). Must be paired with FirebaseAuthGuard + PermissionsGuard:
 *   @UseGuards(FirebaseAuthGuard, PermissionsGuard)
 *   @RequirePermission('compliance.bias_audit.view')
 */
export const RequirePermission = (key: string) => SetMetadata(PERMISSION_KEY, key);
