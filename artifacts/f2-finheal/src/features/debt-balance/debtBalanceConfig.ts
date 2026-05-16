/**
 * Debt Balance Review Assessment Configuration
 * 12-question diagnostic for debt sustainability and financial wellness
 */

export type DebtBalanceSectionId = "current-obligations" | "repayment-behavior" | "financial-cushion" | "emotional-health";

export type DebtBalanceQuestionId =
  | "active-emis"
  | "emi-burden"
  | "debt-type"
  | "payment-timeliness"
  | "debt-stacking"
  | "minimum-payment"
  | "income-runway"
  | "emergency-savings"
  | "credit-reliance"
  | "financial-stressor"
  | "debt-stress"
  | "emergency-readiness";

export type DebtBalanceOption = {
  label: string;
  score: 1 | 2 | 3 | 4 | 5;
};

export type DebtBalanceQuestion = {
  id: DebtBalanceQuestionId;
  sectionId: DebtBalanceSectionId;
  prompt: string;
  helper: string;
  options: DebtBalanceOption[];
};

export type DebtBalanceAnswerMap = Partial<Record<DebtBalanceQuestionId, string>>;

export type DebtBalanceRiskSeverity = "low" | "moderate-low" | "moderate" | "high" | "very-high";

export type DebtBalanceInsight = {
  title: string;
  description: string;
  severity: "positive" | "caution" | "warning" | "critical";
};

export type DebtBalanceResult = {
  rawScore: number;
  percentageScore: number;
  category: string;
  risk: DebtBalanceRiskSeverity;
  summary: string;
  emotionalReadiness: string;
  debtStressIndicator: string;
  creditDependencyScore: number;
  repaymentStabilityScore: number;
  emergencyReadinessScore: number;
  insights: DebtBalanceInsight[];
  stressIndicators: Array<{
    indicator: string;
    severity: "low" | "moderate" | "high";
  }>;
  improvementAreas: Array<{
    question: string;
    currentScore: number;
    suggestion: string;
  }>;
  suggestions: string[];
  sectionScores: Record<DebtBalanceSectionId, { score: number; max: number }>;
};

