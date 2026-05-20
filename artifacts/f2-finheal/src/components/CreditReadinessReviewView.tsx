import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  creditReadinessDurationMinutes,
  creditReadinessQuestions,
  creditReadinessSectionMeta,
  creditReadinessStorageVersion,
  creditReadinessMaximumScore,
  type CreditReadinessAnswerMap,
  type CreditReadinessQuestion,
} from '@/features/credit-readiness/creditReadinessConfig';
import { calculateCreditReadinessResult, type CreditReadinessResult, buildCreditRecommendations } from '@/features/credit-readiness/creditReadinessScoring';

interface CreditReadinessProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onBackToCatalog: () => void;
  onOpenFinancialWellnessAssistant?: () => void;
}

type ProgressState = {
  version: number;
  answers: CreditReadinessAnswerMap;
  stepIndex: number;
  result: CreditReadinessResult | null;
  completed: boolean;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

const STORAGE_PREFIX = 'finheal_credit_readiness';
const TARGET_SECONDS = creditReadinessDurationMinutes * 60;

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId || 'anonymous'}`;
}

function createEmptyState(): ProgressState {
  const now = new Date().toISOString();
  return { version: creditReadinessStorageVersion, answers: {}, stepIndex: 0, result: null, completed: false, startedAt: now, completedAt: null, updatedAt: now };
}

function readState(userId: string): ProgressState {
  if (typeof window === 'undefined') return createEmptyState();
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return createEmptyState();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (parsed.version !== creditReadinessStorageVersion) return createEmptyState();
    const answers = parsed.answers ?? {};
    const stepIndex = typeof parsed.stepIndex === 'number' ? Math.max(0, Math.min(parsed.stepIndex, creditReadinessQuestions.length)) : 0;
    const completed = Boolean(parsed.completed && parsed.result);
    return { version: creditReadinessStorageVersion, answers, stepIndex: completed ? creditReadinessQuestions.length : stepIndex, result: completed ? (parsed.result as CreditReadinessResult) ?? null : null, completed, startedAt: parsed.startedAt ?? new Date().toISOString(), completedAt: parsed.completedAt ?? null, updatedAt: parsed.updatedAt ?? new Date().toISOString() };
  } catch {
    return createEmptyState();
  }
}

function writeState(userId: string, state: ProgressState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const size = 140;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / max) * circumference;
  return (
    <div className="relative mx-auto flex w-fit items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2ff" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#06b6d4" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[12px] font-semibold text-gray-500">Credit Readiness</div>
        <div className="mt-1 text-[34px] font-serif text-gray-900">{score}</div>
        <div className="text-[11px] text-gray-500">of {max}</div>
      </div>
    </div>
  );
}

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group w-full rounded-[12px] border px-4 py-3 text-left transition ${selected ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 bg-white'}`} aria-pressed={selected}>
      <div className="flex items-center justify-between">
        <span className="leading-[1.4]">{label}</span>
        <span className={`rounded-full h-6 w-6 flex items-center justify-center ${selected ? 'bg-cyan-500 text-white' : 'border border-gray-300 text-transparent'}`}>✓</span>
      </div>
    </button>
  );
}

