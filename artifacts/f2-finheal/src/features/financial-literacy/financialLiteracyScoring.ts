import {
  financialLiteracyCategoryLabels,
  financialLiteracyQuestionsByLevel,
  financialLiteracyLevels,
  type AnswerLetter,
  type FinancialLiteracyCategory,
  type FinancialLiteracyLevelId,
  type FinancialLiteracyQuestion,
} from "./financialLiteracyConfig";

export type FinancialLiteracyAnswers = Partial<Record<string, AnswerLetter>>;

export type FinancialLiteracyAttempt = {
  attemptId: string;
  levelId: FinancialLiteracyLevelId;
  questionIds: string[];
  currentQuestionIndex: number;
  answers: FinancialLiteracyAnswers;
  startedAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  stage: "quiz" | "review" | "results";
};

export type FinancialLiteracyHistoryAttempt = FinancialLiteracyAttempt & {
  submittedAt: string;
};

export type FinancialLiteracyCategoryScore = {
  category: FinancialLiteracyCategory;
  label: string;
  score: number;
  max: number;
  percentage: number;
};

export type FinancialLiteracyLevelPerformance = {
  levelId: FinancialLiteracyLevelId;
  levelName: string;
  totalAttempts: number;
  bestScore: number;
  latestScore: number;
  latestPercentage: number;
};

export type FinancialLiteracyResult = {
  levelId: FinancialLiteracyLevelId;
  levelName: string;
  rawScore: number;
  totalQuestions: number;
  percentageScore: number;
  badge: string;
  summary: string;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  behavioralInsights: string[];
  categoryScores: FinancialLiteracyCategoryScore[];
  questionReview: Array<{
    question: FinancialLiteracyQuestion;
    selectedAnswer: AnswerLetter | null;
    isCorrect: boolean;
  }>;
  levelPerformance: FinancialLiteracyLevelPerformance[];
};

const categorySuggestionMap: Record<FinancialLiteracyCategory, string> = {
  budgeting: "Build a simple monthly budget and track needs, wants, and savings separately.",
  saving: "Set up an automatic transfer to an emergency fund before spending on extras.",
  banking: "Use account features like alerts, reminders, and safe payment methods consistently.",
  debt: "Compare total borrowing cost, not just EMI size, before taking or restructuring loans.",
  credit: "Keep credit utilization low and pay dues in full when possible.",
  insurance: "Review core protection coverage so one shock does not destroy your savings.",
  investing: "Diversify across assets and keep a long-term plan instead of reacting to noise.",
  tax: "Use tax-efficient choices that fit your goals instead of chasing last-minute deductions.",
  planning: "Revisit goals regularly so savings, risk, and time horizon stay aligned.",
  behavior: "Pause before emotional decisions and use a checklist for money choices.",
};

function getQuestionScore(question: FinancialLiteracyQuestion, answers: FinancialLiteracyAnswers) {
  const selected = answers[question.id];
  const isCorrect = selected === question.correctAnswer;
  return {
    isCorrect,
    selectedAnswer: selected ?? null,
    score: isCorrect ? 1 : 0,
  };
}

function calculateBadge(percentage: number) {
  if (percentage < 40) return "Financial Beginner";
  if (percentage < 60) return "Practical Planner";
  if (percentage < 75) return "Smart Money Manager";
  if (percentage < 90) return "Strategic Investor";
  return "Financially Fluent";
}

function buildSummary(levelName: string, percentage: number) {
  if (percentage < 40) {
    return `You are beginning your financial learning journey. Building stronger budgeting, saving, and debt management habits can significantly improve financial confidence.`;
  }
  if (percentage < 60) {
    return `You demonstrate a practical understanding of personal finance, though some advanced concepts may require deeper familiarity.`;
  }
  if (percentage < 80) {
    return `You show solid financial awareness and decision-making across everyday money situations and longer-term planning.`;
  }
  return `You show strong financial awareness and strategic judgment in ${levelName.toLowerCase()} money decisions.`;
}

function topItems<T extends { percentage: number }>(items: T[], count: number, order: "asc" | "desc") {
  const sorted = [...items].sort((a, b) => order === "asc" ? a.percentage - b.percentage : b.percentage - a.percentage);
  return sorted.slice(0, count);
}

