import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import QuestionNavigator from "@/components/QuestionNavigator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateDebtBalanceResult,
} from "@/features/debt-balance/debtBalanceScoring";
import {
  debtBalanceQuestions,
  debtBalanceSectionMeta,
  debtBalanceTotalQuestions,
  type DebtBalanceAnswerMap,
  type DebtBalanceQuestion,
  type DebtBalanceResult,
} from "@/features/debt-balance/debtBalanceConfig";

interface DebtBalanceReviewViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onBackToCatalog: () => void;
  onOpenFinancialWellnessAssistant?: () => void;
}

type DebtBalanceProgressState = {
  version: 1;
  answers: DebtBalanceAnswerMap;
  stepIndex: number;
  result: DebtBalanceResult | null;
  completed: boolean;
  updatedAt: string;
  startAt?: string;
};

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

const STORAGE_PREFIX = "finheal_debt_balance_review";
const TOTAL_STEPS = debtBalanceTotalQuestions + 1;
const TARGET_DURATION_MINUTES = 5;

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function createEmptyState(): DebtBalanceProgressState {
  return {
    version: 1,
    answers: {},
    stepIndex: 0,
    result: null,
    completed: false,
    updatedAt: new Date().toISOString(),
    startAt: new Date().toISOString(),
  };
}

function readState(userId: string): DebtBalanceProgressState {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return createEmptyState();
    }

    const parsed = JSON.parse(raw) as Partial<DebtBalanceProgressState>;
    if (parsed.version !== 1) {
      return createEmptyState();
    }

    return {
      version: 1,
      answers: parsed.answers ?? {},
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
      result: parsed.result ?? null,
      completed: Boolean(parsed.completed),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      startAt: parsed.startAt ?? new Date().toISOString(),
    };
  } catch {
    return createEmptyState();
  }
}

function writeState(userId: string, state: DebtBalanceProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
}

function clearState(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getStorageKey(userId));
  } catch {
    // Ignore storage failures.
  }
}

function getAnsweredCount(answers: DebtBalanceAnswerMap) {
  return debtBalanceQuestions.reduce((count, question) => count + (answers[question.id] ? 1 : 0), 0);
}

function getSectionAnsweredCount(answers: DebtBalanceAnswerMap, sectionId: string) {
  return debtBalanceQuestions.filter((question) => question.sectionId === sectionId && answers[question.id]).length;
}

function getQuestionProgress(stepIndex: number) {
  const safeIndex = Math.max(0, Math.min(stepIndex, debtBalanceTotalQuestions));
  return Math.round((safeIndex / debtBalanceTotalQuestions) * 100);
}

function getTimeRemainingText(stepIndex: number) {
  const remainingQuestions = Math.max(debtBalanceTotalQuestions - stepIndex, 0);
  const minutes = Math.max(1, Math.ceil((remainingQuestions / debtBalanceTotalQuestions) * TARGET_DURATION_MINUTES));
  return `${minutes} min${minutes === 1 ? "" : "s"} left`;
}

