import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listUserGoals, type Goal } from "@/utils/localGoals";
import {
  goalProgressDurationMinutes,
  goalProgressQuestions,
  goalProgressSectionMeta,
  goalProgressStorageVersion,
  type GoalProgressAnswerMap,
  type GoalProgressQuestion,
} from "@/features/goal-progress/goalProgressConfig";
import { calculateGoalProgressResult, type GoalProgressResult } from "@/features/goal-progress/goalProgressEngine";

interface FinancialGrowthTrackerViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onBackToCatalog: () => void;
  onOpenFinancialWellnessAssistant?: () => void;
}

type GoalProgressState = {
  version: number;
  answers: GoalProgressAnswerMap;
  stepIndex: number;
  completed: boolean;
  result: GoalProgressResult | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

const STORAGE_PREFIX = "finheal_goal_progress_assessment";
const GOALS_UPDATED_EVENT = "finheal:goals-updated";
const TARGET_DURATION_SECONDS = goalProgressDurationMinutes * 60;

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function createEmptyState(): GoalProgressState {
  const now = new Date().toISOString();
  return {
    version: goalProgressStorageVersion,
    answers: {},
    stepIndex: 0,
    completed: false,
    result: null,
    startedAt: now,
    completedAt: null,
    updatedAt: now,
  };
}

function normalizeAnswers(answers: GoalProgressAnswerMap | null | undefined): GoalProgressAnswerMap {
  if (!answers) {
    return {};
  }

  return goalProgressQuestions.reduce((accumulator, question) => {
    const answer = answers[question.id];
    if (typeof answer === "string" && question.options.some((option) => option.label === answer)) {
      accumulator[question.id] = answer;
    }
    return accumulator;
  }, {} as GoalProgressAnswerMap);
}

function readState(userId: string): GoalProgressState {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return createEmptyState();
    }

    const parsed = JSON.parse(raw) as Partial<GoalProgressState>;
    if (parsed.version !== goalProgressStorageVersion) {
      return createEmptyState();
    }

    const completed = Boolean(parsed.completed && parsed.result);

    return {
      version: goalProgressStorageVersion,
      answers: normalizeAnswers(parsed.answers),
      stepIndex: completed
        ? goalProgressQuestions.length
        : typeof parsed.stepIndex === "number"
          ? Math.max(0, Math.min(parsed.stepIndex, goalProgressQuestions.length - 1))
          : 0,
      completed,
      result: completed ? parsed.result ?? null : null,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : new Date().toISOString(),
      completedAt: completed && typeof parsed.completedAt === "string" ? parsed.completedAt : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return createEmptyState();
  }
}

function writeState(userId: string, nextState: GoalProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextState));
  } catch {
    // Ignore storage errors to avoid breaking in private browsing / quota issues.
  }
}

function formatMoney(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `INR ${Math.round(value).toLocaleString("en-IN")}`;
  }
}

