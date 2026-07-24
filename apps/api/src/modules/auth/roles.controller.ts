import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermission } from './permissions.decorator';
import { PERMISSIONS } from './permissions.constants';
import { RolesService } from './roles.service';

@Controller('api/roles')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSIONS.ROLES_MANAGE)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get('permissions')
  async listPermissions() {
    const permissions = await this.rolesService.listPermissions();
    return { success: true, data: permissions };
  }

  @Get('users')
  async listUsers(@Request() req: any) {
    const users = await this.rolesService.listTenantUsers(req.resolvedUser.tenantId);
    return { success: true, data: users };
  }

  @Get()
  async list(@Request() req: any) {
    const roles = await this.rolesService.listRoles(req.resolvedUser.tenantId);
    return { success: true, data: roles };
  }

  @Post()
  async create(@Request() req: any, @Body() body: { name: string; description?: string; permissionKeys: string[] }) {
    const role = await this.rolesService.createRole(req.resolvedUser.tenantId, body);
    return { success: true, data: role, message: 'Role created' };
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; permissionKeys?: string[] },
  ) {
    const role = await this.rolesService.updateRole(req.resolvedUser.tenantId, id, body);
    return { success: true, data: role, message: 'Role updated' };
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.rolesService.deleteRole(req.resolvedUser.tenantId, id);
    return { success: true, message: 'Role deleted' };
  }

  @Patch('users/:userId')
  async assignUserRole(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() body: { roleId: string },
  ) {
    const user = await this.rolesService.assignUserRole(
      req.resolvedUser.tenantId,
      userId,
      body.roleId,
      req.resolvedUser.id,
    );
    return { success: true, data: user, message: 'Role assigned' };
  }
}
