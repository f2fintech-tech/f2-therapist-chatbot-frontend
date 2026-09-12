import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  CheckCircle,
  ChevronDown,
  ShieldCheck,
  Landmark,
  Check,
  X,
  Sparkles,
  Info,
  Scale,
  ArrowRight,
  Heart,
  Wallet,
  MessageSquare,
  Zap,
  Activity,
  Award,
  SlidersHorizontal,
  ExternalLink,
  Clock,
  FileText,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  TrendingUp
} from "lucide-react";
import { LenderLogo } from "./cibil/LenderLogo";
import type { LenderProduct } from "./cibil/types";

interface EligibilityCheckerViewProps {
  userId: string;
  userEmail?: string;
  onToggleSidebar: () => void;
  onToggleInsights?: () => void;
  onApplyNow: (loanType: string, amount: number, rate: number, tenure: number, details?: string) => void;
  onTalkToAdvisor?: () => void;
  isGuest?: boolean;
  onLoginRequired?: () => void;
}

interface LoanTypeItem {
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

const LOAN_TYPES: LoanTypeItem[] = [
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
    id: "personal",
    name: "Personal Loan",
    icon: "💰",
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
    id: "car",
    name: "Car Loan",
    icon: "🚗",
    defaultAmount: 1000000,
    minAmount: 100000,
    maxAmount: 10000000,
    amountStep: 25000,
    defaultRate: 8.9,
    minRate: 7.5,
    maxRate: 16.0,
    rateStep: 0.05,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 8,
  },
  {
    id: "business",
    name: "Business Loan",
    icon: "🏢",
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
    id: "consumer",
    name: "Consumer Loan",
    icon: "🛒",
    defaultAmount: 100000,
    minAmount: 10000,
    maxAmount: 1000000,
    amountStep: 5000,
    defaultRate: 11.5,
    minRate: 9.0,
    maxRate: 20.0,
    rateStep: 0.1,
    defaultTenure: 2,
    minTenure: 1,
    maxTenure: 5,
  },
  {
    id: "lap",
    name: "Loan Against Property",
    icon: "🏬",
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
    id: "professional",
    name: "Professional Loan (Doctors/CAs)",
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

export default function EligibilityCheckerView({
  userId,
  userEmail,
  onToggleSidebar,
  onToggleInsights,
  onApplyNow,
  onTalkToAdvisor,
  isGuest = false,
  onLoginRequired,
}: EligibilityCheckerViewProps) {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(val);
  };
  const formatCompact = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)} K`;
    return `₹${val}`;
  };

  // Form Inputs State (Pre-filled to match design)
  const [eligLoanType, setEligLoanType] = useState<string>("home");
  const [eligIncome, setEligIncome] = useState<string>("100000");
  const [eligEmi, setEligEmi] = useState<string>("10000");
  const [eligRate, setEligRate] = useState<string>("8.5");
  const [eligTenure, setEligTenure] = useState<string>("20");
  const [eligCibil, setEligCibil] = useState<string>("750");
  const [eligDegree, setEligDegree] = useState<string>("MBBS");
  const [eligExperience, setEligExperience] = useState<string>("3");

  // Dropdown & UI Controls State
  const [isLoanTypeDropdownOpen, setIsLoanTypeDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<string>("fit");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visibleOffersCount, setVisibleOffersCount] = useState<number>(3);
  const [activeDetailsModalOffer, setActiveDetailsModalOffer] = useState<any | null>(null);
  const [activeDocModalOffer, setActiveDocModalOffer] = useState<any | null>(null);

  // Comparison State
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Lenders Catalog State
  const [lenders, setLenders] = useState<LenderProduct[]>([]);
  const [isLoadingLenders, setIsLoadingLenders] = useState<boolean>(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLoanTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Lenders from Backend on mount
  useEffect(() => {
    async function fetchLenders() {
      setIsLoadingLenders(true);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const res = await fetch(`${apiBase}/lenders`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLenders(data);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch lenders from API, using default catalog:", err);
      } finally {
        setIsLoadingLenders(false);
      }

      // Fallback default mock lenders if API is offline
      setLenders([
        {
          id: "DL-ICICI",
          name: "ICICI Bank",
          lenderType: "Private",
          category: "home",
          productType: "home",
          minAmount: 500000,
          maxAmount: 100000000,
          minRate: 7.9,
          maxRate: 9.2,
          minTenureYears: 1,
          maxTenureYears: 30,
          minMonthlyIncome: 25000,
          minCibil: 700,
          maxFoirPct: 60,
          disbursalTime: "2-4 days",
          docsRequired: ["PAN Card", "Aadhaar Card", "Salary Slips (3 months)", "Bank Statements (6 months)"],
          processingFee: "0.5% + GST",
          pros: ["Flexible repayment options", "Quick processing & approval", "Minimal documentation required"],
          cons: []
        },
        {
          id: "DL-AXIS",
          name: "Axis Bank",
          lenderType: "Private",
          category: "home",
          productType: "home",
          minAmount: 500000,
          maxAmount: 80000000,
          minRate: 8.4,
          maxRate: 9.5,
          minTenureYears: 1,
          maxTenureYears: 30,
          minMonthlyIncome: 25000,
          minCibil: 700,
          maxFoirPct: 55,
          disbursalTime: "3-5 days",
          docsRequired: ["PAN Card", "Aadhaar Card", "Salary Slips (3 months)", "Bank Statements (6 months)"],
          processingFee: "0.5% (Max ₹10,000)",
          pros: ["Low processing fees", "Balance transfer facility", "Online application"],
          cons: []
        },
        {
          id: "DL-BAJAJ",
          name: "Bajaj Housing Finance",
          lenderType: "NBFC",
          category: "home",
          productType: "home",
          minAmount: 500000,
          maxAmount: 150000000,
          minRate: 7.49,
          maxRate: 8.9,
          minTenureYears: 1,
          maxTenureYears: 30,
          minMonthlyIncome: 30000,
          minCibil: 720,
          maxFoirPct: 65,
          disbursalTime: "24-48 hours",
          docsRequired: ["PAN Card", "Aadhaar Card", "Income Proof", "Bank Statements"],
          processingFee: "₹4,999 + GST",
          pros: ["Attractive interest rates", "Doorstep services", "Flexible tenure options"],
          cons: []
        },
        {
          id: "DL-ADITYA",
          name: "Aditya Birla Capital",
          lenderType: "NBFC",
          category: "home",
          productType: "home",
          minAmount: 300000,
          maxAmount: 75000000,
          minRate: 8.5,
          maxRate: 10.0,
          minTenureYears: 1,
          maxTenureYears: 25,
          minMonthlyIncome: 20000,
          minCibil: 680,
          maxFoirPct: 55,
          disbursalTime: "3-5 days",
          docsRequired: ["PAN Card", "Aadhaar Card", "Income Proof", "Bank Statements"],
          processingFee: "1.0% + GST",
          pros: ["Competitive interest rates", "Top-up loan facility", "Easy online tracking"],
          cons: []
        },
        {
          id: "DL-HDFC",
          name: "HDFC Bank",
          lenderType: "Private",
          category: "home",
          productType: "home",
          minAmount: 500000,
          maxAmount: 120000000,
          minRate: 8.1,
          maxRate: 9.3,
          minTenureYears: 1,
          maxTenureYears: 30,
          minMonthlyIncome: 30000,
          minCibil: 720,
          maxFoirPct: 60,
          disbursalTime: "2-4 days",
          docsRequired: ["PAN Card", "Aadhaar Card", "Salary Slips (3 months)", "Bank Statements (6 months)"],
          processingFee: "0.5% + GST",
          pros: ["Trusted brand", "Instant digital sanction", "Special women borrower rates"],
          cons: []
        },
        {
          id: "DL-SBI",
          name: "State Bank of India",
          lenderType: "PSU",
          category: "home",
          productType: "home",
          minAmount: 500000,
          maxAmount: 150000000,
          minRate: 7.85,
          maxRate: 8.95,
          minTenureYears: 1,
          maxTenureYears: 30,
          minMonthlyIncome: 25000,
          minCibil: 700,
          maxFoirPct: 60,
          disbursalTime: "5-7 days",
          docsRequired: ["PAN Card", "Aadhaar Card", "ITR / Form 16", "Bank Statements (6 months)"],
          processingFee: "Zero processing fee on festive offers",
          pros: ["Lowest overall ROI", "No hidden charges", "Concessions for green homes"],
          cons: []
        }
      ]);
    }

    fetchLenders();
  }, []);

  const selectedLoanTypeObj = useMemo(() => {
    return LOAN_TYPES.find((t) => t.id === eligLoanType) || LOAN_TYPES[0];
  }, [eligLoanType]);

  const handleSelectLoanType = (typeId: string) => {
    setEligLoanType(typeId);
    setIsLoanTypeDropdownOpen(false);
    const item = LOAN_TYPES.find((t) => t.id === typeId);
    if (item) {
      setEligRate(String(item.defaultRate));
      setEligTenure(String(item.defaultTenure));
    }
  };

  const toggleFavorite = (lenderId: string) => {
    setFavorites((prev) =>
      prev.includes(lenderId) ? prev.filter((id) => id !== lenderId) : [...prev, lenderId]
    );
  };

  // Currency scaling
  const currencyScale = useMemo(() => {
    if (currency.code === "USD") return 0.012;
    if (currency.code === "EUR") return 0.011;
    if (currency.code === "GBP") return 0.0095;
    if (currency.code === "JPY") return 1.8;
    return 1;
  }, [currency]);

  // Overall User Eligibility Calculations (Summary Row)
  const eligCalculations = useMemo(() => {
    const income = Number(eligIncome) || 0;
    const debtEmi = Number(eligEmi) || 0;
    const rate = Number(eligRate) || 8.5;
    const tenureYears = Number(eligTenure) || 20;

    const baseFoir = income > 0 ? Math.round((debtEmi / income) * 100) : 0;
    let maxFoirPct = 50;
    if (income <= 50000) {
      maxFoirPct = 50;
    } else if (income <= 70000) {
      maxFoirPct = 60;
    } else if (income < 100000) {
      maxFoirPct = 65;
    } else {
      maxFoirPct = 70;
    }

    const maxEmiAllowed = Math.max(0, (income * maxFoirPct) / 100 - debtEmi);
    const monthlyRate = rate / 12 / 100;
    const numMonths = tenureYears * 12;

    let theoreticalCapacity = 0;
    if (maxEmiAllowed > 0 && monthlyRate > 0) {
      const pvFactor = (1 - Math.pow(1 + monthlyRate, -numMonths)) / monthlyRate;
      theoreticalCapacity = Math.round(maxEmiAllowed * pvFactor);
    } else if (maxEmiAllowed > 0 && monthlyRate === 0) {
      theoreticalCapacity = maxEmiAllowed * numMonths;
    }

    // Reference partner lender catalogue ceiling for the selected category
    const categoryLenders = lenders.filter(
      (l) => l.category === eligLoanType || l.productType === eligLoanType || l.productType === "all"
    );
    const maxPartnerLimit = categoryLenders.length > 0
      ? Math.max(...categoryLenders.map((l) => (l.maxAmount ? l.maxAmount * currencyScale : 100000000 * currencyScale)))
      : 100000000 * currencyScale;

    const eligibleAmount = Math.min(theoreticalCapacity, maxPartnerLimit);

    let riskLevel: "low" | "medium" | "high" = "low";
    if (baseFoir > 45) riskLevel = "high";
    else if (baseFoir > 30) riskLevel = "medium";

    return {
      baseFoir,
      maxFoirPct,
      maxEmiAllowed,
      eligibleAmount,
      theoreticalCapacity,
      maxPartnerLimit,
      isCappedByPartnerCeiling: theoreticalCapacity > maxPartnerLimit,
      riskLevel,
    };
  }, [eligIncome, eligEmi, eligRate, eligTenure, eligLoanType, lenders, currencyScale]);

  // Matching Engine for Lender Products
  const matchedOffers = useMemo(() => {
    if (lenders.length === 0) return [];

    const incomeVal = Number(eligIncome) || 0;
    const debtEmiVal = Number(eligEmi) || 0;
    const tenureVal = Number(eligTenure) || 1;
    const cibilVal = Number(eligCibil) || 750;
    const degreeVal = eligDegree;
    const expVal = Number(eligExperience) || 0;

    // Filter products matching this category
    const categoryProducts = lenders.filter(
      (l) => l.category === eligLoanType || l.productType === eligLoanType || l.productType === "all"
    );
    if (categoryProducts.length === 0) return [];

    return categoryProducts.map((lender) => {
      const reasons: string[] = [];
      let isEligible = true;

      // Check CIBIL gate
      if (lender.minCibil && cibilVal < lender.minCibil) {
        isEligible = false;
        reasons.push(
          `BUREAU_MIN_FAIL: Credit score ${cibilVal} is below lender minimum of ${lender.minCibil}`
        );
      }

      // Check Income gate
      if (lender.minMonthlyIncome && incomeVal < lender.minMonthlyIncome) {
        isEligible = false;
        reasons.push(
          `INCOME_MIN_FAIL: Monthly income ${formatCurrency(
            incomeVal
          )} is below lender minimum of ${formatCurrency(lender.minMonthlyIncome)}`
        );
      }

      // Check Tenure gate
      if (lender.maxTenureYears && tenureVal > lender.maxTenureYears) {
        isEligible = false;
        reasons.push(
          `TENURE_MAX_FAIL: Requested tenure ${tenureVal}y exceeds lender maximum of ${lender.maxTenureYears}y`
        );
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
      }

      // Compute affordable limit based on lender FOIR
      const maxFoirPct = lender.maxFoirPct || 55;
      const lenderMaxEmiAllowed = Math.max(0, (incomeVal * maxFoirPct) / 100 - debtEmiVal);
      const effRate = lender.minRate || Number(eligRate) || 8.5;
      const monthlyRate = effRate / 12 / 100;
      const totalMonths = tenureVal * 12;

      let eligibleLimit = 0;
      if (lenderMaxEmiAllowed > 0 && monthlyRate > 0) {
        eligibleLimit =
          (lenderMaxEmiAllowed * (Math.pow(1 + monthlyRate, totalMonths) - 1)) /
          (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
      } else if (lenderMaxEmiAllowed > 0 && monthlyRate === 0) {
        eligibleLimit = lenderMaxEmiAllowed * totalMonths;
      }

      // Cap at lender maximums and degree-specific caps
      let capLimit = lender.maxAmount || 100000000;
      if (
        eligLoanType === "professional" &&
        lender.id === "DL-GODREJ" &&
        lender.extraParams?.degreeCaps
      ) {
        const caps = lender.extraParams.degreeCaps as Record<string, number>;
        const degreeKey = degreeVal.match(/MBBS|BDS|BHMS/)
          ? "MBBS"
          : degreeVal.match(/MD|MS/)
          ? "MD"
          : "CA";
        const specificCap = caps[degreeKey];
        if (specificCap) capLimit = Math.min(capLimit, specificCap);
      }

      eligibleLimit = Math.min(eligibleLimit, capLimit);

      // If eligible limit is below lender minAmount, mark ineligible
      if (lender.minAmount && eligibleLimit < lender.minAmount) {
        isEligible = false;
        reasons.push(
          `Eligible loan amount is below lender minimum of ${formatCurrency(lender.minAmount)}`
        );
      }

      // Compute resulting FOIR with this lender
      const emiVal =
        monthlyRate === 0
          ? eligibleLimit / totalMonths
          : (eligibleLimit * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const resultingFoir = incomeVal > 0 ? ((debtEmiVal + emiVal) / incomeVal) * 100 : 0;

      // Assign Approval Likelihood
      let likelihood: "high" | "medium" | "low" | "ineligible" = "ineligible";
      if (!isEligible) {
        likelihood = "ineligible";
      } else {
        const margin = maxFoirPct - resultingFoir;
        if (resultingFoir > maxFoirPct + 5) {
          likelihood = "ineligible";
          reasons.push("Total EMIs exceed acceptable income ratio by more than 5%");
        } else if (resultingFoir > maxFoirPct) {
          likelihood = "low";
        } else if (margin <= 10) {
          likelihood = "medium";
        } else {
          likelihood = "high";
        }
      }

      // Default feature checklists if none exist in DB
      const defaultFeatures = [
        "Flexible repayment options",
        "Quick processing & approval",
        "Minimal documentation required",
      ];
      const features = lender.pros && lender.pros.length > 0 ? lender.pros.slice(0, 3) : defaultFeatures;

      return {
        lender,
        eligibleLimit: Math.round(eligibleLimit),
        emi: Math.round(emiVal),
        resultingFoir: Math.round(resultingFoir),
        likelihood,
        reasons,
        features,
      };
    });
  }, [
    lenders,
    eligIncome,
    eligEmi,
    eligTenure,
    eligCibil,
    eligDegree,
    eligExperience,
    eligLoanType,
    eligRate,
    formatCurrency,
  ]);

  // Sort offers based on selector
  const sortedOffers = useMemo(() => {
    if (matchedOffers.length === 0) return [];
    const list = [...matchedOffers];

    if (sortBy === "roi") {
      list.sort((a, b) => (a.lender.minRate || 0) - (b.lender.minRate || 0));
    } else if (sortBy === "limit") {
      list.sort((a, b) => b.eligibleLimit - a.eligibleLimit);
    } else if (sortBy === "emi") {
      list.sort((a, b) => a.emi - b.emi);
    } else {
      // Default: Best Match (FIT)
      const rankMap = { high: 0, medium: 1, low: 2, ineligible: 3 };
      list.sort((a, b) => {
        const diff = rankMap[a.likelihood] - rankMap[b.likelihood];
        if (diff !== 0) return diff;
        return b.eligibleLimit - a.eligibleLimit;
      });
    }

    return list;
  }, [matchedOffers, sortBy]);

  const handleToggleSelectLender = (id: string) => {
    setCompareError(null);
    setSelectedLenderIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        if (prev.length >= 3) {
          setCompareError("You can compare up to 3 lenders at a time.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const selectedOffersForComparison = useMemo(() => {
    return sortedOffers.filter((o) => selectedLenderIds.includes(o.lender.id));
  }, [sortedOffers, selectedLenderIds]);

  const handleApplyClick = (offer: any) => {
    const rateStr =
      offer.lender.minRate === offer.lender.maxRate
        ? `${offer.lender.minRate}%`
        : `${offer.lender.minRate}% – ${offer.lender.maxRate}%`;

    const detailsStr =
      `Applied for ${offer.lender.name} ${selectedLoanTypeObj.name}. ` +
      `Eligible Limit: ${formatCurrency(offer.eligibleLimit)}, Interest Rate: ${rateStr}, Tenure: ${eligTenure} years. ` +
      `Estimated EMI: ${formatCurrency(offer.emi)}/mo. Processing fee: ${offer.lender.processingFee || "Standard"}.`;

    onApplyNow(
      `${offer.lender.name} - ${selectedLoanTypeObj.name}`,
      offer.eligibleLimit,
      offer.lender.minRate || 8.5,
      Number(eligTenure) || 20,
      detailsStr
    );
  };

  const scrollToOffers = () => {
    const el = document.getElementById("recommended-offers-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden bg-[#f8fafc] dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 scroll-smooth">
      
      {/* Top Mobile/Desktop Navigation & Breadcrumb Header Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 lg:hidden cursor-pointer"
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#2563eb] flex items-center justify-center font-bold text-sm">
              🎯
            </div>
            <div>
              <h1 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                Loan Eligibility Checker
              </h1>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Real-time multi-lender eligibility & FOIR evaluation
              </span>
            </div>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Currency:</span>
          <div className="relative">
            <select
              value={currency.code}
              onChange={(e) =>
                setCurrency(CURRENCIES.find((c) => c.code === e.target.value) || CURRENCIES[0])
              }
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none pr-7 cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 flex flex-col gap-6 pb-28">

        {/* ======================= 1. TOP HERO BANNER ======================= */}
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-indigo-50/30 border border-blue-100/80 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          {/* Left Content */}
          <div className="flex flex-col z-10 max-w-xl">
            <span className="text-[11px] font-extrabold tracking-[1.4px] text-slate-400 uppercase">
              SMARTER BORROWING, BRIGHTER TOMORROWS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1 mb-2">
              Loan Eligibility Checker
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4">
              Enter a few details to check your eligibility and compare offers from top banks and NBFCs — all in one place.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>100% Free</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-600">
                <Activity className="w-3.5 h-3.5" />
                <span>No impact on your credit score</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-indigo-600">
                <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                <span>Personalised offers</span>
              </span>
            </div>
          </div>

          {/* Right Artwork / Clean Glassmorphic Goals Composition */}
          <div className="relative flex flex-col items-center md:items-end justify-center shrink-0">
            <div className="relative p-1.5">
              {/* Background ambient glow circles */}
              <div className="absolute -top-3 -right-3 w-28 h-28 bg-blue-300/25 dark:bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-2 -left-2 w-28 h-28 bg-emerald-300/25 dark:bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

              {/* Floating 2x2 Grid of Curated Goal Pillars */}
              <div className="relative grid grid-cols-2 gap-2.5 max-w-[280px]">
                {/* 1. Home Loan Pillar */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
                  <div className="w-9 h-9 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Home className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">Home</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">From 7.35%</span>
                  </div>
                </div>

                {/* 2. Vehicle Loan Pillar */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
                  <div className="w-9 h-9 rounded-[12px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">Auto & EV</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">From 8.65%</span>
                  </div>
                </div>

                {/* 3. Education Loan Pillar */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
                  <div className="w-9 h-9 rounded-[12px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">Education</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Global Study</span>
                  </div>
                </div>

                {/* 4. Business & Pro Pillar */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
                  <div className="w-9 h-9 rounded-[12px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Briefcase className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">Business</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">High Limit</span>
                  </div>
                </div>
              </div>

              {/* Floating Best Rate Indicator Tag */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-emerald-600/10 border border-blue-200/60 dark:border-blue-800/60 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Multi-Lender Direct Comparison</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================= 2. YOUR DETAILS FORM CARD ======================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[22px] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          {/* Card Header & Info Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Your Details</h3>
              <p className="text-xs text-slate-400 font-medium">
                Select your loan type and provide basic details to get started.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-[11.5px] font-semibold self-start sm:self-auto">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>We'll show the most relevant offers based on your details.</span>
            </div>
          </div>

          {/* Form Inputs Grid - Balanced 4-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* 1. Loan Type Dropdown */}
            <div className="relative w-full min-w-0" ref={dropdownRef}>
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Loan Type
              </label>
              <button
                type="button"
                onClick={() => setIsLoanTypeDropdownOpen(!isLoanTypeDropdownOpen)}
                className="w-full h-[44px] px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between hover:border-blue-400 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-base">{selectedLoanTypeObj.icon}</span>
                  <span className="truncate">{selectedLoanTypeObj.name}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              </button>

              {/* Custom Popover Dropdown */}
              {isLoanTypeDropdownOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[14px] shadow-xl z-50 p-1.5 animate-scale-up">
                  {LOAN_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleSelectLoanType(type.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12.5px] font-semibold text-left transition-colors cursor-pointer ${
                        eligLoanType === type.id
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-[16px]">{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Gross Monthly Income */}
            <div className="w-full min-w-0">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Gross Monthly Income
              </label>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={eligIncome}
                  onChange={(e) => setEligIncome(e.target.value)}
                  className="w-full h-[44px] pl-8 pr-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] text-[13px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="100000"
                />
              </div>
            </div>

            {/* 3. Existing Monthly Debt (EMIs) */}
            <div className="w-full min-w-0">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Existing Debt (EMIs)
              </label>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={eligEmi}
                  onChange={(e) => setEligEmi(e.target.value)}
                  className="w-full h-[44px] pl-8 pr-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] text-[13px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="10000"
                />
              </div>
            </div>

            {/* 4. Expected Interest Rate (%) */}
            <div className="w-full min-w-0">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Expected Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={eligRate}
                onChange={(e) => setEligRate(e.target.value)}
                className="w-full h-[44px] px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] text-[13px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="8.5"
              />
            </div>

            {/* 5. Tenure (Years) */}
            <div className="w-full min-w-0">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Tenure (Years)
              </label>
              <input
                type="number"
                value={eligTenure}
                onChange={(e) => setEligTenure(e.target.value)}
                className="w-full h-[44px] px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] text-[13px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="20"
              />
            </div>

            {/* 6. CIBIL Score */}
            <div className="w-full min-w-0">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                CIBIL Score
              </label>
              <div className="relative flex items-center w-48 ">
                <input
                  type="number"
                  value={eligCibil}
                  onChange={(e) => setEligCibil(e.target.value)}
                  className="w-full h-[44px] pl-5 pr-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] text-[13px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="750"
                />
              </div>
            </div>

            {/* 7. Action CTA Button (Spans 2 columns on 4-col grid) */}
            <div className="sm:col-span-2 lg:col-span-2 w-full min-w-0">
              <button
                type="button"
                onClick={scrollToOffers}
                className="w-full h-[44px] px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[13.5px] rounded-[12px] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Check Eligibility</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

          </div>

          {/* Professional Loan Specific Sub-Fields */}
          {eligLoanType === "professional" && (
            <div className="mt-4 pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-wrap items-center gap-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Degree:</label>
                <select
                  value={eligDegree}
                  onChange={(e) => setEligDegree(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                >
                  <option value="MBBS">MBBS / Doctor</option>
                  <option value="MD">MD / MS (Specialist)</option>
                  <option value="BDS">BDS (Dentist)</option>
                  <option value="CA">Chartered Accountant (CA)</option>
                  <option value="CS">Company Secretary (CS)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Experience:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={eligExperience}
                    onChange={(e) => setEligExperience(e.target.value)}
                    className="w-16 h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                    placeholder="3"
                  />
                  <span className="text-xs text-slate-400 font-medium">Years</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================= 3. SUMMARY & INSIGHTS 3-CARD ROW ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 items-stretch">
          
          {/* Card 1: Your Estimated Eligible Amount */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[22px] p-5 shadow-sm flex flex-col justify-between min-w-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Estimated Eligible Amount
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl lg:text-[26px] font-black text-[#2563eb] tracking-tight leading-tight break-words">
                    {formatCurrency(eligCalculations.eligibleAmount)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-2 leading-relaxed">
              {eligCalculations.isCappedByPartnerCeiling
                ? `Capped at max partner lender limit (${formatCompact(eligCalculations.maxPartnerLimit)}).`
                : "This is an estimate based on the details you provided."}
            </p>
          </div>

          {/* Card 2: Debt-to-Income / Affordability Gauge */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[22px] p-5 shadow-sm flex items-center justify-between gap-3 min-w-0">
            {/* Speedometer Arc Gauge */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-[96px] h-[52px] flex items-end justify-center">
                <svg width="96" height="65" viewBox="0 0 96 52" className="overflow-visible">
                  <defs>
                    <linearGradient id="dti-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  {/* Background Track */}
                  <path
                    d="M 12 48 A 36 36 0 0 1 84 48"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Gradient Arc */}
                  <path
                    d="M 12 48 A 36 36 0 0 1 84 48"
                    fill="none"
                    stroke="url(#dti-gauge-gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Number inside arch */}
                <div className="absolute inset-0 flex items-center justify-center pt-2">
                  <span className="text-[17px] font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    {eligCalculations.baseFoir}%
                  </span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight mt-1 whitespace-nowrap">
                Debt-to-Income
              </span>
            </div>

            {/* Health Level Indicator & Explanation */}
            <div className="flex flex-col min-w-0 flex-1 pl-2">
              <span
                className={`self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                  eligCalculations.riskLevel === "low"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : eligCalculations.riskLevel === "medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>
                  {eligCalculations.riskLevel === "low"
                    ? "Healthy Level"
                    : eligCalculations.riskLevel === "medium"
                    ? "Moderate Level"
                    : "High Obligation"}
                </span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {eligCalculations.riskLevel === "low" && "Your existing EMIs consume less than 30% of your income."}
                {eligCalculations.riskLevel === "medium" && "Your existing EMIs consume 30% to 45% of your income."}
                {eligCalculations.riskLevel === "high" && "Your existing EMIs exceed 45% of your income."}
              </p>
            </div>
          </div>

          {/* Card 3: Need Personalised Advice? */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[22px] p-5 shadow-sm flex flex-col justify-between min-w-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                  Need personalised advice?
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Get free guidance from our loan experts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onTalkToAdvisor}
              className="mt-3.5 w-full py-2 px-3 rounded-[10px] border border-blue-400/40 hover:border-blue-500 text-[#2563eb] font-bold text-xs hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors cursor-pointer text-center"
            >
              Talk to an Advisor
            </button>
          </div>

        </div>

        {/* ======================= 4. RECOMMENDED LENDER OFFERS GRID ======================= */}
        <div id="recommended-offers-section" className="flex flex-col gap-4 mt-2">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#2563eb] flex items-center justify-center text-lg shadow-2xs">
                🏛️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Recommended Lender Offers</span>
                  <span className="text-slate-500 font-medium text-sm">
                    ({sortedOffers.filter((o) => o.likelihood !== "ineligible").length} Matched)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Based on your profile and eligibility, here are the best offers for you.
                </p>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold text-slate-400">Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[10px] text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none pr-8 cursor-pointer shadow-sm"
                >
                  <option value="fit">Best Match (FIT)</option>
                  <option value="roi">Lowest Interest Rate</option>
                  <option value="limit">Highest Eligible Limit</option>
                  <option value="emi">Lowest Monthly EMI</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoadingLenders ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 text-slate-400">
              <div className="w-7 h-7 border-2 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-[12.5px] font-medium">Matching lender criteria...</p>
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 text-slate-500 text-[13px]">
              No matching lender offers found for this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedOffers.slice(0, visibleOffersCount).map((offer) => {
                const { lender, eligibleLimit, emi, likelihood, features } = offer;
                const isFav = favorites.includes(lender.id);
                const isSelected = selectedLenderIds.includes(lender.id);
                const isApproved = likelihood !== "ineligible";

                const matchBadge = {
                  high: { label: "HIGH MATCH", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  medium: { label: "MEDIUM MATCH", bg: "bg-amber-50 text-amber-700 border-amber-200" },
                  low: { label: "LOW MATCH", bg: "bg-rose-50 text-rose-700 border-rose-200" },
                  ineligible: { label: "NOT APPROVED", bg: "bg-slate-100 text-slate-600 border-slate-200" },
                }[likelihood] || { label: "EVALUATING", bg: "bg-slate-100 text-slate-600 border-slate-200" };

                return (
                  <div
                    key={lender.id}
                    className={`bg-white dark:bg-slate-900 border rounded-[22px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between gap-4 ${
                      !isApproved ? "opacity-75 border-slate-200" : "border-slate-200/90 hover:border-blue-300"
                    }`}
                  >
                    {/* Top Row: Checkbox, Logo, Name, Badge, Heart */}
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectLender(lender.id)}
                              className={`w-4 h-4 rounded-[4px] border mt-1 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#2563eb] border-[#2563eb] text-white"
                                  : "border-slate-300 hover:border-blue-400 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                          )}
                          <LenderLogo name={lender.name} className="w-8 h-8 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100 truncate">
                                {lender.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wide border ${matchBadge.bg}`}
                              >
                                {matchBadge.label}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {selectedLoanTypeObj.name}
                            </span>
                          </div>
                        </div>

                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={() => toggleFavorite(lender.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? "fill-rose-500 text-rose-500" : "text-slate-300"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 3 Metrics Row */}
                      <div className="grid grid-cols-3 gap-1 py-2.5 border-y border-slate-100 dark:border-slate-800 text-center">
                        <div>
                          <span className="text-[13px] font-black text-slate-900 dark:text-slate-100 block">
                            {formatCompact(eligibleLimit)}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-semibold block">
                            Eligible Limit
                          </span>
                        </div>
                        <div>
                          <span className="text-[13px] font-black text-slate-900 dark:text-slate-100 block">
                            {lender.minRate}%
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-semibold block">
                            Interest Rate
                          </span>
                        </div>
                        <div>
                          <span className="text-[13px] font-black text-slate-900 dark:text-slate-100 block">
                            {formatCompact(emi)}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-semibold block">
                            Est. Monthly EMI
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Section */}
                    <div>
                      {/* 2 Action Buttons Row: View Details & Doc Checklist */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setActiveDetailsModalOffer(offer)}
                          className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Info className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                          <span className="truncate">View Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveDocModalOffer(offer)}
                          className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                          <span className="truncate">Doc Checklist</span>
                        </button>
                      </div>

                      {/* Bottom Full-Width Action Button */}
                      <div>
                        {isApproved ? (
                          <button
                            type="button"
                            onClick={() => handleApplyClick(offer)}
                            className="w-full py-2.5 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[11.5px] rounded-[10px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Apply Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800/60 text-slate-400 font-bold text-[11.5px] rounded-[10px] cursor-not-allowed text-center"
                          >
                            Ineligible
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* View More Offers Button */}
          {sortedOffers.length > visibleOffersCount && (
            <button
              type="button"
              onClick={() => setVisibleOffersCount((prev) => prev + 3)}
              className="mx-auto mt-2 px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-[#2563eb] font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View More Offers</span>
              <span>↓</span>
            </button>
          )}

        </div>

      </div>

      {/* ======================= FLOATING MULTI-LENDER COMPARISON DRAWER ======================= */}
      {selectedLenderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-[16px] shadow-2xl border border-white/10 flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold">
              Compare Lenders ({selectedLenderIds.length} of 3 selected)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLenderIds([])}
              className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => {
                if (selectedLenderIds.length < 2) {
                  setCompareError("Select at least 2 lenders to compare.");
                  return;
                }
                setIsCompareModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#2563eb] text-white text-[11px] font-bold rounded-[8px] hover:bg-[#1d4ed8] transition-all cursor-pointer shadow-sm"
            >
              Compare Now
            </button>
          </div>
          {compareError && (
            <span className="text-[10.5px] text-rose-300 font-medium">{compareError}</span>
          )}
        </div>
      )}

      {/* ======================= DETAILS MODAL ======================= */}
      {activeDetailsModalOffer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] max-w-lg w-full p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <LenderLogo name={activeDetailsModalOffer.lender.name} className="w-10 h-10" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{activeDetailsModalOffer.lender.name}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {activeDetailsModalOffer.lender.lenderType || "Lender"}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedLoanTypeObj.name} Evaluation
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveDetailsModalOffer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Why Matched / Ineligibility Banner */}
              <div
                className={`p-3 rounded-[14px] border ${
                  activeDetailsModalOffer.likelihood !== "ineligible"
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  {activeDetailsModalOffer.likelihood !== "ineligible" ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Why This Lender Matched:</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Eligibility Assessment Notes:</span>
                    </>
                  )}
                </div>
                {activeDetailsModalOffer.likelihood !== "ineligible" ? (
                  <p className="text-[11.5px] text-emerald-700 dark:text-emerald-400 leading-relaxed pl-6">
                    Profile satisfies CIBIL threshold (≥{activeDetailsModalOffer.lender.minCibil || 700}), minimum monthly income (≥{formatCurrency(activeDetailsModalOffer.lender.minMonthlyIncome || 25000)}), and debt-to-income (FOIR) limits.
                  </p>
                ) : (
                  <ul className="text-[11.5px] text-rose-700 dark:text-rose-400 space-y-1 pl-6 list-disc">
                    {activeDetailsModalOffer.reasons.map((r: string, i: number) => (
                      <li key={i}>{r.split(": ")[1] || r}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Core Loan Metrics & Terms */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-[14px] border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Eligible Limit</span>
                  <span className="text-[14px] font-black text-[#2563eb]">
                    {formatCurrency(activeDetailsModalOffer.eligibleLimit)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Estimated EMI</span>
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(activeDetailsModalOffer.emi)}/mo
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Interest Rate</span>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    {activeDetailsModalOffer.lender.minRate === activeDetailsModalOffer.lender.maxRate
                      ? `${activeDetailsModalOffer.lender.minRate}%`
                      : `${activeDetailsModalOffer.lender.minRate}% – ${activeDetailsModalOffer.lender.maxRate}%`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Max Allowed FOIR</span>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    {activeDetailsModalOffer.lender.maxFoirPct || 55}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Disbursal Time</span>
                  <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>{activeDetailsModalOffer.lender.disbursalTime || "2-4 days"}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Processing Fee</span>
                  <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5" title={activeDetailsModalOffer.lender.processingFee || "0.5% + GST"}>
                    {activeDetailsModalOffer.lender.processingFee || "0.5% + GST"}
                  </span>
                </div>
              </div>

              {/* Pros & Cons Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-[12px]">
                  <h4 className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pros / Advantages</span>
                  </h4>
                  <ul className="space-y-1">
                    {(activeDetailsModalOffer.lender.pros && activeDetailsModalOffer.lender.pros.length > 0
                      ? activeDetailsModalOffer.lender.pros
                      : activeDetailsModalOffer.features
                    ).map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-[12px]">
                  <h4 className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
                    <ThumbsDown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Points to Note</span>
                  </h4>
                  {activeDetailsModalOffer.lender.cons && activeDetailsModalOffer.lender.cons.length > 0 ? (
                    <ul className="space-y-1">
                      {activeDetailsModalOffer.lender.cons.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                          <span className="text-amber-500 font-bold shrink-0">•</span>
                          <span className="leading-tight">{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No major adverse terms reported.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleApplyClick(activeDetailsModalOffer);
                    setActiveDetailsModalOffer(null);
                  }}
                  className="flex-1 py-2.5 bg-[#2563eb] text-white font-bold text-xs rounded-xl shadow hover:bg-[#1d4ed8] transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <span>Proceed with Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveDetailsModalOffer(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= DOCUMENT CHECKLIST MODAL ======================= */}
      {activeDocModalOffer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] max-w-lg w-full p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <LenderLogo name={activeDocModalOffer.lender.name} className="w-10 h-10" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{activeDocModalOffer.lender.name}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {activeDocModalOffer.lender.lenderType || "Lender"}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Required Documents Checklist
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveDocModalOffer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-[14px] flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-blue-900 dark:text-blue-300 leading-relaxed">
                  Keep digital copies of these mandatory documents ready for rapid verification & instant sanction by <strong>{activeDocModalOffer.lender.name}</strong>.
                </div>
              </div>

              {/* Document items list */}
              <div className="space-y-2">
                {(activeDocModalOffer.lender.docsRequired && activeDocModalOffer.lender.docsRequired.length > 0
                  ? activeDocModalOffer.lender.docsRequired
                  : ["PAN Card", "Aadhaar Card", "Salary Slips (3 months)", "Bank Statements (6 months)", "Employment ID / Form 16"]
                ).map((doc: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-[12px] bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-750 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{doc}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      Mandatory
                    </span>
                  </div>
                ))}
              </div>

              {/* Disbursal & Fee Footer Note */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-[12px] text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Expected Disbursal: <strong>{activeDocModalOffer.lender.disbursalTime || "2-4 days"}</strong></span>
                </div>
                <div>
                  <span>Fee: <strong>{activeDocModalOffer.lender.processingFee || "0.5% + GST"}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleApplyClick(activeDocModalOffer);
                    setActiveDocModalOffer(null);
                  }}
                  className="flex-1 py-2.5 bg-[#2563eb] text-white font-bold text-xs rounded-xl shadow hover:bg-[#1d4ed8] transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <span>Apply with {activeDocModalOffer.lender.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveDocModalOffer(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MULTI-LENDER COMPARISON MODAL ======================= */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] max-w-4xl w-full p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Scale className="h-5 w-5 text-[#2563eb]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Side-by-Side Lender Comparison
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div
              className={`grid grid-cols-1 ${
                selectedOffersForComparison.length === 2
                  ? "md:grid-cols-2 max-w-3xl mx-auto"
                  : "md:grid-cols-3"
              } gap-4`}
            >
              {selectedOffersForComparison.map((offer) => (
                <div
                  key={offer.lender.id}
                  className="p-4.5 rounded-[18px] border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-3 shadow-2xs hover:border-blue-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-700/80">
                      <LenderLogo name={offer.lender.name} className="w-9 h-9" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {offer.lender.name}
                          </h4>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {offer.lender.lenderType || "Lender"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{selectedLoanTypeObj.name}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500 font-medium">Eligible Limit:</span>
                        <span className="font-bold text-[#2563eb]">
                          {formatCurrency(offer.eligibleLimit)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500 font-medium">Interest Rate:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {offer.lender.minRate === offer.lender.maxRate
                            ? `${offer.lender.minRate}%`
                            : `${offer.lender.minRate}% – ${offer.lender.maxRate}%`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500 font-medium">Estimated EMI:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(offer.emi)}/mo
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500 font-medium">Max FOIR:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {offer.lender.maxFoirPct || 55}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500 font-medium">Disbursal:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {offer.lender.disbursalTime || "2-4 days"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500 font-medium">Processing Fee:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300" title={offer.lender.processingFee || "0.5% + GST"}>
                          {offer.lender.processingFee || "0.5% + GST"}
                        </span>
                      </div>
                    </div>

                    {offer.lender.docsRequired && offer.lender.docsRequired.length > 0 && (
                      <div className="mt-3 p-2.5 bg-white dark:bg-slate-800/80 rounded-[12px] border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Key Documents:
                        </span>
                        <ul className="space-y-1.5">
                          {offer.lender.docsRequired.slice(0, 3).map((d: string, i: number) => (
                            <li key={i} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-snug">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      handleApplyClick(offer);
                      setIsCompareModalOpen(false);
                    }}
                    className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center mt-2 flex items-center justify-center gap-1"
                  >
                    <span>Apply with {offer.lender.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
