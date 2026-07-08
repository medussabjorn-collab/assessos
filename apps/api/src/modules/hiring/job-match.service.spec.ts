import { JobMatchService } from './job-match.service';
import { JobRole } from './job-role.service';

describe('JobMatchService', () => {
  let jobRoleService: any;
  let service: JobMatchService;

  const engineerRole: JobRole = {
    id: 'software_engineer',
    title: 'Software Engineer',
    department: 'Engineering',
    description: '',
    requiredSkills: ['Programming (Python, TypeScript, Go)', 'System Design', 'Problem Solving', 'Testing'],
    niceToHaveSkills: ['Cloud Architecture', 'DevOps', 'Mentoring', 'Open Source'],
    cultureFitDimensions: [],
    technicalLevel: 'mid',
    assessmentDimensionWeights: {},
  };
  const salesRole: JobRole = {
    id: 'sales_rep',
    title: 'Sales Representative',
    department: 'Sales',
    description: '',
    requiredSkills: ['Negotiation', 'CRM Tools', 'Cold Outreach'],
    niceToHaveSkills: ['Salesforce'],
    cultureFitDimensions: [],
    technicalLevel: 'junior',
    assessmentDimensionWeights: {},
  };

  beforeEach(() => {
    jobRoleService = { listJobRoles: jest.fn().mockReturnValue([engineerRole, salesRole]) };
    service = new JobMatchService(jobRoleService);
  });

  it('returns an empty array for no skills', () => {
    expect(service.matchSkillsToRoles([])).toEqual([]);
  });

  it('matches a candidate skill against a role skill via substring containment', () => {
    const matches = service.matchSkillsToRoles(['TypeScript', 'System Design']);

    const engineerMatch = matches.find((m) => m.jobRoleId === 'software_engineer');
    expect(engineerMatch).toBeDefined();
    expect(engineerMatch!.matchedRequiredSkills).toContain('Programming (Python, TypeScript, Go)');
    expect(engineerMatch!.matchedRequiredSkills).toContain('System Design');
  });

  it('excludes roles with zero matching skills', () => {
    const matches = service.matchSkillsToRoles(['TypeScript', 'System Design']);

    expect(matches.find((m) => m.jobRoleId === 'sales_rep')).toBeUndefined();
  });

  it('weights required-skill matches higher than nice-to-have matches', () => {
    const requiredOnlyMatches = service.matchSkillsToRoles(['negotiation']);
    const niceToHaveOnlyMatches = service.matchSkillsToRoles(['salesforce']);

    const requiredScore = requiredOnlyMatches.find((m) => m.jobRoleId === 'sales_rep')!.matchScore;
    const niceToHaveScore = niceToHaveOnlyMatches.find((m) => m.jobRoleId === 'sales_rep')!.matchScore;

    expect(requiredScore).toBeGreaterThan(niceToHaveScore);
  });

  it('sorts results by matchScore descending', () => {
    const matches = service.matchSkillsToRoles([
      'Negotiation', 'CRM Tools', 'Cold Outreach', 'Salesforce', // full sales match
      'TypeScript', // partial engineer match
    ]);

    expect(matches[0].jobRoleId).toBe('sales_rep');
  });

  it('respects the limit parameter', () => {
    const matches = service.matchSkillsToRoles(['typescript', 'negotiation'], 1);

    expect(matches).toHaveLength(1);
  });

  it('is case-insensitive and trims whitespace', () => {
    const matches = service.matchSkillsToRoles(['  TYPESCRIPT  ']);

    expect(matches.find((m) => m.jobRoleId === 'software_engineer')).toBeDefined();
  });
});
