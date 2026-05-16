/**
 * Debt Balance Review Scoring Engine
 * Calculates debt health, generates insights, and categorizes risk
 */

import {
  debtBalanceQuestions,
  debtBalanceSectionMeta,
  debtBalanceTotalQuestions,
  debtBalanceMaximumRawScore,
  debtBalanceMinimumRawScore,
  type DebtBalanceAnswerMap,
  type DebtBalanceResult,
  type DebtBalanceRiskSeverity,
  type DebtBalanceInsight,
} from "./debtBalanceConfig";

const improvementCopy: Record<string, string> = {
  "active-emis":
    "Consolidating or restructuring multiple loans can reduce cognitive load and may improve your overall financial picture.",
  "emi-burden":
    "Aim to reduce EMI burden to below 30% of income. This creates more breathing room for savings and emergencies.",
  "debt-type":
    "Diversifying your debt across lower-interest instruments (like home loans) rather than high-interest options improves sustainability.",
  "payment-timeliness":
    "Setting up auto-pay reminders and automatic payments can help you stay consistent with loan obligations.",
  "debt-stacking":
    "Avoid using new credit to repay old debt. Instead, focus on repaying existing obligations from income.",
  "minimum-payment":
    "Pay the full credit card balance monthly if possible. Minimum payments often triple the actual cost of purchases.",
  "income-runway":
    "Build at least 3–6 months of emergency funds to cover EMIs if your income is interrupted.",
  "emergency-savings":
    "Growing your emergency fund gradually protects you from borrowing during unexpected financial shocks.",
  "credit-reliance":
    "Work toward living within your income. If you're using credit for basics, consider reducing expenses or increasing income.",
  "financial-stressor":
    "Identify the root cause of your financial stress and create a targeted action plan to address it.",
  "debt-stress":
    "Speaking with a financial wellness coach or therapist can help reduce stress and build confidence.",
  "emergency-readiness":
    "Building a small financial buffer—even ₹10,000–₹20,000—can prevent a crisis from derailing your debt payments.",
};

function getOptionScore(questionId: string, selectedOptionLabel: string): number {
  const question = debtBalanceQuestions.find((q) => q.id === questionId);
  if (!question) return 0;

  const option = question.options.find((o) => o.label === selectedOptionLabel);
  return option?.score ?? 0;
}

function buildSectionScores(answers: DebtBalanceAnswerMap) {
  const sectionScores: Record<string, { score: number; max: number }> = {};

  for (const sectionMeta of debtBalanceSectionMeta) {
    const sectionQuestions = debtBalanceQuestions.filter((q) => q.sectionId === sectionMeta.id);
    let sectionScore = 0;
    let answeredCount = 0;

    for (const question of sectionQuestions) {
      const answer = answers[question.id];
      if (answer) {
        sectionScore += getOptionScore(question.id, answer);
        answeredCount += 1;
      }
    }

    sectionScores[sectionMeta.id] = {
      score: sectionScore,
      max: sectionQuestions.length * 5,
    };
  }

  return sectionScores;
}

