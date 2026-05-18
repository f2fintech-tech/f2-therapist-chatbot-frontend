import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FinancialLiteracyAssessment from "@/components/FinancialLiteracyAssessment";

interface FinancialLiteracyTestViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onBackToCatalog: () => void;
}

type AnswerLetter = "A" | "B" | "C" | "D";

type QuestionItem = {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctAnswer: AnswerLetter;
  level: 1 | 2 | 3;
};

type ShuffledOption = {
  letter: AnswerLetter;
  text: string;
  isCorrect: boolean;
};

type ShuffledQuestion = {
  id: number;
  question: string;
  options: ShuffledOption[];
};

type StoredAttempt = {
  attemptId: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  isFinished: boolean;
  questions: ShuffledQuestion[];
  selectedAnswers: Record<number, AnswerLetter>;
  level: number;
};

type LiteracyTestStorage = {
  version: 1;
  currentAttempt: StoredAttempt | null;
  history: StoredAttempt[];
  selectedLevel?: number;
};

const STORAGE_PREFIX = "finheal_financial_literacy_test";

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createShuffledQuestions(level = 1): ShuffledQuestion[] {
  const filtered = questions.filter((q) => q.level === level);
  const shuffledQuestions = shuffleArray(filtered);

  return shuffledQuestions.map((question) => {
    const shuffledOptions = shuffleArray(
      question.options.map((text, index) => ({
        text,
        isCorrect: String.fromCharCode(65 + index) === question.correctAnswer,
      })),
    );

    return {
      id: question.id,
      question: question.question,
      options: shuffledOptions.map((option, index) => ({
        letter: String.fromCharCode(65 + index) as AnswerLetter,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    };
  });
}

function createNewAttempt(level = 1): StoredAttempt {
  const now = new Date().toISOString();
  return {
    attemptId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    finishedAt: null,
    isFinished: false,
    questions: createShuffledQuestions(level),
    level,
    selectedAnswers: {},
  };
}

const TEST_DURATION_SECONDS = 10 * 60;

function getElapsedSeconds(startedAt: string | null) {
  if (!startedAt) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

function readStorage(userId: string): LiteracyTestStorage {
  if (typeof window === "undefined") {
    return { version: 1, currentAttempt: null, history: [] };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return { version: 1, currentAttempt: null, history: [], selectedLevel: 1 };
    }

    const parsed = JSON.parse(raw) as Partial<LiteracyTestStorage>;
    if (parsed.version !== 1) {
      return { version: 1, currentAttempt: null, history: [] };
    }

    return {
      version: 1,
      currentAttempt: parsed.currentAttempt ?? null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      selectedLevel: typeof parsed.selectedLevel === "number" ? parsed.selectedLevel : 1,
    };
  } catch {
    return { version: 1, currentAttempt: null, history: [], selectedLevel: 1 };
  }
}

function writeStorage(userId: string, value: LiteracyTestStorage) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(value));
  } catch {
    // Ignore storage quota/security errors.
  }
}

