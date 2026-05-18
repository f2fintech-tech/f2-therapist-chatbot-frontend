/**
 * Emergency Fund Check configuration
 * 15-question financial wellness diagnostic for emergency preparedness and savings resilience.
 */

export type EmergencyFundSectionId = "coverage" | "confidence" | "behavior" | "disruption";

export type EmergencyFundQuestionId =
  | "coverage-months"
  | "income-confidence"
  | "save-regularly"
  | "savings-location"
  | "access-speed"
  | "expense-disruption"
  | "medical-response"
  | "credit-reliance"
  | "income-stability"
  | "savings-withdrawals"
  | "major-expense-readiness"
  | "saving-habit"
  | "three-month-shock"
  | "emotional-stress"
  | "savings-obstacle";

export type EmergencyFundOption = {
  label: string;
  score: 1 | 2 | 3 | 4 | 5;
};

export type EmergencyFundQuestion = {
  id: EmergencyFundQuestionId;
  sectionId: EmergencyFundSectionId;
  prompt: string;
  options: EmergencyFundOption[];
};

export type EmergencyFundAnswerMap = Partial<Record<EmergencyFundQuestionId, string>>;

export type EmergencyFundInsightTone = "positive" | "caution" | "warning" | "critical";

export type EmergencyFundSectionMeta = {
  sectionId: EmergencyFundSectionId;
  title: string;
  description: string;
};

export const emergencyFundDurationMinutes = 2;
export const emergencyFundStorageVersion = 1;
export const emergencyFundTotalQuestions = 15;
export const emergencyFundMaximumScore = 75;
export const emergencyFundMinimumScore = 15;

export const emergencyFundSectionMeta: EmergencyFundSectionMeta[] = [
  {
    sectionId: "coverage",
    title: "Coverage depth",
    description: "How much immediate cash cushion you already have and how accessible it is.",
  },
  {
    sectionId: "confidence",
    title: "Emotional confidence",
    description: "How secure and emotionally steady you feel when money becomes uncertain.",
  },
  {
    sectionId: "behavior",
    title: "Saving discipline",
    description: "The habits and consistency behind your emergency fund behavior.",
  },
  {
    sectionId: "disruption",
    title: "Disruption readiness",
    description: "How well your current setup handles shocks, income gaps, and borrowing pressure.",
  },
];

