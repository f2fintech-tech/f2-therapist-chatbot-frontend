import React, { useState, useMemo, useEffect } from "react";
import { logCalculatorActivity } from "@/lib/backendAuth";
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
  AlertTriangle,
  HelpCircle,
  Landmark,
  Plus,
  Check,
  X,
  Download,
  Lock,
  User as UserIcon,
  Phone,
  FileText,
  Sparkles
} from "lucide-react";


interface LoanCalculatorViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onApplyNow: (loanType: string, amount: number, rate: number, tenure: number, details?: string) => void;
  onTalkToAdvisor?: () => void;
  isGuest?: boolean;
  onLoginRequired?: () => void;
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

export interface LenderProduct {
  id: string;
  name: string;
  lenderType: string;
  productType: string;
  category: string;
  minRate: number;
  maxRate: number;
  minTenureYears: number;
  maxTenureYears: number;
  minMonthlyIncome: number;
  minCibil: number;
  maxFoirPct: number;
  minAmount: number;
  maxAmount: number;
  disbursalTime: string;
  pros: string[];
  cons: string[];
  docsRequired: string[];
  processingFee?: string;
  emiPerLakhMin?: string;
  extraParams?: {
    eligibilityCriteria?: string;
    abb_to_emi_factor?: number;
    degreeCaps?: Record<string, number>;
  };
}

