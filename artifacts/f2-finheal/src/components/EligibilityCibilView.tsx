import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle,
  User as UserIcon,
  Phone,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
  Lock,
  Scale,
  Landmark,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  Percent
} from "lucide-react";
import { fetchCibilReport, getStoredCibilReport, CibilReport } from "../services/cibil";
import { useToast } from "@/hooks/use-toast";
import PolicyModal from "./PolicyModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function getLenderLogoUrl(name: string): string | null {
  const clean = name.toLowerCase();
  if (clean.includes("icici")) return "/icici_bank.png";
  if (clean.includes("axis")) return "/axis_bank.png";
  if (clean.includes("bajaj")) return "/bajaj_finance.png";
  if (clean.includes("aditya birla")) return "/aditya_birla_capital.png";
  if (clean.includes("hdfc")) return "https://logo.clearbit.com/hdfcbank.com";
  if (clean.includes("state bank") || clean.includes("sbi")) return "https://logo.clearbit.com/sbi.co.in";
  if (clean.includes("kotak")) return "https://logo.clearbit.com/kotak.com";
  if (clean.includes("tata capital")) return "https://logo.clearbit.com/tatacapital.com";
  if (clean.includes("idfc")) return "https://logo.clearbit.com/idfcfirstbank.com";
  if (clean.includes("federal")) return "https://logo.clearbit.com/federalbank.co.in";
  return null;
}

