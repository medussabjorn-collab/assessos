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

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  async register(@Request() req: any, @Body() registerDto: RegisterDto) {
    const { uid, email } = req.user;

    let tenant = null;
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
        tenantId: user.tenantId,
        role: user.role,
      },
    };
  }
}