function getAttemptSummary(attempt: StoredAttempt) {
  const total = attempt.questions.length;
  const answered = Object.keys(attempt.selectedAnswers).length;
  const correct = attempt.questions.reduce((count, question) => {
    const selected = attempt.selectedAnswers[question.id];
    const selectedOption = question.options.find((option) => option.letter === selected);
    return count + (selectedOption?.isCorrect ? 1 : 0);
  }, 0);

  return {
    answered,
    correct,
    total,
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

const questions: QuestionItem[] = [
  {
    id: 1,
    level: 1,
    question: "Rohan earns ₹1.2 lakh monthly but saves less than ₹5,000 because his expenses rise every time his salary increases. Which financial issue BEST explains his situation?",
    options: [
      "Liquidity imbalance caused by underinvestment",
      "Lifestyle inflation reducing long-term wealth accumulation",
      "Asset concentration risk due to consumption-heavy allocation",
      "Inflation-adjusted purchasing power erosion",
    ],
    correctAnswer: "B",
  },
  {
    id: 2,
    level: 1,
    question: "A person keeps all savings in a low-interest account because they fear market volatility. Inflation consistently remains above the savings return rate. What is the MOST accurate interpretation?",
    options: [
      "The person is prioritizing nominal capital stability over real wealth preservation",
      "The person is maximizing risk-adjusted inflation efficiency",
      "The strategy ensures long-term purchasing power growth with low volatility",
      "Liquidity preservation automatically offsets inflationary erosion",
    ],
    correctAnswer: "A",
  },
  {
    id: 3,
    level: 1,
    question: "Priya pays only minimum dues on her credit card despite having sufficient income to pay more. Over time, what becomes the MOST financially damaging consequence?",
    options: [
      "Reduction in available credit utilization flexibility",
      "Compounding interest burden relative to principal reduction",
      "Temporary decline in short-term liquidity efficiency",
      "Increase in debt diversification exposure",
    ],
    correctAnswer: "B",
  },
  {
    id: 4,
    level: 1,
    question: "A salaried employee invests aggressively in equities but has no emergency fund and significant EMI obligations. Which risk is MOST immediate during an unexpected job loss?",
    options: [
      "Mark-to-market volatility exposure",
      "Liquidity vulnerability despite strong asset ownership",
      "Under-diversification across debt instruments",
      "Long-duration capital inefficiency",
    ],
    correctAnswer: "B",
  },
  {
    id: 5,
    level: 1,
    question: "Which scenario BEST reflects healthy financial leverage?",
    options: [
      "Borrowing to fund recurring lifestyle upgrades during salary growth",
      "Maintaining manageable debt obligations relative to stable repayment capacity",
      "Using credit extensively to maximize liquidity retention",
      "Financing depreciating assets to improve cash flow efficiency",
    ],
    correctAnswer: "B",
  },
  {
    id: 6,
    level: 1,
    question: "An investor exits all investments during a market crash to avoid further losses, but misses the eventual recovery. Which bias MOST likely influenced the decision?",
    options: [
      "Anchoring bias toward historical highs",
      "Loss aversion dominating long-term investment discipline",
      "Diversification inefficiency during volatility cycles",
      "Inflation expectation mismatch",
    ],
    correctAnswer: "B",
  },
  {
    id: 7,
    level: 1,
    question: "A person has high salary, expensive assets, minimal savings, and high monthly obligations. Which statement is MOST accurate?",
    options: [
      "Strong cash flow automatically offsets solvency concerns",
      "Visible wealth indicators may mask weak financial resilience",
      "Asset ownership significantly reduces liquidity risk exposure",
      "High-income profiles generally neutralize repayment vulnerability",
    ],
    correctAnswer: "B",
  },
  {
    id: 8,
    level: 1,
    question: "Which individual is MOST exposed to concentration risk?",
    options: [
      "Investor holding diversified mutual funds across sectors",
      "Investor allocating all investments into one high-growth stock or theme",
      "Investor maintaining balanced debt-equity allocation",
      "Investor periodically rebalancing portfolio weights",
    ],
    correctAnswer: "B",
  },
  {
    id: 9,
    level: 2,
    question: "A freelancer earns irregular but high income and spends aggressively during strong earning months without reserve planning. Which financial weakness is MOST evident?",
    options: [
      "Cyclical income volatility without liquidity buffering",
      "Inefficient long-term inflation hedging strategy",
      "Overexposure to consumption-linked appreciation risk",
      "Misalignment between nominal and real asset allocation",
    ],
    correctAnswer: "A",
  },
  {
    id: 10,
    level: 2,
    question: "Why is an emergency fund generally recommended before aggressive investing?",
    options: [
      "It improves portfolio diversification mathematically",
      "It reduces the probability of forced liquidation during financial stress",
      "It minimizes inflation-adjusted return compression",
      "It enhances short-term market participation opportunities",
    ],
    correctAnswer: "B",
  },
  {
    id: 11,
    level: 2,
    question: "A person takes a personal loan for discretionary purchases while already struggling with existing EMIs. Which risk is MOST likely increasing?",
    options: [
      "Behavioral overleveraging combined with repayment fragility",
      "Long-term liquidity surplus misallocation",
      "Excessive fixed-income concentration",
      "Tax-adjusted borrowing inefficiency",
    ],
    correctAnswer: "A",
  },
  {
    id: 12,
    level: 2,
    question: "Two investors behave differently during volatility. Investor A pauses SIPs during market declines. Investor B continues investing systematically. Who is MORE likely benefiting from long-term wealth accumulation dynamics?",
    options: [
      "Investor A due to downside risk minimization",
      "Investor B due to disciplined cost averaging behavior",
      "Investor A because liquidity retention outperforms volatility exposure",
      "Both equally because timing uncertainty neutralizes return differences",
    ],
    correctAnswer: "B",
  },
  {
    id: 13,
    level: 2,
    question: "Which scenario BEST demonstrates poor liquidity management?",
    options: [
      "Holding diversified long-term retirement investments",
      "Owning high-value assets but lacking accessible emergency cash",
      "Maintaining low debt alongside moderate savings",
      "Investing regularly while controlling expenses",
    ],
    correctAnswer: "B",
  },
  {
    id: 14,
    level: 2,
    question: "A person frequently spends to maintain social status despite financial stress. Which behavioral factor MOST likely drives this?",
    options: [
      "Utility-maximizing consumption rationality",
      "Social comparison and externally influenced spending behavior",
      "Inflation-protected discretionary allocation",
      "Risk-adjusted lifestyle optimization",
    ],
    correctAnswer: "B",
  },
  {
    id: 15,
    level: 2,
    question: "Why can consistently high credit utilization become problematic?",
    options: [
      "It may signal repayment dependence and weaken financial flexibility",
      "It automatically increases investment volatility exposure",
      "It reduces nominal debt obligations over time",
      "It strengthens liquidity-adjusted balance sheet efficiency",
    ],
    correctAnswer: "A",
  },
  {
    id: 16,
    level: 2,
    question: "Which individual demonstrates the STRONGEST financial resilience?",
    options: [
      "High earner with multiple luxury liabilities and limited liquidity",
      "Moderate earner with emergency savings, manageable debt, and disciplined investing",
      "Aggressive investor maximizing leverage during market rallies",
      "Consumer maintaining high spending confidence due to future salary expectations",
    ],
    correctAnswer: "B",
  },
  {
    id: 17,
    level: 2,
    question: "A person invests solely based on influencer recommendations without understanding the underlying asset. Which risk is MOST relevant?",
    options: [
      "Behavioral and informational decision-making risk",
      "Liquidity compression from fixed-income mismatch",
      "Inflation-induced purchasing inefficiency",
      "Asset duration imbalance",
    ],
    correctAnswer: "A",
  },
  {
    id: 18,
    level: 3,
    question: "Which statement BEST explains the danger of lifestyle inflation?",
    options: [
      "Increased discretionary spending can suppress future wealth accumulation despite income growth",
      "Inflation-adjusted liabilities decline with rising consumption",
      "Consumption-heavy lifestyles generally improve long-term liquidity",
      "Higher expenses naturally improve financial adaptability",
    ],
    correctAnswer: "A",
  },
  {
    id: 19,
    level: 3,
    question: "An individual consistently delays reviewing bills, statements, and loan balances because finances create anxiety. This MOST likely reflects:",
    options: [
      "Risk-adjusted spending optimization",
      "Financial avoidance behavior reducing financial awareness",
      "Strategic debt postponement discipline",
      "Long-term liability restructuring behavior",
    ],
    correctAnswer: "B",
  },
  {
    id: 20,
    level: 3,
    question: "Why is diversification considered important in investing?",
    options: [
      "It guarantees stable positive returns across market cycles",
      "It helps reduce dependence on a single asset or sector outcome",
      "It eliminates market-related volatility entirely",
      "It maximizes returns regardless of risk profile",
    ],
    correctAnswer: "B",
  },
  {
    id: 21,
    level: 3,
    question: "A person earns well but depends entirely on future salary growth to manage current obligations. Which risk is MOST underestimated?",
    options: [
      "Inflationary capital appreciation mismatch",
      "Income continuity and repayment sustainability risk",
      "Debt allocation diversification inefficiency",
      "Liquidity optimization failure from low asset turnover",
    ],
    correctAnswer: "B",
  },
  {
    id: 22,
    level: 3,
    question: "Which behavior MOST strongly supports long-term financial stability?",
    options: [
      "Increasing spending proportionately with every salary increase",
      "Maintaining savings and investment discipline across income cycles",
      "Frequently reallocating investments based on market sentiment",
      "Using leverage to maximize short-term consumption flexibility",
    ],
    correctAnswer: "B",
  },
  {
    id: 23,
    level: 3,
    question: "A person chooses to invest all available cash while ignoring insurance coverage entirely. Which financial principle is being neglected MOST?",
    options: [
      "Return maximization hierarchy",
      "Risk protection and downside management",
      "Inflation-adjusted portfolio balancing",
      "Consumption-linked asset diversification",
    ],
    correctAnswer: "B",
  },
  {
    id: 24,
    level: 3,
    question: "Which situation BEST reflects opportunity cost in personal finance?",
    options: [
      "Choosing between liquidity and leverage optimization",
      "Spending a large bonus immediately instead of investing for long-term growth",
      "Maintaining diversified allocations across asset classes",
      "Reducing debt obligations during inflationary periods",
    ],
    correctAnswer: "B",
  },
  {
    id: 25,
    level: 3,
    question: "Which statement BEST reflects true financial literacy?",
    options: [
      "Understanding financial terminology and market jargon thoroughly",
      "Making informed financial decisions balancing risk, liquidity, goals, and long-term consequences",
      "Maximizing investment returns regardless of volatility exposure",
      "Avoiding all debt and financial risk under most circumstances",
    ],
    correctAnswer: "B",
  },
];

export default function FinancialLiteracyTestView({ userId, onToggleSidebar, onToggleInsights, onBackToCatalog }: FinancialLiteracyTestViewProps) {
  return (
    <FinancialLiteracyAssessment
      userId={userId}
      onToggleSidebar={onToggleSidebar}
      onToggleInsights={onToggleInsights}
      onBackToCatalog={onBackToCatalog}
    />
  );

  const [storageState, setStorageState] = useState<LiteracyTestStorage>(() => {
    const stored = readStorage(userId);
    if (stored.currentAttempt) {
      return stored;
    }
    const level = stored.selectedLevel ?? 1;
    const currentAttempt = createNewAttempt(level);
    const nextState: LiteracyTestStorage = {
      version: 1,
      currentAttempt,
      history: stored.history,
      selectedLevel: level,
    };
    writeStorage(userId, nextState);
    return nextState;
  });
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const stored = readStorage(userId);
    if (stored.currentAttempt) {
      setStorageState(stored);
      return;
    }
    const level = stored.selectedLevel ?? 1;
    const currentAttempt = createNewAttempt(level);
    const nextState: LiteracyTestStorage = {
      version: 1,
      currentAttempt,
      history: stored.history,
      selectedLevel: level,
    };
    setStorageState(nextState);
    writeStorage(userId, nextState);
  }, [userId]);

  useEffect(() => {
    writeStorage(userId, storageState);
  }, [storageState, userId]);

  const currentAttempt = storageState.currentAttempt ?? createNewAttempt(storageState.selectedLevel ?? 1);
  const isTestStarted = Boolean(currentAttempt.startedAt);
  const elapsedSeconds = useMemo(() => {
    if (!currentAttempt.startedAt) {
      return 0;
    }

    return Math.max(0, Math.floor((nowTs - new Date(currentAttempt.startedAt).getTime()) / 1000));
  }, [currentAttempt.startedAt, nowTs]);
  const remainingSeconds = Math.max(0, TEST_DURATION_SECONDS - elapsedSeconds);
  const hasTimeExpired = isTestStarted && remainingSeconds <= 0 && !currentAttempt.isFinished;

  useEffect(() => {
    if (!isTestStarted || currentAttempt.isFinished) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentAttempt.finishedAt, currentAttempt.isFinished, currentAttempt.startedAt, isTestStarted]);

  useEffect(() => {
    if (!isTestStarted || currentAttempt.isFinished) {
      return;
    }

    if (remainingSeconds <= 0) {
      handleFinishTest();
    }
  }, [currentAttempt.isFinished, isTestStarted, remainingSeconds]);

  const handleSelectLevel = (level: number) => {
    setStorageState((current) => {
      const next: LiteracyTestStorage = {
        ...current,
        selectedLevel: level,
      };

      // If a test is not started and not finished, regenerate questions for the new level.
      if (!current.currentAttempt || current.currentAttempt.isFinished || current.currentAttempt.startedAt) {
        return next;
      }

      next.currentAttempt = createNewAttempt(level);
      return next;
    });
  };

  const currentSummary = useMemo(() => getAttemptSummary(currentAttempt), [currentAttempt]);
  const latestHistoryAttempt = storageState.history[0] ?? null;
  const latestHistorySummary = latestHistoryAttempt ? getAttemptSummary(latestHistoryAttempt) : null;

  const availableCount = useMemo(() => {
    const level = storageState.selectedLevel ?? 1;
    return questions.filter((q) => q.level === level).length;
  }, [storageState.selectedLevel]);

  const handleStartTest = () => {
    setStorageState((current) => {
      if (!current.currentAttempt || current.currentAttempt.isFinished || current.currentAttempt.startedAt) {
        return current;
      }

      const now = new Date().toISOString();
      return {
        ...current,
        currentAttempt: {
          ...current.currentAttempt,
          startedAt: now,
          updatedAt: now,
        },
      };
    });
  };

  const handleSelectAnswer = (questionId: number, answer: AnswerLetter) => {
    setStorageState((current) => {
      if (!current.currentAttempt || current.currentAttempt.isFinished || !current.currentAttempt.startedAt) {
        return current;
      }

      return {
        ...current,
        currentAttempt: {
          ...current.currentAttempt,
          updatedAt: new Date().toISOString(),
          selectedAnswers: {
            ...current.currentAttempt.selectedAnswers,
            [questionId]: answer,
          },
        },
      };
    });
  };

  const handleFinishTest = () => {
    setStorageState((current) => {
      if (!current.currentAttempt || current.currentAttempt.isFinished) {
        return current;
      }

      const finishedAttempt: StoredAttempt = {
        ...current.currentAttempt,
        isFinished: true,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        version: 1,
        currentAttempt: finishedAttempt,
        history: [finishedAttempt, ...current.history.filter((attempt) => attempt.attemptId !== finishedAttempt.attemptId)].slice(0, 10),
      };
    });
  };

  const handleStartNewAttempt = () => {
    const nextAttempt = createNewAttempt(storageState.selectedLevel ?? 1);
    setStorageState((current) => ({
      version: 1,
      currentAttempt: nextAttempt,
      history: current.history,
      selectedLevel: current.selectedLevel ?? 1,
    }));
  };

  if (currentAttempt.isFinished) {
    return (
      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
        <div className="flex items-center gap-3 border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Financial Literacy Test Results</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px]">Your finished attempt is saved locally for this user on this device.</div>
          </div>

          <button
            type="button"
            onClick={onToggleInsights}
            className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0"
            aria-label="Toggle insights panel"
          >
            ☰
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px]">
            <div className="absolute right-[-28px] top-[-28px] h-[120px] w-[120px] rounded-full bg-primary opacity-10" />
            <div className="relative z-10 max-w-[780px]">
              <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)]">
                Test complete
              </div>
              <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px]">
                Your financial literacy score is ready.
              </h1>
              <p className="mt-[10px] max-w-[720px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px]">
                This result page is separate from the test screen, so you can review your performance before starting another attempt.
              </p>
            </div>
          </section>

          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Correct</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900">{currentSummary.correct}</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Accuracy</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900">{currentSummary.score}%</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Answered</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900">{currentSummary.answered}/{currentSummary.total}</div>
            </div>
          </section>

          <section className="mt-[18px]">
            <Card className="overflow-hidden border-[#d4d8fa] shadow-[0_14px_34px_rgba(50,68,230,0.08)]">
              <CardContent className="flex flex-col gap-[12px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Final score</div>
                  <div className="mt-[4px] text-[16px] font-semibold text-gray-900">
                    {currentSummary.correct} correct out of {currentSummary.total}
                  </div>
                  <div className="mt-[2px] text-[12px] text-gray-500">
                    Finishes are saved per user in localStorage on this device.
                  </div>
                </div>
                <div className="flex items-center gap-[10px] rounded-[16px] border border-gray-200 bg-gray-50 px-[14px] py-[10px]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Overall accuracy</div>
                  <div className="text-[22px] font-serif text-gray-900">{currentSummary.score}%</div>
                </div>
              </CardContent>
            </Card>
          </section>

          {latestHistorySummary && latestHistoryAttempt && (
            <section className="mt-[18px]">
              <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                  <CardTitle className="text-[16px] text-gray-900">Saved attempt</CardTitle>
                  <CardDescription className="text-[12px] text-gray-600">
                    Your latest attempt is stored on this device for this user and will reappear next time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-[10px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                  <span className="rounded-[999px] bg-[#eef0fd] px-[10px] py-[5px] text-[11px] font-semibold text-primary">
                    {latestHistorySummary.correct} / {latestHistorySummary.total} correct
                  </span>
                  <span className="rounded-[999px] bg-gray-100 px-[10px] py-[5px] text-[11px] font-medium text-gray-600">
                    Accuracy {latestHistorySummary.score}%
                  </span>
                  <span className="rounded-[999px] bg-gray-100 px-[10px] py-[5px] text-[11px] font-medium text-gray-600">
                    Finished {new Date(latestHistoryAttempt.finishedAt || latestHistoryAttempt.updatedAt).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            </section>
          )}

          <section className="mt-[18px] pb-[12px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                <div className="text-[12px] text-gray-600">
                  Start a fresh shuffled attempt, or go back to the test catalog.
                </div>
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={handleStartNewAttempt}
                    className="h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]"
                  >
                    Start new attempt
                  </button>
                  <button
                    type="button"
                    onClick={onBackToCatalog}
                    className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
                  >
                    Back to tests
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      <div className="flex items-center gap-3 border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Financial Literacy Test</div>
          <div className="text-[10px] text-gray-400 sm:text-[11px]">25 scenario-based MCQs covering debt, liquidity, resilience, leverage, and behavior.</div>
        </div>

        <button
          type="button"
          onClick={onToggleInsights}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0"
          aria-label="Toggle insights panel"
        >
          ☰
        </button>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        <div className="min-h-0 flex-1 overflow-y-auto pb-[12px] pr-[2px]">
          <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px]">
          <div className="absolute right-[-28px] top-[-28px] h-[120px] w-[120px] rounded-full bg-primary opacity-10" />
          <div className="relative z-10 max-w-[780px]">
            <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)]">
              Moderate to hard
            </div>
            <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px]">
              Financial Literacy Test
            </h1>
            <p className="mt-[10px] max-w-[720px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px]">
              Scenario-based questions designed to separate surface familiarity from real financial judgment. Pick the best answer even when the options look close.
            </p>
            <div className="mt-[14px] flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600">
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">{availableCount} MCQs</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">Scenario-based</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">Saved locally</span>
            </div>
            <div className="mt-[12px] flex items-center gap-[8px]">
              <div className="text-[12px] text-gray-600">Level</div>
              <div className="flex items-center gap-[8px]">
                <button type="button" onClick={() => handleSelectLevel(1)} className={`h-[32px] px-[10px] rounded-[999px] text-[12px] font-semibold ${storageState.selectedLevel === 1 ? "bg-primary text-white" : "bg-white border"}`}>
                  1
                </button>
                <button type="button" onClick={() => handleSelectLevel(2)} className={`h-[32px] px-[10px] rounded-[999px] text-[12px] font-semibold ${storageState.selectedLevel === 2 ? "bg-primary text-white" : "bg-white border"}`}>
                  2
                </button>
                <button type="button" onClick={() => handleSelectLevel(3)} className={`h-[32px] px-[10px] rounded-[999px] text-[12px] font-semibold ${storageState.selectedLevel === 3 ? "bg-primary text-white" : "bg-white border"}`}>
                  3
                </button>
              </div>
            </div>
            {!isTestStarted && (
              <div className="mt-[16px] flex flex-col gap-[10px] rounded-[18px] border border-[#d4d8fa] bg-white/80 p-[14px] shadow-[0_8px_20px_rgba(50,68,230,0.06)] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Not started yet</div>
                  <div className="mt-[4px] text-[13px] text-gray-600">
                    Click Start Test to begin a 10 minute timed attempt. The test will auto submit when time ends.
                  </div>
                </div>
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={handleStartTest}
                    className="h-[40px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]"
                  >
                    Start Test
                  </button>
                  <button
                    type="button"
                    onClick={onBackToCatalog}
                    className="h-[40px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
                  >
                    End Test
                  </button>
                </div>
              </div>
            )}
          </div>
          </section>

          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Answered</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900">{currentSummary.answered}</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Status</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900">{currentAttempt.isFinished ? "Finished" : "In progress"}</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Attempts saved</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900">{storageState.history.length}</div>
            </div>
          </section>

          <section className="mt-[18px]">
            <Card className="overflow-hidden border-[#d4d8fa] shadow-[0_14px_34px_rgba(50,68,230,0.08)]">
              <CardContent className="px-[16px] py-[16px] sm:px-[18px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Local persistence</div>
                <div className="mt-[10px] text-[12px] text-gray-500">
                  {currentAttempt.isFinished
                    ? "Marks are shown only after finishing the test."
                    : !isTestStarted
                      ? "The test is paused until you click Start Test."
                      : "Selections are saved locally and scored when you click End Test or time runs out."}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="sticky top-[12px] z-30 mt-[14px]">
            <div className="flex items-center justify-between gap-[10px] rounded-[16px] border border-gray-200 bg-white/95 px-[14px] py-[12px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Answered</div>
                <div className="mt-[4px] text-[16px] font-semibold text-gray-900">
                  {currentAttempt.isFinished
                    ? `${currentSummary.correct} / ${currentSummary.total} correct`
                    : !isTestStarted
                      ? "Not started"
                      : `${currentSummary.answered} / ${currentSummary.total} answered`}
                </div>
              </div>
              <div className="flex items-center gap-[10px] rounded-[16px] border border-gray-200 bg-gray-50 px-[14px] py-[10px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">
                  {currentAttempt.isFinished ? "Accuracy" : isTestStarted ? "Time left" : "Saved"}
                </div>
                <div className="text-[22px] font-serif text-gray-900">
                  {currentAttempt.isFinished
                    ? `${currentSummary.score}%`
                    : isTestStarted
                      ? `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`
                      : "Yes"}
                </div>
              </div>
            </div>
          </section>

          {isTestStarted && (
            <>
              <section className="mt-[18px] space-y-[12px]">
                {currentAttempt.questions.map((item, questionIndex) => (
                  <Card key={item.id} className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                    <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Question {questionIndex + 1}</div>
                          <CardTitle className="mt-[4px] text-[16px] leading-[1.5] text-gray-900 sm:text-[17px]">
                            {item.question}
                          </CardTitle>
                        </div>
                        <span className="rounded-[999px] border border-[#d4d8fa] bg-[#f6f7fe] px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.7px] text-primary">
                          MCQ
                        </span>
                      </div>
                      <CardDescription className="text-[12px] text-gray-500">
                        Pick one answer. Your selection is saved locally and scored only on finish.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-[8px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                      {item.options.map((option) => {
                        const letter = option.letter;
                        const selectedAnswer = currentAttempt.selectedAnswers[item.id];
                        const isSelected = selectedAnswer === letter;
                        const isAnswered = Boolean(selectedAnswer);
                        const showResultStyling = currentAttempt.isFinished;
                        const optionStateClass = showResultStyling
                          ? isSelected
                            ? option.isCorrect
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-rose-200 bg-rose-50"
                            : isAnswered && option.isCorrect
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-gray-200 bg-white"
                          : isSelected
                            ? "border-primary bg-[#eef0fd] shadow-[0_10px_30px_rgba(50,68,230,0.12)]"
                            : "border-gray-200 bg-white hover:border-[#d4d8fa] hover:bg-[#f8f9ff]";

                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => handleSelectAnswer(item.id, letter)}
                            disabled={currentAttempt.isFinished}
                            className={`group flex w-full items-center justify-between rounded-[14px] border px-[12px] py-[10px] text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${optionStateClass}`}
                          >
                            <div className="flex items-start gap-[10px] flex-1">
                              <div className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${showResultStyling && isSelected && option.isCorrect ? "bg-emerald-600 text-white" : showResultStyling && isSelected && !option.isCorrect ? "bg-rose-600 text-white" : showResultStyling && isAnswered && option.isCorrect ? "bg-emerald-600 text-white" : isSelected ? "bg-[#eef0fd] text-primary" : "bg-[#eef0fd] text-primary"}`}>
                                {letter}
                              </div>
                              <div className={`flex-1 text-[13px] leading-[1.6] ${showResultStyling ? "text-gray-700" : isSelected ? "text-primary" : "text-gray-700"}`}>{option.text}</div>
                            </div>
                            <span
                              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all ml-3 ${
                                showResultStyling && isSelected && option.isCorrect
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : showResultStyling && isSelected && !option.isCorrect
                                    ? "border-rose-600 bg-rose-600 text-white"
                                    : showResultStyling && isAnswered && option.isCorrect
                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                      : isSelected
                                        ? "border-primary bg-primary text-white"
                                        : "border-gray-300 bg-white text-transparent group-hover:text-primary"
                              }`}
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </section>

              <section className="mt-[18px] pb-[12px]">
                <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                    <div className="text-[12px] text-gray-600">
                      When you're done, click End Test to calculate the score and open the results page.
                    </div>
                    <div className="flex gap-[8px]">
                      <button
                        type="button"
                        onClick={handleFinishTest}
                        className="h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]"
                      >
                        End Test
                      </button>
                    </div>
                  </CardContent>
                </Card>
                {hasTimeExpired && (
                  <div className="mt-[10px] rounded-[14px] border border-amber-200 bg-amber-50 px-[14px] py-[10px] text-[12px] text-amber-900">
                    Time is up. Your test has been submitted automatically.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
