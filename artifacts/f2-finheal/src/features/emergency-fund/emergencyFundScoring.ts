import {
  emergencyFundMaximumScore,
  emergencyFundMinimumScore,
  emergencyFundQuestions,
  emergencyFundSectionMeta,
  type EmergencyFundAnswerMap,
  type EmergencyFundQuestion,
  type EmergencyFundInsightTone,
} from "./emergencyFundConfig";

export type RecommendationTone =
  | "supportive"
  | "motivational"
  | "warning"
  | "educational";

export type EmergencyFundResultLevel =
  | "Strong Emergency Preparedness"
  | "Moderately Prepared"
  | "Limited Emergency Cushion"
  | "Financial Vulnerability Risk"
  | "Critical Emergency Preparedness Gap";

export type Recommendation = {
  id: string;
  text: string;
  priority?: number;
  tone?: RecommendationTone;
  tags?: string[];
};

export type EmergencyFundInsight = {
  title: string;
  description: string;
  tone: EmergencyFundInsightTone;
};

export type EmergencyFundSectionScore = {
  sectionId: string;
  title: string;
  score: number;
  max: number;
  percentage: number;
};

export type EmergencyFundQuestionReviewItem = {
  question: EmergencyFundQuestion;
  selectedAnswer: string | null;
  isStrong: boolean;
};

export type EmergencyFundResult = {
  rawScore: number;
  percentageScore: number;
  category: EmergencyFundResultLevel;
  risk: "Low Risk" | "Moderate-Low Risk" | "Moderate Risk" | "High Risk";
  summary: string;
  coverageProgressPercent: number;
  emergencyCoverageEstimate: string;
  savingsStabilityRating: string;
  emotionalStressLevel: string;
  targetCoverageMonths: number;
  emergencyPreparednessScore: number;
  suggestedEmergencyFundTarget: string;
  savingsDisciplineIndicator: string;
  emergencyDependencyRisk: string;
  insights: EmergencyFundInsight[];
  recommendations: string[];
  sectionScores: EmergencyFundSectionScore[];
  questionReview: EmergencyFundQuestionReviewItem[];
};

type RecommendationPools = {
  strongPreparedness: Recommendation[];
  moderatePreparedness: Recommendation[];
  limitedCushion: Recommendation[];
  vulnerabilityRisk: Recommendation[];
  criticalRisk: Recommendation[];
  triggers: {
    creditReliance: Recommendation[];
    emotionalStress: Recommendation[];
    unstableIncome: Recommendation[];
    weakSavingsHabit: Recommendation[];
    spendingLeakage: Recommendation[];
  };
};

