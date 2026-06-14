import { Injectable } from '@nestjs/common';

export interface JobRole {
  id: string;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  cultureFitDimensions: string[];
  technicalLevel: 'junior' | 'mid' | 'senior' | 'lead';
  assessmentDimensionWeights: Record<string, number>;
}

@Injectable()
export class JobRoleService {
  private jobRoles: Record<string, JobRole> = {
    software_engineer: {
      id: 'software_engineer',
      title: 'Software Engineer',
      department: 'Engineering',
      description: 'Build scalable systems and deliver high-quality software',
      requiredSkills: [
        'Programming (Python, TypeScript, Go)',
        'System Design',
        'Problem Solving',
        'Testing',
      ],
      niceToHaveSkills: [
        'Cloud Architecture',
        'DevOps',
        'Mentoring',
        'Open Source',
      ],
      cultureFitDimensions: [
        'collaboration',
        'innovation',
        'execution',
        'integrity',
      ],
      technicalLevel: 'mid',
      assessmentDimensionWeights: {
        'technical_depth': 0.35,
        'problem_solving': 0.25,
        'communication': 0.15,
        'collaboration': 0.15,
        'learning_ability': 0.10,
      },
    },

    product_manager: {
      id: 'product_manager',
      title: 'Product Manager',
      department: 'Product',
      description: 'Lead product vision, roadmap, and execution',
      requiredSkills: [
        'Strategic Thinking',
        'Analytics',
        'Communication',
        'Prioritization',
      ],
      niceToHaveSkills: [
        'Technical Background',
        'Design Thinking',
        'Market Research',
        'Negotiation',
      ],
      cultureFitDimensions: [
        'vision',
        'influence',
        'collaboration',
        'execution',
      ],
      technicalLevel: 'mid',
      assessmentDimensionWeights: {
        'strategic_thinking': 0.30,
        'communication': 0.25,
        'analytical': 0.20,
        'collaboration': 0.15,
        'execution': 0.10,
      },
    },

    sales_representative: {
      id: 'sales_representative',
      title: 'Sales Representative',
      department: 'Sales',
      description: 'Drive revenue through client relationships and deal closure',
      requiredSkills: [
        'Communication',
        'Relationship Building',
        'Negotiation',
        'Time Management',
      ],
      niceToHaveSkills: [
        'Industry Knowledge',
        'Presentation Skills',
        'Empathy',
        'Persistence',
      ],
      cultureFitDimensions: [
        'influence',
        'collaboration',
        'execution',
        'integrity',
      ],
      technicalLevel: 'mid',
      assessmentDimensionWeights: {
        'communication': 0.30,
        'influence': 0.25,
        'relationship_building': 0.20,
        'persistence': 0.15,
        'integrity': 0.10,
      },
    },

    data_analyst: {
      id: 'data_analyst',
      title: 'Data Analyst',
      department: 'Analytics',
      description: 'Extract insights from data to inform business decisions',
      requiredSkills: [
        'SQL',
        'Data Visualization',
        'Statistical Analysis',
        'Problem Solving',
      ],
      niceToHaveSkills: [
        'Python/R',
        'Business Acumen',
        'Dashboard Tools',
        'ML Basics',
      ],
      cultureFitDimensions: [
        'analytical_thinking',
        'collaboration',
        'communication',
        'integrity',
      ],
      technicalLevel: 'mid',
      assessmentDimensionWeights: {
        'analytical': 0.35,
        'technical': 0.25,
        'communication': 0.20,
        'attention_to_detail': 0.15,
        'learning_ability': 0.05,
      },
    },

    customer_success: {
      id: 'customer_success',
      title: 'Customer Success Manager',
      department: 'Customer Success',
      description: 'Ensure customer success and drive retention',
      requiredSkills: [
        'Communication',
        'Empathy',
        'Problem Solving',
        'Relationship Management',
      ],
      niceToHaveSkills: [
        'Technical Knowledge',
        'Analytics',
        'Presentation',
        'Training',
      ],
      cultureFitDimensions: [
        'people',
        'collaboration',
        'communication',
        'integrity',
      ],
      technicalLevel: 'mid',
      assessmentDimensionWeights: {
        'empathy': 0.25,
        'communication': 0.25,
        'problem_solving': 0.20,
        'relationship_building': 0.20,
        'execution': 0.10,
      },
    },
  };

  getJobRole(roleId: string): JobRole | null {
    return this.jobRoles[roleId] || null;
  }

  listJobRoles(): JobRole[] {
    return Object.values(this.jobRoles);
  }

  getJobRolesByDepartment(department: string): JobRole[] {
    return Object.values(this.jobRoles).filter(
      (role) => role.department === department,
    );
  }

  getJobRolesByLevel(level: string): JobRole[] {
    return Object.values(this.jobRoles).filter(
      (role) => role.technicalLevel === level,
    );
  }

  createCustomJobRole(role: JobRole): JobRole {
    this.jobRoles[role.id] = role;
    return role;
  }
}
