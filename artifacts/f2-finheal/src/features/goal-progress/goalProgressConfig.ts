export type GoalProgressSectionId =
  | "goal-commitment"
  | "emotional-spending"
  | "saving-discipline"
  | "financial-consistency"
  | "long-term-thinking"
  | "lifestyle-behavior"
  | "financial-stress-psychology";

export type GoalProgressDimensionId =
  | "spendingIntentionality"
  | "emotionalControl"
  | "savingConsistency"
  | "discipline"
  | "patience"
  | "longTermThinking"
  | "impulseControl"
  | "lifestyleControl"
  | "goalCommitment"
  | "moneyRelationship";

export type GoalProgressOption = {
  label: string;
  weights: Partial<Record<GoalProgressDimensionId, 1 | 2 | 3 | 4 | 5>>;
};

export type GoalProgressQuestion = {
  id: string;
  sectionId: GoalProgressSectionId;
  prompt: string;
  options: GoalProgressOption[];
};

export type GoalProgressAnswerMap = Partial<Record<string, string>>;

export type GoalProgressSectionMeta = {
  id: GoalProgressSectionId;
  title: string;
  subtitle: string;
};

export type FinancialArchetype =
  | "Future Builder"
  | "Emotional Spender"
  | "Stability Planner"
  | "Momentum Seeker"
  | "Lifestyle Drifter"
  | "Discipline Challenger";

export const goalProgressStorageVersion = 1;
export const goalProgressDurationMinutes = 4;

export const goalProgressSectionMeta: GoalProgressSectionMeta[] = [
  {
    id: "goal-commitment",
    title: "Goal Commitment",
    subtitle: "How deeply your daily choices reflect your future targets.",
  },
  {
    id: "emotional-spending",
    title: "Emotional Spending",
    subtitle: "How emotions influence your money decisions.",
  },
  {
    id: "saving-discipline",
    title: "Saving Discipline",
    subtitle: "How repeatable your saving behavior is.",
  },
  {
    id: "financial-consistency",
    title: "Financial Consistency",
    subtitle: "How steady your habits stay month to month.",
  },
  {
    id: "long-term-thinking",
    title: "Long-Term Thinking",
    subtitle: "How strongly you prioritize delayed rewards and long horizons.",
  },
  {
    id: "lifestyle-behavior",
    title: "Lifestyle Behavior",
    subtitle: "How well your lifestyle stays aligned as income grows.",
  },
  {
    id: "financial-stress-psychology",
    title: "Financial Stress Psychology",
    subtitle: "How you respond when money pressure rises.",
  },
];

const opt = (
  label: string,
  weights: Partial<Record<GoalProgressDimensionId, 1 | 2 | 3 | 4 | 5>>,
): GoalProgressOption => ({ label, weights });