function OptionButton({ label, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-[16px] border px-[14px] py-[13px] text-left text-[14px] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
        selected
          ? "border-primary bg-[#eef0fd] text-primary shadow-[0_10px_30px_rgba(50,68,230,0.12)]"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#d4d8fa] hover:bg-[#f8f9ff]"
      }`}
      aria-pressed={selected}
    >
      <span className="pr-3 leading-[1.55]">{label}</span>
      <span
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
          selected ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-transparent group-hover:text-primary"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  );
}

type ScoreRingProps = {
  score: number;
  max?: number;
  size?: number;
};

function ScoreRing({ score, max = 100, size = 160 }: ScoreRingProps) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / max) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-primary transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[44px] font-serif font-bold text-gray-900">{score}</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.8px] text-gray-400">Score</div>
        </div>
      </div>
    </div>
  );
}

type BadgeProps = {
  label: string;
  tone: "positive" | "caution" | "warning" | "critical";
  size?: "sm" | "md";
};

function Badge({ label, tone, size = "md" }: BadgeProps) {
  const toneClass =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "caution"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "warning"
          ? "bg-orange-50 text-orange-700 border-orange-200"
          : "bg-rose-50 text-rose-700 border-rose-200";

  const sizeClass = size === "sm" ? "text-[10px] px-[8px] py-[4px]" : "text-[11px] px-[10px] py-[5px]";

  return (
    <span className={`inline-flex rounded-[999px] border font-semibold uppercase tracking-[0.7px] ${toneClass} ${sizeClass}`}>
      {label}
    </span>
  );
}

type MetricPillProps = {
  label: string;
  value: string | number;
  subtext?: string;
};

function MetricPill({ label, value, subtext }: MetricPillProps) {
  return (
    <div className="flex flex-col rounded-[12px] border border-gray-200 bg-gray-50 px-[12px] py-[10px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">{label}</div>
      <div className="mt-[4px] text-[18px] font-serif font-bold text-gray-900">{value}</div>
      {subtext && <div className="mt-[2px] text-[11px] text-gray-500">{subtext}</div>}
    </div>
  );
}

export default function DebtBalanceReviewView({
  userId,
  onToggleSidebar,
  onToggleInsights,
  onBackToCatalog,
  onOpenFinancialWellnessAssistant,
}: DebtBalanceReviewViewProps) {
  const [storageState, setStorageState] = useState<DebtBalanceProgressState>(() => {
    return readState(userId);
  });

  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    writeState(userId, storageState);
  }, [storageState, userId]);

  const currentQuestion: DebtBalanceQuestion | undefined =
    storageState.stepIndex < debtBalanceTotalQuestions ? debtBalanceQuestions[storageState.stepIndex] : undefined;

  const answeredCount = useMemo(() => getAnsweredCount(storageState.answers), [storageState.answers]);
  const progress = useMemo(() => getQuestionProgress(storageState.stepIndex), [storageState.stepIndex]);

  const handleSelectOption = (option: string) => {
    if (currentQuestion) {
      setStorageState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: option,
        },
        updatedAt: new Date().toISOString(),
      }));
      setValidationMessage("");
    }
  };

  const handleContinue = () => {
    if (!currentQuestion) return;

    if (!storageState.answers[currentQuestion.id]) {
      setValidationMessage("Please select an option to continue");
      return;
    }

    setStorageState((prev) => ({
      ...prev,
      stepIndex: prev.stepIndex + 1,
      updatedAt: new Date().toISOString(),
    }));
    setValidationMessage("");
  };

  const handleJumpToQuestion = (questionIndex: number) => {
    setValidationMessage("");
    setStorageState((prev) => ({
      ...prev,
      stepIndex: Math.max(0, Math.min(questionIndex, debtBalanceTotalQuestions - 1)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleBack = () => {
    if (storageState.stepIndex > 0) {
      setStorageState((prev) => ({
        ...prev,
        stepIndex: prev.stepIndex - 1,
        updatedAt: new Date().toISOString(),
      }));
    } else {
      onBackToCatalog();
    }
    setValidationMessage("");
  };

  const handleSubmit = () => {
    const allAnswered = debtBalanceQuestions.every((q) => storageState.answers[q.id]);
    if (!allAnswered) {
      setValidationMessage("Please answer all questions before submitting");
      return;
    }

    const result = calculateDebtBalanceResult(storageState.answers);
    setStorageState((prev) => ({
      ...prev,
      result,
      completed: true,
      stepIndex: TOTAL_STEPS,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRetake = () => {
    clearState(userId);
    setStorageState(createEmptyState());
    setValidationMessage("");
  };

  const handleStopTest = () => {
    // Stop the test early and compute scoring with current answers
    const result = calculateDebtBalanceResult(storageState.answers);
    setStorageState((prev) => ({
      ...prev,
      result,
      completed: true,
      stepIndex: TOTAL_STEPS,
      updatedAt: new Date().toISOString(),
    }));
  };

  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const stopConfirmDialog = (
    <ConfirmDeleteDialog
      isOpen={showStopConfirm}
      title="Stop Test"
      description="Stop the test and compute partial scoring for the answers you've provided so far?"
      onConfirm={() => {
        handleStopTest();
        setShowStopConfirm(false);
      }}
      onCancel={() => setShowStopConfirm(false)}
      isLoading={false}
    />
  );

  // Live countdown timer
  const [timeLeftText, setTimeLeftText] = useState<string>(() => {
    // initial text based on startAt if available
    const start = new Date(storageState.startAt ?? new Date().toISOString()).getTime();
    const end = start + TARGET_DURATION_MINUTES * 60 * 1000;
    const diff = Math.max(0, end - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${String(mins)}:${String(secs).padStart(2, "0")} left`;
  });

  const storageRef = useMemo(() => ({ get: () => storageState }), [storageState]);

  useEffect(() => {
    if (storageState.completed) {
      setTimeLeftText("0:00 left");
      return;
    }

    const tick = () => {
      const start = new Date(storageState.startAt ?? new Date().toISOString()).getTime();
      const end = start + TARGET_DURATION_MINUTES * 60 * 1000;
      const diff = Math.max(0, end - Date.now());
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeftText(`${String(mins)}:${String(secs).padStart(2, "0")} left`);

      if (diff <= 0 && !storageRef.get().completed) {
        // Time's up — stop the test and compute results
        const result = calculateDebtBalanceResult(storageRef.get().answers);
        setStorageState((prev) => ({ ...prev, result, completed: true, stepIndex: TOTAL_STEPS, updatedAt: new Date().toISOString() }));
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [storageState.startAt, storageState.completed]);

  // Review step
  if (storageState.stepIndex === debtBalanceTotalQuestions) {
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
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Review Your Answers</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px]">Check your responses before generating your debt health report.</div>
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
          <section className="mb-[18px]">
            <QuestionNavigator
              title="PROGRESS"
              totalQuestions={debtBalanceTotalQuestions}
              activeIndex={Math.min(storageState.stepIndex, debtBalanceTotalQuestions - 1)}
              answeredCount={answeredCount}
                timeLeftLabel={timeLeftText}
                showTime={false}
                showSummary={false}
              onSelectQuestion={handleJumpToQuestion}
              isAnswered={(index) => Boolean(storageState.answers[debtBalanceQuestions[index].id])}
            />
          </section>

          <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px]">
            <div className="absolute right-[-28px] top-[-28px] h-[120px] w-[120px] rounded-full bg-primary opacity-10" />
            <div className="relative z-10 max-w-[780px]">
              <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)]">
                Review & Submit
              </div>
              <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px]">
                You've answered all {debtBalanceTotalQuestions} questions.
              </h1>
              <p className="mt-[10px] max-w-[720px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px]">
                Review your section completion below, then click "Calculate Results" to see your personalized debt health analysis.
              </p>
            </div>
          </section>

          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-2">
            {debtBalanceSectionMeta.map((section) => {
              const answeredInSection = getSectionAnsweredCount(storageState.answers, section.id);
              const totalInSection = debtBalanceQuestions.filter((q) => q.sectionId === section.id).length;
              return (
                <div key={section.id} className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">{section.title}</div>
                  <div className="mt-[4px] text-[24px] font-serif text-gray-900">
                    {answeredInSection}/{totalInSection}
                  </div>
                  <div className="mt-[2px] text-[11px] text-gray-600">{section.description}</div>
                </div>
              );
            })}
          </section>

          {validationMessage && (
            <section className="mt-[18px] rounded-[12px] border border-rose-200 bg-rose-50 px-[14px] py-[12px]">
              <div className="text-[12px] font-semibold text-rose-700">{validationMessage}</div>
            </section>
          )}

          <section className="mt-[18px] pb-[12px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                <div className="text-[12px] text-gray-600">
                  All questions answered. Ready to see your personalized debt health analysis?
                </div>
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)] hover:bg-primary/90"
                  >
                    Calculate Results
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
        {stopConfirmDialog}
      </main>
    );
  }

  // Results page
  if (storageState.completed && storageState.result) {
    const result = storageState.result;

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
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Your Debt Health Report</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px]">Personalized analysis and guidance based on your responses.</div>
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
          {/* Score Card */}
          <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px]">
            <div className="absolute right-[-28px] top-[-28px] h-[120px] w-[120px] rounded-full bg-primary opacity-10" />
            <div className="relative z-10">
              <div className="flex flex-col items-center sm:items-start sm:flex-row gap-[24px]">
                <div className="shrink-0">
                  <ScoreRing score={result.percentageScore} />
                </div>
                <div className="flex-1 max-w-[600px]">
                  <div className="inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)]">
                    {result.risk === "low"
                      ? "✓ Low Risk"
                      : result.risk === "moderate-low"
                        ? "⚠ Moderate-Low Risk"
                        : result.risk === "moderate"
                          ? "⚠ Moderate Risk"
                          : result.risk === "high"
                            ? "⚠ High Risk"
                            : "⚠ Very High Risk"}
                  </div>
                  <h1 className="mt-[10px] font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[32px]">
                    {result.category}
                  </h1>
                  <p className="mt-[10px] text-[14px] leading-[1.7] text-gray-600">
                    {result.summary}
                  </p>
                  <div className="mt-[14px] flex flex-wrap gap-[8px]">
                    <Badge
                      label={result.emotionalReadiness}
                      tone={result.percentageScore >= 50 ? "positive" : result.percentageScore >= 30 ? "caution" : "critical"}
                      size="sm"
                    />
                    <Badge
                      label={result.debtStressIndicator}
                      tone={result.percentageScore >= 50 ? "positive" : result.percentageScore >= 30 ? "caution" : "critical"}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key Metrics */}
          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
            <MetricPill label="Repayment Stability" value={`${result.repaymentStabilityScore}%`} />
            <MetricPill label="Credit Dependency" value={`${result.creditDependencyScore}%`} subtext="lower is better" />
            <MetricPill label="Emergency Readiness" value={`${result.emergencyReadinessScore}%`} />
          </section>

          {/* Section Breakdown */}
          <section className="mt-[18px]">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[10px]">Performance by Area</h2>
            <div className="grid gap-[8px]">
              {debtBalanceSectionMeta.map((section) => {
                const sectionScore = result.sectionScores[section.id];
                const percentage = sectionScore.max > 0 ? Math.round((sectionScore.score / sectionScore.max) * 100) : 0;
                return (
                  <div key={section.id} className="rounded-[12px] border border-gray-200 bg-gray-50 p-[12px]">
                    <div className="flex items-center justify-between mb-[8px]">
                      <div>
                        <div className="text-[12px] font-semibold text-gray-900">{section.title}</div>
                        <div className="text-[10px] text-gray-500">{section.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-serif font-bold text-gray-900">{percentage}%</div>
                      </div>
                    </div>
                    <div className="h-[6px] w-full rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stress Indicators */}
          {result.stressIndicators.length > 0 && (
            <section className="mt-[18px]">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[10px]">Areas of Concern</h2>
              <div className="space-y-[8px]">
                {result.stressIndicators.map((indicator, idx) => (
                  <div
                    key={idx}
                    className={`rounded-[12px] border p-[12px] ${
                      indicator.severity === "high"
                        ? "border-rose-200 bg-rose-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-start gap-[10px]">
                      <div
                        className={`mt-[2px] h-[8px] w-[8px] rounded-full shrink-0 ${
                          indicator.severity === "high" ? "bg-rose-600" : "bg-amber-600"
                        }`}
                      />
                      <div className={`text-[12px] font-medium ${indicator.severity === "high" ? "text-rose-700" : "text-amber-700"}`}>
                        {indicator.indicator}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Insights */}
          {result.insights.length > 0 && (
            <section className="mt-[18px]">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[10px]">Key Insights</h2>
              <div className="space-y-[8px]">
                {result.insights.map((insight, idx) => (
                  <Card key={idx} className="overflow-hidden border-gray-200 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                    <CardContent className="px-[14px] py-[12px]">
                      <div className="flex items-start gap-[10px]">
                        <div className="mt-[2px] shrink-0">
                          {insight.severity === "positive" && <span className="text-[16px]">✓</span>}
                          {insight.severity === "caution" && <span className="text-[16px]">→</span>}
                          {insight.severity === "warning" && <span className="text-[16px]">⚠</span>}
                          {insight.severity === "critical" && <span className="text-[16px]">!</span>}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-gray-900">{insight.title}</div>
                          <div className="mt-[2px] text-[11px] leading-[1.6] text-gray-600">{insight.description}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Improvement Areas */}
          {result.improvementAreas.length > 0 && (
            <section className="mt-[18px]">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[10px]">Top Areas for Improvement</h2>
              <div className="space-y-[10px]">
                {result.improvementAreas.map((area, idx) => (
                  <Card key={idx} className="overflow-hidden border-gray-200 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                    <CardContent className="px-[14px] py-[12px]">
                      <div className="flex items-start justify-between gap-[10px] mb-[8px]">
                        <div className="text-[12px] font-semibold text-gray-900">{area.question}</div>
                        <span className="text-[10px] font-bold text-gray-400">Score: {area.currentScore}/5</span>
                      </div>
                      <p className="text-[11px] leading-[1.6] text-gray-600">{area.suggestion}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Suggestions */}
          <section className="mt-[18px]">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[10px]">Personalized Guidance</h2>
            <div className="space-y-[8px]">
              {result.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex gap-[10px] rounded-[12px] border border-[#d4d8fa] bg-[#f6f7fe] p-[12px]">
                  <div className="mt-[2px] text-[14px]">→</div>
                  <div className="text-[12px] font-medium text-gray-900">{suggestion}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Action Buttons */}
          <section className="mt-[18px] pb-[12px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                <div className="text-[12px] text-gray-600">
                  Want personalized guidance? Talk to our financial wellness assistant.
                </div>
                <div className="flex gap-[8px]">
                  {onOpenFinancialWellnessAssistant && (
                    <button
                      type="button"
                      onClick={onOpenFinancialWellnessAssistant}
                      className="h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)] hover:bg-primary/90"
                    >
                      Talk to Assistant
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-gray-50"
                  >
                    Retake Assessment
                  </button>
                  <button
                    type="button"
                    onClick={onBackToCatalog}
                    className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-gray-50"
                  >
                    Back to Tests
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    );
  }

  // Question screen
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Question {storageState.stepIndex + 1} of {debtBalanceTotalQuestions}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">·</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">{timeLeftText}</span>
          </div>
          <div className="mt-[4px] h-[4px] w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
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
        {currentQuestion && (
          <div className="mb-[18px]">
            <QuestionNavigator
              title="PROGRESS"
              totalQuestions={debtBalanceTotalQuestions}
              activeIndex={storageState.stepIndex}
              answeredCount={answeredCount}
              timeLeftLabel={timeLeftText}
              showTime={false}
              showSummary={false}
              onSelectQuestion={handleJumpToQuestion}
              isAnswered={(index) => Boolean(storageState.answers[debtBalanceQuestions[index].id])}
            />
          </div>
        )}

        {currentQuestion && (
          <>
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[4px]">{currentQuestion.sectionId.replace("-", " ")}</div>
                    <CardTitle className="text-[16px] leading-[1.5] text-gray-900 sm:text-[17px]">
                      {currentQuestion.prompt}
                    </CardTitle>
                  </div>
                </div>
                {currentQuestion.helper && (
                  <div className="text-[12px] text-gray-500 leading-[1.5]">
                    {currentQuestion.helper}
                  </div>
                )}
              </CardHeader>
              <CardContent className="grid gap-[10px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {currentQuestion.options.map((option) => (
                  <OptionButton
                    key={option.label}
                    label={option.label}
                    selected={storageState.answers[currentQuestion.id] === option.label}
                    onClick={() => handleSelectOption(option.label)}
                  />
                ))}
              </CardContent>
            </Card>

            {validationMessage && (
              <div className="mt-[12px] rounded-[12px] border border-rose-200 bg-rose-50 px-[14px] py-[12px]">
                <div className="text-[12px] font-semibold text-rose-700">{validationMessage}</div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-gray-100 px-[16px] py-[14px] shrink-0 bg-white sm:px-[20px]">
        <div className="flex gap-[8px]">
            <button
              type="button"
              onClick={handleBack}
              className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-gray-50"
            >
              {storageState.stepIndex === 0 ? "Exit" : "Back"}
            </button>
            <button
              type="button"
              onClick={() => setShowStopConfirm(true)}
              className="h-[38px] rounded-[12px] bg-rose-600 px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.18)] hover:bg-rose-700"
            >
              Stop test
            </button>
          {storageState.stepIndex < debtBalanceTotalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleContinue}
              className="flex-1 h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)] hover:bg-primary/90"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className="flex-1 h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)] hover:bg-primary/90"
            >
              Review Answers
            </button>
          )}
        </div>
      </div>
      {stopConfirmDialog}
    </main>
  );
}

// Confirmation dialog is rendered within component tree so import above and used via state
