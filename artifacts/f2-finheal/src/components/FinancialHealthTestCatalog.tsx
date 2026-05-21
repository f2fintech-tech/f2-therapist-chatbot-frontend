import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTestResults } from "@/lib/backendAuth";

interface FinancialHealthTestCatalogProps {
  userId?: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onOpenFinancialLiteracyTest: () => void;
  onOpenEmergencyFundCheck: () => void;
  onOpenLoanFitTest: () => void;
  onOpenDebtBalanceReview: () => void;
  onOpenCreditReadiness?: () => void;
}

type TestCard = {
  id: string;
  title: string;
  description: string;
  duration: string;
  focus: string;
  result: string;
  accent: string;
};

const featuredTest = {
  title: "Financial Health Snapshot",
  description:
    "A fast overview that combines spending pressure, savings resilience, and repayment comfort into one simple score.",
  duration: "3 min",
  result: "Instant score, plain-language summary, and next-step suggestions.",
  accent: "from-[#3344e6] to-[#4f6cf7]",
};

const testCards: TestCard[] = [
  {
    id: "financial-literacy",
    title: "Money IQ Arena",
    description: "A 3-level assessment covering budgeting, credit, investing, taxes, and long-term planning.",
    duration: "30 min total",
    focus: "Level-based financial reasoning and practical money decisions",
    result: "Level score, badge, and category insights",
    accent: "from-[#10b981] to-[#34d399]",
  },
  {
    id: "debt-balance",
    title: "Debt Pressure Analysis",
    description: "See how your debt load compares with your current repayment capacity.",
    duration: "5 min",
    focus: "EMIs, balances, and debt mix",
    result: "Debt risk rating + repayment guidance",
    accent: "from-[#f59e0b] to-[#fbbf24]",
  },
  {
    id: "emergency-fund",
    title: "Financial Safety Score",
    description: "Measure how many months of essential spending you can cover today.",
    duration: "2 min",
    focus: "Savings buffer and stability",
    result: "Coverage estimate + savings target",
    accent: "from-[#06b6d4] to-[#22d3ee]",
  },
  {
    id: "credit-readiness",
    title: "Credit Health Analyzer",
    description: "Look at the signals lenders care about before you apply for new credit.",
    duration: "5 min",
    focus: "Credit health and repayment behavior",
    result: "Readiness score + risk flags",
    accent: "from-[#8b5cf6] to-[#a78bfa]",
  },
  {
    id: "loan-fit",
    title: "Loan Comfort Analysis",
    description: "Estimate whether a new loan or EMI plan fits comfortably in your budget.",
    duration: "5 min",
    focus: "Affordability and loan planning",
    result: "Fit score + affordability snapshot",
    accent: "from-[#3344e6] to-[#7c8cff]",
  },
];