function buildStressIndicators(answers: DebtBalanceAnswerMap, sectionScores: Record<string, { score: number; max: number }>) {
  const indicators: Array<{ indicator: string; severity: "low" | "moderate" | "high" }> = [];

  // High EMI burden + Low emergency savings
  const emiBurdenScore = getOptionScore("emi-burden", answers["emi-burden"] ?? "");
  const emergencySavingsScore = getOptionScore("emergency-savings", answers["emergency-savings"] ?? "");

  if (emiBurdenScore <= 2 && emergencySavingsScore <= 2) {
    indicators.push({
      indicator: "High repayment pressure relative to financial safety cushion",
      severity: "high",
    });
  }

  // Frequent minimum payments
  const minimumPaymentScore = getOptionScore("minimum-payment", answers["minimum-payment"] ?? "");
  if (minimumPaymentScore <= 2) {
    indicators.push({
      indicator: "High-interest debt accumulation risk from minimum payments",
      severity: "high",
    });
  }

  // Debt stacking behavior
  const debtStackingScore = getOptionScore("debt-stacking", answers["debt-stacking"] ?? "");
  if (debtStackingScore <= 2) {
    indicators.push({
      indicator: "Debt cycling pattern that may trap you in longer-term obligations",
      severity: "high",
    });
  }

  // Credit reliance
  const creditRelianceScore = getOptionScore("credit-reliance", answers["credit-reliance"] ?? "");
  if (creditRelianceScore <= 2) {
    indicators.push({
      indicator: "Chronic cash flow imbalance indicated by frequent credit use",
      severity: "moderate",
    });
  }

  // Payment delays
  const paymentTimelinessScore = getOptionScore("payment-timeliness", answers["payment-timeliness"] ?? "");
  if (paymentTimelinessScore <= 2) {
    indicators.push({
      indicator: "Inconsistent payment behavior that may affect credit score",
      severity: "high",
    });
  }

  // Low income runway
  const incomeRunwayScore = getOptionScore("income-runway", answers["income-runway"] ?? "");
  if (incomeRunwayScore <= 2) {
    indicators.push({
      indicator: "Very limited ability to sustain debt during income loss",
      severity: "high",
    });
  }

  // Multiple EMIs + Low runway
  const activeEmisScore = getOptionScore("active-emis", answers["active-emis"] ?? "");
  if (activeEmisScore <= 2 && incomeRunwayScore <= 2) {
    indicators.push({
      indicator: "Multiple debt obligations with minimal financial runway",
      severity: "high",
    });
  }

  return indicators;
}

function buildInsights(answers: DebtBalanceAnswerMap, rawScore: number): DebtBalanceInsight[] {
  const insights: DebtBalanceInsight[] = [];

  const emiBurdenScore = getOptionScore("emi-burden", answers["emi-burden"] ?? "");
  const emergencySavingsScore = getOptionScore("emergency-savings", answers["emergency-savings"] ?? "");
  const minimumPaymentScore = getOptionScore("minimum-payment", answers["minimum-payment"] ?? "");
  const debtStackingScore = getOptionScore("debt-stacking", answers["debt-stacking"] ?? "");
  const creditRelianceScore = getOptionScore("credit-reliance", answers["credit-reliance"] ?? "");
  const paymentTimelinessScore = getOptionScore("payment-timeliness", answers["payment-timeliness"] ?? "");
  const debtStressScore = getOptionScore("debt-stress", answers["debt-stress"] ?? "");
  const incomeRunwayScore = getOptionScore("income-runway", answers["income-runway"] ?? "");

  // Pattern: High EMI burden + Low emergency savings
  if (emiBurdenScore <= 2 && emergencySavingsScore <= 2) {
    insights.push({
      title: "Thin Safety Net",
      description:
        "Your repayment commitments appear high relative to your financial safety cushion. An unexpected expense could disrupt your debt obligations.",
      severity: "critical",
    });
  }

  // Pattern: Frequent minimum payments
  if (minimumPaymentScore <= 2) {
    insights.push({
      title: "High-Interest Debt Cycle",
      description:
        "Regularly paying only minimum dues significantly extends your debt and increases total interest costs. Prioritize paying full balances.",
      severity: "warning",
    });
  }

  // Pattern: Debt stacking
  if (debtStackingScore <= 2) {
    insights.push({
      title: "Debt Cycling Pattern",
      description:
        "Using new credit to repay old debt suggests you may be caught in a cycle that perpetuates financial strain. Breaking this pattern is crucial.",
      severity: "warning",
    });
  }

  // Pattern: Multiple debts + emotional stress
  const activeEmisScore = getOptionScore("active-emis", answers["active-emis"] ?? "");
  if (activeEmisScore <= 2 && debtStressScore <= 2) {
    insights.push({
      title: "Debt Management Overwhelm",
      description:
        "Your responses suggest managing multiple repayment obligations is contributing to financial stress. Consolidation or prioritization may help.",
      severity: "warning",
    });
  }

  // Pattern: Credit reliance
  if (creditRelianceScore <= 2) {
    insights.push({
      title: "Cash Flow Imbalance",
      description:
        "Frequent reliance on credit for regular expenses indicates underlying cash flow challenges. Focus on living within your monthly income.",
      severity: "warning",
    });
  }

  // Pattern: Payment delays
  if (paymentTimelinessScore <= 2) {
    insights.push({
      title: "Repayment Consistency Issue",
      description:
        "Delayed payments may increase your debt burden through penalties and credit score impacts. Set up reminders or automatic payments.",
      severity: "caution",
    });
  }

  // Pattern: Low income runway
  if (incomeRunwayScore <= 2) {
    insights.push({
      title: "Financial Vulnerability",
      description:
        "With limited runway to pay EMIs from savings, job loss or income disruption could quickly escalate into crisis.",
      severity: "critical",
    });
  }

  // Positive patterns
  if (
    emiBurdenScore >= 4 &&
    emergencySavingsScore >= 4 &&
    paymentTimelinessScore >= 4 &&
    creditRelianceScore >= 4
  ) {
    insights.push({
      title: "Strong Financial Discipline",
      description:
        "Your responses show consistent, responsible debt management. Maintain these habits while continuing to build your emergency reserves.",
      severity: "positive",
    });
  }

  // Good emergency readiness despite some debt
  const emergencyReadinessScore = getOptionScore("emergency-readiness", answers["emergency-readiness"] ?? "");
  if (emiBurdenScore >= 3 && emergencyReadinessScore >= 4) {
    insights.push({
      title: "Resilient Against Shocks",
      description:
        "Even with debt obligations, you appear prepared to handle unexpected financial challenges without further borrowing.",
      severity: "positive",
    });
  }

  return insights;
}

