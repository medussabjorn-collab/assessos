import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { ReportingService } from './reporting.service';

@Controller('api/reports')
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

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