const LOAN_TYPES: LoanTypeConfig[] = [
  {
    id: "home",
    name: "Home Loan",
    icon: "🏠",
    defaultAmount: 5000000,
    minAmount: 500000,
    maxAmount: 300000000, // 30 Cr
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
    minAmount: 500000, // 5 Lakhs
    maxAmount: 50000000, // 5 Cr
    amountStep: 50000,
    defaultRate: 14.0,
    minRate: 10.0,
    maxRate: 24.0,
    rateStep: 0.1,
    defaultTenure: 5,
    minTenure: 1, // 12 Months
    maxTenure: 7, // 84 Months
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
    maxAmount: 4000000, // 40 Lakhs
    amountStep: 10000,
    defaultRate: 12.5,
    minRate: 10.0, // ROI starting at 10%
    maxRate: 24.0, // ROI up to 24%
    rateStep: 0.1,
    defaultTenure: 5,
    minTenure: 1, // 12 Months
    maxTenure: 6, // 72 Months
  },
  {
    id: "professional",
    name: "Professional Loan (Doctors)",
    icon: "🩺",
    defaultAmount: 3000000,
    minAmount: 100000,
    maxAmount: 50000000, // 5 Cr
    amountStep: 50000,
    defaultRate: 10.75,
    minRate: 8.5,
    maxRate: 20.0,
    rateStep: 0.05,
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
  onTalkToAdvisor,
  isGuest = false,
  onLoginRequired,
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
  const [emiAmount, setEmiAmount] = useState<string>(String(activeConfig.defaultAmount));
  const [emiRate, setEmiRate] = useState<string>(String(activeConfig.defaultRate));
  const [emiTenure, setEmiTenure] = useState<string>(String(activeConfig.defaultTenure));
  const [emiOptimize, setEmiOptimize] = useState<boolean>(false);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [isGraphExpanded, setIsGraphExpanded] = useState<boolean>(false);
  const [expandedGraphType, setExpandedGraphType] = useState<"stacked" | "comparison">("stacked");
  const [hoveredYearIndex, setHoveredYearIndex] = useState<number | null>(null);

  // Education Loan specific inputs
  const [eduMode, setEduMode] = useState<"quick" | "advanced">("quick");
  const [eduQuickCourseYears, setEduQuickCourseYears] = useState<string>("2");
  const [eduQuickMoratoriumMonths, setEduQuickMoratoriumMonths] = useState<string>("30");

  const [eduSanctionedAmount, setEduSanctionedAmount] = useState<string>("1500000");
  const [eduAdvancedRate, setEduAdvancedRate] = useState<string>("9.5");
  const [eduAdvancedTenure, setEduAdvancedTenure] = useState<string>("7");
  const [eduCourseMonths, setEduCourseMonths] = useState<string>("24");
  const [eduGraceMonths, setEduGraceMonths] = useState<string>("6");
  const [eduDisbursementType, setEduDisbursementType] = useState<"lump" | "multiple">("lump");
  const [eduDisbursements, setEduDisbursements] = useState<{ amount: string; month: string }[]>([]);
  const [eduInterestServicing, setEduInterestServicing] = useState<"accumulate" | "serviced" | "partial">("accumulate");
  const [eduPartialPaymentAmount, setEduPartialPaymentAmount] = useState<string>("5000");
  const [eduCapitalizationFrequency, setEduCapitalizationFrequency] = useState<"single" | "periodic">("single");
  const [eduCompoundingFrequency, setEduCompoundingFrequency] = useState<"monthly" | "quarterly" | "half-yearly" | "yearly">("monthly");

  const [eduPrepayMonthly, setEduPrepayMonthly] = useState<string>("0");
  const [eduPrepayLump, setEduPrepayLump] = useState<string>("0");
  const [eduPrepayStrategy, setEduPrepayStrategy] = useState<"reduce-emi" | "reduce-tenure">("reduce-tenure");

  const [profStructure, setProfStructure] = useState<"standard" | "flexi" | "dropdown">("standard");

  // Flexi OD States
  const [flexiLimit, setFlexiLimit] = useState<string>("5000000"); // default 50L
  const [flexiUtilized, setFlexiUtilized] = useState<string>("2000000"); // default 20L
  const [flexiRate, setFlexiRate] = useState<string>("10.75");
  const [flexiDeposit, setFlexiDeposit] = useState<string>("100000"); // default 1L

  // Drop Down OD States
  const [dropdownLimit, setDropdownLimit] = useState<string>("5000000"); // default 50L
  const [dropdownRate, setDropdownRate] = useState<string>("10.5");
  const [dropdownTenure, setDropdownTenure] = useState<string>("10");
  const [dropdownReductionPct, setDropdownReductionPct] = useState<string>("5");

  // Interactive graph hover state
  const [hoveredDDYear, setHoveredDDYear] = useState<number | null>(null);

  // Sync state when config changes
  useEffect(() => {
    setEmiAmount(String(activeConfig.defaultAmount));
    setEmiRate(String(activeConfig.defaultRate));
    setEmiTenure(String(activeConfig.defaultTenure));
    setEmiOptimize(false);
    setShowAmortization(false);
    setExpandedYear(null);
    setIsGraphExpanded(false);
    setExpandedGraphType("stacked");
    setHoveredYearIndex(null);
    setProfStructure("standard");

    // Sync Education Loan states
    setEduMode("quick");
    setEduQuickCourseYears("2");
    setEduQuickMoratoriumMonths("30");
    setEduSanctionedAmount(String(activeConfig.defaultAmount));
    setEduAdvancedRate(String(activeConfig.defaultRate));
    setEduAdvancedTenure(String(activeConfig.defaultTenure));
    setEduCourseMonths("24");
    setEduGraceMonths("6");
    setEduDisbursementType("lump");
    setEduDisbursements([
      { amount: String(activeConfig.defaultAmount), month: "1" }
    ]);
    setEduInterestServicing("accumulate");
    setEduPartialPaymentAmount(String(Math.round(5000 * currencyScale)));
    setEduCapitalizationFrequency("single");
    setEduCompoundingFrequency("monthly");
    setEduPrepayMonthly("0");
    setEduPrepayLump("0");
    setEduPrepayStrategy("reduce-tenure");
  }, [activeConfig]);

  // Sync education and Professional OD default amounts on currency scale shifts
  useEffect(() => {
    setEduPartialPaymentAmount(String(Math.round(5000 * currencyScale)));
    setFlexiLimit(String(Math.round(5000000 * currencyScale)));
    setFlexiUtilized(String(Math.round(2000000 * currencyScale)));
    setFlexiDeposit(String(Math.round(100000 * currencyScale)));
    setDropdownLimit(String(Math.round(5000000 * currencyScale)));
  }, [currencyScale]);

  // Tab 3: Compare Loans Inputs
  const [compTypeA, setCompTypeA] = useState<string>("home");
  const [compAmountA, setCompAmountA] = useState<string>(String(Math.round(2000000 * currencyScale)));
  const [compRateA, setCompRateA] = useState<string>("8.5");
  const [compTenureA, setCompTenureA] = useState<string>("20");

  const [compTypeB, setCompTypeB] = useState<string>("business");
  const [compAmountB, setCompAmountB] = useState<string>(String(Math.round(2000000 * currencyScale)));
  const [compRateB, setCompRateB] = useState<string>("14.0");
  const [compTenureB, setCompTenureB] = useState<string>("5");

  const handleCompTypeAChange = (typeId: string) => {
    setCompTypeA(typeId);
    const selected = LOAN_TYPES.find((t) => t.id === typeId);
    if (selected) {
      setCompAmountA(String(Math.round(selected.defaultAmount * currencyScale)));
      setCompRateA(String(selected.defaultRate));
      setCompTenureA(String(selected.defaultTenure));
    }
  };

  const handleCompTypeBChange = (typeId: string) => {
    setCompTypeB(typeId);
    const selected = LOAN_TYPES.find((t) => t.id === typeId);
    if (selected) {
      setCompAmountB(String(Math.round(selected.defaultAmount * currencyScale)));
      setCompRateB(String(selected.defaultRate));
      setCompTenureB(String(selected.defaultTenure));
    }
  };

  useEffect(() => {
    const defaultAmtA = LOAN_TYPES.find((t) => t.id === compTypeA)?.defaultAmount || 2000000;
    const defaultAmtB = LOAN_TYPES.find((t) => t.id === compTypeB)?.defaultAmount || 2000000;
    setCompAmountA(String(Math.round(defaultAmtA * currencyScale)));
    setCompAmountB(String(Math.round(defaultAmtB * currencyScale)));
  }, [currencyScale, compTypeA, compTypeB]);

  const labelA = useMemo(() => {
    return LOAN_TYPES.find(t => t.id === compTypeA)?.name.split(" ")[0] || "Loan A";
  }, [compTypeA]);

  const labelB = useMemo(() => {
    return LOAN_TYPES.find(t => t.id === compTypeB)?.name.split(" ")[0] || "Loan B";
  }, [compTypeB]);

  // Tab 4: Prepayment Inputs
  const [prepAmount, setPrepAmount] = useState<string>(String(activeConfig.defaultAmount));
  const [prepRate, setPrepRate] = useState<string>(String(activeConfig.defaultRate));
  const [prepTenure, setPrepTenure] = useState<string>(String(activeConfig.defaultTenure));
  const [prepType, setPrepType] = useState<"lump" | "monthly">("monthly");
  const [prepVal, setPrepVal] = useState<string>(String(Math.round(10000 * currencyScale)));
  const [prepStartMonth, setPrepStartMonth] = useState<string>("12");

  useEffect(() => {
    setPrepAmount(String(activeConfig.defaultAmount));
    setPrepRate(String(activeConfig.defaultRate));
    setPrepTenure(String(activeConfig.defaultTenure));
    setPrepVal(String(Math.round(10000 * currencyScale)));
    setPrepStartMonth("12");
  }, [activeConfig]);

  // Debounced API logging for calculator activities
  useEffect(() => {
    if (!userId) return;

    const delayDebounceFn = setTimeout(() => {
      let payloadInputs: Record<string, any> = {};
      let loanType: string | null = null;

      if (calcType === "emi") {
        loanType = activeTab;
        payloadInputs = {
          amount: Number(emiAmount) || 0,
          rate: Number(emiRate) || 0,
          tenure: Number(emiTenure) || 0,
          optimize: emiOptimize,
        };

        if (activeTab === "education") {
          payloadInputs.educationLoan = {
            mode: eduMode,
            quickCourseYears: Number(eduQuickCourseYears) || 0,
            quickMoratoriumMonths: Number(eduQuickMoratoriumMonths) || 0,
            sanctionedAmount: Number(eduSanctionedAmount) || 0,
            advancedRate: Number(eduAdvancedRate) || 0,
            advancedTenure: Number(eduAdvancedTenure) || 0,
            courseMonths: Number(eduCourseMonths) || 0,
            graceMonths: Number(eduGraceMonths) || 0,
            disbursementType: eduDisbursementType,
            disbursements: eduDisbursements,
            interestServicing: eduInterestServicing,
            partialPaymentAmount: Number(eduPartialPaymentAmount) || 0,
            capitalizationFrequency: eduCapitalizationFrequency,
            compoundingFrequency: eduCompoundingFrequency,
            prepayMonthly: Number(eduPrepayMonthly) || 0,
            prepayLump: Number(eduPrepayLump) || 0,
            prepayStrategy: eduPrepayStrategy,
          };
        }
      } else if (calcType === "compare") {
        loanType = `${compTypeA}_vs_${compTypeB}`;
        payloadInputs = {
          loan_a: {
            type: compTypeA,
            amount: Number(compAmountA) || 0,
            rate: Number(compRateA) || 0,
            tenure: Number(compTenureA) || 0,
          },
          loan_b: {
            type: compTypeB,
            amount: Number(compAmountB) || 0,
            rate: Number(compRateB) || 0,
            tenure: Number(compTenureB) || 0,
          },
        };
      } else if (calcType === "prepayment") {
        loanType = activeTab;
        payloadInputs = {
          amount: Number(prepAmount) || 0,
          rate: Number(prepRate) || 0,
          tenure: Number(prepTenure) || 0,
          prep_type: prepType,
          prep_value: Number(prepVal) || 0,
          start_month: Number(prepStartMonth) || 1,
        };
      }

      logCalculatorActivity({
        user_id: userId,
        calculator_type: calcType,
        loan_type: loanType,
        inputs: payloadInputs,
      }).catch((err) => {
        console.error("Failed to log calculator activity:", err);
      });
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(delayDebounceFn);
  }, [
    userId,
    calcType,
    activeTab,
    emiAmount,
    emiRate,
    emiTenure,
    emiOptimize,
    eduMode,
    eduQuickCourseYears,
    eduQuickMoratoriumMonths,
    eduSanctionedAmount,
    eduAdvancedRate,
    eduAdvancedTenure,
    eduCourseMonths,
    eduGraceMonths,
    eduDisbursementType,
    eduDisbursements,
    eduInterestServicing,
    eduPartialPaymentAmount,
    eduCapitalizationFrequency,
    eduCompoundingFrequency,
    eduPrepayMonthly,
    eduPrepayLump,
    eduPrepayStrategy,
    compTypeA,
    compAmountA,
    compRateA,
    compTenureA,
    compTypeB,
    compAmountB,
    compRateB,
    compTenureB,
    prepAmount,
    prepRate,
    prepTenure,
    prepType,
    prepVal,
    prepStartMonth,
  ]);

  // Calculations for Tab 1: EMI
  const emiCalculations = useMemo(() => {
    if (activeTab === "education") {
      const isQuick = eduMode === "quick";
      const sanctionedAmount = isQuick ? (Number(emiAmount) || 0) : (Number(eduSanctionedAmount) || 0);
      const rateVal = isQuick ? (Number(emiRate) || 0) : (Number(eduAdvancedRate) || 0);
      const tenureVal = isQuick ? (Number(emiTenure) || 0) : (Number(eduAdvancedTenure) || 0);
      const courseMonths = isQuick ? (Number(eduQuickCourseYears) * 12) : (Number(eduCourseMonths) || 0);
      const graceMonths = isQuick ? (Number(eduQuickMoratoriumMonths) - courseMonths) : (Number(eduGraceMonths) || 0);
      const moratoriumMonths = isQuick ? (Number(eduQuickMoratoriumMonths) || 0) : (courseMonths + graceMonths);

      const prepayMonthly = isQuick ? 0 : (Number(eduPrepayMonthly) || 0);
      const prepayLump = isQuick ? 0 : (Number(eduPrepayLump) || 0);
      const prepayStrategy = isQuick ? "reduce-tenure" : eduPrepayStrategy;

      let disbursements: { amount: number; month: number }[] = [];
      if (isQuick || eduDisbursementType === "lump") {
        disbursements = [{ amount: sanctionedAmount, month: 1 }];
      } else {
        disbursements = eduDisbursements.map(d => ({
          amount: Number(d.amount) || 0,
          month: Number(d.month) || 1
        }));
      }

      const interestServicing = isQuick ? "accumulate" : eduInterestServicing;
      const partialPaymentAmount = isQuick ? 0 : (Number(eduPartialPaymentAmount) || 0);
      const capitalizationFrequency = isQuick ? "single" : eduCapitalizationFrequency;
      const compoundingFrequency = isQuick ? "monthly" : eduCompoundingFrequency;

      const runSimulation = (
        servicingOverride?: "accumulate" | "serviced" | "partial",
        prepayMonthlyOverride?: number,
        prepayLumpOverride?: number
      ) => {
        const actualServicing = servicingOverride || interestServicing;
        const actualPrepayMonthly = prepayMonthlyOverride !== undefined ? prepayMonthlyOverride : prepayMonthly;
        const actualPrepayLump = prepayLumpOverride !== undefined ? prepayLumpOverride : prepayLump;
        const monthlyRate = rateVal / 12 / 100;
        const tenureMonths = tenureVal * 12;

        let outstandingPrincipal = 0;
        let accruedUnpaidInterest = 0;
        let totalInterestPaidDuringMoratorium = 0;
        const monthlyAmortization: { month: number; interest: number; principal: number; extra: number; balance: number }[] = [];

        // Moratorium Phase
        for (let m = 1; m <= moratoriumMonths; m++) {
          const disbsThisMonth = disbursements.filter(d => d.month === m);
          disbsThisMonth.forEach(d => {
            outstandingPrincipal += d.amount;
          });

          const interestAccrued = outstandingPrincipal * monthlyRate;
          accruedUnpaidInterest += interestAccrued;

          let payment = 0;
          if (actualServicing === "serviced") {
            payment = interestAccrued;
          } else if (actualServicing === "partial") {
            payment = Math.min(accruedUnpaidInterest, partialPaymentAmount);
          }
          accruedUnpaidInterest = Math.max(0, accruedUnpaidInterest - payment);
          totalInterestPaidDuringMoratorium += payment;

          if (capitalizationFrequency === "periodic" && outstandingPrincipal > 0) {
            let isCompoundingMonth = false;
            if (compoundingFrequency === "monthly") isCompoundingMonth = true;
            else if (compoundingFrequency === "quarterly" && m % 3 === 0) isCompoundingMonth = true;
            else if (compoundingFrequency === "half-yearly" && m % 6 === 0) isCompoundingMonth = true;
            else if (compoundingFrequency === "yearly" && m % 12 === 0) isCompoundingMonth = true;

            if (isCompoundingMonth) {
              outstandingPrincipal += accruedUnpaidInterest;
              accruedUnpaidInterest = 0;
            }
          }

          monthlyAmortization.push({
            month: m,
            interest: Math.round(payment),
            principal: 0,
            extra: 0,
            balance: Math.round(outstandingPrincipal + accruedUnpaidInterest)
          });
        }

        outstandingPrincipal += accruedUnpaidInterest;
        accruedUnpaidInterest = 0;
        const effectiveRepaymentPrincipal = outstandingPrincipal;

        // Repayment Phase
        let currentEmi = 0;
        if (effectiveRepaymentPrincipal > 0 && tenureMonths > 0) {
          currentEmi = monthlyRate === 0
            ? effectiveRepaymentPrincipal / tenureMonths
            : (effectiveRepaymentPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
            (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        }
        const initialEmi = currentEmi;

        let repMonthsElapsed = 0;
        while (outstandingPrincipal > 0 && repMonthsElapsed < 600) {
          repMonthsElapsed += 1;
          const m = moratoriumMonths + repMonthsElapsed;
          const interestForMonth = outstandingPrincipal * monthlyRate;
          const interestPaid = Math.min(outstandingPrincipal + interestForMonth, interestForMonth);
          const emiPaid = Math.min(outstandingPrincipal + interestPaid, currentEmi);
          const principalPaidFromEmi = Math.max(0, emiPaid - interestPaid);

          const extraPaid = actualPrepayMonthly + (repMonthsElapsed % 12 === 0 ? actualPrepayLump : 0);
          const extraPrincipalPaid = Math.min(outstandingPrincipal - principalPaidFromEmi, extraPaid);

          const totalPrincipalPaid = principalPaidFromEmi + extraPrincipalPaid;
          outstandingPrincipal -= totalPrincipalPaid;

          monthlyAmortization.push({
            month: m,
            interest: Math.round(interestPaid),
            principal: Math.round(principalPaidFromEmi),
            extra: Math.round(extraPrincipalPaid),
            balance: Math.max(0, Math.round(outstandingPrincipal))
          });

          if (extraPrincipalPaid > 0 && prepayStrategy === "reduce-emi") {
            const remainingMonths = tenureMonths - repMonthsElapsed;
            if (remainingMonths > 0 && outstandingPrincipal > 0) {
              currentEmi = monthlyRate === 0
                ? outstandingPrincipal / remainingMonths
                : (outstandingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
                (Math.pow(1 + monthlyRate, remainingMonths) - 1);
            }
          }
        }

        const totalInterest = monthlyAmortization.reduce((sum, item) => sum + item.interest, 0);
        const totalPrincipal = monthlyAmortization.reduce((sum, item) => sum + item.principal + item.extra, 0);
        const totalPayable = totalInterest + totalPrincipal;

        return {
          effectiveRepaymentPrincipal,
          initialEmi,
          totalInterest,
          totalPayable,
          actualMonths: monthlyAmortization.length,
          monthlyAmortization,
          totalInterestPaidDuringMoratorium
        };
      };

      const activeResult = runSimulation();
      const baselineResult = runSimulation(undefined, 0, 0);
      const noPaymentResult = runSimulation("accumulate", 0, 0);
      const fullServicedResult = runSimulation("serviced", 0, 0);

      const savings = Math.max(0, noPaymentResult.totalPayable - fullServicedResult.totalPayable);
      const interestSaved = Math.max(0, baselineResult.totalInterest - activeResult.totalInterest);
      const monthsSaved = Math.max(0, baselineResult.actualMonths - activeResult.actualMonths);

      const yearlyAmortization: {
        year: number;
        interest: number;
        principal: number;
        extra: number;
        endBalance: number;
        months: typeof activeResult.monthlyAmortization;
      }[] = [];

      for (let i = 0; i < activeResult.monthlyAmortization.length; i += 12) {
        const chunk = activeResult.monthlyAmortization.slice(i, i + 12);
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

      const totalDisbursed = isQuick ? sanctionedAmount : disbursements.reduce((sum, d) => sum + d.amount, 0);
      const capitalizedInterest = Math.max(0, activeResult.effectiveRepaymentPrincipal - totalDisbursed);
      const denominator = activeResult.totalPayable || 1;
      const principalPct = (totalDisbursed / denominator) * 100;
      const interestPct = (activeResult.totalInterest / denominator) * 100;
      const capitalizedInterestPct = (capitalizedInterest / denominator) * 100;

      const radius = 70;
      const circumference = 2 * Math.PI * radius;

      return {
        monthlyEmi: Math.round(activeResult.initialEmi),
        totalPayable: Math.round(activeResult.totalPayable),
        totalInterest: Math.round(activeResult.totalInterest),
        actualMonths: activeResult.actualMonths,
        principalPct,
        interestPct,
        capitalizedInterestPct,
        capitalizedInterest: Math.round(capitalizedInterest),
        interestSaved: Math.round(interestSaved),
        monthsSaved,
        donutRadius: radius,
        donutCircumference: circumference,
        principalStrokeLength: (principalPct / 100) * circumference,
        interestStrokeLength: (interestPct / 100) * circumference,
        interestStrokeOffset: -((principalPct / 100) * circumference),
        yearlyAmortization,
        maxYearlyOutflow: Math.round(
          Math.max(...yearlyAmortization.map((yr) => yr.principal + yr.interest + yr.extra)) || 1
        ),
        comparison: {
          noPayment: noPaymentResult,
          fullServiced: fullServicedResult,
          savings
        }
      };
    }

    const amountVal = Number(emiAmount) || 0;
    const rateVal = Number(emiRate) || 0;
    const tenureVal = Number(emiTenure) || 0;

    const monthlyRate = rateVal / 12 / 100;
    const totalMonths = tenureVal * 12;

    const emi =
      monthlyRate === 0
        ? totalMonths === 0 ? 0 : amountVal / totalMonths
        : (amountVal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const standardTotalPayable = emi * totalMonths;
    const standardTotalInterest = standardTotalPayable - amountVal;

    // Simulation for one extra EMI per year optimization
    let balance = amountVal;
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

    const optimizedTotalPayable = amountVal + totalInterestPaid;
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
    const principalPct = (amountVal / activeTotalPayable) * 100 || 0;
    const interestPct = (activeTotalInterest / activeTotalPayable) * 100 || 0;

    return {
      monthlyEmi: Math.round(emi),
      totalPayable: Math.round(activeTotalPayable),
      totalInterest: Math.round(activeTotalInterest),
      actualMonths: activeMonths,
      principalPct,
      interestPct,
      capitalizedInterestPct: 0,
      capitalizedInterest: 0,
      interestSaved: Math.round(interestSaved),
      monthsSaved,
      donutRadius: radius,
      donutCircumference: circumference,
      principalStrokeLength: (principalPct / 100) * circumference,
      interestStrokeLength: (interestPct / 100) * circumference,
      interestStrokeOffset: -((principalPct / 100) * circumference),
      yearlyAmortization,
      maxYearlyOutflow: Math.round(
        Math.max(...yearlyAmortization.map((yr) => yr.principal + yr.interest + yr.extra)) || 1
      ),
      comparison: undefined,
    };
  }, [
    activeTab,
    emiAmount,
    emiRate,
    emiTenure,
    emiOptimize,
    eduMode,
    eduQuickCourseYears,
    eduQuickMoratoriumMonths,
    eduSanctionedAmount,
    eduAdvancedRate,
    eduAdvancedTenure,
    eduCourseMonths,
    eduGraceMonths,
    eduDisbursementType,
    eduDisbursements,
    eduInterestServicing,
    eduPartialPaymentAmount,
    eduCapitalizationFrequency,
    eduCompoundingFrequency,
    eduPrepayMonthly,
    eduPrepayLump,
    eduPrepayStrategy,
    currencyScale
  ]);

  // Calculations for Flexi OD (Doctors)
  const flexiODCalculations = useMemo(() => {
    const limit = Number(flexiLimit) || 0;
    const utilized = Number(flexiUtilized) || 0;
    const rate = Number(flexiRate) || 0;
    const deposit = Number(flexiDeposit) || 0;

    const used = utilized;
    const available = Math.max(0, limit - utilized);
    const utilizationPct = limit > 0 ? Math.min(100, (utilized / limit) * 100) : 0;

    const dailyInterest = (utilized * (rate / 100)) / 365;
    const monthlyInterest = (utilized * (rate / 100)) / 12;
    const annualInterest = utilized * (rate / 100);

    return {
      limit,
      utilized,
      rate,
      deposit,
      used,
      available,
      utilizationPct,
      dailyInterest,
      monthlyInterest,
      annualInterest,
    };
  }, [flexiLimit, flexiUtilized, flexiRate, flexiDeposit]);

  // Calculations for Drop Down OD (Doctors)
  const dropdownODCalculations = useMemo(() => {
    const initialLimit = Number(dropdownLimit) || 0;
    const rate = Number(dropdownRate) || 0;
    const tenure = Number(dropdownTenure) || 0;
    const reductionPct = Number(dropdownReductionPct) || 0;

    const yearlyLimits: { year: number; limit: number }[] = [];
    for (let t = 1; t <= tenure; t++) {
      const currentLimit = Math.max(0, initialLimit * (1 - (t - 1) * (reductionPct / 100)));
      yearlyLimits.push({ year: t, limit: currentLimit });
    }

    return {
      initialLimit,
      rate,
      tenure,
      reductionPct,
      yearlyLimits,
    };
  }, [dropdownLimit, dropdownRate, dropdownTenure, dropdownReductionPct]);

  // Chart data calculations for Cumulative Amortization curve
  const emiChartData = useMemo(() => {
    const amountVal = activeTab === "education" ? (eduMode === "quick" ? (Number(emiAmount) || 0) : (Number(eduSanctionedAmount) || 0)) : (Number(emiAmount) || 0);
    const tenureVal = Number(emiTenure) || 1;

    // Balance Points
    const balancePoints = [activeTab === "education" ? 0 : amountVal];
    // Cumulative Interest Points
    const interestPoints = [0];

    let cumulativeInterest = 0;
    emiCalculations.yearlyAmortization.forEach((yr) => {
      balancePoints.push(yr.endBalance);
      cumulativeInterest += yr.interest;
      interestPoints.push(cumulativeInterest);
    });

    const maxY = Math.max(amountVal, emiCalculations.totalInterest, ...balancePoints) || 100;
    const pointsCount = balancePoints.length;

    const chartWidth = 256;
    const chartHeight = 110;

    // Build SVG path strings
    let balancePath = "";
    let interestPath = "";
    let balanceLine = "";
    let interestLine = "";

    for (let i = 0; i < pointsCount; i++) {
      const x = (i / (pointsCount - 1)) * chartWidth;
      // Subtract 5px padding from top and bottom to prevent line cuts
      const yBal = chartHeight - (balancePoints[i] / maxY) * (chartHeight - 10) - 5;
      const yInt = chartHeight - (interestPoints[i] / maxY) * (chartHeight - 10) - 5;

      if (i === 0) {
        balanceLine = `M ${x} ${yBal}`;
        interestLine = `M ${x} ${yInt}`;
        balancePath = `M ${x} ${chartHeight} L ${x} ${yBal}`;
        interestPath = `M ${x} ${chartHeight} L ${x} ${yInt}`;
      } else {
        balanceLine += ` L ${x} ${yBal}`;
        interestLine += ` L ${x} ${yInt}`;
        balancePath += ` L ${x} ${yBal}`;
        interestPath += ` L ${x} ${yInt}`;
      }
    }

    if (pointsCount > 0) {
      balancePath += ` L ${chartWidth} ${chartHeight} Z`;
      interestPath += ` L ${chartWidth} ${chartHeight} Z`;
    }

    return {
      balancePath,
      interestPath,
      balanceLine,
      interestLine,
      maxY,
    };
  }, [activeTab, emiAmount, emiCalculations.yearlyAmortization, emiCalculations.totalInterest, emiTenure, eduMode, eduSanctionedAmount]);



  // Calculations for Tab 3: Comparison
  const compCalculations = useMemo(() => {
    const amtAVal = Number(compAmountA) || 0;
    const rateAVal = Number(compRateA) || 0;
    const tenureAVal = Number(compTenureA) || 0;

    const amtBVal = Number(compAmountB) || 0;
    const rateBVal = Number(compRateB) || 0;
    const tenureBVal = Number(compTenureB) || 0;

    const calculateSingle = (amt: number, r: number, ten: number) => {
      const monthlyRate = r / 12 / 100;
      const totalMonths = ten * 12;
      const emi =
        monthlyRate === 0
          ? totalMonths === 0 ? 0 : amt / totalMonths
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

    const loanA = calculateSingle(amtAVal, rateAVal, tenureAVal);
    const loanB = calculateSingle(amtBVal, rateBVal, tenureBVal);

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
    const amountVal = Number(prepAmount) || 0;
    const rateVal = Number(prepRate) || 0;
    const tenureVal = Number(prepTenure) || 0;
    const prepValNum = Number(prepVal) || 0;
    const startMonthVal = Number(prepStartMonth) || 1;

    const monthlyRate = rateVal / 12 / 100;
    const totalMonths = tenureVal * 12;

    // Base Loan EMI
    const emi =
      monthlyRate === 0
        ? totalMonths === 0 ? 0 : amountVal / totalMonths
        : (amountVal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const standardTotalPayable = emi * totalMonths;
    const standardTotalInterest = standardTotalPayable - amountVal;

    // Simulate prepayment payoff
    let balance = amountVal;
    let totalInterestPaid = 0;
    let monthsElapsed = 0;

    while (balance > 0 && monthsElapsed < 600) {
      monthsElapsed += 1;
      const interestForMonth = balance * monthlyRate;
      let principalForMonth = emi - interestForMonth;

      // Apply extra prepayments
      if (monthsElapsed >= startMonthVal) {
        if (prepType === "monthly") {
          principalForMonth += prepValNum;
        } else if (prepType === "lump" && monthsElapsed === startMonthVal) {
          principalForMonth += prepValNum;
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
      percentageReduced: totalMonths === 0 ? 0 : (monthsSaved / totalMonths) * 100,
    };
  }, [prepAmount, prepRate, prepTenure, prepType, prepVal, prepStartMonth]);

  const eduErrors = useMemo(() => {
    if (activeTab !== "education") return [];
    const errors: string[] = [];

    if (eduMode === "quick") {
      const amountVal = Number(emiAmount) || 0;
      const rateVal = Number(emiRate) || 0;
      const tenureVal = Number(emiTenure) || 0;
      const courseYearsVal = Number(eduQuickCourseYears) || 0;
      const morMonthsVal = Number(eduQuickMoratoriumMonths) || 0;

      if (amountVal <= 0) errors.push("Loan amount must be greater than zero.");
      if (rateVal <= 0) errors.push("Interest rate must be greater than zero.");
      if (tenureVal <= 0) errors.push("Repayment tenure must be greater than zero.");
      if (courseYearsVal <= 0) errors.push("Course duration must be greater than zero.");
      if (morMonthsVal < 0) errors.push("Moratorium period cannot be negative.");
    } else {
      const amountVal = Number(eduSanctionedAmount) || 0;
      const rateVal = Number(eduAdvancedRate) || 0;
      const tenureVal = Number(eduAdvancedTenure) || 0;
      const courseMonthsVal = Number(eduCourseMonths) || 0;
      const graceMonthsVal = Number(eduGraceMonths) || 0;
      const partialVal = Number(eduPartialPaymentAmount) || 0;

      if (amountVal <= 0) errors.push("Sanctioned loan amount must be greater than zero.");
      if (rateVal <= 0) errors.push("Interest rate must be greater than zero.");
      if (tenureVal <= 0) errors.push("Repayment tenure must be greater than zero.");
      if (courseMonthsVal <= 0) errors.push("Course duration must be greater than zero.");
      if (graceMonthsVal < 0) errors.push("Grace period cannot be negative.");
      if (graceMonthsVal > 24) errors.push("Grace period cannot exceed 24 months.");
      if (eduInterestServicing === "partial" && partialVal < 0) errors.push("Partial interest payment amount cannot be negative.");

      if (eduDisbursementType === "multiple") {
        const totalDisb = eduDisbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        if (totalDisb > amountVal + 0.01) {
          errors.push(`Total Scheduled Disbursements (${formatCurrency(totalDisb)}) cannot exceed the Sanctioned Loan Amount (${formatCurrency(amountVal)}).`);
        }
        eduDisbursements.forEach((d, idx) => {
          const dAmt = Number(d.amount) || 0;
          const dMonth = Number(d.month) || 0;
          const morMonthsTotal = courseMonthsVal + graceMonthsVal;
          if (dAmt <= 0) errors.push(`Disbursement #${idx + 1} amount must be greater than zero.`);
          if (dMonth <= 0 || dMonth > morMonthsTotal) {
            errors.push(`Disbursement #${idx + 1} month must be between 1 and ${morMonthsTotal} (moratorium duration).`);
          }
        });
      }
    }
    return errors;
  }, [
    activeTab,
    eduMode,
    emiAmount,
    emiRate,
    emiTenure,
    eduQuickCourseYears,
    eduQuickMoratoriumMonths,
    eduSanctionedAmount,
    eduAdvancedRate,
    eduAdvancedTenure,
    eduCourseMonths,
    eduGraceMonths,
    eduDisbursementType,
    eduDisbursements,
    eduInterestServicing,
    eduPartialPaymentAmount,
    currencyScale
  ]);

  // AI Chat Handler Integration for each tool output
  const handleAskAssistant = () => {
    let detailsStr = "";

    if (calcType === "emi") {
      if (activeTab === "professional" && profStructure === "flexi") {
        detailsStr = `Calculated a Professional Loan (Doctors) with Flexi OD structure on the EMI Calculator. ` +
          `Credit Limit: ${formatCurrency(Number(flexiLimit) || 0)}, Utilized Amount: ${formatCurrency(Number(flexiUtilized) || 0)}, Rate: ${Number(flexiRate) || 0}%, Expected Monthly Deposit: ${formatCurrency(Number(flexiDeposit) || 0)}. ` +
          `Estimated Monthly Interest: ${formatCurrency(flexiODCalculations.monthlyInterest)}, Daily Interest: ${formatCurrency(flexiODCalculations.dailyInterest)}, Annual Interest: ${formatCurrency(flexiODCalculations.annualInterest)}.`;
      } else if (activeTab === "professional" && profStructure === "dropdown") {
        detailsStr = `Calculated a Professional Loan (Doctors) with Drop Down OD structure on the EMI Calculator. ` +
          `Initial Limit: ${formatCurrency(Number(dropdownLimit) || 0)}, Rate: ${Number(dropdownRate) || 0}%, Tenure: ${Number(dropdownTenure) || 0} Years, Reduction Schedule: ${Number(dropdownReductionPct) || 0}% / Year.`;
      } else {
        detailsStr = `Calculated a ${activeConfig.name} on the EMI Calculator. ` +
          `Amount: ${formatCurrency(Number(emiAmount) || 0)}, Rate: ${Number(emiRate) || 0}%, Tenure: ${Number(emiTenure) || 0} years. ` +
          `EMI: ${formatCurrency(emiCalculations.monthlyEmi)}/mo. ` +
          `Total interest payable: ${formatCurrency(emiCalculations.totalInterest)}. ` +
          (emiOptimize ? `Optimized with 1 extra EMI annually to save ${formatCurrency(emiCalculations.interestSaved)} and payoff ${Math.floor(emiCalculations.monthsSaved / 12)}y ${emiCalculations.monthsSaved % 12}m earlier.` : "");
      }
    } else if (calcType === "compare") {
      const typeA = LOAN_TYPES.find((t) => t.id === compTypeA) || LOAN_TYPES[0];
      const typeB = LOAN_TYPES.find((t) => t.id === compTypeB) || LOAN_TYPES[0];
      detailsStr = `Compared two loans side-by-side. ` +
        `Loan A (${typeA.name}): ${formatCurrency(Number(compAmountA) || 0)} at ${Number(compRateA) || 0}% for ${Number(compTenureA) || 0} years (EMI: ${formatCurrency(compCalculations.loanA.emi)}, Total Payable: ${formatCurrency(compCalculations.loanA.totalPayable)}). ` +
        `Loan B (${typeB.name}): ${formatCurrency(Number(compAmountB) || 0)} at ${Number(compRateB) || 0}% for ${Number(compTenureB) || 0} years (EMI: ${formatCurrency(compCalculations.loanB.emi)}, Total Payable: ${formatCurrency(compCalculations.loanB.totalPayable)}). ` +
        `Difference: EMI diff is ${formatCurrency(compCalculations.emiDiff)}, interest diff is ${formatCurrency(compCalculations.interestDiff)}. ` +
        `Loan ${compCalculations.betterLoan} (${compCalculations.betterLoan === "A" ? typeA.name : typeB.name}) is cheaper in total cost.`;
    } else if (calcType === "prepayment") {
      detailsStr = `Simulated prepayment/foreclosure impact on a ${formatCurrency(Number(prepAmount) || 0)} loan at ${Number(prepRate) || 0}% for ${Number(prepTenure) || 0} years. ` +
        `Prepayment plan: ${prepType === "monthly" ? "Extra monthly payment" : "Lump sum"} of ${formatCurrency(Number(prepVal) || 0)} starting in Month ${Number(prepStartMonth) || 1}. ` +
        `Result: Saved ${formatCurrency(prepCalculations.interestSaved)} in interest, and paid off loan ${Math.floor(prepCalculations.monthsSaved / 12)} years ${prepCalculations.monthsSaved % 12} months sooner.`;
    }

    const typeA = LOAN_TYPES.find((t) => t.id === compTypeA) || LOAN_TYPES[0];
    onApplyNow(
      calcType === "compare"
        ? `${typeA.name} vs Alternative`
        : activeTab === "professional" && profStructure === "flexi"
        ? "Professional Loan (Flexi OD)"
        : activeTab === "professional" && profStructure === "dropdown"
        ? "Professional Loan (Drop Down OD)"
        : activeConfig.name,
      calcType === "compare"
        ? (Number(compAmountA) || 0)
        : activeTab === "professional" && profStructure === "flexi"
        ? (Number(flexiLimit) || 0)
        : activeTab === "professional" && profStructure === "dropdown"
        ? (Number(dropdownLimit) || 0)
        : (Number(emiAmount) || 0),
      calcType === "compare"
        ? (Number(compRateA) || 0)
        : activeTab === "professional" && profStructure === "flexi"
        ? (Number(flexiRate) || 0)
        : activeTab === "professional" && profStructure === "dropdown"
        ? (Number(dropdownRate) || 0)
        : (Number(emiRate) || 0),
      calcType === "compare"
        ? (Number(compTenureA) || 0)
        : activeTab === "professional" && profStructure === "flexi"
        ? 0
        : activeTab === "professional" && profStructure === "dropdown"
        ? (Number(dropdownTenure) || 0)
        : (Number(emiTenure) || 0),
      detailsStr
    );
  };

  const handleExportExcel = () => {
    // 1. Helper function for CRC32 calculation
    const makeCRCTable = () => {
      let c;
      const crcTable = [];
      for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
          c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
      }
      return crcTable;
    };

    const crcTable = makeCRCTable();

    const calculateCrc32 = (bytes: Uint8Array) => {
      let crc = 0 ^ (-1);
      for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
      }
      return (crc ^ (-1)) >>> 0;
    };

    // 2. Helper function to create an uncompressed ZIP file
    const createZipBlob = (files: { name: string; content: string }[]) => {
      const encoder = new TextEncoder();
      const zipData: { nameBytes: Uint8Array; contentBytes: Uint8Array; crc: number; offset: number }[] = [];
      let currentOffset = 0;
      const parts: BlobPart[] = [];

      files.forEach((file) => {
        const nameBytes = encoder.encode(file.name);
        const contentBytes = encoder.encode(file.content);
        const crc = calculateCrc32(contentBytes);

        const header = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 10, true);         // Version needed to extract
        view.setUint16(6, 0, true);          // General purpose bit flag
        view.setUint16(8, 0, true);          // Compression method (0 = Store)
        view.setUint32(10, 0, true);         // Last mod time / date (not set)
        view.setUint32(14, crc, true);       // CRC-32
        view.setUint32(18, contentBytes.length, true); // Compressed size
        view.setUint32(22, contentBytes.length, true); // Uncompressed size
        view.setUint16(26, nameBytes.length, true);    // File name length
        view.setUint16(28, 0, true);         // Extra field length

        header.set(nameBytes, 30);

        zipData.push({
          nameBytes,
          contentBytes,
          crc,
          offset: currentOffset
        });

        parts.push(header);
        parts.push(contentBytes);

        currentOffset += header.length + contentBytes.length;
      });

      const centralDirectoryOffset = currentOffset;
      let centralDirectorySize = 0;

      zipData.forEach((file) => {
        const header = new Uint8Array(46 + file.nameBytes.length);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x02014b50, true); // Central file header signature
        view.setUint16(4, 20, true);         // Version made by
        view.setUint16(6, 10, true);         // Version needed to extract
        view.setUint16(8, 0, true);          // General purpose bit flag
        view.setUint16(10, 0, true);         // Compression method (Store)
        view.setUint32(12, 0, true);         // Last mod time / date
        view.setUint32(16, file.crc, true);  // CRC-32
        view.setUint32(20, file.contentBytes.length, true); // Compressed size
        view.setUint32(24, file.contentBytes.length, true); // Uncompressed size
        view.setUint16(28, file.nameBytes.length, true);    // File name length
        view.setUint16(30, 0, true);         // Extra field length
        view.setUint16(32, 0, true);         // File comment length
        view.setUint16(34, 0, true);         // Disk number start
        view.setUint16(36, 0, true);         // Internal file attributes
        view.setUint32(38, 0, true);         // External file attributes
        view.setUint32(42, file.offset, true); // Local header offset

        header.set(file.nameBytes, 46);
        parts.push(header);

        centralDirectorySize += header.length;
        currentOffset += header.length;
      });

      const eocd = new Uint8Array(22);
      const view = new DataView(eocd.buffer);

      view.setUint32(0, 0x06054b50, true); // End of central dir signature
      view.setUint16(4, 0, true);          // Number of this disk
      view.setUint16(6, 0, true);          // Disk where central dir starts
      view.setUint16(8, files.length, true); // Directory records on this disk
      view.setUint16(10, files.length, true); // Total directory records
      view.setUint32(12, centralDirectorySize, true); // Size of central dir
      view.setUint32(16, centralDirectoryOffset, true); // Offset of central dir
      view.setUint16(20, 0, true);         // Comment length

      parts.push(eocd);

      return new Blob(parts, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    };

    // 3. Generate XML parts for the Excel XLSX file
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Repayment Schedule" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="11"/><name val="Segoe UI"/><family val="2"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/><family val="2"/><color rgb="FFFFFFFF"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/><family val="2"/></font>
    <font><sz val="11"/><name val="Segoe UI"/><family val="2"/><color rgb="FF059669"/></font>
    <font><sz val="11"/><name val="Segoe UI"/><family val="2"/><color rgb="FF2563EB"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF059669"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF9FAFB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border/>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

    let rowsXml = "";
    let rowIndex = 2;
    let rollingBalance = activeTab === "education" ? 0 : (Number(emiAmount) || 0);

    emiCalculations.yearlyAmortization.forEach((yr) => {
      yr.months.forEach((m) => {
        const beginningBalance = rollingBalance;
        const emiPayment = m.principal + m.interest + m.extra;
        rollingBalance = m.balance;
        const isEven = m.month % 2 === 0;

        const cStyle = isEven ? "8" : "4";
        const vStyle = isEven ? "3" : "2";
        const bStyle = isEven ? "9" : "5";
        const iStyle = isEven ? "10" : "6";
        const eStyle = isEven ? "11" : "7";

        rowsXml += `
    <row r="${rowIndex}" spans="1:8">
      <c r="A${rowIndex}" s="${cStyle}" t="n"><v>${m.month}</v></c>
      <c r="B${rowIndex}" s="${cStyle}" t="inlineStr"><is><t>Year ${yr.year}</t></is></c>
      <c r="C${rowIndex}" s="${vStyle}" t="n"><v>${beginningBalance}</v></c>
      <c r="D${rowIndex}" s="${vStyle}" t="n"><v>${emiPayment}</v></c>
      <c r="E${rowIndex}" s="${vStyle}" t="n"><v>${m.principal}</v></c>
      <c r="F${rowIndex}" s="${iStyle}" t="n"><v>${m.interest}</v></c>
      <c r="G${rowIndex}" s="${eStyle}" t="n"><v>${m.extra}</v></c>
      <c r="H${rowIndex}" s="${bStyle}" t="n"><v>${m.balance}</v></c>
    </row>`;
        rowIndex++;
      });
    });

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:H${rowIndex - 1}"/>
  <cols>
    <col min="1" max="1" width="10" customWidth="1"/>
    <col min="2" max="2" width="12" customWidth="1"/>
    <col min="3" max="8" width="24" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" spans="1:8">
      <c r="A1" s="1" t="inlineStr"><is><t>Month</t></is></c>
      <c r="B1" s="1" t="inlineStr"><is><t>Year</t></is></c>
      <c r="C1" s="1" t="inlineStr"><is><t>Beginning Balance (${currency.code})</t></is></c>
      <c r="D1" s="1" t="inlineStr"><is><t>EMI Payment (${currency.code})</t></is></c>
      <c r="E1" s="1" t="inlineStr"><is><t>Principal Paid (${currency.code})</t></is></c>
      <c r="F1" s="1" t="inlineStr"><is><t>Interest Paid (${currency.code})</t></is></c>
      <c r="G1" s="1" t="inlineStr"><is><t>Extra Prepayment (${currency.code})</t></is></c>
      <c r="H1" s="1" t="inlineStr"><is><t>Ending Balance (${currency.code})</t></is></c>
    </row>
    ${rowsXml}
  </sheetData>
</worksheet>`;

    // 4. Build ZIP file list
    const files = [
      { name: "[Content_Types].xml", content: contentTypesXml },
      { name: "_rels/.rels", content: relsXml },
      { name: "xl/workbook.xml", content: workbookXml },
      { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml },
      { name: "xl/styles.xml", content: stylesXml },
      { name: "xl/worksheets/sheet1.xml", content: sheetXml }
    ];

    // 5. Pack zip and trigger download
    const blob = createZipBlob(files);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const category = activeTab || "loan";
    link.setAttribute("download", `repayment_schedule_${category}.xlsx`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
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
        <div className="grid grid-cols-3 gap-[6px] border-b border-gray-100 pb-3.5 mb-[20px]">
          <button
            onClick={() => setCalcType("emi")}
            className={`px-3 py-2.5 rounded-[12px] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${calcType === "emi"
                ? "bg-primary text-white shadow-[0_8px_20px_rgba(50,68,230,0.2)]"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <Coins className="h-4 w-4 shrink-0" />
            <span>EMI Calculator</span>
          </button>
          <button
            onClick={() => setCalcType("compare")}
            className={`px-3 py-2.5 rounded-[12px] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${calcType === "compare"
                ? "bg-primary text-white shadow-[0_8px_20px_rgba(50,68,230,0.2)]"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <Scale className="h-4 w-4 shrink-0" />
            <span>Compare Loans</span>
          </button>
          <button
            onClick={() => setCalcType("prepayment")}
            className={`px-3 py-2.5 rounded-[12px] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${calcType === "prepayment"
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
                  className={`px-3 py-1.5 rounded-[8px] text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === t.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>

            {activeTab === "professional" && (
              <div className="bg-gray-50 border border-gray-100 rounded-[14px] p-4 mb-[20px] animate-fade-up">
                <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Professional Loan Structure
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "standard", name: "Standard EMI", icon: "📊" },
                    { id: "flexi", name: "Flexi OD", icon: "🔄" },
                    { id: "dropdown", name: "Drop Down OD", icon: "📉" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProfStructure(item.id as any)}
                      className={`px-4 py-2 rounded-[10px] text-[12.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        profStructure === item.id
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              {isGuest && (
                <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none rounded-[16px]">
                  <div className="bg-white border border-gray-150 rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.15)] animate-scale-in">
                    <div className="text-[32px] text-center mb-[12px]">🔒</div>
                    <h3 className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign up to use the calculator</h3>
                    <p className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
                      Create a free account or sign in to compute EMIs, customize interest rates, and analyze prepayment strategies.
                    </p>
                    <button
                      onClick={onLoginRequired}
                      className="h-[48px] w-full rounded-[14px] bg-primary text-white font-semibold text-[14px] hover:bg-[#1e2db8] transition cursor-pointer"
                    >
                      Sign Up / Login
                    </button>
                  </div>
                </div>
              )}

              <div className={isGuest ? "pointer-events-none select-none filter blur-[4px]" : ""}>
                {activeTab === "education" && (
                  <div className="bg-blue-50 border border-blue-150 rounded-[12px] p-4 flex gap-3 text-blue-900 mb-6 animate-fade-up">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-[12px] leading-relaxed">
                      <strong className="font-bold">Education Loan Notice:</strong> Education loans differ from standard loans because interest may accrue during the study and moratorium period. If unpaid, this interest can be capitalized and added to the principal before repayment begins, increasing the EMI and total repayment cost.
                    </div>
                  </div>
                )}

                <div className="grid gap-[24px] lg:grid-cols-12">
              {/* Controls */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {activeTab === "education" ? (
                  <div className="flex flex-col gap-6">
                    {/* Mode Selector */}
                    <div className="flex bg-gray-100 p-1 rounded-[12px] border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setEduMode("quick")}
                        className={`flex-1 py-2 text-[12.5px] font-bold rounded-[10px] transition-all cursor-pointer ${eduMode === "quick"
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Quick Calculator
                      </button>
                      <button
                        type="button"
                        onClick={() => setEduMode("advanced")}
                        className={`flex-1 py-2 text-[12.5px] font-bold rounded-[10px] transition-all cursor-pointer ${eduMode === "advanced"
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Advanced Calculator
                      </button>
                    </div>

                    {/* Quick Mode Inputs */}
                    {eduMode === "quick" ? (
                      <div className="flex flex-col gap-6">
                        {/* Loan Amount */}
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[13px] font-semibold text-gray-700">Sanctioned Loan Amount</label>
                            <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(emiAmount) || 0)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                            <input
                              type="number"
                              value={emiAmount}
                              onChange={(e) => setEmiAmount(e.target.value)}
                              onBlur={() => {
                                const val = Number(emiAmount) || 0;
                                const clamped = Math.max(activeConfig.minAmount, Math.min(activeConfig.maxAmount, val));
                                setEmiAmount(String(clamped));
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                            />
                          </div>
                          <input
                            type="range"
                            min={activeConfig.minAmount}
                            max={activeConfig.maxAmount}
                            step={activeConfig.amountStep}
                            value={Number(emiAmount) || 0}
                            onChange={(e) => setEmiAmount(e.target.value)}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                            <span>{formatCompact(activeConfig.minAmount)}</span>
                            <span>{formatCompact(activeConfig.maxAmount)}</span>
                          </div>
                        </div>

                        {/* Interest Rate */}
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[13px] font-semibold text-gray-700">Interest Rate</label>
                            <span className="text-[13px] font-bold text-primary">{Number(emiRate) || 0}%</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="number"
                              step="0.05"
                              value={emiRate}
                              onChange={(e) => setEmiRate(e.target.value)}
                              onBlur={() => {
                                const val = Number(emiRate) || 0;
                                const clamped = Math.max(activeConfig.minRate, Math.min(activeConfig.maxRate, val));
                                setEmiRate(String(Number(clamped.toFixed(2))));
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                            />
                            <span className="text-gray-400 font-bold text-[14px] pr-1">%</span>
                          </div>
                          <input
                            type="range"
                            min={activeConfig.minRate}
                            max={activeConfig.maxRate}
                            step={activeConfig.rateStep}
                            value={Number(emiRate) || 0}
                            onChange={(e) => setEmiRate(e.target.value)}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                            <span>{activeConfig.minRate}%</span>
                            <span>{activeConfig.maxRate}%</span>
                          </div>
                        </div>

                        {/* Course Duration */}
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[13px] font-semibold text-gray-700">Course Duration</label>
                            <span className="text-[13px] font-bold text-primary">{eduQuickCourseYears} Years</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="number"
                              value={eduQuickCourseYears}
                              onChange={(e) => setEduQuickCourseYears(e.target.value)}
                              onBlur={() => {
                                const val = Number(eduQuickCourseYears) || 1;
                                const clamped = Math.max(1, Math.min(5, val));
                                setEduQuickCourseYears(String(clamped));
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                            />
                            <span className="text-gray-400 font-bold text-[12px] pr-1">Years</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={Number(eduQuickCourseYears) || 2}
                            onChange={(e) => setEduQuickCourseYears(e.target.value)}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                            <span>1 Year</span>
                            <span>5 Years</span>
                          </div>
                        </div>

                        {/* Moratorium Period */}
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[13px] font-semibold text-gray-700">Moratorium Period (Course + Grace)</label>
                            <span className="text-[13px] font-bold text-primary">{eduQuickMoratoriumMonths} Months</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="number"
                              value={eduQuickMoratoriumMonths}
                              onChange={(e) => setEduQuickMoratoriumMonths(e.target.value)}
                              onBlur={() => {
                                const val = Number(eduQuickMoratoriumMonths) || 0;
                                const clamped = Math.max(0, Math.min(72, val));
                                setEduQuickMoratoriumMonths(String(clamped));
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                            />
                            <span className="text-gray-400 font-bold text-[12px] pr-1">Months</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={72}
                            step={1}
                            value={Number(eduQuickMoratoriumMonths) || 30}
                            onChange={(e) => setEduQuickMoratoriumMonths(e.target.value)}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                            <span>0 Months</span>
                            <span>72 Months</span>
                          </div>
                        </div>

                        {/* Repayment Tenure */}
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[13px] font-semibold text-gray-700">Repayment Tenure</label>
                            <span className="text-[13px] font-bold text-primary">{emiTenure} Years</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="number"
                              value={emiTenure}
                              onChange={(e) => setEmiTenure(e.target.value)}
                              onBlur={() => {
                                const val = Number(emiTenure) || 1;
                                const clamped = Math.max(activeConfig.minTenure, Math.min(activeConfig.maxTenure, val));
                                setEmiTenure(String(clamped));
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                            />
                            <span className="text-gray-400 font-bold text-[12px] pr-1">Years</span>
                          </div>
                          <input
                            type="range"
                            min={activeConfig.minTenure}
                            max={activeConfig.maxTenure}
                            step={1}
                            value={Number(emiTenure) || 0}
                            onChange={(e) => setEmiTenure(e.target.value)}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                            <span>{activeConfig.minTenure} Y</span>
                            <span>{activeConfig.maxTenure} Y</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Advanced Mode Inputs */
                      <div className="flex flex-col gap-5 text-gray-700">
                        {/* 1. Loan Details Card */}
                        <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col gap-4">
                          <h4 className="text-[12.5px] font-bold text-gray-800 border-b border-gray-100 pb-1.5 uppercase tracking-wide">1. Loan Details</h4>

                          {/* Loan Amount */}
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[12.5px] font-semibold">Sanctioned Loan Amount</label>
                              <span className="text-[12.5px] font-bold text-primary">{formatCurrency(Number(eduSanctionedAmount) || 0)}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-gray-400 font-bold text-[13px]">{currency.symbol}</span>
                              <input
                                type="number"
                                value={eduSanctionedAmount}
                                onChange={(e) => {
                                  setEduSanctionedAmount(e.target.value);
                                  if (eduDisbursementType === "lump") {
                                    setEduDisbursements([{ amount: e.target.value, month: "1" }]);
                                  }
                                }}
                                onBlur={() => {
                                  const val = Number(eduSanctionedAmount) || 0;
                                  const clamped = Math.max(activeConfig.minAmount, Math.min(activeConfig.maxAmount, val));
                                  setEduSanctionedAmount(String(clamped));
                                  if (eduDisbursementType === "lump") {
                                    setEduDisbursements([{ amount: String(clamped), month: "1" }]);
                                  }
                                }}
                                className="flex-1 px-2.5 py-1 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                              />
                            </div>
                            <input
                              type="range"
                              min={activeConfig.minAmount}
                              max={activeConfig.maxAmount}
                              step={activeConfig.amountStep}
                              value={Number(eduSanctionedAmount) || 0}
                              onChange={(e) => {
                                setEduSanctionedAmount(e.target.value);
                                if (eduDisbursementType === "lump") {
                                  setEduDisbursements([{ amount: e.target.value, month: "1" }]);
                                }
                              }}
                              className="w-full h-1 bg-gray-150 rounded cursor-pointer accent-primary"
                            />
                          </div>

                          {/* Interest Rate & Repayment Tenure */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <label className="text-[12px] font-semibold mb-1">Rate (%)</label>
                              <input
                                type="number"
                                step="0.05"
                                value={eduAdvancedRate}
                                onChange={(e) => setEduAdvancedRate(e.target.value)}
                                onBlur={() => {
                                  const val = Number(eduAdvancedRate) || 0;
                                  const clamped = Math.max(activeConfig.minRate, Math.min(activeConfig.maxRate, val));
                                  setEduAdvancedRate(String(Number(clamped.toFixed(2))));
                                }}
                                className="px-2.5 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[12px] font-semibold mb-1">Repayment Tenure (Y)</label>
                              <input
                                type="number"
                                value={eduAdvancedTenure}
                                onChange={(e) => setEduAdvancedTenure(e.target.value)}
                                onBlur={() => {
                                  const val = Number(eduAdvancedTenure) || 1;
                                  const clamped = Math.max(activeConfig.minTenure, Math.min(activeConfig.maxTenure, val));
                                  setEduAdvancedTenure(String(clamped));
                                }}
                                className="px-2.5 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Course & Moratorium Details Card */}
                        <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col gap-3">
                          <h4 className="text-[12.5px] font-bold text-gray-800 border-b border-gray-100 pb-1.5 uppercase tracking-wide">2. Course & Grace Periods</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <label className="text-[12px] font-semibold mb-1" title="Study period duration in months">Course Months</label>
                              <input
                                type="number"
                                value={eduCourseMonths}
                                onChange={(e) => setEduCourseMonths(e.target.value)}
                                onBlur={() => {
                                  const val = Number(eduCourseMonths) || 1;
                                  setEduCourseMonths(String(Math.max(6, Math.min(60, val))));
                                }}
                                className="px-2.5 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[12px] font-semibold mb-1" title="Grace period post course before repayment begins (max 24 months)">Grace Months</label>
                              <input
                                type="number"
                                value={eduGraceMonths}
                                onChange={(e) => setEduGraceMonths(e.target.value)}
                                onBlur={() => {
                                  const val = Number(eduGraceMonths) || 0;
                                  setEduGraceMonths(String(Math.max(0, Math.min(24, val))));
                                }}
                                className="px-2.5 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Disbursement Schedule Card */}
                        <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                            <h4 className="text-[12.5px] font-bold text-gray-800 uppercase tracking-wide">3. Disbursement Schedule</h4>
                            <div className="flex bg-gray-100 p-0.5 rounded-[6px] border border-gray-200 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setEduDisbursementType("lump");
                                  setEduDisbursements([{ amount: eduSanctionedAmount, month: "1" }]);
                                }}
                                className={`px-2 py-0.5 font-bold rounded-[4px] cursor-pointer ${eduDisbursementType === "lump" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
                                  }`}
                              >
                                Lump Sum
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEduDisbursementType("multiple");
                                  const amt = Math.round(Number(eduSanctionedAmount) / 4);
                                  setEduDisbursements([
                                    { amount: String(amt), month: "1" },
                                    { amount: String(amt), month: "6" },
                                    { amount: String(amt), month: "12" },
                                    { amount: String(Number(eduSanctionedAmount) - amt * 3), month: "18" }
                                  ]);
                                }}
                                className={`px-2 py-0.5 font-bold rounded-[4px] cursor-pointer ${eduDisbursementType === "multiple" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
                                  }`}
                              >
                                Multiple
                              </button>
                            </div>
                          </div>

                          {eduDisbursementType === "lump" ? (
                            <p className="text-[11px] text-gray-500 leading-normal">
                              100% of the loan amount ({formatCurrency(Number(eduSanctionedAmount) || 0)}) will be disbursed in Month 1.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-50 px-1">
                                <div className="w-20">Tranche</div>
                                <div className="flex-1">Disbursement Amount</div>
                                <div className="w-16 text-center">Release Month</div>
                                {eduDisbursements.length > 1 && <div className="w-7 shrink-0" />}
                              </div>
                              <div className="max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                                {eduDisbursements.map((d, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="w-20 text-[11px] font-bold text-gray-400">Disb. #{idx + 1}</div>
                                    <div className="flex-1 flex items-center gap-1 border border-gray-200 rounded-[6px] px-2 py-1 bg-white">
                                      <span className="text-[11px] text-gray-400 font-bold">{currency.symbol}</span>
                                      <input
                                        type="number"
                                        value={d.amount}
                                        onChange={(e) => {
                                          const updated = [...eduDisbursements];
                                          updated[idx].amount = e.target.value;
                                          setEduDisbursements(updated);
                                        }}
                                        className="w-full text-[11.5px] font-bold outline-none border-none"
                                      />
                                    </div>
                                    <div className="w-16 flex items-center gap-1 border border-gray-200 rounded-[6px] px-2 py-1 bg-white">
                                      <input
                                        type="number"
                                        value={d.month}
                                        onChange={(e) => {
                                          const updated = [...eduDisbursements];
                                          updated[idx].month = e.target.value;
                                          setEduDisbursements(updated);
                                        }}
                                        placeholder="Mo"
                                        className="w-full text-[11.5px] font-bold outline-none border-none text-center"
                                      />
                                    </div>
                                    {eduDisbursements.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setEduDisbursements(eduDisbursements.filter((_, i) => i !== idx))}
                                        className="h-7 w-7 rounded-[6px] bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => setEduDisbursements([...eduDisbursements, { amount: "0", month: "1" }])}
                                className="w-full py-1.5 border border-dashed border-gray-300 rounded-[8px] text-[11px] font-bold text-primary hover:bg-gray-50 flex items-center justify-center gap-1 cursor-pointer mt-1"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Disbursement Row</span>
                              </button>

                              <div className="flex justify-between text-[11px] font-bold border-t border-gray-100 pt-2 mt-1">
                                <span className="text-gray-400">Total Scheduled:</span>
                                <span className={
                                  Math.abs(eduDisbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) - (Number(eduSanctionedAmount) || 0)) < 0.01
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }>
                                  {formatCurrency(eduDisbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0))} / {formatCurrency(Number(eduSanctionedAmount) || 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. Study Interest Servicing Card */}
                        <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col gap-3.5">
                          <h4 className="text-[12.5px] font-bold text-gray-800 border-b border-gray-100 pb-1.5 uppercase tracking-wide">4. Study Interest Servicing</h4>

                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500">Servicing Option during Moratorium</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEduInterestServicing("accumulate")}
                                className={`py-1.5 px-1 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${eduInterestServicing === "accumulate"
                                    ? "bg-primary border-primary text-white shadow-sm"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                  }`}
                              >
                                No Payment
                              </button>
                              <button
                                type="button"
                                onClick={() => setEduInterestServicing("serviced")}
                                className={`py-1.5 px-1 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${eduInterestServicing === "serviced"
                                    ? "bg-primary border-primary text-white shadow-sm"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                  }`}
                              >
                                Serviced
                              </button>
                              <button
                                type="button"
                                onClick={() => setEduInterestServicing("partial")}
                                className={`py-1.5 px-1 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${eduInterestServicing === "partial"
                                    ? "bg-primary border-primary text-white shadow-sm"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                  }`}
                              >
                                Partial
                              </button>
                            </div>
                          </div>

                          {eduInterestServicing === "partial" && (
                            <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-155 p-2.5 rounded-[8px] animate-fade-up">
                              <label className="text-[11.5px] font-semibold">Monthly Interest Payment Amount</label>
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 bg-white rounded-[6px]">
                                <span className="text-[11.5px] text-gray-400 font-bold">{currency.symbol}</span>
                                <input
                                  type="number"
                                  value={eduPartialPaymentAmount}
                                  onChange={(e) => setEduPartialPaymentAmount(e.target.value)}
                                  onBlur={() => {
                                    const val = Number(eduPartialPaymentAmount) || 0;
                                    setEduPartialPaymentAmount(String(Math.max(0, val)));
                                  }}
                                  className="w-full text-[12px] font-bold outline-none border-none"
                                />
                              </div>
                            </div>
                          )}

                          {eduInterestServicing !== "serviced" && (
                            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                              <label className="text-[12px] font-semibold text-gray-500">Unpaid Interest Capitalization</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEduCapitalizationFrequency("single")}
                                  className={`py-1.5 px-1 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${eduCapitalizationFrequency === "single"
                                      ? "bg-primary/10 border-primary/20 text-primary"
                                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                  Capitalize at End
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEduCapitalizationFrequency("periodic")}
                                  className={`py-1.5 px-1 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${eduCapitalizationFrequency === "periodic"
                                      ? "bg-primary/10 border-primary/20 text-primary"
                                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                  Periodic Compounding
                                </button>
                              </div>

                              {eduCapitalizationFrequency === "periodic" && (
                                <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-155 p-2.5 rounded-[8px] animate-fade-up">
                                  <label className="text-[11px] font-semibold">Compounding Frequency</label>
                                  <select
                                    value={eduCompoundingFrequency}
                                    onChange={(e) => setEduCompoundingFrequency(e.target.value as any)}
                                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-[6px] text-[11.5px] font-bold focus:outline-none cursor-pointer"
                                  >
                                    <option value="monthly">Monthly Compounding</option>
                                    <option value="quarterly">Quarterly Compounding</option>
                                    <option value="half-yearly">Half-Yearly Compounding</option>
                                    <option value="yearly">Yearly Compounding</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 5. Prepayments & Strategy Card */}
                        <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col gap-3.5">
                          <h4 className="text-[12.5px] font-bold text-gray-800 border-b border-gray-100 pb-1.5 uppercase tracking-wide">5. Prepayments & Strategy</h4>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <label className="text-[11.5px] font-semibold mb-1" title="Additional amount paid every month during repayment">Extra Monthly</label>
                              <div className="flex items-center gap-1.5 px-2 py-1 border border-gray-250 rounded-[6px] bg-white">
                                <span className="text-[11px] text-gray-400 font-bold">{currency.symbol}</span>
                                <input
                                  type="number"
                                  value={eduPrepayMonthly}
                                  onChange={(e) => setEduPrepayMonthly(e.target.value)}
                                  onBlur={() => {
                                    const val = Number(eduPrepayMonthly) || 0;
                                    setEduPrepayMonthly(String(Math.max(0, val)));
                                  }}
                                  className="w-full text-[11.5px] font-bold outline-none border-none"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[11.5px] font-semibold mb-1" title="Lump sum amount paid once a year during repayment">Annual Lump Sum</label>
                              <div className="flex items-center gap-1.5 px-2 py-1 border border-gray-255 rounded-[6px] bg-white">
                                <span className="text-[11px] text-gray-400 font-bold">{currency.symbol}</span>
                                <input
                                  type="number"
                                  value={eduPrepayLump}
                                  onChange={(e) => setEduPrepayLump(e.target.value)}
                                  onBlur={() => {
                                    const val = Number(eduPrepayLump) || 0;
                                    setEduPrepayLump(String(Math.max(0, val)));
                                  }}
                                  className="w-full text-[11.5px] font-bold outline-none border-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                            <label className="text-[12px] font-semibold text-gray-500">Prepayment Strategy</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setEduPrepayStrategy("reduce-tenure")}
                                className={`py-1.5 px-1 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${eduPrepayStrategy === "reduce-tenure"
                                    ? "bg-primary border-primary text-white shadow-sm"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                  }`}
                              >
                                Reduce Tenure
                              </button>
                              <button
                                type="button"
                                onClick={() => setEduPrepayStrategy("reduce-emi")}
                                className={`py-1.5 px-1 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${eduPrepayStrategy === "reduce-emi"
                                    ? "bg-primary border-primary text-white shadow-sm"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                  }`}
                              >
                                Reduce EMI
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display warning banner if validation errors exist */}
                    {eduErrors.length > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-[12px] p-4 flex flex-col gap-2 text-rose-800 animate-fade-up">
                        <div className="flex items-center gap-2 font-bold text-[12.5px]">
                          <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                          <span>Validation Warnings:</span>
                        </div>
                        <ul className="list-disc pl-5 text-[11px] space-y-1 font-semibold leading-normal">
                          {eduErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : activeTab === "professional" && profStructure === "flexi" ? (
                  <div className="flex flex-col gap-6 animate-fade-up">
                    {/* Input 1: Credit Limit */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Credit Limit</label>
                        <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(flexiLimit) || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                        <input
                          type="number"
                          value={flexiLimit}
                          onChange={(e) => {
                            setFlexiLimit(e.target.value);
                            const limitVal = Number(e.target.value) || 0;
                            if (Number(flexiUtilized) > limitVal) {
                              setFlexiUtilized(String(limitVal));
                            }
                            if (Number(flexiDeposit) > limitVal) {
                              setFlexiDeposit(String(limitVal));
                            }
                          }}
                          onBlur={() => {
                            const val = Number(flexiLimit) || 0;
                            const maxVal = Math.round(50000000 * currencyScale);
                            const minVal = Math.round(100000 * currencyScale);
                            const clamped = Math.max(minVal, Math.min(maxVal, val));
                            setFlexiLimit(String(clamped));
                            if (Number(flexiUtilized) > clamped) {
                              setFlexiUtilized(String(clamped));
                            }
                            if (Number(flexiDeposit) > clamped) {
                              setFlexiDeposit(String(clamped));
                            }
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="range"
                        min={Math.round(100000 * currencyScale)}
                        max={Math.round(50000000 * currencyScale)}
                        step={Math.round(50000 * currencyScale)}
                        value={Number(flexiLimit) || 0}
                        onChange={(e) => {
                          setFlexiLimit(e.target.value);
                          const limitVal = Number(e.target.value) || 0;
                          if (Number(flexiUtilized) > limitVal) {
                            setFlexiUtilized(String(limitVal));
                          }
                          if (Number(flexiDeposit) > limitVal) {
                            setFlexiDeposit(String(limitVal));
                          }
                        }}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>{formatCompact(Math.round(100000 * currencyScale))}</span>
                        <span>{formatCompact(Math.round(50000000 * currencyScale))}</span>
                      </div>
                    </div>

                    {/* Input 2: Utilized Amount */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Utilized Amount</label>
                        <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(flexiUtilized) || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                        <input
                          type="number"
                          value={flexiUtilized}
                          onChange={(e) => setFlexiUtilized(e.target.value)}
                          onBlur={() => {
                            const val = Number(flexiUtilized) || 0;
                            const limitVal = Number(flexiLimit) || 0;
                            const clamped = Math.max(0, Math.min(limitVal, val));
                            setFlexiUtilized(String(clamped));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Number(flexiLimit) || 0}
                        step={Math.round(10000 * currencyScale)}
                        value={Number(flexiUtilized) || 0}
                        onChange={(e) => setFlexiUtilized(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>{currency.symbol}0</span>
                        <span>{formatCompact(Number(flexiLimit) || 0)}</span>
                      </div>
                    </div>

                    {/* Input 3: Interest Rate */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Interest Rate</label>
                        <span className="text-[13px] font-bold text-primary">{Number(flexiRate) || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          step="0.05"
                          value={flexiRate}
                          onChange={(e) => setFlexiRate(e.target.value)}
                          onBlur={() => {
                            const val = Number(flexiRate) || 0;
                            const clamped = Math.max(8.5, Math.min(20.0, val));
                            setFlexiRate(String(Number(clamped.toFixed(2))));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-gray-400 font-bold text-[14px] pr-1">%</span>
                      </div>
                      <input
                        type="range"
                        min={8.5}
                        max={20.0}
                        step={0.05}
                        value={Number(flexiRate) || 0}
                        onChange={(e) => setFlexiRate(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>8.5%</span>
                        <span>20.0%</span>
                      </div>
                    </div>

                    {/* Input 4: Expected Monthly Deposit */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Expected Monthly Deposit</label>
                        <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(flexiDeposit) || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                        <input
                          type="number"
                          value={flexiDeposit}
                          onChange={(e) => setFlexiDeposit(e.target.value)}
                          onBlur={() => {
                            const val = Number(flexiDeposit) || 0;
                            const limitVal = Number(flexiLimit) || 1000000;
                            const clamped = Math.max(0, Math.min(limitVal, val));
                            setFlexiDeposit(String(clamped));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Number(flexiLimit) || 1000000}
                        step={Math.round(10000 * currencyScale)}
                        value={Number(flexiDeposit) || 0}
                        onChange={(e) => setFlexiDeposit(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>{currency.symbol}0</span>
                        <span>{formatCompact(Number(flexiLimit) || 1000000)}</span>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "professional" && profStructure === "dropdown" ? (
                  <div className="flex flex-col gap-6 animate-fade-up">
                    {/* Input 1: Initial Limit */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Initial Limit</label>
                        <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(dropdownLimit) || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                        <input
                          type="number"
                          value={dropdownLimit}
                          onChange={(e) => setDropdownLimit(e.target.value)}
                          onBlur={() => {
                            const val = Number(dropdownLimit) || 0;
                            const maxVal = Math.round(50000000 * currencyScale);
                            const minVal = Math.round(100000 * currencyScale);
                            const clamped = Math.max(minVal, Math.min(maxVal, val));
                            setDropdownLimit(String(clamped));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="range"
                        min={Math.round(100000 * currencyScale)}
                        max={Math.round(50000000 * currencyScale)}
                        step={Math.round(50000 * currencyScale)}
                        value={Number(dropdownLimit) || 0}
                        onChange={(e) => setDropdownLimit(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>{formatCompact(Math.round(100000 * currencyScale))}</span>
                        <span>{formatCompact(Math.round(50000000 * currencyScale))}</span>
                      </div>
                    </div>

                    {/* Input 2: Interest Rate */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Interest Rate</label>
                        <span className="text-[13px] font-bold text-primary">{Number(dropdownRate) || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          step="0.05"
                          value={dropdownRate}
                          onChange={(e) => setDropdownRate(e.target.value)}
                          onBlur={() => {
                            const val = Number(dropdownRate) || 0;
                            const clamped = Math.max(8.5, Math.min(20.0, val));
                            setDropdownRate(String(Number(clamped.toFixed(2))));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-gray-400 font-bold text-[14px] pr-1">%</span>
                      </div>
                      <input
                        type="range"
                        min={8.5}
                        max={20.0}
                        step={0.05}
                        value={Number(dropdownRate) || 0}
                        onChange={(e) => setDropdownRate(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>8.5%</span>
                        <span>20.0%</span>
                      </div>
                    </div>

                    {/* Input 3: Tenure */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Tenure</label>
                        <span className="text-[13px] font-bold text-primary">{Number(dropdownTenure) || 0} Years</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          value={dropdownTenure}
                          onChange={(e) => setDropdownTenure(e.target.value)}
                          onBlur={() => {
                            const val = Number(dropdownTenure) || 0;
                            const clamped = Math.max(1, Math.min(15, val));
                            setDropdownTenure(String(clamped));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-gray-400 font-bold text-[12px] pr-1">Years</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={15}
                        step={1}
                        value={Number(dropdownTenure) || 0}
                        onChange={(e) => setDropdownTenure(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>1 Year</span>
                        <span>15 Years</span>
                      </div>
                    </div>

                    {/* Input 4: Reduction Schedule */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Reduction Schedule</label>
                        <span className="text-[13px] font-bold text-primary">{Number(dropdownReductionPct) || 0}% / Year</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          step="0.5"
                          value={dropdownReductionPct}
                          onChange={(e) => setDropdownReductionPct(e.target.value)}
                          onBlur={() => {
                            const val = Number(dropdownReductionPct) || 0;
                            const clamped = Math.max(1.0, Math.min(20.0, val));
                            setDropdownReductionPct(String(Number(clamped.toFixed(2))));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-gray-400 font-bold text-[12px] pr-1">% / Yr</span>
                      </div>
                      <input
                        type="range"
                        min={1.0}
                        max={20.0}
                        step={0.5}
                        value={Number(dropdownReductionPct) || 0}
                        onChange={(e) => setDropdownReductionPct(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                        <span>1.0%</span>
                        <span>20.0%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Input 1: Loan Amount */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[13px] font-semibold text-gray-700">Loan Amount ({activeConfig.name})</label>
                        <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(emiAmount) || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                        <input
                          type="number"
                          value={emiAmount}
                          onChange={(e) => setEmiAmount(e.target.value)}
                          onBlur={() => {
                            const val = Number(emiAmount) || 0;
                            const clamped = Math.max(
                              activeConfig.minAmount,
                              Math.min(activeConfig.maxAmount, val)
                            );
                            setEmiAmount(String(clamped));
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="range"
                        min={activeConfig.minAmount}
                        max={activeConfig.maxAmount}
                        step={activeConfig.amountStep}
                        value={Number(emiAmount) || 0}
                        onChange={(e) => setEmiAmount(e.target.value)}
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
                        <span className="text-[13px] font-bold text-primary">{Number(emiRate) || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          step="0.05"
                          value={emiRate}
                          onChange={(e) => setEmiRate(e.target.value)}
                          onBlur={() => {
                            const val = Number(emiRate) || 0;
                            const clamped = Math.max(
                              activeConfig.minRate,
                              Math.min(activeConfig.maxRate, val)
                            );
                            setEmiRate(String(Number(clamped.toFixed(2))));
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
                        value={Number(emiRate) || 0}
                        onChange={(e) => setEmiRate(e.target.value)}
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
                        <span className="text-[13px] font-bold text-primary">{Number(emiTenure) || 0} Years</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          value={emiTenure}
                          onChange={(e) => setEmiTenure(e.target.value)}
                          onBlur={() => {
                            const val = Number(emiTenure) || 0;
                            const clamped = Math.max(
                              activeConfig.minTenure,
                              Math.min(activeConfig.maxTenure, val)
                            );
                            setEmiTenure(String(clamped));
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
                        value={Number(emiTenure) || 0}
                        onChange={(e) => setEmiTenure(e.target.value)}
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
                  </div>
                )}

                {/* Dashboard Summary Card */}
                <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400">
                      {activeTab === "professional" && profStructure === "flexi"
                        ? "Est. Monthly Interest"
                        : activeTab === "professional" && profStructure === "dropdown"
                        ? "Initial Credit Limit"
                        : "Calculated Monthly EMI"}
                    </span>
                    <span className="text-[25px] font-bold text-primary mt-1">
                      {activeTab === "professional" && profStructure === "flexi"
                        ? formatCurrency(flexiODCalculations.monthlyInterest)
                        : activeTab === "professional" && profStructure === "dropdown"
                        ? formatCurrency(dropdownODCalculations.initialLimit)
                        : formatCurrency(emiCalculations.monthlyEmi)}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={handleAskAssistant}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)] hover:-translate-y-0.5 whitespace-nowrap"
                    >
                      Apply & Chat
                    </button>
                    {onTalkToAdvisor && (
                      <button
                        type="button"
                        onClick={onTalkToAdvisor}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 text-white text-[13px] font-bold rounded-[12px] hover:bg-emerald-500 transition-all cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 whitespace-nowrap"
                      >
                        Talk to Advisor
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Visualizations Side */}
              <div className="lg:col-span-6 flex flex-col gap-[20px] items-center">
                {activeTab === "professional" && profStructure === "flexi" ? (
                  <>
                    {/* Flexi OD Visuals */}
                    {/* OD Utilization Progress Bar */}
                    <div className="w-full max-w-[640px] bg-white border border-gray-250 rounded-[18px] p-5 shadow-sm flex flex-col gap-3 animate-fade-up">
                      <div className="flex justify-between items-center text-[12px] font-bold text-gray-550 uppercase tracking-wide">
                        <span>OD Utilization</span>
                        <span className="text-primary">{flexiODCalculations.utilizationPct.toFixed(0)}% Utilized</span>
                      </div>
                      <div className="w-full h-4 bg-gray-100 rounded-full flex overflow-hidden border border-gray-200/50">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${flexiODCalculations.utilizationPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[12.5px] font-bold mt-1 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary block shrink-0" />
                          <span>Used: <span className="text-gray-900">{formatCurrency(flexiODCalculations.used)}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 block shrink-0" />
                          <span>Available: <span className="text-gray-900">{formatCurrency(flexiODCalculations.available)}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Interest Summary Card */}
                    <div className="w-full max-w-[640px] bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-indigo-100 rounded-[18px] p-5 shadow-sm flex flex-col gap-4 animate-fade-up">
                      <div className="flex items-center gap-1.5 border-b border-indigo-100/60 pb-2">
                        <span className="text-[16px]">🩺</span>
                        <span className="text-[12.5px] font-bold text-indigo-900 uppercase tracking-wide">Interest Summary</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col bg-white border border-indigo-100/40 rounded-[12px] p-3 text-center shadow-xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Daily Interest</span>
                          <span className="text-[14px] font-black text-indigo-700 mt-1">{formatCurrency(flexiODCalculations.dailyInterest)}</span>
                        </div>
                        <div className="flex flex-col bg-white border border-indigo-100/40 rounded-[12px] p-3 text-center shadow-xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Monthly Interest</span>
                          <span className="text-[14px] font-black text-indigo-700 mt-1">{formatCurrency(flexiODCalculations.monthlyInterest)}</span>
                        </div>
                        <div className="flex flex-col bg-white border border-indigo-100/40 rounded-[12px] p-3 text-center shadow-xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Annual Interest</span>
                          <span className="text-[14px] font-black text-indigo-700 mt-1">{formatCurrency(flexiODCalculations.annualInterest)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : activeTab === "professional" && profStructure === "dropdown" ? (
                  <>
                    {/* Drop Down OD Visuals */}
                    {/* Reduction Payoff Chart */}
                    <div className="w-full max-w-[640px] bg-white border border-gray-200 rounded-[18px] p-5 shadow-sm flex flex-col gap-3 animate-fade-up text-left">
                      <div className="flex justify-between items-center text-[12px] font-bold text-gray-555 uppercase tracking-wide">
                        <span>Limit Reduction Timeline</span>
                        <span className="text-primary font-bold normal-case text-[11px]">Hover points for limits</span>
                      </div>

                      <div className="relative w-full h-[130px] flex items-center justify-center bg-gray-55 border border-gray-100 rounded-[12px] p-1 overflow-visible">
                        <svg viewBox="0 0 256 110" className="w-full h-full max-h-[110px] overflow-visible">
                          <defs>
                            <linearGradient id="dd-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3344e6" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#3344e6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          <line x1="10" y1="10" x2="246" y2="10" stroke="#e9ecef" strokeWidth="1" />
                          <line x1="10" y1="55" x2="246" y2="55" stroke="#e9ecef" strokeWidth="1" />
                          <line x1="10" y1="100" x2="246" y2="100" stroke="#dee2e6" strokeWidth="1" strokeDasharray="3 3" />

                          {/* Fill Area */}
                          {(() => {
                            const initialLimit = dropdownODCalculations.initialLimit || 1;
                            const pts = dropdownODCalculations.yearlyLimits;
                            const nPts = pts.length || 1;
                            let fPath = "";
                            pts.forEach((pt, idx) => {
                              const x = 10 + (idx / (nPts - 1 || 1)) * 236;
                              const y = 10 + (1 - pt.limit / initialLimit) * 90;
                              if (idx === 0) {
                                fPath = `M ${x} 100 L ${x} ${y}`;
                              } else {
                                fPath += ` L ${x} ${y}`;
                              }
                            });
                            if (nPts > 0) {
                              const lastX = 10 + 236;
                              fPath += ` L ${lastX} 100 Z`;
                            }
                            return fPath ? <path d={fPath} fill="url(#dd-chart-gradient)" /> : null;
                          })()}

                          {/* Line stroke */}
                          {(() => {
                            const initialLimit = dropdownODCalculations.initialLimit || 1;
                            const pts = dropdownODCalculations.yearlyLimits;
                            const nPts = pts.length || 1;
                            let lPath = "";
                            pts.forEach((pt, idx) => {
                              const x = 10 + (idx / (nPts - 1 || 1)) * 236;
                              const y = 10 + (1 - pt.limit / initialLimit) * 90;
                              if (idx === 0) {
                                lPath = `M ${x} ${y}`;
                              } else {
                                lPath += ` L ${x} ${y}`;
                              }
                            });
                            return lPath ? (
                              <path
                                d={lPath}
                                fill="none"
                                stroke="#3344e6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : null;
                          })()}

                          {/* Interaction Dots */}
                          {dropdownODCalculations.yearlyLimits.map((pt, idx) => {
                            const initialLimit = dropdownODCalculations.initialLimit || 1;
                            const pts = dropdownODCalculations.yearlyLimits;
                            const nPts = pts.length || 1;
                            const x = 10 + (idx / (nPts - 1 || 1)) * 236;
                            const y = 10 + (1 - pt.limit / initialLimit) * 90;

                            const isHovered = hoveredDDYear === pt.year;

                            return (
                              <g key={pt.year} className="cursor-pointer">
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isHovered ? 5 : 3.5}
                                  fill={isHovered ? "#3344e6" : "#ffffff"}
                                  stroke="#3344e6"
                                  strokeWidth={2}
                                  onMouseEnter={() => setHoveredDDYear(pt.year)}
                                  onMouseLeave={() => setHoveredDDYear(null)}
                                  className="transition-all duration-155"
                                />
                                {isHovered && (
                                  <g>
                                    <rect
                                      x={x - 45}
                                      y={y - 25 < 5 ? y + 10 : y - 28}
                                      width="90"
                                      height="18"
                                      rx="4"
                                      fill="#1e293b"
                                      className="shadow-sm"
                                    />
                                    <text
                                      x={x}
                                      y={y - 25 < 5 ? y + 22 : y - 16}
                                      fill="#ffffff"
                                      fontSize="7.5"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                    >
                                      Yr {pt.year}: {formatCompact(pt.limit)}
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-400 font-bold px-0.5 w-full">
                        <span>Year 1 ({formatCompact(dropdownODCalculations.initialLimit)})</span>
                        <span>Midway</span>
                        <span>Year {dropdownODCalculations.tenure} ({formatCompact(dropdownODCalculations.yearlyLimits[dropdownODCalculations.yearlyLimits.length - 1]?.limit || 0)})</span>
                      </div>
                    </div>

                    {/* Limit Schedule Grid */}
                    <div className="w-full max-w-[640px] bg-gray-50 border border-gray-200 rounded-[18px] p-4 flex flex-col gap-2 animate-fade-up">
                      <span className="text-[11px] font-bold text-gray-550 uppercase tracking-wide">Year-by-Year Limit Schedule</span>
                      <div className="max-h-[140px] overflow-y-auto pr-1 grid grid-cols-2 gap-2 text-[12px] font-semibold text-gray-700">
                        {dropdownODCalculations.yearlyLimits.map((pt) => (
                          <div key={pt.year} className="flex justify-between bg-white border border-gray-150 rounded-[8px] p-2 hover:border-primary/20 transition-all">
                            <span className="text-gray-400">Year {pt.year}</span>
                            <span className="text-gray-800 font-bold">{formatCurrency(pt.limit)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Horizontal Outflow Progress Bar */}
                    <div className="w-full max-w-[640px] flex flex-col gap-2 mt-1 animate-fade-up">
                      <div className="flex justify-between text-[11px] font-bold text-gray-550 uppercase tracking-wide">
                        <span>Outflow Breakdown</span>
                        <span>Total: {formatCurrency(emiCalculations.totalPayable)}</span>
                      </div>
                      <div className="w-full h-4 bg-gray-100 rounded-full flex overflow-hidden border border-gray-200/50">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${emiCalculations.principalPct}%` }}
                        />
                        {emiCalculations.capitalizedInterestPct > 0 && (
                          <div
                            className="h-full bg-purple-500 transition-all duration-500"
                            style={{ width: `${emiCalculations.capitalizedInterestPct}%` }}
                          />
                        )}
                        {emiCalculations.totalInterest > 0 && (
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${emiCalculations.interestPct}%` }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Legends */}
                    <div className={`w-full max-w-[640px] grid gap-4 ${
                      activeTab === "education" && emiCalculations.capitalizedInterestPct > 0
                        ? "grid-cols-3"
                        : "grid-cols-2"
                    }`}>
                      <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2.5 bg-gray-50">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-550">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary block shrink-0" />
                          <span>Principal Amount</span>
                        </div>
                        <span className="text-[14px] font-bold text-gray-900 mt-1">
                          {formatCurrency(
                            activeTab === "education"
                              ? eduMode === "quick"
                                ? Number(emiAmount) || 0
                                : Number(eduSanctionedAmount) || 0
                              : Number(emiAmount) || 0
                          )}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-400">({Math.round(emiCalculations.principalPct)}%)</span>
                      </div>

                      {activeTab === "education" && emiCalculations.capitalizedInterestPct > 0 && (
                        <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2.5 bg-gray-50">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-550">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block shrink-0" />
                            <span className="whitespace-nowrap">Capitalized Interest</span>
                          </div>
                          <span className="text-[14px] font-bold text-gray-900 mt-1">
                            {formatCurrency(emiCalculations.capitalizedInterest)}
                          </span>
                          <span className="text-[9px] font-semibold text-gray-400">({Math.round(emiCalculations.capitalizedInterestPct)}%)</span>
                        </div>
                      )}

                      <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2.5 bg-gray-50">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-550">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
                          <span>Total Interest</span>
                        </div>
                        <span className="text-[14px] font-bold text-gray-900 mt-1">{formatCurrency(emiCalculations.totalInterest)}</span>
                        <span className="text-[9px] font-semibold text-gray-400">({Math.round(emiCalculations.interestPct)}%)</span>
                      </div>
                    </div>

                    {/* Payoff Progress Amortization Timeline stacked bar chart */}
                    <button
                      type="button"
                      onClick={() => setIsGraphExpanded(true)}
                      className="w-full max-w-[640px] bg-gray-50 border border-gray-150 rounded-[14px] p-3 flex flex-col gap-2 hover:border-primary/30 hover:shadow-md transition-all text-left cursor-pointer group relative animate-fade-up"
                      aria-label="Expand detailed amortization graph"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-550 uppercase tracking-wide w-full">
                        <span>Payoff Progress Timeline</span>
                        <span className="text-primary group-hover:underline flex items-center gap-1 font-bold normal-case">
                          Click to expand
                        </span>
                      </div>

                      <div className="relative w-full h-[115px] flex items-center justify-center bg-white border border-gray-100 rounded-[10px] p-1 overflow-hidden">
                        <svg viewBox="0 0 256 110" className="w-full h-full max-h-[110px] overflow-visible">
                          {/* Grid lines */}
                          <line x1="0" y1="5" x2="256" y2="5" stroke="#f1f3f5" strokeWidth="1" />
                          <line x1="0" y1="55" x2="256" y2="55" stroke="#f1f3f5" strokeWidth="1" />
                          <line x1="0" y1="105" x2="256" y2="105" stroke="#e9ecef" strokeWidth="1" strokeDasharray="3 3" />

                          {/* Bars Render */}
                          {(() => {
                            const N = emiCalculations.yearlyAmortization.length || 1;
                            const usableWidth = 236;
                            const usableHeight = 90;
                            const gap = Math.max(1, Math.min(6, Math.floor(100 / N)));
                            const colWidth = (usableWidth - (N - 1) * gap) / N;
                            const maxOutflow = emiCalculations.maxYearlyOutflow || 1;

                            return emiCalculations.yearlyAmortization.map((yr, idx) => {
                              const h_p = (yr.principal / maxOutflow) * usableHeight;
                              const h_i = (yr.interest / maxOutflow) * usableHeight;
                              const h_e = (yr.extra / maxOutflow) * usableHeight;

                              const x = 10 + idx * (colWidth + gap);
                              const y_p = 100 - h_p;
                              const y_i = y_p - h_i;
                              const y_e = y_i - h_e;

                              return (
                                <g key={yr.year}>
                                  {/* Principal segment */}
                                  {h_p > 0 && (
                                    <rect
                                      x={x}
                                      y={y_p}
                                      width={colWidth}
                                      height={h_p}
                                      fill="#3344e6"
                                      className="transition-all duration-300"
                                    />
                                  )}
                                  {/* Interest segment */}
                                  {h_i > 0 && (
                                    <rect
                                      x={x}
                                      y={y_i}
                                      width={colWidth}
                                      height={h_i}
                                      fill="#10b981"
                                      className="transition-all duration-300"
                                    />
                                  )}
                                  {/* Extra segment */}
                                  {h_e > 0 && (
                                    <rect
                                      x={x}
                                      y={y_e}
                                      width={colWidth}
                                      height={h_e}
                                      fill="#8b5cf6"
                                      className="transition-all duration-300"
                                    />
                                  )}
                                </g>
                              );
                            });
                          })()}
                        </svg>
                      </div>

                      {/* Chart Labels */}
                      <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-0.5 w-full">
                        <span>Start (Year 0)</span>
                        <span>Midway</span>
                        <span>End (Year {Number(emiTenure) || 0})</span>
                      </div>
                    </button>

                    {/* Optimized impact card (Standard) */}
                    {activeTab !== "education" && emiOptimize && (
                      <div className="w-full max-w-[640px] bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 flex flex-col gap-2.5 animate-fade-up">
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

                    {/* Prepayment Benefits Card (Education) */}
                    {activeTab === "education" && emiCalculations.interestSaved > 0 && (
                      <div className="w-full max-w-[640px] bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 flex flex-col gap-2.5 animate-fade-up">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[16px]">✨</span>
                          <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-[0.5px]">Prepayment Benefits</span>
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

                    {/* Servicing Strategy Comparison Card (Education) */}
                    {activeTab === "education" && emiCalculations.comparison && (
                      <div className="w-full max-w-[640px] bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-250 rounded-[14px] p-4 flex flex-col gap-3 animate-fade-up">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[16px]">💡</span>
                          <span className="text-[12.5px] font-bold text-emerald-800 uppercase tracking-wide">
                            Servicing Strategy Comparison
                          </span>
                        </div>
                        <p className="text-[11.5px] leading-normal text-emerald-800">
                          Paying interest during the study period prevents it from compounding/capitalizing, saving you money.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-gray-400 uppercase border-b border-emerald-100 pb-1.5 mt-1">
                          <span>Parameter</span>
                          <span className="text-right">No Payment</span>
                          <span className="text-right">Full Serviced</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-3 gap-2 text-[12px] font-medium text-gray-700">
                            <span>Repayment Principal:</span>
                            <span className="text-right font-semibold text-gray-900">
                              {formatCurrency(emiCalculations.comparison.noPayment.effectiveRepaymentPrincipal)}
                            </span>
                            <span className="text-right font-semibold text-gray-900">
                              {formatCurrency(emiCalculations.comparison.fullServiced.effectiveRepaymentPrincipal)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[12px] font-medium text-gray-700">
                            <span>Monthly EMI:</span>
                            <span className="text-right font-semibold text-gray-900">
                              {formatCurrency(emiCalculations.comparison.noPayment.initialEmi)}
                            </span>
                            <span className="text-right font-semibold text-gray-900">
                              {formatCurrency(emiCalculations.comparison.fullServiced.initialEmi)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[12px] font-medium text-gray-700">
                            <span>Total Interest:</span>
                            <span className="text-right font-semibold text-gray-900">
                              {formatCurrency(emiCalculations.comparison.noPayment.totalInterest)}
                            </span>
                            <span className="text-right font-semibold text-gray-900">
                              {formatCurrency(emiCalculations.comparison.fullServiced.totalInterest)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[12px] font-bold text-gray-900 border-t border-emerald-100 pt-1.5">
                            <span>Total Cost:</span>
                            <span className="text-right">
                              {formatCurrency(emiCalculations.comparison.noPayment.totalPayable)}
                            </span>
                            <span className="text-right text-emerald-600">
                              {formatCurrency(emiCalculations.comparison.fullServiced.totalPayable)}
                            </span>
                          </div>
                        </div>
                        {emiCalculations.comparison.savings > 0 && (
                          <div className="bg-white/80 border border-emerald-200 rounded-[10px] p-2.5 mt-1 flex justify-between items-center text-[11.5px]">
                            <span className="font-bold text-emerald-800">Total Interest Saved:</span>
                            <span className="font-extrabold text-emerald-600 text-[13.5px]">
                              {formatCurrency(emiCalculations.comparison.savings)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Amortization Schedule section */}
            {!(activeTab === "professional" && profStructure !== "standard") && (
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 border-b border-gray-200">
                      <div className="text-[12px] text-gray-500 font-semibold">
                        Download complete month-wise breakdown for Excel, Google Sheets, or Numbers.
                      </div>
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-bold rounded-[10px] shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export Monthly Schedule (Excel)</span>
                      </button>
                    </div>
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
                        <tbody>
                          {emiCalculations.yearlyAmortization.map((yr) => (
                            <React.Fragment key={yr.year}>
                              <tr className="border-b border-gray-150 hover:bg-gray-50/50 text-[12.5px] font-bold text-gray-700">
                                <td className="p-3">Year {yr.year}</td>
                                <td className="p-3">{formatCurrency(yr.principal)}</td>
                                <td className="p-3 text-emerald-600">{formatCurrency(yr.interest)}</td>
                                {emiOptimize && <td className="p-3 text-purple-600">{formatCurrency(yr.extra)}</td>}
                                <td className="p-3 text-gray-900">{formatCurrency(yr.endBalance)}</td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedYear(expandedYear === yr.year ? null : yr.year)}
                                    className="px-2.5 py-1 text-[11px] font-extrabold text-primary bg-primary/5 hover:bg-primary/10 rounded-[6px] border border-primary/10 cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <span>{expandedYear === yr.year ? "Hide" : "Show"} Months</span>
                                    {expandedYear === yr.year ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>
                                </td>
                              </tr>
                              {expandedYear === yr.year && (
                                <tr>
                                  <td colSpan={emiOptimize ? 6 : 5} className="bg-gray-50/70 p-3 border-b border-gray-200">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                                      {yr.months.map((m) => (
                                        <div key={m.month} className="bg-white border border-gray-200 rounded-[8px] p-2.5 text-[11.5px] shadow-xs flex flex-col font-bold">
                                          <div className="text-gray-400 border-b border-gray-50 pb-1 mb-1">Month {m.month}</div>
                                          <div className="text-gray-700">Prin: {formatCurrency(m.principal)}</div>
                                          <div className="text-emerald-600 my-0.5">Int: {formatCurrency(m.interest)}</div>
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
            )}
          </div>
          </div>
          </div>
        )}

        {/* ----------------- LOAN COMPARISON TAB ----------------- */}
        {calcType === "compare" && (
          <div className="relative">
            {isGuest && (
              <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none rounded-[16px]">
                <div className="bg-white border border-gray-150 rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.15)] animate-scale-in">
                  <div className="text-[32px] text-center mb-[12px]">🔒</div>
                  <h3 className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign up to compare loans</h3>
                  <p className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
                    Create a free account or sign in to compare interest rates, tenures, and total costs side-by-side.
                  </p>
                  <button
                    onClick={onLoginRequired}
                    className="h-[48px] w-full rounded-[14px] bg-primary text-white font-semibold text-[14px] hover:bg-[#1e2db8] transition cursor-pointer"
                    type="button"
                  >
                    Sign Up / Login
                  </button>
                </div>
              </div>
            )}

            <div className={`animate-fade-up flex flex-col gap-6 ${isGuest ? "pointer-events-none select-none filter blur-[4px]" : ""}`}>
              <div className="grid gap-[24px] md:grid-cols-2">
              {/* Loan A Column */}
              <div className="border border-gray-200 rounded-[14px] p-4 bg-gray-50/50 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px]">A</span>
                  <span className="text-[13px] font-bold text-gray-800">Loan Option A ({labelA})</span>
                </div>

                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-600 mb-1">Loan Category</label>
                  <div className="relative">
                    <select
                      value={compTypeA}
                      onChange={(e) => handleCompTypeAChange(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold text-gray-800 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      {LOAN_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon} {t.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-600 mb-1">Loan Amount</label>
                  <input
                    type="number"
                    value={compAmountA}
                    onChange={(e) => setCompAmountA(e.target.value)}
                    onBlur={() => {
                      const val = Number(compAmountA) || 0;
                      const minVal = Math.round(100000 * currencyScale);
                      const maxVal = Math.round(10000000 * currencyScale);
                      setCompAmountA(String(Math.max(minVal, Math.min(maxVal, val))));
                    }}
                    className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                  />
                  <input
                    type="range"
                    min={Math.round(100000 * currencyScale)}
                    max={Math.round(10000000 * currencyScale)}
                    step={Math.round(50000 * currencyScale)}
                    value={Number(compAmountA) || 0}
                    onChange={(e) => setCompAmountA(e.target.value)}
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
                      onChange={(e) => setCompRateA(e.target.value)}
                      onBlur={() => {
                        const val = Number(compRateA) || 0;
                        setCompRateA(String(Math.max(1, Math.min(30, val))));
                      }}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-600 mb-1">Tenure (Years)</label>
                    <input
                      type="number"
                      value={compTenureA}
                      onChange={(e) => setCompTenureA(e.target.value)}
                      onBlur={() => {
                        const val = Number(compTenureA) || 0;
                        setCompTenureA(String(Math.max(1, Math.min(40, val))));
                      }}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Loan B Column */}
              <div className="border border-gray-200 rounded-[14px] p-4 bg-gray-50/50 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px]">B</span>
                  <span className="text-[13px] font-bold text-gray-800">Loan Option B ({labelB})</span>
                </div>

                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-600 mb-1">Loan Category</label>
                  <div className="relative">
                    <select
                      value={compTypeB}
                      onChange={(e) => handleCompTypeBChange(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold text-gray-800 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      {LOAN_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon} {t.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-600 mb-1">Loan Amount</label>
                  <input
                    type="number"
                    value={compAmountB}
                    onChange={(e) => setCompAmountB(e.target.value)}
                    onBlur={() => {
                      const val = Number(compAmountB) || 0;
                      const minVal = Math.round(100000 * currencyScale);
                      const maxVal = Math.round(10000000 * currencyScale);
                      setCompAmountB(String(Math.max(minVal, Math.min(maxVal, val))));
                    }}
                    className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                  />
                  <input
                    type="range"
                    min={Math.round(100000 * currencyScale)}
                    max={Math.round(10000000 * currencyScale)}
                    step={Math.round(50000 * currencyScale)}
                    value={Number(compAmountB) || 0}
                    onChange={(e) => setCompAmountB(e.target.value)}
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
                      onChange={(e) => setCompRateB(e.target.value)}
                      onBlur={() => {
                        const val = Number(compRateB) || 0;
                        setCompRateB(String(Math.max(1, Math.min(30, val))));
                      }}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-600 mb-1">Tenure (Years)</label>
                    <input
                      type="number"
                      value={compTenureB}
                      onChange={(e) => setCompTenureB(e.target.value)}
                      onBlur={() => {
                        const val = Number(compTenureB) || 0;
                        setCompTenureB(String(Math.max(1, Math.min(40, val))));
                      }}
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
                      <span className="text-[11px] font-bold text-gray-500 w-16 truncate" title={`Loan A: ${labelA}`}>
                        {labelA}
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(compCalculations.loanA.emi /
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
                      <span className="text-[11px] font-bold text-gray-500 w-16 truncate" title={`Loan B: ${labelB}`}>
                        {labelB}
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${(compCalculations.loanB.emi /
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
                      <span className="text-[11px] font-bold text-gray-500 w-16 truncate" title={`Loan A: ${labelA}`}>
                        {labelA}
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(compCalculations.loanA.totalInterest /
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
                      <span className="text-[11px] font-bold text-gray-500 w-16 truncate" title={`Loan B: ${labelB}`}>
                        {labelB}
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${(compCalculations.loanB.totalInterest /
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
                    <strong>Loan Option {compCalculations.betterLoan} ({compCalculations.betterLoan === "A" ? labelA : labelB})</strong> has the lowest overall cost of borrowing.
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

                <div className="w-full max-w-[320px] flex flex-col gap-2 animate-fade-up">
                  <button
                    type="button"
                    onClick={handleAskAssistant}
                    className="w-full px-4 py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <span>Ask Assistant to Analyze</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {onTalkToAdvisor && (
                    <button
                      type="button"
                      onClick={onTalkToAdvisor}
                      className="w-full px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-bold rounded-[12px] hover:bg-emerald-500 transition-all cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      <span>Talk to Advisor</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ----------------- PREPAYMENT IMPACT TAB ----------------- */}
        {calcType === "prepayment" && (
          <div className="relative">
            {isGuest && (
              <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none rounded-[16px]">
                <div className="bg-white border border-gray-150 rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.15)] animate-scale-in">
                  <div className="text-[32px] text-center mb-[12px]">🔒</div>
                  <h3 className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign up to analyze prepayments</h3>
                  <p className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
                    Create a free account or sign in to simulate lump sum or monthly prepayments and see how much interest you can save.
                  </p>
                  <button
                    onClick={onLoginRequired}
                    className="h-[48px] w-full rounded-[14px] bg-primary text-white font-semibold text-[14px] hover:bg-[#1e2db8] transition cursor-pointer"
                    type="button"
                  >
                    Sign Up / Login
                  </button>
                </div>
              </div>
            )}

            <div className={`animate-fade-up grid gap-[24px] lg:grid-cols-12 ${isGuest ? "pointer-events-none select-none filter blur-[4px]" : ""}`}>
              {/* Left Controls */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Amount slider */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-gray-700">Base Loan Principal</label>
                  <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(prepAmount) || 0)}</span>
                </div>
                <input
                  type="range"
                  min={activeConfig.minAmount}
                  max={activeConfig.maxAmount}
                  step={activeConfig.amountStep}
                  value={Number(prepAmount) || 0}
                  onChange={(e) => setPrepAmount(e.target.value)}
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
                    onChange={(e) => setPrepRate(e.target.value)}
                    onBlur={() => {
                      const val = Number(prepRate) || 0;
                      const clamped = Math.max(activeConfig.minRate, Math.min(activeConfig.maxRate, val));
                      setPrepRate(String(clamped));
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-700 mb-1">Tenure (Years)</label>
                  <input
                    type="number"
                    value={prepTenure}
                    onChange={(e) => setPrepTenure(e.target.value)}
                    onBlur={() => {
                      const val = Number(prepTenure) || 0;
                      const clamped = Math.max(activeConfig.minTenure, Math.min(activeConfig.maxTenure, val));
                      setPrepTenure(String(clamped));
                    }}
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
                      className={`px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer ${prepType === "monthly" ? "bg-primary text-white" : "bg-white border border-gray-300 text-gray-600"
                        }`}
                    >
                      Monthly Extra
                    </button>
                    <button
                      onClick={() => setPrepType("lump")}
                      className={`px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer ${prepType === "lump" ? "bg-primary text-white" : "bg-white border border-gray-300 text-gray-600"
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
                        onChange={(e) => setPrepVal(e.target.value)}
                        onBlur={() => {
                          const val = Number(prepVal) || 0;
                          setPrepVal(String(Math.max(0, val)));
                        }}
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
                      onChange={(e) => setPrepStartMonth(e.target.value)}
                      onBlur={() => {
                        const val = Number(prepStartMonth) || 0;
                        setPrepStartMonth(String(Math.max(1, val)));
                      }}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visualizations Side */}
            <div className="lg:col-span-6 flex flex-col items-center gap-4">
              <span className="text-[12.5px] font-bold text-gray-700 uppercase tracking-wide text-center">Tenure Reduction Visualizer</span>

              {/* Progress bars showing reduction */}
              <div className="flex flex-col gap-3 bg-gray-50 border border-gray-200 rounded-[12px] p-4 w-full max-w-[640px]">
                {/* Standard Tenure */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500">
                    <span>Original Payoff Schedule</span>
                    <span>{prepTenure} Years ({(Number(prepTenure) || 0) * 12} Mo)</span>
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

              {/* Foreclosure Metrics Summary Card */}
              <div className="w-full max-w-[640px] bg-[#f6f7fe] border border-[#d4d8fa] p-4 rounded-[14px] flex flex-col gap-3.5 animate-fade-up">
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px]">🚀</span>
                  <span className="text-[12.5px] font-bold text-primary uppercase tracking-wide">
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

              <div className="w-full max-w-[320px] flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleAskAssistant}
                  className="w-full px-4 py-2.5 bg-primary text-white text-[13px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(50,68,230,0.3)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Apply & Chat with Advisor</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                {onTalkToAdvisor && (
                  <button
                    type="button"
                    onClick={onTalkToAdvisor}
                    className="w-full px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-bold rounded-[12px] hover:bg-emerald-500 transition-all cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <span>Talk to Advisor</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        )}  
      </div>



      {isGraphExpanded && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col p-6 rounded-[20px] shadow-2xl border border-gray-150 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
            <div>
              <h3 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Detailed Loan Amortization Analysis</span>
              </h3>
              <p className="text-[12px] font-semibold text-gray-500 mt-1">
                Interactive year-by-year view of principal, interest, and prepayments.
              </p>
            </div>
            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              <div className="flex bg-gray-100 p-0.5 rounded-[10px] border border-gray-200">
                <button
                  type="button"
                  onClick={() => setExpandedGraphType("stacked")}
                  className={`px-3 py-1.5 text-[12px] font-bold rounded-[8px] transition-all cursor-pointer ${expandedGraphType === "stacked"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  Stacked Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedGraphType("comparison")}
                  className={`px-3 py-1.5 text-[12px] font-bold rounded-[8px] transition-all cursor-pointer ${expandedGraphType === "comparison"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  Side-by-Side
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGraphExpanded(false);
                  setHoveredYearIndex(null);
                }}
                className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-all cursor-pointer"
                aria-label="Close detailed graph"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body content split */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
            {/* Premium HUD Info Card */}
            <div className="lg:w-80 flex flex-col gap-4 bg-gray-50 border border-gray-150 rounded-[16px] p-4 shrink-0">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Year Details HUD
              </div>

              {hoveredYearIndex !== null && emiCalculations.yearlyAmortization[hoveredYearIndex] ? (
                (() => {
                  const yrData = emiCalculations.yearlyAmortization[hoveredYearIndex];
                  const prevYrData = hoveredYearIndex > 0 ? emiCalculations.yearlyAmortization[hoveredYearIndex - 1] : null;
                  const begBalance = prevYrData ? prevYrData.endBalance : (Number(emiAmount) || 0);
                  const totalPaid = yrData.principal + yrData.interest + yrData.extra;

                  return (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      <div className="flex justify-between items-center bg-primary/5 border border-primary/10 rounded-[10px] p-2.5">
                        <span className="text-[14px] font-bold text-primary">Year {yrData.year}</span>
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                          Active Year
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white border border-gray-150 rounded-[10px] p-2.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Beg. Balance</span>
                          <span className="text-[13px] font-bold text-gray-900 block mt-0.5">{formatCurrency(begBalance)}</span>
                        </div>
                        <div className="bg-white border border-gray-150 rounded-[10px] p-2.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">End Balance</span>
                          <span className="text-[13px] font-bold text-gray-900 block mt-0.5">{formatCurrency(yrData.endBalance)}</span>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-150 rounded-[10px] p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11.5px]">
                          <div className="flex items-center gap-1.5 font-semibold text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-primary block shrink-0" />
                            <span>Principal Paid</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatCurrency(yrData.principal)}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11.5px] border-t border-gray-50 pt-2">
                          <div className="flex items-center gap-1.5 font-semibold text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 block shrink-0" />
                            <span>Interest Paid</span>
                          </div>
                          <span className="font-bold text-emerald-600">{formatCurrency(yrData.interest)}</span>
                        </div>

                        {yrData.extra > 0 && (
                          <div className="flex items-center justify-between text-[11.5px] border-t border-gray-50 pt-2">
                            <div className="flex items-center gap-1.5 font-semibold text-gray-500">
                              <span className="w-2 h-2 rounded-full bg-purple-500 block shrink-0" />
                              <span>Extra Prepayment</span>
                            </div>
                            <span className="font-bold text-purple-600">{formatCurrency(yrData.extra)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[12px] font-bold text-gray-900 border-t border-gray-100 pt-2">
                          <span>Total Yearly Paid</span>
                          <span>{formatCurrency(totalPaid)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-250 rounded-[16px] bg-white min-h-[180px]">
                  <span className="text-[20px] mb-2">📊</span>
                  <span className="text-[12px] font-bold text-gray-700">Interactive Preview</span>
                  <p className="text-[11px] font-semibold text-gray-400 mt-1 max-w-[180px] leading-normal">
                    Hover over any of the columns in the graph to display year-specific repayment data.
                  </p>
                </div>
              )}

              {/* Dynamic metrics summaries inside HUD */}
              <div className="mt-auto border-t border-gray-200 pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11.5px] font-semibold text-gray-500">
                  <span>Standard Tenure:</span>
                  <span className="font-bold text-gray-900">{Number(emiTenure) || 0} Years</span>
                </div>
                {emiOptimize && (
                  <>
                    <div className="flex justify-between items-center text-[11.5px] font-semibold text-gray-500">
                      <span>Optimized Tenure:</span>
                      <span className="font-bold text-emerald-600">
                        {Math.round(emiCalculations.actualMonths / 12 * 10) / 10} Years
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-[8px] p-2 mt-1">
                      <span>Total Interest Saved:</span>
                      <span className="font-bold">{formatCurrency(emiCalculations.interestSaved)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Main Graph */}
            <div className="flex-1 flex flex-col bg-white border border-gray-150 rounded-[16px] p-4 min-w-0 relative">
              <div className="flex-1 min-h-[220px] relative">
                <svg
                  viewBox="0 0 1000 400"
                  className="w-full h-full overflow-visible"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Grid lines and Y axis ticks */}
                  {(() => {
                    const ticks = 4;
                    const maxVal = emiCalculations.maxYearlyOutflow || 1;
                    const lines = [];
                    for (let i = 0; i <= ticks; i++) {
                      const y = 40 + (310 / ticks) * i;
                      const value = maxVal - (maxVal / ticks) * i;
                      lines.push(
                        <g key={i}>
                          <line x1="70" y1={y} x2="960" y2={y} stroke="#f1f3f5" strokeWidth="1" />
                          <text
                            x="60"
                            y={y + 4}
                            textAnchor="end"
                            className="text-[10px] font-bold fill-gray-400"
                          >
                            {formatCompact(value)}
                          </text>
                        </g>
                      );
                    }
                    return lines;
                  })()}

                  {/* Bars Render */}
                  {(() => {
                    const N = emiCalculations.yearlyAmortization.length || 1;
                    const usableWidth = 870;
                    const usableHeight = 310;
                    const gap = Math.max(4, Math.min(16, Math.floor(400 / N)));
                    const colWidth = (usableWidth - (N - 1) * gap) / N;
                    const maxOutflow = emiCalculations.maxYearlyOutflow || 1;

                    return emiCalculations.yearlyAmortization.map((yr, idx) => {
                      const x = 80 + idx * (colWidth + gap);
                      const isHovered = hoveredYearIndex === idx;

                      if (expandedGraphType === "stacked") {
                        const h_p = (yr.principal / maxOutflow) * usableHeight;
                        const h_i = (yr.interest / maxOutflow) * usableHeight;
                        const h_e = (yr.extra / maxOutflow) * usableHeight;

                        const y_p = 350 - h_p;
                        const y_i = y_p - h_i;
                        const y_e = y_i - h_e;

                        return (
                          <g
                            key={yr.year}
                            onMouseEnter={() => setHoveredYearIndex(idx)}
                            onMouseLeave={() => setHoveredYearIndex(null)}
                            className="cursor-pointer"
                          >
                            {/* Principal segment */}
                            {h_p > 0 && (
                              <rect
                                x={x}
                                y={y_p}
                                width={colWidth}
                                height={h_p}
                                fill="#3344e6"
                                opacity={hoveredYearIndex === null || isHovered ? 1 : 0.65}
                                className="transition-all duration-200"
                              />
                            )}
                            {/* Interest segment */}
                            {h_i > 0 && (
                              <rect
                                x={x}
                                y={y_i}
                                width={colWidth}
                                height={h_i}
                                fill="#10b981"
                                opacity={hoveredYearIndex === null || isHovered ? 1 : 0.65}
                                className="transition-all duration-200"
                              />
                            )}
                            {/* Extra segment */}
                            {h_e > 0 && (
                              <rect
                                x={x}
                                y={y_e}
                                width={colWidth}
                                height={h_e}
                                fill="#8b5cf6"
                                opacity={hoveredYearIndex === null || isHovered ? 1 : 0.65}
                                className="transition-all duration-200"
                              />
                            )}

                            {/* Hover Trigger overlay rect */}
                            <rect
                              x={x - gap / 2}
                              y="40"
                              width={colWidth + gap}
                              height="310"
                              fill="transparent"
                            />
                          </g>
                        );
                      } else {
                        // Side-by-side Comparison mode
                        const principalVal = yr.principal + yr.extra;
                        const h_p = (principalVal / maxOutflow) * usableHeight;
                        const h_i = (yr.interest / maxOutflow) * usableHeight;

                        const y_p = 350 - h_p;
                        const y_i = 350 - h_i;

                        const splitWidth = colWidth / 2 - 1;
                        const x_p = x;
                        const x_i = x + splitWidth + 2;

                        return (
                          <g
                            key={yr.year}
                            onMouseEnter={() => setHoveredYearIndex(idx)}
                            onMouseLeave={() => setHoveredYearIndex(null)}
                            className="cursor-pointer"
                          >
                            {/* Principal Column */}
                            {h_p > 0 && (
                              <rect
                                x={x_p}
                                y={y_p}
                                width={splitWidth}
                                height={h_p}
                                fill="#3344e6"
                                opacity={hoveredYearIndex === null || isHovered ? 1 : 0.65}
                                className="transition-all duration-200"
                              />
                            )}

                            {/* Interest Column */}
                            {h_i > 0 && (
                              <rect
                                x={x_i}
                                y={y_i}
                                width={splitWidth}
                                height={h_i}
                                fill="#10b981"
                                opacity={hoveredYearIndex === null || isHovered ? 1 : 0.65}
                                className="transition-all duration-200"
                              />
                            )}

                            {/* Hover Trigger overlay rect */}
                            <rect
                              x={x - gap / 2}
                              y="40"
                              width={colWidth + gap}
                              height="310"
                              fill="transparent"
                            />
                          </g>
                        );
                      }
                    });
                  })()}

                  {/* X Axis line */}
                  <line x1="70" y1="350" x2="960" y2="350" stroke="#cccccc" strokeWidth="1.5" />

                  {/* X Axis Labels */}
                  {(() => {
                    const N = emiCalculations.yearlyAmortization.length || 1;
                    const usableWidth = 870;
                    const gap = Math.max(4, Math.min(16, Math.floor(400 / N)));
                    const colWidth = (usableWidth - (N - 1) * gap) / N;

                    // Only render label if there's enough space, or thin them out
                    const step = Math.max(1, Math.ceil(N / 15));

                    return emiCalculations.yearlyAmortization.map((yr, idx) => {
                      if (idx % step !== 0 && idx !== N - 1) return null;
                      const x = 80 + idx * (colWidth + gap) + colWidth / 2;

                      return (
                        <text
                          key={yr.year}
                          x={x}
                          y="370"
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-gray-400"
                        >
                          Yr {yr.year}
                        </text>
                      );
                    });
                  })()}
                </svg>
              </div>

              {/* Legend Indicator footer */}
              <div className="flex justify-center items-center gap-6 mt-4 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary block shrink-0" />
                  <span>Principal Paid {emiOptimize && "(incl. prepayments in comparison)"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
                  <span>Interest Paid</span>
                </div>
                {expandedGraphType === "stacked" && emiOptimize && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block shrink-0" />
                    <span>Extra Prepayment</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


