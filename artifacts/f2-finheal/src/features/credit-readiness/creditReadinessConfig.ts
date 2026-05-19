export type CreditReadinessSectionId = 'behavior' | 'utilization' | 'stability' | 'emotional' | 'planning';

export type CreditReadinessQuestionId =
  | 'on_time_payments'
  | 'credit_utilization'
  | 'active_loans'
  | 'missed_payments_12m'
  | 'debt_confidence'
  | 'min_due_payments'
  | 'borrowing_motivation'
  | 'income_stability'
  | 'repayment_manageability'
  | 'monitoring_frequency'
  | 'dependency_on_credit'
  | 'debt_emotional_stress'
  | 'comfort_adding_emi'
  | 'planning_habits'
  | 'relationship_with_credit';

export type CreditReadinessOption = { label: string; score: 1 | 2 | 3 | 4 | 5 };

export type CreditReadinessQuestion = {
  id: CreditReadinessQuestionId;
  sectionId: CreditReadinessSectionId;
  prompt: string;
  options: CreditReadinessOption[];
};

export type CreditReadinessAnswerMap = Partial<Record<CreditReadinessQuestionId, string>>;

export const creditReadinessDurationMinutes = 5;
export const creditReadinessStorageVersion = 1;
export const creditReadinessTotalQuestions = 15;
export const creditReadinessMaximumScore = 75;
export const creditReadinessMinimumScore = 15;

export const creditReadinessSectionMeta = [
  { sectionId: 'behavior', title: 'Repayment behavior' },
  { sectionId: 'utilization', title: 'Credit utilization' },
  { sectionId: 'stability', title: 'Financial stability' },
  { sectionId: 'emotional', title: 'Emotional response' },
  { sectionId: 'planning', title: 'Planning & monitoring' },
] as const;

