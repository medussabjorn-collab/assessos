import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { MarketingService } from './marketing.service';
import { ContactLeadDto } from './dto/contact-lead.dto';
import { StudentRegistrationDto } from './dto/student-registration.dto';

// Public, unauthenticated by design (prelim.io marketing site has no
// tenant/user context) — both routes are also excluded from
// TenantMiddleware in app.module.ts. No global ValidationPipe exists in
// this app (confirmed elsewhere in the codebase), so validation is scoped
// locally here rather than relying on one; transform:true is required or
// class-validator never runs against a real DTO instance.
@Controller('api/marketing')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  @Post('contact')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async contact(@Body() dto: ContactLeadDto, @Req() req: Request) {
    return this.marketing.submitContactLead(dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: StudentRegistrationDto, @Req() req: Request) {
    return this.marketing.submitStudentRegistration(dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}
