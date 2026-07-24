import { Injectable } from '@nestjs/common';
import { JobRoleService, JobRole } from './job-role.service';

/**
 * Serves both #24 (pre-assessment: "suggest best-fit roles from a resume
 * upload") and #25 (post-assessment: "if not selected, suggest better-fit
 * roles"). Deliberately NOT resume file parsing — no PDF/OCR/NLP dependency
 * exists in this codebase, and adding one is an integration decision, not
 * something to casually bolt on. This takes a skills list (however the
 * caller extracts it — pasted text split on commas, a structured profile
 * field, etc.) and matches against JobRoleService's real, already-defined
 * role requirements via keyword overlap. Real matching logic against real
 * data, not a fabricated ML relevance score.
 */

export interface JobMatch {
  jobRoleId: string;
  title: string;
  department: string;
  matchScore: number; // 0-1
  matchedRequiredSkills: string[];
  matchedNiceToHaveSkills: string[];
}

@Injectable()
export class JobMatchService {
  constructor(private jobRoleService: JobRoleService) {}

  matchSkillsToRoles(skills: string[], limit = 5): JobMatch[] {
    const normalizedSkills = skills.map((s) => s.toLowerCase().trim()).filter(Boolean);
    if (normalizedSkills.length === 0) return [];

    const roles = this.jobRoleService.listJobRoles();

    const matches = roles.map((role) => this.scoreRole(role, normalizedSkills));
    return matches
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  private scoreRole(role: JobRole, normalizedSkills: string[]): JobMatch {
    const matchedRequired = role.requiredSkills.filter((skill) =>
      this.skillMatches(skill, normalizedSkills),
    );
    const matchedNiceToHave = role.niceToHaveSkills.filter((skill) =>
      this.skillMatches(skill, normalizedSkills),
    );

    // Required skills weighted higher than nice-to-have — a required-skill
    // match matters more to fit than a nice-to-have one.
    const totalPossible = role.requiredSkills.length * 2 + role.niceToHaveSkills.length;
    const achieved = matchedRequired.length * 2 + matchedNiceToHave.length;
    const matchScore = totalPossible > 0 ? Math.round((achieved / totalPossible) * 1000) / 1000 : 0;

    return {
      jobRoleId: role.id,
      title: role.title,
      department: role.department,
      matchScore,
      matchedRequiredSkills: matchedRequired,
      matchedNiceToHaveSkills: matchedNiceToHave,
    };
  }

  // A role skill like "Programming (Python, TypeScript, Go)" matches a
  // candidate skill "typescript" via substring containment either
  // direction — catches both specific-in-general and general-in-specific
  // phrasing without needing a synonym dictionary.
  private skillMatches(roleSkill: string, normalizedCandidateSkills: string[]): boolean {
    const normalizedRoleSkill = roleSkill.toLowerCase();
    return normalizedCandidateSkills.some(
      (skill) => normalizedRoleSkill.includes(skill) || skill.includes(normalizedRoleSkill),
    );
  }
}
