import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
// QuestionNavigator intentionally not used here — remove import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateLoanFitResult,
} from "@/features/loan-fit/loanFitScoring";
import {
  loanFitQuestions,
  loanFitSectionMeta,
  loanFitTotalQuestions,
  type LoanFitAnswerMap,
  type LoanFitQuestion,
  type LoanFitResult,
} from "@/features/loan-fit/loanFitConfig";
import { submitWellnessTestResult } from "@/lib/backendChat";

interface LoanFitTestViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onBackToCatalog: () => void;
  onOpenFinancialWellnessAssistant?: () => void;
}

type LoanFitProgressState = {
  version: 1;
  answers: LoanFitAnswerMap;
  stepIndex: number;
  result: LoanFitResult | null;
  completed: boolean;
  updatedAt: string;
  startAt?: string;
};

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

const STORAGE_PREFIX = "finheal_loan_fit_test";
const TOTAL_STEPS = loanFitTotalQuestions + 1;
const TARGET_DURATION_MINUTES = 5;

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function createEmptyState(): LoanFitProgressState {
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

function readState(userId: string): LoanFitProgressState {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return createEmptyState();
    }

    const parsed = JSON.parse(raw) as Partial<LoanFitProgressState>;
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

function writeState(userId: string, state: LoanFitProgressState) {
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

function getAnsweredCount(answers: LoanFitAnswerMap) {
  return loanFitQuestions.reduce((count, question) => count + (answers[question.id] ? 1 : 0), 0);
}

function getSectionAnsweredCount(answers: LoanFitAnswerMap, sectionId: string) {
  return loanFitQuestions.filter((question) => question.sectionId === sectionId && answers[question.id]).length;
}

function getQuestionProgress(stepIndex: number) {
  const safeIndex = Math.max(0, Math.min(stepIndex, loanFitTotalQuestions));
  return Math.round((safeIndex / loanFitTotalQuestions) * 100);
}

function getTimeRemainingText(stepIndex: number) {
  const remainingQuestions = Math.max(loanFitTotalQuestions - stepIndex, 0);
  const minutes = Math.max(1, Math.ceil((remainingQuestions / loanFitTotalQuestions) * TARGET_DURATION_MINUTES));
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

function ScoreRing({ score }: { score: number }) {
  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto flex w-fit items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#loan-fit-score-gradient)"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="loan-fit-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3344e6" />
            <stop offset="100%" stopColor="#5f73ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400">Fit score</div>
        <div className="font-serif text-[42px] leading-none text-gray-900">{score}</div>
        <div className="mt-[4px] text-[11px] text-gray-500">out of 100</div>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-gray-200 bg-white p-[14px] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">{label}</div>
      <div className="mt-[5px] text-[14px] font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "danger" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : tone === "warn"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-rose-100 bg-rose-50 text-rose-700"
          : "border-gray-200 bg-gray-50 text-gray-600";

  return <span className={`inline-flex items-center rounded-full border px-[10px] py-[5px] text-[11px] font-semibold ${toneClass}`}>{children}</span>;
}

export default function LoanFitTestView({
  userId,
  onToggleSidebar,
  onToggleInsights,
  onBackToCatalog,
  onOpenFinancialWellnessAssistant,
}: LoanFitTestViewProps) {
  const [hydrated, setHydrated] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<LoanFitAnswerMap>({});
  const [result, setResult] = useState<LoanFitResult | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [submittedAttemptKey, setSubmittedAttemptKey] = useState<string | null>(null);
  const [timeLeftText, setTimeLeftText] = useState(() => {
    const start = new Date(readState(userId).startAt ?? new Date().toISOString()).getTime();
    const end = start + TARGET_DURATION_MINUTES * 60 * 1000;
    const diff = Math.max(0, end - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${String(mins)}:${String(secs).padStart(2, "0")} left`;
  });

  const currentQuestion = stepIndex < loanFitQuestions.length ? loanFitQuestions[stepIndex] : null;
  const isReviewStep = stepIndex === loanFitQuestions.length;
  const completedCount = useMemo(() => getAnsweredCount(answers), [answers]);
  const progressPercent = useMemo(() => getQuestionProgress(Math.min(stepIndex, loanFitQuestions.length)), [stepIndex]);
  const timeRemaining = useMemo(() => getTimeRemainingText(Math.min(stepIndex, loanFitQuestions.length)), [stepIndex]);
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const missingAnswers = useMemo(() => loanFitQuestions.filter((question) => !answers[question.id]), [answers]);

  useEffect(() => {
    const saved = readState(userId);
    setAnswers(saved.answers ?? {});
    setStepIndex(saved.completed && saved.result ? loanFitQuestions.length + 1 : Math.min(saved.stepIndex, loanFitQuestions.length));
    setResult(saved.completed ? saved.result : null);
    setHydrated(true);
  }, [userId]);

  // Live countdown for loan fit
  useEffect(() => {
    if (result) return;
    const tick = () => {
      const start = new Date(readState(userId).startAt ?? new Date().toISOString()).getTime();
      const end = start + TARGET_DURATION_MINUTES * 60 * 1000;
      const diff = Math.max(0, end - Date.now());
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeftText(`${String(mins)}:${String(secs).padStart(2, "0")} left`);
      if (diff <= 0 && !result) {
        const nextResult = calculateLoanFitResult(answers);
        setResult(nextResult);
        setStepIndex(loanFitQuestions.length + 1);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [answers, result, userId]);

  useEffect(() => {
    // Persist progress to localStorage whenever answers/step/result/loaded state changes.
    writeState(userId, {
      version: 1,
      answers,
      stepIndex,
      result,
      completed: Boolean(result),
      updatedAt: new Date().toISOString(),
      startAt: readState(userId).startAt ?? new Date().toISOString(),
    });
  }, [answers, hydrated, result, stepIndex, userId]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const attemptKey = `${userId}:${result.rawScore}:${result.percentageScore}:${Object.keys(answers).length}:${stepIndex}`;
    if (submittedAttemptKey === attemptKey) {
      return;
    }

    const run = async () => {
      try {
        await submitWellnessTestResult({
          user_id: userId,
          test_type: "loan_fit",
          raw_score: result.percentageScore,
          normalized_score: result.percentageScore,
          completed_at: new Date().toISOString(),
          insights: result.insights.map((item) => item.title),
          category_breakdown: {
            category: result.category,
            riskLevel: result.riskLevel,
            affordabilityStatus: result.affordabilityStatus,
          },
        });
        setSubmittedAttemptKey(attemptKey);
      } catch (error) {
        console.error("Failed to submit loan fit result to wellness engine", error);
      }
    };

    void run();
  }, [answers, result, stepIndex, submittedAttemptKey, userId]);

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      setValidationMessage(null);
      setAnswers((current) => ({ ...current, [questionId]: optionId }));
    },
    [],
  );

  const handleBack = useCallback(() => {
    setValidationMessage(null);
    setResult(null);
    setStepIndex((current) => {
      if (current <= 0) {
        onBackToCatalog();
        return current;
      }

      return current - 1;
    });
  }, [onBackToCatalog]);

  const handleSubmit = useCallback(() => {
    const unanswered = loanFitQuestions.filter((question) => !answers[question.id]);
    if (unanswered.length > 0) {
      setValidationMessage("Please answer all 12 questions before seeing your result.");
      setStepIndex(loanFitQuestions.findIndex((question) => question.id === unanswered[0].id));
      return;
    }

    const nextResult = calculateLoanFitResult(answers);
    setResult(nextResult);
    setValidationMessage(null);
    setStepIndex(loanFitQuestions.length + 1);
  }, [answers]);

  const handleContinue = useCallback(() => {
    if (isReviewStep) {
      handleSubmit();
      return;
    }

    if (!currentQuestion) {
      return;
    }

    if (!selectedAnswer) {
      setValidationMessage("Please choose an option to continue.");
      return;
    }

    setValidationMessage(null);
    setStepIndex((current) => Math.min(current + 1, loanFitQuestions.length));
  }, [currentQuestion, isReviewStep, selectedAnswer, handleSubmit]);

  const handleRetake = useCallback(() => {
    clearState(userId);
    setAnswers({});
    setResult(null);
    setValidationMessage(null);
    setStepIndex(0);
  }, [userId]);

  const handleStopTest = useCallback(() => {
    const nextResult = calculateLoanFitResult(answers);
    setResult(nextResult);
    setStepIndex(loanFitQuestions.length + 1);
  }, [answers]);

  const stopConfirmDialog = (
    <ConfirmDeleteDialog
      isOpen={showStopConfirm}
      title="Stop Test"
      description="Stop the test and compute partial scoring for the answers you've provided so far?"
      onConfirm={() => { handleStopTest(); setShowStopConfirm(false); }}
      onCancel={() => setShowStopConfirm(false)}
      confirmLabel="Stop"
      processingLabel="Stopping..."
    />
  );

  const handleJumpToQuestion = useCallback((questionIndex: number) => {
    setResult(null);
    setValidationMessage(null);
    setStepIndex(questionIndex);
  }, []);

  const renderQuestionCard = (question: LoanFitQuestion) => (
    <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[4px]">{question.sectionLabel}</div>
            <CardTitle className="text-[16px] leading-[1.5] text-gray-900 sm:text-[17px]">{question.prompt}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-[10px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
        {question.options.map((option) => (
          <OptionButton
            key={option.id}
            label={option.label}
            selected={selectedAnswer === option.id}
            onClick={() => handleSelectOption(question.id, option.id)}
          />
        ))}

        {validationMessage && currentQuestion?.id === question.id && (
          <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-[14px] py-[12px] text-[13px] text-rose-700">
            {validationMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[4px]">Review</div>
            <CardTitle className="text-[16px] leading-[1.5] text-gray-900 sm:text-[17px]">Review your responses before we calculate your fit score</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-[18px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
        <div className="grid gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
          {loanFitSectionMeta.map((section, index) => (
            <div key={section.sectionId} className="rounded-[16px] border border-gray-200 bg-white p-[14px] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">{section.title}</div>
              <div className="mt-[4px] text-[22px] font-serif text-gray-900">{getSectionAnsweredCount(answers, section.sectionId)}</div>
              <div className="text-[12px] text-gray-500">questions answered</div>
              <div className="mt-[10px] text-[10px] font-semibold uppercase tracking-[0.7px] text-primary">
                Step {index + 1} of {loanFitSectionMeta.length}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[18px] border border-gray-200 bg-[#f8f9ff] p-[14px] sm:p-[18px]">
          <div className="text-[12px] font-semibold uppercase tracking-[0.8px] text-gray-400">Quick summary</div>
          <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2 xl:grid-cols-3">
            <MetricPill label="Answered" value={`${completedCount}/${loanFitTotalQuestions}`} />
            <MetricPill label="Estimated time left" value="Under 1 minute" />
            <MetricPill label="Risk check" value="Ready to calculate" />
          </div>
        </div>

        {validationMessage && (
          <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-[14px] py-[12px] text-[13px] text-rose-700">
            {validationMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderResultPage = () => {
    if (!result) {
      return null;
    }

    const riskTone =
      result.riskLevel === "Low Risk"
        ? "good"
        : result.riskLevel === "Moderate-Low Risk"
          ? "good"
          : result.riskLevel === "Moderate Risk"
            ? "warn"
            : "danger";

    return (
      <div className="space-y-[16px]">
        <section className="overflow-hidden rounded-[24px] border border-[#d7dcfb] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_18px_60px_rgba(50,68,230,0.08)] sm:p-[24px]">
          <div className="grid gap-[20px] lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="rounded-[22px] border border-white/70 bg-white/80 p-[18px] shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <ScoreRing score={result.percentageScore} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-[10px]">
                <Badge tone={riskTone}>{result.category}</Badge>
                <Badge tone="neutral">{result.riskLevel}</Badge>
                <Badge tone="neutral">{result.emotionalReadinessIndicator}</Badge>
              </div>
              <h2 className="mt-[12px] font-serif text-[28px] leading-[1.15] text-gray-900 sm:text-[34px]">
                Your loan fit looks {result.category.toLowerCase()}.
              </h2>
              <p className="mt-[10px] max-w-[720px] text-[14px] leading-[1.8] text-gray-600 sm:text-[15px]">
                {result.summary}
              </p>
              <div className="mt-[16px] flex flex-wrap gap-[8px] text-[12px] text-gray-600">
                <span className="rounded-full bg-white px-[10px] py-[5px] font-semibold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">Raw score: {result.rawScore}/60</span>
                <span className="rounded-full bg-white px-[10px] py-[5px] font-semibold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">Affordability: {result.affordabilityStatus}</span>
                <span className="rounded-full bg-white px-[10px] py-[5px] font-semibold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">Fit score: {result.percentageScore}/100</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-[16px] lg:grid-cols-2">
          <Card className="border-gray-200 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <CardHeader className="space-y-1 px-[18px] pt-[18px]">
              <CardTitle className="text-[18px] text-gray-900">Affordability snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-[10px] px-[18px] pb-[18px]">
              {result.sectionScores.map((section) => (
                <div key={section.sectionId} className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
                  <div className="flex items-center justify-between gap-[10px]">
                    <div>
                      <div className="text-[12px] font-semibold text-gray-700">{section.sectionLabel}</div>
                      <div className="mt-[2px] text-[11px] text-gray-500">{section.score}/{section.maxScore} points</div>
                    </div>
                    <Badge tone={section.score >= 12 ? "good" : section.score >= 9 ? "warn" : "danger"}>{Math.round((section.score / section.maxScore) * 100)}%</Badge>
                  </div>
                  <div className="mt-[10px] h-[6px] overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#3344e6] via-[#4f6cf7] to-[#7c8cff] transition-all duration-700"
                      style={{ width: `${Math.round((section.score / section.maxScore) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <CardHeader className="space-y-1 px-[18px] pt-[18px]">
              <CardTitle className="text-[18px] text-gray-900">Financial stress indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-[10px] px-[18px] pb-[18px]">
              {result.insights.map((insight) => (
                <div key={insight.title} className="rounded-[16px] border border-gray-200 bg-white p-[14px] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-[8px]">
                    <div className="text-[13px] font-semibold text-gray-800">{insight.title}</div>
                    <Badge tone={insight.severity === "low" ? "good" : insight.severity === "medium" ? "warn" : "danger"}>{insight.severity}</Badge>
                  </div>
                  <p className="mt-[6px] text-[12px] leading-[1.7] text-gray-500">{insight.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-[16px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="border-gray-200 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <CardHeader className="space-y-1 px-[18px] pt-[18px]">
              <CardTitle className="text-[18px] text-gray-900">Top improvement areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-[10px] px-[18px] pb-[18px]">
              {result.topImprovementAreas.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] text-[13px] leading-[1.7] text-gray-700">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <CardHeader className="space-y-1 px-[18px] pt-[18px]">
              <CardTitle className="text-[18px] text-gray-900">Personalized suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-[10px] px-[18px] pb-[18px]">
              {result.suggestions.map((suggestion) => (
                <div key={suggestion} className="flex items-start gap-[10px] rounded-[16px] border border-gray-200 bg-white p-[14px] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="mt-[2px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#eef0fd] text-[12px] font-bold text-primary">•</div>
                  <div className="text-[13px] leading-[1.7] text-gray-700">{suggestion}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-gray-200 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <CardHeader className="space-y-1 px-[18px] pt-[18px]">
            <CardTitle className="text-[18px] text-gray-900">What this means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[12px] px-[18px] pb-[18px] text-[13px] leading-[1.8] text-gray-600">
            <p>
              This assessment is designed to feel supportive and practical. A lower score does not mean you should never borrow; it means the current timing or structure may deserve more caution.
            </p>
            <p>
              If you want, you can retake the test after improving savings, reducing existing debt, or exploring a smaller EMI structure.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center gap-3 px-[16px] py-[14px] sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Loan Fit Test</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px]">A calm check on whether a new loan or EMI commitment fits your current situation.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0" aria-label="Toggle insights panel">☰</button>
        </div>
        <div className="px-[16px] pb-[14px] sm:px-[20px] sm:pb-[12px]">
          <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500">
            <span>Question {Math.min(stepIndex + 1, loanFitTotalQuestions)} of {loanFitTotalQuestions}</span>
            <span>{timeLeftText}</span>
          </div>
          <div className="mt-[8px] h-[8px] rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-[#3344e6] via-[#4f6cf7] to-[#7c8cff] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        {currentQuestion && !result && !isReviewStep && renderQuestionCard(currentQuestion)}
        {!result && isReviewStep && renderReviewStep()}
        {result && renderResultPage()}

        {!result && (
          <div className="mt-[18px] border-t border-gray-100 pt-[14px]">
            <div className="flex gap-[8px]">
              <button
                type="button"
                onClick={handleBack}
                className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-gray-50"
              >
                {stepIndex === 0 ? 'Exit' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => setShowStopConfirm(true)}
                className="h-[38px] rounded-[12px] bg-rose-600 px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.18)] hover:bg-rose-700"
              >
                Stop test
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!currentQuestion || !selectedAnswer}
                className="flex-1 h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReviewStep ? 'Submit and see result' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-[16px] flex flex-col gap-[10px] sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={handleRetake} className="rounded-[14px] border border-gray-200 bg-white px-[16px] py-[12px] text-[13px] font-semibold text-gray-700 transition-all hover:bg-gray-50">Retake Test</button>
            {onOpenFinancialWellnessAssistant && (
              <button type="button" onClick={onOpenFinancialWellnessAssistant} className="rounded-[14px] border border-primary/20 bg-[#eef0fd] px-[16px] py-[12px] text-[13px] font-semibold text-primary transition-all hover:bg-[#e3e7ff]">Talk to Financial Wellness Assistant</button>
            )}
            <button type="button" onClick={onBackToCatalog} className="rounded-[14px] bg-primary px-[16px] py-[12px] text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(50,68,230,0.2)] transition-all hover:bg-[#1e2db8]">Explore Safer EMI Plans</button>
          </div>
        )}
      </div>
      {stopConfirmDialog}
    </main>
  );
}