export function calculateFinancialLiteracyResult(
  attempt: FinancialLiteracyAttempt,
  history: FinancialLiteracyHistoryAttempt[] = [],
): FinancialLiteracyResult {
  const levelQuestions = financialLiteracyQuestionsByLevel[attempt.levelId];
  const levelMeta = financialLiteracyLevels.find((level) => level.id === attempt.levelId)!;

  const questionReview = levelQuestions.map((question) => {
    const result = getQuestionScore(question, attempt.answers);
    return {
      question,
      selectedAnswer: result.selectedAnswer,
      isCorrect: result.isCorrect,
    };
  });

  const rawScore = questionReview.reduce((total, item) => total + (item.isCorrect ? 1 : 0), 0);
  const totalQuestions = levelQuestions.length;
  const percentageScore = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;
  const badge = calculateBadge(percentageScore);
  const summary = buildSummary(levelMeta.name, percentageScore);

  const categoryMap = new Map<FinancialLiteracyCategory, { score: number; max: number }>();
  for (const question of levelQuestions) {
    const score = getQuestionScore(question, attempt.answers).score;
    const current = categoryMap.get(question.category) ?? { score: 0, max: 0 };
    categoryMap.set(question.category, {
      score: current.score + score,
      max: current.max + 1,
    });
  }

  const categoryScores = [...categoryMap.entries()].map(([category, value]) => ({
    category,
    label: financialLiteracyCategoryLabels[category],
    score: value.score,
    max: value.max,
    percentage: value.max > 0 ? Math.round((value.score / value.max) * 100) : 0,
  }));

  const strengths = topItems(categoryScores, 3, "desc")
    .filter((item) => item.percentage >= 70)
    .map((item) => `${item.label}: strong ${item.percentage}% performance`);

  const weakAreas = topItems(categoryScores, 3, "asc")
    .filter((item) => item.percentage < 70)
    .map((item) => `${item.label}: ${item.percentage}%`);

  const recommendations = topItems(categoryScores, 3, "asc").map((item) => categorySuggestionMap[item.category]);

  const behavioralInsights: string[] = [];
  if (categoryScores.some((item) => item.category === "credit" && item.percentage < 70)) {
    behavioralInsights.push("Your answers suggest credit discipline may be an area to reinforce through repayment routines and utilization control.");
  }
  if (categoryScores.some((item) => item.category === "behavior" && item.percentage < 70)) {
    behavioralInsights.push("Behavioral consistency is as important as knowledge. Small routines can improve money decisions quickly.");
  }
  if (categoryScores.some((item) => item.category === "investing" && item.percentage >= 80)) {
    behavioralInsights.push("You show a strong grasp of long-term investing logic and risk-aware decision making.");
  }
  if (behavioralInsights.length === 0) {
    behavioralInsights.push("Your pattern of answers suggests balanced awareness with opportunities to deepen a few areas.");
  }

  const levelPerformance: FinancialLiteracyLevelPerformance[] = financialLiteracyLevels.map((level) => {
    const attemptsForLevel = history.filter((item) => item.levelId === level.id);
    const completedScores = attemptsForLevel
      .map((item) => {
        const score = calculateFinancialLiteracyResult(item, []);
        return score.percentageScore;
      });

    const latestAttempt = attemptsForLevel[0] ?? null;
    const latestScore = latestAttempt ? calculateFinancialLiteracyResult(latestAttempt, []).percentageScore : 0;

    return {
      levelId: level.id,
      levelName: level.name,
      totalAttempts: attemptsForLevel.length,
      bestScore: completedScores.length ? Math.max(...completedScores) : 0,
      latestScore,
      latestPercentage: latestScore,
    };
  });

  return {
    levelId: attempt.levelId,
    levelName: levelMeta.name,
    rawScore,
    totalQuestions,
    percentageScore,
    badge,
    summary,
    strengths,
    weakAreas,
    recommendations,
    behavioralInsights,
    categoryScores,
    questionReview,
    levelPerformance,
  };
}