export const creditReadinessQuestions: CreditReadinessQuestion[] = [
  {
    id: 'on_time_payments',
    sectionId: 'behavior',
    prompt: 'How often do you pay your bills or EMIs on time?',
    options: [
      { label: 'Always', score: 5 },
      { label: 'Almost always', score: 4 },
      { label: 'Occasionally delayed', score: 3 },
      { label: 'Frequently delayed', score: 2 },
      { label: 'Often missed completely', score: 1 },
    ],
  },
  {
    id: 'credit_utilization',
    sectionId: 'utilization',
    prompt: 'How much of your available credit limit do you typically use?',
    options: [
      { label: 'Less than 10%', score: 5 },
      { label: '10–30%', score: 4 },
      { label: '30–50%', score: 3 },
      { label: '50–75%', score: 2 },
      { label: 'More than 75%', score: 1 },
    ],
  },
  {
    id: 'active_loans',
    sectionId: 'stability',
    prompt: 'How many active loans or EMIs do you currently manage?',
    options: [
      { label: 'None', score: 5 },
      { label: '1', score: 4 },
      { label: '2–3', score: 3 },
      { label: '4–5', score: 2 },
      { label: 'More than 5', score: 1 },
    ],
  },
  {
    id: 'missed_payments_12m',
    sectionId: 'behavior',
    prompt: 'Have you ever missed a loan repayment or credit card due in the past year?',
    options: [
      { label: 'Never', score: 5 },
      { label: 'Once accidentally', score: 4 },
      { label: 'A few times', score: 3 },
      { label: 'Frequently', score: 2 },
      { label: 'Currently struggling with repayments', score: 1 },
    ],
  },
  {
    id: 'debt_confidence',
    sectionId: 'emotional',
    prompt: 'How confident do you feel managing debt responsibly?',
    options: [
      { label: 'Completely confident', score: 5 },
      { label: 'Mostly comfortable', score: 4 },
      { label: 'Somewhat uncertain', score: 3 },
      { label: 'Frequently stressed', score: 2 },
      { label: 'Extremely overwhelmed', score: 1 },
    ],
  },
  {
    id: 'min_due_payments',
    sectionId: 'behavior',
    prompt: 'How often do you pay only the minimum due on your credit card?',
    options: [
      { label: 'Never', score: 5 },
      { label: 'Rarely', score: 4 },
      { label: 'Sometimes', score: 3 },
      { label: 'Frequently', score: 2 },
      { label: 'Almost every month', score: 1 },
    ],
  },
  {
    id: 'borrowing_motivation',
    sectionId: 'planning',
    prompt: 'What usually motivates borrowing decisions for you?',
    options: [
      { label: 'Planned essential goals', score: 5 },
      { label: 'Long-term investments', score: 4 },
      { label: 'Lifestyle upgrades', score: 3 },
      { label: 'Impulsive purchases', score: 2 },
      { label: 'Managing existing debt', score: 1 },
    ],
  },
  {
    id: 'income_stability',
    sectionId: 'stability',
    prompt: 'How stable is your primary income source?',
    options: [
      { label: 'Extremely stable', score: 5 },
      { label: 'Mostly stable', score: 4 },
      { label: 'Moderately stable', score: 3 },
      { label: 'Unpredictable', score: 2 },
      { label: 'Highly uncertain', score: 1 },
    ],
  },
  {
    id: 'repayment_manageability',
    sectionId: 'stability',
    prompt: 'If your income reduced temporarily, how manageable would current repayments feel?',
    options: [
      { label: 'Easily manageable', score: 5 },
      { label: 'Mostly manageable', score: 4 },
      { label: 'Difficult but manageable', score: 3 },
      { label: 'Highly stressful', score: 2 },
      { label: 'Likely unmanageable', score: 1 },
    ],
  },
  {
    id: 'monitoring_frequency',
    sectionId: 'planning',
    prompt: 'How often do you check or monitor your financial obligations?',
    options: [
      { label: 'Regularly and proactively', score: 5 },
      { label: 'Occasionally', score: 4 },
      { label: 'Only when payments are due', score: 3 },
      { label: 'Rarely', score: 2 },
      { label: 'Almost never', score: 1 },
    ],
  },
  {
    id: 'dependency_on_credit',
    sectionId: 'utilization',
    prompt: 'How dependent are you on credit cards or loans for monthly expenses?',
    options: [
      { label: 'Never dependent', score: 5 },
      { label: 'Rarely dependent', score: 4 },
      { label: 'Sometimes dependent', score: 3 },
      { label: 'Frequently dependent', score: 2 },
      { label: 'Extremely dependent', score: 1 },
    ],
  },
  {
    id: 'debt_emotional_stress',
    sectionId: 'emotional',
    prompt: 'How emotionally stressful does debt currently feel for you?',
    options: [
      { label: 'Not stressful', score: 5 },
      { label: 'Slightly stressful', score: 4 },
      { label: 'Moderately stressful', score: 3 },
      { label: 'Very stressful', score: 2 },
      { label: 'Constantly overwhelming', score: 1 },
    ],
  },
  {
    id: 'comfort_adding_emi',
    sectionId: 'behavior',
    prompt: 'If approved for a new loan today, how comfortable would you feel adding another EMI?',
    options: [
      { label: 'Completely comfortable', score: 5 },
      { label: 'Mostly comfortable', score: 4 },
      { label: 'Slightly cautious', score: 3 },
      { label: 'Very uncomfortable', score: 2 },
      { label: 'Financially unsafe', score: 1 },
    ],
  },
  {
    id: 'planning_habits',
    sectionId: 'planning',
    prompt: 'How would you describe your current financial planning habits?',
    options: [
      { label: 'Highly structured and disciplined', score: 5 },
      { label: 'Mostly organized', score: 4 },
      { label: 'Moderately organized', score: 3 },
      { label: 'Inconsistent', score: 2 },
      { label: 'Poorly managed', score: 1 },
    ],
  },
  {
    id: 'relationship_with_credit',
    sectionId: 'emotional',
    prompt: 'What best describes your relationship with credit?',
    options: [
      { label: 'Used strategically and responsibly', score: 5 },
      { label: 'Helpful when needed', score: 4 },
      { label: 'Occasionally difficult to manage', score: 3 },
      { label: 'Often stressful', score: 2 },
      { label: 'Financially overwhelming', score: 1 },
    ],
  },
];

export const creditReadinessQuestionsBySection = creditReadinessSectionMeta.reduce((acc: Record<string, CreditReadinessQuestion[]>, section) => {
  acc[section.sectionId] = creditReadinessQuestions.filter((q) => q.sectionId === section.sectionId);
  return acc;
}, {} as Record<string, CreditReadinessQuestion[]>);
