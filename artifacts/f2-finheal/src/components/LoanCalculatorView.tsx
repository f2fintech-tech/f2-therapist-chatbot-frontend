import { useState, useMemo, useEffect } from "react";

interface LoanCalculatorViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onApplyNow: (loanType: string, amount: number, rate: number, tenure: number) => void;
}

interface LoanTypeConfig {
  id: string;
  name: string;
  icon: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  amountStep: number;
  defaultRate: number;
  minRate: number;
  maxRate: number;
  rateStep: number;
  defaultTenure: number;
  minTenure: number;
  maxTenure: number;
}

const LOAN_TYPES: LoanTypeConfig[] = [
  {
    id: "home",
    name: "Home Loan",
    icon: "🏠",
    defaultAmount: 5000000,
    minAmount: 500000,
    maxAmount: 100000000, // 10 Cr
    amountStep: 100000,
    defaultRate: 8.5,
    minRate: 6.0,
    maxRate: 18.0,
    rateStep: 0.05,
    defaultTenure: 20,
    minTenure: 1,
    maxTenure: 30,
  },
  {
    id: "business",
    name: "Business Loan",
    icon: "💼",
    defaultAmount: 2000000,
    minAmount: 100000,
    maxAmount: 50000000, // 5 Cr
    amountStep: 50000,
    defaultRate: 14.0,
    minRate: 10.0,
    maxRate: 24.0,
    rateStep: 0.1,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 10,
  },
  {
    id: "lap",
    name: "Loan Against Property",
    icon: "🏢",
    defaultAmount: 7500000,
    minAmount: 500000,
    maxAmount: 100000000, // 10 Cr
    amountStep: 100000,
    defaultRate: 11.0,
    minRate: 8.0,
    maxRate: 18.0,
    rateStep: 0.05,
    defaultTenure: 15,
    minTenure: 1,
    maxTenure: 20,
  },
  {
    id: "education",
    name: "Education Loan",
    icon: "🎓",
    defaultAmount: 1500000,
    minAmount: 50000,
    maxAmount: 15000000, // 1.5 Cr
    amountStep: 10000,
    defaultRate: 9.5,
    minRate: 7.5,
    maxRate: 16.0,
    rateStep: 0.05,
    defaultTenure: 7,
    minTenure: 1,
    maxTenure: 15,
  },
  {
    id: "personal",
    name: "Personal Loan",
    icon: "💳",
    defaultAmount: 500000,
    minAmount: 50000,
    maxAmount: 5000000, // 50 Lakhs
    amountStep: 10000,
    defaultRate: 12.5,
    minRate: 10.5,
    maxRate: 24.0,
    rateStep: 0.1,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 7,
  },
];

