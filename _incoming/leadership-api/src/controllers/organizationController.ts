import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import * as R from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const createSchema = z.object({
  name:    z.string().min(2).max(100),
  slug:    z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  domain:  z.string().optional(),
  plan:    z.enum(['starter', 'professional', 'enterprise']).default('starter'),
  maxSeats: z.number().int().min(1).max(10000).default(10),
});

const updateSchema = createSchema.partial().omit({ slug: true });

export async function listOrganizations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page  = Number(req.query.page  ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const skip  = (page - 1) * limit;

    const [total, orgs] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, sessions: true } } },
      }),
    ]);

    R.ok(res, { organizations: orgs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

export async function getOrganization(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true, sessions: true, results: true } } },
    });
    if (!org) { R.notFound(res, 'Organization not found'); return; }
    R.ok(res, org);
  } catch (err) { next(err); }
}

export async function createOrganization(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = createSchema.parse(req.body);
    const existing = await prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new AppError(409, 'Organization slug already taken');

    const org = await prisma.organization.create({ data: dto });
    R.created(res, org, 'Organization created');
  } catch (err) { next(err); }
}

export async function updateOrganization(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = updateSchema.parse(req.body);
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data:  dto,
    });
    R.ok(res, org, 'Organization updated');
  } catch (err) { next(err); }
}

export async function assignUserToOrg(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!org) { R.notFound(res, 'Organization not found'); return; }

    const userCount = await prisma.user.count({ where: { organizationId: org.id } });
    if (userCount >= org.maxSeats) throw new AppError(403, `Organization has reached its seat limit (${org.maxSeats})`);

    const user = await prisma.user.update({
      where: { id: userId },
      data:  { organizationId: org.id },
      select: { id: true, email: true, name: true, role: true, organizationId: true },
    });
    R.ok(res, user, 'User assigned to organization');
  } catch (err) { next(err); }
}

export async function getOrgMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page  = Number(req.query.page  ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const skip  = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where: { organizationId: req.params.id } }),
      prisma.user.findMany({
        where:  { organizationId: req.params.id },
        skip, take: limit,
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    R.ok(res, { users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}
