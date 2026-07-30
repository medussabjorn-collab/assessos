import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { ReportingService } from './reporting.service';
import { ReportPdfService } from './report-pdf.service';
import { WhiteLabelService } from '../tenant/white-label.service';

@Controller('api/reports')
export class ReportingController {
  constructor(
    private reportingService: ReportingService,
    private reportPdfService: ReportPdfService,
    private whiteLabelService: WhiteLabelService,
  ) {}

  @Get(':reportId')
  @UseGuards(FirebaseAuthGuard)
  async getReport(
    @Request() req: any,
    @Param('reportId') reportId: string,
  ) {
    const { uid } = req.user;
    const report = await this.reportingService.getReport(reportId, uid);

    return {
      success: true,
      data: report,
    };
  }

  // Reuses reportingService.getReport's exact tenant+owner authorization —
  // the PDF route must never be less strict than the JSON one.
  @Get(':reportId/pdf')
  @UseGuards(FirebaseAuthGuard)
  async getReportPdf(
    @Request() req: any,
    @Param('reportId') reportId: string,
    @Res() res: Response,
  ) {
    const { uid } = req.user;
    const report = await this.reportingService.getReport(reportId, uid);
    const branding = await this.whiteLabelService.getSettings();
    const pdf = await this.reportPdfService.generatePdf(report, branding);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
    res.send(pdf);
  }

  @Post('sessions/:sessionId/request')
  @UseGuards(FirebaseAuthGuard)
  async requestReportGeneration(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    const { uid } = req.user;
    const report = await this.reportingService.requestReportGeneration(
      sessionId,
      uid,
    );

    return {
      success: true,
      data: report,
      message: 'Report generation started',
    };
  }

  @Get('user/list')
  @UseGuards(FirebaseAuthGuard)
  async listUserReports(@Request() req: any) {
    const { uid } = req.user;
    const reports = await this.reportingService.listReports(uid);

    return {
      success: true,
      data: reports,
    };
  }
}
