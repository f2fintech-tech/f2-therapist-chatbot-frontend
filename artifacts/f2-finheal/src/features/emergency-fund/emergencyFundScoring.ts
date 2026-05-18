import {
  emergencyFundMaximumScore,
  emergencyFundMinimumScore,
  emergencyFundQuestions,
  emergencyFundQuestionsBySection,
  emergencyFundSectionMeta,
  type EmergencyFundAnswerMap,
  type EmergencyFundInsightTone,
  type EmergencyFundQuestion,
  type EmergencyFundSectionId,
} from "./emergencyFundConfig";

export type EmergencyFundResultLevel = "Strong Emergency Preparedness" | "Moderately Prepared" | "Limited Emergency Cushion" | "Financial Vulnerability Risk" | "Critical Emergency Preparedness Gap";
export type EmergencyFundRiskLevel = "Low Risk" | "Moderate-Low Risk" | "Moderate Risk" | "High Risk" | "Very High Risk";
export type EmergencyFundStabilityRating = "Strong" | "Stable" | "Developing" | "Fragile" | "Critical";

export type EmergencyFundInsight = {
  title: string;
  description: string;
  tone: EmergencyFundInsightTone;
};

export type EmergencyFundSectionScore = {
  sectionId: EmergencyFundSectionId;
  title: string;
  score: number;
  max: number;
  percentage: number;
};

export type EmergencyFundQuestionReview = {
  question: EmergencyFundQuestion;
  selectedAnswer: string | null;
  selectedScore: number;
  isStrong: boolean;
};

export type EmergencyFundResult = {
  rawScore: number;
  percentageScore: number;
  category: EmergencyFundResultLevel;
  risk: EmergencyFundRiskLevel;
  summary: string;
  savingsStabilityRating: EmergencyFundStabilityRating;
  emergencyCoverageEstimate: string;
  emergencyCoverageMonths: number;
  emergencyPreparednessScore: number;
  emergencyPreparednessLabel: string;
  financialResilienceIndicator: string;
  savingsDisciplineIndicator: string;
  emergencyDependencyRisk: string;
  emotionalStressLevel: string;
  suggestedEmergencyFundTarget: string;
  targetCoverageMonths: number;
  coverageProgressPercent: number;
  insights: EmergencyFundInsight[];
  recommendations: string[];
  questionReview: EmergencyFundQuestionReview[];
  sectionScores: EmergencyFundSectionScore[];
};

function getScoreForQuestion(question: EmergencyFundQuestion, answers: EmergencyFundAnswerMap) {
  const selectedAnswer = answers[question.id] ?? null;
  const selectedOption = question.options.find((option) => option.label === selectedAnswer) ?? null;
  return {
    selectedAnswer,
    selectedScore: selectedOption?.score ?? 0,
    isStrong: (selectedOption?.score ?? 0) >= 4,
  };
}

function scoreBand(rawScore: number): EmergencyFundResultLevel {
  if (rawScore >= 63) return "Strong Emergency Preparedness";
  if (rawScore >= 50) return "Moderately Prepared";
  if (rawScore >= 38) return "Limited Emergency Cushion";
  if (rawScore >= 25) return "Financial Vulnerability Risk";
  return "Critical Emergency Preparedness Gap";
}

function riskForBand(category: EmergencyFundResultLevel): EmergencyFundRiskLevel {
  if (category === "Strong Emergency Preparedness") return "Low Risk";
  if (category === "Moderately Prepared") return "Moderate-Low Risk";
  if (category === "Limited Emergency Cushion") return "Moderate Risk";
  if (category === "Financial Vulnerability Risk") return "High Risk";
  return "Very High Risk";
}

function stabilityForBand(category: EmergencyFundResultLevel): EmergencyFundStabilityRating {
  if (category === "Strong Emergency Preparedness") return "Strong";
  if (category === "Moderately Prepared") return "Stable";
  if (category === "Limited Emergency Cushion") return "Developing";
  if (category === "Financial Vulnerability Risk") return "Fragile";
  return "Critical";
}