const recommendationPools: RecommendationPools = {
  strongPreparedness: [
    {
      id: "strong-1",
      text: "You’ve built a strong financial cushion. That consistency creates real stability during uncertainty.",
      priority: 4,
      tone: "supportive",
    },
    {
      id: "strong-2",
      text: "Maintaining liquidity while investing excess savings is a healthy long-term balance.",
      priority: 3,
      tone: "educational",
    },
    {
      id: "strong-3",
      text: "Your saving habits suggest thoughtful financial planning and disciplined behavior.",
      priority: 4,
      tone: "supportive",
    },
    {
      id: "strong-4",
      text: "Continue reviewing your emergency target periodically as responsibilities and expenses evolve.",
      priority: 3,
      tone: "educational",
    },
    {
      id: "strong-5",
      text: "Strong emergency preparedness often reduces emotional stress during difficult periods.",
      priority: 4,
      tone: "supportive",
    },
    {
      id: "strong-6",
      text: "Keeping emergency reserves separate from daily spending may help preserve financial flexibility.",
      priority: 3,
      tone: "educational",
    },
    {
      id: "strong-7",
      text: "Your responses suggest healthy financial boundaries around spending and savings.",
      priority: 3,
      tone: "supportive",
    },
    {
      id: "strong-8",
      text: "Preparedness is not just financial. It also creates psychological breathing room.",
      priority: 4,
      tone: "supportive",
    },
  ],

  moderatePreparedness: [
    {
      id: "moderate-1",
      text: "You appear to have a reasonable financial foundation, though additional consistency could strengthen resilience.",
      priority: 4,
      tone: "supportive",
    },
    {
      id: "moderate-2",
      text: "Increasing liquid savings gradually may improve your ability to handle uncertainty comfortably.",
      priority: 5,
      tone: "educational",
    },
    {
      id: "moderate-3",
      text: "Small improvements in saving consistency can compound into meaningful financial stability.",
      priority: 4,
      tone: "motivational",
    },
    {
      id: "moderate-4",
      text: "Tracking recurring expenses more closely may create additional savings room over time.",
      priority: 3,
      tone: "educational",
    },
    {
      id: "moderate-5",
      text: "Your financial base appears promising, though stronger emergency coverage could reduce future stress.",
      priority: 5,
      tone: "supportive",
    },
    {
      id: "moderate-6",
      text: "Avoiding lifestyle inflation while income grows may help strengthen your savings cushion faster.",
      priority: 3,
      tone: "educational",
    },
    {
      id: "moderate-7",
      text: "Preparedness is built gradually. Consistency matters more than perfection.",
      priority: 4,
      tone: "motivational",
    },
    {
      id: "moderate-8",
      text: "Separating emergency savings from everyday spending may improve long-term stability.",
      priority: 3,
      tone: "educational",
    },
  ],

  limitedCushion: [
    {
      id: "limited-1",
      text: "Your current emergency reserves may not fully protect against prolonged financial disruptions.",
      priority: 7,
      tone: "warning",
    },
    {
      id: "limited-2",
      text: "Building even a small emergency reserve can reduce pressure during difficult months.",
      priority: 6,
      tone: "motivational",
    },
    {
      id: "limited-3",
      text: "Reducing dependency on borrowing during emergencies may strengthen long-term financial resilience.",
      priority: 7,
      tone: "educational",
    },
    {
      id: "limited-4",
      text: "Small automatic transfers often build savings consistency more sustainably than large irregular deposits.",
      priority: 5,
      tone: "educational",
    },
    {
      id: "limited-5",
      text: "Your responses suggest that unexpected expenses could currently create noticeable financial pressure.",
      priority: 7,
      tone: "warning",
    },
    {
      id: "limited-6",
      text: "Building one month of essential expense coverage first can be a practical starting goal.",
      priority: 6,
      tone: "motivational",
    },
    {
      id: "limited-7",
      text: "Emergency savings are meant to create breathing room, not financial perfection.",
      priority: 5,
      tone: "supportive",
    },
    {
      id: "limited-8",
      text: "Improving emergency preparedness gradually is often more sustainable than aggressive short-term changes.",
      priority: 5,
      tone: "supportive",
    },
  ],

  vulnerabilityRisk: [
    {
      id: "risk-1",
      text: "Your responses suggest that financial emergencies may currently feel emotionally and financially overwhelming.",
      priority: 9,
      tone: "warning",
    },
    {
      id: "risk-2",
      text: "Starting with very small savings goals is still meaningful progress toward stability.",
      priority: 8,
      tone: "motivational",
    },
    {
      id: "risk-3",
      text: "Building even a modest reserve may reduce stress during unexpected situations.",
      priority: 8,
      tone: "supportive",
    },
    {
      id: "risk-4",
      text: "Reducing unnecessary debt expansion could help create more financial breathing room.",
      priority: 7,
      tone: "educational",
    },
    {
      id: "risk-5",
      text: "Your current financial cushion appears limited, which may increase pressure during disruptions.",
      priority: 9,
      tone: "warning",
    },
    {
      id: "risk-6",
      text: "Consistency matters more than saving large amounts immediately.",
      priority: 6,
      tone: "motivational",
    },
    {
      id: "risk-7",
      text: "Protecting even small amounts of savings consistently can gradually improve resilience.",
      priority: 7,
      tone: "supportive",
    },
    {
      id: "risk-8",
      text: "Emergency preparedness is often built through stability-focused habits rather than aggressive goals.",
      priority: 6,
      tone: "educational",
    },
  ],

  criticalRisk: [
    {
      id: "critical-1",
      text: "Your responses suggest that unexpected expenses could currently create serious financial strain.",
      priority: 10,
      tone: "warning",
    },
    {
      id: "critical-2",
      text: "Starting small is completely valid. Even a modest reserve can create some financial breathing room.",
      priority: 8,
      tone: "supportive",
    },
    {
      id: "critical-3",
      text: "Protecting essential expenses may be the healthiest financial priority right now.",
      priority: 9,
      tone: "educational",
    },
    {
      id: "critical-4",
      text: "Financial recovery usually happens gradually rather than through sudden transformation.",
      priority: 7,
      tone: "motivational",
    },
    {
      id: "critical-5",
      text: "Reducing avoidable financial pressure may help create space for even basic savings.",
      priority: 8,
      tone: "educational",
    },
    {
      id: "critical-6",
      text: "Your current emergency preparedness may not yet provide enough protection against sudden disruptions.",
      priority: 10,
      tone: "warning",
    },
    {
      id: "critical-7",
      text: "Consistency and stability matter more right now than aggressive financial targets.",
      priority: 8,
      tone: "supportive",
    },
    {
      id: "critical-8",
      text: "Even limited emergency savings may help reduce dependency on debt during difficult periods.",
      priority: 8,
      tone: "motivational",
    },
  ],

  triggers: {
    creditReliance: [
      {
        id: "credit-1",
        text: "Relying heavily on credit during emergencies may increase long-term financial pressure.",
        priority: 10,
        tone: "warning",
      },
      {
        id: "credit-2",
        text: "Reducing emergency borrowing gradually may strengthen financial confidence over time.",
        priority: 8,
        tone: "supportive",
      },
      {
        id: "credit-3",
        text: "Frequent emergency borrowing can sometimes delay long-term savings progress.",
        priority: 8,
        tone: "educational",
      },
    ],

    emotionalStress: [
      {
        id: "stress-1",
        text: "Your responses suggest that financial uncertainty may currently feel emotionally exhausting.",
        priority: 10,
        tone: "supportive",
      },
      {
        id: "stress-2",
        text: "Building financial structure gradually may help reduce emotional pressure over time.",
        priority: 8,
        tone: "supportive",
      },
      {
        id: "stress-3",
        text: "Emergency preparedness often improves emotional peace of mind alongside financial stability.",
        priority: 7,
        tone: "motivational",
      },
    ],

    unstableIncome: [
      {
        id: "income-1",
        text: "Income unpredictability makes emergency savings even more important for financial stability.",
        priority: 9,
        tone: "warning",
      },
      {
        id: "income-2",
        text: "Building additional buffers may help reduce stress caused by variable income.",
        priority: 8,
        tone: "supportive",
      },
      {
        id: "income-3",
        text: "Maintaining higher liquidity can be especially valuable when income is inconsistent.",
        priority: 7,
        tone: "educational",
      },
    ],

    weakSavingsHabit: [
      {
        id: "habit-1",
        text: "Creating a very small automatic transfer may feel more sustainable than aggressive targets.",
        priority: 9,
        tone: "motivational",
      },
      {
        id: "habit-2",
        text: "Consistency in saving usually matters more than the initial amount.",
        priority: 8,
        tone: "supportive",
      },
      {
        id: "habit-3",
        text: "Building savings habits gradually may strengthen long-term financial confidence.",
        priority: 7,
        tone: "motivational",
      },
    ],

    spendingLeakage: [
      {
        id: "spending-1",
        text: "Frequent withdrawals from savings for lifestyle spending may weaken emergency preparedness over time.",
        priority: 8,
        tone: "warning",
      },
      {
        id: "spending-2",
        text: "Protecting emergency savings from non-essential spending may improve resilience.",
        priority: 7,
        tone: "educational",
      },
      {
        id: "spending-3",
        text: "Creating stronger boundaries around discretionary spending may help savings grow more steadily.",
        priority: 6,
        tone: "supportive",
      },
    ],
  },
};

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function getOptionScore(question: EmergencyFundQuestion, answer: string | null | undefined) {
  const option = question.options.find((entry) => entry.label === answer);
  return option?.score ?? 0;
}

