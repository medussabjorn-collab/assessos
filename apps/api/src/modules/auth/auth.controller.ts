import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../../database/prisma.service';
import { SsoConfigService } from '../tenant/sso-config.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private ssoConfigService: SsoConfigService,
  ) {}

  // #23 SSO discovery: given a work email, is there a tenant with SSO
  // configured for that domain? Public — runs before the user has any
  // session, that's the entire point (login page: "enter your work email"
  // → auto-redirect to the right IdP). Excluded from TenantMiddleware in
  // app.module.ts since there's no tenant context yet at this point.
  @Post('sso/discover')
  async discoverSso(@Body() body: { email: string }) {
    const domain = body.email?.split('@')[1]?.toLowerCase();
    if (!domain) {
      return { success: true, data: null };
    }
    const result = await this.ssoConfigService.discoverByDomain(domain);
    return { success: true, data: result };
  }

  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  async register(@Request() req: any, @Body() registerDto: RegisterDto) {
    const { uid, email } = req.user;

    let tenant: Awaited<ReturnType<typeof this.prisma.tenant.findUnique>> = null;
    if (registerDto.tenantSlug) {
      tenant = await this.prisma.tenant.findUnique({
        where: { slug: registerDto.tenantSlug },
      });

      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }
    } else {
      tenant = await this.prisma.tenant.create({
        data: {
          slug: email.split('@')[0] + '-' + Date.now(),
          name: email,
          plan: 'free',
        },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        firebaseUid: uid,
        email,
        name: email.split('@')[0],
        role: 'org_admin',
      },
    });

    await this.prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: 'free',
        seats: 5,
        assessmentCredits: 100,
      },
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
        },
      },
    };
  }

  @Post('tenant')
  @UseGuards(FirebaseAuthGuard)
  async getTenant(@Request() req: any) {
    const { uid } = req.user;

    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: {
        // userId = internal Prisma id, not the Firebase uid — this is the
        // room key RealtimeGateway/NotificationsService use (user:<id>), so
        // the socket client needs it to join the right room.
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      },
    };
  }
}
