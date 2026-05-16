import {
  loanFitMaximumRawScore,
  loanFitMinimumRawScore,
  loanFitQuestions,
  loanFitSectionMeta,
  loanFitTotalQuestions,
  type LoanFitAnswerMap,
  type LoanFitInsight,
  type LoanFitQuestionId,
  type LoanFitResult,
  type LoanFitRiskSeverity,
  type LoanFitSectionId,
} from "./loanFitConfig";

const categoryLabels = [
  {
    min: 50,
    max: 60,
    category: "Excellent Loan Fit",
    riskLevel: "Low Risk",
    affordabilityStatus: "Comfortable",
    message: "Your current financial situation appears capable of supporting this loan responsibly.",
    suggestions: [
      "Maintain emergency savings.",
      "Avoid over-borrowing despite strong affordability.",
      "Review interest rates before committing.",
    ],
  },
  {
    min: 40,
    max: 49,
    category: "Generally Affordable",
    riskLevel: "Moderate-Low Risk",
    affordabilityStatus: "Manageable",
    message: "The loan appears manageable, but some financial pressure points exist.",
    suggestions: [
      "Keep EMI below 30% of monthly income.",
      "Improve emergency reserves.",
      "Avoid stacking multiple loans.",
    ],
  },
  {
    min: 30,
    max: 39,
    category: "Moderate Financial Stress Risk",
    riskLevel: "Moderate Risk",
    affordabilityStatus: "Watch Carefully",
    message: "This loan may create noticeable financial strain during emergencies or income fluctuations.",
    suggestions: [
      "Consider reducing loan size.",
      "Increase down payment.",
      "Improve monthly savings before committing.",
      "Reassess non-essential spending.",
    ],
  },
  {
    min: 20,
    max: 29,
    category: "High EMI Pressure Risk",
    riskLevel: "High Risk",
    affordabilityStatus: "Stretched",
    message: "Your current financial situation may struggle to comfortably support this loan.",
    suggestions: [
      "Delay the loan if possible.",
      "Focus on debt reduction first.",
      "Build emergency savings.",
      "Explore lower EMI structures.",
    ],
  },
  {
    min: 12,
    max: 19,
    category: "Financially Unsafe Loan Zone",
    riskLevel: "Very High Risk",
    affordabilityStatus: "Unsafe",
    message: "Taking this loan currently may significantly increase financial stress and repayment difficulty.",
    suggestions: [
      "Avoid taking new debt right now.",
      "Seek financial restructuring.",
      "Stabilize income and expenses first.",
      "Build basic emergency savings.",
    ],
  },
] as const;

const improvementCopy: Record<LoanFitQuestionId, string> = {
  "income-pattern": "Build steadier income visibility before taking on a long repayment schedule.",
  "income-runway": "Aim for at least 3–6 months of emergency savings before borrowing.",
  "income-drop-risk": "A lower income-drop risk improves long-term repayment comfort.",
  "leftover-cash": "Keep some monthly buffer after essentials so the EMI does not crowd out flexibility.",
  "emi-burden": "Try to keep the EMI under 30% of monthly income when possible.",
  "emergency-readiness": "Make sure the EMI still feels manageable even if an emergency expense appears.",
  "existing-debt": "Reduce current debt pressure before adding another commitment.",
  "credit-dependency": "If regular borrowing is frequent, focus on cash-flow stability first.",
  "missed-payments": "Recent missed payments suggest a need for a smaller or delayed borrowing plan.",
  "loan-purpose": "Borrowing feels safer when the purpose has clear long-term value.",
  confidence: "Emotional confidence matters; choose an EMI size that does not create dread.",
  "income-drop-scenario": "If a small income shock would break the plan, the EMI is too aggressive today.",
};

function getQuestionById(questionId: LoanFitQuestionId) {
  return loanFitQuestions.find((question) => question.id === questionId);
}

function getOptionScore(questionId: LoanFitQuestionId, answerId: string | undefined) {
  if (!answerId) {
    return 0;
  }

  const question = getQuestionById(questionId);
  const option = question?.options.find((entry) => entry.id === answerId);
  return option?.score ?? 0;
}

function getCategory(rawScore: number) {
  return categoryLabels.find((band) => rawScore >= band.min && rawScore <= band.max) ?? categoryLabels[categoryLabels.length - 1];
}

