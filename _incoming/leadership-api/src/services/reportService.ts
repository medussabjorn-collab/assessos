import { AssessmentModuleId } from '../types';

interface InsightInput {
  score:         number;
  correct:       number;
  wrong:         number;
  skipped:       number;
  irtTheta:      number | null;
  irtTier:       string | null;
  subTopicScores: Record<string, { correct: number; total: number; percent: number }>;
  moduleId:      AssessmentModuleId;
}

export function generateReportInsights(input: InsightInput): string[] {
  const insights: string[] = [];
  const { score, correct, wrong, skipped, irtTheta, irtTier, subTopicScores, moduleId } = input;

  // Overall performance
  if (score >= 90) {
    insights.push('Outstanding performance — top 5% of all candidates in this module.');
  } else if (score >= 75) {
    insights.push(`Strong performance at ${score.toFixed(1)}%. You demonstrate solid competency in this area.`);
  } else if (score >= 60) {
    insights.push(`Competent performance at ${score.toFixed(1)}%. Targeted revision will push you to the next tier.`);
  } else {
    insights.push(`Score of ${score.toFixed(1)}% indicates significant gaps. A structured study plan is recommended.`);
  }

  // IRT-based insight
  if (irtTheta !== null && irtTier) {
    insights.push(
      `Adaptive IRT ability estimate: θ = ${irtTheta.toFixed(2)} — classified as ${irtTier}. ` +
      `This accounts for question difficulty, not just raw accuracy.`
    );
  }

  // Skipped questions
  if (skipped > 10) {
    insights.push(`${skipped} questions were left unanswered. Attempting all questions — even with uncertainty — can improve your score.`);
  }

  // Wrong answers
  if (wrong > 0 && correct > 0) {
    const accuracy = ((correct / (correct + wrong)) * 100).toFixed(1);
    insights.push(`Attempted-question accuracy: ${accuracy}%. Focus on reducing incorrect answers rather than skipping.`);
  }

  // Sub-topic analysis
  const entries = Object.entries(subTopicScores);
  if (entries.length > 0) {
    const weak  = entries.filter(([, s]) => s.percent < 60).sort((a, b) => a[1].percent - b[1].percent);
    const strong = entries.filter(([, s]) => s.percent >= 80).sort((a, b) => b[1].percent - a[1].percent);

    if (weak.length > 0) {
      const weakList = weak.slice(0, 2).map(([t, s]) => `${t} (${s.percent}%)`).join(', ');
      insights.push(`Weakest sub-topics: ${weakList}. Prioritise these in your next study session.`);
    }
    if (strong.length > 0) {
      const strongList = strong.slice(0, 2).map(([t, s]) => `${t} (${s.percent}%)`).join(', ');
      insights.push(`Strongest areas: ${strongList}. Maintain this level by revisiting periodically.`);
    }
  }

  // Module-specific insight
  const moduleInsights: Record<AssessmentModuleId, string> = {
    technical:     'For technical improvement, practice on LeetCode and system design resources like "Designing Data-Intensive Applications".',
    attitude:      'Attitude and values alignment is often assessed through consistency. Reflect on your professional principles and revisit edge-case scenarios.',
    behavioral:    'Behavioral questions reward structured STAR responses. Practice articulating Situation, Task, Action, Result clearly.',
    psychometric:  'Psychometric performance improves with practice on abstract reasoning and pattern recognition exercises.',
    communication: 'Communication skills benefit from deliberate practice in cross-cultural contexts and written clarity exercises.',
  };
  insights.push(moduleInsights[moduleId]);

  return insights;
}

export function calculatePercentile(score: number, allScores: number[]): number {
  if (!allScores.length) return 50;
  const below = allScores.filter(s => s < score).length;
  return Math.round((below / allScores.length) * 100);
}
