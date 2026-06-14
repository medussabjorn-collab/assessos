import { Injectable } from '@nestjs/common';
import { LeadershipIndexService } from '../analytics/leadership-index.service';

export interface HiringScore {
  technicalScore: number;
  cultureFitScore: number;
  overallScore: number;
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  strengths: string[];
  gaps: string[];
  recommendedRoundsNext: string[];
}

@Injectable()
export class HiringScoreService {
  constructor(private leadershipIndex: LeadershipIndexService) {}

  calculateHiringScore(
    jobRoleAssessmentScores: Record<string, number>,
    leadershipScores: Record<string, number>,
    jobRole: any,
  ): HiringScore {
    // Calculate technical score from job-specific assessment
    const technicalScore = this.calculateTechnicalScore(
      jobRoleAssessmentScores,
      jobRole,
    );

    // Calculate culture fit from leadership dimensions
    const cultureFitScore = this.calculateCultureFitScore(
      leadershipScores,
      jobRole,
    );

    // Calculate overall score (weighted combination)
    const overallScore = technicalScore * 0.6 + cultureFitScore * 0.4;

    // Determine recommendation
    const recommendation = this.getRecommendation(
      technicalScore,
      cultureFitScore,
      overallScore,
    );

    // Identify strengths and gaps
    const { strengths, gaps } = this.identifyStrengthsAndGaps(
      jobRoleAssessmentScores,
      leadershipScores,
      jobRole,
    );

    // Recommend next rounds
    const recommendedRoundsNext = this.recommendNextRounds(
      technicalScore,
      cultureFitScore,
      recommendation,
    );

    return {
      technicalScore: Math.round(technicalScore * 100) / 100,
      cultureFitScore: Math.round(cultureFitScore * 100) / 100,
      overallScore: Math.round(overallScore * 100) / 100,
      recommendation,
      strengths,
      gaps,
      recommendedRoundsNext,
    };
  }

  private calculateTechnicalScore(
    assessmentScores: Record<string, number>,
    jobRole: any,
  ): number {
    if (!assessmentScores || Object.keys(assessmentScores).length === 0) {
      return 0;
    }

    // Weight scores based on job role requirements
    const weights = jobRole.assessmentDimensionWeights || {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [dimension, score] of Object.entries(assessmentScores)) {
      const weight = weights[dimension] || 0.2;
      totalWeightedScore += (score as number) * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  private calculateCultureFitScore(
    leadershipScores: Record<string, number>,
    jobRole: any,
  ): number {
    if (!leadershipScores || Object.keys(leadershipScores).length === 0) {
      return 0;
    }

    // Map leadership dimensions to culture fit
    const cultureFitDimensions = jobRole.cultureFitDimensions || [];
    const relevantScores: number[] = [];

    for (const dimension of cultureFitDimensions) {
      const score = leadershipScores[dimension];
      if (score !== undefined) {
        relevantScores.push(score);
      }
    }

    if (relevantScores.length === 0) {
      return 0;
    }

    return relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length;
  }

  private getRecommendation(
    technicalScore: number,
    cultureFitScore: number,
    overallScore: number,
  ): 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no' {
    // Threshold-based recommendation
    if (technicalScore >= 4.0 && cultureFitScore >= 3.5) {
      return 'strong_yes';
    } else if (technicalScore >= 3.5 && cultureFitScore >= 3.0) {
      return 'yes';
    } else if (overallScore >= 3.0) {
      return 'maybe';
    } else if (technicalScore >= 2.5 || cultureFitScore >= 2.5) {
      return 'no';
    } else {
      return 'strong_no';
    }
  }

  private identifyStrengthsAndGaps(
    assessmentScores: Record<string, number>,
    leadershipScores: Record<string, number>,
    jobRole: any,
  ): { strengths: string[]; gaps: string[] } {
    const strengths: string[] = [];
    const gaps: string[] = [];

    // Identify technical strengths & gaps
    for (const [skill, score] of Object.entries(assessmentScores)) {
      if ((score as number) >= 4.0) {
        strengths.push(`Strong ${skill}`);
      } else if ((score as number) < 2.5) {
        gaps.push(`Needs development in ${skill}`);
      }
    }

    // Identify cultural fit strengths & gaps
    const cultureFitDimensions = jobRole.cultureFitDimensions || [];
    for (const dimension of cultureFitDimensions) {
      const score = leadershipScores[dimension];
      if (score !== undefined) {
        if (score >= 4.0) {
          strengths.push(`Excellent ${dimension}`);
        } else if (score < 2.5) {
          gaps.push(`Limited ${dimension}`);
        }
      }
    }

    return { strengths, gaps };
  }

  private recommendNextRounds(
    technicalScore: number,
    cultureFitScore: number,
    recommendation: string,
  ): string[] {
    const rounds: string[] = [];

    if (recommendation === 'strong_yes' || recommendation === 'yes') {
      if (technicalScore >= 3.5) {
        rounds.push('culture_fit_round');
        rounds.push('offer_preparation');
      } else {
        rounds.push('technical_deep_dive');
      }
    } else if (recommendation === 'maybe') {
      if (technicalScore < cultureFitScore) {
        rounds.push('technical_assessment');
      } else {
        rounds.push('culture_fit_panel');
      }
    } else if (recommendation === 'no' || recommendation === 'strong_no') {
      rounds.push('rejection');
    }

    return rounds;
  }
}
