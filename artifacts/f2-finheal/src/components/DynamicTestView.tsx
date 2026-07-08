import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestCard } from "./FinancialHealthTestCatalog";

interface DynamicTestViewProps {
  userId: string;
  testId: string;
  onBackToCatalog: () => void;
  onOpenFinancialWellnessAssistant?: () => void;
}

export default function DynamicTestView({
  userId,
  testId,
  onBackToCatalog,
  onOpenFinancialWellnessAssistant
}: DynamicTestViewProps) {
  const [test, setTest] = useState<TestCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz states
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
        const headers: Record<string, string> = {};
        if (configuredApiKey) {
          headers["Authorization"] = `Bearer ${configuredApiKey}`;
          headers["X-API-Key"] = configuredApiKey;
        }
        const res = await fetch(`${apiBase}/custom-tests/${testId}`, { headers });
        if (!res.ok) {
          throw new Error("Failed to load test details from server.");
        }
        const data = await res.json();
        setTest(data);
      } catch (err: any) {
        console.error("Error loading custom test:", err);
        setError(err.message || "Failed to load test.");
      } finally {
        setLoading(false);
      }
    };
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  const progressPercent = useMemo(() => {
    if (!test || !test.questions) return 0;
    return Math.round((stepIndex / test.questions.length) * 100);
  }, [test, stepIndex]);

  if (loading) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center bg-white min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <span className="text-[12px] text-gray-500 mt-3 font-semibold">Loading assessment...</span>
      </main>
    );
  }

  if (error || !test || !test.questions || test.questions.length === 0) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center bg-white p-6">
        <span className="text-[32px]">⚠️</span>
        <h3 className="text-[16px] font-bold text-gray-900 mt-2">Could Not Load Assessment</h3>
        <p className="text-[12px] text-gray-500 mt-1 max-w-[280px] text-center">
          {error || "This test doesn't contain any questions yet."}
        </p>
        <button
          onClick={onBackToCatalog}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-[10px] text-[12px] font-bold shadow-md hover:opacity-90"
        >
          Back to Tests Library
        </button>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <main className="dynamic-test-view flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm animate-fade-up delay-100 dark:border-slate-800 dark:bg-slate-950">
      {/* Sticky Header bar */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center gap-3 px-[16px] py-[14px] sm:px-[20px] sm:py-[12px]">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="h-[32px] w-[32px] rounded-[8px] border border-primary/20 bg-primary/5 text-primary flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-105 hover:bg-primary/10 active:scale-95 shrink-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Back to test catalog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px] dark:text-slate-100">{test.title}</div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400">{test.description || "Dynamic Wellness Diagnostic"}</div>
          </div>
        </div>
        {!completed && (
          <div className="px-[16px] pb-[14px] sm:px-[20px] sm:pb-[12px]">
            <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-slate-400">
              <span>Question {stepIndex + 1} of {test.questions.length}</span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="mt-[8px] h-[8px] rounded-full bg-gray-100 dark:bg-slate-900">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${test.accent} transition-all duration-300`} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-[10px] py-[5px] text-[11px] font-semibold text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {test.focus || "Dynamic Test"}
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-[10px] py-[5px] text-[11px] font-semibold text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {answeredCount} answered
              </span>
            </div>
          </div>
        )}
      </div>

      {!completed ? (
        /* Quiz Body */
        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
          <div className="space-y-6">
            
            {/* Question Card */}
            <Card className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <CardHeader className="space-y-3 px-[16px] pb-0 pt-[16px] sm:px-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400 mb-[4px]">
                      Question {stepIndex + 1}
                    </div>
                    <CardTitle className="text-[16px] leading-[1.5] text-gray-900 sm:text-[17px]">
                      {test.questions[stepIndex].questionText}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-[10px] px-[16px] pb-[16px] pt-[12px] sm:px-[18px]">
                {test.questions[stepIndex].options.map((opt, oIndex) => {
                  const isSelected = answers[stepIndex] === oIndex;
                  return (
                    <button
                      key={oIndex}
                      type="button"
                      onClick={() => {
                        setAnswers({ ...answers, [stepIndex]: oIndex });
                        setValidationError(null);
                      }}
                      className={`group w-full rounded-[12px] border px-4 py-3 text-left transition cursor-pointer ${
                        isSelected 
                          ? "border-primary bg-primary/5 text-primary shadow-[0_4px_16px_rgba(50,68,230,0.06)]" 
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <span className="leading-[1.4] text-[13px] font-semibold">{opt}</span>
                        <span className={`rounded-full h-6 w-6 flex items-center justify-center transition shrink-0 ${
                          isSelected ? "bg-primary text-white" : "border border-gray-300 text-transparent"
                        }`}>✓</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Error Message */}
            {validationError && (
              <div className="text-red-600 text-[11px] font-semibold flex items-center gap-[6px] justify-center bg-red-50 border border-red-200 rounded-[10px] py-[8px] px-[12px] animate-fade-in">
                <span>⚠️</span> {validationError}
              </div>
            )}

            {/* Buttons */}
            <div className="mt-[18px] border-t border-gray-100 pt-[14px]">
              <div className="flex gap-[8px]">
                <button
                  type="button"
                  onClick={() => {
                    if (stepIndex === 0) {
                      onBackToCatalog();
                    } else {
                      setStepIndex(stepIndex - 1);
                      setValidationError(null);
                    }
                  }}
                  className="h-[38px] rounded-[12px] border border-gray-200 bg-white px-[14px] text-[12px] font-semibold text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-gray-50 transition cursor-pointer"
                >
                  {stepIndex === 0 ? "Exit" : "Back"}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to stop the test? Your progress will not be saved.")) {
                      onBackToCatalog();
                    }
                  }}
                  className="h-[38px] rounded-[12px] bg-rose-600 px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.18)] hover:bg-rose-700 transition cursor-pointer"
                >
                  Stop test
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (answers[stepIndex] === undefined) {
                      setValidationError("To continue with the test, you need to attempt this question.");
                      return;
                    }
                    
                    if (stepIndex < test.questions!.length - 1) {
                      setStepIndex(stepIndex + 1);
                    } else {
                      // Complete dynamic test submit!
                      let correctCount = 0;
                      test.questions!.forEach((q, idx) => {
                        if (answers[idx] === q.correctOptionIndex) {
                          correctCount++;
                        }
                      });
                      const finalPercentage = Math.round((correctCount / test.questions!.length) * 100);
                      setQuizScore(finalPercentage);
                      setCompleted(true);

                      // Save result in DB
                      try {
                        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
                        const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
                        const headers: Record<string, string> = {
                          "Content-Type": "application/json"
                        };
                        if (configuredApiKey) {
                          headers["Authorization"] = `Bearer ${configuredApiKey}`;
                          headers["X-API-Key"] = configuredApiKey;
                        }
                        const uid = userId || "anonymous";
                        await fetch(`${apiBase}/test-results/`, {
                          method: "POST",
                          headers,
                          body: JSON.stringify({
                            user_id: uid,
                            test_type: test.id,
                            score: correctCount,
                            percentage_score: finalPercentage,
                            risk_level: finalPercentage >= 70 ? "Excellent" : finalPercentage >= 40 ? "Moderate" : "Needs Improvement",
                            category: test.title,
                            result_data: {
                              answers: answers,
                              questions: test.questions
                            }
                          })
                        });
                        window.dispatchEvent(new CustomEvent("finheal:tests_update"));
                      } catch (e) {
                        console.error("Error saving dynamic test result:", e);
                      }
                    }
                  }}
                  className="flex-1 h-[38px] rounded-[12px] bg-primary px-[14px] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)] hover:bg-primary/90 transition cursor-pointer"
                >
                  {stepIndex < test.questions.length - 1 ? "Continue" : "Submit Test"}
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="max-w-[620px] mx-auto text-center space-y-6 pt-4">
            <CelebrationTrophy />
            <h4 className="text-[20px] font-bold text-gray-900">Diagnostic Completed!</h4>
            <p className="text-[13px] text-gray-500 max-w-[420px] mx-auto">
              Your answers have been checked and recorded in your workspace database. Here is your overall result:
            </p>
            
            <div className="my-[10px] p-[20px] bg-[#f6f7fe] rounded-[24px] border border-[#d4d8fa] inline-block min-w-[150px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-[0.5px] mb-1">Financial Health Score</span>
              <span className="text-[44px] font-black text-primary">{quizScore}%</span>
            </div>

            <div className="space-y-[10px] text-left border border-gray-100 rounded-[18px] p-4 bg-gray-50 max-h-[300px] overflow-y-auto">
              <span className="text-[11px] uppercase font-bold text-gray-400 tracking-[0.5px] block mb-3">Assessment Summary</span>
              {test.questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.correctOptionIndex;
                return (
                  <div key={idx} className="text-[12px] pb-3 border-b border-gray-200/60 last:border-b-0">
                    <div className="font-bold text-gray-800 flex items-start gap-1">
                      <span>{isCorrect ? "✅" : "❌"}</span>
                      <span>Q{idx+1}: {q.questionText}</span>
                    </div>
                    <div className="mt-1 text-gray-500 pl-5">
                      Your answer: <span className={isCorrect ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>{q.options[answers[idx]]}</span>
                    </div>
                    {!isCorrect && (
                      <div className="text-gray-500 pl-5">
                        Correct answer: <span className="text-emerald-600 font-semibold">{q.options[q.correctOptionIndex]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-[12px] pt-4">
              <button
                onClick={() => {
                  setStepIndex(0);
                  setAnswers({});
                  setQuizScore(0);
                  setCompleted(false);
                  setValidationError(null);
                }}
                className="flex-1 h-[48px] border border-gray-200 rounded-[14px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Retake Assessment
              </button>
              
              <button
                onClick={onBackToCatalog}
                className="flex-1 h-[48px] bg-primary text-white font-bold rounded-[14px] text-[13px] hover:opacity-95 transition cursor-pointer shadow-md"
              >
                Return to catalog
              </button>

              {onOpenFinancialWellnessAssistant && (
                <button
                  onClick={onOpenFinancialWellnessAssistant}
                  className="flex-1 h-[48px] bg-cyan-50 border border-cyan-200 text-primary font-bold rounded-[14px] text-[13px] hover:bg-cyan-100 transition cursor-pointer"
                >
                  Talk to assistant
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CelebrationTrophy() {
  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-[200px] h-[160px] my-2 select-none">
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes float-particle-1 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50px, -55px) scale(0.6) rotate(180deg); opacity: 0; }
        }
        @keyframes float-particle-2 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(50px, -65px) scale(0.7) rotate(-120deg); opacity: 0; }
        }
        @keyframes float-particle-3 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-65px, -15px) scale(0.5) rotate(90deg); opacity: 0; }
        }
        @keyframes float-particle-4 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(60px, -25px) scale(0.6) rotate(-90deg); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(0.3); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-trophy {
          animation: float-slow 4s ease-in-out infinite;
        }
        .particle-1 { animation: float-particle-1 3s ease-out infinite; }
        .particle-2 { animation: float-particle-2 3.5s ease-out infinite; }
        .particle-3 { animation: float-particle-3 2.8s ease-out infinite; }
        .particle-4 { animation: float-particle-4 3.2s ease-out infinite; }
        .sparkle-1 { animation: sparkle 2s ease-in-out infinite; }
        .sparkle-2 { animation: sparkle 2.5s ease-in-out infinite; }
      `}</style>
      
      {/* Radial Glow Background */}
      <div className="absolute w-[120px] h-[120px] bg-gradient-to-r from-amber-400/20 to-yellow-300/10 rounded-full blur-2xl -z-10 dark:from-amber-500/10 dark:to-yellow-400/5" />

      {/* Floating Confetti / Celebration Particles */}
      {/* Particle 1: Green Triangle */}
      <svg className="absolute particle-1 left-[45%] top-[50%] text-emerald-500 w-3 h-3 fill-current" viewBox="0 0 24 24">
        <polygon points="12,2 2,22 22,22" />
      </svg>
      {/* Particle 2: Purple Square */}
      <div className="absolute particle-2 left-[50%] top-[45%] bg-purple-500 w-2.5 h-2.5 rounded-sm rotate-45" />
      {/* Particle 3: Cyan Circle */}
      <div className="absolute particle-3 left-[40%] top-[48%] bg-cyan-400 w-2 h-2 rounded-full" />
      {/* Particle 4: Pink Ribbon */}
      <div className="absolute particle-4 left-[55%] top-[48%] bg-rose-500 w-3 h-1.5 rounded-full rotate-12" />

      {/* Sparkles */}
      {/* Sparkle 1: Top Left */}
      <svg className="absolute sparkle-1 left-[22%] top-[15%] text-amber-400 w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 3l1.8 5.7H19.7l-4.7 3.5 1.8 5.7-4.8-3.5-4.8 3.5 1.8-5.7-4.7-3.5H10.2L12 3z" />
      </svg>
      {/* Sparkle 2: Top Right */}
      <svg className="absolute sparkle-2 right-[22%] top-[22%] text-yellow-300 w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 3l1.8 5.7H19.7l-4.7 3.5 1.8 5.7-4.8-3.5-4.8 3.5 1.8-5.7-4.7-3.5H10.2L12 3z" />
      </svg>

      {/* Main Trophy Graphic */}
      <div className="animate-trophy flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[84px] h-[84px] drop-shadow-[0_8px_16px_rgba(245,158,11,0.25)]">
          <defs>
            <linearGradient id="trophy-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="trophy-base" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path d="M6 3h12v4c0 3.31-2.69 6-6 6S6 10.31 6 7V3z" fill="url(#trophy-gold)" />
          <path d="M6 4H3c-1.1 0-2 .9-2 2v2c0 2.21 1.79 4 4 4h1v-2H5c-1.1 0-2-.9-2-2V6c0-.55.45-1 1-1h2V4z" fill="#f59e0b" />
          <path d="M18 4h3c.55 0 1 .45 1 1v2c0 1.1-.9 2-2 2h-1v2h1c2.21 0 4-1.79 4-4V6c0-1.1-.9-2-2-2h-3v1z" fill="#d97706" />
          <path d="M10 13h4v4h-4z" fill="#d97706" />
          <path d="M8 17h8v2H8z" fill="#f59e0b" />
          <rect x="5" y="19" width="14" height="3" rx="1.5" fill="url(#trophy-base)" />
          <rect x="8" y="20.2" width="8" height="0.8" rx="0.4" fill="#fbbf24" opacity="0.9" />
          <circle cx="9" cy="6" r="1" fill="#fff" filter="url(#glow)" />
          <circle cx="15" cy="8" r="0.7" fill="#fff" filter="url(#glow)" />
        </svg>
      </div>
    </div>
  );
}
