export type LoanFitSectionId =
  | "income-stability"
  | "emi-affordability"
  | "existing-commitments"
  | "readiness";

export type LoanFitQuestionId =
  | "income-pattern"
  | "income-runway"
  | "income-drop-risk"
  | "leftover-cash"
  | "emi-burden"
  | "emergency-readiness"
  | "existing-debt"
  | "credit-dependency"
  | "missed-payments"
  | "loan-purpose"
  | "confidence"
  | "income-drop-scenario";

export type LoanFitOption = {
  id: string;
  label: string;
  score: 1 | 2 | 3 | 4 | 5;
};

export type LoanFitQuestion = {
  id: LoanFitQuestionId;
  sectionId: LoanFitSectionId;
  sectionLabel: string;
  number: number;
  prompt: string;
  options: LoanFitOption[];
};

export type LoanFitAnswerMap = Partial<Record<LoanFitQuestionId, string>>;

export type LoanFitRiskSeverity = "low" | "medium" | "high" | "very-high";

export type LoanFitInsight = {
  title: string;
  description: string;
  severity: LoanFitRiskSeverity;
};

export type LoanFitResult = {
  totalScore: number;
  percentageScore: number;
  rawScore: number;
  riskLevel: string;
  category: string;
  affordabilityStatus: string;
  emotionalReadinessIndicator: string;
  summary: string;
  suggestions: string[];
  insights: LoanFitInsight[];
  stressIndicators: LoanFitInsight[];
  topImprovementAreas: string[];
  sectionScores: Array<{
    sectionId: LoanFitSectionId;
    sectionLabel: string;
    score: number;
    maxScore: number;
  }>;
  answeredCount: number;
  totalQuestions: number;
};