function coverageMonthsFromQuestion(answer: string | null) {
  switch (answer) {
    case "More than 12 months":
      return 12;
    case "6-12 months":
      return 9;
    case "3-6 months":
      return 4.5;
    case "1-3 months":
      return 2;
    case "Less than 1 month":
      return 0.5;
    default:
      return 0;
  }
}

function coverageLabel(months: number) {
  if (months >= 12) return "12+ months";
  if (months >= 6) return "6-12 months";
  if (months >= 3) return "3-6 months";
  if (months >= 1) return "1-3 months";
  if (months > 0) return "Less than 1 month";
  return "Unavailable";
}

function targetCoverageMonths(category: EmergencyFundResultLevel, answers: EmergencyFundAnswerMap) {
  const incomeStability = answers["income-stability"];
  const creditReliance = answers["credit-reliance"];

  if (category === "Strong Emergency Preparedness") {
    return incomeStability === "Highly uncertain" ? 6 : 6;
  }

  if (category === "Moderately Prepared") {
    return creditReliance === "Frequently" || creditReliance === "Almost always" ? 6 : 5;
  }

  if (category === "Limited Emergency Cushion") {
    return 6;
  }

  if (category === "Financial Vulnerability Risk") {
    return 3;
  }

  return 1;
}

function targetLabel(months: number, category: EmergencyFundResultLevel) {
  if (category === "Strong Emergency Preparedness") {
    return "Maintain 3-6 months of essential expenses, keeping the fund liquid and easy to access.";
  }

  if (category === "Moderately Prepared") {
    return `Build toward ${months === 6 ? "6" : "4-6"} months of essential expenses.`;
  }

  if (category === "Limited Emergency Cushion") {
    return "Build toward 3-6 months of essential expenses and keep the money fully liquid.";
  }

  if (category === "Financial Vulnerability Risk") {
    return "Start with 1-3 months of essentials, then move toward a 3-6 month safety cushion.";
  }

  return "Start with your first small buffer, then work toward 1 month of essential expenses before expanding further.";
}

function buildSectionScores(answers: EmergencyFundAnswerMap): EmergencyFundSectionScore[] {
  return emergencyFundSectionMeta.map((section) => {
    const questions = emergencyFundQuestionsBySection[section.sectionId];
    const score = questions.reduce((total, question) => total + getScoreForQuestion(question, answers).selectedScore, 0);
    const max = questions.length * 5;
    return {
      sectionId: section.sectionId,
      title: section.title,
      score,
      max,
      percentage: max > 0 ? Math.round((score / max) * 100) : 0,
    };
  });
}

function buildInsights(answers: EmergencyFundAnswerMap, sectionScores: EmergencyFundSectionScore[]): EmergencyFundInsight[] {
  const insights: EmergencyFundInsight[] = [];

  const noSavings = answers["coverage-months"] === "Less than 1 month" || answers["savings-location"] === "I do not have emergency savings";
  const unstableIncome = answers["income-stability"] === "Unpredictable" || answers["income-stability"] === "Highly uncertain";
  const frequentBorrowing = answers["credit-reliance"] === "Frequently" || answers["credit-reliance"] === "Almost always";
  const stressed = answers["emotional-stress"] === "Very stressful" || answers["emotional-stress"] === "Extremely overwhelming";
  const disciplinedSaving = answers["save-regularly"] === "Every month consistently" || answers["saving-habit"] === "Automated and disciplined";
  const lifestyleLeakage = answers["savings-withdrawals"] === "Frequently" || answers["savings-withdrawals"] === "Very often";
  const rapidAccess = answers["access-speed"] === "Immediately" || answers["access-speed"] === "Within 1 day";
  const disruptionPressure = answers["three-month-shock"] === "Need borrowing or debt" || answers["three-month-shock"] === "Unable to manage properly";

  if (noSavings && unstableIncome) {
    insights.push({
      title: "Savings plus income uncertainty",
      description: "Limited savings combined with income uncertainty may increase financial vulnerability during unexpected disruptions.",
      tone: "critical",
    });
  }

  if (frequentBorrowing) {
    insights.push({
      title: "Credit dependence during emergencies",
      description: "Dependency on credit during emergencies may increase long-term financial pressure.",
      tone: "warning",
    });
  }

  if (stressed) {
    insights.push({
      title: "Emotional strain",
      description: "Your responses suggest that financial uncertainty may currently be contributing to emotional stress.",
      tone: "warning",
    });
  }

  if (disciplinedSaving) {
    insights.push({
      title: "Consistent saving behavior",
      description: "Consistent saving behavior is one of the strongest indicators of long-term financial resilience.",
      tone: "positive",
    });
  }

  if (lifestyleLeakage) {
    insights.push({
      title: "Savings leakage",
      description: "Regularly using savings for non-essential spending may weaken emergency preparedness over time.",
      tone: "caution",
    });
  }

  if (rapidAccess && answers["savings-location"] === "Easily accessible savings account") {
    insights.push({
      title: "Good liquidity setup",
      description: "Your savings appear easy to reach, which is a practical strength during short-notice emergencies.",
      tone: "positive",
    });
  }

  if (disruptionPressure) {
    insights.push({
      title: "Recovery runway is tight",
      description: "A 3-month cost shock could require borrowing or create strain, so extending your runway would help stability.",
      tone: "critical",
    });
  }

  if (sectionScores.find((section) => section.sectionId === "behavior")?.percentage ?? 0 >= 80) {
    insights.push({
      title: "Behavioral strength",
      description: "Your saving habits point to strong day-to-day discipline, which supports long-term resilience.",
      tone: "positive",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Balanced starting point",
      description: "Your answers show a workable foundation, with a few areas that could benefit from more liquidity and consistency.",
      tone: "caution",
    });
  }

  return insights.slice(0, 6);
}