export default function FinancialHealthTestCatalog({ userId, onToggleSidebar, onToggleInsights, onOpenFinancialLiteracyTest, onOpenEmergencyFundCheck, onOpenLoanFitTest, onOpenDebtBalanceReview, onOpenCreditReadiness }: FinancialHealthTestCatalogProps) {
  const [pastResults, setPastResults] = useState<{title: string; score: string; date: string; accent: string}[]>([]);
  const [showPastResults, setShowPastResults] = useState(false);

  useEffect(() => {
    const uid = userId || "anonymous";
    const testMeta: Record<string, { title: string; accent: string }> = {
      loan_fit: { title: "Loan Comfort Analysis", accent: "from-[#3344e6] to-[#7c8cff]" },
      debt_balance: { title: "Debt Pressure Analysis", accent: "from-[#f59e0b] to-[#fbbf24]" },
      credit_readiness: { title: "Credit Health Analyzer", accent: "from-[#8b5cf6] to-[#a78bfa]" },
      emergency_fund: { title: "Financial Safety Score", accent: "from-[#06b6d4] to-[#22d3ee]" },
      financial_literacy: { title: "Money IQ Arena", accent: "from-[#10b981] to-[#34d399]" },
    };

    async function loadResults() {
      const results: { title: string; score: string; date: string; accent: string }[] = [];
      const seen = new Set<string>();

      try {
        const backendResults = await fetchTestResults(uid);
        for (const r of backendResults) {
          const meta = testMeta[r.test_type];
          if (!meta || seen.has(r.test_type)) continue;
          seen.add(r.test_type);
          const score = r.percentage_score != null ? `${r.percentage_score}%` : r.risk_level || r.category || "Done";
          const date = new Date(r.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          results.push({ title: meta.title, score, date, accent: meta.accent });
        }
      } catch {}

      const localTests = [
        { key: `finheal_loan_fit_test:${uid}`, type: "loan_fit" },
        { key: `finheal_debt_balance_review:${uid}`, type: "debt_balance" },
        { key: `finheal_credit_readiness:${uid}`, type: "credit_readiness" },
        { key: `finheal_emergency_fund_check:${uid}`, type: "emergency_fund" },
        { key: `finheal_financial_literacy_test:${uid}`, type: "financial_literacy" },
      ];
      for (const t of localTests) {
        if (seen.has(t.type)) continue;
        try {
          const raw = localStorage.getItem(t.key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (!parsed?.completed || !parsed?.result) continue;
          const meta = testMeta[t.type];
          if (!meta) continue;
          const score = parsed.result.percentageScore != null
            ? `${Math.round(parsed.result.percentageScore)}%`
            : parsed.result.risk ?? parsed.result.riskLevel ?? parsed.result.category ?? "Done";
          const date = parsed.updatedAt
            ? new Date(parsed.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "Completed";
          results.push({ title: meta.title, score, date, accent: meta.accent });
        } catch {}
      }

      setPastResults(results);
    }

    void loadResults();
  }, [userId]);

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
          <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Financial Health Tests</div>
          <div className="text-[10px] text-gray-400 sm:text-[11px]">Choose a test to check one part of your financial health.</div>
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
          <div className={`absolute right-[-32px] top-[-32px] h-[130px] w-[130px] rounded-full bg-gradient-to-br ${featuredTest.accent} opacity-10`} />
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)]">
              New test library
            </div>
            <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px]">
              Pick the financial area you want to understand first.
            </h1>
            <p className="mt-[10px] max-w-[560px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px]">
              Each test gives a focused score and a short summary so users can move quickly from a question to a clear next step.
            </p>
            <div className="mt-[14px] flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600">
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">Instant summary</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">Simple scoring</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px]">Safe to revisit</span>
            </div>
          </div>
        </section>

        <section className="mt-[18px] grid gap-[10px] sm:grid-cols-3">
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Available tests</div>
            <div className="mt-[4px] text-[24px] font-serif text-gray-900">6</div>
          </div>
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Average duration</div>
            <div className="mt-[4px] text-[24px] font-serif text-gray-900">2-4 min</div>
          </div>
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-[14px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">Result style</div>
            <div className="mt-[4px] text-[24px] font-serif text-gray-900">Instant</div>
          </div>
        </section>

        {pastResults.length > 0 && (
          <section className="mt-[18px]">
            <button
              type="button"
              onClick={() => setShowPastResults((v) => !v)}
              className="w-full flex items-center justify-between rounded-[18px] border border-[#d4d8fa] bg-[#f6f7fe] px-[18px] py-[14px] text-left transition hover:bg-[#eef0fd]"
            >
              <div className="flex items-center gap-[10px]">
                <span className="text-[20px]">📋</span>
                <div>
                  <div className="text-[14px] font-semibold text-gray-900">Your past test results</div>
                  <div className="text-[11px] text-gray-500">{pastResults.length} test{pastResults.length > 1 ? "s" : ""} completed — tap to {showPastResults ? "hide" : "view"}</div>
                </div>
              </div>
              <span className="text-[18px] text-primary">{showPastResults ? "▲" : "▼"}</span>
            </button>

            {showPastResults && (
              <div className="mt-[10px] grid gap-[8px] grid-cols-2 xl:grid-cols-3">
                {pastResults.map((r, i) => (
                  <div key={i} className="overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-sm">
                    <div className={`h-[3px] bg-gradient-to-r ${r.accent}`} />
                    <div className="flex items-center justify-between gap-2 px-[12px] py-[10px]">
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-gray-900 truncate">{r.title}</div>
                        <div className="text-[10px] text-gray-400">{r.date}</div>
                        <div className="mt-[4px] text-[10px] font-medium text-emerald-600 flex items-center gap-[3px]">
                          <span>✅</span> Completed
                        </div>
                      </div>
                      <div className="rounded-[10px] bg-[#eef0fd] px-[10px] py-[5px] text-[14px] font-bold text-primary shrink-0">
                        {r.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mt-[18px]">
          <div className="mb-[10px] flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400">Featured test</h2>
              <p className="mt-[4px] text-[15px] font-semibold text-gray-900">Start with the broadest snapshot</p>
            </div>
            <div className="text-[11px] font-medium text-gray-400">Best for first-time users</div>
          </div>

          <Card className="overflow-hidden border-[#d4d8fa] shadow-[0_14px_34px_rgba(50,68,230,0.08)]">
            <div className={`h-[6px] bg-gradient-to-r ${featuredTest.accent}`} />
            <CardHeader className="space-y-2 px-[18px] pb-0 pt-[18px] sm:px-[22px]">
              <CardTitle className="text-[20px] text-gray-900 sm:text-[24px]">{featuredTest.title}</CardTitle>
              <CardDescription className="text-[13px] leading-[1.7] text-gray-600 sm:text-[14px]">{featuredTest.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-[14px] px-[18px] pb-[18px] pt-[16px] sm:flex-row sm:items-end sm:justify-between sm:px-[22px]">
              <div className="flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600">
                <span className="rounded-[999px] bg-[#eef0fd] px-[10px] py-[5px] text-primary">{featuredTest.duration}</span>
                <span className="rounded-[999px] bg-gray-100 px-[10px] py-[5px]">Instant score</span>
                <span className="rounded-[999px] bg-gray-100 px-[10px] py-[5px]">Summary + tips</span>
              </div>
              <div className="max-w-[330px] text-[12px] leading-[1.6] text-gray-500">
                {featuredTest.result}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-[18px]">
          <div className="mb-[12px] flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400">All tests</h2>
              <p className="mt-[4px] text-[15px] font-semibold text-gray-900">Browse the catalog</p>
            </div>
          </div>

          <div className="grid gap-[12px] md:grid-cols-2 xl:grid-cols-2">
            {testCards.map((test) => (
              <Card key={test.id} className="overflow-hidden border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                <div className={`h-[5px] bg-gradient-to-r ${test.accent}`} />
                <CardHeader className="space-y-2 px-[16px] pb-0 pt-[16px]">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-[16px] text-gray-900">{test.title}</CardTitle>
                    <span className="rounded-[999px] border border-gray-200 bg-gray-50 px-[8px] py-[4px] text-[10px] font-semibold uppercase tracking-[0.7px] text-gray-500">
                      {test.duration}
                    </span>
                  </div>
                  <CardDescription className="text-[12px] leading-[1.7] text-gray-600">{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-[12px] px-[16px] pb-[16px] pt-[12px]">
                  <div className="grid gap-[8px] text-[11px] text-gray-500 sm:grid-cols-2">
                    <div className="rounded-[12px] bg-gray-50 px-[10px] py-[8px]">
                      <div className="font-semibold uppercase tracking-[0.7px] text-gray-400">Focus</div>
                      <div className="mt-[3px] text-gray-700">{test.focus}</div>
                    </div>
                    <div className="rounded-[12px] bg-gray-50 px-[10px] py-[8px]">
                      <div className="font-semibold uppercase tracking-[0.7px] text-gray-400">Result</div>
                      <div className="mt-[3px] text-gray-700">{test.result}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[12px] border border-dashed border-gray-200 bg-white px-[12px] py-[10px]">
                    <div className="text-[11px] text-gray-500">This slot will later hold the test route and instant score output.</div>
                    <button
                      type="button"
                      onClick={
                        test.id === "financial-literacy"
                          ? onOpenFinancialLiteracyTest
                          : test.id === "emergency-fund"
                          ? onOpenEmergencyFundCheck
                          : test.id === "loan-fit"
                          ? onOpenLoanFitTest
                          : test.id === "debt-balance"
                          ? onOpenDebtBalanceReview
                          : test.id === "credit-readiness"
                          ? onOpenCreditReadiness
                          : undefined
                      }
                      className="rounded-[999px] bg-primary px-[12px] py-[6px] text-[11px] cursor-pointer font-semibold text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]"
                    >
                        {test.id === "financial-literacy" ? "Start test" : test.id === "credit-readiness" || test.id === "emergency-fund" || test.id === "loan-fit" || test.id === "debt-balance" ? "Start test" : "Open"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}