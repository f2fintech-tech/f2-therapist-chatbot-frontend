import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialLiteracyTestViewProps {
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
}

type QuestionItem = {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctAnswer: "A" | "B" | "C" | "D";
};

const questions: QuestionItem[] = [
  {
    id: 1,
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

export default function FinancialLiteracyTestView({ onToggleSidebar, onToggleInsights }: FinancialLiteracyTestViewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});

  const scoreSummary = useMemo(() => {
    const answered = Object.keys(selectedAnswers).length;
    const correct = questions.reduce((total, question) => {
      return selectedAnswers[question.id] === question.correctAnswer ? total + 1 : total;
    }, 0);

    return {
      answered,
      correct,
      total: questions.length,
      score: Math.round((correct / questions.length) * 100),
    };
  }, [selectedAnswers]);

  const handleSelectAnswer = (questionId: number, answer: "A" | "B" | "C" | "D") => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  };

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

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
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
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">25 MCQs</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">Scenario-based</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">Moderate to hard</span>
            </div>
          </div>
        </section>

        <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Questions</div>
            <div className="mt-[4px] text-[24px] font-serif text-gray-900">25</div>
          </div>
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Answered</div>
            <div className="mt-[4px] text-[24px] font-serif text-gray-900">{scoreSummary.answered}</div>
          </div>
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Score</div>
            <div className="mt-[4px] text-[24px] font-serif text-gray-900">{scoreSummary.score}%</div>
          </div>
        </section>

        <section className="mt-[18px]">
          <Card className="overflow-hidden border-[#d4d8fa] shadow-[0_14px_34px_rgba(50,68,230,0.08)]">
            <CardContent className="flex flex-col gap-[12px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Instant scoring</div>
                <div className="mt-[4px] text-[16px] font-semibold text-gray-900">{scoreSummary.correct} / {scoreSummary.total} correct</div>
                <div className="mt-[2px] text-[12px] text-gray-500">Your score updates as soon as you select an answer.</div>
              </div>
              <div className="flex items-center gap-[10px] rounded-[16px] border border-gray-200 bg-gray-50 px-[14px] py-[10px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Accuracy</div>
                <div className="text-[22px] font-serif text-gray-900">{scoreSummary.score}%</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-[18px] space-y-[12px]">
          {questions.map((item) => (
            <Card key={item.id} className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Question {item.id}</div>
                    <CardTitle className="mt-[4px] text-[16px] leading-[1.5] text-gray-900 sm:text-[17px]">
                      {item.question}
                    </CardTitle>
                  </div>
                  <span className="rounded-[999px] border border-[#d4d8fa] bg-[#f6f7fe] px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.7px] text-primary">
                    MCQ
                  </span>
                </div>
                <CardDescription className="text-[12px] text-gray-500">
                  Pick one answer. The layout is ready for instant scoring later.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-[8px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {item.options.map((option, optionIndex) => {
                  const letter = String.fromCharCode(65 + optionIndex);
                  const selectedAnswer = selectedAnswers[item.id];
                  const isSelected = selectedAnswer === letter;
                  const isCorrect = item.correctAnswer === letter;
                  const isAnswered = Boolean(selectedAnswer);
                  const optionStateClass = isSelected
                    ? isCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                    : isAnswered && isCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 bg-white";

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleSelectAnswer(item.id, letter as "A" | "B" | "C" | "D")}
                      className={`flex items-start gap-[10px] rounded-[14px] border px-[12px] py-[10px] text-left transition-colors hover:border-[#d4d8fa] hover:bg-[#f6f7fe] ${optionStateClass}`}
                    >
                      <div className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${isSelected && isCorrect ? "bg-emerald-600 text-white" : isSelected && !isCorrect ? "bg-rose-600 text-white" : isAnswered && isCorrect ? "bg-emerald-600 text-white" : "bg-[#eef0fd] text-primary"}`}>
                        {letter}
                      </div>
                      <div className="flex-1 text-[13px] leading-[1.6] text-gray-700">{option}</div>
                    </button>
                  );
                })}
                {selectedAnswers[item.id] && (
                  <div className={`mt-[2px] rounded-[12px] border px-[12px] py-[10px] text-[12px] font-medium ${selectedAnswers[item.id] === item.correctAnswer ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                    {selectedAnswers[item.id] === item.correctAnswer
                      ? `Correct answer: ${item.correctAnswer}`
                      : `Selected ${selectedAnswers[item.id]}, correct answer is ${item.correctAnswer}`}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