function getCategory(rawScore: number): EmergencyFundResultLevel {
  if (rawScore >= 63) {
    return "Strong Emergency Preparedness";
  }

  if (rawScore >= 51) {
    return "Moderately Prepared";
  }

  if (rawScore >= 39) {
    return "Limited Emergency Cushion";
  }

  if (rawScore >= 27) {
    return "Financial Vulnerability Risk";
  }

  return "Critical Emergency Preparedness Gap";
}

function getRiskLevel(category: EmergencyFundResultLevel): EmergencyFundResult["risk"] {
  switch (category) {
    case "Strong Emergency Preparedness":
      return "Low Risk";
    case "Moderately Prepared":
      return "Moderate-Low Risk";
    case "Limited Emergency Cushion":
      return "Moderate Risk";
    default:
      return "High Risk";
  }
}

function getSummary(category: EmergencyFundResultLevel) {
  switch (category) {
    case "Strong Emergency Preparedness":
      return "Your emergency fund looks robust and well positioned to absorb unexpected shocks.";
    case "Moderately Prepared":
      return "You have a workable cushion, with room to strengthen resilience and access speed.";
    case "Limited Emergency Cushion":
      return "Your current buffer may handle smaller disruptions, but bigger shocks could feel tight.";
    case "Financial Vulnerability Risk":
      return "Your responses suggest limited shock absorption, so rebuilding a cushion should be a priority.";
    default:
      return "Your finances may be especially exposed to disruption right now, so start with small protection steps.";
  }
}

