import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  financialLiteracyLevelDurationMinutes,
  financialLiteracyLevelIds,
  financialLiteracyLevels,
  financialLiteracyQuestionsByLevel,
  financialLiteracyStorageVersion,
  type AnswerLetter,
  type FinancialLiteracyLevelId,
  type FinancialLiteracyQuestion,
} from "@/features/financial-literacy/financialLiteracyConfig";
import {
  calculateFinancialLiteracyResult,
  type FinancialLiteracyAttempt,
  type FinancialLiteracyHistoryAttempt,
  type FinancialLiteracyAnswers,
  type FinancialLiteracyResult,
} from "@/features/financial-literacy/financialLiteracyScoring";
import { submitWellnessTestResult } from "@/lib/backendChat";

interface FinancialLiteracyAssessmentProps {
  userId: string;
  isGuest?: boolean;
  onLoginRequired?: () => void;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onBackToCatalog: () => void;
}

type AssessmentStage = "selection" | "quiz" | "review" | "results";

type AssessmentStorage = {
  version: number;
  selectedLevel: FinancialLiteracyLevelId;
  currentAttempt: FinancialLiteracyAttempt | null;
  history: FinancialLiteracyHistoryAttempt[];
};

const STORAGE_PREFIX = "finheal_financial_literacy_assessment";

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

function getLevelMeta(levelId: FinancialLiteracyLevelId) {
  return financialLiteracyLevels.find((level) => level.id === levelId)!;
}

function getQuestionSequence(levelId: FinancialLiteracyLevelId, questionIds?: string[]) {
  const levelQuestions = financialLiteracyQuestionsByLevel[levelId];
  if (!questionIds || questionIds.length === 0) {
    return shuffleArray(levelQuestions).map((question) => question.id);
  }

  return questionIds.filter((id) => levelQuestions.some((question) => question.id === id));
}

function isValidAttemptStage(stage: string | undefined): stage is FinancialLiteracyAttempt["stage"] {
  return stage === "quiz" || stage === "review" || stage === "results";
}

function normalizeAttempt(attempt: Partial<FinancialLiteracyAttempt> | null | undefined) {
  if (!attempt || attempt.levelId !== 1 && attempt.levelId !== 2 && attempt.levelId !== 3) {
    return null;
  }

  const questionIds = getQuestionSequence(attempt.levelId, Array.isArray(attempt.questionIds) ? attempt.questionIds : undefined);
  const expectedCount = financialLiteracyQuestionsByLevel[attempt.levelId].length;
  const currentQuestionIndex = typeof attempt.currentQuestionIndex === "number" && Number.isFinite(attempt.currentQuestionIndex)
    ? Math.max(0, Math.min(attempt.currentQuestionIndex, Math.max(0, questionIds.length - 1)))
    : 0;

  if (questionIds.length !== expectedCount) {
    return null;
  }

  return {
    attemptId: typeof attempt.attemptId === "string" ? attempt.attemptId : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    levelId: attempt.levelId,
    questionIds,
    currentQuestionIndex,
    answers: attempt.answers ?? {},
    startedAt: typeof attempt.startedAt === "string" ? attempt.startedAt : new Date().toISOString(),
    updatedAt: typeof attempt.updatedAt === "string" ? attempt.updatedAt : new Date().toISOString(),
    submittedAt: typeof attempt.submittedAt === "string" ? attempt.submittedAt : null,
    stage: isValidAttemptStage(attempt.stage) ? attempt.stage : "quiz",
  } satisfies FinancialLiteracyAttempt;
}

function createAttempt(levelId: FinancialLiteracyLevelId): FinancialLiteracyAttempt {
  const now = new Date().toISOString();
  return {
    attemptId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    levelId,
    questionIds: getQuestionSequence(levelId),
    currentQuestionIndex: 0,
    answers: {},
    startedAt: now,
    updatedAt: now,
    submittedAt: null,
    stage: "quiz",
  };
}

function readStorage(userId: string): AssessmentStorage {
  if (typeof window === "undefined") {
    return {
      version: financialLiteracyStorageVersion,
      selectedLevel: 1,
      currentAttempt: null,
      history: [],
    };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return {
        version: financialLiteracyStorageVersion,
        selectedLevel: 1,
        currentAttempt: null,
        history: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<AssessmentStorage>;
    if (parsed.version !== financialLiteracyStorageVersion) {
      return {
        version: financialLiteracyStorageVersion,
        selectedLevel: 1,
        currentAttempt: null,
        history: [],
      };
    }

    const normalizedAttempt = normalizeAttempt(parsed.currentAttempt ?? null);

    return {
      version: financialLiteracyStorageVersion,
      selectedLevel: parsed.selectedLevel ?? 1,
      currentAttempt: normalizedAttempt,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return {
      version: financialLiteracyStorageVersion,
      selectedLevel: 1,
      currentAttempt: null,
      history: [],
    };
  }
}

function writeStorage(userId: string, value: AssessmentStorage) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(value));
  } catch {
    // Ignore storage quota or permission errors.
  }
}

function getTimerLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function findQuestion(levelId: FinancialLiteracyLevelId, questionId: string) {
  return financialLiteracyQuestionsByLevel[levelId].find((question) => question.id === questionId)!;
}

function getAttemptProgress(attempt: FinancialLiteracyAttempt) {
  const answered = Object.keys(attempt.answers).length;
  const total = attempt.questionIds.length;
  return {
    answered,
    total,
    remaining: Math.max(0, total - answered),
    completed: total > 0 ? Math.round((answered / total) * 100) : 0,
  };
}

function LevelCard({
  levelId,
  selected,
  attemptedResult,
  locked,
  onSelect,
  onStart,
}: {
  levelId: FinancialLiteracyLevelId;
  selected: boolean;
  attemptedResult: FinancialLiteracyResult | null;
  locked: boolean;
  onSelect: (levelId: FinancialLiteracyLevelId) => void;
  onStart: (levelId: FinancialLiteracyLevelId) => void;
}) {
  const meta = getLevelMeta(levelId);
  const latestScore = attemptedResult?.percentageScore ?? 0;
  const attempts = attemptedResult ? 1 : 0;
  const primaryActionLabel = selected ? "Start Test" : "Choose";

  return (
    <div
      onClick={() => {
        if (!locked && !selected) {
          onSelect(levelId);
        }
      }}
      className={`text-left rounded-[22px] border p-[18px] shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] ${
        locked
          ? "border-dashed border-gray-200 bg-gray-50 opacity-80 cursor-not-allowed hover:translate-y-0 hover:shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
          : selected ? "border-primary bg-[#f6f7fe]" : "border-gray-200 bg-white cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.8px] text-gray-400">{meta.badge}</div>
          <div className="mt-[6px] text-[20px] font-serif text-gray-900">{meta.name}</div>
        </div>
        <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] text-[11px] font-semibold text-gray-600">
          {meta.difficulty}
        </span>
      </div>

      <p className="mt-[10px] text-[13px] leading-[1.7] text-gray-600">{meta.description}</p>

      <div className="mt-[12px] flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600">
        <span className="rounded-[999px] bg-[#eef0fd] px-[10px] py-[5px] text-primary">{meta.questionCount} MCQs</span>
        <span className="rounded-[999px] bg-gray-100 px-[10px] py-[5px]">{meta.estimatedMinutes} min</span>
        <span className="rounded-[999px] bg-gray-100 px-[10px] py-[5px]">{meta.goal}</span>
      </div>

      <div className="mt-[14px] rounded-[16px] border border-gray-200 bg-gray-50 p-[12px]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Skills covered</div>
        <div className="mt-[6px] flex flex-wrap gap-[6px]">
          {meta.skills.map((skill) => (
            <span key={skill} className="rounded-[999px] bg-white px-[9px] py-[4px] text-[11px] text-gray-600 shadow-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-[14px] grid gap-[8px] sm:grid-cols-2">
        <div className="rounded-[14px] border border-gray-200 bg-gray-50 p-[10px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Progress</div>
          <div className="mt-[4px] text-[15px] font-semibold text-gray-900">{attempts > 0 ? `Attempted` : "Not started"}</div>
        </div>
        <div className="rounded-[14px] border border-gray-200 bg-gray-50 p-[10px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Latest score</div>
          <div className="mt-[4px] text-[15px] font-semibold text-gray-900">{attempts > 0 ? `${latestScore}%` : "--"}</div>
        </div>
      </div>

      <div className="mt-[14px] flex items-center justify-between gap-3 rounded-[14px] border border-dashed border-gray-200 bg-white px-[12px] py-[10px]">
        <div className="text-[12px] text-gray-500">
          {(() => {
            if (locked) {
              if (levelId === 3) return "Locked until intermediate is passed with 85%";
              if (levelId === 2) return "Locked until beginner is passed with 85%";
              return "Locked";
            }
            if (selected) return "Ready to start the test";
            if (attempts > 0) return "You can review or retake this level";
            return "Start here or skip ahead";
          })()}
        </div>
        <button
          type="button"
          disabled={locked}
          onClick={(event) => {
            event.stopPropagation();
            if (locked) {
              return;
            }

            if (selected) {
              onStart(levelId);
              return;
            }

            onSelect(levelId);
          }}
          className={`rounded-[999px] px-[12px] py-[6px] text-[11px] font-semibold shadow-[0_8px_20px_rgba(50,68,230,0.18)] transition ${
            locked
              ? "bg-gray-200 text-gray-600 shadow-none cursor-not-allowed"
              : selected
                ? "bg-primary text-white cursor-pointer hover:opacity-90"
                : "bg-primary/10 text-primary cursor-pointer hover:bg-primary/15"
          }`}
        >
          {locked ? "Locked" : primaryActionLabel}
        </button>
        </div>
      </div>
  );
}

export default function FinancialLiteracyAssessment({ userId, isGuest = false, onLoginRequired, onToggleSidebar, onToggleInsights, onBackToCatalog }: FinancialLiteracyAssessmentProps) {
  const [storageState, setStorageState] = useState<AssessmentStorage>(() => readStorage(userId));
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [displayScore, setDisplayScore] = useState(0);
  const [submittedAttemptIds, setSubmittedAttemptIds] = useState<Record<string, boolean>>({});
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    const stored = readStorage(userId);
    setStorageState(stored);
  }, [userId]);

  useEffect(() => {
    writeStorage(userId, storageState);
  }, [storageState, userId]);

  const currentAttempt = storageState.currentAttempt;
  const selectedLevel = storageState.selectedLevel;
  const currentLevel = currentAttempt?.levelId ?? selectedLevel;
  const currentLevelMeta = getLevelMeta(currentLevel);

  const orderedQuestions = useMemo(() => {
    if (!currentAttempt) {
      return financialLiteracyQuestionsByLevel[selectedLevel];
    }

    return currentAttempt.questionIds
      .map((questionId) => findQuestion(currentAttempt.levelId, questionId))
      .filter(Boolean);
  }, [currentAttempt, selectedLevel]);

  const stage: AssessmentStage = currentAttempt?.stage ?? "selection";
  const startedAt = currentAttempt?.startedAt ?? null;
  const elapsedSeconds = useMemo(() => {
    if (!startedAt) {
      return 0;
    }

    return Math.max(0, Math.floor((nowTs - new Date(startedAt).getTime()) / 1000));
  }, [nowTs, startedAt]);
  const totalTimeSeconds = financialLiteracyLevelDurationMinutes * 60;
  const remainingSeconds = Math.max(0, totalTimeSeconds - elapsedSeconds);
  const isTimeExpired = Boolean(currentAttempt && currentAttempt.stage !== "results" && remainingSeconds <= 0);

  useEffect(() => {
    if (!currentAttempt || currentAttempt.stage === "results") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [currentAttempt]);

  const currentResult = useMemo(() => {
    if (!currentAttempt) {
      return null;
    }

    return calculateFinancialLiteracyResult(currentAttempt, storageState.history);
  }, [currentAttempt, storageState.history]);

  useEffect(() => {
    if (!isTimeExpired || !currentAttempt) {
      return;
    }

    handleSubmitAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeExpired, currentAttempt]);

  useEffect(() => {
    if (stage === "results" && currentResult) {
      setDisplayScore(0);
      const target = currentResult.percentageScore;
      const animationDuration = 900;
      const start = performance.now();

      const animate = (time: number) => {
        const progress = Math.min(1, (time - start) / animationDuration);
        setDisplayScore(Math.round(target * progress));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [stage, currentResult?.percentageScore]);

  useEffect(() => {
    if (!currentAttempt || stage !== "results" || !currentResult) {
      return;
    }

    const attemptId = currentAttempt.attemptId;
    if (!attemptId || submittedAttemptIds[attemptId]) {
      return;
    }

    const run = async () => {
      try {
        await submitWellnessTestResult({
          user_id: userId,
          test_type: "financial_literacy",
          raw_score: currentResult.percentageScore,
          normalized_score: currentResult.percentageScore,
          completed_at: currentAttempt.submittedAt ?? currentAttempt.updatedAt,
          insights: currentResult.behavioralInsights,
          category_breakdown: {
            levelId: currentAttempt.levelId,
            correctAnswers: currentResult.rawScore,
            totalQuestions: currentResult.totalQuestions,
          },
        });
        setSubmittedAttemptIds((current) => ({ ...current, [attemptId]: true }));
      } catch (error) {
        console.error("Failed to submit financial literacy result to wellness engine", error);
      }
    };

    void run();
  }, [currentAttempt, currentResult, stage, submittedAttemptIds, userId]);

  const unlockState = useMemo(() => {
    const beginnerAttempts = storageState.history.filter((attempt) => attempt.levelId === 1 && attempt.stage === "results");
    const bestBeginnerScore = beginnerAttempts.reduce((best, attempt) => {
      const result = calculateFinancialLiteracyResult(attempt, []);
      return Math.max(best, result.percentageScore);
    }, 0);

    const intermediateAttempts = storageState.history.filter((attempt) => attempt.levelId === 2 && attempt.stage === "results");
    const bestIntermediateScore = intermediateAttempts.reduce((best, attempt) => {
      const result = calculateFinancialLiteracyResult(attempt, []);
      return Math.max(best, result.percentageScore);
    }, 0);

    const beginnerPassed = bestBeginnerScore > 85;
    const intermediatePassed = bestIntermediateScore > 85;
    const advancedPassed = intermediatePassed;
    const unlockedLevels: FinancialLiteracyLevelId[] = [1 as FinancialLiteracyLevelId];
    if (beginnerPassed) {
      unlockedLevels.push(2 as FinancialLiteracyLevelId);
    }
    if (advancedPassed) {
      unlockedLevels.push(3 as FinancialLiteracyLevelId);
    }
    return {
      beginnerPassed,
      intermediatePassed,
      advancedPassed,
      unlockedLevels: new Set<FinancialLiteracyLevelId>(unlockedLevels),
      bestBeginnerScore,
      bestIntermediateScore,
    };
  }, [storageState.history]);

  const attemptedResultsByLevel = useMemo(() => {
    const map = new Map<FinancialLiteracyLevelId, FinancialLiteracyResult>();
    for (const levelId of financialLiteracyLevelIds) {
      const latest = storageState.history.find((attempt) => attempt.levelId === levelId) ?? null;
      if (latest) {
        map.set(levelId, calculateFinancialLiteracyResult(latest, storageState.history));
      }
    }
    return map;
  }, [storageState.history]);

  function updateCurrentAttempt(patch: Partial<FinancialLiteracyAttempt>) {
    setStorageState((current) => {
      if (!current.currentAttempt) {
        return current;
      }

      return {
        ...current,
        currentAttempt: {
          ...current.currentAttempt,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }

  function handleSelectLevel(levelId: FinancialLiteracyLevelId) {
    if (isGuest && levelId !== 1) {
      setShowAuthPrompt(true);
      return;
    }
    if (!unlockState.unlockedLevels.has(levelId)) {
      return;
    }

    setStorageState((current) => ({
      ...current,
      selectedLevel: levelId,
    }));
  }

  function handleStartLevel(levelId: FinancialLiteracyLevelId) {
    if (isGuest && levelId !== 1) {
      setShowAuthPrompt(true);
      return;
    }
    if (!unlockState.unlockedLevels.has(levelId)) {
      return;
    }

    const nextAttempt = createAttempt(levelId);
    setStorageState((current) => ({
      ...current,
      selectedLevel: levelId,
      currentAttempt: nextAttempt,
    }));
  }

  function handleResumeAttempt() {
    if (!currentAttempt) {
      return;
    }

    setStorageState((current) => ({
      ...current,
      selectedLevel: currentAttempt.levelId,
      currentAttempt: {
        ...currentAttempt,
        stage: currentAttempt.stage === "results" ? "quiz" : currentAttempt.stage,
      },
    }));
  }

  function handleAnswer(questionId: string, answer: AnswerLetter) {
    if (!currentAttempt || currentAttempt.stage !== "quiz") {
      return;
    }

    setStorageState((current) => {
      if (!current.currentAttempt) {
        return current;
      }

      return {
        ...current,
        currentAttempt: {
          ...current.currentAttempt,
          answers: {
            ...current.currentAttempt.answers,
            [questionId]: answer,
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }

  function handleQuestionJump(index: number) {
    if (!currentAttempt) {
      return;
    }

    updateCurrentAttempt({ currentQuestionIndex: index });
  }

  function handleNextQuestion() {
    if (!currentAttempt) {
      return;
    }

    const progress = getAttemptProgress(currentAttempt);
    const isLastQuestion = currentAttempt.currentQuestionIndex >= currentAttempt.questionIds.length - 1;

    if (isLastQuestion) {
      if (progress.answered >= progress.total) {
        handleSubmitAttempt();
      } else {
        updateCurrentAttempt({ stage: "review" } as Partial<FinancialLiteracyAttempt>);
      }
      return;
    }

    const nextIndex = Math.min(currentAttempt.questionIds.length - 1, Math.max(0, currentAttempt.currentQuestionIndex + 1));
    updateCurrentAttempt({ currentQuestionIndex: nextIndex });
  }

  function handleBackQuestion() {
    if (!currentAttempt) {
      return;
    }

    const nextIndex = Math.max(0, currentAttempt.currentQuestionIndex - 1);
    updateCurrentAttempt({ currentQuestionIndex: nextIndex });
  }

  function handleOpenReview() {
    if (!currentAttempt) {
      return;
    }

    updateCurrentAttempt({ stage: "review" });
  }

  function handleSubmitAttempt() {
    setStorageState((current) => {
      if (!current.currentAttempt) {
        return current;
      }

      const finishedAttempt: FinancialLiteracyHistoryAttempt = {
        ...current.currentAttempt,
        stage: "results",
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...current,
        currentAttempt: finishedAttempt,
        history: [finishedAttempt, ...current.history.filter((attempt) => attempt.attemptId !== finishedAttempt.attemptId)].slice(0, 12),
      };
    });
  }

  function handleStopAttempt() {
    handleSubmitAttempt();
  }

  const stopConfirmDialog = (
    <ConfirmDeleteDialog
      isOpen={showStopConfirm}
      title="Stop Test"
      description="Stop the test and compute partial scoring for the answers you've provided so far?"
      onConfirm={() => {
        handleStopAttempt();
        setShowStopConfirm(false);
      }}
      onCancel={() => setShowStopConfirm(false)}
      confirmLabel="Stop"
      processingLabel="Stopping..."
    />
  );

  function handleStartNextLevel() {
    const nextLevel = Math.min(3, (currentAttempt?.levelId ?? selectedLevel) + 1) as FinancialLiteracyLevelId;
    handleStartLevel(nextLevel);
  }

  function handleRestartCurrentLevel() {
    const levelId = currentAttempt?.levelId ?? selectedLevel;
    handleStartLevel(levelId);
  }

  function handleExitToSelection() {
    setStorageState((current) => ({
      ...current,
      currentAttempt: null,
      selectedLevel: current.currentAttempt?.levelId ?? current.selectedLevel,
    }));
  }

  const progress = currentAttempt ? getAttemptProgress(currentAttempt) : null;
  const currentAttemptIndex = currentAttempt && orderedQuestions.length > 0 ? Math.min(Math.max(currentAttempt.currentQuestionIndex ?? 0, 0), orderedQuestions.length - 1) : 0;
  const currentQuestion = currentAttempt ? orderedQuestions[currentAttemptIndex] ?? orderedQuestions[0] : null;
  const currentAnswer = currentAttempt && currentQuestion ? currentAttempt.answers[currentQuestion.id] : null;
  const selectedLevelMeta = getLevelMeta(selectedLevel);

  if (stage === "selection") {
    return (
      <>
        {showAuthPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.2)] animate-scale-in">
              <div className="text-[32px] text-center mb-[12px]">🔒</div>
              <div className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign in required</div>
              <div className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
                Please sign in or create an account to unlock this level.
              </div>
              <div className="flex flex-col gap-[10px]">
                <button
                  onClick={() => {
                    setShowAuthPrompt(false);
                    onLoginRequired?.();
                  }}
                  className="h-[48px] w-full rounded-[14px] bg-primary text-white font-semibold text-[14px] hover:bg-[#1e2db8] transition cursor-pointer"
                >
                  Sign in / Create account
                </button>
                <button
                  onClick={() => {
                    setShowAuthPrompt(false);
                  }}
                  className="h-[48px] w-full rounded-[14px] border border-gray-200 text-gray-600 font-semibold text-[14px] hover:bg-gray-50 transition cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
        <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-[16px] py-[14px] shrink-0 rounded-t-[20px] dark:border-slate-800 dark:bg-slate-950 sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">
            ☰
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Financial Literacy Test</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">Choose a level to start a focused 10 minute assessment.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">
            ☰
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_48%,#020617_100%)]">
            <div className="absolute right-[-28px] top-[-28px] h-[120px] w-[120px] rounded-full bg-primary opacity-10" />
            <div className="relative z-10 max-w-[780px]">
              <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)] dark:bg-slate-900 dark:text-slate-200">
                Level selection
              </div>
              <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px] dark:text-slate-50">Financial Literacy Test</h1>
              <p className="mt-[10px] max-w-[720px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px] dark:text-slate-300">
                A calm, practical learning experience that helps people understand money decisions across budgeting, credit, investing, taxes, and long-term planning.
              </p>
              <div className="mt-[14px] flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600 dark:text-slate-300">
                <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] dark:border-slate-700 dark:bg-slate-900">3 levels</span>
                <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] dark:border-slate-700 dark:bg-slate-900">{selectedLevelMeta.questionCount} questions per level</span>
                <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] dark:border-slate-700 dark:bg-slate-900">10 minutes each</span>
                {/* <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] dark:border-slate-700 dark:bg-slate-900">
                  {unlockState.advancedPassed
                    ? "All levels unlocked"
                    : unlockState.beginnerPassed
                      ? "Intermediate unlocked; Advanced locked until Intermediate is 85%+"
                      : "Intermediate locked until Beginner is 85%+; Advanced locked until Intermediate is 85%+"}
                </span> */}
              </div>
            </div>
          </section>

          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
            {financialLiteracyLevelIds.map((levelId) => (
              <div key={levelId} className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">{getLevelMeta(levelId).name}</div>
                <div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{levelId}</div>
              </div>
            ))}
          </section>

          <section className="mt-[18px] grid gap-[12px] xl:grid-cols-3">
            {financialLiteracyLevelIds.map((levelId) => (
              <LevelCard
                key={levelId}
                levelId={levelId}
                selected={selectedLevel === levelId}
                attemptedResult={attemptedResultsByLevel.get(levelId) ?? null}
                locked={levelId === 2 ? !unlockState.beginnerPassed : levelId === 3 ? !unlockState.advancedPassed : false}
                onSelect={handleSelectLevel}
                onStart={handleStartLevel}
              />
            ))}
          </section>

          {/* Removed the 'Start selected level' and 'What you will get' info panels per request */}
        </div>
      </main>
      </>
    );
  }

  if (stage === "results" && currentResult) {
    return (
      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-[16px] py-[14px] shrink-0 rounded-t-[20px] dark:border-slate-800 dark:bg-slate-950 sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">
            ☰
          </button>
          <button type="button" onClick={onBackToCatalog} className="h-[32px] w-[32px] rounded-[6px] border border-gray-200 bg-white text-gray-700 flex items-center justify-center text-[16px] transition-all hover:bg-gray-50 shrink-0 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900" aria-label="Back to test catalog">
            ←
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Financial Literacy Test Results</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">Your finished attempt is saved locally for this user on this device.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">
            ☰
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_48%,#020617_100%)]">
            <div className="absolute right-[-28px] top-[-28px] h-[120px] w-[120px] rounded-full bg-primary opacity-10" />
            <div className="relative z-10 max-w-[780px]">
              <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)] dark:bg-slate-900 dark:text-slate-200">
                {currentResult.badge}
              </div>
              <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px] dark:text-slate-50">Your financial literacy score is ready.</h1>
              <p className="mt-[10px] max-w-[720px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px] dark:text-slate-300">{currentResult.summary}</p>
            </div>
          </section>

          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Score</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{displayScore}%</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Badge</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{currentResult.badge}</div>
            </div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Level</div>
              <div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{currentResult.levelName}</div>
            </div>
          </section>

          <section className="mt-[18px]">
            <Card className="overflow-hidden border-[#d4d8fa] shadow-[0_14px_34px_rgba(50,68,230,0.08)] dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="flex flex-col gap-[12px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Final score</div>
                  <div className="mt-[4px] text-[16px] font-semibold text-gray-900 dark:text-slate-100">{currentResult.rawScore} correct out of {currentResult.totalQuestions}</div>
                  <div className="mt-[2px] text-[12px] text-gray-500 dark:text-slate-400">Your result is saved locally and can be compared with the other two levels later.</div>
                </div>
                <div className="flex items-center gap-[10px] rounded-[16px] border border-gray-200 bg-gray-50 px-[14px] py-[10px] dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Accuracy</div>
                  <div className="text-[22px] font-serif text-gray-900 dark:text-slate-100">{displayScore}%</div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px] grid gap-[12px] lg:grid-cols-2">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Strength areas</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">What you already do well.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[8px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {currentResult.strengths.length > 0 ? currentResult.strengths.map((item) => (
                  <div key={item} className="rounded-[14px] bg-[#f0fdf4] px-[12px] py-[10px] text-[13px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{item}</div>
                )) : <div className="rounded-[14px] bg-gray-50 px-[12px] py-[10px] text-[13px] text-gray-600 dark:bg-slate-900 dark:text-slate-300">Keep practicing to unlock clear strengths.</div>}
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Improvement areas</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">The skills most worth strengthening next.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[8px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {currentResult.weakAreas.length > 0 ? currentResult.weakAreas.map((item) => (
                  <div key={item} className="rounded-[14px] bg-[#fff7ed] px-[12px] py-[10px] text-[13px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{item}</div>
                )) : <div className="rounded-[14px] bg-gray-50 px-[12px] py-[10px] text-[13px] text-gray-600 dark:bg-slate-900 dark:text-slate-300">No clear weak area detected on this attempt.</div>}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px] grid gap-[12px] lg:grid-cols-2">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Category scores</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Category-wise breakdown for this level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {currentResult.categoryScores.map((item) => (
                  <div key={item.category} className="rounded-[14px] border border-gray-200 bg-gray-50 p-[12px] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-gray-800 dark:text-slate-200">
                      <span>{item.label}</span>
                      <span>{item.score}/{item.max} ({item.percentage}%)</span>
                    </div>
                    <div className="mt-[8px] h-[8px] overflow-hidden rounded-[999px] bg-gray-200 dark:bg-slate-800">
                      <div className="h-full rounded-[999px] bg-primary" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Learning suggestions</CardTitle>
                <CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Practical next steps based on your result.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[8px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {currentResult.recommendations.map((item) => (
                  <div key={item} className="rounded-[14px] bg-gray-50 px-[12px] py-[10px] text-[13px] text-gray-700 dark:bg-slate-900 dark:text-slate-300">{item}</div>
                ))}
                {currentResult.behavioralInsights.map((item) => (
                  <div key={item} className="rounded-[14px] bg-[#eef0fd] px-[12px] py-[10px] text-[13px] text-primary dark:bg-primary/10 dark:text-slate-200">{item}</div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px] grid gap-[12px] lg:grid-cols-3">
            {currentResult.levelPerformance.map((item) => (
              <Card key={item.levelId} className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
                <CardContent className="px-[16px] py-[16px] sm:px-[18px]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">{item.levelName}</div>
                  <div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{item.latestPercentage}%</div>
                  <div className="mt-[4px] text-[12px] text-gray-500 dark:text-slate-400">{item.totalAttempts > 0 ? `Latest attempt, best ${item.bestScore}%` : "Not attempted yet"}</div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="mt-[18px] pb-[12px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                <div className="text-[12px] text-gray-600 dark:text-slate-300">Retake this level, start the next one, or go back to the catalog.</div>
                <div className="flex gap-[8px] flex-wrap">
                  <button type="button" onClick={handleRestartCurrentLevel} className="h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]">Retake level</button>
                  <button type="button" onClick={handleStartNextLevel} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Next level</button>
                  <button type="button" onClick={handleExitToSelection} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Level selection</button>
                  <button type="button" onClick={onBackToCatalog} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Back to tests</button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    );
  }

  if (currentAttempt && currentQuestion) {
    const questionNumber = currentAttempt.currentQuestionIndex + 1;
    return (
      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-[16px] py-[14px] shrink-0 rounded-t-[20px] dark:border-slate-800 dark:bg-slate-950 sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Financial Literacy Test</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">Level {currentAttempt.levelId} of 3 · {currentLevelMeta.name}</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <section className="sticky top-0 z-30 rounded-[20px] border border-[#d4d8fa] bg-white/95 p-[14px] shadow-[0_12px_30px_rgba(50,68,230,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
            <div className="flex flex-col gap-[10px] lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Progress</div>
                <div className="mt-[4px] text-[16px] font-semibold text-gray-900 dark:text-slate-100">Question {questionNumber} of {orderedQuestions.length}</div>
                <div className="mt-[2px] text-[12px] text-gray-500 dark:text-slate-400">{progress?.answered ?? 0} answered · {progress?.remaining ?? 0} remaining</div>
              </div>
              <div className="flex items-center gap-[10px] rounded-[16px] border border-gray-200 bg-gray-50 px-[14px] py-[10px] dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Time left</div>
                <div className="text-[22px] font-serif text-gray-900 dark:text-slate-100">{getTimerLabel(remainingSeconds)}</div>
              </div>
            </div>
            <div className="mt-[12px] h-[8px] overflow-hidden rounded-[999px] bg-gray-200 dark:bg-slate-800">
              <div className="h-full rounded-[999px] bg-primary transition-all duration-300" style={{ width: `${progress?.completed ?? 0}%` }} />
            </div>
            <div className="mt-[12px] flex gap-[6px] overflow-x-auto pb-[2px]">
              {orderedQuestions.map((item, index) => {
                const answered = Boolean(currentAttempt.answers[item.id]);
                const active = index === currentAttemptIndex;
                return (
                  <button key={item.id} type="button" onClick={() => handleQuestionJump(index)} className={`h-[34px] min-w-[34px] rounded-[999px] border text-[12px] font-semibold transition-all ${active ? "border-primary bg-primary text-white" : answered ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600"}`} aria-label={`Question ${index + 1}`}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-[18px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">{currentQuestion.category}</div>
                    <CardTitle className="mt-[4px] text-[18px] leading-[1.5] text-gray-900 dark:text-slate-100">{currentQuestion.prompt}</CardTitle>
                  </div>
                  <span className="rounded-[999px] border border-gray-200 bg-gray-50 px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    Level {currentAttempt.levelId}
                  </span>
                </div>
                <CardDescription className="text-[12px] leading-[1.7] text-gray-600 dark:text-slate-400">Pick the best answer. The test saves progress automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[16px] sm:px-[18px]">
                {currentQuestion.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index) as AnswerLetter;
                  const selected = currentAnswer === letter;
                  return (
                    <button key={option} type="button" onClick={() => handleAnswer(currentQuestion.id, letter)} className={`w-full rounded-[16px] border px-[14px] py-[14px] text-left transition-all ${selected ? "border-primary bg-[#eef0fd] shadow-[0_6px_18px_rgba(50,68,230,0.12)]" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`} aria-pressed={selected}>
                      <div className="flex items-start gap-[10px]">
                        <span className={`mt-[1px] flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>{letter}</span>
                        <span className="text-[13px] leading-[1.7] text-gray-700 dark:text-slate-200">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px] grid gap-[12px] lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="overflow-hidden border-[#d4d8fa] shadow-[0_14px_34px_rgba(50,68,230,0.08)] dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="flex flex-col gap-[10px] px-[16px] py-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
                <div className="text-[12px] text-gray-600 dark:text-slate-300">Use next/back to move through the level. You can review before submitting.</div>
                <div className="flex gap-[8px] flex-wrap">
                  <button type="button" onClick={handleBackQuestion} disabled={currentAttemptIndex === 0} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Back</button>
                  <button type="button" onClick={handleOpenReview} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Review</button>
                  <button type="button" onClick={() => setShowStopConfirm(true)} className="h-[38px] rounded-[12px] border border-rose-200 bg-white px-[14px] text-[12px] font-semibold text-rose-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-rose-50">Stop test</button>
                  <button type="button" onClick={handleNextQuestion} className="h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]">{currentAttemptIndex === orderedQuestions.length - 1 ? "Finish" : "Next"}</button>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="px-[16px] py-[16px] sm:px-[18px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Saved locally</div>
                <div className="mt-[4px] text-[15px] font-semibold text-gray-900 dark:text-slate-100">Progress updates automatically.</div>
                <div className="mt-[2px] text-[12px] text-gray-500 dark:text-slate-400">You can leave and return later without losing your answers.</div>
              </CardContent>
            </Card>
          </section>
        </div>
        {stopConfirmDialog}
      </main>
    );
  }

  if (currentAttempt && currentAttempt.stage === "review" && currentQuestion) {
    const summary = getAttemptProgress(currentAttempt);
    return (
      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-[16px] py-[14px] shrink-0 rounded-t-[20px] dark:border-slate-800 dark:bg-slate-950 sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <button type="button" onClick={onBackToCatalog} className="h-[32px] w-[32px] rounded-[6px] border border-gray-200 bg-white text-gray-700 flex items-center justify-center text-[16px] transition-all hover:bg-gray-50 shrink-0 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900" aria-label="Back to test catalog">←</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Financial Literacy Test Review</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">Review every answer before submitting the level.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <section className="rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_48%,#020617_100%)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Final review</div>
            <h1 className="mt-[6px] font-serif text-[28px] leading-[1.1] text-gray-900 dark:text-slate-50">Check your answers before you submit.</h1>
            <p className="mt-[10px] max-w-[720px] text-[13px] leading-[1.7] text-gray-600 dark:text-slate-300">Answered {summary.answered} of {summary.total} questions. You can jump back to any question and change it.</p>
          </section>

          <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900"><div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Answered</div><div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{summary.answered}</div></div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900"><div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Remaining</div><div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{summary.remaining}</div></div>
            <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px] dark:border-slate-800 dark:bg-slate-900"><div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 dark:text-slate-400">Time left</div><div className="mt-[4px] text-[24px] font-serif text-gray-900 dark:text-slate-100">{getTimerLabel(remainingSeconds)}</div></div>
          </section>

          <section className="mt-[18px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]"><CardTitle className="text-[16px] text-gray-900 dark:text-slate-100">Question tracker</CardTitle><CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Tap any number to go back and change an answer.</CardDescription></CardHeader>
              <CardContent className="flex flex-wrap gap-[8px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {orderedQuestions.map((item, index) => {
                  const answered = Boolean(currentAttempt.answers[item.id]);
                  return (
                    <button key={item.id} type="button" onClick={() => handleQuestionJump(index)} className={`h-[34px] min-w-[34px] rounded-[999px] border text-[12px] font-semibold transition-all ${index === currentAttemptIndex ? "border-primary bg-primary text-white" : answered ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600"}`}>
                      {index + 1}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px]">
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px] sm:px-[18px]"><CardTitle className="text-[18px] text-gray-900 dark:text-slate-100">{currentQuestion.prompt}</CardTitle><CardDescription className="text-[12px] text-gray-600 dark:text-slate-400">Level {currentAttempt.levelId} · {currentQuestion.category}</CardDescription></CardHeader>
              <CardContent className="space-y-[10px] px-[16px] pb-[16px] pt-[16px] sm:px-[18px]">
                {currentQuestion.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index) as AnswerLetter;
                  const selected = currentAttempt.answers[currentQuestion.id] === letter;
                  return (
                    <button key={option} type="button" onClick={() => handleAnswer(currentQuestion.id, letter)} className={`w-full rounded-[16px] border px-[14px] py-[14px] text-left transition-all ${selected ? "border-primary bg-[#eef0fd]" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                      <div className="flex items-start gap-[10px]"><span className={`mt-[1px] flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>{letter}</span><span className="text-[13px] leading-[1.7] text-gray-700 dark:text-slate-200">{option}</span></div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          <section className="mt-[18px] flex flex-wrap gap-[8px]">
            <button type="button" onClick={handleBackQuestion} disabled={currentAttemptIndex === 0} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Back</button>
            <button type="button" onClick={() => updateCurrentAttempt({ stage: "quiz" } as Partial<FinancialLiteracyAttempt>)} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Return to quiz</button>
            <button type="button" onClick={() => setShowStopConfirm(true)} className="h-[38px] rounded-[12px] border border-rose-200 bg-white px-[14px] text-[12px] font-semibold text-rose-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-rose-50">Stop test</button>
            <button type="button" onClick={handleSubmitAttempt} className="h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]">Submit level</button>
          </section>
          {stopConfirmDialog}
        </div>
      </main>
    );
  }

  return null;
}
