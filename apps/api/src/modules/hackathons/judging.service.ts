import { Injectable } from '@nestjs/common';

@Injectable()
export class JudgingService {
  private scores = [
    {
      id: 'score-001',
      submissionId: 'sub-001',
      criteria: {
        innovation: 9,
        execution: 8.5,
        design: 8,
        presentation: 9,
      },
      totalScore: 8.625,
      judgedBy: 'judge@example.com',
      judgedAt: new Date(),
    },
  ];

  getTopScores() {
    return this.scores
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }

  scoreSubmission(submissionId: string, criteria: any) {
    const average =
      (criteria.innovation +
        criteria.execution +
        criteria.design +
        criteria.presentation) /
      4;

    const scoreEntry = {
      id: `score-${Date.now()}`,
      submissionId,
      criteria,
      totalScore: average,
      judgedBy: 'judge@example.com',
      judgedAt: new Date(),
    };
    this.scores.push(scoreEntry);
    return scoreEntry;
  }

  getLeaderboard(hackathonId: string) {
    return {
      hackathonId,
      leaderboard: this.scores.sort((a, b) => b.totalScore - a.totalScore),
      topTeams: [
        {
          rank: 1,
          teamName: 'Code Wizards',
          score: 8.625,
          prize: '$10,000',
        },
        {
          rank: 2,
          teamName: 'Data Dragons',
          score: 8.2,
          prize: '$5,000',
        },
        {
          rank: 3,
          teamName: 'Tech Titans',
          score: 7.8,
          prize: '$2,500',
        },
      ],
    };
  }
}