function buildTopImprovementAreas(answers: DebtBalanceAnswerMap): Array<{ question: string; currentScore: number; suggestion: string }> {
  const scores = debtBalanceQuestions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    score: getOptionScore(question.id, answers[question.id] ?? ""),
  }));

  return scores
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => ({
      question: item.prompt,
      currentScore: item.score,
      suggestion: improvementCopy[item.id] || "Focus on improving this area for better financial health.",
    }));
}

function buildEmotionalReadinessIndicator(answers: DebtBalanceAnswerMap): string {
  const debtStressScore = getOptionScore("debt-stress", answers["debt-stress"] ?? "");
  const emergencyReadinessScore = getOptionScore("emergency-readiness", answers["emergency-readiness"] ?? "");

  if (debtStressScore >= 4 && emergencyReadinessScore >= 4) {
    return "Emotionally prepared and resilient";
  }
  if (debtStressScore >= 3 && emergencyReadinessScore >= 3) {
    return "Managing adequately with some concerns";
  }
  if (debtStressScore <= 2 || emergencyReadinessScore <= 2) {
    return "Emotionally strained and vulnerable";
  }
  return "Moderately stable with room for improvement";
}

function calculateCreditDependencyScore(answers: DebtBalanceAnswerMap): number {
  const minimumPaymentScore = getOptionScore("minimum-payment", answers["minimum-payment"] ?? "");
  const debtStackingScore = getOptionScore("debt-stacking", answers["debt-stacking"] ?? "");
  const creditRelianceScore = getOptionScore("credit-reliance", answers["credit-reliance"] ?? "");

  const combined = (minimumPaymentScore + debtStackingScore + creditRelianceScore) / 3;
  return Math.round((1 - (combined - 1) / 4) * 100);
}

function calculateRepaymentStabilityScore(answers: DebtBalanceAnswerMap): number {
  const paymentTimelinessScore = getOptionScore("payment-timeliness", answers["payment-timeliness"] ?? "");
  const debtStackingScore = getOptionScore("debt-stacking", answers["debt-stacking"] ?? "");
  const minimumPaymentScore = getOptionScore("minimum-payment", answers["minimum-payment"] ?? "");

  const combined = (paymentTimelinessScore + debtStackingScore + minimumPaymentScore) / 3;
  return Math.round(((combined - 1) / 4) * 100);
}

function calculateEmergencyReadinessScore(answers: DebtBalanceAnswerMap): number {
  const emergencySavingsScore = getOptionScore("emergency-savings", answers["emergency-savings"] ?? "");
  const incomeRunwayScore = getOptionScore("income-runway", answers["income-runway"] ?? "");
  const emergencyReadinessScore = getOptionScore("emergency-readiness", answers["emergency-readiness"] ?? "");

  const combined = (emergencySavingsScore + incomeRunwayScore + emergencyReadinessScore) / 3;
  return Math.round(((combined - 1) / 4) * 100);
}

