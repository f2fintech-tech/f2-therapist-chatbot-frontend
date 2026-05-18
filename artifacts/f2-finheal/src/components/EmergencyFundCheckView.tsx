import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateEmergencyFundResult,
  type EmergencyFundResult,
  type EmergencyFundResultLevel,
} from "@/features/emergency-fund/emergencyFundScoring";
import {
  emergencyFundDurationMinutes,
  emergencyFundMaximumScore,
  emergencyFundQuestions,
  emergencyFundSectionMeta,
  emergencyFundStorageVersion,
  type EmergencyFundAnswerMap,
  type EmergencyFundQuestion,
} from "@/features/emergency-fund/emergencyFundConfig";

interface EmergencyFundCheckViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onBackToCatalog: () => void;
  onOpenFinancialWellnessAssistant?: () => void;
}

type EmergencyFundProgressState = {
  version: number;
  answers: EmergencyFundAnswerMap;
  stepIndex: number;
  result: EmergencyFundResult | null;
  completed: boolean;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

const STORAGE_PREFIX = "finheal_emergency_fund_check";
const TARGET_DURATION_SECONDS = emergencyFundDurationMinutes * 60;

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function getTimerLabel(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function createEmptyState(): EmergencyFundProgressState {
  const now = new Date().toISOString();
  return {
    version: emergencyFundStorageVersion,
    answers: {},
    stepIndex: 0,
    result: null,
    completed: false,
    startedAt: now,
    completedAt: null,
    updatedAt: now,
  };
}

function normalizeAnswers(answers: Partial<Record<string, string>> | null | undefined): EmergencyFundAnswerMap {
  if (!answers) {
    return {};
  }

  return emergencyFundQuestions.reduce((accumulator, question) => {
    const value = answers[question.id];
    if (typeof value === "string" && question.options.some((option) => option.label === value)) {
      accumulator[question.id] = value;
    }
    return accumulator;
  }, {} as EmergencyFundAnswerMap);
}

function readState(userId: string): EmergencyFundProgressState {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return createEmptyState();
    }

    const parsed = JSON.parse(raw) as Partial<EmergencyFundProgressState>;
    if (parsed.version !== emergencyFundStorageVersion) {
      return createEmptyState();
    }

    const completed = Boolean(parsed.completed && parsed.result);
    const answers = normalizeAnswers(parsed.answers ?? {});
    const safeStepIndex = typeof parsed.stepIndex === "number" ? Math.max(0, Math.min(parsed.stepIndex, emergencyFundQuestions.length)) : 0;

    return {
      version: emergencyFundStorageVersion,
      answers,
      stepIndex: completed ? emergencyFundQuestions.length : safeStepIndex,
      result: completed ? parsed.result ?? null : null,
      completed,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : new Date().toISOString(),
      completedAt: completed && typeof parsed.completedAt === "string" ? parsed.completedAt : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return createEmptyState();
  }
}

function writeState(userId: string, state: EmergencyFundProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // Ignore storage failures and continue with the in-memory state.
  }
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / max) * circumference;

  return (
    <div className="relative mx-auto flex w-fit items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} className="dark:stroke-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#emergency-fund-score-gradient)"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="emergency-fund-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400 dark:text-slate-400">Preparedness</div>
        <div className="font-serif text-[42px] leading-none text-gray-900 dark:text-slate-50">{score}</div>
        <div className="mt-[4px] text-[11px] text-gray-500 dark:text-slate-400">out of {max}</div>
      </div>
    </div>
  );
}