export const emergencyFundQuestions: EmergencyFundQuestion[] = [
  {
    id: "coverage-months",
    sectionId: "coverage",
    prompt: "How many months of essential expenses can your current savings cover?",
    options: [
      { label: "More than 12 months", score: 5 },
      { label: "6-12 months", score: 4 },
      { label: "3-6 months", score: 3 },
      { label: "1-3 months", score: 2 },
      { label: "Less than 1 month", score: 1 },
    ],
  },
  {
    id: "income-confidence",
    sectionId: "confidence",
    prompt: "If your income stopped today, how confident would you feel financially?",
    options: [
      { label: "Completely secure", score: 5 },
      { label: "Mostly comfortable", score: 4 },
      { label: "Somewhat uncertain", score: 3 },
      { label: "Very worried", score: 2 },
      { label: "Extremely stressed", score: 1 },
    ],
  },
  {
    id: "save-regularly",
    sectionId: "behavior",
    prompt: "How regularly do you save money specifically for emergencies?",
    options: [
      { label: "Every month consistently", score: 5 },
      { label: "Most months", score: 4 },
      { label: "Occasionally", score: 3 },
      { label: "Rarely", score: 2 },
      { label: "Never", score: 1 },
    ],
  },
  {
    id: "savings-location",
    sectionId: "coverage",
    prompt: "Where do you primarily keep your emergency savings?",
    options: [
      { label: "Easily accessible savings account", score: 5 },
      { label: "Multiple liquid savings options", score: 4 },
      { label: "Partially invested / partially liquid", score: 3 },
      { label: "Mostly tied in investments", score: 2 },
      { label: "I do not have emergency savings", score: 1 },
    ],
  },
  {
    id: "access-speed",
    sectionId: "coverage",
    prompt: "How quickly could you access emergency money if needed urgently?",
    options: [
      { label: "Immediately", score: 5 },
      { label: "Within 1 day", score: 4 },
      { label: "Within a few days", score: 3 },
      { label: "More than a week", score: 2 },
      { label: "I am unsure / do not have access", score: 1 },
    ],
  },
  {
    id: "expense-disruption",
    sectionId: "disruption",
    prompt: "How often do unexpected expenses disrupt your monthly finances?",
    options: [
      { label: "Almost never", score: 5 },
      { label: "Rarely", score: 4 },
      { label: "Sometimes", score: 3 },
      { label: "Frequently", score: 2 },
      { label: "Almost every month", score: 1 },
    ],
  },
  {
    id: "medical-response",
    sectionId: "disruption",
    prompt: "If a medical emergency occurred tomorrow, what would most likely happen financially?",
    options: [
      { label: "Fully manageable through savings", score: 5 },
      { label: "Mostly manageable", score: 4 },
      { label: "Need partial borrowing", score: 3 },
      { label: "Heavy borrowing required", score: 2 },
      { label: "Serious financial crisis", score: 1 },
    ],
  },
  {
    id: "credit-reliance",
    sectionId: "disruption",
    prompt: "Do you currently rely on credit cards or loans during emergencies?",
    options: [
      { label: "Never", score: 5 },
      { label: "Rarely", score: 4 },
      { label: "Sometimes", score: 3 },
      { label: "Frequently", score: 2 },
      { label: "Almost always", score: 1 },
    ],
  },
  {
    id: "income-stability",
    sectionId: "disruption",
    prompt: "How stable is your primary source of income?",
    options: [
      { label: "Extremely stable", score: 5 },
      { label: "Mostly stable", score: 4 },
      { label: "Moderately stable", score: 3 },
      { label: "Unpredictable", score: 2 },
      { label: "Highly uncertain", score: 1 },
    ],
  },
  {
    id: "savings-withdrawals",
    sectionId: "behavior",
    prompt: "How often do you dip into savings for non-essential spending?",
    options: [
      { label: "Never", score: 5 },
      { label: "Rarely", score: 4 },
      { label: "Occasionally", score: 3 },
      { label: "Frequently", score: 2 },
      { label: "Very often", score: 1 },
    ],
  },
  {
    id: "major-expense-readiness",
    sectionId: "coverage",
    prompt: "How prepared are you for a sudden major expense like job loss or urgent repairs?",
    options: [
      { label: "Fully prepared", score: 5 },
      { label: "Mostly prepared", score: 4 },
      { label: "Somewhat prepared", score: 3 },
      { label: "Underprepared", score: 2 },
      { label: "Completely unprepared", score: 1 },
    ],
  },
  {
    id: "saving-habit",
    sectionId: "behavior",
    prompt: "What best describes your current saving habit?",
    options: [
      { label: "Automated and disciplined", score: 5 },
      { label: "Regular but manual", score: 4 },
      { label: "Inconsistent", score: 3 },
      { label: "Rare savings", score: 2 },
      { label: "No saving habit", score: 1 },
    ],
  },
  {
    id: "three-month-shock",
    sectionId: "disruption",
    prompt: "If your monthly expenses increased unexpectedly for 3 months, what would happen?",
    options: [
      { label: "Savings would comfortably absorb it", score: 5 },
      { label: "Minor lifestyle adjustments needed", score: 4 },
      { label: "Moderate financial stress", score: 3 },
      { label: "Need borrowing or debt", score: 2 },
      { label: "Unable to manage properly", score: 1 },
    ],
  },
  {
    id: "emotional-stress",
    sectionId: "confidence",
    prompt: "How emotionally stressful do financial emergencies feel to you?",
    options: [
      { label: "Not stressful", score: 5 },
      { label: "Slightly stressful", score: 4 },
      { label: "Moderately stressful", score: 3 },
      { label: "Very stressful", score: 2 },
      { label: "Extremely overwhelming", score: 1 },
    ],
  },
  {
    id: "savings-obstacle",
    sectionId: "behavior",
    prompt: "What is your biggest obstacle to building emergency savings?",
    options: [
      { label: "No major obstacle", score: 5 },
      { label: "Inconsistent savings discipline", score: 4 },
      { label: "Lifestyle spending", score: 3 },
      { label: "Existing debt obligations", score: 2 },
      { label: "Insufficient income", score: 1 },
    ],
  },
];

export const emergencyFundQuestionsBySection = emergencyFundSectionMeta.reduce((accumulator, section) => {
  accumulator[section.sectionId] = emergencyFundQuestions.filter((question) => question.sectionId === section.sectionId);
  return accumulator;
}, {} as Record<EmergencyFundSectionId, EmergencyFundQuestion[]>);

export const emergencyFundQuestionIds = emergencyFundQuestions.map((question) => question.id);
export const emergencyFundSectionIds = emergencyFundSectionMeta.map((section) => section.sectionId) as EmergencyFundSectionId[];
