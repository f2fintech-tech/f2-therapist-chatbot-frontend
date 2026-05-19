import type { Goal } from "@/utils/localGoals";
import {
  archetypeDescriptions,
  goalProgressDimensions,
  goalProgressQuestions,
  goalProgressSectionMeta,
  type FinancialArchetype,
  type GoalProgressAnswerMap,
  type GoalProgressDimensionId,
} from "./goalProgressConfig";

export type GoalProgressSectionScore = {
  sectionId: string;
  title: string;
  score: number;
  max: number;
  percentage: number;
};

export type GoalProgressRiskLevel = "Low" | "Medium" | "High";

export type GoalProgressRiskArea = {
  sectionId: string;
  title: string;
  riskScore: number;
  riskLevel: GoalProgressRiskLevel;
  note: string;
};

export type GoalPsychologyProfile = {
  title: string;
  summary: string;
  dominantDrivers: string[];
};

export type GoalProgressResult = {
  archetype: FinancialArchetype;
  archetypeSummary: string;
  goalAchievabilityScore: number;
  financialDisciplineScore: number;
  emotionalSpendingMeter: number;
  financialResilienceMeter: number;
  profile: GoalPsychologyProfile;
  overallRiskScore: number;
  overallRiskLevel: GoalProgressRiskLevel;
  riskIndicators: string[];
  strengthAreas: string[];
  recommendations: string[];
  dimensionScores: Record<GoalProgressDimensionId, number>;
  sectionScores: GoalProgressSectionScore[];
  riskAreas: GoalProgressRiskArea[];
  activeGoalCount: number;
  totalGoalAmount: number;
  totalCurrentAmount: number;
  goalCompletionPercent: number;
};

const DIMENSION_LABELS: Record<GoalProgressDimensionId, string> = {
  spendingIntentionality: "Intentional spending",
  emotionalControl: "Emotional control",
  savingConsistency: "Saving consistency",
  discipline: "Discipline",
  patience: "Financial patience",
  longTermThinking: "Long-term thinking",
  impulseControl: "Impulse resistance",
  lifestyleControl: "Lifestyle control",
  goalCommitment: "Goal commitment",
  moneyRelationship: "Emotional relationship with money",
};

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round((value / 5) * 100)));
}

function clamp100(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getRiskLevel(score: number): GoalProgressRiskLevel {
  if (score >= 70) {
    return "High";
  }

  if (score >= 35) {
    return "Medium";
  }

  return "Low";
}

function getOptionScore(questionId: string, optionLabel: string | undefined) {
  const question = goalProgressQuestions.find((entry) => entry.id === questionId);
  if (!question || !optionLabel) {
    return null;
  }

  return question.options.find((option) => option.label === optionLabel) ?? null;
}

function computeDimensionScores(answers: GoalProgressAnswerMap): Record<GoalProgressDimensionId, number> {
  const totals = goalProgressDimensions.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {} as Record<GoalProgressDimensionId, number>);

  const counts = goalProgressDimensions.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {} as Record<GoalProgressDimensionId, number>);

  Object.entries(answers).forEach(([questionId, selectedLabel]) => {
    const selected = getOptionScore(questionId, selectedLabel);
    if (!selected) {
      return;
    }

    Object.entries(selected.weights).forEach(([dimensionId, score]) => {
      if (typeof score !== "number") {
        return;
      }

      const key = dimensionId as GoalProgressDimensionId;
      totals[key] += score;
      counts[key] += 1;
    });
  });

  return goalProgressDimensions.reduce((accumulator, key) => {
    if (counts[key] === 0) {
      accumulator[key] = 0;
      return accumulator;
    }

    accumulator[key] = toPercent(totals[key] / counts[key]);
    return accumulator;
  }, {} as Record<GoalProgressDimensionId, number>);
}

function computeSectionScores(answers: GoalProgressAnswerMap): GoalProgressSectionScore[] {
  return goalProgressSectionMeta.map((section) => {
    const sectionQuestions = goalProgressQuestions.filter((question) => question.sectionId === section.id);
    const max = sectionQuestions.length * 5;

    const score = sectionQuestions.reduce((sum, question) => {
      const selected = getOptionScore(question.id, answers[question.id]);
      if (!selected) {
        return sum;
      }

      const values = Object.values(selected.weights);
      const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return sum + average;
    }, 0);

    const percentage = max > 0 ? clamp100((score / max) * 100) : 0;

    return {
      sectionId: section.id,
      title: section.title,
      score: Math.round(score),
      max,
      percentage,
    };
  });
}

