import React, { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  Coins,
  CheckCircle,
  Scale,
  TrendingUp,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Percent,
  Calendar,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Landmark,
  Plus
} from "lucide-react";

interface LoanCalculatorViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onApplyNow: (loanType: string, amount: number, rate: number, tenure: number, details?: string) => void;
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

const CURRENCIES = [
  { code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", locale: "en-US", name: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", name: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", name: "British Pound (£)" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", name: "Japanese Yen (¥)" },
];

export default function LoanCalculatorView({
  userId,
  onToggleSidebar,
  onToggleInsights,
  onApplyNow,
}: LoanCalculatorViewProps) {
  // Global States
  const [activeTab, setActiveTab] = useState<string>("home");
  const [calcType, setCalcType] = useState<"emi" | "eligibility" | "compare" | "prepayment">("emi");
  const [currency, setCurrency] = useState(CURRENCIES[0]);

  // Dynamic Scale Factor based on chosen currency to make sliders make sense
  const currencyScale = useMemo(() => {
    switch (currency.code) {
      case "USD":
      case "EUR":
      case "GBP":
        return 0.0125; // 1 USD ~ 80 INR
      case "JPY":
        return 1.5;   // 1 INR ~ 1.5 JPY
      case "INR":
      default:
        return 1;
    }
  }, [currency]);

  // Format configs dynamically
  const activeConfig = useMemo(() => {
    const base = LOAN_TYPES.find((t) => t.id === activeTab) || LOAN_TYPES[0];
    
    // Scale inputs nicely
    const roundNice = (val: number) => {
      const raw = val * currencyScale;
      if (raw >= 1000000) return Math.round(raw / 100000) * 100000;
      if (raw >= 100000) return Math.round(raw / 10000) * 10000;
      if (raw >= 10000) return Math.round(raw / 1000) * 1000;
      if (raw >= 1000) return Math.round(raw / 100) * 100;
      return Math.round(raw / 10) * 10;
    };

    return {
      ...base,
      defaultAmount: roundNice(base.defaultAmount),
      minAmount: roundNice(base.minAmount),
      maxAmount: roundNice(base.maxAmount),
      amountStep: roundNice(base.amountStep),
    };
  }, [activeTab, currencyScale]);

  // Formatter helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatCompact = (val: number) => {
    if (currency.code === "INR") {
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
    } else {
      const symbol = currency.symbol;
      if (val >= 1000000) {
        return `${symbol}${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`;
      }
      if (val >= 1000) {
        return `${symbol}${(val / 1000).toFixed(0)}K`;
      }
      return `${symbol}${val}`;
    }
  };

  // State definitions for sub-calculators
  // Tab 1: EMI Calculator Inputs
  const [emiAmount, setEmiAmount] = useState<number>(activeConfig.defaultAmount);
  const [emiRate, setEmiRate] = useState<number>(activeConfig.defaultRate);
  const [emiTenure, setEmiTenure] = useState<number>(activeConfig.defaultTenure);
  const [emiOptimize, setEmiOptimize] = useState<boolean>(false);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // Sync state when config changes
  useEffect(() => {
    setEmiAmount(activeConfig.defaultAmount);
    setEmiRate(activeConfig.defaultRate);
    setEmiTenure(activeConfig.defaultTenure);
    setEmiOptimize(false);
    setShowAmortization(false);
    setExpandedYear(null);
  }, [activeConfig]);

  // Tab 2: Eligibility Calculator Inputs
  const [eligIncome, setEligIncome] = useState<number>(Math.round(100000 * currencyScale));
  const [eligEmi, setEligEmi] = useState<number>(Math.round(10000 * currencyScale));
  const [eligRate, setEligRate] = useState<number>(9.5);
  const [eligTenure, setEligTenure] = useState<number>(20);

  // Sync eligibility default amounts on currency scale shifts
  useEffect(() => {
    setEligIncome(Math.round(100000 * currencyScale));
    setEligEmi(Math.round(10000 * currencyScale));
  }, [currencyScale]);

  // Tab 3: Compare Loans Inputs
  const [compAmountA, setCompAmountA] = useState<number>(Math.round(2000000 * currencyScale));
  const [compRateA, setCompRateA] = useState<number>(8.5);
  const [compTenureA, setCompTenureA] = useState<number>(20);

  const [compAmountB, setCompAmountB] = useState<number>(Math.round(2000000 * currencyScale));
  const [compRateB, setCompRateB] = useState<number>(9.2);
  const [compTenureB, setCompTenureB] = useState<number>(15);

  useEffect(() => {
    setCompAmountA(Math.round(2000000 * currencyScale));
    setCompAmountB(Math.round(2000000 * currencyScale));
  }, [currencyScale]);

  // Tab 4: Prepayment Inputs
  const [prepAmount, setPrepAmount] = useState<number>(activeConfig.defaultAmount);
  const [prepRate, setPrepRate] = useState<number>(activeConfig.defaultRate);
  const [prepTenure, setPrepTenure] = useState<number>(activeConfig.defaultTenure);
  const [prepType, setPrepType] = useState<"lump" | "monthly">("monthly");
  const [prepVal, setPrepVal] = useState<number>(Math.round(10000 * currencyScale));
  const [prepStartMonth, setPrepStartMonth] = useState<number>(12);

  useEffect(() => {
    setPrepAmount(activeConfig.defaultAmount);
    setPrepRate(activeConfig.defaultRate);
    setPrepTenure(activeConfig.defaultTenure);
    setPrepVal(Math.round(10000 * currencyScale));
    setPrepStartMonth(12);
  }, [activeConfig]);

  // Calculations for Tab 1: EMI
  const emiCalculations = useMemo(() => {
    const monthlyRate = emiRate / 12 / 100;
    const totalMonths = emiTenure * 12;

    const emi =
      monthlyRate === 0
        ? emiAmount / totalMonths
        : (emiAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const standardTotalPayable = emi * totalMonths;
    const standardTotalInterest = standardTotalPayable - emiAmount;

    // Simulation for one extra EMI per year optimization
    let balance = emiAmount;
    let totalInterestPaid = 0;
    let monthsElapsed = 0;
    const extraPaymentPerYear = emi;
    const monthlyAmortization: { month: number; interest: number; principal: number; extra: number; balance: number }[] = [];

    while (balance > 0 && monthsElapsed < 600) {
      monthsElapsed += 1;
      const interestForMonth = balance * monthlyRate;
      let principalForMonth = emi - interestForMonth;
      let extraPaid = 0;

      if (monthsElapsed % 12 === 0 && emiOptimize) {
        extraPaid = extraPaymentPerYear;
        principalForMonth += extraPaid;
      }

      if (balance <= principalForMonth) {
        principalForMonth = balance;
        totalInterestPaid += interestForMonth;
        balance = 0;
      } else {
        totalInterestPaid += interestForMonth;
        balance -= principalForMonth;
      }

      monthlyAmortization.push({
        month: monthsElapsed,
        interest: Math.round(interestForMonth),
        principal: Math.round(principalForMonth - extraPaid),
        extra: Math.round(extraPaid),
        balance: Math.max(0, Math.round(balance)),
      });
    }

    const optimizedTotalPayable = emiAmount + totalInterestPaid;
    const interestSaved = Math.max(0, standardTotalInterest - totalInterestPaid);
    const monthsSaved = Math.max(0, totalMonths - monthsElapsed);

    const activeTotalPayable = emiOptimize ? optimizedTotalPayable : standardTotalPayable;
    const activeTotalInterest = emiOptimize ? totalInterestPaid : standardTotalInterest;
    const activeMonths = emiOptimize ? monthsElapsed : totalMonths;

    // Group amortization by year
    const yearlyAmortization: {
      year: number;
      interest: number;
      principal: number;
      extra: number;
      endBalance: number;
      months: typeof monthlyAmortization;
    }[] = [];

    for (let i = 0; i < monthlyAmortization.length; i += 12) {
      const chunk = monthlyAmortization.slice(i, i + 12);
      const yearNum = Math.floor(i / 12) + 1;
      const yrInterest = chunk.reduce((sum, m) => sum + m.interest, 0);
      const yrPrincipal = chunk.reduce((sum, m) => sum + m.principal, 0);
      const yrExtra = chunk.reduce((sum, m) => sum + m.extra, 0);
      const lastBal = chunk[chunk.length - 1].balance;

      yearlyAmortization.push({
        year: yearNum,
        interest: yrInterest,
        principal: yrPrincipal,
        extra: yrExtra,
        endBalance: lastBal,
        months: chunk,
      });
    }

    // Donut chart calculations
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const principalPct = (emiAmount / activeTotalPayable) * 100 || 0;
    const interestPct = (activeTotalInterest / activeTotalPayable) * 100 || 0;

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
      yearlyAmortization,
    };
  }, [emiAmount, emiRate, emiTenure, emiOptimize]);

  // Calculations for Tab 2: Eligibility
  const eligCalculations = useMemo(() => {
    // Standard lending standard: Max 50% Fixed Obligation to Income Ratio (FOIR)
    const maxFoirPct = 50;
    const affordableMonthlyObligation = eligIncome * (maxFoirPct / 100);
    const maxEmiAllowed = Math.max(0, affordableMonthlyObligation - eligEmi);

    const monthlyRate = eligRate / 12 / 100;
    const totalMonths = eligTenure * 12;

    let eligibleAmount = 0;
    if (maxEmiAllowed > 0 && monthlyRate > 0) {
      eligibleAmount =
        (maxEmiAllowed * (Math.pow(1 + monthlyRate, totalMonths) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
    } else if (maxEmiAllowed > 0 && monthlyRate === 0) {
      eligibleAmount = maxEmiAllowed * totalMonths;
    }

    const currentFoir = eligIncome > 0 ? ((eligEmi + maxEmiAllowed) / eligIncome) * 100 : 0;
    const baseFoir = eligIncome > 0 ? (eligEmi / eligIncome) * 100 : 0;

    // Safety assessment
    let riskLevel: "low" | "medium" | "high" = "low";
    if (baseFoir > 45) riskLevel = "high";
    else if (baseFoir > 30) riskLevel = "medium";

    return {
      maxEmiAllowed: Math.round(maxEmiAllowed),
      eligibleAmount: Math.round(eligibleAmount),
      riskLevel,
      currentFoir: Math.round(currentFoir),
      baseFoir: Math.round(baseFoir),
    };
  }, [eligIncome, eligEmi, eligRate, eligTenure]);

  // Calculations for Tab 3: Comparison
  const compCalculations = useMemo(() => {
    const calculateSingle = (amt: number, r: number, ten: number) => {
      const monthlyRate = r / 12 / 100;
      const totalMonths = ten * 12;
      const emi =
        monthlyRate === 0
          ? amt / totalMonths
          : (amt * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const totalPayable = emi * totalMonths;
      const totalInterest = totalPayable - amt;

      return {
        emi: Math.round(emi),
        totalPayable: Math.round(totalPayable),
        totalInterest: Math.round(totalInterest),
      };
    };

    const loanA = calculateSingle(compAmountA, compRateA, compTenureA);
    const loanB = calculateSingle(compAmountB, compRateB, compTenureB);

    const emiDiff = Math.abs(loanA.emi - loanB.emi);
    const interestDiff = Math.abs(loanA.totalInterest - loanB.totalInterest);
    const totalDiff = Math.abs(loanA.totalPayable - loanB.totalPayable);

    const betterLoan = loanA.totalPayable < loanB.totalPayable ? "A" : "B";

    return {
      loanA,
      loanB,
      emiDiff,
      interestDiff,
      totalDiff,
      betterLoan,
    };
  }, [compAmountA, compRateA, compTenureA, compAmountB, compRateB, compTenureB]);

  // Calculations for Tab 4: Prepayment Simulation
  const prepCalculations = useMemo(() => {
    const monthlyRate = prepRate / 12 / 100;
    const totalMonths = prepTenure * 12;

    // Base Loan EMI
    const emi =
      monthlyRate === 0
        ? prepAmount / totalMonths
        : (prepAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const standardTotalPayable = emi * totalMonths;
    const standardTotalInterest = standardTotalPayable - prepAmount;

    // Simulate prepayment payoff
    let balance = prepAmount;
    let totalInterestPaid = 0;
    let monthsElapsed = 0;

    while (balance > 0 && monthsElapsed < 600) {
      monthsElapsed += 1;
      const interestForMonth = balance * monthlyRate;
      let principalForMonth = emi - interestForMonth;

      // Apply extra prepayments
      if (monthsElapsed >= prepStartMonth) {
        if (prepType === "monthly") {
          principalForMonth += prepVal;
        } else if (prepType === "lump" && monthsElapsed === prepStartMonth) {
          principalForMonth += prepVal;
        }
      }

      if (balance <= principalForMonth) {
        totalInterestPaid += interestForMonth;
        balance = 0;
      } else {
        totalInterestPaid += interestForMonth;
        balance -= principalForMonth;
      }
    }

    const interestSaved = Math.max(0, standardTotalInterest - totalInterestPaid);
    const monthsSaved = Math.max(0, totalMonths - monthsElapsed);

    return {
      monthlyEmi: Math.round(emi),
      standardTotalInterest: Math.round(standardTotalInterest),
      actualMonths: monthsElapsed,
      totalMonths,
      interestSaved: Math.round(interestSaved),
      monthsSaved,
      percentageReduced: (monthsSaved / totalMonths) * 100,
    };
  }, [prepAmount, prepRate, prepTenure, prepType, prepVal, prepStartMonth]);

  // AI Chat Handler Integration for each tool output
  const handleAskAssistant = () => {
    let detailsStr = "";
    if (calcType === "emi") {
      detailsStr = `Calculated a ${activeConfig.name} on the EMI Calculator. ` +
        `Amount: ${formatCurrency(emiAmount)}, Rate: ${emiRate}%, Tenure: ${emiTenure} years. ` +
        `EMI: ${formatCurrency(emiCalculations.monthlyEmi)}/mo. ` +
        `Total interest payable: ${formatCurrency(emiCalculations.totalInterest)}. ` +
        (emiOptimize ? `Optimized with 1 extra EMI annually to save ${formatCurrency(emiCalculations.interestSaved)} and payoff ${Math.floor(emiCalculations.monthsSaved / 12)}y ${emiCalculations.monthsSaved % 12}m earlier.` : "");
    } else if (calcType === "eligibility") {
      detailsStr = `Checked Loan Eligibility & Affordability. ` +
        `Monthly income: ${formatCurrency(eligIncome)}, existing monthly debt EMIs: ${formatCurrency(eligEmi)}. ` +
        `Interest rate: ${eligRate}%, Tenure: ${eligTenure} years. ` +
        `Calculated maximum affordable EMI: ${formatCurrency(eligCalculations.maxEmiAllowed)} and total loan eligibility: ${formatCurrency(eligCalculations.eligibleAmount)}. ` +
        `Current Debt Obligation Ratio (FOIR): ${eligCalculations.baseFoir}% (Assessment: ${eligCalculations.riskLevel.toUpperCase()} RISK).`;
    } else if (calcType === "compare") {
      detailsStr = `Compared two loans side-by-side. ` +
        `Loan A: ${formatCurrency(compAmountA)} at ${compRateA}% for ${compTenureA} years (EMI: ${formatCurrency(compCalculations.loanA.emi)}, Total Payable: ${formatCurrency(compCalculations.loanA.totalPayable)}). ` +
        `Loan B: ${formatCurrency(compAmountB)} at ${compRateB}% for ${compTenureB} years (EMI: ${formatCurrency(compCalculations.loanB.emi)}, Total Payable: ${formatCurrency(compCalculations.loanB.totalPayable)}). ` +
        `Difference: EMI diff is ${formatCurrency(compCalculations.emiDiff)}, interest diff is ${formatCurrency(compCalculations.interestDiff)}. ` +
        `Loan ${compCalculations.betterLoan} is cheaper in total cost.`;
    } else if (calcType === "prepayment") {
      detailsStr = `Simulated prepayment/foreclosure impact on a ${formatCurrency(prepAmount)} loan at ${prepRate}% for ${prepTenure} years. ` +
        `Prepayment plan: ${prepType === "monthly" ? "Extra monthly payment" : "Lump sum"} of ${formatCurrency(prepVal)} starting in Month ${prepStartMonth}. ` +
        `Result: Saved ${formatCurrency(prepCalculations.interestSaved)} in interest, and paid off loan ${Math.floor(prepCalculations.monthsSaved / 12)} years ${prepCalculations.monthsSaved % 12} months sooner.`;
    }

    onApplyNow(activeConfig.name, emiAmount, emiRate, emiTenure, detailsStr);
  };

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[14px] font-bold text-gray-900 sm:text-[20px]">
              <Calculator className="h-5 w-5 text-primary shrink-0" />
              <span>FinHeal Loan Financial Center</span>
            </div>
            <div className="text-[10px] text-gray-400 sm:text-[14px]">
              Advanced calculator tools to compute EMIs, analyze prepayments, compare loans, and test eligibility.
            </div>
          </div>
        </div>

        {/* Currency Selector & Insights button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-[10px] px-2 py-1">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Currency:</span>
            <select
              value={currency.code}
              onChange={(e) => {
                const selected = CURRENCIES.find((c) => c.code === e.target.value);
                if (selected) setCurrency(selected);
              }}
              className="text-[12px] font-bold text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
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
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        {/* Tool Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[6px] border-b border-gray-100 pb-3.5 mb-[20px]">
          <button
            onClick={() => setCalcType("emi")}
            className={`px-3 py-2.5 rounded-[12px] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              calcType === "emi"
                ? "bg-primary text-white shadow-[0_8px_20px_rgba(50,68,230,0.2)]"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Coins className="h-4 w-4 shrink-0" />
            <span>EMI Calculator</span>
          </button>
          <button
            onClick={() => setCalcType("eligibility")}
            className={`px-3 py-2.5 rounded-[12px] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              calcType === "eligibility"
                ? "bg-primary text-white shadow-[0_8px_20px_rgba(50,68,230,0.2)]"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Eligibility Check</span>
          </button>
          <button
            onClick={() => setCalcType("compare")}
            className={`px-3 py-2.5 rounded-[12px] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              calcType === "compare"
                ? "bg-primary text-white shadow-[0_8px_20px_rgba(50,68,230,0.2)]"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Scale className="h-4 w-4 shrink-0" />
            <span>Compare Loans</span>
          </button>
          <button
            onClick={() => setCalcType("prepayment")}
            className={`px-3 py-2.5 rounded-[12px] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              calcType === "prepayment"
                ? "bg-primary text-white shadow-[0_8px_20px_rgba(50,68,230,0.2)]"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>Prepayment Tool</span>
          </button>
        </div>

        {/* ----------------- EMI CALCULATOR TAB ----------------- */}
        {calcType === "emi" && (
          <div className="animate-fade-up">
            {/* Category selection */}
            <div className="flex flex-wrap gap-[6px] border-b border-gray-100 pb-3 mb-[20px]">
              {LOAN_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-[8px] text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === t.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-[24px] lg:grid-cols-12">
              {/* Controls */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Input 1: Loan Amount */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[13px] font-semibold text-gray-700">Loan Amount ({activeConfig.name})</label>
                    <span className="text-[13px] font-bold text-primary">{formatCurrency(emiAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                    <input
                      type="number"
                      value={emiAmount === 0 ? "" : emiAmount}
                      onChange={(e) => setEmiAmount(Number(e.target.value))}
                      onBlur={() => {
                        const clamped = Math.max(
                          activeConfig.minAmount,
                          Math.min(activeConfig.maxAmount, emiAmount)
                        );
                        setEmiAmount(clamped);
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <input
                    type="range"
                    min={activeConfig.minAmount}
                    max={activeConfig.maxAmount}
                    step={activeConfig.amountStep}
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(Number(e.target.value))}
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
                    <span className="text-[13px] font-bold text-primary">{emiRate}%</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      step="0.05"
                      value={emiRate === 0 ? "" : emiRate}
                      onChange={(e) => setEmiRate(Number(e.target.value))}
                      onBlur={() => {
                        const clamped = Math.max(
                          activeConfig.minRate,
                          Math.min(activeConfig.maxRate, emiRate)
                        );
                        setEmiRate(Number(clamped.toFixed(2)));
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
                    value={emiRate}
                    onChange={(e) => setEmiRate(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                    <span>{activeConfig.minRate}%</span>
                    <span>{activeConfig.maxRate}%</span>
                  </div>
                </div>

                {/* Input 3: Tenure */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[13px] font-semibold text-gray-700">Loan Tenure</label>
                    <span className="text-[13px] font-bold text-primary">{emiTenure} Years</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      value={emiTenure === 0 ? "" : emiTenure}
                      onChange={(e) => setEmiTenure(Number(e.target.value))}
                      onBlur={() => {
                        const clamped = Math.max(
                          activeConfig.minTenure,
                          Math.min(activeConfig.maxTenure, emiTenure)
                        );
                        setEmiTenure(clamped);
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
                    value={emiTenure}
                    onChange={(e) => setEmiTenure(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                    <span>{activeConfig.minTenure} Y</span>
                    <span>{activeConfig.maxTenure} Y</span>
                  </div>
                </div>

                {/* Accelerator Switch */}
                <div className="flex items-start gap-2.5 bg-[#f6f7fe] border border-[#d4d8fa] p-3 rounded-[12px]">
                  <input
                    id="optimize-emi-checkbox"
                    type="checkbox"
                    checked={emiOptimize}
                    onChange={(e) => setEmiOptimize(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="optimize-emi-checkbox" className="text-[12px] text-gray-700 leading-normal select-none cursor-pointer">
                    <strong className="text-primary font-bold">Accelerate with 1 extra EMI annually.</strong> Make an additional repayment equal to your EMI once a year. Reduces interest burden and loan period.
                  </label>
                </div>

                {/* Dashboard Summary Card */}
                <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400">
                      Calculated Monthly EMI
                    </span>
                    <span className="text-[25px] font-bold text-primary mt-1">
                      {formatCurrency(emiCalculations.monthlyEmi)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAskAssistant}
                    className="px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)] hover:-translate-y-0.5"
                  >
                    Apply & Chat
                  </button>
                </div>
              </div>

              {/* Visualizations Side */}
              <div className="lg:col-span-5 flex flex-col gap-[20px] justify-center items-center">
                {/* Donut Chart */}
                <div className="relative flex flex-col items-center justify-center p-4">
                  <svg width="180" height="180" className="transform -rotate-90">
                    <circle cx="90" cy="90" r={emiCalculations.donutRadius} stroke="#f3f4f6" strokeWidth="12" fill="none" />
                    <circle
                      cx="90"
                      cy="90"
                      r={emiCalculations.donutRadius}
                      stroke="#3344e6" // Principal Blue
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${emiCalculations.principalStrokeLength} ${emiCalculations.donutCircumference}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                    {emiCalculations.totalInterest > 0 && (
                      <circle
                        cx="90"
                        cy="90"
                        r={emiCalculations.donutRadius}
                        stroke="#10b981" // Interest Emerald
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${emiCalculations.interestStrokeLength} ${emiCalculations.donutCircumference}`}
                        strokeDashoffset={emiCalculations.interestStrokeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                    <span className="text-[9px] font-bold uppercase tracking-[0.5px] text-gray-400">Total Payments</span>
                    <span className="text-[17px] font-bold text-gray-900 mt-0.5">
                      {formatCurrency(emiCalculations.totalPayable)}
                    </span>
                  </div>
                </div>

                {/* Legends */}
                <div className="w-full max-w-[280px] grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2.5 bg-gray-50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary block shrink-0" />
                      <span>Principal Amount</span>
                    </div>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{formatCurrency(emiAmount)}</span>
                    <span className="text-[9px] font-semibold text-gray-400">({Math.round(emiCalculations.principalPct)}%)</span>
                  </div>

                  <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2.5 bg-gray-50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
                      <span>Total Interest</span>
                    </div>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{formatCurrency(emiCalculations.totalInterest)}</span>
                    <span className="text-[9px] font-semibold text-gray-400">({Math.round(emiCalculations.interestPct)}%)</span>
                  </div>
                </div>

                {/* Optimized impact card */}
                {emiOptimize && (
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 flex flex-col gap-2.5 animate-fade-up">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16px]">✨</span>
                      <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-[0.5px]">Optimization Benefits</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="flex flex-col bg-white border border-emerald-100 rounded-[8px] p-2">
                        <span className="text-[10px] font-semibold text-gray-400">Interest Saved</span>
                        <span className="text-[15px] font-bold text-emerald-600 mt-0.5">
                          {formatCurrency(emiCalculations.interestSaved)}
                        </span>
                      </div>
                      <div className="flex flex-col bg-white border border-emerald-100 rounded-[8px] p-2">
                        <span className="text-[10px] font-semibold text-gray-400">Tenure Reduced</span>
                        <span className="text-[15px] font-bold text-emerald-600 mt-0.5">
                          {Math.floor(emiCalculations.monthsSaved / 12) > 0
                            ? `${Math.floor(emiCalculations.monthsSaved / 12)} Yr ${emiCalculations.monthsSaved % 12} Mo`
                            : `${emiCalculations.monthsSaved} Months`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amortization Schedule section */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => setShowAmortization(!showAmortization)}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-[12px] hover:bg-gray-100 transition-colors text-[13px] font-bold text-gray-800"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-primary" />
                  <span>Amortization Schedule (Year-by-Year)</span>
                </div>
                {showAmortization ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
              </button>

              {showAmortization && (
                <div className="mt-4 border border-gray-200 rounded-[12px] overflow-hidden animate-fade-up">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          <th className="p-3">Year</th>
                          <th className="p-3">Principal Paid</th>
                          <th className="p-3">Interest Paid</th>
                          {emiOptimize && <th className="p-3">Prepayments</th>}
                          <th className="p-3">End Balance</th>
                          <th className="p-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[12.5px] font-medium text-gray-700">
                        {emiCalculations.yearlyAmortization.map((yr) => (
                          <React.Fragment key={yr.year}>
                            <tr className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-primary">Year {yr.year}</td>
                              <td className="p-3">{formatCurrency(yr.principal)}</td>
                              <td className="p-3 text-emerald-600">{formatCurrency(yr.interest)}</td>
                              {emiOptimize && <td className="p-3 text-blue-600">{formatCurrency(yr.extra)}</td>}
                              <td className="p-3 font-semibold text-gray-900">{formatCurrency(yr.endBalance)}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setExpandedYear(expandedYear === yr.year ? null : yr.year)}
                                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                >
                                  {expandedYear === yr.year ? "Hide" : "Show Months"}
                                </button>
                              </td>
                            </tr>
                            {expandedYear === yr.year && (
                              <tr>
                                <td colSpan={emiOptimize ? 6 : 5} className="bg-gray-50/70 p-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-lg border border-gray-200 bg-white p-3 text-[11.5px] text-gray-600 animate-fade-up">
                                    {yr.months.map((m) => (
                                      <div key={m.month} className="border-b border-gray-100 pb-1.5">
                                        <div className="font-bold text-gray-800">Month {m.month}</div>
                                        <div>P: {formatCurrency(m.principal)}</div>
                                        <div className="text-emerald-600">I: {formatCurrency(m.interest)}</div>
                                        {m.extra > 0 && <div className="text-blue-600">Extra: {formatCurrency(m.extra)}</div>}
                                        <div className="text-[10px] text-gray-400 mt-0.5">Bal: {formatCurrency(m.balance)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- ELIGIBILITY CALCULATOR TAB ----------------- */}
        {calcType === "eligibility" && (
          <div className="animate-fade-up grid gap-6 lg:grid-cols-12">
            {/* Left inputs */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Monthly Income */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-gray-700">Gross Monthly Income</label>
                  <span className="text-[13px] font-bold text-primary">{formatCurrency(eligIncome)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                  <input
                    type="number"
                    value={eligIncome === 0 ? "" : eligIncome}
                    onChange={(e) => setEligIncome(Number(e.target.value))}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  type="range"
                  min={Math.round(10000 * currencyScale)}
                  max={Math.round(1000000 * currencyScale)}
                  step={Math.round(5000 * currencyScale)}
                  value={eligIncome}
                  onChange={(e) => setEligIncome(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Existing EMIs */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-gray-700">Existing Monthly Debt (EMIs)</label>
                  <span className="text-[13px] font-bold text-primary">{formatCurrency(eligEmi)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                  <input
                    type="number"
                    value={eligEmi === 0 ? "" : eligEmi}
                    onChange={(e) => setEligEmi(Number(e.target.value))}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.round(500000 * currencyScale)}
                  step={Math.round(2000 * currencyScale)}
                  value={eligEmi}
                  onChange={(e) => setEligEmi(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Rate and Tenure inputs row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-700 mb-1">Expected Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={eligRate}
                    onChange={(e) => setEligRate(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-700 mb-1">Tenure (Years)</label>
                  <input
                    type="number"
                    value={eligTenure}
                    onChange={(e) => setEligTenure(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Eligibility card summary */}
              <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400">
                    Max Eligible Loan Amount
                  </span>
                  <span className="text-[25px] font-bold text-primary mt-1">
                    {formatCurrency(eligCalculations.eligibleAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAskAssistant}
                  className="px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)] hover:-translate-y-0.5"
                >
                  Ask Assistant
                </button>
              </div>
            </div>

            {/* Right side Affordability assessment & Speedometer Gauge */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center gap-4">
              <span className="text-[12.5px] font-bold text-gray-700 uppercase tracking-wide">Affordability Safety Gauge</span>

              {/* Half Speedometer Gauge */}
              <div className="relative w-[180px] h-[100px] flex items-center justify-center overflow-hidden">
                <svg width="180" height="180" className="absolute top-0">
                  {/* Gauge background track */}
                  <path
                    d="M 20 90 A 70 70 0 0 1 160 90"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Color arcs for reference */}
                  {/* Green Arc (Safe < 35%) */}
                  <path
                    d="M 20 90 A 70 70 0 0 1 70 35"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    className="opacity-20"
                  />
                  {/* Yellow Arc (Moderate 35% - 50%) */}
                  <path
                    d="M 70 35 A 70 70 0 0 1 110 35"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    className="opacity-20"
                  />
                  {/* Red Arc (High > 50%) */}
                  <path
                    d="M 110 35 A 70 70 0 0 1 160 90"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    className="opacity-20"
                  />
                  {/* Active segment pointer or filled track */}
                  <path
                    d="M 20 90 A 70 70 0 0 1 160 90"
                    fill="none"
                    stroke={
                      eligCalculations.riskLevel === "low"
                        ? "#10b981"
                        : eligCalculations.riskLevel === "medium"
                        ? "#f59e0b"
                        : "#ef4444"
                    }
                    strokeWidth="12"
                    strokeDasharray={`${(eligCalculations.baseFoir / 100) * 220} 220`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>

                {/* Numeric reading overlay */}
                <div className="absolute bottom-1 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-gray-800">{eligCalculations.baseFoir}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Debt-to-Income</span>
                </div>
              </div>

              {/* Safety Evaluation Card */}
              <div className={`w-full max-w-[290px] border p-4 rounded-[14px] flex flex-col gap-2 ${
                eligCalculations.riskLevel === "low"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : eligCalculations.riskLevel === "medium"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                  <span className="text-[12px] font-bold uppercase tracking-wide">
                    {eligCalculations.riskLevel === "low"
                      ? "Healthy Debt Levels"
                      : eligCalculations.riskLevel === "medium"
                      ? "Moderate Obligation"
                      : "High Debt Obligation"}
                  </span>
                </div>
                <p className="text-[11px] leading-normal mt-1 opacity-90">
                  {eligCalculations.riskLevel === "low" &&
                    "Your existing EMIs consume less than 30% of your income. You are in a strong position to borrow responsibly."}
                  {eligCalculations.riskLevel === "medium" &&
                    "Your debt consumes 30% to 45% of your income. Financial advisors recommend keeping debt below 40% before taking new loans."}
                  {eligCalculations.riskLevel === "high" &&
                    "Existing monthly payments consume over 45% of your income. High risk of over-leverage. Consider debt consolidation first."}
                </p>
                <div className="border-t border-current/10 pt-2.5 mt-1 flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between font-semibold">
                    <span>Affordable Max EMI:</span>
                    <span>{formatCurrency(eligCalculations.maxEmiAllowed)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Target FOIR Cap:</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- LOAN COMPARISON TAB ----------------- */}
        {calcType === "compare" && (
          <div className="animate-fade-up flex flex-col gap-6">
            <div className="grid gap-[24px] md:grid-cols-2">
              {/* Loan A Column */}
              <div className="border border-gray-200 rounded-[14px] p-4 bg-gray-50/50 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px]">A</span>
                  <span className="text-[13px] font-bold text-gray-800">Loan Option A</span>
                </div>

                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-600 mb-1">Loan Amount</label>
                  <input
                    type="number"
                    value={compAmountA}
                    onChange={(e) => setCompAmountA(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                  />
                  <input
                    type="range"
                    min={Math.round(100000 * currencyScale)}
                    max={Math.round(10000000 * currencyScale)}
                    step={Math.round(50000 * currencyScale)}
                    value={compAmountA}
                    onChange={(e) => setCompAmountA(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded mt-2 cursor-pointer accent-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-600 mb-1">Rate (%)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={compRateA}
                      onChange={(e) => setCompRateA(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-600 mb-1">Tenure (Years)</label>
                    <input
                      type="number"
                      value={compTenureA}
                      onChange={(e) => setCompTenureA(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Loan B Column */}
              <div className="border border-gray-200 rounded-[14px] p-4 bg-gray-50/50 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px]">B</span>
                  <span className="text-[13px] font-bold text-gray-800">Loan Option B</span>
                </div>

                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-600 mb-1">Loan Amount</label>
                  <input
                    type="number"
                    value={compAmountB}
                    onChange={(e) => setCompAmountB(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                  />
                  <input
                    type="range"
                    min={Math.round(100000 * currencyScale)}
                    max={Math.round(10000000 * currencyScale)}
                    step={Math.round(50000 * currencyScale)}
                    value={compAmountB}
                    onChange={(e) => setCompAmountB(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded mt-2 cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-600 mb-1">Rate (%)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={compRateB}
                      onChange={(e) => setCompRateB(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-600 mb-1">Tenure (Years)</label>
                    <input
                      type="number"
                      value={compTenureB}
                      onChange={(e) => setCompTenureB(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Metrics Display */}
            <div className="grid gap-[24px] lg:grid-cols-12 items-center">
              {/* Graphical Comparison Bars */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <span className="text-[12.5px] font-bold text-gray-700 uppercase tracking-wide">Key Metrics Comparison</span>

                {/* Metric 1: EMI Bar */}
                <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-200 rounded-[12px] p-3">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Monthly EMI</span>
                    <span>Diff: {formatCurrency(compCalculations.emiDiff)}/mo</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-1">
                    {/* Loan A */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 w-16">Loan A</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${
                              (compCalculations.loanA.emi /
                                Math.max(compCalculations.loanA.emi, compCalculations.loanB.emi)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-gray-800 w-24 text-right">
                        {formatCurrency(compCalculations.loanA.emi)}
                      </span>
                    </div>
                    {/* Loan B */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 w-16">Loan B</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${
                              (compCalculations.loanB.emi /
                                Math.max(compCalculations.loanA.emi, compCalculations.loanB.emi)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-gray-800 w-24 text-right">
                        {formatCurrency(compCalculations.loanB.emi)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Interest Bar */}
                <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-200 rounded-[12px] p-3">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Total Interest Payable</span>
                    <span>Diff: {formatCurrency(compCalculations.interestDiff)}</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-1">
                    {/* Loan A */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 w-16">Loan A</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${
                              (compCalculations.loanA.totalInterest /
                                Math.max(
                                  compCalculations.loanA.totalInterest,
                                  compCalculations.loanB.totalInterest
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-gray-800 w-24 text-right">
                        {formatCurrency(compCalculations.loanA.totalInterest)}
                      </span>
                    </div>
                    {/* Loan B */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 w-16">Loan B</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${
                              (compCalculations.loanB.totalInterest /
                                Math.max(
                                  compCalculations.loanA.totalInterest,
                                  compCalculations.loanB.totalInterest
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-gray-800 w-24 text-right">
                        {formatCurrency(compCalculations.loanB.totalInterest)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation Assessment & Ask Button */}
              <div className="lg:col-span-5 flex flex-col gap-4 justify-center items-center">
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[16px]">💡</span>
                    <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-wide">
                      Comparison Verdict
                    </span>
                  </div>
                  <p className="text-[11.5px] leading-normal text-emerald-800 mt-1">
                    <strong>Loan Option {compCalculations.betterLoan}</strong> has the lowest overall cost of borrowing.
                    By selecting Option {compCalculations.betterLoan}, you save{" "}
                    <strong>{formatCurrency(compCalculations.totalDiff)}</strong> in total repayments compared to the alternative.
                  </p>
                  <div className="border-t border-emerald-100 pt-2 flex flex-col gap-1 text-[11px] text-emerald-700">
                    <div className="flex justify-between">
                      <span>Total Savings:</span>
                      <span className="font-bold">{formatCurrency(compCalculations.totalDiff)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EMI Difference:</span>
                      <span className="font-bold">
                        {formatCurrency(compCalculations.emiDiff)}
                        {compCalculations.loanA.emi < compCalculations.loanB.emi ? " (A cheaper)" : " (B cheaper)"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAskAssistant}
                  className="w-full max-w-[280px] py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Ask Assistant to Analyze</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- PREPAYMENT IMPACT TAB ----------------- */}
        {calcType === "prepayment" && (
          <div className="animate-fade-up grid gap-[24px] lg:grid-cols-12">
            {/* Left Controls */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Amount slider */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-gray-700">Base Loan Principal</label>
                  <span className="text-[13px] font-bold text-primary">{formatCurrency(prepAmount)}</span>
                </div>
                <input
                  type="range"
                  min={activeConfig.minAmount}
                  max={activeConfig.maxAmount}
                  step={activeConfig.amountStep}
                  value={prepAmount}
                  onChange={(e) => setPrepAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Rate and Tenure row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={prepRate}
                    onChange={(e) => setPrepRate(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-700 mb-1">Tenure (Years)</label>
                  <input
                    type="number"
                    value={prepTenure}
                    onChange={(e) => setPrepTenure(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Prepayment settings */}
              <div className="bg-gray-50 border border-gray-200 rounded-[14px] p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-[12.5px] font-bold text-gray-800">Prepayment Structure</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPrepType("monthly")}
                      className={`px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer ${
                        prepType === "monthly" ? "bg-primary text-white" : "bg-white border border-gray-300 text-gray-600"
                      }`}
                    >
                      Monthly Extra
                    </button>
                    <button
                      onClick={() => setPrepType("lump")}
                      className={`px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer ${
                        prepType === "lump" ? "bg-primary text-white" : "bg-white border border-gray-300 text-gray-600"
                      }`}
                    >
                      One-time Lump Sum
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-700 mb-1">
                      {prepType === "monthly" ? "Monthly Extra Payment" : "Lump Sum Amount"}
                    </label>
                    <div className="flex items-center gap-1.5 px-3 py-1 border border-gray-200 bg-white rounded-[8px]">
                      <span className="text-[12px] font-bold text-gray-400">{currency.symbol}</span>
                      <input
                        type="number"
                        value={prepVal}
                        onChange={(e) => setPrepVal(Number(e.target.value))}
                        className="w-full text-[13px] font-bold outline-none border-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-700 mb-1">Starts at Month</label>
                    <input
                      type="number"
                      min={1}
                      value={prepStartMonth}
                      onChange={(e) => setPrepStartMonth(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visualizations Side */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-4">
              <span className="text-[12.5px] font-bold text-gray-700 uppercase tracking-wide text-center">Tenure Reduction Visualizer</span>

              {/* Progress bars showing reduction */}
              <div className="flex flex-col gap-3 bg-gray-50 border border-gray-200 rounded-[12px] p-4 w-full">
                {/* Standard Tenure */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500">
                    <span>Original Payoff Schedule</span>
                    <span>{prepTenure} Years ({prepTenure * 12} Mo)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 w-full" />
                  </div>
                </div>

                {/* Reduced Tenure */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-bold text-emerald-600">
                    <span>New Payoff Schedule</span>
                    <span>
                      {Math.floor(prepCalculations.actualMonths / 12)} Yr {prepCalculations.actualMonths % 12} Mo
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(10, (prepCalculations.actualMonths / prepCalculations.totalMonths) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Prepayment impact banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px]">🎉</span>
                  <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-wide">
                    Savings & Payoff Speedup
                  </span>
                </div>
                <p className="text-[11.5px] leading-normal text-emerald-800 mt-1">
                  You will pay off your loan <strong>{Math.floor(prepCalculations.monthsSaved / 12)} Years {prepCalculations.monthsSaved % 12} Months</strong> earlier.
                  This simple prepayment action saves you <strong>{formatCurrency(prepCalculations.interestSaved)}</strong> in total interest!
                </p>
                <div className="border-t border-emerald-100 pt-2 mt-1 flex flex-col gap-1 text-[11px] text-emerald-700">
                  <div className="flex justify-between">
                    <span>Base Total Interest:</span>
                    <span>{formatCurrency(prepCalculations.standardTotalInterest)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total Interest Saved:</span>
                    <span>{formatCurrency(prepCalculations.interestSaved)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAskAssistant}
                className="py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <span>Apply & Chat with Advisor</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
