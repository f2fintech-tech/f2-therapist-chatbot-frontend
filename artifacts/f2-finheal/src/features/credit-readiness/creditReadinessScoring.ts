import {
  creditReadinessQuestions,
  creditReadinessMaximumScore,
  creditReadinessMinimumScore,
  creditReadinessSectionMeta,
  type CreditReadinessAnswerMap,
  type CreditReadinessQuestion,
} from './creditReadinessConfig';

export type CreditReadinessLevel = 'Strong Credit Readiness' | 'Generally Credit Healthy' | 'Moderate Credit Stress Risk' | 'High Credit Pressure' | 'Critical Credit Risk Signals';

export type CreditReadinessInsight = { title: string; description: string; severity: 'low' | 'medium' | 'high' };

export type CreditReadinessResult = {
  rawScore: number;
  percentageScore: number;
  category: CreditReadinessLevel;
  risk: 'Low Risk' | 'Moderate-Low Risk' | 'Moderate Risk' | 'High Risk' | 'Very High Risk';
  summary: string;
  repaymentReliability: string;
  utilizationLevel: string;
  borrowingDependency: string;
  emotionalStress: string;
  stabilityScore: number;
  insights: CreditReadinessInsight[];
  recommendations: string[];
  sectionScores: { sectionId: string; title: string; score: number; max: number }[];
};

function getOptionScore(question: CreditReadinessQuestion, answer?: string | null) {
  const opt = question.options.find((o) => o.label === answer);
  return opt?.score ?? 0;
}

function getCategory(raw: number): CreditReadinessLevel {
  if (raw >= 63) return 'Strong Credit Readiness';
  if (raw >= 50) return 'Generally Credit Healthy';
  if (raw >= 38) return 'Moderate Credit Stress Risk';
  if (raw >= 25) return 'High Credit Pressure';
  return 'Critical Credit Risk Signals';
}

function getRiskFromCategory(cat: CreditReadinessLevel): CreditReadinessResult['risk'] {
  switch (cat) {
    case 'Strong Credit Readiness':
      return 'Low Risk';
    case 'Generally Credit Healthy':
      return 'Moderate-Low Risk';
    case 'Moderate Credit Stress Risk':
      return 'Moderate Risk';
    case 'High Credit Pressure':
      return 'High Risk';
    default:
      return 'Very High Risk';
  }
}

function buildSectionScores(answers: CreditReadinessAnswerMap) {
  return creditReadinessSectionMeta.map((section) => {
    const questions = creditReadinessQuestions.filter((q) => q.sectionId === section.sectionId);
    const score = questions.reduce((s, q) => s + getOptionScore(q, answers[q.id]), 0);
    return { sectionId: section.sectionId, title: section.title, score, max: questions.length * 5 };
  });
}

function buildDynamicInsights(answers: CreditReadinessAnswerMap, sectionScores: ReturnType<typeof buildSectionScores>) {
  const insights: CreditReadinessInsight[] = [];

  // High utilization + frequent min due
  const util = answers['credit_utilization'];
  const minDue = answers['min_due_payments'];
  if ((util === '50–75%' || util === 'More than 75%') && (minDue === 'Frequently' || minDue === 'Almost every month')) {
    insights.push({ title: 'Utilization + Minimum Due Pressure', description: 'High credit usage combined with minimum due payments may increase long-term repayment pressure.', severity: 'high' });
  }

  // Emotional stress
  if (answers['debt_emotional_stress'] === 'Very stressful' || answers['debt_emotional_stress'] === 'Constantly overwhelming') {
    insights.push({ title: 'Emotional strain from debt', description: 'Debt obligations may currently be contributing to emotional stress.', severity: 'high' });
  }

  // Stable income + strong payments
  if ((answers['income_stability'] === 'Extremely stable' || answers['income_stability'] === 'Mostly stable') && (answers['on_time_payments'] === 'Always' || answers['on_time_payments'] === 'Almost always')) {
    insights.push({ title: 'Steady income + Reliable payments', description: 'Consistent repayment behavior alongside stable income indicates healthy credit readiness.', severity: 'low' });
  }

  // Heavy credit dependency
  if (answers['dependency_on_credit'] === 'Frequently dependent' || answers['dependency_on_credit'] === 'Extremely dependent') {
    insights.push({ title: 'High credit dependency', description: 'Frequent reliance on borrowed money for monthly needs may reduce long-term flexibility.', severity: 'high' });
  }

  // Weak planning
  if (answers['planning_habits'] === 'Inconsistent' || answers['planning_habits'] === 'Poorly managed') {
    insights.push({ title: 'Weak financial planning', description: 'More structured planning may improve repayment confidence and borrowing control.', severity: 'medium' });
  }

  return insights.slice(0, 5);
}