export function LenderLogo({ name, className = "w-8 h-8" }: { name: string; className?: string }) {
  const logoUrl = getLenderLogoUrl(name);
  const [error, setError] = useState(false);

  const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const getFallbackStyle = (lenderName: string) => {
    const clean = lenderName.toLowerCase();
    if (clean.includes("hdfc")) return { bg: "bg-blue-600", text: "text-white" };
    if (clean.includes("icici")) return { bg: "bg-orange-500", text: "text-white" };
    if (clean.includes("axis")) return { bg: "bg-[#800020]", text: "text-white" };
    if (clean.includes("sbi") || clean.includes("state bank")) return { bg: "bg-cyan-600", text: "text-white" };
    if (clean.includes("kotak")) return { bg: "bg-red-600", text: "text-white" };
    return { bg: "bg-primary/10", text: "text-primary" };
  };

  const style = getFallbackStyle(name);

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt={`${name} Logo`}
        className={`${className} rounded-md object-contain p-0.5 bg-white border border-gray-150 shrink-0`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${className} rounded-md flex items-center justify-center font-bold text-[11px] uppercase shrink-0 ${style.bg} ${style.text} border border-gray-150`}>
      {initials}
    </div>
  );
}

interface EligibilityCibilViewProps {
  userId: string;
  userEmail?: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onApplyNow: (loanType: string, amount: number, rate: number, tenure: number, details?: string) => void;
  onTalkToAdvisor?: () => void;
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

const LOAN_TYPES = [
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



export function isExemptRole(email?: string, name?: string): boolean {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanName = (name || "").toLowerCase().trim();

  // Admin Check
  if (
    cleanEmail === "admin@finheal.com" || 
    cleanEmail === "admin@f2finheal.com" || 
    cleanEmail.startsWith("admin@") ||
    cleanName.includes("admin") ||
    cleanName === "finheal admin"
  ) {
    return true;
  }

  // Manager & Advisor Check
  const leadershipPrefixes = ["ceo", "cto", "cfo", "coo", "vp", "president", "founder", "director", "exec", "executive"];
  const managerPrefixes = ["manager", "advisor", "lead", "supervisor", "head"];
  const isInternalDomain = cleanEmail.endsWith("@finheal.com") || cleanEmail.endsWith("@f2finheal.com") || cleanEmail.endsWith("@f2fintech.com");

  const hasLeadershipEmail = leadershipPrefixes.some(pref => cleanEmail.startsWith(`${pref}@`) || cleanEmail.includes(`.${pref}@`) || cleanEmail.includes(`-${pref}@`));
  const hasLeadershipName = leadershipPrefixes.some(pref => cleanName.includes(pref));
  const hasManagerEmail = managerPrefixes.some(pref => cleanEmail.startsWith(`${pref}@`));
  const hasManagerName = managerPrefixes.some(pref => cleanName.includes(pref));

  if (hasLeadershipEmail || hasLeadershipName || hasManagerEmail || (isInternalDomain && hasManagerName)) {
    return true;
  }

  // If email domain is f2fintech.com, it is an advisor/employee
  if (cleanEmail.endsWith("@f2fintech.com")) {
    return true;
  }

  return false;
}

export function isReportFresh(fetchedAtStr?: string): boolean {
  if (!fetchedAtStr) return false;
  try {
    const fetchedAt = new Date(fetchedAtStr);
    const diffTime = Math.abs(new Date().getTime() - fetchedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 30;
  } catch (e) {
    return false;
  }
}

export function getNextAvailableFetchDate(fetchedAtStr?: string): string {
  if (!fetchedAtStr) return "";
  try {
    const date = new Date(fetchedAtStr);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) {
    return "";
  }
}

export default function EligibilityCibilView({
  userId,
  userEmail,
  onToggleSidebar,
  onToggleInsights,
  onApplyNow,
  onTalkToAdvisor,
}: EligibilityCibilViewProps) {
  const [cibilSubTab, setCibilSubTab] = useState<"eligibility" | "cibil">("eligibility");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const { toast } = useToast();

  // CIBIL Score States
  const [cibilReport, setCibilReport] = useState<CibilReport | null>(null);
  const [storedCibilReport, setStoredCibilReport] = useState<CibilReport | null>(null);
  const [cibilLoading, setCibilLoading] = useState<boolean>(true);
  const [cibilFetching, setCibilFetching] = useState<boolean>(false);
  const [isGeneratingCAM, setIsGeneratingCAM] = useState<boolean>(false);
  const [cibilError, setCibilError] = useState<string | null>(null);
  const [cibilName, setCibilName] = useState<string>("");
  const [cibilFirstName, setCibilFirstName] = useState<string>("");
  const [cibilLastName, setCibilLastName] = useState<string>("");
  const [cibilPhone, setCibilPhone] = useState<string>("");
  const [cibilPan, setCibilPan] = useState<string>("");
  const [cibilBureau, setCibilBureau] = useState<"cibil" | "experian">("cibil");
  const [cibilReportType, setCibilReportType] = useState<"individual" | "company">("individual");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Privacy Policy state
  const [cibilAgreed, setCibilAgreed] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [activeTermsTab, setActiveTermsTab] = useState<"credit-consent" | "terms-of-use" | "privacy-policy" | "dpdp-notice" | "data-retention">("credit-consent");

  // Eligibility States
  const [eligLoanType, setEligLoanType] = useState<string>("home");
  const [eligIncome, setEligIncome] = useState<string>("100000");
  const [eligEmi, setEligEmi] = useState<string>("10000");
  const [eligRate, setEligRate] = useState<string>("8.5");
  const [eligTenure, setEligTenure] = useState<string>("20");
  const [eligCibil, setEligCibil] = useState<string>("750");
  const [eligDegree, setEligDegree] = useState<string>("MBBS");
  const [eligExperience, setEligExperience] = useState<string>("3");

  // Lenders Catalog State
  const [lenders, setLenders] = useState<LenderProduct[]>([]);
  const [isLoadingLenders, setIsLoadingLenders] = useState<boolean>(true);

  // Side-by-Side Comparison State
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Dynamic Scale Factor based on chosen currency
  const currencyScale = useMemo(() => {
    switch (currency.code) {
      case "USD":
      case "EUR":
      case "GBP":
        return 0.0125;
      case "JPY":
        return 1.5;
      case "INR":
      default:
        return 1;
    }
  }, [currency]);

  // Sync inputs on currency changes
  useEffect(() => {
    setEligIncome(String(Math.round(100000 * currencyScale)));
    setEligEmi(String(Math.round(10000 * currencyScale)));
  }, [currencyScale]);

  // Ensure existing monthly debt (EMIs) does not exceed gross monthly income
  useEffect(() => {
    const income = Number(eligIncome) || 0;
    const emi = Number(eligEmi) || 0;
    if (emi > income) {
      setEligEmi(String(income));
    }
  }, [eligIncome, eligEmi]);

  // Load CIBIL score from local storage / API
  useEffect(() => {
    async function loadStoredReport() {
      try {
        setCibilLoading(true);
        const report = await getStoredCibilReport(userId);
        if (report) {
          setStoredCibilReport(report);
          setCibilReport(report);
        }
      } catch (err) {
        console.log("No stored CIBIL report found on mount:", err);
      } finally {
        setCibilLoading(false);
      }
    }
    loadStoredReport();
  }, [userId]);

  // Load lenders catalog on mount
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      setCibilPhone(val);
    }
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (rawVal.length > 10) return;

    let formatted = "";
    for (let i = 0; i < rawVal.length; i++) {
      const char = rawVal[i];
      if (i < 5) {
        if (/[A-Z]/.test(char)) formatted += char;
      } else if (i < 9) {
        if (/[0-9]/.test(char)) formatted += char;
      } else {
        if (/[A-Z]/.test(char)) formatted += char;
      }
    }
    setCibilPan(formatted);
  };

  const handleFetchCibilReport = async (e: React.FormEvent) => {
    e.preventDefault();

    // For Experian: validate first + last name separately
    if (cibilBureau === "experian") {
      if (!cibilFirstName.trim()) {
        toast({ title: "First Name Required", description: "Please enter your first name.", variant: "destructive" });
        return;
      }
      if (!cibilLastName.trim()) {
        toast({ title: "Last Name Required", description: "Please enter your last name.", variant: "destructive" });
        return;
      }
    } else {
      if (!cibilName.trim()) {
        toast({
          title: cibilReportType === "company" ? "Company Name Required" : "Name Required",
          description: cibilReportType === "company" ? "Please enter company name." : "Please enter your name.",
          variant: "destructive"
        });
        return;
      }
    }

    if (cibilPhone.replace(/\D/g, "").length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit number.", variant: "destructive" });
      return;
    }
    if (cibilBureau !== "experian") {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(cibilPan.trim())) {
        toast({
          title: cibilReportType === "company" ? "Invalid Company PAN" : "Invalid PAN",
          description: "Standard PAN card format is ABCDE1234F.",
          variant: "destructive"
        });
        return;
      }
    }
    // For Experian, combine first + last name; backend will split them
    const effectiveName = cibilBureau === "experian"
      ? `${cibilFirstName.trim()} ${cibilLastName.trim()}`.trim()
      : cibilName;

    setCibilFetching(true);
    setCibilError(null);
    try {
      const result = await fetchCibilReport(
        userId, 
        effectiveName, 
        cibilPhone, 
        cibilBureau === "experian" ? undefined : cibilPan.toUpperCase(), 
        cibilBureau, 
        cibilReportType
      );
      setCibilReport(result);
      setStoredCibilReport(result);
      setEligCibil(String(result.score));
      setCibilError(null);
      toast({ title: "Report Retrieved!", description: `${cibilBureau.toUpperCase()} Score: ${result.score}` });
      window.dispatchEvent(new CustomEvent("finheal:wellness_update"));
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch score.";
      if (errorMsg.toLowerCase().includes("no credit record") || errorMsg.toLowerCase().includes("no record")) {
        setCibilError(errorMsg);
        setCibilReport(null);
      }
      toast({ title: "Fetch Failed", description: errorMsg, variant: "destructive" });
    } finally {
      setCibilFetching(false);
    }
  };

  const handleGenerateCAM = async () => {
    const report = cibilReport || storedCibilReport;
    if (!report) return;
    setIsGeneratingCAM(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {};
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }
      
      const res = await fetch(`${apiBase}/cibil/cam/generate/${userId}`, { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate CAM Excel report.");
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanName = report.name.replace(/[^a-zA-Z0-9_]/g, "_");
      link.setAttribute("href", url);
      link.setAttribute("download", `CAM_Report_${cleanName}.xlsx`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CAM Generated!",
        description: "Your Credit Appraisal Memorandum report has been downloaded successfully.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("Error generating CAM:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate CAM Excel report.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCAM(false);
    }
  };

  const scoreTheme = useMemo(() => {
    const score = cibilReport?.score || Number(eligCibil) || 750;
    if (score >= 750) return { color: "text-emerald-500", border: "border-emerald-200", bg: "bg-emerald-50", fill: "#10b981", gradient: "from-emerald-500 to-teal-500" };
    if (score >= 700) return { color: "text-blue-500", border: "border-blue-200", bg: "bg-blue-50", fill: "#3b82f6", gradient: "from-blue-500 to-indigo-500" };
    if (score >= 630) return { color: "text-amber-500", border: "border-amber-200", bg: "bg-amber-50", fill: "#f59e0b", gradient: "from-amber-500 to-orange-500" };
    return { color: "text-rose-500", border: "border-rose-200", bg: "bg-rose-50", fill: "#f43f5e", gradient: "from-rose-500 to-red-500" };
  }, [cibilReport, eligCibil]);

  const scoreGauge = useMemo(() => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const score = cibilReport?.score || Number(eligCibil) || 750;
    const pct = Math.max(0, Math.min(100, ((score - 300) / 600) * 100));
    return {
      radius,
      circumference,
      dashArray: circumference,
      dashOffset: circumference - (pct / 100) * circumference
    };
  }, [cibilReport, eligCibil]);

  const accountsSummary = useMemo(() => {
    const defaultCategories = {
      cc: { label: "Credit Card", open: 0, balance: 0, accounts: [] as any[] },
      pl: { label: "Personal Loan (PL)", open: 0, balance: 0, accounts: [] as any[] },
      bl: { label: "Business Loan (BL)", open: 0, balance: 0, accounts: [] as any[] },
      al: { label: "Auto Loan (AL)", open: 0, balance: 0, accounts: [] as any[] },
      od: { label: "Overdraft (OD)", open: 0, balance: 0, accounts: [] as any[] },
      prl: { label: "Professional Loan", open: 0, balance: 0, accounts: [] as any[] },
      hl: { label: "Home Loan (HL)", open: 0, balance: 0, accounts: [] as any[] }
    };

    if (!cibilReport || !cibilReport.accounts) {
      return defaultCategories;
    }

    cibilReport.accounts.forEach((acc: any) => {
      const typeLower = (acc.type || "").toLowerCase();
      
      let catKey: keyof typeof defaultCategories = "pl";
      if (typeLower.includes("overdraft") || typeLower.includes("od")) {
        catKey = "od";
      } else if (typeLower.includes("business") || typeLower.includes("bl")) {
        catKey = "bl";
      } else if (typeLower.includes("professional") || typeLower.includes("prl")) {
        catKey = "prl";
      } else if (typeLower.includes("card")) {
        catKey = "cc";
      } else if (typeLower.includes("personal") || typeLower.includes("pl") || typeLower.includes("consumer durable")) {
        catKey = "pl";
      } else if (typeLower.includes("auto") || typeLower.includes("vehicle") || typeLower.includes("car") || typeLower.includes("al") || typeLower.includes("two wheeler") || typeLower.includes("two-wheeler")) {
        catKey = "al";
      } else if (typeLower.includes("home") || typeLower.includes("housing") || typeLower.includes("hl") || typeLower.includes("property")) {
        catKey = "hl";
      } else {
        catKey = "pl";
      }

      if (acc.is_active) {
        defaultCategories[catKey].open += 1;
        defaultCategories[catKey].balance += acc.outstanding_balance || 0;
        defaultCategories[catKey].accounts.push(acc);
      }
    });

    return defaultCategories;
  }, [cibilReport]);

  const totalOpenAccounts = useMemo(() => {
    return Object.values(accountsSummary).reduce((sum, cat) => sum + cat.open, 0);
  }, [accountsSummary]);

  const totalOpenBalance = useMemo(() => {
    return Object.values(accountsSummary).reduce((sum, cat) => sum + cat.balance, 0);
  }, [accountsSummary]);

  const filteredOpenAccounts = useMemo(() => {
    if (selectedCategory && accountsSummary[selectedCategory as keyof typeof accountsSummary]) {
      return accountsSummary[selectedCategory as keyof typeof accountsSummary].accounts;
    }
    if (!cibilReport || !cibilReport.accounts) return [];
    return cibilReport.accounts.filter((acc: any) => acc.is_active);
  }, [selectedCategory, accountsSummary, cibilReport]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleEligLoanTypeChange = (typeId: string) => {
    setEligLoanType(typeId);
    setSelectedLenderIds([]);
    const selected = LOAN_TYPES.find((t) => t.id === typeId);
    if (selected) {
      setEligRate(String(selected.defaultRate));
      setEligTenure(String(selected.defaultTenure));
    }
  };

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

  const handleAskAssistant = () => {
    const selectedEligType = LOAN_TYPES.find((t) => t.id === eligLoanType) || LOAN_TYPES[0];
    const detailsStr = `Checked ${selectedEligType.name} Eligibility & Affordability. ` +
      `Monthly income: ${formatCurrency(Number(eligIncome) || 0)}, existing monthly debt EMIs: ${formatCurrency(Number(eligEmi) || 0)}. ` +
      `Interest rate: ${Number(eligRate) || 0}%, Tenure: ${Number(eligTenure) || 0} years. ` +
      `Calculated maximum affordable EMI: ${formatCurrency(eligCalculations.maxEmiAllowed)} and total loan eligibility: ${formatCurrency(eligCalculations.eligibleAmount)}. ` +
      `Current Debt Obligation Ratio (FOIR): ${eligCalculations.baseFoir}% (Assessment: ${eligCalculations.riskLevel.toUpperCase()} RISK).`;

    onApplyNow(
      selectedEligType.name,
      eligCalculations.eligibleAmount,
      Number(eligRate) || 0,
      Number(eligTenure) || 0,
      detailsStr
    );
  };

  // Calculations for Tab 2: Eligibility
  const eligCalculations = useMemo(() => {
    const incomeVal = Number(eligIncome) || 0;
    const emiVal = Number(eligEmi) || 0;
    const rateVal = Number(eligRate) || 0;
    const tenureVal = Number(eligTenure) || 0;

    // Dynamic acceptable FOIR based on gross monthly income
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
  }, [lenders, eligIncome, eligEmi, eligTenure, eligCibil, eligDegree, eligExperience, eligLoanType, formatCurrency]);

  const sortedOffers = useMemo(() => {
    if (matchedOffers.length === 0) return [];
    const approved = matchedOffers.filter(o => o.likelihood !== "ineligible");
    const ineligible = matchedOffers.filter(o => o.likelihood === "ineligible");
    const sortMap = { high: 0, medium: 1, low: 2, ineligible: 3 };
    approved.sort((a, b) => sortMap[a.likelihood] - sortMap[b.likelihood]);
    return [...approved.slice(0, 4), ...ineligible.slice(0, 2)];
  }, [matchedOffers]);

  const selectedOffers = useMemo(() => {
    return sortedOffers.filter(o => selectedLenderIds.includes(o.lender.id));
  }, [sortedOffers, selectedLenderIds]);

  if (cibilLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-[12px]">
          <div className="h-[48px] w-[48px] animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-[14px] font-medium text-gray-500">Checking stored credit profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gray-50 lg:rounded-[20px] lg:border lg:border-gray-200">
      
      {/* Header */}
      <header className="flex flex-col gap-[14px] border-b border-gray-100 bg-white px-[20px] py-[16px] shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={onToggleSidebar}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-gray-50 hover:bg-gray-100 lg:hidden cursor-pointer"
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
          <div className="w-[36px] h-[36px] rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-[20px] h-[20px]" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight">FinHeal Eligibility & CIBIL Center</h1>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]">Verify credit rating and evaluate lender approval eligibility</p>
          </div>
        </div>
        
        {/* Currency & Database Indicators */}
        <div className="flex flex-wrap items-center gap-[12px] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.5px]">Currency:</span>
            <div className="relative">
              <select
                value={currency.code}
                onChange={(e) => setCurrency(CURRENCIES.find((c) => c.code === e.target.value) || CURRENCIES[0])}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[12px] font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        
        {/* CIBIL / Eligibility Tab Switcher */}
        <div className="flex gap-2 border-b border-gray-150 pb-3 mb-5">
          <button
            type="button"
            onClick={() => setCibilSubTab("eligibility")}
            className={`px-4 py-2 rounded-[12px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
              cibilSubTab === "eligibility"
                ? "bg-primary text-white shadow-md"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Eligibility Checker</span>
          </button>
          <button
            type="button"
            onClick={() => setCibilSubTab("cibil")}
            className={`px-4 py-2 rounded-[12px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
              cibilSubTab === "cibil"
                ? "bg-primary text-white shadow-md"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>CIBIL Score Checker</span>
          </button>
        </div>

        {/* ----------------- ELIGIBILITY CHECKER SUBTAB ----------------- */}
        {cibilSubTab === "eligibility" && (
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
                      const maxVal = Math.round(5000000 * currencyScale);
                      setEligIncome(String(Math.max(minVal, Math.min(maxVal, val))));
                    }}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                      const maxVal = Number(eligIncome) || 0;
                      setEligEmi(String(Math.max(0, Math.min(maxVal, val))));
                    }}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
              <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-wrap items-center justify-between gap-3 mt-2">
                <div className="flex flex-col min-w-[140px]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400">
                    Max Eligible Loan Amount
                  </span>
                  <span className="text-[24px] font-bold text-primary mt-1">
                    {formatCurrency(eligCalculations.eligibleAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAskAssistant}
                    className="px-3 py-2 bg-primary text-white text-[12px] font-bold rounded-[10px] hover:opacity-90 transition-all cursor-pointer shadow-[0_2px_8px_rgba(50,68,230,0.15)] hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    Ask Assistant
                  </button>
                  {onTalkToAdvisor && (
                    <button
                      type="button"
                      onClick={onTalkToAdvisor}
                      className="px-3 py-2 bg-emerald-600 text-white text-[12px] font-bold rounded-[10px] hover:bg-emerald-500 transition-all cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 whitespace-nowrap"
                    >
                      Talk to Advisor
                    </button>
                  )}
                </div>
              </div>

              {/* Stack safety gauge on left if suggested offers are displayed */}
              {sortedOffers.length > 0 && (
                <div className="border border-gray-200 rounded-[14px] p-4 bg-white shadow-sm flex flex-col items-center justify-center gap-4 mt-2">
                  <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Affordability Safety Gauge</span>
                  <div className="relative w-[180px] h-[100px] flex items-center justify-center overflow-hidden">
                    <svg width="180" height="180" className="absolute top-0">
                      <defs>
                        <linearGradient id="safety-gauge-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      {/* Gradient Speedometer Gauge Arc */}
                      <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke="url(#safety-gauge-gradient-1)"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute bottom-3 flex flex-col items-center justify-center">
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
                          isSelected={selectedLenderIds.includes(lender.id)}
                          onToggleSelect={() => handleToggleSelectLender(lender.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="lg:col-span-5 flex flex-col items-center gap-4">
                <span className="text-[12.5px] font-bold text-gray-700 uppercase tracking-wide">Affordability Safety Gauge</span>

                {/* Half Speedometer Gauge */}
                <div className="relative w-[180px] h-[100px] flex items-center justify-center overflow-hidden">
                  <svg width="180" height="180" className="absolute top-0">
                    <defs>
                      <linearGradient id="safety-gauge-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    {/* Gradient Speedometer Gauge Arc */}
                    <path
                      d="M 20 90 A 70 70 0 0 1 160 90"
                      fill="none"
                      stroke="url(#safety-gauge-gradient-2)"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Numeric reading overlay */}
                  <div className="absolute bottom-3 flex flex-col items-center justify-center">
                    <span className="text-[20px] font-bold text-gray-800">{eligCalculations.baseFoir}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Debt-to-Income</span>
                  </div>
                </div>

                {/* Safety Evaluation Card */}
                <div className={`w-full max-w-[290px] border p-4 rounded-[14px] flex flex-col gap-2 ${
                  eligCalculations.riskLevel === "low"
                    ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                    : eligCalculations.riskLevel === "medium"
                    ? "bg-amber-50 border-amber-250 text-amber-800"
                    : "bg-rose-50 border-rose-250 text-rose-800"
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
                      <span>{eligCalculations.maxFoirPct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- CIBIL SCORE CHECKER SUBTAB ----------------- */}
        {cibilSubTab === "cibil" && (
          <div className="animate-fade-up">
            {cibilError ? (
              <div className="mx-auto max-w-[480px] my-8">
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 shadow-sm flex flex-col items-center text-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
                  <h3 className="text-[15px] font-bold text-gray-800">Bureau Record Retrieval Failed</h3>
                  <div className="my-3 text-[12px] text-gray-600 leading-relaxed max-w-[380px]">
                    <p className="font-semibold text-rose-600">{cibilError}</p>
                    <ul className="list-disc text-left pl-5 mt-2 space-y-1 text-gray-500">
                      <li>The PAN card number might be invalid or typed incorrectly</li>
                      <li>The mobile number is not linked to your credit bureau file</li>
                      <li>There is a name mismatch between PAN records and your input</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => { setCibilError(null); setCibilReport(null); }}
                    className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-[10px] text-[12.5px] transition-all cursor-pointer shadow-sm"
                  >
                    Try Again with Different Details
                  </button>
                </div>
              </div>
            ) : !cibilReport ? (
              // CIBIL Retrieval Form
              <div className="mx-auto max-w-[500px] my-6 animate-fade-up">
                <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  
                  {storedCibilReport && isReportFresh(storedCibilReport.fetched_at) && !isExemptRole(userEmail, storedCibilReport.name) ? (
                    <div className="text-center py-4">
                      <div className="mx-auto w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-3">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h2 className="text-[16px] font-bold text-gray-900">
                        Credit Report Fetch Locked
                      </h2>
                      <div className="my-4 p-4 rounded-[14px] bg-amber-50 border border-amber-200 text-amber-900 text-left">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[12px] leading-normal text-amber-700 font-medium">
                              You have fetched your credit report recently (on {new Date(storedCibilReport.fetched_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}).
                              To manage bureau API limits and cost, you can only fetch a fresh report once every 30 days.
                              You will be able to retrieve a fresh refresh on <strong>{getNextAvailableFetchDate(storedCibilReport.fetched_at)}</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCibilReport(storedCibilReport)}
                        className="w-full bg-primary text-white font-bold py-2.5 rounded-[10px] hover:opacity-95 transition-all cursor-pointer shadow-md shadow-primary/10"
                      >
                        View Stored Report
                      </button>
                    </div>
                  ) : (
                    <>
                      
                      <div className="text-center mb-6">
                        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2.5">
                          <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-[16px] font-bold text-gray-900">
                          {cibilReportType === "company"
                            ? `Check Company ${cibilBureau === "experian" ? "Experian" : "CIBIL"} Score`
                            : `Check Your Official ${cibilBureau === "experian" ? "Experian" : "CIBIL"} Score`
                          }
                        </h2>
                        <p className="text-[12px] text-gray-400 mt-1">
                          {cibilReportType === "company"
                            ? "Retrieve commercial credit rank and bureau report securely."
                            : "Retrieve your credit score and bureau report securely."
                          }
                        </p>
                      </div>

                      {/* Report Type Selector */}
                      <div className="flex bg-gray-100 rounded-[12px] p-1 mb-5">
                        <button
                          type="button"
                          onClick={() => {
                            setCibilReportType("individual");
                            setCibilName("");
                            setCibilPhone("");
                            setCibilPan("");
                          }}
                          className={`flex-1 py-1.5 text-[12px] font-bold rounded-[9px] transition-all cursor-pointer ${
                            cibilReportType === "individual"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Individual CIBIL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCibilReportType("company");
                            setCibilName("");
                            setCibilPhone("");
                            setCibilPan("");
                          }}
                          className={`flex-1 py-1.5 text-[12px] font-bold rounded-[9px] transition-all cursor-pointer ${
                            cibilReportType === "company"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Company CIBIL
                        </button>
                      </div>
                    </>
                  )}

                  <TooltipProvider delayDuration={0}>
                    <form onSubmit={handleFetchCibilReport} className="space-y-4">
                      {/* Experian: separate First + Last Name fields */}
                      {cibilBureau === "experian" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col">
                            <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">First Name</label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="text"
                                    required
                                    value={cibilFirstName}
                                    onChange={(e) => setCibilFirstName(e.target.value)}
                                    placeholder="e.g. Rahul"
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  sideOffset={10}
                                  className="rounded-[12px] border border-gray-200 bg-white px-[10px] py-[6px] text-[11px] font-medium text-gray-700 shadow-[0_12px_30px_rgba(17,24,39,0.12)] animate-in fade-in-0 zoom-in-95"
                                >
                                  Please fill out this field
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">Last Name</label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="text"
                                    required
                                    value={cibilLastName}
                                    onChange={(e) => setCibilLastName(e.target.value)}
                                    placeholder="e.g. Sharma"
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  sideOffset={10}
                                  className="rounded-[12px] border border-gray-200 bg-white px-[10px] py-[6px] text-[11px] font-medium text-gray-700 shadow-[0_12px_30px_rgba(17,24,39,0.12)] animate-in fade-in-0 zoom-in-95"
                                >
                                  Please fill out this field
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">
                            {cibilReportType === "company" ? "Company Name (as on PAN)" : "Full Name (as on PAN)"}
                          </label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <input
                                  type="text"
                                  required
                                  value={cibilName}
                                  onChange={(e) => setCibilName(e.target.value)}
                                  placeholder={cibilReportType === "company" ? "e.g. Acme Corporation Pvt Ltd" : "e.g. Rahul Sharma"}
                                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={10}
                                className="rounded-[12px] border border-gray-200 bg-white px-[10px] py-[6px] text-[11px] font-medium text-gray-700 shadow-[0_12px_30px_rgba(17,24,39,0.12)] animate-in fade-in-0 zoom-in-95"
                              >
                                Please fill out this field
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )}

                      <div className={cibilBureau === "experian" ? "flex flex-col" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                        <div className="flex flex-col">
                          <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">
                            {cibilReportType === "company" ? "Authorized Mobile Number" : "Mobile Number"}
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <input
                                  type="tel"
                                  required
                                  value={cibilPhone}
                                  onChange={handlePhoneChange}
                                  placeholder="e.g. 98765XXXXX"
                                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={10}
                                className="rounded-[12px] border border-gray-200 bg-white px-[10px] py-[6px] text-[11px] font-medium text-gray-700 shadow-[0_12px_30px_rgba(17,24,39,0.12)] animate-in fade-in-0 zoom-in-95"
                              >
                                Please fill out this field
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        {cibilBureau !== "experian" && (
                          <div className="flex flex-col">
                            <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">
                              {cibilReportType === "company" ? "Company PAN Card Number" : "PAN Card Number"}
                            </label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="text"
                                    required
                                    value={cibilPan}
                                    onChange={handlePanChange}
                                    placeholder="e.g. AAAAA1111B"
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  sideOffset={10}
                                  className="rounded-[12px] border border-gray-200 bg-white px-[10px] py-[6px] text-[11px] font-medium text-gray-700 shadow-[0_12px_30px_rgba(17,24,39,0.12)] animate-in fade-in-0 zoom-in-95"
                                >
                                  Please fill out this field
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        )}
                      </div>

                    <div className="flex flex-col mb-4">
                      <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">Select Credit Bureau</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCibilBureau("cibil")}
                          className={`flex-1 py-2 rounded-[10px] text-[13px] font-bold border transition-all cursor-pointer ${
                            cibilBureau === "cibil"
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          CIBIL
                        </button>
                        <button
                          type="button"
                          onClick={() => setCibilBureau("experian")}
                          className={`flex-1 py-2 rounded-[10px] text-[13px] font-bold border transition-all cursor-pointer ${
                            cibilBureau === "experian"
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Experian
                        </button>
                      </div>
                    </div>

                    {cibilFetching ? (
                      <div className="flex flex-col items-center justify-center py-4 gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-[11px] font-bold text-gray-500">Retrieving {cibilBureau === "cibil" ? "CIBIL" : "Experian"} report...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2.5 my-3 text-left">
                          <input
                            type="checkbox"
                            id="cibil-privacy-policy-elig"
                            checked={cibilAgreed}
                            onChange={(e) => setCibilAgreed(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                          />
                          <label htmlFor="cibil-privacy-policy-elig" className="text-[11.5px] text-gray-500 leading-normal cursor-pointer select-none">
                            By logging in, you agree to the following{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("credit-consent");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary font-bold hover:underline bg-transparent border-none p-0 cursor-pointer inline font-sans text-[11px]"
                            >
                              Credit Consent
                            </button>
                            ,{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("terms-of-use");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary font-bold hover:underline bg-transparent border-none p-0 cursor-pointer inline font-sans text-[11px]"
                            >
                              Terms of Use
                            </button>
                            ,{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("privacy-policy");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary font-bold hover:underline bg-transparent border-none p-0 cursor-pointer inline font-sans text-[11px]"
                            >
                              Privacy Policy
                            </button>
                            ,{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("dpdp-notice");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary font-bold hover:underline bg-transparent border-none p-0 cursor-pointer inline font-sans text-[11px]"
                            >
                              DPDP Notice
                            </button>
                            {" "}and{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("data-retention");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary font-bold hover:underline bg-transparent border-none p-0 cursor-pointer inline font-sans text-[11px]"
                            >
                              Data Retention Policy
                            </button>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={!cibilAgreed}
                          className={`w-full bg-primary text-white font-bold py-2.5 rounded-[10px] transition-all text-[13px] flex items-center justify-center gap-2 shadow-md ${
                            cibilAgreed ? "hover:opacity-95 cursor-pointer" : "opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>
                            {cibilReportType === "company"
                              ? `Download Company ${cibilBureau === "cibil" ? "CIBIL" : "Experian"} Credit Report`
                              : `Download ${cibilBureau === "cibil" ? "CIBIL" : "Experian"} Credit Report`
                            }
                          </span>
                        </button>
                      </>
                    )}

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 mt-2 text-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Secure connection. Your credit history is safe with us.</span>
                    </div>
                  </form>
                </TooltipProvider>
                </div>
              </div>
            ) : (
              // CIBIL Score Dashboard
              <div className="space-y-6">
                
                {/* Score Summary Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gauge representation */}
                  <div className="lg:col-span-1 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="flex justify-between items-center w-full mb-3 shrink-0">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{cibilBureau.toUpperCase()} Bureau</h3>
                      {(() => {
                        const fresh = isReportFresh(cibilReport?.fetched_at);
                        const exempt = isExemptRole(userEmail, cibilReport?.name);
                        
                        if (fresh && !exempt) {
                          const nextDate = getNextAvailableFetchDate(cibilReport?.fetched_at);
                          return (
                            <span className="text-[9.5px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-[5px] font-semibold" title={`Next update available on ${nextDate}`}>
                              Next update: {nextDate}
                            </span>
                          );
                        } else {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setCibilReport(null);
                                setCibilError(null);
                              }}
                              className="text-[10px] text-primary hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                            >
                              Refresh Report {exempt && "(Admin)"}
                            </button>
                          );
                        }
                      })()}
                    </div>
                    
                    <div className="relative w-[180px] h-[180px] flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="90"
                          cy="90"
                          r={scoreGauge.radius}
                          stroke="#f3f4f6"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="90"
                          cy="90"
                          r={scoreGauge.radius}
                          stroke={scoreTheme.fill}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={scoreGauge.dashArray}
                          strokeDashoffset={scoreGauge.dashOffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[32px] font-black text-gray-800 leading-none">{cibilReport.score}</span>
                        <span className={`text-[11.5px] font-bold mt-1.5 px-3 py-0.5 rounded-[12px] border ${scoreTheme.bg} ${scoreTheme.color} ${scoreTheme.border}`}>
                          {cibilReport.band}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-3 font-semibold">PAN: {cibilReport.pan}</p>
                    {cibilReport.pdf_url && (
                      <a
                        href={cibilReport.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-[10px] text-[11.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>Download PDF Report</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateCAM}
                      disabled={isGeneratingCAM}
                      className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-[10px] text-[11.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>{isGeneratingCAM ? "Generating CAM..." : "Generate CAM Report 📊"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCibilReport(null)}
                      className="mt-3.5 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Check Different PAN
                    </button>
                  </div>

                  {/* Impact factors cards */}
                  <div className="lg:col-span-2 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Credit Score Impact Factors</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <FactorCard
                        label="Payment History"
                        value={`${cibilReport.metrics.payment_on_time_pct}%`}
                        subtext="On-time payments"
                        status={cibilReport.metrics.payment_on_time_pct >= 95 ? "Excellent" : cibilReport.metrics.payment_on_time_pct >= 90 ? "Good" : "Poor"}
                      />
                      <FactorCard
                        label="Credit Util"
                        value={`${cibilReport.metrics.credit_utilization_pct}%`}
                        subtext="Of limits utilized"
                        status={cibilReport.metrics.credit_utilization_pct <= 30 ? "Excellent" : cibilReport.metrics.credit_utilization_pct <= 50 ? "Good" : "Poor"}
                      />
                      <FactorCard
                        label="Credit Age"
                        value={`${cibilReport.metrics.credit_history_age_years} yrs`}
                        subtext="History duration"
                        status={cibilReport.metrics.credit_history_age_years >= 5 ? "Excellent" : cibilReport.metrics.credit_history_age_years >= 3 ? "Good" : "Poor"}
                      />
                      <FactorCard
                        label="Recent Queries"
                        value={String(cibilReport.metrics.enquiries_l6m)}
                        subtext="Enquiries (6M)"
                        status={cibilReport.metrics.enquiries_l6m <= 1 ? "Excellent" : cibilReport.metrics.enquiries_l6m <= 3 ? "Good" : "Poor"}
                      />
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-[12px] p-3 flex items-start gap-2 text-[11px] text-gray-500 border border-gray-100">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>To optimize your score, keep utilization below 30%, avoid late payments, and do not make too many new loan queries in a short timeframe.</span>
                    </div>
                  </div>
                </div>

                {/* Accounts and AI Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                   <div className="lg:col-span-2 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[13px] font-extrabold text-gray-800 uppercase tracking-wider">
                          Bureau Accounts Summary (Open Accounts: {totalOpenAccounts})
                        </h3>
                        <span className="text-[11px] font-semibold text-gray-400">Categorized by Loan Type</span>
                      </div>
                      
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead>
                            <tr className="border-b border-gray-150 bg-gray-55/50">
                              <th className="py-2.5 px-3 font-bold text-gray-400 uppercase tracking-wide text-[10px] w-2/5">
                                Account Category
                              </th>
                              <th className="py-2.5 px-2 text-center font-bold text-gray-400 uppercase tracking-wide text-[10px] w-1/5">
                                Open Account
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold text-gray-400 uppercase tracking-wide text-[10px] w-2/5">
                                Outstanding Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                            {Object.entries(accountsSummary).map(([key, cat]) => {
                              const isSelected = selectedCategory === key;
                              return (
                                <tr
                                  key={key}
                                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                                  className={`cursor-pointer transition-all ${
                                    isSelected 
                                      ? "bg-primary/5 border-l-4 border-primary font-bold text-primary" 
                                      : "hover:bg-gray-50/50"
                                  }`}
                                >
                                  <td className="py-3 px-3 flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.open > 0 ? "bg-emerald-500" : "bg-gray-300"}`} />
                                    <span>{cat.label}</span>
                                  </td>
                                  <td className="py-3 px-2 text-center text-[13px] font-extrabold text-gray-808">
                                    {cat.open}
                                  </td>
                                  <td className="py-3 px-3 text-right text-[13px] font-black text-gray-808">
                                    {formatCurrency(cat.balance)}
                                  </td>
                                </tr>
                              );
                            })}
                            
                            {/* Total Row */}
                            <tr className="bg-gray-55/30 font-extrabold border-t border-gray-200">
                              <td className="py-3 px-3 text-gray-850">Total Open Accounts</td>
                              <td className="py-3 px-2 text-center text-[13.5px] font-black text-primary">
                                {totalOpenAccounts}
                              </td>
                              <td className="py-3 px-3 text-right text-[13.5px] font-black text-primary">
                                {formatCurrency(totalOpenBalance)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Active/Open Accounts detailed list */}
                      <div className="border-t border-gray-100 pt-4 mt-2">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-[12.5px] font-bold text-gray-800 uppercase tracking-wide">
                            {selectedCategory && accountsSummary[selectedCategory as keyof typeof accountsSummary]
                              ? `${accountsSummary[selectedCategory as keyof typeof accountsSummary].label} - Open Accounts (${accountsSummary[selectedCategory as keyof typeof accountsSummary].open})`
                              : `All Open Accounts (${totalOpenAccounts})`}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {selectedCategory ? "Filtered (Click row again to clear)" : "Click a category row above to filter"}
                          </span>
                        </div>

                        {filteredOpenAccounts.length === 0 ? (
                          <div className="py-6 text-center text-gray-400 bg-gray-55/30 rounded-[12px] border border-gray-150 border-dashed text-[12px] font-medium">
                            No open accounts found in this category.
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-150 max-h-[300px] overflow-y-auto pr-1 animate-fade-up">
                            {filteredOpenAccounts.map((acc: any, index: number) => (
                              <div key={index} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-[12.5px] font-bold text-gray-808">{acc.lender}</h4>
                                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-700">
                                      Open
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-1">{acc.type} | Opened: {new Date(acc.open_date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-[12.5px] font-extrabold text-gray-808">₹{acc.outstanding_balance.toLocaleString()}</div>
                                  <div className="flex items-center gap-1 justify-end mt-1 text-[11px] font-semibold">
                                    <span className={`w-1.5 h-1.5 rounded-full ${acc.payment_status.includes("Past Due") ? "bg-rose-500" : "bg-emerald-500"}`} />
                                    <span className={acc.payment_status.includes("Past Due") ? "text-rose-600" : "text-gray-500"}>
                                      {acc.payment_status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="lg:col-span-1 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3.5">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-[12.5px] font-bold text-gray-800">AI Recommendations</h3>
                      </div>
                      <div className="space-y-2.5">
                        {cibilReport.tips.map((tip: string, idx: number) => (
                          <div key={idx} className="flex gap-2 text-[11.5px] text-gray-600 bg-gray-55/40 rounded-[10px] p-2.5 border border-gray-100">
                            <span className="font-bold text-primary">{idx + 1}.</span>
                            <p className="leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {onTalkToAdvisor && (
                      <button
                        type="button"
                        onClick={onTalkToAdvisor}
                        className="mt-4 w-full bg-primary/5 hover:bg-primary/10 text-primary font-bold py-2 rounded-[10px] text-[11.5px] transition-all border border-primary/15 cursor-pointer"
                      >
                        Speak to Credit Advisor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Comparison Bar */}
      {selectedLenderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[600px] animate-fade-up">
          <div className="bg-white rounded-[20px] border border-gray-250 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-gray-800 truncate">
                  Compare Lenders ({selectedLenderIds.length} of 3 selected)
                </span>
                <div className="flex gap-1.5 mt-1.5 flex-wrap overflow-hidden max-h-[28px]">
                  {selectedOffers.map((offer) => (
                    <span
                      key={offer.lender.id}
                      className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-[6px] text-[10.5px] font-bold truncate max-w-[120px]"
                    >
                      {offer.lender.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLenderIds([])}
                className="text-[12px] font-bold text-gray-500 hover:text-gray-800 cursor-pointer px-2 py-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(true)}
                className="px-4 py-2 bg-primary text-white text-[12.5px] font-bold rounded-[10px] hover:opacity-95 cursor-pointer shadow-md shadow-primary/20"
              >
                Compare Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Lenders Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[6px] animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[850px] w-full p-6 shadow-2xl animate-scale-up border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-gray-800">
                    Side-by-Side Lender Comparison
                  </h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Review specifications, rates, and criteria side-by-side to find your best fit.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1.5 hover:bg-gray-150 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150">
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 w-1/4 min-w-[150px]">
                      Parameter
                    </th>
                    {selectedOffers.map((offer) => {
                      const badgeConfig = {
                        high: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "High Match" },
                        medium: { bg: "bg-amber-50 text-amber-700 border-amber-250", label: "Medium Match" },
                        low: { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Low Match" },
                        ineligible: { bg: "bg-gray-100 text-gray-600 border-gray-200", label: "Not Approved" }
                      }[offer.likelihood];

                      return (
                        <th key={offer.lender.id} className="py-4 px-4 w-1/3 min-w-[200px] align-top">
                          <div className="border border-gray-200 bg-gray-50/50 p-4 rounded-[16px] flex flex-col gap-1.5 shadow-sm">
                            <div className="flex items-center gap-2">
                              <LenderLogo name={offer.lender.name} className="w-8 h-8" />
                              <span className="text-[14px] font-extrabold text-gray-800">{offer.lender.name}</span>
                            </div>
                            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">
                              {offer.lender.lenderType}
                            </span>
                            <span className={`self-start px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${badgeConfig.bg}`}>
                              {badgeConfig.label}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-[13px] font-medium text-gray-700">
                  {/* Product Category Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Product Category</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4 font-bold text-gray-800">
                        {offer.lender.productType}
                      </td>
                    ))}
                  </tr>

                  {/* Eligible Limit Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Eligible Limit</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4 font-bold text-emerald-600 text-[15px]">
                        {formatCurrency(offer.eligibleLimit)}
                      </td>
                    ))}
                  </tr>

                  {/* Interest Rate Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Interest Rate (ROI)</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4 font-bold text-gray-800">
                        {offer.lender.minRate === offer.lender.maxRate
                          ? `${offer.lender.minRate}%`
                          : `${offer.lender.minRate}% – ${offer.lender.maxRate}%`}
                      </td>
                    ))}
                  </tr>

                  {/* Est. Monthly EMI Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Est. Monthly EMI</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4 font-bold text-gray-800">
                        {formatCurrency(offer.emi)}/mo
                      </td>
                    ))}
                  </tr>

                  {/* Processing Fee Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Processing Fee</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4 text-gray-600 font-bold">
                        {offer.lender.processingFee || "As per offer at login"}
                      </td>
                    ))}
                  </tr>

                  {/* Disbursal Time Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Disbursal Time (TAT)</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4 text-gray-600 font-bold">
                        ⏱️ {offer.lender.disbursalTime}
                      </td>
                    ))}
                  </tr>

                  {/* Key Benefits (Pros) Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Key Benefits (Pros)</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4">
                        <ul className="space-y-1.5">
                          {offer.lender.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-emerald-700 text-[11.5px] font-bold">
                              <span className="text-[12px] shrink-0 mt-[1px]">•</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Shortfalls (Cons) Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Shortfalls (Cons)</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4">
                        <ul className="space-y-1.5">
                          {offer.lender.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-amber-700 text-[11.5px] font-bold">
                              <span className="text-[12px] shrink-0 mt-[1px]">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Required Documents Row */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-400">Required Documents</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {offer.lender.docsRequired.map((doc, i) => (
                            <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-150 text-gray-600 rounded-[8px] text-[10.5px] font-semibold">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Action Row */}
                  <tr className="border-t border-gray-150">
                    <td className="py-4 px-4 font-bold text-gray-400">Apply</td>
                    {selectedOffers.map((offer) => (
                      <td key={offer.lender.id} className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCompareModalOpen(false);
                            onApplyNow(
                              `${offer.lender.name} ${offer.lender.productType}`,
                              offer.eligibleLimit,
                              offer.lender.minRate,
                              Number(eligTenure) || 5
                            );
                          }}
                          className="w-full bg-primary text-white font-bold py-2.5 rounded-[10px] text-[12.5px] transition-all cursor-pointer text-center hover:opacity-95 shadow-md shadow-primary/10"
                        >
                          Apply Now
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Terms & Conditions Modal */}
      <PolicyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        defaultTab={activeTermsTab}
        showAcceptCheckbox={!cibilReport}
        agreed={cibilAgreed}
        onAgreeChange={setCibilAgreed}
      />
    </div>
  );
}

interface FactorCardProps {
  label: string;
  value: string;
  subtext: string;
  status: "Excellent" | "Good" | "Poor";
}

function FactorCard({ label, value, subtext, status }: FactorCardProps) {
  return (
    <div className="rounded-[16px] border border-gray-100 bg-gray-50/50 p-[14px] flex flex-col justify-between text-left transition-all hover:-translate-y-[0.5px] hover:shadow-sm">
      <div>
        <span className="text-[11px] font-semibold text-gray-400 block tracking-[0.5px] uppercase">{label}</span>
        <div className="text-[20px] font-extrabold text-gray-800 mt-[4px]">{value}</div>
      </div>
      <div className="mt-[8px]">
        <p className="text-[10px] text-gray-400 leading-none mb-1.5">{subtext}</p>
        <span className={`text-[10px] font-bold inline-block px-[8px] py-[2px] rounded-[10px] ${
          status === "Excellent" ? "bg-emerald-50 text-emerald-700" :
          status === "Good" ? "bg-blue-50 text-blue-700" :
          "bg-rose-50 text-rose-700"
        }`}>
          {status}
        </span>
      </div>
    </div>
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
  eligTenure,
  isSelected = false,
  onToggleSelect
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
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
    const rateStr = lender.minRate === lender.maxRate ? `${lender.minRate}%` : `${lender.minRate}% – ${lender.maxRate}%`;
    let details = `Applied for ${lender.name} ${lender.productType} via matching suggestions. ` +
      `Eligible Limit: ${formatCurrency(eligibleLimit)}, ROI: ${rateStr}, Tenure: ${eligTenure} years. ` +
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
        <div className="flex items-start gap-2.5">
          {!isNotApproved && onToggleSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className={`flex items-center justify-center h-[18px] w-[18px] rounded-[5px] border transition-all shrink-0 cursor-pointer mt-2 ${
                isSelected 
                  ? "bg-primary border-primary text-white shadow-sm shadow-primary/25" 
                  : "border-gray-300 hover:border-primary/50 bg-white"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
            </button>
          )}
          <LenderLogo name={lender.name} className="w-8 h-8 mt-0.5" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-bold text-gray-900">{lender.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border uppercase tracking-wider ${badgeConfig.bg}`}>
                {badgeConfig.label}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-gray-400 mt-0.5">{lender.productType}</span>
          </div>
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
          <span className="text-[13px] font-bold text-gray-900 mt-0.5">
            {lender.minRate === lender.maxRate ? `${lender.minRate}%` : `${lender.minRate}% – ${lender.maxRate}%`}
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