export default function CreditReadinessReviewView({ userId, onToggleSidebar, onToggleInsights, onBackToCatalog, onOpenFinancialWellnessAssistant }: CreditReadinessProps) {
  const [state, setState] = useState<ProgressState>(() => readState(userId));
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [displayScore, setDisplayScore] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => setState(readState(userId)), [userId]);
  useEffect(() => writeState(userId, state), [state, userId]);

  const currentQuestion = state.stepIndex < creditReadinessQuestions.length ? creditReadinessQuestions[state.stepIndex] : null;
  const answeredCount = useMemo(() => creditReadinessQuestions.reduce((c, q) => c + (state.answers[q.id] ? 1 : 0), 0), [state.answers]);
  const progressPercent = Math.round((Math.max(0, Math.min(state.stepIndex, creditReadinessQuestions.length)) / creditReadinessQuestions.length) * 100);
  const elapsedSeconds = useMemo(() => Math.max(0, Math.floor((nowTs - new Date(state.startedAt).getTime()) / 1000)), [nowTs, state.startedAt]);
  const remainingSeconds = Math.max(0, TARGET_SECONDS - elapsedSeconds);

  const currentResult = useMemo(() => state.result ?? (state.completed ? calculateCreditReadinessResult(state.answers) : null), [state.answers, state.completed, state.result]);

  useEffect(() => {
    if (!state.completed) {
      const id = window.setInterval(() => setNowTs(Date.now()), 1000);
      return () => window.clearInterval(id);
    }
    return undefined;
  }, [state.completed]);

  // auto-stop when time runs out
  useEffect(() => {
    if (state.completed) return;
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000));
    const remaining = Math.max(0, TARGET_SECONDS - elapsedSeconds);
    if (remaining <= 0) {
      const result = calculateCreditReadinessResult(state.answers);
      setState((s) => ({ ...s, result, completed: true, completedAt: new Date().toISOString(), stepIndex: creditReadinessQuestions.length, updatedAt: new Date().toISOString() }));
    }
  }, [nowTs, state.startedAt, state.completed]);

  const handleStopTest = useCallback(() => {
    const result = calculateCreditReadinessResult(state.answers);
    setState((s) => ({ ...s, result, completed: true, completedAt: new Date().toISOString(), stepIndex: creditReadinessQuestions.length, updatedAt: new Date().toISOString() }));
  }, [state.answers]);

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

  useEffect(() => {
    if (state.completed && currentResult) {
      setDisplayScore(0);
      const target = currentResult.rawScore;
      const start = performance.now();
      const duration = 900;
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setDisplayScore(Math.round(target * p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, [state.completed, currentResult?.rawScore]);

  const handleSelect = useCallback((questionId: string, label: string) => {
    setValidationMessage(null);
    setState((s) => ({ ...s, answers: { ...s.answers, [questionId]: label }, updatedAt: new Date().toISOString() }));
  }, []);

  const handleBack = useCallback(() => {
    setValidationMessage(null);
    setState((s) => {
      if (s.stepIndex === 0) {
        onBackToCatalog();
        return s;
      }

      return { ...s, stepIndex: s.stepIndex - 1, updatedAt: new Date().toISOString() };
    });
  }, [onBackToCatalog]);

  const handleContinue = useCallback(() => {
    if (!currentQuestion) return;
    const currentAnswer = state.answers[currentQuestion.id];
    if (!currentAnswer) { setValidationMessage('Please select an option to continue.'); return; }
    setValidationMessage(null);
    if (state.stepIndex < creditReadinessQuestions.length - 1) {
      setState((s) => ({ ...s, stepIndex: s.stepIndex + 1, updatedAt: new Date().toISOString() }));
      return;
    }
    const result = calculateCreditReadinessResult(state.answers);
    setState((s) => ({ ...s, result, completed: true, completedAt: new Date().toISOString(), stepIndex: creditReadinessQuestions.length, updatedAt: new Date().toISOString() }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('finheal:assessment-completed', { detail: { assessmentId: 'credit-readiness', score: result.rawScore, category: result.category } }));
    }
  }, [currentQuestion, state.answers, state.stepIndex]);

  const handleRestart = useCallback(() => { setState(createEmptyState()); setDisplayScore(0); setValidationMessage(null); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!state.completed && e.key === 'ArrowLeft' && state.stepIndex > 0) { e.preventDefault(); handleBack(); }
      if (!state.completed && (e.key === 'ArrowRight' || e.key === 'Enter')) { e.preventDefault(); handleContinue(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.completed, state.stepIndex, handleBack, handleContinue]);

  useEffect(() => { writeState(userId, state); }, [state, userId]);

  if (state.completed && currentResult) {
    return (
      <main className="flex-1 flex flex-col overflow-hidden rounded-[16px] border bg-white dark:bg-slate-950">
        <div className="p-4 border-b"><div className="font-bold">Credit Readiness Review Results</div></div>
        <div className="p-6 overflow-auto">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardContent><ScoreRing score={displayScore} max={creditReadinessMaximumScore} /><div className="mt-4 text-center"><div className="text-sm font-semibold">{currentResult.category}</div><div className="text-xs text-gray-500 mt-1">{currentResult.risk}</div><div className="mt-2 text-sm">{currentResult.summary}</div></div></CardContent></Card>
            <div className="space-y-4">
              <Card><CardContent><div className="text-sm font-semibold">Repayment reliability</div><div className="mt-2">{currentResult.repaymentReliability}</div></CardContent></Card>
              <Card><CardContent><div className="text-sm font-semibold">Utilization</div><div className="mt-2">{currentResult.utilizationLevel}</div></CardContent></Card>
              <Card><CardContent><div className="text-sm font-semibold">Borrowing dependency</div><div className="mt-2">{currentResult.borrowingDependency}</div></CardContent></Card>
            </div>
          </div>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Personalized recommendations</CardTitle><CardDescription>Actions to improve credit readiness</CardDescription></CardHeader><CardContent>{currentResult.recommendations.map((r) => <div key={r} className="p-3 rounded-md border mb-2">{r}</div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Insights</CardTitle><CardDescription>What stood out from your answers</CardDescription></CardHeader><CardContent>{currentResult.insights.map((ins) => <div key={ins.title} className="p-3 rounded-md border mb-2"><div className="font-semibold">{ins.title}</div><div className="text-sm text-gray-600">{ins.description}</div></div>)}</CardContent></Card>
          </section>

          <section className="mt-6"><Card><CardHeader><CardTitle>Key improvement areas</CardTitle></CardHeader><CardContent>{buildCreditRecommendations(state.answers).map((r) => <div key={r} className="p-3 rounded-md border mb-2">{r}</div>)}</CardContent></Card></section>

          <section className="mt-6 flex gap-3"><button onClick={handleRestart} className="px-4 py-2 rounded bg-cyan-500 text-white">Retake assessment</button><button onClick={onBackToCatalog} className="px-4 py-2 rounded border">Back to tests</button>{onOpenFinancialWellnessAssistant && <button onClick={onOpenFinancialWellnessAssistant} className="px-4 py-2 rounded border bg-cyan-50">Talk to assistant</button>}</section>
        </div>
      </main>
    );
  }

  const questionNumber = state.stepIndex + 1;

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center gap-3 px-[16px] py-[14px] sm:px-[20px] sm:py-[12px]">
          <button type="button" onClick={onToggleSidebar} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle sidebar">☰</button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">Credit Readiness Review</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">A calm 5 minute diagnostic for credit habits and repayment readiness.</div>
          </div>
          <button type="button" onClick={onToggleInsights} className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle insights panel">☰</button>
        </div>
        <div className="px-[16px] pb-[14px] sm:px-[20px] sm:pb-[12px]">
          <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-slate-400">
            <span>Question {questionNumber} of {creditReadinessQuestions.length}</span>
            <span>{progressPercent}% complete · {Math.max(0, Math.ceil(remainingSeconds / 60))}:{String(remainingSeconds % 60).padStart(2, '0')} left</span>
          </div>
          <div className="mt-[8px] h-[8px] rounded-full bg-gray-100 dark:bg-slate-900">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-[10px] py-[5px] text-[11px] font-semibold text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{currentResult?.category ?? 'Credit Readiness'}</span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-[10px] py-[5px] text-[11px] font-semibold text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{answeredCount} answered</span>
          </div>
        </div>
        {stopConfirmDialog}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        {currentQuestion && (
          <>
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[4px]">Question {questionNumber}</div>
                    <CardTitle className="text-[16px] leading-[1.5] text-gray-900 sm:text-[17px]">{currentQuestion.prompt}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-[10px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {currentQuestion.options.map((option) => (
                  <OptionButton
                    key={option.label}
                    label={option.label}
                    selected={state.answers[currentQuestion.id] === option.label}
                    onClick={() => handleSelect(currentQuestion.id, option.label)}
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

        <div className="mt-[18px] border-t border-gray-100 pt-[14px]">
          <div className="flex gap-[8px]">
            <button type="button" onClick={handleBack} className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-gray-50">
              {state.stepIndex === 0 ? 'Exit' : 'Back'}
            </button>
            <button type="button" onClick={() => setShowStopConfirm(true)} className="h-[38px] rounded-[12px] bg-rose-600 px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.18)] hover:bg-rose-700">
              Stop test
            </button>
            <button type="button" onClick={handleContinue} disabled={!currentQuestion || !state.answers[currentQuestion.id]} className="flex-1 h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
              {state.stepIndex === creditReadinessQuestions.length - 1 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
