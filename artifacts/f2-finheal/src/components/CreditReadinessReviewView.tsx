import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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

  const handleBack = useCallback(() => setState((s) => ({ ...s, stepIndex: Math.max(0, s.stepIndex - 1), updatedAt: new Date().toISOString() })), []);

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
    <main className="flex-1 flex flex-col overflow-hidden rounded-[16px] border bg-white dark:bg-slate-950">
      <div className="sticky top-0 z-10 bg-white p-3 border-b"><div className="flex items-center justify-between"><div className="font-bold">Credit Readiness Review</div><div className="text-sm text-gray-500">{progressPercent}% · {Math.max(0, Math.ceil(remainingSeconds / 60))} min</div></div></div>
      <div className="p-6 overflow-auto">
        <section><Card><CardHeader><div className="text-sm text-gray-500">Question {questionNumber}</div><CardTitle className="mt-2">{currentQuestion?.prompt}</CardTitle><CardDescription className="mt-2">Take your time — there are no right or wrong answers.</CardDescription></CardHeader><CardContent className="mt-4 space-y-3">{currentQuestion?.options.map((opt) => <OptionButton key={opt.label} label={opt.label} selected={state.answers[currentQuestion.id] === opt.label} onClick={() => handleSelect(currentQuestion.id, opt.label)} />)}</CardContent></Card></section>

        {validationMessage && <div className="mt-4 rounded p-3 bg-amber-50 border">{validationMessage}</div>}

        <section className="mt-6 flex items-center justify-between"><div className="flex gap-2"><button type="button" onClick={handleBack} disabled={state.stepIndex === 0} className="px-4 py-2 rounded border disabled:opacity-50">Back</button><button type="button" onClick={handleContinue} className="px-4 py-2 rounded bg-cyan-500 text-white">{state.stepIndex === creditReadinessQuestions.length - 1 ? 'Finish' : 'Continue'}</button></div><div className="text-sm text-gray-500">{answeredCount} answered</div></section>
      </div>
    </main>
  );
}
