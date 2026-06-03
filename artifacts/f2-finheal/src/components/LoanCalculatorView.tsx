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
  {
    id: "professional",
    name: "Professional Loan (Doctors)",
    icon: "🩺",
    defaultAmount: 3000000,
    minAmount: 100000,
    maxAmount: 15000000, // 1.5 Cr
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

  // Sync state when config changes
  useEffect(() => {
    setEmiAmount(String(activeConfig.defaultAmount));
    setEmiRate(String(activeConfig.defaultRate));
    setEmiTenure(String(activeConfig.defaultTenure));
    setEmiOptimize(false);
    setShowAmortization(false);
    setExpandedYear(null);
  }, [activeConfig]);

  // Tab 2: Eligibility Calculator Inputs
  const [eligLoanType, setEligLoanType] = useState<string>("home");
  const [eligIncome, setEligIncome] = useState<string>(String(Math.round(100000 * currencyScale)));
  const [eligEmi, setEligEmi] = useState<string>(String(Math.round(10000 * currencyScale)));
  const [eligRate, setEligRate] = useState<string>("8.5");
  const [eligTenure, setEligTenure] = useState<string>("20");
  const [eligCibil, setEligCibil] = useState<string>("750");
  const [eligDegree, setEligDegree] = useState<string>("MBBS");
  const [eligExperience, setEligExperience] = useState<string>("3");

  // Lenders catalog state
  const [lenders, setLenders] = useState<LenderProduct[]>([]);
  const [isLoadingLenders, setIsLoadingLenders] = useState<boolean>(true);

  useEffect(() => {
    const fetchLenders = async () => {
      try {
        setIsLoadingLenders(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const res = await fetch(`${apiBase}/lenders`);
        if (res.ok) {
          const data = await res.json();
          setLenders(data);
        }
      } catch (err) {
        console.error("Failed to fetch lenders:", err);
      } finally {
        setIsLoadingLenders(false);
      }
    };

    fetchLenders();

    const handleUpdate = () => {
      fetchLenders();
    };
    window.addEventListener("finheal:lenders_update", handleUpdate);
    return () => {
      window.removeEventListener("finheal:lenders_update", handleUpdate);
    };
  }, []);

  const handleEligLoanTypeChange = (typeId: string) => {
    setEligLoanType(typeId);
    const selected = LOAN_TYPES.find((t) => t.id === typeId);
    if (selected) {
      setEligRate(String(selected.defaultRate));
      setEligTenure(String(selected.defaultTenure));
    }
  };

  // Sync eligibility default amounts on currency scale shifts
  useEffect(() => {
    setEligIncome(String(Math.round(100000 * currencyScale)));
    setEligEmi(String(Math.round(10000 * currencyScale)));
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

  // Calculations for Tab 1: EMI
  const emiCalculations = useMemo(() => {
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

  // Chart data calculations for Cumulative Amortization curve
  const emiChartData = useMemo(() => {
    const amountVal = Number(emiAmount) || 0;
    const tenureVal = Number(emiTenure) || 1;
    
    // Balance Points
    const balancePoints = [amountVal];
    // Cumulative Interest Points
    const interestPoints = [0];
    
    let cumulativeInterest = 0;
    emiCalculations.yearlyAmortization.forEach((yr) => {
      balancePoints.push(yr.endBalance);
      cumulativeInterest += yr.interest;
      interestPoints.push(cumulativeInterest);
    });

    const maxY = Math.max(amountVal, emiCalculations.totalInterest) || 100;
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
  }, [emiAmount, emiCalculations.yearlyAmortization, emiCalculations.totalInterest, emiTenure]);

  // Calculations for Tab 2: Eligibility
  const eligCalculations = useMemo(() => {
    const incomeVal = Number(eligIncome) || 0;
    const emiVal = Number(eligEmi) || 0;
    const rateVal = Number(eligRate) || 0;
    const tenureVal = Number(eligTenure) || 0;

    // Standard lending standard: Max 50% Fixed Obligation to Income Ratio (FOIR)
    const maxFoirPct = 50;
    const affordableMonthlyObligation = incomeVal * (maxFoirPct / 100);
    const maxEmiAllowed = Math.max(0, affordableMonthlyObligation - emiVal);

    const monthlyRate = rateVal / 12 / 100;
    const totalMonths = tenureVal * 12;

    let eligibleAmount = 0;
    if (maxEmiAllowed > 0 && monthlyRate > 0) {
      eligibleAmount =
        (maxEmiAllowed * (Math.pow(1 + monthlyRate, totalMonths) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
    } else if (maxEmiAllowed > 0 && monthlyRate === 0) {
      eligibleAmount = maxEmiAllowed * totalMonths;
    }

    const currentFoir = incomeVal > 0 ? ((emiVal + maxEmiAllowed) / incomeVal) * 100 : 0;
    const baseFoir = incomeVal > 0 ? (emiVal / incomeVal) * 100 : 0;

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

  // Matching Engine for Lender Products
  const matchedOffers = useMemo(() => {
    if (calcType !== "eligibility" || lenders.length === 0) return [];
    
    const incomeVal = Number(eligIncome) || 0;
    const debtEmiVal = Number(eligEmi) || 0;
    const tenureVal = Number(eligTenure) || 1;
    const cibilVal = Number(eligCibil) || 750;
    const degreeVal = eligDegree;
    const expVal = Number(eligExperience) || 0;

    // Filter products matching this category
    const categoryProducts = lenders.filter(l => l.category === eligLoanType);
    if (categoryProducts.length === 0) return [];

    return categoryProducts.map(lender => {
      const reasons: string[] = [];
      let isEligible = true;

      // Check CIBIL gate
      if (cibilVal < lender.minCibil) {
        isEligible = false;
        reasons.push(`BUREAU_MIN_FAIL: Credit score ${cibilVal} is below lender minimum of ${lender.minCibil}`);
      }

      // Check Income gate
      if (incomeVal < lender.minMonthlyIncome) {
        isEligible = false;
        reasons.push(`INCOME_MIN_FAIL: Monthly income ${formatCurrency(incomeVal)} is below lender minimum of ${formatCurrency(lender.minMonthlyIncome)}`);
      }

      // Check Tenure gate
      if (tenureVal > lender.maxTenureYears) {
        isEligible = false;
        reasons.push(`TENURE_MAX_FAIL: Requested tenure ${tenureVal}y exceeds lender maximum of ${lender.maxTenureYears}y`);
      }

      // Professional-specific gates
      if (eligLoanType === "professional") {
        if (lender.id === "DL-GODREJ") {
          const isDoctor = degreeVal.match(/MBBS|MD|MS/);
          const isCA = degreeVal === "CA";
          if (isDoctor && expVal < 3) {
            isEligible = false;
            reasons.push("VINTAGE_SHORTFALL: Doctor experience must be at least 3 years");
          } else if (isCA && expVal < 5) {
            isEligible = false;
            reasons.push("VINTAGE_SHORTFALL: CA experience must be at least 5 years");
          }
        }
        
        if (lender.id === "DL-TATA" && expVal < 2) {
          isEligible = false;
          reasons.push("VINTAGE_SHORTFALL: Experience must be at least 2 years");
        }

        if (lender.id === "DL-LTF" && expVal < 3) {
          isEligible = false;
          reasons.push("VINTAGE_SHORTFALL: Experience must be at least 3 years");
        }
      }

      // Compute Affordable Limit & resulting FOIR
      const maxFoirPct = lender.maxFoirPct || 50;
      const lenderMaxEmiAllowed = Math.max(0, (incomeVal * (maxFoirPct / 100)) - debtEmiVal);
      
      const monthlyRate = lender.minRate / 12 / 100;
      const totalMonths = tenureVal * 12;
      let eligibleLimit = 0;
      if (lenderMaxEmiAllowed > 0 && monthlyRate > 0) {
        eligibleLimit = (lenderMaxEmiAllowed * (Math.pow(1 + monthlyRate, totalMonths) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
      } else if (lenderMaxEmiAllowed > 0 && monthlyRate === 0) {
        eligibleLimit = lenderMaxEmiAllowed * totalMonths;
      }

      // Cap at lender maximums and degree-specific caps
      let capLimit = lender.maxAmount;
      if (eligLoanType === "professional" && lender.id === "DL-GODREJ" && lender.extraParams?.degreeCaps) {
        const caps = lender.extraParams.degreeCaps as Record<string, number>;
        const degreeKey = degreeVal.match(/MBBS|BDS|BHMS/) ? "MBBS" : degreeVal.match(/MD|MS/) ? "MD" : "CA";
        const specificCap = caps[degreeKey];
        if (specificCap) capLimit = Math.min(capLimit, specificCap);
      }
      
      eligibleLimit = Math.min(eligibleLimit, capLimit);

      // If eligible limit is below lender minAmount, mark ineligible
      if (eligibleLimit < lender.minAmount) {
        isEligible = false;
        reasons.push(`ABB_LT_THRESHOLD: Eligible loan amount is below lender minimum of ${formatCurrency(lender.minAmount)}`);
      }

      // Compute resulting FOIR with this lender
      const emiVal = monthlyRate === 0 ? eligibleLimit / totalMonths : (eligibleLimit * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const resultingFoir = incomeVal > 0 ? ((debtEmiVal + emiVal) / incomeVal) * 100 : 0;

      // Assign Approval Likelihood
      let likelihood: "high" | "medium" | "low" | "ineligible" = "ineligible";
      if (!isEligible) {
        likelihood = "ineligible";
      } else {
        const margin = maxFoirPct - resultingFoir;
        if (resultingFoir > maxFoirPct + 5) {
          likelihood = "ineligible";
          reasons.push("FOIR_EXCEEDS_MAX: Total EMIs exceed acceptable income ratio by more than 5%");
        } else if (resultingFoir > maxFoirPct) {
          likelihood = "low";
        } else if (margin <= 10) {
          likelihood = "medium";
        } else {
          likelihood = "high";
        }
      }

      return {
        lender,
        eligibleLimit: Math.round(eligibleLimit),
        emi: Math.round(emiVal),
        resultingFoir: Math.round(resultingFoir),
        likelihood,
        reasons,
      };
    });
  }, [calcType, lenders, eligIncome, eligEmi, eligTenure, eligCibil, eligRate, eligDegree, eligExperience, eligLoanType, currencyScale]);

  const sortedOffers = useMemo(() => {
    const approved = matchedOffers.filter(o => o.likelihood !== "ineligible");
    const ineligible = matchedOffers.filter(o => o.likelihood === "ineligible");
    
    const sortMap = { high: 0, medium: 1, low: 2, ineligible: 3 };
    approved.sort((a, b) => sortMap[a.likelihood] - sortMap[b.likelihood]);
    
    return [...approved.slice(0, 4), ...ineligible.slice(0, 2)];
  }, [matchedOffers]);

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

  // AI Chat Handler Integration for each tool output
  const handleAskAssistant = () => {
    let detailsStr = "";
    const selectedEligType = LOAN_TYPES.find((t) => t.id === eligLoanType) || LOAN_TYPES[0];
    
    if (calcType === "emi") {
      detailsStr = `Calculated a ${activeConfig.name} on the EMI Calculator. ` +
        `Amount: ${formatCurrency(Number(emiAmount) || 0)}, Rate: ${Number(emiRate) || 0}%, Tenure: ${Number(emiTenure) || 0} years. ` +
        `EMI: ${formatCurrency(emiCalculations.monthlyEmi)}/mo. ` +
        `Total interest payable: ${formatCurrency(emiCalculations.totalInterest)}. ` +
        (emiOptimize ? `Optimized with 1 extra EMI annually to save ${formatCurrency(emiCalculations.interestSaved)} and payoff ${Math.floor(emiCalculations.monthsSaved / 12)}y ${emiCalculations.monthsSaved % 12}m earlier.` : "");
    } else if (calcType === "eligibility") {
      detailsStr = `Checked ${selectedEligType.name} Eligibility & Affordability. ` +
        `Monthly income: ${formatCurrency(Number(eligIncome) || 0)}, existing monthly debt EMIs: ${formatCurrency(Number(eligEmi) || 0)}. ` +
        `Interest rate: ${Number(eligRate) || 0}%, Tenure: ${Number(eligTenure) || 0} years. ` +
        `Calculated maximum affordable EMI: ${formatCurrency(eligCalculations.maxEmiAllowed)} and total loan eligibility: ${formatCurrency(eligCalculations.eligibleAmount)}. ` +
        `Current Debt Obligation Ratio (FOIR): ${eligCalculations.baseFoir}% (Assessment: ${eligCalculations.riskLevel.toUpperCase()} RISK).`;
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
      calcType === "eligibility" 
        ? selectedEligType.name 
        : calcType === "compare" 
        ? `${typeA.name} vs Alternative` 
        : activeConfig.name, 
      calcType === "eligibility" 
        ? eligCalculations.eligibleAmount 
        : calcType === "compare" 
        ? (Number(compAmountA) || 0) 
        : (Number(emiAmount) || 0), 
      calcType === "eligibility" 
        ? (Number(eligRate) || 0) 
        : calcType === "compare" 
        ? (Number(compRateA) || 0) 
        : (Number(emiRate) || 0), 
      calcType === "eligibility" 
        ? (Number(eligTenure) || 0) 
        : calcType === "compare" 
        ? (Number(compTenureA) || 0) 
        : (Number(emiTenure) || 0), 
      detailsStr
    );
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
                {/* Horizontal Outflow Progress Bar */}
                <div className="w-full max-w-[280px] flex flex-col gap-2 mt-1 animate-fade-up">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <span>Outflow Breakdown</span>
                    <span>Total: {formatCurrency(emiCalculations.totalPayable)}</span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full flex overflow-hidden border border-gray-200/50">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${emiCalculations.principalPct}%` }}
                    />
                    {emiCalculations.totalInterest > 0 && (
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${emiCalculations.interestPct}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Legends */}
                <div className="w-full max-w-[280px] grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center border border-gray-100 rounded-[10px] p-2.5 bg-gray-50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary block shrink-0" />
                      <span>Principal Amount</span>
                    </div>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{formatCurrency(Number(emiAmount) || 0)}</span>
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

                {/* Payoff Progress Amortization Timeline Area Chart */}
                <div className="w-full max-w-[280px] bg-gray-50 border border-gray-150 rounded-[14px] p-3 flex flex-col gap-2 animate-fade-up">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    <span>Payoff Progress Timeline</span>
                    <span>Max: {formatCompact(emiChartData.maxY)}</span>
                  </div>
                  
                  <div className="relative w-full h-[115px] flex items-center justify-center">
                    <svg width="256" height="110" className="overflow-visible">
                      {/* Grid lines */}
                      <line x1="0" y1="5" x2="256" y2="5" stroke="#f1f3f5" strokeWidth="1" />
                      <line x1="0" y1="55" x2="256" y2="55" stroke="#f1f3f5" strokeWidth="1" />
                      <line x1="0" y1="105" x2="256" y2="105" stroke="#e9ecef" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Areas */}
                      {emiChartData.interestPath && (
                        <path d={emiChartData.interestPath} fill="url(#interestGrad)" className="opacity-15 transition-all duration-500" />
                      )}
                      {emiChartData.balancePath && (
                        <path d={emiChartData.balancePath} fill="url(#balanceGrad)" className="opacity-10 transition-all duration-500" />
                      )}
                      
                      {/* Lines */}
                      {emiChartData.interestLine && (
                        <path d={emiChartData.interestLine} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-500" />
                      )}
                      {emiChartData.balanceLine && (
                        <path d={emiChartData.balanceLine} fill="none" stroke="#3344e6" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-500" />
                      )}
                      
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3344e6" />
                          <stop offset="100%" stopColor="#3344e6" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  {/* Chart Labels */}
                  <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-0.5">
                    <span>Start (Year 0)</span>
                    <span>Midway</span>
                    <span>End (Year {Number(emiTenure) || 0})</span>
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
            {/* Left inputs & Safety Gauge Stack */}
            <div className={`${sortedOffers.length > 0 ? "lg:col-span-5" : "lg:col-span-7"} flex flex-col gap-6`}>
              {/* Select Loan Type */}
              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1.5">Select Loan Category</label>
                <div className="relative">
                  <select
                    value={eligLoanType}
                    onChange={(e) => handleEligLoanTypeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-[12px] text-[13px] font-bold text-gray-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  >
                    {LOAN_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500">
                    <ChevronDown className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

              {/* Monthly Income */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-gray-700">Gross Monthly Income</label>
                  <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(eligIncome) || 0)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                  <input
                    type="number"
                    value={eligIncome}
                    onChange={(e) => setEligIncome(e.target.value)}
                    onBlur={() => {
                      const val = Number(eligIncome) || 0;
                      const minVal = Math.round(10000 * currencyScale);
                      const maxVal = Math.round(1000000 * currencyScale);
                      setEligIncome(String(Math.max(minVal, Math.min(maxVal, val))));
                    }}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  type="range"
                  min={Math.round(10000 * currencyScale)}
                  max={Math.round(1000000 * currencyScale)}
                  step={Math.round(5000 * currencyScale)}
                  value={Number(eligIncome) || 0}
                  onChange={(e) => setEligIncome(e.target.value)}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Existing EMIs */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-gray-700">Existing Monthly Debt (EMIs)</label>
                  <span className="text-[13px] font-bold text-primary">{formatCurrency(Number(eligEmi) || 0)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 font-bold text-[14px]">{currency.symbol}</span>
                  <input
                    type="number"
                    value={eligEmi}
                    onChange={(e) => setEligEmi(e.target.value)}
                    onBlur={() => {
                      const val = Number(eligEmi) || 0;
                      const maxVal = Math.round(500000 * currencyScale);
                      setEligEmi(String(Math.max(0, Math.min(maxVal, val))));
                    }}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.round(500000 * currencyScale)}
                  step={Math.round(2000 * currencyScale)}
                  value={Number(eligEmi) || 0}
                  onChange={(e) => setEligEmi(e.target.value)}
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
                    onChange={(e) => setEligRate(e.target.value)}
                    onBlur={() => {
                      const val = Number(eligRate) || 0;
                      setEligRate(String(Math.max(1, Math.min(30, val))));
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[12px] font-semibold text-gray-700 mb-1">Tenure (Years)</label>
                  <input
                    type="number"
                    value={eligTenure}
                    onChange={(e) => setEligTenure(e.target.value)}
                    onBlur={() => {
                      const val = Number(eligTenure) || 0;
                      setEligTenure(String(Math.max(1, Math.min(40, val))));
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* CIBIL Score Slider */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-semibold text-gray-700">CIBIL Score</label>
                  <span className="text-[13px] font-bold text-primary">{eligCibil}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number"
                    value={eligCibil}
                    onChange={(e) => setEligCibil(e.target.value)}
                    onBlur={() => {
                      const val = Number(eligCibil) || 750;
                      setEligCibil(String(Math.max(300, Math.min(900, val))));
                    }}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  type="range"
                  min={300}
                  max={900}
                  step={5}
                  value={Number(eligCibil) || 750}
                  onChange={(e) => setEligCibil(e.target.value)}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Conditional Profession & Experience Inputs for Doctors / CAs */}
              {eligLoanType === "professional" && (
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                  <div className="flex flex-col">
                    <label className="text-[12px] font-semibold text-gray-700 mb-1">Profession / Degree</label>
                    <select
                      value={eligDegree}
                      onChange={(e) => setEligDegree(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-[12.5px] font-bold text-gray-800 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="MBBS">MBBS (Doctor)</option>
                      <option value="MD">MD/MS/MCh (Super-specialist)</option>
                      <option value="CA">Chartered Accountant (CA)</option>
                      <option value="BDS">BDS/MDS (Dentist)</option>
                      <option value="BHMS">BHMS/BAMS (Alternative)</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[12px] font-semibold text-gray-700">Practice Vintage</label>
                      <span className="text-[11px] font-bold text-primary">{eligExperience} Yrs</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={Number(eligExperience) || 0}
                      onChange={(e) => setEligExperience(e.target.value)}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
                    />
                  </div>
                </div>
              )}

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

              {/* Stack safety gauge on left if suggested offers are displayed */}
              {sortedOffers.length > 0 && (
                <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col items-center justify-center gap-4 mt-2">
                  <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Affordability Safety Gauge</span>
                  <div className="relative w-[180px] h-[100px] flex items-center justify-center overflow-hidden">
                    <svg width="180" height="180" className="absolute top-0">
                      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 20 90 A 70 70 0 0 1 70 35" fill="none" stroke="#10b981" strokeWidth="12" className="opacity-20" />
                      <path d="M 70 35 A 70 70 0 0 1 110 35" fill="none" stroke="#f59e0b" strokeWidth="12" className="opacity-20" />
                      <path d="M 110 35 A 70 70 0 0 1 160 90" fill="none" stroke="#ef4444" strokeWidth="12" className="opacity-20" />
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
                    <div className="absolute bottom-1 flex flex-col items-center justify-center">
                      <span className="text-[20px] font-bold text-gray-800">{eligCalculations.baseFoir}%</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Debt-to-Income</span>
                    </div>
                  </div>
                  <div className={`w-full border p-3 rounded-[12px] flex flex-col gap-1.5 ${
                    eligCalculations.riskLevel === "low"
                      ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                      : eligCalculations.riskLevel === "medium"
                      ? "bg-amber-50 border-amber-250 text-amber-800"
                      : "bg-rose-50 border-rose-250 text-rose-800"
                  }`}>
                    <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" />
                      {eligCalculations.riskLevel === "low" ? "Healthy Debt Level" : eligCalculations.riskLevel === "medium" ? "Moderate Obligation" : "High Debt Obligation"}
                    </span>
                    <p className="text-[10px] leading-normal opacity-95">
                      {eligCalculations.riskLevel === "low" && "Existing EMIs consume less than 30% of income. Strong position."}
                      {eligCalculations.riskLevel === "medium" && "EMIs consume 30% to 45% of income. Moderate risk."}
                      {eligCalculations.riskLevel === "high" && "Debt consumes over 45% of income. High risk of over-leverage."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Suggested Offers list (if matches exist) OR Safety Gauge (if no matches exist) */}
            {sortedOffers.length > 0 ? (
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-1">
                  <span className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                    <Landmark className="h-4.5 w-4.5 text-primary" />
                    <span>Recommended Lender Offers ({sortedOffers.filter(o => o.likelihood !== "ineligible").length} Matched)</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ranked by Fit</span>
                </div>
                
                {isLoadingLenders ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[12px] border border-gray-200 border-dashed text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <span className="text-[13px] font-medium">Fetching real-time lender criteria...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5 max-h-[750px] overflow-y-auto pr-1">
                    {sortedOffers.map((offer) => {
                      const { lender, eligibleLimit, emi, resultingFoir, likelihood, reasons } = offer;
                      return (
                        <LenderOfferCard
                          key={lender.id}
                          lender={lender}
                          eligibleLimit={eligibleLimit}
                          emi={emi}
                          resultingFoir={resultingFoir}
                          likelihood={likelihood}
                          reasons={reasons}
                          currency={currency}
                          formatCurrency={formatCurrency}
                          formatCompact={formatCompact}
                          onApplyNow={onApplyNow}
                          eligIncome={eligIncome}
                          eligEmi={eligEmi}
                          eligTenure={eligTenure}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
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
                    <path
                      d="M 20 90 A 70 70 0 0 1 70 35"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="12"
                      className="opacity-20"
                    />
                    <path
                      d="M 70 35 A 70 70 0 0 1 110 35"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      className="opacity-20"
                    />
                    <path
                      d="M 110 35 A 70 70 0 0 1 160 90"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="12"
                      className="opacity-20"
                    />
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
            )}
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
                      <span className="text-[11px] font-bold text-gray-500 w-16 truncate" title={`Loan B: ${labelB}`}>
                        {labelB}
                      </span>
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
                      <span className="text-[11px] font-bold text-gray-500 w-16 truncate" title={`Loan A: ${labelA}`}>
                        {labelA}
                      </span>
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
                      <span className="text-[11px] font-bold text-gray-500 w-16 truncate" title={`Loan B: ${labelB}`}>
                        {labelB}
                      </span>
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
            <div className="lg:col-span-5 flex flex-col justify-center gap-4">
              <span className="text-[12.5px] font-bold text-gray-700 uppercase tracking-wide text-center">Tenure Reduction Visualizer</span>

              {/* Progress bars showing reduction */}
              <div className="flex flex-col gap-3 bg-gray-50 border border-gray-200 rounded-[12px] p-4 w-full">
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

// Lender Offer Card Sub-Component
function LenderOfferCard({
  lender,
  eligibleLimit,
  emi,
  resultingFoir,
  likelihood,
  reasons,
  currency,
  formatCurrency,
  formatCompact,
  onApplyNow,
  eligIncome,
  eligEmi,
  eligTenure
}: {
  lender: LenderProduct;
  eligibleLimit: number;
  emi: number;
  resultingFoir: number;
  likelihood: "high" | "medium" | "low" | "ineligible";
  reasons: string[];
  currency: any;
  formatCurrency: (val: number) => string;
  formatCompact: (val: number) => string;
  onApplyNow: any;
  eligIncome: string;
  eligEmi: string;
  eligTenure: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isNotApproved = likelihood === "ineligible";

  // Likelihood Badge Config
  const badgeConfig = {
    high: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "High Match" },
    medium: { bg: "bg-amber-50 text-amber-700 border-amber-250", label: "Medium Match" },
    low: { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Low Match" },
    ineligible: { bg: "bg-gray-100 text-gray-600 border-gray-200", label: "Not Approved" }
  }[likelihood];

  const handleApplyClick = () => {
    let details = `Applied for ${lender.name} ${lender.productType} via matching suggestions. ` +
      `Eligible Limit: ${formatCurrency(eligibleLimit)}, ROI: ${lender.minRate}%, Tenure: ${eligTenure} years. ` +
      `Lender constraints: Max FOIR: ${lender.maxFoirPct}%, processing fee: ${lender.processingFee || "N/A"}.`;
    onApplyNow(
      `${lender.name} ${lender.productType}`,
      eligibleLimit,
      lender.minRate,
      Number(eligTenure) || 5,
      details
    );
  };

  return (
    <div className={`border rounded-[16px] p-4 bg-white shadow-sm transition-all duration-300 ${
      isNotApproved ? "opacity-75 border-gray-200" : "border-gray-200 hover:shadow-md hover:border-primary/30"
    }`}>
      {/* Top row */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-gray-900">{lender.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border uppercase tracking-wider ${badgeConfig.bg}`}>
              {badgeConfig.label}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 mt-0.5">{lender.productType}</span>
        </div>
        {!isNotApproved && (
          <button
            onClick={handleApplyClick}
            className="px-3.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-[8px] hover:opacity-90 transition-all cursor-pointer"
          >
            Apply Now
          </button>
        )}
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-3 my-3 text-center">
        <div className="flex flex-col border-r border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Eligible Limit</span>
          <span className="text-[14px] font-bold text-gray-900 mt-0.5">
            {isNotApproved ? "₹0" : formatCompact(eligibleLimit)}
          </span>
        </div>
        <div className="flex flex-col border-r border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Interest Rate</span>
          <span className="text-[14px] font-bold text-gray-900 mt-0.5">
            {lender.minRate}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Est. Monthly EMI</span>
          <span className="text-[14px] font-bold text-gray-900 mt-0.5">
            {isNotApproved ? "—" : formatCompact(emi)}
          </span>
        </div>
      </div>

      {/* Bottom Collapsible Info */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <span>{expanded ? "Hide Details" : "View Checklist & Details"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="mt-2 text-[11.5px] text-gray-600 flex flex-col gap-3 animate-fade-up">
            {/* Why Matched / Why Not */}
            <div className="p-2.5 rounded-[10px] bg-gray-50/50 border border-gray-100">
              <span className="font-bold text-gray-700 block mb-1">
                {isNotApproved ? "Reason for Not Approved:" : "Why Matched:"}
              </span>
              {isNotApproved ? (
                <div className="flex flex-col gap-1 text-rose-700 font-semibold">
                  {reasons.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span>{r.split(": ")[1] || r}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Profile meets CIBIL (≥{lender.minCibil}), Income & FOIR requirements.</span>
                </div>
              )}
            </div>

            {/* Pros and Cons */}
            {!isNotApproved && (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Pros</span>
                  <ul className="list-disc pl-3 text-emerald-700 space-y-0.5">
                    {lender.pros.map((p, idx) => <li key={idx}>{p}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Cons</span>
                  <ul className="list-disc pl-3 text-amber-700 space-y-0.5">
                    {lender.cons.map((c, idx) => <li key={idx}>{c}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Document Checklist */}
            <div className="border-t border-gray-100 pt-2">
              <span className="font-bold text-gray-700 block mb-1.5">Required Documents Checklist:</span>
              <div className="grid gap-1.5">
                {lender.docsRequired.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-[8px] px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary block shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