export default function LoanCalculatorView({
  userId,
  onToggleSidebar,
  onToggleInsights,
  onApplyNow,
}: LoanCalculatorViewProps) {
  const [activeTab, setActiveTab] = useState<string>("home");

  const activeConfig = useMemo(() => {
    return LOAN_TYPES.find((t) => t.id === activeTab) || LOAN_TYPES[0];
  }, [activeTab]);

  const [amount, setAmount] = useState<number>(activeConfig.defaultAmount);
  const [rate, setRate] = useState<number>(activeConfig.defaultRate);
  const [tenure, setTenure] = useState<number>(activeConfig.defaultTenure);
  const [optimize, setOptimize] = useState<boolean>(false);

  // Sync state when config changes
  useEffect(() => {
    setAmount(activeConfig.defaultAmount);
    setRate(activeConfig.defaultRate);
    setTenure(activeConfig.defaultTenure);
    setOptimize(false);
  }, [activeConfig]);

  // Formatter helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatCompact = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)} Lakh`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(0)} K`;
    }
    return `₹${val}`;
  };

  // Calculations
  const calculations = useMemo(() => {
    const monthlyRate = rate / 12 / 100;
    const totalMonths = tenure * 12;

    const emi =
      monthlyRate === 0
        ? amount / totalMonths
        : (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const standardTotalPayable = emi * totalMonths;
    const standardTotalInterest = standardTotalPayable - amount;

    // Simulation for one extra EMI per year optimization
    let balance = amount;
    let totalInterestPaid = 0;
    let monthsElapsed = 0;
    const extraPaymentPerYear = emi;

    while (balance > 0 && monthsElapsed < 600) {
      monthsElapsed += 1;
      const interestForMonth = balance * monthlyRate;
      let principalForMonth = emi - interestForMonth;

      if (monthsElapsed % 12 === 0) {
        principalForMonth += extraPaymentPerYear;
      }

      if (balance <= principalForMonth) {
        totalInterestPaid += interestForMonth;
        balance = 0;
      } else {
        totalInterestPaid += interestForMonth;
        balance -= principalForMonth;
      }
    }

    const optimizedTotalPayable = amount + totalInterestPaid;
    const interestSaved = Math.max(0, standardTotalInterest - totalInterestPaid);
    const monthsSaved = Math.max(0, totalMonths - monthsElapsed);

    const activeTotalPayable = optimize ? optimizedTotalPayable : standardTotalPayable;
    const activeTotalInterest = optimize ? totalInterestPaid : standardTotalInterest;
    const activeMonths = optimize ? monthsElapsed : totalMonths;

    // Donut chart stroke math
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const principalPct = (amount / activeTotalPayable) * 100;
    const interestPct = (activeTotalInterest / activeTotalPayable) * 100;

    const principalOffset = circumference;
    const interestOffset = circumference - (principalPct / 100) * circumference;

    return {
      monthlyEmi: Math.round(emi),
      totalPayable: Math.round(activeTotalPayable),
      totalInterest: Math.round(activeTotalInterest),
      actualMonths: activeMonths,
      principalPct,
      interestPct,
      interestSaved: Math.round(interestSaved),
      monthsSaved,
      donutRadius: radius,
      donutCircumference: circumference,
      principalStrokeLength: (principalPct / 100) * circumference,
      interestStrokeLength: (interestPct / 100) * circumference,
      interestStrokeOffset: -((principalPct / 100) * circumference),
    };
  }, [amount, rate, tenure, optimize]);

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      {/* Header */}
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
          <div className="text-[13px] font-bold text-gray-900 sm:text-[20px]">🏦Loan EMI Calculator</div>
          <div className="text-[10px] text-gray-400 sm:text-[15px]">
            Calculate monthly installments and optimize repayments for various loans.
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
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-[6px] border-b border-gray-100 pb-3 mb-[20px]">
          {LOAN_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-[10px] text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === t.id
                ? "bg-primary text-white shadow-[0_8px_20px_rgba(50,68,230,0.2)]"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              <span>{t.icon}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        {/* Calculator Main Layout */}
        <div className="grid gap-[24px] lg:grid-cols-12">
          {/* Controls - Left side */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Input 1: Loan Amount */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[13px] font-semibold text-gray-700">Loan Amount</label>
                <span className="text-[13px] font-bold text-primary">{formatCurrency(amount)}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-400 font-bold text-[14px]">₹</span>
                <input
                  type="number"
                  value={amount === 0 ? "" : amount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAmount(val);
                  }}
                  onBlur={() => {
                    // Clamp value within min and max on blur
                    const clamped = Math.max(
                      activeConfig.minAmount,
                      Math.min(activeConfig.maxAmount, amount)
                    );
                    setAmount(clamped);
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <input
                type="range"
                min={activeConfig.minAmount}
                max={activeConfig.maxAmount}
                step={activeConfig.amountStep}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                <span>{formatCompact(activeConfig.minAmount)}</span>
                <span>{formatCompact(activeConfig.maxAmount)}</span>
              </div>
            </div>

            {/* Input 2: Interest Rate */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[13px] font-semibold text-gray-700">Interest Rate</label>
                <span className="text-[13px] font-bold text-primary">{rate}%</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  step="0.05"
                  value={rate === 0 ? "" : rate}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRate(val);
                  }}
                  onBlur={() => {
                    const clamped = Math.max(
                      activeConfig.minRate,
                      Math.min(activeConfig.maxRate, rate)
                    );
                    setRate(Number(clamped.toFixed(2)));
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="text-gray-400 font-bold text-[14px] pr-1">%</span>
              </div>
              <input
                type="range"
                min={activeConfig.minRate}
                max={activeConfig.maxRate}
                step={activeConfig.rateStep}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                <span>{activeConfig.minRate}%</span>
                <span>{activeConfig.maxRate}%</span>
              </div>
            </div>

            {/* Input 3: Loan Tenure */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[13px] font-semibold text-gray-700">Loan Tenure</label>
                <span className="text-[13px] font-bold text-primary">{tenure} Years</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  value={tenure === 0 ? "" : tenure}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTenure(val);
                  }}
                  onBlur={() => {
                    const clamped = Math.max(
                      activeConfig.minTenure,
                      Math.min(activeConfig.maxTenure, tenure)
                    );
                    setTenure(clamped);
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="text-gray-400 font-bold text-[12px] pr-1">Years</span>
              </div>
              <input
                type="range"
                min={activeConfig.minTenure}
                max={activeConfig.maxTenure}
                step={1}
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                <span>{activeConfig.minTenure} Y</span>
                <span>{activeConfig.maxTenure} Y</span>
              </div>
            </div>

            {/* Optimization Checkbox */}
            <div className="flex items-start gap-2.5 bg-[#f6f7fe] border border-[#d4d8fa] p-3 rounded-[12px]">
              <input
                id="optimize-checkbox"
                type="checkbox"
                checked={optimize}
                onChange={(e) => setOptimize(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="optimize-checkbox" className="text-[12px] text-gray-700 leading-normal select-none cursor-pointer">
                <strong className="text-primary font-bold">Optimize with one extra EMI per year.</strong> Pay 13 EMIs annually instead of 12. Accelerates repayment and saves significant interest!
              </label>
            </div>

            {/* Expected EMI Card */}
            <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">
                  Expected Monthly Installment (EMI)
                </span>
                <span className="text-[26px] font-serif font-bold text-primary mt-1">
                  {formatCurrency(calculations.monthlyEmi)}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onApplyNow(activeConfig.name, amount, rate, tenure)
                }
                className="px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-opacity cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)]"
              >
                Apply Now
              </button>
            </div>
          </div>

          {/* Visualization - Right side */}
          <div className="lg:col-span-5 flex flex-col gap-[20px] justify-center items-center">
            {/* Custom SVG Donut Chart */}
            <div className="relative flex flex-col items-center justify-center p-4">
              <svg width="180" height="180" className="transform -rotate-90">
                {/* Background Track */}
                <circle
                  cx="90"
                  cy="90"
                  r={calculations.donutRadius}
                  stroke="#f3f4f6"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Principal Segment */}
                <circle
                  cx="90"
                  cy="90"
                  r={calculations.donutRadius}
                  stroke="#3344e6" // Primary Blue
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${calculations.principalStrokeLength} ${calculations.donutCircumference}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                {/* Interest Segment */}
                {calculations.totalInterest > 0 && (
                  <circle
                    cx="90"
                    cy="90"
                    r={calculations.donutRadius}
                    stroke="#10b981" // Emerald / Teal
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${calculations.interestStrokeLength} ${calculations.donutCircumference}`}
                    strokeDashoffset={calculations.interestStrokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              {/* Center text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                <span className="text-[9px] font-bold uppercase tracking-[0.5px] text-gray-400">
                  Total Payable
                </span>
                <span className="text-[17px] font-serif font-bold text-gray-900 mt-0.5">
                  {formatCurrency(calculations.totalPayable)}
                </span>
              </div>
            </div>

            {/* Breakdowns & Legends */}
            <div className="w-full max-w-[280px] grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2 bg-gray-50">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary block shrink-0" />
                  <span>Principal</span>
                </div>
                <span className="text-[14px] font-bold text-gray-900 mt-1">
                  {formatCurrency(amount)}
                </span>
                <span className="text-[9px] font-semibold text-gray-400">
                  ({Math.round(calculations.principalPct)}%)
                </span>
              </div>

              <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2 bg-gray-50">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] block shrink-0" />
                  <span>Interest</span>
                </div>
                <span className="text-[14px] font-bold text-gray-900 mt-1">
                  {formatCurrency(calculations.totalInterest)}
                </span>
                <span className="text-[9px] font-semibold text-gray-400">
                  ({Math.round(calculations.interestPct)}%)
                </span>
              </div>
            </div>

            {/* Optimized Benefits Card (only shows when optimization is active or has metrics) */}
            {optimize && (
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 flex flex-col gap-2.5 animate-fade-up">
                <div className="flex items-center gap-1.5">
                  <span className="text-[18px]">✨</span>
                  <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-[0.5px]">
                    Optimization Impact
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="flex flex-col bg-white border border-emerald-100 rounded-[8px] p-2">
                    <span className="text-[10px] font-semibold text-gray-400">Interest Saved</span>
                    <span className="text-[15px] font-bold text-emerald-600 mt-0.5">
                      {formatCurrency(calculations.interestSaved)}
                    </span>
                  </div>
                  <div className="flex flex-col bg-white border border-emerald-100 rounded-[8px] p-2">
                    <span className="text-[10px] font-semibold text-gray-400">Tenure Reduced</span>
                    <span className="text-[15px] font-bold text-emerald-600 mt-0.5">
                      {Math.floor(calculations.monthsSaved / 12) > 0
                        ? `${Math.floor(calculations.monthsSaved / 12)} Yr ${calculations.monthsSaved % 12
                        } Mo`
                        : `${calculations.monthsSaved} Months`}
                    </span>
                  </div>
                </div>
                <p className="text-[10.5px] text-emerald-700 leading-normal text-center mt-1">
                  You will pay off your loan in{" "}
                  <strong>
                    {Math.floor(calculations.actualMonths / 12)} Years{" "}
                    {calculations.actualMonths % 12} Months
                  </strong>{" "}
                  instead of {tenure} Years!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