function buildRiskAreas(sectionScores: GoalProgressSectionScore[]): GoalProgressRiskArea[] {
  return sectionScores.map((section) => {
    const riskScore = clamp100(100 - section.percentage);
    const riskLevel = getRiskLevel(riskScore);

    return {
      sectionId: section.sectionId,
      title: section.title,
      riskScore,
      riskLevel,
      note:
        riskLevel === "High"
          ? "This area is most likely to disrupt your goal timeline if it stays unchanged."
          : riskLevel === "Medium"
            ? "This area deserves attention because it may create friction under pressure."
            : "This area looks stable relative to your other behavioral patterns.",
    };
  });
}

function computeGoalSnapshot(goals: Goal[]) {
  const activeGoals = goals.filter((goal) => goal.targetAmount > 0 && goal.currentAmount < goal.targetAmount);
  const fallbackGoals = activeGoals.length > 0 ? activeGoals : goals.filter((goal) => goal.targetAmount > 0);

  const totalGoalAmount = fallbackGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = fallbackGoals.reduce((sum, goal) => sum + Math.min(goal.currentAmount, goal.targetAmount), 0);
  const goalCompletionPercent = totalGoalAmount > 0 ? clamp100((totalCurrentAmount / totalGoalAmount) * 100) : 0;

  return {
    activeGoalCount: fallbackGoals.length,
    totalGoalAmount,
    totalCurrentAmount,
    goalCompletionPercent,
  };
}

function getArchetype(scores: Record<GoalProgressDimensionId, number>): FinancialArchetype {
  const emotionalRisk = scores.emotionalControl < 45 || scores.impulseControl < 45;
  const consistencyRisk = scores.discipline < 50 || scores.savingConsistency < 50;
  const lifestyleRisk = scores.lifestyleControl < 45 && scores.spendingIntentionality < 55;

  if (scores.goalCommitment >= 75 && scores.longTermThinking >= 75 && scores.discipline >= 70) {
    return "Future Builder";
  }

  if (emotionalRisk && scores.moneyRelationship < 55) {
    return "Emotional Spender";
  }

  if (scores.savingConsistency >= 70 && scores.discipline >= 68 && scores.emotionalControl >= 62) {
    return "Stability Planner";
  }

  if (lifestyleRisk) {
    return "Lifestyle Drifter";
  }

  if (consistencyRisk) {
    return "Discipline Challenger";
  }

  return "Momentum Seeker";
}

function getProfile(scores: Record<GoalProgressDimensionId, number>, archetype: FinancialArchetype): GoalPsychologyProfile {
  if (archetype === "Emotional Spender") {
    return {
      title: "Emotion-Led Spending Pattern",
      summary: "Your strongest growth lever is building a pause between emotion and transaction.",
      dominantDrivers: ["Stress reaction", "Social pressure", "Impulse relief"],
    };
  }

  if (archetype === "Lifestyle Drifter") {
    return {
      title: "Lifestyle Drift Pattern",
      summary: "Income gains are not consistently converting into goal momentum yet.",
      dominantDrivers: ["Lifestyle inflation", "Subscription creep", "Weak spending boundaries"],
    };
  }

  if (scores.longTermThinking >= 70 && scores.patience >= 65) {
    return {
      title: "Future-Oriented Builder Pattern",
      summary: "You are mostly making present-day choices that support future outcomes.",
      dominantDrivers: ["Delayed gratification", "Goal clarity", "Consistent self-regulation"],
    };
  }

  return {
    title: "Momentum With Friction Pattern",
    summary: "You have motivation and intent, but a few habits are reducing compounding progress.",
    dominantDrivers: ["Inconsistent follow-through", "Stress-season spending", "Plan drift"],
  };
}

function buildRiskIndicators(scores: Record<GoalProgressDimensionId, number>, goalCompletionPercent: number): string[] {
  const risks: string[] = [];

  if (scores.impulseControl < 50) {
    risks.push("Impulse spending may be interrupting your contribution rhythm.");
  }

  if (scores.emotionalControl < 50) {
    risks.push("Stress-linked spending triggers are likely reducing monthly stability.");
  }

  if (scores.lifestyleControl < 50) {
    risks.push("Lifestyle inflation risk may rise as income increases.");
  }

  if (scores.savingConsistency < 55) {
    risks.push("Saving consistency is fragile, which can delay goal timelines.");
  }

  if (goalCompletionPercent < 35) {
    risks.push("Current progress against active goals suggests a pace mismatch.");
  }

  return risks.slice(0, 4);
}