export const debtBalanceQuestions: DebtBalanceQuestion[] = [
  {
    id: "active-emis",
    sectionId: "current-obligations",
    prompt: "How many active EMIs or loan repayments do you currently have?",
    helper: "Include home loans, education loans, personal loans, and any other installment payments.",
    options: [
      { label: "None", score: 5 },
      { label: "1", score: 4 },
      { label: "2–3", score: 3 },
      { label: "4–5", score: 2 },
      { label: "More than 5", score: 1 },
    ],
  },
  {
    id: "emi-burden",
    sectionId: "current-obligations",
    prompt: "Approximately what percentage of your monthly income goes toward EMIs or debt payments?",
    helper: "Include all loan repayments, but not credit card expenses paid in full.",
    options: [
      { label: "Less than 10%", score: 5 },
      { label: "10–20%", score: 4 },
      { label: "20–35%", score: 3 },
      { label: "35–50%", score: 2 },
      { label: "More than 50%", score: 1 },
    ],
  },
  {
    id: "debt-type",
    sectionId: "current-obligations",
    prompt: "Which type of debt do you currently hold the most?",
    helper: "Think about your highest outstanding balance or biggest liability.",
    options: [
      { label: "No debt", score: 5 },
      { label: "Home loan", score: 4 },
      { label: "Education loan", score: 3 },
      { label: "Personal loan", score: 2 },
      { label: "Credit card or short-term debt", score: 1 },
    ],
  },
  {
    id: "payment-timeliness",
    sectionId: "repayment-behavior",
    prompt: "How often do you pay EMIs or credit card dues on time?",
    helper: "Being consistent with payments is crucial for financial health.",
    options: [
      { label: "Always", score: 5 },
      { label: "Almost always", score: 4 },
      { label: "Sometimes delayed", score: 3 },
      { label: "Frequently delayed", score: 2 },
      { label: "Often missed completely", score: 1 },
    ],
  },
  {
    id: "debt-stacking",
    sectionId: "repayment-behavior",
    prompt: "Have you ever used one loan or credit source to repay another debt?",
    helper: "This is called debt stacking and can indicate repayment pressure.",
    options: [
      { label: "Never", score: 5 },
      { label: "Once in the past", score: 4 },
      { label: "Occasionally", score: 3 },
      { label: "Frequently", score: 2 },
      { label: "Regularly dependent on it", score: 1 },
    ],
  },
  {
    id: "minimum-payment",
    sectionId: "repayment-behavior",
    prompt: "How often do you pay only the minimum due on your credit card?",
    helper: "Minimum payments extend debt and increase interest costs significantly.",
    options: [
      { label: "Never", score: 5 },
      { label: "Rarely", score: 4 },
      { label: "Sometimes", score: 3 },
      { label: "Frequently", score: 2 },
      { label: "Almost every month", score: 1 },
    ],
  },
  {
    id: "income-runway",
    sectionId: "financial-cushion",
    prompt: "If your income stopped today, how long could you continue paying all EMIs comfortably?",
    helper: "This measures your financial runway relative to fixed obligations.",
    options: [
      { label: "More than 12 months", score: 5 },
      { label: "6–12 months", score: 4 },
      { label: "3–6 months", score: 3 },
      { label: "1–3 months", score: 2 },
      { label: "Less than 1 month", score: 1 },
    ],
  },
  {
    id: "emergency-savings",
    sectionId: "financial-cushion",
    prompt: "Do you currently have emergency savings separate from your monthly spending?",
    helper: "Emergency funds protect you from having to borrow during crises.",
    options: [
      { label: "Strong emergency fund", score: 5 },
      { label: "Moderate savings", score: 4 },
      { label: "Small financial buffer", score: 3 },
      { label: "Very little savings", score: 2 },
      { label: "No savings", score: 1 },
    ],
  },
  {
    id: "credit-reliance",
    sectionId: "financial-cushion",
    prompt: "How often do you rely on credit for regular monthly expenses?",
    helper: "Using credit for regular bills indicates potential cash flow imbalance.",
    options: [
      { label: "Never", score: 5 },
      { label: "Rarely", score: 4 },
      { label: "Sometimes", score: 3 },
      { label: "Frequently", score: 2 },
      { label: "Almost every month", score: 1 },
    ],
  },
  {
    id: "financial-stressor",
    sectionId: "emotional-health",
    prompt: "What usually causes the most financial stress for you?",
    helper: "Understanding your main concern helps us provide better guidance.",
    options: [
      { label: "No major stress", score: 5 },
      { label: "Unexpected expenses", score: 4 },
      { label: "Existing EMIs", score: 3 },
      { label: "Credit card bills", score: 2 },
      { label: "Managing multiple debts", score: 1 },
    ],
  },
  {
    id: "debt-stress",
    sectionId: "emotional-health",
    prompt: "How stressed do you feel when thinking about your debt repayments?",
    helper: "Your emotional wellbeing matters as much as your financial numbers.",
    options: [
      { label: "Not stressed at all", score: 5 },
      { label: "Slightly stressed", score: 4 },
      { label: "Moderately stressed", score: 3 },
      { label: "Highly stressed", score: 2 },
      { label: "Constantly overwhelmed", score: 1 },
    ],
  },
  {
    id: "emergency-readiness",
    sectionId: "emotional-health",
    prompt: "If an emergency expense appeared tomorrow, what would most likely happen?",
    helper: "This shows how resilient your finances are to unexpected events.",
    options: [
      { label: "Manage comfortably", score: 5 },
      { label: "Reduce spending temporarily", score: 4 },
      { label: "Use savings", score: 3 },
      { label: "Use credit or borrow", score: 2 },
      { label: "Miss existing repayments", score: 1 },
    ],
  },
];

export const debtBalanceSectionMeta: Array<{ id: DebtBalanceSectionId; title: string; description: string }> = [
  {
    id: "current-obligations",
    title: "Current Debt Load",
    description: "Your existing debt obligations and composition",
  },
  {
    id: "repayment-behavior",
    title: "Repayment Patterns",
    description: "How consistently you manage debt payments",
  },
  {
    id: "financial-cushion",
    title: "Financial Resilience",
    description: "Your ability to handle debt alongside emergencies",
  },
  {
    id: "emotional-health",
    title: "Emotional Wellbeing",
    description: "Stress and readiness around debt management",
  },
];

export const debtBalanceTotalQuestions = 12;
export const debtBalanceMaximumRawScore = 60;
export const debtBalanceMinimumRawScore = 12;
