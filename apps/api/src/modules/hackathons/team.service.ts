import { Injectable } from '@nestjs/common';

@Injectable()
export class TeamService {
  private teams = [
    {
      id: 'team-001',
      name: 'Code Wizards',
      hackathonId: 'hack-2024-q2',
      members: ['alice@example.com', 'bob@example.com'],
      status: 'active',
      createdAt: new Date(),
    },
    {
      id: 'team-002',
      name: 'Data Dragons',
      hackathonId: 'hack-2024-ai',
      members: ['charlie@example.com', 'diana@example.com', 'eve@example.com'],
      status: 'active',
      createdAt: new Date(),
    },
  ];

  getTeams() {
    return this.teams;
  }

  getTeam(id: string) {
    return this.teams.find((t) => t.id === id);
  }

  createTeam(hackathonId: string, teamName: string, members: string[]) {
    const newTeam = {
      id: `team-${Date.now()}`,
      name: teamName,
      hackathonId,
      members,
      status: 'active',
      createdAt: new Date(),
    };
    this.teams.push(newTeam);
    return newTeam;
  }

  addMember(teamId: string, memberEmail: string) {
    const team = this.getTeam(teamId);
    if (!team) throw new Error('Team not found');
    team.members.push(memberEmail);
    return team;
  }
}
