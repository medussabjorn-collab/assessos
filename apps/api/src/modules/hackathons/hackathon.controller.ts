import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { HackathonService } from './hackathon.service';

@Controller('api/hackathons')
export class HackathonController {
  constructor(private hackathons: HackathonService) {}

  @Get()
  listHackathons() {
    return { success: true, data: this.hackathons.listHackathons() };
  }

  @Get(':id')
  getHackathon(@Param('id') id: string) {
    return { success: true, data: this.hackathons.getHackathon(id) };
  }

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard)
  getDashboard() {
    return { success: true, data: this.hackathons.getDashboard() };
  }

  @Post(':hackathonId/teams')
  @UseGuards(FirebaseAuthGuard)
  registerTeam(@Param('hackathonId') hackathonId: string, @Body() body: any) {
    return {
      success: true,
      data: this.hackathons.registerTeam(
        hackathonId,
        body.teamName,
        body.members,
      ),
    };
  }

  @Post(':hackathonId/teams/:teamId/submit')
  @UseGuards(FirebaseAuthGuard)
  submitProject(
    @Param('hackathonId') hackathonId: string,
    @Param('teamId') teamId: string,
    @Body() body: any,
  ) {
    return {
      success: true,
      data: this.hackathons.submitProject(hackathonId, teamId, body),
    };
  }

  @Post(':hackathonId/score/:submissionId')
  @UseGuards(FirebaseAuthGuard)
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() body: any,
  ) {
    return {
      success: true,
      data: this.hackathons.gradeSubmission(submissionId, body.criteria),
    };
  }

  @Get(':hackathonId/leaderboard')
  getLeaderboard(@Param('hackathonId') hackathonId: string) {
    return { success: true, data: this.hackathons.getLeaderboard(hackathonId) };
  }
}