function buildRecommendations(category: EmergencyFundResultLevel, answers: EmergencyFundAnswerMap): string[] {
  const recommendations: string[] = [];

  if (category === "Strong Emergency Preparedness") {
    recommendations.push("Continue maintaining disciplined savings habits.");
    recommendations.push("Review your emergency target every few months to keep it aligned with expenses.");
    recommendations.push("Keep emergency money liquid while directing extra savings toward longer-term goals.");
    recommendations.push("Avoid taking avoidable financial risks that could weaken your cushion.");
  } else if (category === "Moderately Prepared") {
    recommendations.push("Increase savings consistency so emergency coverage grows steadily.");
    recommendations.push("Strengthen liquid savings and keep it separate from everyday spending.");
    recommendations.push("Reduce unnecessary financial leakage that slows cushion building.");
    recommendations.push("Aim for a more reliable buffer before adding extra lifestyle spending.");
  } else if (category === "Limited Emergency Cushion") {
    recommendations.push("Build 3-6 months of essential expense coverage.");
    recommendations.push("Reduce dependency on credit during emergencies.");
    recommendations.push("Create a simple automatic monthly savings plan.");
    recommendations.push("Reassess discretionary spending so more cash can stay in reserve.");
  } else if (category === "Financial Vulnerability Risk") {
    recommendations.push("Prioritize building emergency savings immediately, even if the first steps are small.");
    recommendations.push("Avoid unnecessary debt expansion while your safety cushion is thin.");
    recommendations.push("Set a structured monthly transfer into a separate savings account.");
    recommendations.push("Improve cash flow management so one surprise does not derail your budget.");
  } else {
    recommendations.push("Start with a small starter reserve and build from there.");
    recommendations.push("Reduce avoidable spending pressure so you can protect even a modest cash cushion.");
    recommendations.push("Avoid relying heavily on debt for emergencies.");
    recommendations.push("Stabilize monthly habits before aiming for a larger long-term target.");
  }

  if (answers["credit-reliance"] === "Frequently" || answers["credit-reliance"] === "Almost always") {
    recommendations.unshift("Try to break the habit of using credit as the first response to emergencies.");
  }

  if (answers["save-regularly"] === "Never" || answers["saving-habit"] === "No saving habit") {
    recommendations.unshift("Create a very small automatic transfer first so the habit becomes easier to repeat.");
  }

  return Array.from(new Set(recommendations)).slice(0, 5);
}