export const loanFitQuestions: LoanFitQuestion[] = [
  {
    id: "income-pattern",
    sectionId: "income-stability",
    sectionLabel: "Income Stability",
    number: 1,
    prompt: "What best describes your income pattern?",
    options: [
      { id: "fixed-salary", label: "Fixed monthly salary", score: 5 },
      { id: "salary-incentives", label: "Salary with variable incentives", score: 4 },
      { id: "freelance-business", label: "Freelance/business income with fluctuations", score: 3 },
      { id: "irregular-income", label: "Irregular income", score: 2 },
      { id: "no-stable-income", label: "Currently no stable income", score: 1 },
    ],
  },
  {
    id: "income-runway",
    sectionId: "income-stability",
    sectionLabel: "Income Stability",
    number: 2,
    prompt: "If your income stopped today, how long could you manage your current expenses?",
    options: [
      { id: "more-than-12-months", label: "More than 12 months", score: 5 },
      { id: "six-to-twelve-months", label: "6–12 months", score: 4 },
      { id: "three-to-six-months", label: "3–6 months", score: 3 },
      { id: "one-to-three-months", label: "1–3 months", score: 2 },
      { id: "less-than-one-month", label: "Less than 1 month", score: 1 },
    ],
  },
  {
    id: "income-drop-risk",
    sectionId: "income-stability",
    sectionLabel: "Income Stability",
    number: 3,
    prompt: "How likely is your income to reduce in the next 12 months?",
    options: [
      { id: "very-unlikely", label: "Very unlikely", score: 5 },
      { id: "slightly-unlikely", label: "Slightly unlikely", score: 4 },
      { id: "uncertain", label: "Uncertain", score: 3 },
      { id: "somewhat-likely", label: "Somewhat likely", score: 2 },
      { id: "highly-likely", label: "Highly likely", score: 1 },
    ],
  },
  {
    id: "leftover-cash",
    sectionId: "emi-affordability",
    sectionLabel: "EMI Affordability",
    number: 4,
    prompt: "After paying all monthly expenses, how much money is usually left?",
    options: [
      { id: "more-than-40-percent", label: "More than 40%", score: 5 },
      { id: "twenty-five-to-forty-percent", label: "25–40%", score: 4 },
      { id: "ten-to-twenty-five-percent", label: "10–25%", score: 3 },
      { id: "less-than-10-percent", label: "Less than 10%", score: 2 },
      { id: "nothing-negative", label: "Nothing / negative balance", score: 1 },
    ],
  },
  {
    id: "emi-burden",
    sectionId: "emi-affordability",
    sectionLabel: "EMI Affordability",
    number: 5,
    prompt: "What percentage of your monthly income would this new EMI consume?",
    options: [
      { id: "less-than-10", label: "Less than 10%", score: 5 },
      { id: "ten-to-twenty", label: "10–20%", score: 4 },
      { id: "twenty-to-thirty-five", label: "20–35%", score: 3 },
      { id: "thirty-five-to-fifty", label: "35–50%", score: 2 },
      { id: "more-than-fifty", label: "More than 50%", score: 1 },
    ],
  },
  {
    id: "emergency-readiness",
    sectionId: "emi-affordability",
    sectionLabel: "EMI Affordability",
    number: 6,
    prompt: "If an emergency expense appeared next month, could you still comfortably pay this EMI?",
    options: [
      { id: "definitely-yes", label: "Definitely yes", score: 5 },
      { id: "probably-yes", label: "Probably yes", score: 4 },
      { id: "unsure", label: "Unsure", score: 3 },
      { id: "probably-not", label: "Probably not", score: 2 },
      { id: "definitely-not", label: "Definitely not", score: 1 },
    ],
  },
  {
    id: "existing-debt",
    sectionId: "existing-commitments",
    sectionLabel: "Existing Commitments",
    number: 7,
    prompt: "Do you already have ongoing EMIs or debt payments?",
    options: [
      { id: "no-existing-debt", label: "No existing debt", score: 5 },
      { id: "small-manageable-emis", label: "Small manageable EMIs", score: 4 },
      { id: "moderate-emis", label: "Moderate EMIs", score: 3 },
      { id: "heavy-debt-obligations", label: "Heavy debt obligations", score: 2 },
      { id: "struggling-emis", label: "Struggling to manage current EMIs", score: 1 },
    ],
  },
  {
    id: "credit-dependency",
    sectionId: "existing-commitments",
    sectionLabel: "Existing Commitments",
    number: 8,
    prompt: "How often do you rely on credit cards, BNPL, or borrowing for regular expenses?",
    options: [
      { id: "never", label: "Never", score: 5 },
      { id: "rarely", label: "Rarely", score: 4 },
      { id: "sometimes", label: "Sometimes", score: 3 },
      { id: "frequently", label: "Frequently", score: 2 },
      { id: "almost-every-month", label: "Almost every month", score: 1 },
    ],
  },
  {
    id: "missed-payments",
    sectionId: "existing-commitments",
    sectionLabel: "Existing Commitments",
    number: 9,
    prompt: "Have you ever missed an EMI or bill payment in the last 12 months?",
    options: [
      { id: "never-missed", label: "Never", score: 5 },
      { id: "once-accidentally", label: "Once accidentally", score: 4 },
      { id: "two-to-three-times", label: "2–3 times", score: 3 },
      { id: "frequently-missed", label: "Frequently", score: 2 },
      { id: "currently-missing", label: "Currently missing payments", score: 1 },
    ],
  },
  {
    id: "loan-purpose",
    sectionId: "readiness",
    sectionLabel: "Loan Purpose & Emotional Readiness",
    number: 10,
    prompt: "Why are you considering this loan?",
    options: [
      { id: "essential-long-term-investment", label: "Essential long-term investment", score: 5 },
      { id: "skill-career-growth", label: "Skill/career growth", score: 4 },
      { id: "planned-lifestyle-upgrade", label: "Planned lifestyle upgrade", score: 3 },
      { id: "impulse-purchase", label: "Impulse purchase", score: 2 },
      { id: "repay-another-debt", label: "To repay another debt", score: 1 },
    ],
  },
  {
    id: "confidence",
    sectionId: "readiness",
    sectionLabel: "Loan Purpose & Emotional Readiness",
    number: 11,
    prompt: "If this loan gets approved today, how confident would you feel managing it?",
    options: [
      { id: "completely-confident", label: "Completely confident", score: 5 },
      { id: "mostly-comfortable", label: "Mostly comfortable", score: 4 },
      { id: "slightly-nervous", label: "Slightly nervous", score: 3 },
      { id: "very-stressed", label: "Very stressed", score: 2 },
      { id: "overwhelmed-already", label: "Overwhelmed already", score: 1 },
    ],
  },
  {
    id: "income-drop-scenario",
    sectionId: "readiness",
    sectionLabel: "Loan Purpose & Emotional Readiness",
    number: 12,
    prompt: "Imagine your monthly income drops by 20% for 3 months. What happens?",
    options: [
      { id: "emi-remains-manageable", label: "EMI remains manageable", score: 5 },
      { id: "minor-spending-cuts", label: "Need minor spending cuts", score: 4 },
      { id: "would-struggle-somewhat", label: "Would struggle somewhat", score: 3 },
      { id: "would-likely-miss-payments", label: "Would likely miss payments", score: 2 },
      { id: "financial-crisis", label: "Financial crisis situation", score: 1 },
    ],
  },
];

export const loanFitSectionMeta: Array<{
  sectionId: LoanFitSectionId;
  title: string;
  description: string;
}> = [
  {
    sectionId: "income-stability",
    title: "Income Stability",
    description: "How resilient and predictable your cash flow feels.",
  },
  {
    sectionId: "emi-affordability",
    title: "EMI Affordability",
    description: "How comfortably the new payment fits your monthly budget.",
  },
  {
    sectionId: "existing-commitments",
    title: "Existing Commitments",
    description: "How much repayment pressure you already carry.",
  },
  {
    sectionId: "readiness",
    title: "Loan Purpose & Readiness",
    description: "Whether your mindset and motivation support safe borrowing.",
  },
];

export const loanFitTotalQuestions = loanFitQuestions.length;
export const loanFitMaximumRawScore = loanFitTotalQuestions * 5;
export const loanFitMinimumRawScore = loanFitTotalQuestions * 1;