function buildSectionScores(answers: EmergencyFundAnswerMap): EmergencyFundSectionScore[] {
  return emergencyFundSectionMeta.map((section) => {
    const questions = emergencyFundQuestions.filter((question) => question.sectionId === section.sectionId);
    const score = questions.reduce((total, question) => total + getOptionScore(question, answers[question.id]), 0);
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

function buildInsights(answers: EmergencyFundAnswerMap, category: EmergencyFundResultLevel, sectionScores: EmergencyFundSectionScore[]): EmergencyFundInsight[] {
  const coverageScore = sectionScores.find((section) => section.sectionId === "coverage")?.percentage ?? 0;
  const confidenceScore = sectionScores.find((section) => section.sectionId === "confidence")?.percentage ?? 0;
  const behaviorScore = sectionScores.find((section) => section.sectionId === "behavior")?.percentage ?? 0;
  const disruptionScore = sectionScores.find((section) => section.sectionId === "disruption")?.percentage ?? 0;

  const insights: EmergencyFundInsight[] = [];

  if (coverageScore >= 80) {
    insights.push({
      title: "Strong coverage base",
      description: "Your liquid reserves and access speed suggest you can absorb disruptions with less short-term pressure.",
      tone: "positive",
    });
  } else if (coverageScore <= 40) {
    insights.push({
      title: "Coverage needs attention",
      description: "Your buffer may be too small or too hard to access quickly when a real emergency happens.",
      tone: "warning",
    });
  }

  if (confidenceScore <= 40) {
    insights.push({
      title: "Emergency anxiety is elevated",
      description: "Financial surprises may feel stressful enough that planning and automation could help a lot.",
      tone: "caution",
    });
  }

  if (behaviorScore >= 75) {
    insights.push({
      title: "Healthy savings habits",
      description: "Your answers show disciplined saving behavior, which is one of the strongest predictors of resilience.",
      tone: "positive",
    });
  } else if (behaviorScore <= 40) {
    insights.push({
      title: "Savings habits are fragile",
      description: "Inconsistent saving can make the emergency fund harder to grow and easier to dip into.",
      tone: "warning",
    });
  }

  if (disruptionScore <= 40) {
    insights.push({
      title: "Shock absorption looks weak",
      description: "Unexpected expenses, income gaps, or borrowing pressure may be difficult to handle right now.",
      tone: "critical",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Balanced emergency profile",
      description: "No single area appears extreme, so steady improvement should be enough to strengthen resilience.",
      tone: "positive",
    });
  }

  if (category === "Critical Emergency Preparedness Gap") {
    insights.unshift({
      title: "Immediate protection needed",
      description: "Your current setup may not provide enough protection against sudden expense shocks.",
      tone: "critical",
    });
  }

  return insights.slice(0, 4);
}

function buildQuestionReview(answers: EmergencyFundAnswerMap): EmergencyFundQuestionReviewItem[] {
  return emergencyFundQuestions.map((question) => {
    const selectedAnswer = answers[question.id] ?? null;
    const score = getOptionScore(question, selectedAnswer);

    return {
      question,
      selectedAnswer,
      isStrong: score >= 4,
    };
  });
}

function buildCoverageEstimate(rawScore: number) {
  if (rawScore >= 63) return "6+ months";
  if (rawScore >= 51) return "3-6 months";
  if (rawScore >= 39) return "1-3 months";
  if (rawScore >= 27) return "Less than 1 month";
  return "No reliable cushion";
}

function buildStabilityRating(rawScore: number) {
  if (rawScore >= 63) return "Very steady";
  if (rawScore >= 51) return "Fairly steady";
  if (rawScore >= 39) return "Uneven";
  if (rawScore >= 27) return "Fragile";
  return "Highly fragile";
}

function buildEmotionalStressLevel(category: EmergencyFundResultLevel) {
  switch (category) {
    case "Strong Emergency Preparedness":
      return "Low";
    case "Moderately Prepared":
      return "Mild";
    case "Limited Emergency Cushion":
      return "Moderate";
    case "Financial Vulnerability Risk":
      return "High";
    default:
      return "Very high";
  }
}

function buildTargetCoverageMonths(category: EmergencyFundResultLevel) {
  switch (category) {
    case "Strong Emergency Preparedness":
      return 6;
    case "Moderately Prepared":
      return 4;
    case "Limited Emergency Cushion":
      return 3;
    case "Financial Vulnerability Risk":
      return 1;
    default:
      return 1;
  }
}

function buildSavingsDisciplineIndicator(answers: EmergencyFundAnswerMap, category: EmergencyFundResultLevel) {
  const regularSaving = answers["save-regularly"] === "Every month consistently" || answers["saving-habit"] === "Automated and disciplined";
  if (category === "Strong Emergency Preparedness" && regularSaving) return "Disciplined and consistent";
  if (regularSaving) return "Promising but uneven";
  if (category === "Critical Emergency Preparedness Gap") return "Needs immediate structure";
  return "Inconsistent";
}

function buildDependencyRisk(answers: EmergencyFundAnswerMap) {
  if (answers["credit-reliance"] === "Frequently" || answers["credit-reliance"] === "Almost always") {
    return "High dependency on borrowing";
  }
  if (answers["credit-reliance"] === "Sometimes") {
    return "Moderate borrowing dependency";
  }
  return "Low borrowing dependency";
}

function buildSuggestedTarget(category: EmergencyFundResultLevel) {
  switch (category) {
    case "Strong Emergency Preparedness":
      return "Maintain 6 months of essentials and review annually";
    case "Moderately Prepared":
      return "Build toward 4-6 months of essentials";
    case "Limited Emergency Cushion":
      return "Aim for a 1-3 month starter buffer";
    case "Financial Vulnerability Risk":
      return "Start with a 1-month protection goal";
    default:
      return "Start with a small starter buffer and protect essentials first";
  }
}

function deduplicateRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  return Array.from(
    new Map(recommendations.map((item) => [item.id, item])).values()
  );
}

function getCategoryPool(
  category: EmergencyFundResultLevel
): Recommendation[] {
  switch (category) {
    case "Strong Emergency Preparedness":
      return recommendationPools.strongPreparedness;

    case "Moderately Prepared":
      return recommendationPools.moderatePreparedness;

    case "Limited Emergency Cushion":
      return recommendationPools.limitedCushion;

    case "Financial Vulnerability Risk":
      return recommendationPools.vulnerabilityRisk;

    default:
      return recommendationPools.criticalRisk;
  }
}

export function buildRecommendations(
  category: EmergencyFundResultLevel,
  answers: EmergencyFundAnswerMap
): string[] {
  const recommendations: Recommendation[] = [];

  const categoryRecommendations = shuffleArray(
    getCategoryPool(category)
  ).slice(0, 5);

  recommendations.push(...categoryRecommendations);

  const frequentCreditReliance =
    answers["credit-reliance"] === "Frequently" ||
    answers["credit-reliance"] === "Almost always";

  const emotionallyStressed =
    answers["emotional-stress"] === "Very stressful" ||
    answers["emotional-stress"] === "Extremely overwhelming";

  const unstableIncome =
    answers["income-stability"] === "Unpredictable" ||
    answers["income-stability"] === "Highly uncertain";

  const weakSavingHabit =
    answers["save-regularly"] === "Never" ||
    answers["saving-habit"] === "No saving habit";

  const spendingLeakage =
    answers["savings-withdrawals"] === "Frequently" ||
    answers["savings-withdrawals"] === "Very often";

  if (frequentCreditReliance) {
    recommendations.push(
      ...shuffleArray(
        recommendationPools.triggers.creditReliance
      ).slice(0, 2)
    );
  }

  if (emotionallyStressed) {
    recommendations.push(
      ...shuffleArray(
        recommendationPools.triggers.emotionalStress
      ).slice(0, 2)
    );
  }

  if (unstableIncome) {
    recommendations.push(
      ...shuffleArray(
        recommendationPools.triggers.unstableIncome
      ).slice(0, 2)
    );
  }

  if (weakSavingHabit) {
    recommendations.push(
      ...shuffleArray(
        recommendationPools.triggers.weakSavingsHabit
      ).slice(0, 2)
    );
  }

  if (spendingLeakage) {
    recommendations.push(
      ...shuffleArray(
        recommendationPools.triggers.spendingLeakage
      ).slice(0, 2)
    );
  }

  const finalRecommendations = deduplicateRecommendations(recommendations)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return shuffleArray(finalRecommendations)
    .slice(0, 8)
    .map((item) => item.text);
}

export function calculateEmergencyFundResult(answers: EmergencyFundAnswerMap): EmergencyFundResult {
  const rawScore = emergencyFundQuestions.reduce((total, question) => total + getOptionScore(question, answers[question.id]), 0);
  const percentageScore = Math.max(0, Math.min(100, Math.round(((rawScore - emergencyFundMinimumScore) / (emergencyFundMaximumScore - emergencyFundMinimumScore)) * 100)));
  const category = getCategory(rawScore);
  const sectionScores = buildSectionScores(answers);

  return {
    rawScore,
    percentageScore,
    category,
    risk: getRiskLevel(category),
    summary: getSummary(category),
    coverageProgressPercent: percentageScore,
    emergencyCoverageEstimate: buildCoverageEstimate(rawScore),
    savingsStabilityRating: buildStabilityRating(rawScore),
    emotionalStressLevel: buildEmotionalStressLevel(category),
    targetCoverageMonths: buildTargetCoverageMonths(category),
    emergencyPreparednessScore: rawScore,
    suggestedEmergencyFundTarget: buildSuggestedTarget(category),
    savingsDisciplineIndicator: buildSavingsDisciplineIndicator(answers, category),
    emergencyDependencyRisk: buildDependencyRisk(answers),
    insights: buildInsights(answers, category, sectionScores),
    recommendations: buildRecommendations(category, answers),
    sectionScores,
    questionReview: buildQuestionReview(answers),
  };
}