export function calculateEmergencyFundResult(answers: EmergencyFundAnswerMap) {
  const questionReview = emergencyFundQuestions.map((question) => {
    const scored = getScoreForQuestion(question, answers);
    return {
      question,
      selectedAnswer: scored.selectedAnswer,
      selectedScore: scored.selectedScore,
      isStrong: scored.isStrong,
    };
  });

  const rawScore = questionReview.reduce((total, item) => total + item.selectedScore, 0);
  const percentageScore = Math.round((rawScore / emergencyFundMaximumScore) * 100);
  const category = scoreBand(rawScore);
  const risk = riskForBand(category);
  const savingsStabilityRating = stabilityForBand(category);
  const sectionScores = buildSectionScores(answers);
  const currentCoverageAnswer = answers["coverage-months"] ?? null;
  const emergencyCoverageMonths = coverageMonthsFromQuestion(currentCoverageAnswer);
  const emergencyCoverageEstimate = coverageLabel(emergencyCoverageMonths);
  const targetCoverageMonthsValue = targetCoverageMonths(category, answers);
  const suggestedEmergencyFundTarget = targetLabel(targetCoverageMonthsValue, category);
  const coverageProgressPercent = targetCoverageMonthsValue > 0 ? Math.min(100, Math.round((emergencyCoverageMonths / targetCoverageMonthsValue) * 100)) : 0;

  const confidenceScore = sectionScores.find((section) => section.sectionId === "confidence")?.percentage ?? 0;
  const behaviorScore = sectionScores.find((section) => section.sectionId === "behavior")?.percentage ?? 0;
  const disruptionScore = sectionScores.find((section) => section.sectionId === "disruption")?.percentage ?? 0;
  const coverageScore = sectionScores.find((section) => section.sectionId === "coverage")?.percentage ?? 0;

  const financialResilienceIndicator =
    coverageScore >= 80 && disruptionScore >= 70 ? "Strong emergency resilience" :
    coverageScore >= 60 && disruptionScore >= 50 ? "Developing resilience" :
    "Needs more cushioning";

  const savingsDisciplineIndicator =
    behaviorScore >= 80 ? "Highly disciplined" :
    behaviorScore >= 60 ? "Steady but improvable" :
    "Inconsistent savings behavior";

  const emergencyDependencyRisk =
    answers["credit-reliance"] === "Never" || answers["credit-reliance"] === "Rarely"
      ? "Low dependency on emergency borrowing"
      : answers["credit-reliance"] === "Sometimes"
        ? "Some credit dependence during shocks"
        : "High dependency on credit during emergencies";

  const emotionalStressLevel =
    confidenceScore >= 80 ? "Calm under pressure" :
    confidenceScore >= 60 ? "Manageable stress" :
    confidenceScore >= 40 ? "Elevated stress" :
    "High emotional strain";

  const summary =
    category === "Strong Emergency Preparedness"
      ? "You appear financially prepared to handle unexpected situations with relatively strong stability and savings resilience."
      : category === "Moderately Prepared"
        ? "Your emergency preparedness is reasonably stable, though certain financial situations could create temporary pressure."
        : category === "Limited Emergency Cushion"
          ? "Your current emergency reserves may not fully support prolonged financial disruptions or major unexpected expenses."
          : category === "Financial Vulnerability Risk"
            ? "Unexpected financial situations may currently create noticeable stress and instability."
            : "Your current financial safety cushion may not adequately support emergency situations or temporary income disruptions.";

  const insights = buildInsights(answers, sectionScores);
  const recommendations = buildRecommendations(category, answers);

  return {
    rawScore,
    percentageScore,
    category,
    risk,
    summary,
    savingsStabilityRating,
    emergencyCoverageEstimate,
    emergencyCoverageMonths,
    emergencyPreparednessScore: rawScore,
    emergencyPreparednessLabel: `${rawScore} / ${emergencyFundMaximumScore}`,
    financialResilienceIndicator,
    savingsDisciplineIndicator,
    emergencyDependencyRisk,
    emotionalStressLevel,
    suggestedEmergencyFundTarget,
    targetCoverageMonths: targetCoverageMonthsValue,
    coverageProgressPercent,
    insights,
    recommendations,
    questionReview,
    sectionScores,
  } satisfies EmergencyFundResult;
}