function getSeverity(score: number): LoanFitRiskSeverity {
  if (score >= 4) return "low";
  if (score === 3) return "medium";
  if (score === 2) return "high";
  return "very-high";
}

function buildSectionScores(answers: LoanFitAnswerMap) {
  return loanFitSectionMeta.map((section) => {
    const questions = loanFitQuestions.filter((question) => question.sectionId === section.sectionId);
    const score = questions.reduce((total, question) => total + getOptionScore(question.id, answers[question.id]), 0);
    const maxScore = questions.length * 5;
    return {
      sectionId: section.sectionId,
      sectionLabel: section.title,
      score,
      maxScore,
    };
  });
}

function buildInsights(answers: LoanFitAnswerMap): LoanFitInsight[] {
  const q1 = getOptionScore("income-pattern", answers["income-pattern"]);
  const q2 = getOptionScore("income-runway", answers["income-runway"]);
  const q3 = getOptionScore("income-drop-risk", answers["income-drop-risk"]);
  const q4 = getOptionScore("leftover-cash", answers["leftover-cash"]);
  const q5 = getOptionScore("emi-burden", answers["emi-burden"]);
  const q6 = getOptionScore("emergency-readiness", answers["emergency-readiness"]);
  const q7 = getOptionScore("existing-debt", answers["existing-debt"]);
  const q8 = getOptionScore("credit-dependency", answers["credit-dependency"]);
  const q9 = getOptionScore("missed-payments", answers["missed-payments"]);
  const q10 = getOptionScore("loan-purpose", answers["loan-purpose"]);
  const q11 = getOptionScore("confidence", answers["confidence"]);
  const q12 = getOptionScore("income-drop-scenario", answers["income-drop-scenario"]);

  const insights: LoanFitInsight[] = [];

  if (q1 <= 2 && q5 <= 2) {
    insights.push({
      title: "Income variability + EMI pressure",
      description: "Your income variability combined with a high EMI ratio may create repayment stress during low-income months.",
      severity: "high",
    });
  }

  if (q11 <= 2 || q12 <= 2) {
    insights.push({
      title: "Emotional strain around repayment",
      description: "Your responses suggest emotional discomfort around loan repayment. Consider choosing a safer EMI range.",
      severity: q11 <= 1 || q12 <= 1 ? "very-high" : "high",
    });
  }

  if (q2 <= 2 && q7 <= 2) {
    insights.push({
      title: "Low reserves with existing debt",
      description: "A lack of emergency reserves alongside current debt obligations increases financial vulnerability.",
      severity: "very-high",
    });
  }

  if (q6 <= 2 && q9 <= 2) {
    insights.push({
      title: "Weak emergency repayment buffer",
      description: "An emergency expense or a missed payment could quickly compound into broader repayment stress.",
      severity: "high",
    });
  }

  if (q8 <= 2 && q10 <= 2) {
    insights.push({
      title: "Borrowing dependence pattern",
      description: "Frequent reliance on credit plus a debt-related loan purpose can make the new EMI harder to sustain.",
      severity: "high",
    });
  }

  if (q3 <= 2 && q4 <= 2) {
    insights.push({
      title: "Future income cushion looks thin",
      description: "If income is likely to soften and monthly leftovers are already low, even a moderate EMI may feel tight.",
      severity: "medium",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Balanced loan profile",
      description: "No major repayment stress signals stand out from your responses right now.",
      severity: "low",
    });
  }

  return insights;
}