function formatTimer(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = String(safe % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function getQuestionProgress(stepIndex: number) {
  const safe = Math.max(0, Math.min(stepIndex, goalProgressQuestions.length));
  return Math.round((safe / goalProgressQuestions.length) * 100);
}

function getQuestionScore(question: GoalProgressQuestion, answerLabel: string | null) {
  const option = question.options.find((entry) => entry.label === answerLabel);
  if (!option) {
    return 0;
  }

  const values = Object.values(option.weights);
  if (values.length === 0) {
    return 0;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round((average / 5) * 100);
}

function Meter({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-[16px] border border-gray-200 bg-white px-[12px] py-[11px] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="font-semibold text-gray-700 dark:text-slate-200">{label}</span>
        <span className="font-semibold text-gray-500 dark:text-slate-300">{value}/100</span>
      </div>
      <div className="mt-[8px] h-[8px] rounded-full bg-gray-100 dark:bg-slate-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${accent} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function getRiskToneClass(level: "Low" | "Medium" | "High") {
  if (level === "High") {
    return "border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100";
  }

  if (level === "Medium") {
    return "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100";
  }

  return "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100";
}

function getRiskZone(score: number) {
  if (score >= 67) {
    return {
      label: "High risk",
      level: "High" as const,
      barClass: "from-rose-500 to-red-500",
      markerClass: "bg-rose-600",
      textClass: "text-rose-700 dark:text-rose-200",
      borderClass: "border-rose-100 dark:border-rose-900/40",
    };
  }

  if (score >= 34) {
    return {
      label: "Medium risk",
      level: "Medium" as const,
      barClass: "from-amber-400 to-orange-500",
      markerClass: "bg-orange-500",
      textClass: "text-amber-700 dark:text-amber-100",
      borderClass: "border-amber-100 dark:border-amber-900/40",
    };
  }

  return {
    label: "Low risk",
    level: "Low" as const,
    barClass: "from-emerald-500 to-teal-500",
    markerClass: "bg-emerald-600",
    textClass: "text-emerald-700 dark:text-emerald-100",
    borderClass: "border-emerald-100 dark:border-emerald-900/40",
  };
}

function getFallbackRiskLevel(score: number) {
  if (score >= 70) {
    return "High" as const;
  }

  if (score >= 35) {
    return "Medium" as const;
  }

  return "Low" as const;
}

function getRenderedRiskAreas(result: GoalProgressResult) {
  if (Array.isArray(result.riskAreas) && result.riskAreas.length > 0) {
    return result.riskAreas;
  }

  if (!Array.isArray(result.sectionScores)) {
    return [];
  }

  return result.sectionScores.map((section) => {
    const riskScore = Math.max(0, Math.min(100, Math.round(100 - section.percentage)));
    return {
      sectionId: section.sectionId,
      title: section.title,
      riskScore,
      riskLevel: getFallbackRiskLevel(riskScore),
      note: "This area comes from a previously saved assessment and has been reconstructed for display.",
    };
  });
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-[16px] border px-[14px] py-[14px] text-left text-[14px] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10 ${
        selected
          ? "border-[#0f766e] bg-[#ebfffb] text-[#0f3f3f] shadow-[0_10px_28px_rgba(15,118,110,0.14)]"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#95d7cf] hover:bg-[#f4fbfa] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
      }`}
      aria-pressed={selected}
    >
      <span className="pr-3 leading-[1.6]">{label}</span>
      <span
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
          selected
            ? "border-[#0f766e] bg-[#0f766e] text-white"
            : "border-gray-300 bg-white text-transparent group-hover:text-[#0f766e] dark:border-slate-700 dark:bg-slate-900"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  );
}

export default function FinancialGrowthTrackerView({
  userId,
  onToggleSidebar,
  onToggleInsights,
  onBackToCatalog,
  onOpenFinancialWellnessAssistant,
}: FinancialGrowthTrackerViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [storageState, setStorageState] = useState<GoalProgressState>(() => readState(userId));
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [animatedAchievability, setAnimatedAchievability] = useState(0);
  const [animatedDiscipline, setAnimatedDiscipline] = useState(0);
  const [animatedEmotion, setAnimatedEmotion] = useState(0);

  useEffect(() => {
    setStorageState(readState(userId));
    setGoals(listUserGoals(userId));
  }, [userId]);

  useEffect(() => {
    writeState(userId, storageState);
  }, [storageState, userId]);

  useEffect(() => {
    const refreshGoals = () => setGoals(listUserGoals(userId));
    window.addEventListener("focus", refreshGoals);
    window.addEventListener(GOALS_UPDATED_EVENT, refreshGoals as EventListener);
    return () => {
      window.removeEventListener("focus", refreshGoals);
      window.removeEventListener(GOALS_UPDATED_EVENT, refreshGoals as EventListener);
    };
  }, [userId]);

  useEffect(() => {
    if (storageState.completed) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [storageState.completed]);

  const goalBase = useMemo(() => goals.filter((goal) => goal.targetAmount > 0), [goals]);
  const activeGoals = useMemo(
    () => goalBase.filter((goal) => goal.currentAmount < goal.targetAmount),
    [goalBase],
  );
  const displayGoals = activeGoals.length > 0 ? activeGoals : goalBase;

  const currencyCode = "INR";
  const totalGoalAmount = displayGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = displayGoals.reduce((sum, goal) => sum + Math.min(goal.currentAmount, goal.targetAmount), 0);
  const goalCompletionPercent = totalGoalAmount > 0 ? Math.round((totalCurrentAmount / totalGoalAmount) * 100) : 0;

  const currentQuestion = storageState.stepIndex < goalProgressQuestions.length ? goalProgressQuestions[storageState.stepIndex] : null;
  const currentAnswer = currentQuestion ? storageState.answers[currentQuestion.id] ?? null : null;
  const answeredCount = goalProgressQuestions.reduce(
    (count, question) => count + (storageState.answers[question.id] ? 1 : 0),
    0,
  );
  const progressPercent = getQuestionProgress(storageState.stepIndex);

  const elapsedSeconds = useMemo(
    () => Math.max(0, Math.floor((nowTs - new Date(storageState.startedAt).getTime()) / 1000)),
    [nowTs, storageState.startedAt],
  );
  const remainingSeconds = Math.max(0, TARGET_DURATION_SECONDS - elapsedSeconds);

  const liveResult = useMemo(() => calculateGoalProgressResult(storageState.answers, displayGoals), [displayGoals, storageState.answers]);
  const result = storageState.completed ? storageState.result ?? liveResult : liveResult;

  useEffect(() => {
    if (!storageState.completed || !result) {
      return;
    }

    const duration = 950;
    const startedAt = performance.now();

    const frame = (t: number) => {
      const progress = Math.min(1, (t - startedAt) / duration);
      setAnimatedAchievability(Math.round(result.goalAchievabilityScore * progress));
      setAnimatedDiscipline(Math.round(result.financialDisciplineScore * progress));
      setAnimatedEmotion(Math.round(result.emotionalSpendingMeter * progress));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [result, storageState.completed]);

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
      setValidationMessage("Choose the answer that feels most honest for your current phase.");
      return;
    }

    setValidationMessage(null);

    if (storageState.stepIndex < goalProgressQuestions.length - 1) {
      setStorageState((current) => ({
        ...current,
        stepIndex: current.stepIndex + 1,
        updatedAt: new Date().toISOString(),
      }));
      return;
    }

    const nextResult = calculateGoalProgressResult(storageState.answers, displayGoals);
    setStorageState((current) => ({
      ...current,
      completed: true,
      result: nextResult,
      completedAt: new Date().toISOString(),
      stepIndex: goalProgressQuestions.length,
      updatedAt: new Date().toISOString(),
    }));

    window.dispatchEvent(
      new CustomEvent("finheal:assessment-completed", {
        detail: {
          assessmentId: "goal-progress",
          score: nextResult.goalAchievabilityScore,
          archetype: nextResult.archetype,
        },
      }),
    );
  }, [currentAnswer, currentQuestion, displayGoals, storageState.answers, storageState.stepIndex]);

  const handleRestart = useCallback(() => {
    setValidationMessage(null);
    setAnimatedAchievability(0);
    setAnimatedDiscipline(0);
    setAnimatedEmotion(0);
    setStorageState(createEmptyState());
  }, []);

  const handleOpenAssistant = useCallback(() => {
    if (onOpenFinancialWellnessAssistant) {
      onOpenFinancialWellnessAssistant();
      return;
    }

    onBackToCatalog();
  }, [onBackToCatalog, onOpenFinancialWellnessAssistant]);

  const firstGoalName = displayGoals[0]?.name ?? "your goals";
  const questionNumber = Math.min(storageState.stepIndex + 1, goalProgressQuestions.length);
  const goalProgressLabel = goalCompletionPercent >= 75 ? "On track" : goalCompletionPercent >= 40 ? "Building momentum" : goalCompletionPercent > 0 ? "Early progress" : "Not yet moving";
  const renderedOverallRiskScore = typeof result?.overallRiskScore === "number"
    ? result.overallRiskScore
    : result?.sectionScores?.length
      ? Math.round(result.sectionScores.reduce((sum, section) => sum + (100 - section.percentage), 0) / result.sectionScores.length)
      : 0;
  const renderedOverallRiskLevel = result?.overallRiskLevel ?? getFallbackRiskLevel(renderedOverallRiskScore);
  const renderedGoalProgressPercent = goalCompletionPercent;
  const renderedGoalAchievedAmount = totalCurrentAmount;
  const renderedGoalTargetAmount = totalGoalAmount;
  const overallRiskZone = getRiskZone(renderedOverallRiskScore);

  if (displayGoals.length === 0) {
    return (
      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-[16px] py-[14px] shrink-0 rounded-t-[20px] dark:border-slate-800 dark:bg-slate-950 sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Financial Growth Tracker</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">Behavioral-finance assessment</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-[18px] sm:p-[22px]">
          <section className="rounded-[24px] border border-[#dfebe8] bg-[linear-gradient(135deg,#effdf8_0%,#ebfaf5_52%,#ffffff_100%)] p-[20px] sm:p-[24px]">
            <h1 className="font-serif text-[29px] leading-[1.1] text-[#0e2d2c]">Add at least one goal to unlock your behavioral growth mirror.</h1>
            <p className="mt-[10px] max-w-[760px] text-[13px] leading-[1.7] text-[#335654]">
              This assessment connects psychology with your real targets. Once a goal is added in the goals panel, this test can map behavior to achievability.
            </p>
            <div className="mt-[14px] flex flex-wrap gap-[8px]">
              <button type="button" onClick={onBackToCatalog} className="h-[40px] rounded-[12px] bg-[#0f766e] px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.22)]">Back to tests</button>
              <button type="button" onClick={handleOpenAssistant} className="h-[40px] rounded-[12px] border border-[#b8ded7] bg-white px-[14px] text-[12px] font-semibold text-[#0f5c56]">Ask FinHeal to help set a goal</button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (storageState.completed && result) {
    return (
      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-[16px] py-[14px] shrink-0 rounded-t-[20px] dark:border-slate-800 dark:bg-slate-950 sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Financial Growth Tracker Results</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">A psychological mirror of how your current behavior supports your future.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <section className="rounded-[24px] border border-[#d3e9e2] bg-[linear-gradient(120deg,#f4fffb_0%,#e9faf4_56%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(15,118,110,0.10)] sm:p-[24px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#4e7873]">Behavioral-finance identity</div>
            <h1 className="mt-[6px] font-serif text-[30px] leading-[1.08] text-[#103634]">{result.archetype}</h1>
            <p className="mt-[10px] max-w-[760px] text-[13px] leading-[1.75] text-[#365d5a]">{result.archetypeSummary}</p>
            <p className="mt-[8px] text-[12px] leading-[1.7] text-[#3f6964]">You are currently tracking {displayGoals.length} active goals worth {formatMoney(totalGoalAmount, currencyCode)}.</p>
          </section>

          <section className="mt-[14px] grid gap-[10px] sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">Goal Achievability</div>
              <div className="mt-[4px] font-serif text-[28px] text-gray-900 dark:text-slate-100">{animatedAchievability}</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">Financial Discipline</div>
              <div className="mt-[4px] font-serif text-[28px] text-gray-900 dark:text-slate-100">{animatedDiscipline}</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">Emotional Spending Meter</div>
              <div className="mt-[4px] font-serif text-[28px] text-gray-900 dark:text-slate-100">{animatedEmotion}</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">Goal Progress</div>
              <div className="mt-[4px] font-serif text-[28px] text-gray-900 dark:text-slate-100">{renderedGoalProgressPercent}%</div>
              <div className="mt-[4px] text-[11px] text-gray-500 dark:text-slate-400">
                {formatMoney(renderedGoalAchievedAmount, currencyCode)} of {formatMoney(renderedGoalTargetAmount, currencyCode)} achieved
              </div>
            </div>
          </section>

          <section className="mt-[12px] grid gap-[12px] lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Core behavior meters</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Discipline, emotional control, and resilience signals that influence your goal timeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                <Meter label="Discipline meter" value={result.financialDisciplineScore} accent="from-[#0f766e] to-[#34a49a]" />
                <Meter label="Emotional spending meter" value={result.emotionalSpendingMeter} accent="from-[#0e7490] to-[#22b8cf]" />
                <Meter label="Financial resilience meter" value={result.financialResilienceMeter} accent="from-[#1d4ed8] to-[#60a5fa]" />
                <Meter label="Goal achievability meter" value={result.goalAchievabilityScore} accent="from-[#6d28d9] to-[#a78bfa]" />
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Spending psychology profile</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">{result.profile.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                <div className="rounded-[16px] border border-gray-200 bg-gray-50 px-[12px] py-[11px] text-[12px] leading-[1.75] text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {result.profile.summary}
                </div>
                {result.profile.dominantDrivers.map((driver) => (
                  <div key={driver} className="rounded-[14px] border border-[#d2ebe7] bg-[#f4fcf9] px-[11px] py-[9px] text-[12px] text-[#265954] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {driver}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[12px] grid gap-[12px] lg:grid-cols-2">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Risk scale</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">A straight scale from low to high so you can instantly see your zone.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                <div className={`rounded-[18px] border bg-gray-50 p-[14px] dark:bg-slate-900 ${overallRiskZone.borderClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Overall risk zone</div>
                      <div className={`mt-[4px] text-[18px] font-semibold ${overallRiskZone.textClass}`}>{overallRiskZone.label}</div>
                    </div>
                    <div className={`rounded-full border px-[10px] py-[5px] text-[11px] font-semibold ${getRiskToneClass(renderedOverallRiskLevel)}`}>
                      {renderedOverallRiskScore}/100
                    </div>
                  </div>

                  <div className="relative mt-[14px]">
                    <div className="flex h-[16px] overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                      <div className="h-full flex-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <div className="h-full flex-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                      <div className="h-full flex-1 bg-gradient-to-r from-rose-500 to-red-500" />
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
                      <div
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${renderedOverallRiskScore}%` }}
                      >
                        <div className={`h-[22px] w-[22px] rounded-full border-2 border-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] ${overallRiskZone.markerClass}`} />
                        <div className={`absolute left-1/2 top-[-34px] -translate-x-1/2 rounded-full border px-[8px] py-[4px] text-[10px] font-semibold whitespace-nowrap ${getRiskToneClass(renderedOverallRiskLevel)}`}>
                          {renderedOverallRiskLevel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-[10px] flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="rounded-[16px] border border-dashed border-gray-200 bg-white px-[12px] py-[11px] text-[12px] leading-[1.7] text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  Your risk score is shown on the scale above. Low sits in green, medium in orange, and high in red, with the marker showing the exact zone.
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Strength areas</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">What is already working in your favor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[9px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
                {result.strengthAreas.map((item) => (
                  <div key={item} className="rounded-[16px] border border-cyan-100 bg-cyan-50 px-[12px] py-[11px] text-[12px] leading-[1.7] text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-100">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[12px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Personalized behavioral recommendations</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Gentle, practical experiments to better align behavior with your goals.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px] md:grid-cols-2">
                {result.recommendations.map((recommendation) => (
                  <div key={recommendation} className="rounded-[16px] border border-gray-200 bg-gray-50 px-[12px] py-[11px] text-[12px] leading-[1.75] text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {recommendation}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[12px] grid gap-[10px] sm:grid-cols-2 lg:grid-cols-4">
            {result.sectionScores.map((section) => (
              <div key={section.sectionId} className="rounded-[16px] border border-gray-200 bg-gray-50 p-[12px] dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">{section.title}</div>
                <div className="mt-[5px] text-[21px] font-serif text-gray-900 dark:text-slate-100">{section.percentage}%</div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400">{section.score}/{section.max}</div>
              </div>
            ))}
          </section>

          <section className="mt-[14px] flex flex-wrap gap-[8px]">
            <button type="button" onClick={handleRestart} className="h-[40px] rounded-[12px] bg-[#0f766e] px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.22)]">Retake assessment</button>
            <button type="button" onClick={handleOpenAssistant} className="h-[40px] rounded-[12px] border border-[#baded8] bg-[#f5fcfa] px-[14px] text-[12px] font-semibold text-[#0e5e57]">Talk to Financial Wellness Assistant</button>
            <button type="button" onClick={onBackToCatalog} className="h-[40px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Back to tests</button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center gap-3 px-[16px] py-[14px] sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Financial Growth Tracker</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">Behavioral-finance assessment linked to your real goals.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>
        <div className="px-[16px] pb-[13px] sm:px-[20px] sm:pb-[12px]">
          <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-slate-400">
            <span>Question {questionNumber} of {goalProgressQuestions.length}</span>
            <span>{progressPercent}% complete • {formatTimer(remainingSeconds)} left</span>
          </div>
          <div className="mt-[8px] h-[8px] rounded-full bg-gray-100 dark:bg-slate-900">
            <div className="h-full rounded-full bg-gradient-to-r from-[#0f766e] via-[#0e7490] to-[#2563eb] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        <section className="rounded-[24px] border border-[#d6ebe4] bg-[linear-gradient(120deg,#f6fff9_0%,#ebf8f4_56%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(15,118,110,0.08)] sm:p-[24px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#527f79]">Goal-aligned behavioral mirror</div>
          <h1 className="mt-[6px] font-serif text-[30px] leading-[1.08] text-[#103634]">Does your current money behavior match the future you want?</h1>
          <p className="mt-[10px] max-w-[780px] text-[13px] leading-[1.75] text-[#37625d]">
            You are currently building {displayGoals.length} goals worth {formatMoney(totalGoalAmount, currencyCode)}. This check reads mindset, discipline, emotional control, and habits behind {firstGoalName}.
          </p>
          <div className="mt-[12px] flex flex-wrap gap-[8px] text-[11px]">
            <span className="rounded-[999px] border border-[#c7e4dc] bg-white px-[10px] py-[5px] text-[#2a655f]">Psychology + finance</span>
            <span className="rounded-[999px] border border-[#c7e4dc] bg-white px-[10px] py-[5px] text-[#2a655f]">Safe and non-judgmental</span>
            <span className="rounded-[999px] border border-[#c7e4dc] bg-white px-[10px] py-[5px] text-[#2a655f]">Actionable outcome</span>
          </div>
        </section>

        <section className="mt-[12px] grid gap-[10px] sm:grid-cols-3">
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[12px] dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[10px] uppercase tracking-[0.7px] text-gray-400">Active goals</div>
            <div className="mt-[4px] text-[22px] font-serif text-gray-900 dark:text-slate-100">{displayGoals.length}</div>
          </div>
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[12px] dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[10px] uppercase tracking-[0.7px] text-gray-400">Goal amount</div>
            <div className="mt-[4px] text-[22px] font-serif text-gray-900 dark:text-slate-100">{formatMoney(totalGoalAmount, currencyCode)}</div>
          </div>
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[12px] dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[10px] uppercase tracking-[0.7px] text-gray-400">Current completion</div>
              <div className="mt-[4px] text-[22px] font-serif text-gray-900 dark:text-slate-100">{goalCompletionPercent}%</div>
              <div className="mt-[2px] text-[11px] text-gray-500 dark:text-slate-400">{goalProgressLabel}</div>
          </div>
        </section>

        <section className="mt-[12px]">
          <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-300 dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">{goalProgressSectionMeta.find((section) => section.id === currentQuestion?.sectionId)?.title ?? "Section"}</div>
                  <CardTitle className="mt-[4px] text-[19px] leading-[1.5] text-gray-900 dark:text-slate-100">{currentQuestion?.prompt}</CardTitle>
                </div>
                <span className="rounded-[999px] border border-gray-200 bg-gray-50 px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {answeredCount}/{goalProgressQuestions.length}
                </span>
              </div>
              <CardDescription className="text-[12px] leading-[1.7] text-gray-600 dark:text-slate-400">
                Choose the option that feels most real. There are no wrong answers here, only pattern visibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[14px] sm:px-[18px]">
              {currentQuestion?.options.map((option) => (
                <OptionButton
                  key={option.label}
                  label={option.label}
                  selected={currentAnswer === option.label}
                  onClick={() => handleSelectOption(currentQuestion.id, option.label)}
                />
              ))}
            </CardContent>
          </Card>
        </section>

        {validationMessage && (
          <section className="mt-[11px] rounded-[16px] border border-amber-200 bg-amber-50 px-[14px] py-[11px] text-[12px] leading-[1.7] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            {validationMessage}
          </section>
        )}

        <section className="mt-[12px] grid gap-[12px] lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-[#d5e9e3] shadow-[0_14px_34px_rgba(15,118,110,0.10)] dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
              <div className="text-[12px] text-gray-600 dark:text-slate-300">Move at your own pace. This assessment is designed for reflection, not perfection.</div>
              <div className="flex flex-wrap gap-[8px]">
                <button type="button" onClick={handleBack} disabled={storageState.stepIndex === 0} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Back</button>
                <button type="button" onClick={handleContinue} disabled={!currentAnswer} className="h-[38px] rounded-[12px] bg-[#0f766e] px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.22)] disabled:cursor-not-allowed disabled:opacity-60">{storageState.stepIndex === goalProgressQuestions.length - 1 ? "Reveal my profile" : "Continue"}</button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="px-[16px] py-[16px] sm:px-[18px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Live preview</div>
              <div className="mt-[4px] text-[14px] font-semibold text-gray-900 dark:text-slate-100">Goal Achievability: {liveResult.goalAchievabilityScore}</div>
              <div className="mt-[2px] text-[12px] text-gray-600 dark:text-slate-400">Discipline: {liveResult.financialDisciplineScore} • Emotional spending: {liveResult.emotionalSpendingMeter}</div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-[12px] grid gap-[8px] sm:grid-cols-2 lg:grid-cols-3">
          {goalProgressSectionMeta.map((section) => {
            const sectionQuestions = goalProgressQuestions.filter((question) => question.sectionId === section.id);
            const completedCount = sectionQuestions.filter((question) => storageState.answers[question.id]).length;
            const sectionPercent = Math.round((completedCount / sectionQuestions.length) * 100);

            return (
              <div key={section.id} className="rounded-[14px] border border-gray-200 bg-gray-50 px-[11px] py-[10px] dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-400 dark:text-slate-400">{section.title}</div>
                <div className="mt-[4px] flex items-center justify-between gap-3 text-[11px] text-gray-600 dark:text-slate-300">
                  <span>{section.subtitle}</span>
                  <span className="font-semibold">{sectionPercent}%</span>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