function buildStrengthAreas(scores: Record<GoalProgressDimensionId, number>): string[] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([dimensionId, score]) => `${DIMENSION_LABELS[dimensionId as GoalProgressDimensionId]} (${score}/100)`);
}

function buildRecommendations(
  scores: Record<GoalProgressDimensionId, number>,
  archetype: FinancialArchetype,
  goalCompletionPercent: number,
): string[] {
  const actions: string[] = [];

  if (scores.emotionalControl < 55) {
    actions.push("Create a 24-hour pause rule for non-essential purchases during stressful days.");
  }

  if (scores.savingConsistency < 60) {
    actions.push("Automate a weekly micro-transfer toward each active goal to reduce decision fatigue.");
  }

  if (scores.lifestyleControl < 60) {
    actions.push("Use an income-split ritual: allocate a fixed share of every income increase directly to goals.");
  }

  if (scores.longTermThinking < 60) {
    actions.push("Write a one-line future statement for each goal and review it before discretionary spending.");
  }

  if (goalCompletionPercent < 50) {
    actions.push("Set a realistic 90-day sprint target for one priority goal to rebuild visible momentum.");
  }

  if (archetype === "Future Builder") {
    actions.push("Protect your edge by scheduling a monthly anti-drift review to keep lifestyle creep contained.");
  }

  if (archetype === "Emotional Spender") {
    actions.push("Build a non-spending stress menu: walk, journaling, call a friend, or breathing cycle before checkout.");
  }

  if (archetype === "Discipline Challenger") {
    actions.push("Lower the activation barrier: make contributions smaller but non-negotiable.");
  }

  if (actions.length < 5) {
    actions.push("Run this assessment again in 30 days to compare behavior trend, not just one-time scores.");
  }

  return actions.slice(0, 6);
}

export function calculateGoalProgressResult(answers: GoalProgressAnswerMap, goals: Goal[]): GoalProgressResult {
  const dimensionScores = computeDimensionScores(answers);
  const sectionScores = computeSectionScores(answers);
  const riskAreas = buildRiskAreas(sectionScores);
  const goalSnapshot = computeGoalSnapshot(goals);
  const overallRiskScore = clamp100(riskAreas.length > 0 ? riskAreas.reduce((sum, area) => sum + area.riskScore, 0) / riskAreas.length : 0);
  const overallRiskLevel = getRiskLevel(overallRiskScore);

  const goalAchievabilityScore = clamp100(
    dimensionScores.goalCommitment * 0.24 +
      dimensionScores.discipline * 0.2 +
      dimensionScores.savingConsistency * 0.18 +
      dimensionScores.longTermThinking * 0.18 +
      goalSnapshot.goalCompletionPercent * 0.2,
  );

  const financialDisciplineScore = clamp100(
    dimensionScores.discipline * 0.25 +
      dimensionScores.savingConsistency * 0.22 +
      dimensionScores.impulseControl * 0.2 +
      dimensionScores.patience * 0.16 +
      dimensionScores.lifestyleControl * 0.17,
  );

  const emotionalSpendingMeter = clamp100(
    dimensionScores.emotionalControl * 0.55 +
      dimensionScores.moneyRelationship * 0.25 +
      dimensionScores.impulseControl * 0.2,
  );

  const financialResilienceMeter = clamp100(
    goalAchievabilityScore * 0.45 +
      emotionalSpendingMeter * 0.25 +
      dimensionScores.longTermThinking * 0.2 +
      dimensionScores.spendingIntentionality * 0.1,
  );

  const archetype = getArchetype(dimensionScores);
  const profile = getProfile(dimensionScores, archetype);

  return {
    archetype,
    archetypeSummary: archetypeDescriptions[archetype],
    goalAchievabilityScore,
    financialDisciplineScore,
    emotionalSpendingMeter,
    financialResilienceMeter,
    profile,
    overallRiskScore,
    overallRiskLevel,
    riskIndicators: buildRiskIndicators(dimensionScores, goalSnapshot.goalCompletionPercent),
    strengthAreas: buildStrengthAreas(dimensionScores),
    recommendations: buildRecommendations(dimensionScores, archetype, goalSnapshot.goalCompletionPercent),
    dimensionScores,
    sectionScores,
    riskAreas,
    activeGoalCount: goalSnapshot.activeGoalCount,
    totalGoalAmount: goalSnapshot.totalGoalAmount,
    totalCurrentAmount: goalSnapshot.totalCurrentAmount,
    goalCompletionPercent: goalSnapshot.goalCompletionPercent,
  };
}