function buildStressIndicators(answers: LoanFitAnswerMap): LoanFitInsight[] {
  const q2 = getOptionScore("income-runway", answers["income-runway"]);
  const q5 = getOptionScore("emi-burden", answers["emi-burden"]);
  const q6 = getOptionScore("emergency-readiness", answers["emergency-readiness"]);
  const q7 = getOptionScore("existing-debt", answers["existing-debt"]);
  const q8 = getOptionScore("credit-dependency", answers["credit-dependency"]);
  const q9 = getOptionScore("missed-payments", answers["missed-payments"]);
  const q11 = getOptionScore("confidence", answers["confidence"]);
  const q12 = getOptionScore("income-drop-scenario", answers["income-drop-scenario"]);

  const indicators: LoanFitInsight[] = [];

  if (q2 <= 2) {
    indicators.push({
      title: "Low emergency savings runway",
      description: "You may have less than a comfortable buffer if income pauses for a while.",
      severity: getSeverity(q2),
    });
  }

  if (q5 <= 2 || q6 <= 2) {
    indicators.push({
      title: "High EMI sensitivity",
      description: "The proposed EMI may compete with everyday spending or emergency flexibility.",
      severity: getSeverity(Math.min(q5 || 5, q6 || 5)),
    });
  }

  if (q7 <= 2 || q9 <= 2) {
    indicators.push({
      title: "Debt pressure already elevated",
      description: "Existing repayments or recent missed payments reduce room for another commitment.",
      severity: getSeverity(Math.min(q7 || 5, q9 || 5)),
    });
  }

  if (q8 <= 2) {
    indicators.push({
      title: "Credit dependency pattern",
      description: "Frequent borrowing for regular expenses can make new EMIs feel heavier than they look on paper.",
      severity: getSeverity(q8),
    });
  }

  if (q11 <= 2 || q12 <= 2) {
    indicators.push({
      title: "Repayment anxiety",
      description: "You may be expecting more stress than comfort if the loan starts right now.",
      severity: getSeverity(Math.min(q11 || 5, q12 || 5)),
    });
  }

  return indicators;
}

function buildTopImprovementAreas(answers: LoanFitAnswerMap) {
  const scored = loanFitQuestions
    .map((question) => ({
      questionId: question.id,
      score: getOptionScore(question.id, answers[question.id]),
    }))
    .sort((left, right) => left.score - right.score)
    .slice(0, 3);

  return scored.map((entry) => improvementCopy[entry.questionId]);
}

function buildEmotionalReadinessIndicator(answers: LoanFitAnswerMap) {
  const confidenceScore = getOptionScore("confidence", answers["confidence"]);
  const shockScore = getOptionScore("income-drop-scenario", answers["income-drop-scenario"]);
  const purposeScore = getOptionScore("loan-purpose", answers["loan-purpose"]);
  const average = (confidenceScore + shockScore + purposeScore) / 3;

  if (average >= 4.25) {
    return "Emotionally ready";
  }

  if (average >= 3.25) {
    return "Mixed readiness";
  }

  if (average >= 2.25) {
    return "Emotionally cautious";
  }

  return "Emotionally strained";
}

export function calculateLoanFitResult(answers: LoanFitAnswerMap): LoanFitResult {
  const rawScore = loanFitQuestions.reduce((total, question) => total + getOptionScore(question.id, answers[question.id]), 0);
  const totalQuestionsAnswered = loanFitQuestions.filter((question) => answers[question.id]).length;
  const categoryBand = getCategory(rawScore);
  const fitScore = Math.round(((rawScore - loanFitMinimumRawScore) / (loanFitMaximumRawScore - loanFitMinimumRawScore)) * 100);
  const safeFitScore = Math.max(0, Math.min(100, fitScore));
  const sectionScores = buildSectionScores(answers);
  const insights = buildInsights(answers);
  const stressIndicators = buildStressIndicators(answers);
  const topImprovementAreas = buildTopImprovementAreas(answers);
  const emotionalReadinessIndicator = buildEmotionalReadinessIndicator(answers);

  const affordabilityStatus = categoryBand.affordabilityStatus;
  const summary = categoryBand.message;
  const suggestions = [...categoryBand.suggestions, ...topImprovementAreas].filter((value, index, array) => array.indexOf(value) === index);

  return {
    totalScore: rawScore,
    percentageScore: safeFitScore,
    rawScore,
    riskLevel: categoryBand.riskLevel,
    category: categoryBand.category,
    affordabilityStatus,
    emotionalReadinessIndicator,
    summary,
    suggestions,
    insights,
    stressIndicators,
    topImprovementAreas,
    sectionScores,
    answeredCount: totalQuestionsAnswered,
    totalQuestions: loanFitTotalQuestions,
  } satisfies LoanFitResult & { weightedScore?: number };
}

export function getLoanFitAnswerScore(questionId: LoanFitQuestionId, answerId?: string) {
  return getOptionScore(questionId, answerId);
}

export function getLoanFitQuestionById(questionId: LoanFitQuestionId) {
  return getQuestionById(questionId);
}

export function getLoanFitSectionTitle(sectionId: LoanFitSectionId) {
  return loanFitSectionMeta.find((section) => section.sectionId === sectionId)?.title ?? sectionId;
}
