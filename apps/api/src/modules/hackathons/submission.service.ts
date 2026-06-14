import { Injectable } from '@nestjs/common';

@Injectable()
export class SubmissionService {
  private submissions = [
    {
      id: 'sub-001',
      hackathonId: 'hack-2024-q2',
      teamId: 'team-001',
      title: 'AI Code Review Tool',
      description: 'Auto-review code with AI',
      repoUrl: 'https://github.com/codewizards/ai-review',
      videoUrl: 'https://youtube.com/watch?v=demo',
      submittedAt: new Date(),
      status: 'submitted',
    },
  ];

  getRecentSubmissions() {
    return this.submissions.sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }

  getSubmission(id: string) {
    return this.submissions.find((s) => s.id === id);
  }

  submitProject(hackathonId: string, teamId: string, submission: any) {
    const newSubmission = {
      id: `sub-${Date.now()}`,
      hackathonId,
      teamId,
      title: submission.title,
      description: submission.description,
      repoUrl: submission.repoUrl,
      videoUrl: submission.videoUrl,
      submittedAt: new Date(),
      status: 'submitted',
    };
    this.submissions.push(newSubmission);
    return newSubmission;
  }

  getHackathonSubmissions(hackathonId: string) {
    return this.submissions.filter((s) => s.hackathonId === hackathonId);
  }
}
