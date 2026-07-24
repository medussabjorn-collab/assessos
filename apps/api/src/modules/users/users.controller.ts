import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { PrismaService } from '../../database/prisma.service';
import { UsersManagementService, UpdateUserInput } from './users-management.service';

interface ActivityItem {
  label: string;
  at: Date;
}

@Controller('api/users')
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private usersManagement: UsersManagementService,
  ) {}

  @Get()
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async list(@Request() req: any) {
    const users = await this.usersManagement.listUsers(req.resolvedUser.tenantId);
    return { success: true, data: users };
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async update(@Request() req: any, @Param('id') id: string, @Body() body: UpdateUserInput) {
    const user = await this.usersManagement.updateUser(req.resolvedUser.tenantId, id, body);
    return { success: true, data: user, message: 'User updated' };
  }

  @Post(':id/deactivate')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async deactivate(@Request() req: any, @Param('id') id: string) {
    const user = await this.usersManagement.setActive(req.resolvedUser.tenantId, id, req.resolvedUser.id, false);
    return { success: true, data: user, message: 'User deactivated' };
  }

  @Post(':id/reactivate')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async reactivate(@Request() req: any, @Param('id') id: string) {
    const user = await this.usersManagement.setActive(req.resolvedUser.tenantId, id, req.resolvedUser.id, true);
    return { success: true, data: user, message: 'User reactivated' };
  }

  @Get('me/stats')
  @UseGuards(FirebaseAuthGuard)
  async getMyStats(@Request() req: any) {
    const { uid } = req.user;
    const tenantId = req.headers['x-tenant-id'];

    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid, tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [completedSessions, activeSessions, readyReports, percentileAgg] =
      await Promise.all([
        this.prisma.assessmentSession.count({
          where: { userId: user.id, status: 'done' },
        }),
        this.prisma.assessmentSession.count({
          where: { userId: user.id, status: 'active' },
        }),
        this.prisma.aiReport.count({
          where: { userId: user.id, status: 'ready' },
        }),
        this.prisma.aiReport.aggregate({
          where: {
            userId: user.id,
            status: 'ready',
            benchmarkPercentile: { not: null },
          },
          _avg: { benchmarkPercentile: true },
        }),
      ]);

    const [recentSessions, recentReports] = await Promise.all([
      this.prisma.assessmentSession.findMany({
        where: { userId: user.id, status: { in: ['active', 'done'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { status: true, pillar: true, createdAt: true, submittedAt: true },
      }),
      this.prisma.aiReport.findMany({
        where: { userId: user.id, status: 'ready' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { benchmarkPercentile: true, updatedAt: true },
      }),
    ]);

    const activity: ActivityItem[] = [
      ...recentSessions.map((s) => ({
        label:
          s.status === 'done'
            ? `Completed ${s.pillar} assessment`
            : `Started ${s.pillar} assessment`,
        at: s.submittedAt ?? s.createdAt,
      })),
      ...recentReports.map((r) => ({
        label: r.benchmarkPercentile
          ? `Report ready — ${r.benchmarkPercentile}th percentile`
          : 'Report ready',
        at: r.updatedAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 5);

    return {
      success: true,
      data: {
        assessmentsCompleted: completedSessions,
        assessmentsInProgress: activeSessions,
        reportsReady: readyReports,
        averagePercentile: percentileAgg._avg.benchmarkPercentile
          ? Math.round(percentileAgg._avg.benchmarkPercentile)
          : null,
        recentActivity: activity,
      },
    };
  }
}
