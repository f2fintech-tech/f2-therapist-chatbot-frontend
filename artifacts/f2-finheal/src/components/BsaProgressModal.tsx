import React, { useEffect, useState, useRef } from "react";
import { Sparkles, CheckCircle2, Lock, FileText, Loader2, ShieldCheck, Coffee, BarChart3, Award } from "lucide-react";

export interface LogEntry {
  id: string;
  time: string;
  text: string;
  step: number;
}

interface BsaProgressModalProps {
  isOpen: boolean;
  currentStep: number;
  currentMessage: string;
  logs: LogEntry[];
  fileName: string;
  sessionId?: string;
  error?: string | null;
  onClose?: () => void;
}

const CREATIVE_TICKERS = [
  "☕ Analyzing high-volume statement rows... sit back, we're auditing your numbers!",
  "🔍 Scanning for recurring monthly salary credits & auto-debit EMIs...",
  "✨ Crunching credit & debit metrics with precision...",
  "🎯 Matching your financial wellness indicators with top lender criteria...",
  "🛡️ Applying military-grade encryption to your financial data..."
];

export const BsaProgressModal: React.FC<BsaProgressModalProps> = ({
  isOpen,
  currentStep,
  currentMessage,
  logs,
  fileName,
  sessionId,
  error,
  onClose
}) => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Rotate creative tickers every 4 seconds for slow multi-page statements
  useEffect(() => {
    if (!isOpen || currentStep >= 6 || error) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % CREATIVE_TICKERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, currentStep, error]);

  if (!isOpen) return null;

  const STEPS = [
    { id: 1, label: "Session Init", icon: Sparkles },
    { id: 2, label: "Security Verification", icon: Lock },
    { id: 3, label: "Cashflow Audit", icon: FileText },
    { id: 4, label: "Row Processing", icon: Coffee },
    { id: 5, label: "Metrics Calculation", icon: BarChart3 },
    { id: 6, label: "Report Generation", icon: Award }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-[560px] bg-white rounded-[24px] shadow-2xl border border-indigo-100 overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[16px] font-extrabold tracking-tight">Bank Statement Analyzer</h3>
                <p className="text-[11px] text-indigo-100 font-medium">
                  {fileName ? `File: ${fileName}` : "Live Real-Time Processing"}
                </p>
              </div>
            </div>
            {sessionId && (
              <span className="text-[10px] font-mono bg-white/15 px-2.5 py-1 rounded-full border border-white/20 text-indigo-100 font-semibold shadow-xs">
                {sessionId}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6 bg-slate-50/50">
          
          {error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-[16px] p-5 flex flex-col gap-3 text-center">
              <div className="text-rose-500 font-bold text-sm">Statement Processing Failed</div>
              <p className="text-xs text-rose-600 leading-relaxed font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-[12px] text-xs font-bold transition-all"
              >
                Close & Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Stepper Dots & Line */}
              <div className="relative flex items-center justify-between px-2">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0" />
                <div 
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (STEPS.length - 1)) * 100))}%` }}
                />

                {STEPS.map((s) => {
                  const Icon = s.icon;
                  const isDone = currentStep > s.id;
                  const isCurrent = currentStep === s.id;

                  return (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-1.5 group">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm ${
                          isDone
                            ? "bg-indigo-600 text-white shadow-indigo-200"
                            : isCurrent
                            ? "bg-white text-indigo-600 border-2 border-indigo-600 scale-110 ring-4 ring-indigo-100"
                            : "bg-white text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className={`text-[10px] font-bold transition-colors ${isCurrent ? "text-indigo-900 font-extrabold" : isDone ? "text-indigo-600" : "text-slate-400"}`}>
                        Step {s.id}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Live Human-Friendly Status Box */}
              <div className="bg-white border border-indigo-100 rounded-[18px] p-4.5 shadow-sm flex flex-col gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                      Live Backend Processing
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {Math.round((currentStep / 6) * 100)}%
                  </span>
                </div>

                {/* Primary Friendly Line */}
                <div className="text-[13.5px] font-extrabold text-slate-900 flex items-center gap-2 min-h-[24px]">
                  {currentMessage || "Processing bank statement..."}
                </div>

                {/* Rotating Creative Ticker for larger statements */}
                {currentStep >= 3 && currentStep < 6 && (
                  <div className="text-[11.5px] text-indigo-600 font-medium bg-indigo-50/70 px-3 py-2 rounded-[10px] border border-indigo-100/60 animate-fade-in flex items-center gap-1.5">
                    <span>{CREATIVE_TICKERS[tickerIndex]}</span>
                  </div>
                )}
              </div>

              {/* Real-time Log Stream Terminal Box */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Execution Log Stream
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Real-time EC2 status</span>
                </div>

                <div
                  ref={logContainerRef}
                  className="bg-slate-900 rounded-[16px] p-3.5 h-[130px] overflow-y-auto font-mono text-[11px] text-slate-200 flex flex-col gap-1.5 border border-slate-800 shadow-inner scrollbar-thin scrollbar-thumb-slate-700"
                >
                  {logs.length === 0 ? (
                    <div className="text-slate-500 italic text-[10px] my-auto text-center">
                      Waiting for backend execution logs...
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed animate-fade-in">
                        <span className="text-slate-500 shrink-0 text-[10px] font-sans">[{log.time}]</span>
                        <span className={log.step === 6 ? "text-emerald-400 font-bold" : "text-indigo-300 font-medium"}>
                          ➔ {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