function buildRecommendations(answers: CreditReadinessAnswerMap) {
  const recs: string[] = [];

  if (answers['credit_utilization'] === 'More than 75%' || answers['credit_utilization'] === '50–75%') {
    recs.push('Reduce credit card utilization below 30% where possible.');
  }

  if (answers['min_due_payments'] === 'Frequently' || answers['min_due_payments'] === 'Almost every month') {
    recs.push('Pay more than the minimum due to lower long-term interest burden.');
  }

  if (answers['dependency_on_credit'] === 'Frequently dependent' || answers['dependency_on_credit'] === 'Extremely dependent') {
    recs.push('Work toward covering essential monthly expenses without relying on credit.');
  }

  if (answers['missed_payments_12m'] === 'A few times' || answers['missed_payments_12m'] === 'Frequently' || answers['missed_payments_12m'] === 'Currently struggling with repayments') {
    recs.push('Prioritize stabilizing repayments and consider restructuring high-cost debt.');
  }

  if (answers['planning_habits'] === 'Inconsistent' || answers['planning_habits'] === 'Poorly managed') {
    recs.push('Set up a simple monthly budget and automate small savings or payments.');
  }

  if (recs.length === 0) {
    recs.push('Maintain current good habits: keep utilization low and continue proactive monitoring.');
  }

  return recs.slice(0, 6);
}

export function calculateCreditReadinessResult(answers: CreditReadinessAnswerMap): CreditReadinessResult {
  const rawScore = creditReadinessQuestions.reduce((sum, q) => sum + getOptionScore(q, answers[q.id]), 0);
  const percentageScore = Math.max(0, Math.min(100, Math.round(((rawScore - creditReadinessMinimumScore) / (creditReadinessMaximumScore - creditReadinessMinimumScore)) * 100)));
  const category = getCategory(rawScore);
  const risk = getRiskFromCategory(category);
  const sectionScores = buildSectionScores(answers);
  const insights = buildDynamicInsights(answers, sectionScores);
  const recommendations = buildRecommendations(answers);

  const repaymentReliability = answers['on_time_payments'] === 'Always' ? 'Highly reliable' : answers['on_time_payments'] === 'Almost always' ? 'Mostly reliable' : 'Needs improvement';
  const utilizationLevel = answers['credit_utilization'] ?? 'Unknown';
  const borrowingDependency = answers['dependency_on_credit'] ?? 'Unknown';
  const emotionalStress = answers['debt_emotional_stress'] ?? 'Unknown';
  const stabilityScore = sectionScores.reduce((s, sec) => s + sec.score, 0);

  return {
    rawScore,
    percentageScore,
    category,
    risk,
    summary: category === 'Strong Credit Readiness' ? 'Your financial and repayment behaviors suggest strong credit readiness.' : category === 'Generally Credit Healthy' ? 'Your credit behavior appears reasonably stable with room for consistency.' : category === 'Moderate Credit Stress Risk' ? 'Some behaviors may increase future credit pressure.' : category === 'High Credit Pressure' ? 'Repayment and borrowing behaviors may be placing noticeable pressure.' : 'Current behaviors may create significant credit and repayment challenges.',
    repaymentReliability,
    utilizationLevel,
    borrowingDependency,
    emotionalStress,
    stabilityScore,
    insights,
    recommendations,
    sectionScores,
  };
}

export function buildCreditRecommendations(answers: CreditReadinessAnswerMap) {
  return buildRecommendations(answers);
}
