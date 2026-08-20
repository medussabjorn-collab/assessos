import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import {
  marketingLeadNotificationTemplate,
  studentRegistrationConfirmationTemplate,
  studentRegistrationNotificationTemplate,
} from '../email/email-templates';
import { ContactLeadDto } from './dto/contact-lead.dto';
import { StudentRegistrationDto } from './dto/student-registration.dto';

// No hardcoded fallback recipient — a missing env var should fail loudly in
// logs, not silently email nowhere.
const LEADS_EMAIL = process.env.MARKETING_LEADS_EMAIL;

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async submitContactLead(dto: ContactLeadDto, meta: { ipAddress?: string; userAgent?: string }) {
    // Honeypot: a bot gets a 200 and learns nothing, vs. a 400 that teaches
    // it to omit the field next time. Real users never populate this — it's
    // stripped client-side before send in ContactForm.tsx, so this branch
    // only catches a direct, non-browser POST to the endpoint.
    if (dto._gotcha) {
      return { id: 'discarded' };
    }

    const lead = await this.prisma.marketingLead.create({
      data: {
        name: dto.name,
        email: dto.email,
        company: dto.company,
        teamSize: dto.teamSize,
        message: dto.message,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    if (LEADS_EMAIL) {
      this.email
        .send({
          to: LEADS_EMAIL,
          subject: `New demo request — ${lead.company}`,
          html: marketingLeadNotificationTemplate(lead),
        })
        // Fire-and-forget: a transient email-provider hiccup must not turn a
        // successful, persisted lead into a 500 that makes a genuine
        // prospect resubmit and create a duplicate row.
        .catch((err) => this.logger.error(`Lead notification email failed: ${err}`));
    } else {
      this.logger.warn('MARKETING_LEADS_EMAIL is not set — new lead notification not sent.');
    }

    return { id: lead.id };
  }

  async submitStudentRegistration(
    dto: StudentRegistrationDto,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    if (dto._gotcha) {
      return { id: 'discarded' };
    }

    const registration = await this.prisma.studentRegistration.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        dateOfBirth: new Date(dto.dateOfBirth),
        studentId: dto.studentId,
        gender: dto.gender,
        universityName: dto.universityName,
        collegeName: dto.collegeName,
        industry: dto.industry,
        course: dto.course,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    if (LEADS_EMAIL) {
      this.email
        .send({
          to: LEADS_EMAIL,
          subject: `New student registration — ${registration.universityName}`,
          html: studentRegistrationNotificationTemplate(registration),
        })
        .catch((err) => this.logger.error(`Registration notification email failed: ${err}`));
    } else {
      this.logger.warn('MARKETING_LEADS_EMAIL is not set — new registration notification not sent.');
    }

    // Makes the existing StudentRegistration.tsx success-screen promise
    // ("Check your email for a confirmation") actually true.
    this.email
      .send({
        to: registration.email,
        subject: 'Registration received — Prelim',
        html: studentRegistrationConfirmationTemplate(registration.fullName),
      })
      .catch((err) => this.logger.error(`Registration confirmation email failed: ${err}`));

    return { id: registration.id };
  }
}
