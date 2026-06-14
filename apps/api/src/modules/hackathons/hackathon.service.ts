import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { TeamService } from './team.service';
import { SubmissionService } from './submission.service';
import { JudgingService } from './judging.service';

@Injectable({ scope: Scope.REQUEST })
export class HackathonService {
  constructor(
    private teams: TeamService,
    private submissions: SubmissionService,
    private judging: JudgingService,
    @Inject(REQUEST) private request: any,
  ) {}

  listHackathons() {
    return [
      {
        id: 'hack-2024-q2',
        title: '24-Hour Code Sprint',
        description: 'Build something innovative in 24 hours',
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-08-16'),
        status: 'upcoming',
        maxTeams: 50,
        teamSize: { min: 2, max: 5 },
        prizePool: 50000,
      },
      {
        id: 'hack-2024-ai',
        title: 'AI & ML Hackathon',
        description: 'Create AI-powered solutions',
        startDate: new Date('2024-09-20'),
        endDate: new Date('2024-09-22'),
        status: 'upcoming',
        maxTeams: 100,
        teamSize: { min: 3, max: 6 },
        prizePool: 100000,
      },
    ];
  }

  getHackathon(id: string) {
    const hackathons = this.listHackathons();
    return hackathons.find((h) => h.id === id);
  }

  getDashboard() {
    return {
      hackathons: this.listHackathons(),
      myTeams: this.teams.getTeams(),
      recentSubmissions: this.submissions.getRecentSubmissions(),
      topScores: this.judging.getTopScores(),
    };
  }

  async registerTeam(hackathonId: string, teamName: string, members: string[]) {
    return this.teams.createTeam(hackathonId, teamName, members);
  }

  async submitProject(hackathonId: string, teamId: string, submission: any) {
    return this.submissions.submitProject(hackathonId, teamId, submission);
  }

  async gradeSubmission(submissionId: string, scores: any) {
    return this.judging.scoreSubmission(submissionId, scores);
  }

  getLeaderboard(hackathonId: string) {
    return this.judging.getLeaderboard(hackathonId);
  }
}