export function calculateDebtBalanceResult(answers: DebtBalanceAnswerMap): DebtBalanceResult {
  // Calculate raw score
  const rawScore = debtBalanceQuestions.reduce((sum, question) => {
    const answer = answers[question.id];
    return sum + (answer ? getOptionScore(question.id, answer) : 0);
  }, 0);

  // Normalize to 0-100
  const percentageScore = Math.round(((rawScore - debtBalanceMinimumRawScore) / (debtBalanceMaximumRawScore - debtBalanceMinimumRawScore)) * 100);

  // Determine category and risk
  let category = "";
  let risk: DebtBalanceRiskSeverity = "moderate";
  let summary = "";

  if (rawScore >= 50) {
    category = "Healthy Debt Balance";
    risk = "low";
    summary =
      "Your current debt obligations appear financially manageable and sustainable. You're maintaining healthy debt habits and financial discipline.";
  } else if (rawScore >= 40) {
    category = "Stable but Needs Monitoring";
    risk = "moderate-low";
    summary =
      "Your debt situation appears mostly manageable, but some repayment pressure indicators are emerging. Small improvements now can prevent future stress.";
  } else if (rawScore >= 30) {
    category = "Moderate Debt Stress";
    risk = "moderate";
    summary =
      "Your current debt obligations may reduce financial flexibility and increase stress during emergencies. Prioritize building financial resilience.";
  } else if (rawScore >= 20) {
    category = "High Debt Pressure";
    risk = "high";
    summary =
      "Debt repayments appear to be placing noticeable pressure on your financial stability. Urgent action to reduce debt and build reserves is needed.";
  } else {
    category = "Financial Strain Zone";
    risk = "very-high";
    summary =
      "Your current debt structure may be financially and emotionally difficult to sustain safely. Professional support and debt restructuring should be considered.";
  }

  // Build comprehensive result object
  const sectionScores = buildSectionScores(answers);
  const stressIndicators = buildStressIndicators(answers, sectionScores);
  const insights = buildInsights(answers, rawScore);
  const improvementAreas = buildTopImprovementAreas(answers);

  return {
    rawScore,
    percentageScore,
    category,
    risk,
    summary,
    emotionalReadiness: buildEmotionalReadinessIndicator(answers),
    debtStressIndicator:
      rawScore <= 20
        ? "Severe financial and emotional strain"
        : rawScore <= 30
          ? "Significant stress affecting wellbeing"
          : rawScore <= 40
            ? "Moderate stress with some coping ability"
            : rawScore <= 50
              ? "Mild stress with good management"
              : "Minimal stress with healthy perspective",
    creditDependencyScore: calculateCreditDependencyScore(answers),
    repaymentStabilityScore: calculateRepaymentStabilityScore(answers),
    emergencyReadinessScore: calculateEmergencyReadinessScore(answers),
    insights,
    stressIndicators,
    improvementAreas,
    suggestions:
      risk === "low"
        ? [
            "Continue maintaining disciplined repayment habits",
            "Preserve and grow your emergency savings fund",
            "Avoid unnecessary high-interest debt",
            "Monitor future EMI expansion carefully to maintain balance",
          ]
        : risk === "moderate-low"
          ? [
              "Reduce reliance on revolving credit (credit cards)",
              "Improve your emergency reserves gradually",
              "Limit taking new EMIs until pressure reduces",
              "Monitor your debt-to-income ratio carefully",
            ]
          : risk === "moderate"
            ? [
                "Prioritize high-interest debt repayment",
                "Reduce discretionary expenses to free up cash flow",
                "Build stronger financial buffers for emergencies",
                "Avoid taking new loans in the near term",
              ]
            : risk === "high"
              ? [
                  "Reduce debt burden aggressively through accelerated repayment",
                  "Explore loan consolidation or restructuring options",
                  "Pause all new borrowing immediately",
                  "Build emergency reserves of at least ₹10,000–₹20,000",
                  "Improve repayment discipline with auto-pay setup",
                ]
              : [
                  "Avoid additional debt completely",
                  "Seek professional financial restructuring support",
                  "Focus on stabilizing monthly cash flow first",
                  "Build basic emergency savings (even small amounts help)",
                  "Reduce dependency on credit for essential expenses",
                ],
    sectionScores,
  };
}