function OptionButton({ label, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-[16px] border px-[14px] py-[13px] text-left text-[14px] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 ${
        selected
          ? "border-cyan-500 bg-[#ecfeff] text-cyan-900 shadow-[0_10px_30px_rgba(14,165,233,0.12)] dark:bg-slate-900 dark:text-slate-50"
          : "border-gray-200 bg-white text-gray-700 hover:border-cyan-200 hover:bg-[#f8fcfd] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
      }`}
      aria-pressed={selected}
    >
      <span className="pr-3 leading-[1.55]">{label}</span>
      <span
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
          selected ? "border-cyan-500 bg-cyan-500 text-white" : "border-gray-300 bg-white text-transparent group-hover:text-cyan-500 dark:border-slate-700 dark:bg-slate-950"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  );
}

function MetricPill({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">{label}</div>
      <div className="mt-[5px] text-[14px] font-semibold text-gray-900 dark:text-slate-50">{value}</div>
      {subtext && <div className="mt-[2px] text-[11px] text-gray-500 dark:text-slate-400">{subtext}</div>}
    </div>
  );
}

function InsightCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "positive" | "caution" | "warning" | "critical";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
      : tone === "caution"
        ? "border-cyan-100 bg-cyan-50 text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-100"
        : tone === "warning"
          ? "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
          : "border-rose-100 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100";

  return (
    <div className={`rounded-[18px] border p-[14px] shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${toneClass}`}>
      <div className="text-[12px] font-semibold">{title}</div>
      <div className="mt-[6px] text-[12px] leading-[1.7] opacity-90">{description}</div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "positive" | "warning" | "critical" }) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
      : tone === "warning"
        ? "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
        : tone === "critical"
          ? "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100"
          : "border-gray-200 bg-gray-50 text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

  return <span className={`inline-flex items-center rounded-full border px-[10px] py-[5px] text-[11px] font-semibold ${toneClass}`}>{children}</span>;
}

function getQuestionProgress(stepIndex: number) {
  const safeIndex = Math.max(0, Math.min(stepIndex, emergencyFundQuestions.length));
  return Math.round((safeIndex / emergencyFundQuestions.length) * 100);
}

function getAnswerScore(question: EmergencyFundQuestion, answers: EmergencyFundAnswerMap) {
  const selectedAnswer = answers[question.id] ?? null;
  const option = question.options.find((entry) => entry.label === selectedAnswer);
  return option?.score ?? 0;
}

export default function EmergencyFundCheckView({
  userId,
  onToggleSidebar,
  onToggleInsights,
  onBackToCatalog,
  onOpenFinancialWellnessAssistant,
}: EmergencyFundCheckViewProps) {
  const [storageState, setStorageState] = useState<EmergencyFundProgressState>(() => readState(userId));
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [displayScore, setDisplayScore] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    setStorageState(readState(userId));
  }, [userId]);

  useEffect(() => {
    writeState(userId, storageState);
  }, [storageState, userId]);

  const currentQuestion = storageState.stepIndex < emergencyFundQuestions.length ? emergencyFundQuestions[storageState.stepIndex] : null;
  const progressPercent = getQuestionProgress(storageState.stepIndex);
  const elapsedSeconds = useMemo(() => {
    if (!storageState.startedAt) {
      return 0;
    }

    return Math.max(0, Math.floor((nowTs - new Date(storageState.startedAt).getTime()) / 1000));
  }, [nowTs, storageState.startedAt]);
  const remainingSeconds = Math.max(0, TARGET_DURATION_SECONDS - elapsedSeconds);
  const currentResult = useMemo(() => storageState.result ?? (storageState.completed ? calculateEmergencyFundResult(storageState.answers) : null), [storageState.answers, storageState.completed, storageState.result]);
  const currentAnswer = currentQuestion ? storageState.answers[currentQuestion.id] ?? null : null;
  const answeredCount = useMemo(() => emergencyFundQuestions.reduce((count, question) => count + (storageState.answers[question.id] ? 1 : 0), 0), [storageState.answers]);
  const missingQuestions = useMemo(() => emergencyFundQuestions.filter((question) => !storageState.answers[question.id]), [storageState.answers]);
  const sectionScores = currentResult?.sectionScores ?? emergencyFundSectionMeta.map((section) => ({ sectionId: section.sectionId, title: section.title, score: 0, max: 0, percentage: 0 }));

  useEffect(() => {
    if (storageState.completed) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [storageState.completed]);

  useEffect(() => {
    if (storageState.completed && currentResult) {
      setDisplayScore(0);
      const target = currentResult.rawScore;
      const duration = 900;
      const start = performance.now();

      const animate = (time: number) => {
        const progress = Math.min(1, (time - start) / duration);
        setDisplayScore(Math.round(target * progress));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [currentResult?.rawScore, storageState.completed]);

  const handleSelectOption = useCallback((questionId: string, optionLabel: string) => {
    setValidationMessage(null);
    setStorageState((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: optionLabel,
      },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleBack = useCallback(() => {
    setValidationMessage(null);
    setStorageState((current) => ({
      ...current,
      stepIndex: Math.max(0, current.stepIndex - 1),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleContinue = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

    if (!currentAnswer) {
      setValidationMessage("Please choose the option that best matches your current situation.");
      return;
    }

    setValidationMessage(null);

    if (storageState.stepIndex < emergencyFundQuestions.length - 1) {
      setStorageState((current) => ({
        ...current,
        stepIndex: current.stepIndex + 1,
        updatedAt: new Date().toISOString(),
      }));
      return;
    }

    const nextResult = calculateEmergencyFundResult(storageState.answers);
    setStorageState((current) => ({
      ...current,
      result: nextResult,
      completed: true,
      completedAt: new Date().toISOString(),
      stepIndex: emergencyFundQuestions.length,
      updatedAt: new Date().toISOString(),
    }));

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finheal:assessment-completed", {
          detail: {
            assessmentId: "emergency-fund-check",
            score: nextResult.rawScore,
            category: nextResult.category,
            risk: nextResult.risk,
          },
        }),
      );
    }
  }, [currentAnswer, currentQuestion, storageState.answers, storageState.stepIndex]);

  const handleRestart = useCallback(() => {
    const nextState = createEmptyState();
    setValidationMessage(null);
    setDisplayScore(0);
    setStorageState(nextState);
  }, []);

  const handleOpenAssistant = useCallback(() => {
    if (onOpenFinancialWellnessAssistant) {
      onOpenFinancialWellnessAssistant();
      return;
    }

    onBackToCatalog();
  }, [onBackToCatalog, onOpenFinancialWellnessAssistant]);

  const handleExploreBudgetOptimization = useCallback(() => {
    onBackToCatalog();
  }, [onBackToCatalog]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      if (!storageState.completed && event.key === "ArrowLeft" && storageState.stepIndex > 0) {
        event.preventDefault();
        handleBack();
      }

      if (!storageState.completed && (event.key === "ArrowRight" || event.key === "Enter") && currentAnswer) {
        event.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentAnswer, handleBack, handleContinue, storageState.completed, storageState.stepIndex]);

  if (storageState.completed && currentResult) {
    const preparednessScore = currentResult.rawScore;
    const totalQuestions = emergencyFundQuestions.length;
    const coveragePercent = Math.max(0, Math.min(100, currentResult.coverageProgressPercent));
    const riskTone = currentResult.risk === "Low Risk" ? "positive" : currentResult.risk === "Moderate-Low Risk" ? "neutral" : currentResult.risk === "Moderate Risk" ? "warning" : "critical";

    return (
      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-[16px] py-[14px] shrink-0 rounded-t-[20px] dark:border-slate-800 dark:bg-slate-950 sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Emergency Fund Check Results</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">A calm snapshot of your financial safety cushion and resilience.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <section className="rounded-[24px] border border-cyan-100 bg-[linear-gradient(135deg,#f0fdff_0%,#ecfeff_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(14,165,233,0.08)] sm:p-[24px] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_48%,#020617_100%)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Emergency preparedness score</div>
            <h1 className="mt-[6px] font-serif text-[28px] leading-[1.1] text-gray-900 dark:text-slate-50">Your safety cushion snapshot is ready.</h1>
            <p className="mt-[10px] max-w-[720px] text-[13px] leading-[1.7] text-gray-600 dark:text-slate-300">This is not a judgment. It is a practical read on how well your finances could absorb a surprise without causing unnecessary strain.</p>
          </section>

          <section className="mt-[18px] grid gap-[12px] lg:grid-cols-[0.82fr_1.18fr]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="px-[18px] py-[20px]">
                <ScoreRing score={displayScore} max={emergencyFundMaximumScore} />
                <div className="mt-[16px] text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">{currentResult.category}</div>
                  <div className="mt-[4px] text-[15px] font-semibold text-gray-900 dark:text-slate-100">{currentResult.risk}</div>
                  <div className="mt-[8px] text-[12px] leading-[1.7] text-gray-600 dark:text-slate-300">{currentResult.summary}</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-[12px]">
              <div className="grid gap-[10px] sm:grid-cols-2 xl:grid-cols-3">
                <MetricPill label="Coverage estimate" value={currentResult.emergencyCoverageEstimate} subtext="Your current cushion" />
                <MetricPill label="Stability rating" value={currentResult.savingsStabilityRating} subtext="How steady your reserves feel" />
                <MetricPill label="Risk badge" value={currentResult.risk} subtext="Overall vulnerability level" />
                <MetricPill label="Emotional stress" value={currentResult.emotionalStressLevel} subtext="How emergencies feel to you" />
                <MetricPill label="Target" value={currentResult.targetCoverageMonths === 1 ? "Starter buffer" : `${currentResult.targetCoverageMonths} months`} subtext="Suggested emergency fund target" />
                <MetricPill label="Preparedness" value={`${currentResult.emergencyPreparednessScore} / ${emergencyFundMaximumScore}`} subtext="Raw assessment score" />
              </div>

              <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
                <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                  <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Emergency fund progress meter</CardTitle>
                  <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">A quick look at how your current cushion compares with a healthy target.</CardDescription>
                </CardHeader>
                <CardContent className="px-[16px] pb-[18px] pt-[14px] sm:px-[18px]">
                  <div className="h-[12px] rounded-full bg-gray-100 dark:bg-slate-900">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-700" style={{ width: `${coveragePercent}%` }} />
                  </div>
                  <div className="mt-[10px] flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-slate-400">
                    <span>Current cushion: {currentResult.emergencyCoverageEstimate}</span>
                    <span>Target: {currentResult.suggestedEmergencyFundTarget}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
            {sectionScores.map((section) => (
              <div key={section.sectionId} className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">{section.title}</div>
                <div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{section.max > 0 ? `${section.percentage}%` : "--"}</div>
                <div className="mt-[2px] text-[12px] text-gray-500 dark:text-slate-400">{section.score} / {section.max || 0}</div>
              </div>
            ))}
          </section>

          <section className="mt-[18px] grid gap-[12px] lg:grid-cols-2">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Financial resilience insights</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Patterns that shape how your buffer behaves under pressure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                {currentResult.insights.map((insight) => (
                  <InsightCard key={`${insight.title}-${insight.description}`} title={insight.title} description={insight.description} tone={insight.tone} />
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Savings discipline and risk profile</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">A focused view of the habits behind your current cushion.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[12px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                <div className="grid gap-[10px] sm:grid-cols-2">
                  <MetricPill label="Discipline" value={currentResult.savingsDisciplineIndicator} />
                  <MetricPill label="Dependency risk" value={currentResult.emergencyDependencyRisk} />
                </div>
                <div className="rounded-[18px] border border-gray-200 bg-white p-[14px] dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Financial safety summary</div>
                  <div className="mt-[6px] text-[13px] leading-[1.7] text-gray-600 dark:text-slate-300">{currentResult.summary}</div>
                </div>
                <div className="rounded-[18px] border border-gray-200 bg-white p-[14px] dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Suggested emergency fund target</div>
                  <div className="mt-[6px] text-[13px] leading-[1.7] text-gray-700 dark:text-slate-200">{currentResult.suggestedEmergencyFundTarget}</div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px] grid gap-[12px] lg:grid-cols-2">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Personalized recommendations</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Simple actions that can make your cushion more reliable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                {currentResult.recommendations.map((recommendation) => (
                  <div key={recommendation} className="rounded-[16px] border border-gray-200 bg-gray-50 px-[14px] py-[12px] text-[13px] leading-[1.7] text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    {recommendation}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Optional actions</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Choose the next step that feels most useful right now.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-[8px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                <button type="button" onClick={handleRestart} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Retake assessment</button>
                <button type="button" onClick={handleOpenAssistant} className="h-[38px] rounded-[12px] bg-cyan-500 px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.18)]">Build emergency savings plan</button>
                <button type="button" onClick={handleOpenAssistant} className="h-[38px] rounded-[12px] border border-cyan-200 bg-cyan-50 px-[14px] text-[12px] font-semibold text-cyan-800 shadow-[0_8px_20px_rgba(14,165,233,0.10)] dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-100">Talk to assistant</button>
                <button type="button" onClick={handleExploreBudgetOptimization} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Explore budget optimization</button>
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Question review</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">A quick record of how you answered each item.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px] md:grid-cols-2">
                {currentResult.questionReview.map((item, index) => (
                  <div key={item.question.id} className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Question {index + 1}</div>
                    <div className="mt-[6px] text-[13px] leading-[1.7] text-gray-800 dark:text-slate-100">{item.question.prompt}</div>
                    <div className="mt-[8px] flex items-center gap-[8px]">
                      <Badge tone={item.isStrong ? "positive" : "warning"}>{item.isStrong ? "Strong" : "Needs support"}</Badge>
                      <span className="text-[12px] text-gray-500 dark:text-slate-400">{item.selectedAnswer ?? "No answer"}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px] flex flex-wrap gap-[8px]">
            <button type="button" onClick={handleRestart} className="h-[40px] rounded-[12px] bg-cyan-500 px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.18)]">Retake assessment</button>
            <button type="button" onClick={onBackToCatalog} className="h-[40px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Back to tests</button>
          </section>
        </div>
      </main>
    );
  }

  const totalQuestions = emergencyFundQuestions.length;
  const questionNumber = storageState.stepIndex + 1;
  const timeLabel = getTimerLabel(remainingSeconds);
  const resultBand = currentResult?.category ?? "Emergency Fund Check";

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center gap-3 px-[16px] py-[14px] sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Emergency Fund Check</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">A calm 2 minute diagnostic for your safety cushion and resilience.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>
        <div className="px-[16px] pb-[14px] sm:px-[20px] sm:pb-[12px]">
          <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-slate-400">
            <span>Question {questionNumber} of {totalQuestions}</span>
            <span>{progressPercent}% complete · {timeLabel} left</span>
          </div>
          <div className="mt-[8px] h-[8px] rounded-full bg-gray-100 dark:bg-slate-900">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
            <Badge tone={currentResult ? (currentResult.risk === "Low Risk" ? "positive" : currentResult.risk === "Moderate-Low Risk" ? "neutral" : currentResult.risk === "Moderate Risk" ? "warning" : "critical") : "neutral"}>{resultBand}</Badge>
            <Badge tone={answeredCount === totalQuestions ? "positive" : "neutral"}>{answeredCount} answered</Badge>
            <Badge tone={remainingSeconds <= 30 ? "warning" : "neutral"}>{timeLabel} remaining</Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        <section className="rounded-[24px] border border-cyan-100 bg-[linear-gradient(135deg,#f0fdff_0%,#ecfeff_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(14,165,233,0.08)] sm:p-[24px] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_48%,#020617_100%)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Calm financial wellness check</div>
          <h1 className="mt-[6px] font-serif text-[28px] leading-[1.1] text-gray-900 dark:text-slate-50">How resilient is your emergency cushion today?</h1>
          <p className="mt-[10px] max-w-[760px] text-[13px] leading-[1.7] text-gray-600 dark:text-slate-300">Choose the option that feels closest to your current reality. This assessment is designed to help you build stability, not to judge your finances.</p>
          <div className="mt-[14px] flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600 dark:text-slate-300">
            <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] dark:border-slate-800 dark:bg-slate-900">Supportive tone</span>
            <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] dark:border-slate-800 dark:bg-slate-900">Liquid savings focus</span>
            <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] dark:border-slate-800 dark:bg-slate-900">Short and practical</span>
          </div>
        </section>

        <section className="mt-[18px]">
          <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Question {questionNumber}</div>
                  <CardTitle className="mt-[4px] text-[18px] leading-[1.5] text-gray-900 dark:text-slate-100">{currentQuestion?.prompt}</CardTitle>
                </div>
                <span className="rounded-[999px] border border-gray-200 bg-gray-50 px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{currentQuestion ? emergencyFundSectionMeta.find((section) => section.sectionId === currentQuestion.sectionId)?.title ?? "Section" : "Section"}</span>
              </div>
              <CardDescription className="text-[12px] leading-[1.7] text-gray-600 dark:text-slate-400">Choose the answer that best reflects your current situation. Every answer helps shape a more accurate safety cushion estimate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[16px] sm:px-[18px]">
              {currentQuestion?.options.map((option) => {
                const selected = currentAnswer === option.label;
                return (
                  <OptionButton key={option.label} label={option.label} selected={selected} onClick={() => handleSelectOption(currentQuestion.id, option.label)} />
                );
              })}
            </CardContent>
          </Card>
        </section>

        {validationMessage && (
          <section className="mt-[12px] rounded-[16px] border border-amber-200 bg-amber-50 px-[14px] py-[12px] text-[12px] leading-[1.7] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            {validationMessage}
          </section>
        )}

        <section className="mt-[18px] grid gap-[12px] lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-[#d4d8fa] shadow-[0_14px_34px_rgba(14,165,233,0.08)] dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
              <div className="text-[12px] text-gray-600 dark:text-slate-300">Use back if you want to rethink an answer. Continue moves you one step forward.</div>
              <div className="flex gap-[8px] flex-wrap">
                <button type="button" onClick={handleBack} disabled={storageState.stepIndex === 0} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Back</button>
                <button type="button" onClick={handleContinue} disabled={!currentAnswer} className="h-[38px] rounded-[12px] bg-cyan-500 px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.18)] disabled:cursor-not-allowed disabled:opacity-60">{storageState.stepIndex === emergencyFundQuestions.length - 1 ? "Finish" : "Continue"}</button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="px-[16px] py-[16px] sm:px-[18px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Saved locally</div>
              <div className="mt-[4px] text-[15px] font-semibold text-gray-900 dark:text-slate-100">Your progress is stored on this device.</div>
              <div className="mt-[2px] text-[12px] text-gray-500 dark:text-slate-400">You can leave and return without losing answered questions.</div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
          <MetricPill label="Answered" value={answeredCount} subtext={`${missingQuestions.length} left`} />
          <MetricPill label="Estimated duration" value={`${emergencyFundDurationMinutes} min`} subtext="Designed for a quick check" />
          <MetricPill label="Coverage target" value={currentResult ? currentResult.suggestedEmergencyFundTarget : "3-6 months"} subtext="What to work toward" />
        </section>
      </div>
    </main>
  );
}
