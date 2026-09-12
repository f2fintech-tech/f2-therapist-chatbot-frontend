import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  ShieldCheck,
  Landmark
} from "lucide-react";
import LenderOfferCard from "./cibil/LenderOfferCard";
import type { LenderProduct } from "./cibil/types";

interface EligibilityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyNow?: (loanType: string, amount: number, rate: number, tenure: number, details?: string) => void;
  onTalkToAdvisor?: () => void;
  userId?: string;
  userEmail?: string;
}

const LOAN_TYPES = [
  {
    id: "home",
    name: "Home Loan",
    icon: "🏠",
    defaultAmount: 5000000,
    minAmount: 500000,
    maxAmount: 300000000,
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
    minAmount: 500000,
    maxAmount: 50000000,
    amountStep: 50000,
    defaultRate: 14.0,
    minRate: 10.0,
    maxRate: 24.0,
    rateStep: 0.1,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 7,
  },
  {
    id: "lap",
    name: "Loan Against Property",
    icon: "🏢",
    defaultAmount: 7500000,
    minAmount: 500000,
    maxAmount: 100000000,
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
    maxAmount: 15000000,
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
    maxAmount: 4000000,
    amountStep: 10000,
    defaultRate: 12.5,
    minRate: 10.0,
    maxRate: 24.0,
    rateStep: 0.1,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 6,
  },
  {
    id: "professional",
    name: "Professional Loan (Doctors & CAs)",
    icon: "🩺",
    defaultAmount: 3000000,
    minAmount: 100000,
    maxAmount: 50000000,
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

export default function EligibilityCheckerModal({
  isOpen,
  onClose,
  onApplyNow,
  onTalkToAdvisor,
  userId,
  userEmail,
}: EligibilityCheckerModalProps) {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(val);
  };
  const formatCompact = (val: number) => {
    return new Intl.NumberFormat(currency.locale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(val);
  };

  // Eligibility Inputs State
  const [eligLoanType, setEligLoanType] = useState<string>("home");
  const [eligIncome, setEligIncome] = useState<string>("100000");
  const [eligEmi, setEligEmi] = useState<string>("10000");
  const [eligRate, setEligRate] = useState<string>("8.5");
  const [eligTenure, setEligTenure] = useState<string>("20");
  const [eligCibil, setEligCibil] = useState<string>("750");
  const [eligDegree, setEligDegree] = useState<string>("MBBS");
  const [eligExperience, setEligExperience] = useState<string>("3");

  // Comparison State
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Lenders Catalog State
  const [lenders, setLenders] = useState<LenderProduct[]>([]);
  const [isLoadingLenders, setIsLoadingLenders] = useState<boolean>(true);

  // Load Lenders Catalog from backend API or fallback
  useEffect(() => {
    let isMounted = true;
    const loadLenders = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const res = await fetch(`${apiBase}/lenders`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setLenders(data);
            setIsLoadingLenders(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch lenders catalog, using defaults:", err);
      }

      // Fallback default lenders
      if (isMounted) {
        setLenders([
          {
            id: "HL-HDFC",
            name: "HDFC Bank",
            productType: "Home Loan",
            lenderType: "Private",
            category: "home",
            minRate: 8.5,
            maxRate: 9.4,
            minTenureYears: 5,
            maxTenureYears: 30,
            minMonthlyIncome: 25000,
            minCibil: 700,
            maxFoirPct: 65,
            minAmount: 500000,
            maxAmount: 100000000,
            disbursalTime: "3-5 days",
            pros: ["Lowest floating rate", "Fast digital processing", "Flexible tenure"],
            cons: ["Processing fee applies"],
            docsRequired: ["PAN", "Aadhaar", "3 Months Salary Slips", "6 Months Bank Statement"],
            processingFee: "0.5% or ₹3,000",
          },
          {
            id: "HL-SBI",
            name: "State Bank of India (SBI)",
            productType: "Regular Home Loan",
            lenderType: "PSU",
            category: "home",
            minRate: 8.4,
            maxRate: 9.15,
            minTenureYears: 5,
            maxTenureYears: 30,
            minMonthlyIncome: 20000,
            minCibil: 720,
            maxFoirPct: 70,
            minAmount: 500000,
            maxAmount: 150000000,
            disbursalTime: "5-7 days",
            pros: ["Zero prepayment penalty", "Maximum FOIR allowance", "Subsidized interest for women"],
            cons: ["Slightly more documentation"],
            docsRequired: ["PAN", "Aadhaar", "ITR / Form 16", "6 Months Bank Statement"],
            processingFee: "₹2,000 + GST",
          },
          {
            id: "BL-BAJAJ",
            name: "Bajaj Finserv",
            productType: "Business Loan",
            lenderType: "NBFC",
            category: "business",
            minRate: 13.5,
            maxRate: 18.0,
            minTenureYears: 1,
            maxTenureYears: 5,
            minMonthlyIncome: 50000,
            minCibil: 680,
            maxFoirPct: 60,
            minAmount: 200000,
            maxAmount: 5000000,
            disbursalTime: "24-48 hours",
            pros: ["Instant online approval", "No collateral required", "Flexi-loan facility"],
            cons: ["Higher interest rate than banks"],
            docsRequired: ["GST Returns (1 Year)", "Bank Statement (12 Months)", "PAN", "Aadhaar"],
            processingFee: "2% of loan amount",
          },
          {
            id: "PL-ICICI",
            name: "ICICI Bank",
            productType: "Personal Loan",
            lenderType: "Private",
            category: "personal",
            minRate: 10.75,
            maxRate: 16.0,
            minTenureYears: 1,
            maxTenureYears: 6,
            minMonthlyIncome: 30000,
            minCibil: 720,
            maxFoirPct: 55,
            minAmount: 50000,
            maxAmount: 5000000,
            disbursalTime: "Instant - 24 hours",
            pros: ["Pre-approved limits for account holders", "100% paperless"],
            cons: ["Foreclosure charges in early months"],
            docsRequired: ["PAN", "Aadhaar", "3 Months Bank Statements"],
            processingFee: "0.99% - 2%",
          },
          {
            id: "DL-GODREJ",
            name: "Godrej Capital",
            productType: "Professional Loan (Doctors & CAs)",
            lenderType: "NBFC",
            category: "professional",
            minRate: 10.25,
            maxRate: 14.5,
            minTenureYears: 1,
            maxTenureYears: 7,
            minMonthlyIncome: 40000,
            minCibil: 680,
            maxFoirPct: 65,
            minAmount: 300000,
            maxAmount: 5000000,
            disbursalTime: "2-3 days",
            pros: ["Special limits for MBBS/MD/CA", "Higher loan amounts with minimal financials"],
            cons: ["Minimum 3 years practice vintage required"],
            docsRequired: ["Degree Certificate", "Registration Certificate", "Bank Statement"],
            processingFee: "1% + GST",
          },
        ]);
        setIsLoadingLenders(false);
      }
    };

    if (isOpen) {
      void loadLenders();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Dynamic Scale Factor based on chosen currency
  const currencyScale = useMemo(() => {
    switch (currency.code) {
      case "USD":
      case "EUR":
      case "GBP":
        return 80;
      case "JPY":
        return 0.5;
      default:
        return 1;
    }
  }, [currency]);

  // Ensure debt does not exceed income
  useEffect(() => {
    const income = Number(eligIncome) || 0;
    const emi = Number(eligEmi) || 0;
    if (emi > income) {
      setEligEmi(String(income));
    }
  }, [eligIncome, eligEmi]);

  // Handle Loan Type Switch
  const handleEligLoanTypeChange = (typeId: string) => {
    setEligLoanType(typeId);
    setSelectedLenderIds([]);
    const selected = LOAN_TYPES.find((t) => t.id === typeId);
    if (selected) {
      setEligRate(String(selected.defaultRate));
      setEligTenure(String(selected.defaultTenure));
    }
  };

  // Calculations: Eligibility & FOIR
  const eligCalculations = useMemo(() => {
    const incomeVal = Number(eligIncome) || 0;
    const emiVal = Number(eligEmi) || 0;
    const rateVal = Number(eligRate) || 0;
    const tenureVal = Number(eligTenure) || 0;

    let maxFoirPct = 50;
    if (incomeVal <= 50000) {
      maxFoirPct = 50;
    } else if (incomeVal <= 70000) {
      maxFoirPct = 60;
    } else if (incomeVal < 100000) {
      maxFoirPct = 65;
    } else {
      maxFoirPct = 70;
    }
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

    let riskLevel: "low" | "medium" | "high" = "low";
    if (baseFoir > 45) riskLevel = "high";
    else if (baseFoir > 30) riskLevel = "medium";

    return {
      maxEmiAllowed: Math.round(maxEmiAllowed),
      eligibleAmount: Math.round(eligibleAmount),
      riskLevel,
      currentFoir: Math.round(currentFoir),
      baseFoir: Math.round(baseFoir),
      maxFoirPct,
    };
  }, [eligIncome, eligEmi, eligRate, eligTenure]);

  // Matching Engine for Lender Products
  const matchedOffers = useMemo(() => {
    if (lenders.length === 0) return [];

    const incomeVal = Number(eligIncome) || 0;
    const debtEmiVal = Number(eligEmi) || 0;
    const tenureVal = Number(eligTenure) || 1;
    const cibilVal = Number(eligCibil) || 750;
    const degreeVal = eligDegree;
    const expVal = Number(eligExperience) || 0;

    const categoryProducts = lenders.filter(
      (l) => (l.category || "").toLowerCase() === eligLoanType.toLowerCase()
    );
    if (categoryProducts.length === 0) return [];

    return categoryProducts.map((lender) => {
      const reasons: string[] = [];
      let isEligible = true;

      // CIBIL gate
      if (cibilVal < lender.minCibil) {
        isEligible = false;
        reasons.push(`Credit score ${cibilVal} is below lender minimum of ${lender.minCibil}`);
      }

      // Income gate
      if (incomeVal < lender.minMonthlyIncome) {
        isEligible = false;
        reasons.push(`Monthly income ${formatCurrency(incomeVal)} is below lender minimum of ${formatCurrency(lender.minMonthlyIncome)}`);
      }

      // Tenure gate
      if (tenureVal > lender.maxTenureYears) {
        isEligible = false;
        reasons.push(`Requested tenure ${tenureVal}y exceeds lender maximum of ${lender.maxTenureYears}y`);
      }

      // Doctor/CA gates
      if (eligLoanType === "professional") {
        if (lender.id === "DL-GODREJ") {
          const isDoctor = degreeVal.match(/MBBS|MD|MS/);
          const isCA = degreeVal === "CA";
          if (isDoctor && expVal < 3) {
            isEligible = false;
            reasons.push("Doctor experience must be at least 3 years");
          } else if (isCA && expVal < 5) {
            isEligible = false;
            reasons.push("CA experience must be at least 5 years");
          }
        }
      }

      const maxFoirPct = lender.maxFoirPct || 50;
      const lenderMaxEmiAllowed = Math.max(0, incomeVal * (maxFoirPct / 100) - debtEmiVal);

      const monthlyRate = lender.minRate / 12 / 100;
      const totalMonths = tenureVal * 12;
      let eligibleLimit = 0;
      if (lenderMaxEmiAllowed > 0 && monthlyRate > 0) {
        eligibleLimit =
          (lenderMaxEmiAllowed * (Math.pow(1 + monthlyRate, totalMonths) - 1)) /
          (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
      } else if (lenderMaxEmiAllowed > 0 && monthlyRate === 0) {
        eligibleLimit = lenderMaxEmiAllowed * totalMonths;
      }

      eligibleLimit = Math.min(eligibleLimit, lender.maxAmount);

      if (eligibleLimit < lender.minAmount) {
        isEligible = false;
        reasons.push(`Eligible loan amount is below lender minimum of ${formatCurrency(lender.minAmount)}`);
      }

      const emiVal =
        monthlyRate === 0
          ? eligibleLimit / totalMonths
          : (eligibleLimit * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const resultingFoir = incomeVal > 0 ? ((debtEmiVal + emiVal) / incomeVal) * 100 : 0;

      let likelihood: "high" | "medium" | "low" | "ineligible" = "ineligible";
      if (!isEligible) {
        likelihood = "ineligible";
      } else {
        const margin = maxFoirPct - resultingFoir;
        if (resultingFoir > maxFoirPct + 5) {
          likelihood = "ineligible";
          reasons.push("Total EMIs exceed acceptable income ratio");
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
  }, [lenders, eligIncome, eligEmi, eligTenure, eligCibil, eligDegree, eligExperience, eligLoanType, formatCurrency]);

  const sortedOffers = useMemo(() => {
    if (matchedOffers.length === 0) return [];
    const approved = matchedOffers.filter((o) => o.likelihood !== "ineligible");
    const ineligible = matchedOffers.filter((o) => o.likelihood === "ineligible");
    const sortMap = { high: 0, medium: 1, low: 2, ineligible: 3 };
    approved.sort((a, b) => sortMap[a.likelihood] - sortMap[b.likelihood]);
    return [...approved.slice(0, 4), ...ineligible.slice(0, 2)];
  }, [matchedOffers]);

  const handleToggleSelectLender = (id: string) => {
    setSelectedLenderIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        setCompareError("You can compare up to 3 lenders at a time.");
        setTimeout(() => setCompareError(null), 4000);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleApplyClick = () => {
    const selectedEligType = LOAN_TYPES.find((t) => t.id === eligLoanType) || LOAN_TYPES[0];
    const detailsStr =
      `Checked ${selectedEligType.name} Eligibility & Affordability. ` +
      `Monthly income: ${formatCurrency(Number(eligIncome) || 0)}, existing monthly debt EMIs: ${formatCurrency(Number(eligEmi) || 0)}. ` +
      `Interest rate: ${Number(eligRate) || 0}%, Tenure: ${Number(eligTenure) || 0} years. ` +
      `Calculated maximum affordable EMI: ${formatCurrency(eligCalculations.maxEmiAllowed)} and total loan eligibility: ${formatCurrency(eligCalculations.eligibleAmount)}. ` +
      `Current Debt Obligation Ratio (FOIR): ${eligCalculations.baseFoir}% (Assessment: ${eligCalculations.riskLevel.toUpperCase()} RISK).`;

    onClose();
    if (onApplyNow) {
      onApplyNow(
        selectedEligType.name,
        eligCalculations.eligibleAmount,
        Number(eligRate) || 0,
        Number(eligTenure) || 0,
        detailsStr
      );
    }
  };

  const handleAdvisorClick = () => {
    onClose();
    if (onTalkToAdvisor) {
      onTalkToAdvisor();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-[22px] shadow-2xl border border-gray-150 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-[18px]">
                🎯
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-gray-900 leading-tight">
                  Check your Loan Eligibility
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  Instant AI eligibility engine with dynamic FOIR calculation and lender quote matching
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <div className="relative">
                <select
                  value={currency.code}
                  onChange={(e) =>
                    setCurrency(CURRENCIES.find((c) => c.code === e.target.value) || CURRENCIES[0])
                  }
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-[8px] text-[11px] font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-6 cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-500">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-gray-50/50">
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Calculator Inputs */}
              <div className={`${sortedOffers.length > 0 ? "lg:col-span-5" : "lg:col-span-7"} flex flex-col gap-4 bg-white p-5 rounded-[18px] border border-gray-200 shadow-sm`}>
                {/* Select Loan Category */}
                <div className="flex flex-col">
                  <label className="text-[12px] font-bold text-gray-700 mb-1">Select Loan Category</label>
                  <div className="relative">
                    <select
                      value={eligLoanType}
                      onChange={(e) => handleEligLoanTypeChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[12.5px] font-bold text-gray-800 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      {LOAN_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon} {t.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Gross Monthly Income */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold text-gray-700">Gross Monthly Income</label>
                    <span className="text-[12.5px] font-extrabold text-primary">
                      {formatCurrency(Number(eligIncome) || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 font-bold text-[13px]">{currency.symbol}</span>
                    <input
                      type="number"
                      value={eligIncome}
                      onChange={(e) => setEligIncome(e.target.value)}
                      onBlur={() => {
                        const val = Number(eligIncome) || 0;
                        const minVal = Math.round(10000 * currencyScale);
                        const maxVal = Math.round(5000000 * currencyScale);
                        setEligIncome(String(Math.max(minVal, Math.min(maxVal, val))));
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <input
                    type="range"
                    min={Math.round(10000 * currencyScale)}
                    max={Math.round(5000000 * currencyScale)}
                    step={Math.round(25000 * currencyScale)}
                    value={Number(eligIncome) || 0}
                    onChange={(e) => setEligIncome(e.target.value)}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Existing EMIs */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold text-gray-700">Existing Monthly Debt (EMIs)</label>
                    <span className="text-[12.5px] font-extrabold text-primary">
                      {formatCurrency(Number(eligEmi) || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 font-bold text-[13px]">{currency.symbol}</span>
                    <input
                      type="number"
                      value={eligEmi}
                      onChange={(e) => setEligEmi(e.target.value)}
                      onBlur={() => {
                        const val = Number(eligEmi) || 0;
                        const maxVal = Number(eligIncome) || 0;
                        setEligEmi(String(Math.max(0, Math.min(maxVal, val))));
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Number(eligIncome) || 0}
                    step={Math.round(10000 * currencyScale)}
                    value={Number(eligEmi) || 0}
                    onChange={(e) => setEligEmi(e.target.value)}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Rate & Tenure */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-700 mb-1">Expected Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={eligRate}
                      onChange={(e) => setEligRate(e.target.value)}
                      onBlur={() => {
                        const val = Number(eligRate) || 0;
                        setEligRate(String(Math.max(1, Math.min(30, val))));
                      }}
                      className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11.5px] font-semibold text-gray-700 mb-1">Tenure (Years)</label>
                    <input
                      type="number"
                      value={eligTenure}
                      onChange={(e) => setEligTenure(e.target.value)}
                      onBlur={() => {
                        const val = Number(eligTenure) || 0;
                        setEligTenure(String(Math.max(1, Math.min(40, val))));
                      }}
                      className="px-3 py-1.5 border border-gray-200 rounded-[8px] text-[12.5px] font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* CIBIL Score Slider */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold text-gray-700">CIBIL / Credit Score</label>
                    <span className="text-[12.5px] font-extrabold text-primary">{eligCibil}</span>
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

                {/* Conditional Profession for Doctor / CA */}
                {eligLoanType === "professional" && (
                  <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                    <div className="flex flex-col">
                      <label className="text-[11.5px] font-semibold text-gray-700 mb-1">Profession</label>
                      <select
                        value={eligDegree}
                        onChange={(e) => setEligDegree(e.target.value)}
                        className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[8px] text-[12px] font-bold text-gray-800 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                      >
                        <option value="MBBS">MBBS (Doctor)</option>
                        <option value="MD">MD/MS (Specialist)</option>
                        <option value="CA">Chartered Accountant (CA)</option>
                        <option value="BDS">BDS/MDS (Dentist)</option>
                        <option value="BHMS">BHMS/BAMS</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11.5px] font-semibold text-gray-700">Vintage</label>
                        <span className="text-[11px] font-bold text-primary">{eligExperience} Yrs</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={Number(eligExperience) || 0}
                        onChange={(e) => setEligExperience(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Calculation Summary Card */}
                <div className="border border-blue-150 rounded-[14px] p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 flex flex-col gap-3 mt-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.8px] text-blue-600">
                        Max Loan Eligibility
                      </span>
                      <div className="text-[24px] font-black text-primary leading-tight mt-0.5">
                        {formatCurrency(eligCalculations.eligibleAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.8px] text-gray-500">
                        Max Affordable EMI
                      </span>
                      <div className="text-[15px] font-bold text-gray-800">
                        {formatCurrency(eligCalculations.maxEmiAllowed)}/mo
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-blue-100/80">
                    <button
                      type="button"
                      onClick={handleApplyClick}
                      className="flex-1 px-3 py-2 bg-primary hover:bg-primary/95 text-white text-[11.5px] font-bold rounded-[10px] transition-all cursor-pointer shadow-sm text-center"
                    >
                      🚀 Apply for Loan
                    </button>
                    {onTalkToAdvisor && (
                      <button
                        type="button"
                        onClick={handleAdvisorClick}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11.5px] font-bold rounded-[10px] transition-all cursor-pointer shadow-sm text-center"
                      >
                        Talk to Advisor
                      </button>
                    )}
                  </div>
                </div>

                {/* FOIR Safety Assessment */}
                <div className="border border-gray-200 rounded-[14px] p-3.5 bg-gray-50/60 flex flex-col items-center justify-center gap-3">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Debt-to-Income (FOIR) Assessment
                  </span>
                  <div className="relative w-[150px] h-[75px] flex items-center justify-center overflow-hidden">
                    <svg width="150" height="150" className="absolute top-0">
                      <defs>
                        <linearGradient id="modal-safety-gauge" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 15 75 A 60 60 0 0 1 135 75"
                        fill="none"
                        stroke="url(#modal-safety-gauge)"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute bottom-1 flex flex-col items-center justify-center">
                      <span className="text-[16px] font-bold text-gray-800">{eligCalculations.baseFoir}%</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Current FOIR</span>
                    </div>
                  </div>
                  <div
                    className={`w-full border p-2.5 rounded-[10px] flex flex-col gap-1 ${
                      eligCalculations.riskLevel === "low"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : eligCalculations.riskLevel === "medium"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <span className="text-[10.5px] font-bold uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {eligCalculations.riskLevel === "low"
                        ? "Healthy Debt Position (<30%)"
                        : eligCalculations.riskLevel === "medium"
                        ? "Moderate Debt Ratio (30%-45%)"
                        : "High Obligation Ratio (>45%)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Matched Lender Offers */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-[13.5px] font-bold text-gray-800 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <span>
                      Matching Lender Offers (
                      {sortedOffers.filter((o) => o.likelihood !== "ineligible").length} Approved)
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    Real-time Lender Matrix
                  </span>
                </div>

                {isLoadingLenders ? (
                  <div className="p-8 text-center bg-white border border-gray-200 rounded-[16px]">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-[12px] text-gray-500 font-medium">Matching lender criteria...</p>
                  </div>
                ) : sortedOffers.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-gray-200 rounded-[16px] text-gray-500 text-[12.5px]">
                    No lender products match the selected category right now.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sortedOffers.map((offer) => {
                      const { lender, eligibleLimit, emi, resultingFoir, likelihood, reasons } = offer;
                      if (!lender) return null;
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
                          onApplyNow={(loanTitle: string, amount: number, rate: number, tenure: number, details?: string) => {
                            onClose();
                            if (onApplyNow) {
                              onApplyNow(loanTitle, amount, rate, tenure, details);
                            }
                          }}
                          eligIncome={eligIncome}
                          eligEmi={eligEmi}
                          eligTenure={eligTenure}
                          isSelected={selectedLenderIds.includes(lender.id)}
                          onToggleSelect={() => handleToggleSelectLender(lender.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
