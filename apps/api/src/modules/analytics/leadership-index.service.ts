import { Injectable } from '@nestjs/common';

export interface DimensionScore {
  dimension: string;
  score: number;
  weight: number;
}

export interface LeadershipIndexResult {
  leadershipIndex: number;
  dimensionScores: DimensionScore[];
  tier: 'emerging' | 'solid' | 'strong' | 'exceptional';
  strengths: string[];
  developmentAreas: string[];
  successorReadiness: number;
}

@Injectable()
export class LeadershipIndexService {
  private readonly dimensionWeights: Record<string, number> = {
    vision: 0.15,
    influence: 0.12,
    execution: 0.15,
    people: 0.14,
    innovation: 0.12,
    emotional_intelligence: 0.14,
    integrity: 0.1,
    collaboration: 0.12,
  };

  private readonly tierThresholds = {
    emerging: { min: 0, max: 2.5 },
    solid: { min: 2.5, max: 3.5 },
    strong: { min: 3.5, max: 4.5 },
    exceptional: { min: 4.5, max: 5.0 },
  };

  calculateLeadershipIndex(
    dimensionScores: Record<string, number>,
  ): LeadershipIndexResult {
    // Validate input
    if (!dimensionScores || Object.keys(dimensionScores).length === 0) {
      throw new Error('No dimension scores provided');
    }

    // Calculate weighted composite score
    const weightedScores: DimensionScore[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const weight = this.dimensionWeights[dimension] || 0.125; // Default equal weight
      const weightedScore = score * weight;

      weightedScores.push({
        dimension,
        score,
        weight,
      });

      totalWeightedScore += weightedScore;
      totalWeight += weight;
    }

    // Normalize to 0-5 scale
    const leadershipIndex = totalWeightedScore / totalWeight;

    // Determine tier
    const tier = this.getTier(leadershipIndex);

    // Identify strengths (scores >= 4)
    const strengths = weightedScores
      .filter((d) => d.score >= 4)
      .map((d) => this.getTierLabel(d.dimension));

    // Identify development areas (scores <= 2.5)
    const developmentAreas = weightedScores
      .filter((d) => d.score <= 2.5)
      .map((d) => this.getTierLabel(d.dimension));

    // Calculate successor readiness (0-100)
    const successorReadiness = this.calculateSuccessorReadiness(
      leadershipIndex,
      dimensionScores,
    );

    return {
      leadershipIndex: Math.round(leadershipIndex * 100) / 100,
      dimensionScores: weightedScores,
      tier,
      strengths,
      developmentAreas,
      successorReadiness,
    };
  }

  private getTier(
    score: number,
  ): 'emerging' | 'solid' | 'strong' | 'exceptional' {
    if (score >= 4.5) return 'exceptional';
    if (score >= 3.5) return 'strong';
    if (score >= 2.5) return 'solid';
    return 'emerging';
  }

  private getTierLabel(dimension: string): string {
    const labels: Record<string, string> = {
      vision: 'Vision & Strategy',
      influence: 'Influence & Communication',
      execution: 'Execution & Accountability',
      people: 'People Development',
      innovation: 'Innovation & Adaptability',
      emotional_intelligence: 'Emotional Intelligence',
      integrity: 'Integrity & Ethics',
      collaboration: 'Collaboration & Partnership',
    };
    return labels[dimension] || dimension;
  }

  private calculateSuccessorReadiness(
    leadershipIndex: number,
    dimensionScores: Record<string, number>,
  ): number {
    // Successor readiness based on:
    // - Overall leadership index (40%)
    // - People development (30%)
    // - Execution (30%)
    const peopleScore = dimensionScores['people'] || 0;
    const executionScore = dimensionScores['execution'] || 0;

    const readiness =
      leadershipIndex * 0.4 + peopleScore * 0.3 + executionScore * 0.3;

    return Math.min(100, Math.round((readiness / 5) * 100));
  }

  assignSuccessionTier(
    successorReadiness: number,
  ): 'ready_now' | 'ready_2yr' | 'ready_5yr' | 'not_ready' {
    if (successorReadiness >= 80) return 'ready_now';
    if (successorReadiness >= 60) return 'ready_2yr';
    if (successorReadiness >= 40) return 'ready_5yr';
    return 'not_ready';
  }

  calculateOrgHealth(
    leadershipIndexScores: number[],
  ): {
    avgIndex: number;
    medianIndex: number;
    distribution: Record<string, number>;
    healthRating: string;
  } {
    if (leadershipIndexScores.length === 0) {
      return {
        avgIndex: 0,
        medianIndex: 0,
        distribution: {},
        healthRating: 'No data',
      };
    }

    const sorted = [...leadershipIndexScores].sort((a, b) => a - b);
    const avgIndex =
      Math.round(
        (leadershipIndexScores.reduce((a, b) => a + b, 0) /
          leadershipIndexScores.length) *
          100,
      ) / 100;
    const medianIndex =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const distribution = {
      exceptional: leadershipIndexScores.filter((s) => s >= 4.5).length,
      strong: leadershipIndexScores.filter((s) => s >= 3.5 && s < 4.5).length,
      solid: leadershipIndexScores.filter((s) => s >= 2.5 && s < 3.5).length,
      emerging: leadershipIndexScores.filter((s) => s < 2.5).length,
    };

    let healthRating = 'At Risk';
    if (avgIndex >= 4.0) healthRating = 'Exceptional';
    else if (avgIndex >= 3.5) healthRating = 'Strong';
    else if (avgIndex >= 3.0) healthRating = 'Healthy';
    else if (avgIndex >= 2.5) healthRating = 'Needs Attention';

    return {
      avgIndex,
      medianIndex,
      distribution,
      healthRating,
    };
  }
}
