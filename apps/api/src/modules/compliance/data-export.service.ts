import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// GDPR Art. 20 (data portability) / CCPA right to know: a structured export
// of everything the platform holds that's attributable to this user.
@Injectable({ scope: Scope.REQUEST })
export class DataExportService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async exportForUser(firebaseUid: string) {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, tenantId: this.tenantId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [sessions, reports, psychometricResults, feedbackReceived, reviewRequests] =
      await Promise.all([
        this.prisma.assessmentSession.findMany({ where: { userId: user.id } }),
        this.prisma.aiReport.findMany({ where: { userId: user.id } }),
        this.prisma.psychometricResult.findMany({ where: { userId: user.id } }),
        this.prisma.raterFeedback.findMany({ where: { subjectId: user.id } }),
        this.prisma.decisionReviewRequest.findMany({
          where: { requestedById: user.id },
        }),
      ]);

    return {
      exportedAt: new Date(),
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        department: user.department,
        createdAt: user.createdAt,
      },
      assessmentSessions: sessions,
      aiReports: reports,
      psychometricResults,
      // The subject's own export must still omit rater identity — same
      // anonymity rule enforced elsewhere for isAnonymous feedback
      // (see prisma/schema.prisma RaterFeedback comment). Portability
      // doesn't override that: exporting your own data shouldn't be a
      // side channel for deanonymizing raters.
      feedbackReceived: feedbackReceived.map((f) => ({
        id: f.id,
        sessionId: f.sessionId,
        relationship: f.relationship,
        ratings: f.ratings,
        comments: f.comments,
        submittedAt: f.submittedAt,
        createdAt: f.createdAt,
        ...(f.isAnonymous ? {} : { raterId: f.raterId }),
      })),
      decisionReviewRequests: reviewRequests,
    };
  }
}