export const goalProgressQuestions: GoalProgressQuestion[] = [
  {
    id: "goal-tradeoff",
    sectionId: "goal-commitment",
    prompt: "When an unplanned purchase competes with a goal contribution, what usually happens?",
    options: [
      opt("I almost always protect my goal contribution first.", { goalCommitment: 5, discipline: 5, impulseControl: 4 }),
      opt("I usually protect it, but bend occasionally.", { goalCommitment: 4, discipline: 4, impulseControl: 4 }),
      opt("It depends on the month and my mood.", { goalCommitment: 3, discipline: 3, impulseControl: 3 }),
      opt("I often postpone the contribution.", { goalCommitment: 2, discipline: 2, impulseControl: 2 }),
      opt("The purchase usually wins.", { goalCommitment: 1, discipline: 1, impulseControl: 1 }),
    ],
  },
  {
    id: "goal-identity",
    sectionId: "goal-commitment",
    prompt: "Which statement feels most true about your goals today?",
    options: [
      opt("My goals influence weekly decisions in a visible way.", { goalCommitment: 5, longTermThinking: 5, spendingIntentionality: 4 }),
      opt("I think about them often and act on them most weeks.", { goalCommitment: 4, longTermThinking: 4, spendingIntentionality: 4 }),
      opt("I care about them, but they fade during busy periods.", { goalCommitment: 3, longTermThinking: 3, spendingIntentionality: 3 }),
      opt("I revisit goals only when something goes wrong.", { goalCommitment: 2, longTermThinking: 2, spendingIntentionality: 2 }),
      opt("My goals are mostly aspirational, not operational.", { goalCommitment: 1, longTermThinking: 1, spendingIntentionality: 1 }),
    ],
  },
  {
    id: "emotional-trigger",
    sectionId: "emotional-spending",
    prompt: "After a stressful day, how likely are you to spend to feel better?",
    options: [
      opt("Very unlikely. I use non-spending coping rituals.", { emotionalControl: 5, moneyRelationship: 5, impulseControl: 4 }),
      opt("Sometimes, but I pause before acting.", { emotionalControl: 4, moneyRelationship: 4, impulseControl: 4 }),
      opt("It happens occasionally when stress spikes.", { emotionalControl: 3, moneyRelationship: 3, impulseControl: 3 }),
      opt("It happens often and I justify it quickly.", { emotionalControl: 2, moneyRelationship: 2, impulseControl: 2 }),
      opt("It is one of my main stress responses.", { emotionalControl: 1, moneyRelationship: 1, impulseControl: 1 }),
    ],
  },
  {
    id: "social-pressure",
    sectionId: "emotional-spending",
    prompt: "When friends or social media set a high spending tone, how do you respond?",
    options: [
      opt("I stay grounded in my own plan.", { emotionalControl: 5, lifestyleControl: 5, spendingIntentionality: 4 }),
      opt("I sometimes feel pressure but usually hold boundaries.", { emotionalControl: 4, lifestyleControl: 4, spendingIntentionality: 4 }),
      opt("I match occasionally, then compensate later.", { emotionalControl: 3, lifestyleControl: 3, spendingIntentionality: 3 }),
      opt("I frequently overspend to keep up.", { emotionalControl: 2, lifestyleControl: 2, spendingIntentionality: 2 }),
      opt("I often spend for approval and regret it.", { emotionalControl: 1, lifestyleControl: 1, spendingIntentionality: 1 }),
    ],
  },
  {
    id: "saving-automation",
    sectionId: "saving-discipline",
    prompt: "How consistent is your saving process for goals?",
    options: [
      opt("Automated and rarely skipped.", { savingConsistency: 5, discipline: 5, goalCommitment: 5 }),
      opt("Manual, but very regular.", { savingConsistency: 4, discipline: 4, goalCommitment: 4 }),
      opt("Regular in good months, weaker in tough months.", { savingConsistency: 3, discipline: 3, goalCommitment: 3 }),
      opt("Irregular and reactive.", { savingConsistency: 2, discipline: 2, goalCommitment: 2 }),
      opt("No dependable saving rhythm yet.", { savingConsistency: 1, discipline: 1, goalCommitment: 1 }),
    ],
  },
  {
    id: "delayed-gratification",
    sectionId: "saving-discipline",
    prompt: "How comfortable are you delaying a purchase to protect next month\'s contribution?",
    options: [
      opt("Very comfortable. Long-term gain matters more.", { patience: 5, discipline: 5, longTermThinking: 5 }),
      opt("Usually comfortable with occasional exceptions.", { patience: 4, discipline: 4, longTermThinking: 4 }),
      opt("Mixed. I delay some purchases but not all.", { patience: 3, discipline: 3, longTermThinking: 3 }),
      opt("Uncomfortable; I prefer immediate spending.", { patience: 2, discipline: 2, longTermThinking: 2 }),
      opt("I almost never delay discretionary spending.", { patience: 1, discipline: 1, longTermThinking: 1 }),
    ],
  },
  {
    id: "monthly-review",
    sectionId: "financial-consistency",
    prompt: "How often do you review spending against your planned goals?",
    options: [
      opt("Weekly or better with clear adjustments.", { spendingIntentionality: 5, savingConsistency: 5, discipline: 5 }),
      opt("Monthly with practical corrections.", { spendingIntentionality: 4, discipline: 4, savingConsistency: 4 }),
      opt("Some months yes, some months no.", { spendingIntentionality: 3, discipline: 3, savingConsistency: 3 }),
      opt("Rarely, unless money feels tight.", { spendingIntentionality: 2, discipline: 2, savingConsistency: 2 }),
      opt("I mostly avoid reviewing my numbers.", { spendingIntentionality: 1, discipline: 1, savingConsistency: 1 }),
    ],
  },
  {
    id: "consistency-recovery",
    sectionId: "financial-consistency",
    prompt: "If you miss a target month, what usually happens next?",
    options: [
      opt("I recover quickly with a clear catch-up step.", { savingConsistency: 5, discipline: 5, moneyRelationship: 4 }),
      opt("I recover within 1-2 months.", { savingConsistency: 4, discipline: 4, moneyRelationship: 4 }),
      opt("Recovery is inconsistent.", { savingConsistency: 3, discipline: 3, moneyRelationship: 3 }),
      opt("One missed month often becomes several.", { savingConsistency: 2, discipline: 2, moneyRelationship: 2 }),
      opt("I usually disengage from the plan for a while.", { savingConsistency: 1, discipline: 1, moneyRelationship: 1 }),
    ],
  },
  {
    id: "future-clarity",
    sectionId: "long-term-thinking",
    prompt: "How vividly can you imagine the life your current goals are meant to create?",
    options: [
      opt("Very vividly, and it guides daily choices.", { longTermThinking: 5, goalCommitment: 5, patience: 4 }),
      opt("Quite clearly, and it motivates me often.", { longTermThinking: 4, goalCommitment: 4, patience: 4 }),
      opt("Somewhat clearly, but motivation fluctuates.", { longTermThinking: 3, goalCommitment: 3, patience: 3 }),
      opt("Not very clearly yet.", { longTermThinking: 2, goalCommitment: 2, patience: 2 }),
      opt("I rarely connect current behavior to future outcomes.", { longTermThinking: 1, goalCommitment: 1, patience: 1 }),
    ],
  },
  {
    id: "time-horizon",
    sectionId: "long-term-thinking",
    prompt: "When deciding between immediate comfort and future security, your default is:",
    options: [
      opt("Future security, unless there is a true need now.", { patience: 5, longTermThinking: 5, impulseControl: 4 }),
      opt("Mostly future security.", { patience: 4, longTermThinking: 4, impulseControl: 4 }),
      opt("A balanced split depending on context.", { patience: 3, longTermThinking: 3, impulseControl: 3 }),
      opt("Usually immediate comfort.", { patience: 2, longTermThinking: 2, impulseControl: 2 }),
      opt("Strong preference for immediate rewards.", { patience: 1, longTermThinking: 1, impulseControl: 1 }),
    ],
  },
  {
    id: "income-lift",
    sectionId: "lifestyle-behavior",
    prompt: "When income rises, what happens first?",
    options: [
      opt("Goal contributions rise before lifestyle upgrades.", { lifestyleControl: 5, discipline: 5, goalCommitment: 4 }),
      opt("I split the increase between goals and lifestyle.", { lifestyleControl: 4, discipline: 4, goalCommitment: 4 }),
      opt("Lifestyle rises first, goals later if possible.", { lifestyleControl: 3, discipline: 3, goalCommitment: 3 }),
      opt("Most of the increase disappears into spending.", { lifestyleControl: 2, discipline: 2, goalCommitment: 2 }),
      opt("Income jumps usually trigger immediate lifestyle inflation.", { lifestyleControl: 1, discipline: 1, goalCommitment: 1 }),
    ],
  },
  {
    id: "subscription-drift",
    sectionId: "lifestyle-behavior",
    prompt: "How closely do you monitor recurring expenses that can silently grow?",
    options: [
      opt("I audit them proactively and trim quickly.", { lifestyleControl: 5, spendingIntentionality: 5, discipline: 4 }),
      opt("I review them periodically with action.", { lifestyleControl: 4, spendingIntentionality: 4, discipline: 4 }),
      opt("I notice them, but cleanup is inconsistent.", { lifestyleControl: 3, spendingIntentionality: 3, discipline: 3 }),
      opt("I rarely track them unless money is tight.", { lifestyleControl: 2, spendingIntentionality: 2, discipline: 2 }),
      opt("I usually discover them only after damage is done.", { lifestyleControl: 1, spendingIntentionality: 1, discipline: 1 }),
    ],
  },
  {
    id: "stress-response",
    sectionId: "financial-stress-psychology",
    prompt: "When financial stress rises, your most common response is:",
    options: [
      opt("Pause, assess facts, then adjust calmly.", { emotionalControl: 5, moneyRelationship: 5, discipline: 4 }),
      opt("Temporary anxiety, then structured action.", { emotionalControl: 4, moneyRelationship: 4, discipline: 4 }),
      opt("I alternate between action and avoidance.", { emotionalControl: 3, moneyRelationship: 3, discipline: 3 }),
      opt("Mostly avoidance or panic-driven decisions.", { emotionalControl: 2, moneyRelationship: 2, discipline: 2 }),
      opt("Stress drives impulsive choices and shutdown.", { emotionalControl: 1, moneyRelationship: 1, discipline: 1 }),
    ],
  },
  {
    id: "money-self-talk",
    sectionId: "financial-stress-psychology",
    prompt: "Which money self-talk pattern sounds most familiar?",
    options: [
      opt("I can improve this with systems, not shame.", { moneyRelationship: 5, discipline: 4, emotionalControl: 5 }),
      opt("I\'m learning and gradually improving.", { moneyRelationship: 4, discipline: 4, emotionalControl: 4 }),
      opt("I swing between confidence and guilt.", { moneyRelationship: 3, discipline: 3, emotionalControl: 3 }),
      opt("I often feel stuck and self-critical.", { moneyRelationship: 2, discipline: 2, emotionalControl: 2 }),
      opt("I feel overwhelmed and avoid money entirely.", { moneyRelationship: 1, discipline: 1, emotionalControl: 1 }),
    ],
  },
];

export const goalProgressDimensions: GoalProgressDimensionId[] = [
  "spendingIntentionality",
  "emotionalControl",
  "savingConsistency",
  "discipline",
  "patience",
  "longTermThinking",
  "impulseControl",
  "lifestyleControl",
  "goalCommitment",
  "moneyRelationship",
];

export const archetypeDescriptions: Record<FinancialArchetype, string> = {
  "Future Builder": "You consistently align daily money behavior with long-term goals and protect future outcomes.",
  "Emotional Spender": "Emotions and external cues heavily influence spending, which can disrupt your goal runway.",
  "Stability Planner": "You prioritize safety, structure, and thoughtful pacing, creating dependable financial momentum.",
  "Momentum Seeker": "You show strong motivation but may need tighter systems to sustain momentum during pressure.",
  "Lifestyle Drifter": "Lifestyle growth tends to outpace intentional planning, making goals harder to fund consistently.",
  "Discipline Challenger": "You care about your future, but consistency and impulse control currently limit your progress.",
};
