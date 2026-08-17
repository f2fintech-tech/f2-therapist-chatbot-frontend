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
  Percent,
  Calendar,
  Clock,
  RefreshCw,
  CalendarCheck,
  PieChart,
  Hourglass,
  Search
} from "lucide-react";
import { fetchCibilReport, getStoredCibilReport, CibilReport, getBureauPdfDownloadUrl, downloadBureauPdf } from "../services/cibil";
import { getStoredAuthSession } from "../utils/authSession";
import { useToast } from "@/hooks/use-toast";
import PolicyModal from "./PolicyModal";
import { isExemptRole, isReportFresh, getNextAvailableFetchDate, inlineCrossOriginStylesheets } from "../utils/cibilUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchAdvisorProfile, fetchAdvisors } from "@/lib/backendAuth";
import { BsaProgressModal, LogEntry } from "./BsaProgressModal";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import FactorCard from "./cibil/FactorCard";
import LenderOfferCard from "./cibil/LenderOfferCard";
import { LenderLogo } from "./cibil/LenderLogo";
import type { LenderProduct } from "./LoanCalculatorView";
import LendersTab from "./admin/LendersTab";


const formatDateRange = (rangeStr: string) => {
  if (!rangeStr || rangeStr === 'N/A') return 'N/A';
  const parts = rangeStr.split(' to ');
  if (parts.length === 2) {
    const formatPart = (p: string) => {
      const match = p.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (match) {
        const [_, day, month, year] = match;
        const date = new Date(`${year}-${month}-${day}`);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return p;
    };
    return `${formatPart(parts[0])} to ${formatPart(parts[1])}`;
  }
  return rangeStr;
};

// LenderLogo and LenderProduct are defined in ./cibil/LenderLogo and ./cibil/types
// and re-exported here for backward compatibility with other consumers.
export type { LenderProduct } from "./cibil/types";
export { LenderLogo } from "./cibil/LenderLogo";



interface EligibilityCibilViewProps {
  userId: string;
  userEmail?: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onApplyNow: (loanType: string, amount: number, rate: number, tenure: number, details?: string) => void;
  onTalkToAdvisor?: () => void;
  onOpenAdmin?: (tab?: string) => void;
  isGuest?: boolean;
  onLoginRequired?: () => void;
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



// Shared helper functions are imported from '../utils/cibilUtils'

export default function EligibilityCibilView({
  userId,
  userEmail,
  onToggleSidebar,
  onToggleInsights,
  onApplyNow,
  onTalkToAdvisor,
  onOpenAdmin,
  isGuest = false,
  onLoginRequired,
}: EligibilityCibilViewProps) {
  const [cibilSubTab, setCibilSubTab] = useState<"eligibility" | "cibil" | "bsa" | "lenders">("eligibility");

  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(val);
  };
  const { toast } = useToast();

  const isUserAdvisor = (email?: string) => {
    if (email && ["admin@finheal.com", "admin@f2finheal.com"].includes(email.toLowerCase())) return false;
    try {
      const storedSession = localStorage.getItem("finheal-auth-session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed?.isAdvisor) return true;
      }
    } catch (e) {}

    if (!email) return false;
    const defaultEmails = ["sneha@finheal.com", "aradhya@finheal.com", "vikram@finheal.com", "rohan@finheal.com", "priya@finheal.com"];
    if (defaultEmails.includes(email.toLowerCase())) return true;

    const stored = localStorage.getItem("finheal_advisors_list");
    if (stored) {
      try {
        const list = JSON.parse(stored);
        return list.some((a: any) => 
          a.f2FintechId && (
            email.toLowerCase() === a.f2FintechId.toLowerCase() || 
            email.split("@")[0].toLowerCase() === a.f2FintechId.toLowerCase()
          ) && a.isAdvisor === true
        );
      } catch (e) {}
    }
    return false;
  };

  const isStaff = useMemo(() => {
    const isEmployeeId = userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    return isUserAdvisor(userEmail) || (userEmail && ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase())) || isEmployeeId;
  }, [userId, userEmail]);

  const isSuperAdmin = useMemo(() => {
    return userEmail ? ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase()) : false;
  }, [userEmail]);

  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const isSuperAdmin = userEmail && ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase());

    const loadPermissions = async () => {
      if (isSuperAdmin) {
        setUserPermissions(["cibil_fetch", "cibil_view", "cibil_view_all", "scheduled_calls", "lenders_edit"]);
        return;
      }

       // If userId looks like an Employee ID (not a UUID), fetch fresh from backend
      const isEmployeeId = userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (isEmployeeId) {
        try {
          // Temporarily use any since the function isn't perfectly mapped in scope without importing
          // We will restore the import as well
          const { fetchAdvisorProfile } = await import('@/lib/backendAuth');
          const data = await fetchAdvisorProfile(userId);
          setUserPermissions(data.permissions || []);
          return;
        } catch (e) {
          // fall through to localStorage
        }
      }

      // Fallback: read from cached session
      try {
        const storedSession = localStorage.getItem("finheal-auth-session");
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          setUserPermissions(parsed?.permissions || []);
        } else {
          setUserPermissions([]);
        }
      } catch (e) {
        setUserPermissions([]);
      }
    };

    void loadPermissions();
    window.addEventListener("finheal:advisors_update", () => void loadPermissions());
    return () => window.removeEventListener("finheal:advisors_update", () => void loadPermissions());
  }, [userId, userEmail]);

  const hasCibilFetchPermission = useMemo(() => {
    if (isSuperAdmin) return true;
    if (!isStaff) return true;
    return userPermissions.includes("cibil_fetch");
  }, [isStaff, isSuperAdmin, userPermissions]);

  const hasCibilViewPermission = useMemo(() => {
    if (isSuperAdmin) return true;
    if (!isStaff) return false;
    return userPermissions.includes("cibil_view") || userPermissions.includes("cibil_view_all");
  }, [isStaff, isSuperAdmin, userPermissions]);

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

  // Admin Attribute States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeeDirectory, setEmployeeDirectory] = useState<any[]>([]);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const employeeDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdvisors(undefined, true).then((list) => {
        const sortedList = [...list].sort((a, b) => {
          const idA = (a.f2FintechId || a.id || "").toLowerCase();
          const idB = (b.f2FintechId || b.id || "").toLowerCase();
          return idA.localeCompare(idB);
        });
        setEmployeeDirectory(sortedList);
      }).catch(err => {
        console.error("Failed to fetch all employees:", err);
        // Fallback to local storage
        try {
          const stored = localStorage.getItem("finheal_advisors_list");
          if (stored) setEmployeeDirectory(JSON.parse(stored));
        } catch (e) {}
      });
    } else {
      try {
        const stored = localStorage.getItem("finheal_advisors_list");
        if (stored) {
          setEmployeeDirectory(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, [isSuperAdmin]);

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

  // BSA States
  const [bsaUploading, setBsaUploading] = useState<boolean>(false);
  const [bsaPassword, setBsaPassword] = useState<string>("");
  const [bsaVerified, setBsaVerified] = useState<boolean>(false);
  const [bsaExcelUrl, setBsaExcelUrl] = useState<string>("");
  const [bsaBankName, setBsaBankName] = useState<string>("");
  const [bsaPeriod, setBsaPeriod] = useState<string>("");
  const [bsaError, setBsaError] = useState<string | null>(null);
  const [selectedBsaFile, setSelectedBsaFile] = useState<File | null>(null);
  const [bsaAnalysisData, setBsaAnalysisData] = useState<any>(null);

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

  // Dynamic Pre-Session Prep Checklist options
  const PREP_OPTIONS = useMemo(() => {
    const selectedEligType = LOAN_TYPES.find((t) => t.id === eligLoanType) || LOAN_TYPES[0];
    const loanName = selectedEligType?.name || "Loan";
    const incomeVal = Number(eligIncome) || 0;
    const emiVal = Number(eligEmi) || 0;
    const cibilVal = Number(eligCibil) || 750;
    const expVal = Number(eligExperience) || 0;
    
    // 1. Debt-to-income (FOIR) Check
    const dti = incomeVal > 0 ? Math.round((emiVal / incomeVal) * 100) : 0;
    const emiOption = dti > 40
      ? {
          id: "emi",
          label: "High Current Debt Burden",
          desc: `My current monthly EMIs consume ${dti}% of my income (${formatCurrency(emiVal)}). How can we reduce my high debt-to-income ratio?`
        }
      : {
          id: "emi",
          label: "Budgeting & EMI Structure",
          desc: `My current EMI is ${formatCurrency(emiVal)} (${dti}% of my income). How can we optimize my future EMIs for a new ${loanName}?`
        };

    // 2. CIBIL Score Check
    const cibilOption = cibilVal < 650
      ? {
          id: "utilization",
          label: "Improving Low CIBIL Score",
          desc: `My CIBIL score is low (${cibilVal}). What specific steps should I take to improve it before applying for a ${loanName}?`
        }
      : {
          id: "utilization",
          label: "Leveraging Good CIBIL Score",
          desc: `My CIBIL score is high (${cibilVal}). Can we use this to negotiate lower interest rates on my ${loanName}?`
        };

    // 3. Experience / Vintage / Income stability Check
    const expOption = (eligLoanType === "professional" || eligLoanType === "business")
      ? {
          id: "savings",
          label: "Practice/Business Vintage",
          desc: `My professional practice vintage is ${expVal} years. How does this vintage affect my eligibility limit for a ${loanName}?`
        }
      : {
          id: "savings",
          label: "Income Stability Assessment",
          desc: `My gross monthly income is ${formatCurrency(incomeVal)}. How can I show stable income verification for a ${loanName}?`
        };

    // 4. Loan Specific Check
    let categoryOption = {
      id: "rates",
      label: "Short-term Debt Strategy",
      desc: `What are the pros and cons of taking a personal loan versus using existing liquid savings?`
    };

    if (eligLoanType === "home") {
      categoryOption = {
        id: "rates",
        label: "Home Loan Down Payment",
        desc: `For a Home Loan with eligible limit ${formatCurrency(eligCalculations.eligibleAmount)}, what down payment budget should I prepare?`
      };
    } else if (eligLoanType === "business" || eligLoanType === "professional") {
      categoryOption = {
        id: "rates",
        label: "Working Capital vs Term Loan",
        desc: `Should I apply for a business term loan or an overdraft facility for my ${eligLoanType === "professional" ? (eligDegree || "practice") : "business"}?`
      };
    } else if (eligLoanType === "education") {
      categoryOption = {
        id: "rates",
        label: "Education Loan Moratorium Options",
        desc: `For an Education Loan, how do co-borrower criteria and the moratorium period impact terms?`
      };
    } else if (eligLoanType === "lap") {
      categoryOption = {
        id: "rates",
        label: "Collateral Valuation",
        desc: `For a Loan Against Property, how does the property valuation and marketability affect interest rates?`
      };
    }

    return [emiOption, cibilOption, expOption, categoryOption];
  }, [eligLoanType, eligIncome, eligEmi, eligCibil, eligExperience, currency, eligCalculations.eligibleAmount, eligDegree]);

  const bsaAnalyzerRef = React.useRef<HTMLDivElement>(null);
  const [isGeneratingBSAPDF, setIsGeneratingBSAPDF] = useState<boolean>(false);

  // Lenders Catalog State
  const [lenders, setLenders] = useState<LenderProduct[]>([]);
  const [isLoadingLenders, setIsLoadingLenders] = useState<boolean>(true);

  // Lenders Catalog Editing States
  const [filterLenderSearch, setFilterLenderSearch] = useState("");
  const [lenderModalOpen, setLenderModalOpen] = useState(false);
  const [editingLender, setEditingLender] = useState<LenderProduct | null>(null);
  const [lenderForm, setLenderForm] = useState({
    id: "",
    name: "",
    productType: "Home Loan",
    lenderType: "PSU",
    category: "HOME",
    minRate: "8.5",
    maxRate: "8.5",
    minTenureYears: "5",
    maxTenureYears: "30",
    minMonthlyIncome: "25000",
    minCibil: "700",
    maxFoirPct: "60",
    minAmount: "100000",
    maxAmount: "10000000",
    disbursalTime: "2-5 days",
    pros: "",
    cons: "",
    docsRequired: "",
    processingFee: "As per offer at login",
    emiPerLakhMin: "",
    annualMaintenanceCharges: "",
    insuranceCharges: "",
    otherCharges: "",
  });
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [lenderToDelete, setLenderToDelete] = useState<LenderProduct | null>(null);
  const [lenderDeleteConfirmOpen, setLenderDeleteConfirmOpen] = useState(false);
  const [isDeletingLender, setIsDeletingLender] = useState(false);

  const hasLendersEditPermission = userPermissions.includes("lenders_edit") && !isSuperAdmin;

  const handleUpdateLenderField = (fields: Partial<typeof lenderForm>) => {
    setLenderForm(prev => ({ ...prev, ...fields }));
  };

  const handleOpenAddLender = () => {
    setEditingLender(null);
    setIsOtherSelected(false);
    setLenderForm({
      id: "",
      name: "",
      productType: "Home Loan",
      lenderType: "PSU",
      category: "HOME",
      minRate: "8.5",
      maxRate: "8.5",
      minTenureYears: "5",
      maxTenureYears: "30",
      minMonthlyIncome: "25000",
      minCibil: "700",
      maxFoirPct: "60",
      minAmount: "100000",
      maxAmount: "10000000",
      disbursalTime: "2-5 days",
      pros: "",
      cons: "",
      docsRequired: "",
      processingFee: "As per offer at login",
      emiPerLakhMin: "",
      annualMaintenanceCharges: "",
      insuranceCharges: "",
      otherCharges: "",
    });
    setLenderModalOpen(true);
  };

  const handleOpenEditLender = (l: LenderProduct) => {
    setEditingLender(l);
    setIsOtherSelected(false);
    setLenderForm({
      id: l.id,
      name: l.name,
      productType: l.productType || "Home Loan",
      lenderType: l.lenderType || "PSU",
      category: l.category || "HOME",
      minRate: String(l.minRate || 8.5),
      maxRate: String(l.maxRate || 8.5),
      minTenureYears: String(l.minTenureYears || 5),
      maxTenureYears: String(l.maxTenureYears || 30),
      minMonthlyIncome: String(l.minMonthlyIncome || 25000),
      minCibil: String(l.minCibil || 700),
      maxFoirPct: String(l.maxFoirPct || 60),
      minAmount: String(l.minAmount || 100000),
      maxAmount: String(l.maxAmount || 10000000),
      disbursalTime: l.disbursalTime || "2-5 days",
      pros: Array.isArray(l.pros) ? l.pros.join(", ") : (l.pros || ""),
      cons: Array.isArray(l.cons) ? l.cons.join(", ") : (l.cons || ""),
      docsRequired: Array.isArray(l.docsRequired) ? l.docsRequired.join(", ") : (l.docsRequired || ""),
      processingFee: l.processingFee || "As per offer at login",
      emiPerLakhMin: l.emiPerLakhMin || "",
      annualMaintenanceCharges: l.annualMaintenanceCharges || "",
      insuranceCharges: l.insuranceCharges || "",
      otherCharges: l.otherCharges || "",
    });
    setLenderModalOpen(true);
  };

  const handleSaveLender = async () => {
    if (!lenderForm.name.trim()) {
      alert("Lender name is required!");
      return;
    }
    if (!lenderForm.id.trim()) {
      alert("Product ID is required!");
      return;
    }

    const item: LenderProduct = {
      id: lenderForm.id.trim(),
      name: lenderForm.name.trim(),
      productType: lenderForm.productType?.trim() || "Home Loan",
      lenderType: lenderForm.lenderType || "PSU",
      category: lenderForm.category || "HOME",
      minRate: Number(lenderForm.minRate) || 8.5,
      maxRate: Number(lenderForm.maxRate) || 8.5,
      minTenureYears: Number(lenderForm.minTenureYears) || 5,
      maxTenureYears: Number(lenderForm.maxTenureYears) || 30,
      minMonthlyIncome: Number(lenderForm.minMonthlyIncome) || 25000,
      minCibil: Number(lenderForm.minCibil) || 700,
      maxFoirPct: Number(lenderForm.maxFoirPct) || 60,
      minAmount: Number(lenderForm.minAmount) || 100000,
      maxAmount: Number(lenderForm.maxAmount) || 10000000,
      disbursalTime: lenderForm.disbursalTime?.trim() || "2-5 days",
      pros: (lenderForm.pros || "").split(",").map(p => p.trim()).filter(Boolean),
      cons: (lenderForm.cons || "").split(",").map(c => c.trim()).filter(Boolean),
      docsRequired: (lenderForm.docsRequired || "").split(",").map(d => d.trim()).filter(Boolean),
      processingFee: lenderForm.processingFee?.trim() || "As per offer at login",
      emiPerLakhMin: lenderForm.emiPerLakhMin?.trim() || "",
      annualMaintenanceCharges: lenderForm.annualMaintenanceCharges?.trim() || "",
      insuranceCharges: lenderForm.insuranceCharges?.trim() || "",
      otherCharges: lenderForm.otherCharges?.trim() || "",
    };

    let updatedList: LenderProduct[];
    if (editingLender) {
      updatedList = lenders.map(l => l.id === editingLender.id ? item : l);
    } else {
      updatedList = [...lenders, item];
    }

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/lenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedList),
      });
      if (res.ok) {
        setLenders(updatedList);
        setLenderModalOpen(false);
        window.dispatchEvent(new CustomEvent("finheal:lenders_update"));
      } else {
        const errData = await res.json();
        alert("Failed to save: " + JSON.stringify(errData));
      }
    } catch (err) {
      console.error("Error saving lender:", err);
      alert("Network error connecting to backend API.");
    }
  };

  const handleDeleteLender = (l: LenderProduct) => {
    setLenderToDelete(l);
    setLenderDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteLender = async () => {
    if (!lenderToDelete) return;
    setIsDeletingLender(true);
    const updatedList = lenders.filter(l => l.id !== lenderToDelete.id);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/lenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedList),
      });
      if (res.ok) {
        setLenders(updatedList);
        window.dispatchEvent(new CustomEvent("finheal:lenders_update"));
        setLenderDeleteConfirmOpen(false);
        setLenderToDelete(null);
      } else {
        alert("Failed to delete lender product.");
      }
    } catch (err) {
      console.error("Error deleting lender:", err);
      alert("Network error connecting to backend API.");
    } finally {
      setIsDeletingLender(false);
    }
  };

  const filteredLenders = useMemo(() => {
    return lenders.filter(l => {
      const q = filterLenderSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        (l.productType || "").toLowerCase().includes(q) ||
        (l.lenderType || "").toLowerCase().includes(q) ||
        (l.category || "").toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    });
  }, [lenders, filterLenderSearch]);

  const renderRupeeHelper = (val: string) => {
    if (!val) return null;
    const cleanVal = val.trim();
    if (/^\d+(\.\d+)?$/.test(cleanVal)) {
      const num = Number(cleanVal);
      if (num > 0) {
        return (
          <span className="text-[10px] text-primary/80 font-bold block mt-[2px] ml-[2px]">
            ₹{num.toLocaleString("en-IN")}
          </span>
        );
      }
    }
    return null;
  };

  // Side-by-Side Comparison State
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Pre-Session Prep Modal States
  const [isPrepModalOpen, setIsPrepModalOpen] = useState<boolean>(false);
  const [selectedAnxieties, setSelectedAnxieties] = useState<string[]>([]);

  const handleTalkToAdvisorClick = () => {
    setSelectedAnxieties([]);
    setIsPrepModalOpen(true);
  };

  const handleConfirmPrep = () => {
    if (selectedAnxieties.length > 0) {
      const selectedOptions = PREP_OPTIONS.filter(o => selectedAnxieties.includes(o.id));
      const agendaArray = selectedOptions.map(o => o.desc);
      localStorage.setItem("finheal_pending_appointment_agenda", JSON.stringify(agendaArray));
    } else {
      localStorage.removeItem("finheal_pending_appointment_agenda");
    }
    setIsPrepModalOpen(false);
    onTalkToAdvisor?.();
  };

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

  const handleDownloadBSAPDF = async () => {
    if (!bsaAnalysisData) return;
    setIsGeneratingBSAPDF(true);
    
    let clone: HTMLElement | null = null;
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      await inlineCrossOriginStylesheets();
      const element = bsaAnalyzerRef.current;
      if (!element) {
        throw new Error("Report element not found in DOM");
      }
      
      clone = element.cloneNode(true) as HTMLElement;
      clone.classList.add("cibil-pdf-downloading");
      
      clone.style.setProperty("position", "absolute", "important");
      clone.style.setProperty("top", "0", "important");
      clone.style.setProperty("left", "-9999px", "important");
      clone.style.setProperty("width", "1024px", "important");
      clone.style.setProperty("height", "auto", "important");
      clone.style.setProperty("max-height", "none", "important");
      clone.style.setProperty("overflow", "visible", "important");
      clone.style.setProperty("display", "block", "important");
      
      const scrollableElements = Array.from(clone.querySelectorAll(".cibil-print-scrollable")) as HTMLElement[];
      scrollableElements.forEach(el => {
        el.style.setProperty("height", "auto", "important");
        el.style.setProperty("min-height", "0", "important");
        el.style.setProperty("max-height", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
        el.style.setProperty("display", "block", "important");
      });
      
      const hideElements = Array.from(clone.querySelectorAll(".cibil-print-hide")) as HTMLElement[];
      hideElements.forEach(el => {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
      });

      document.body.appendChild(clone);
      
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const cloneWidth = clone.clientWidth || 1024;
      const pageHeightPx = Math.floor(cloneWidth * 1.45789); 
      
      const breakables = Array.from(clone.querySelectorAll([
        '.cibil-print-section',
        '.cibil-print-keep-together',
        '.cibil-chart-container',
        'table',
        'tr'
      ].join(','))) as HTMLElement[];
      
      breakables.forEach(el => {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        
        if (Math.floor(top / pageHeightPx) !== Math.floor((top + height) / pageHeightPx)) {
          const nextPageTop = Math.ceil(top / pageHeightPx) * pageHeightPx;
          const pushDownAmount = nextPageTop - top;
          
          if (pushDownAmount > 0 && pushDownAmount < pageHeightPx * 0.5) { 
             el.style.setProperty("margin-top", `${pushDownAmount + 20}px`, "important");
          }
        }
      });
      
      const canvas = await html2canvas(clone, {
        scale: 2, 
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      const printableWidth = pdfWidth - (margin * 2);
      const printableHeight = pdfHeight - (margin * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const canvasWidth = imgProps.width;
      const canvasHeight = imgProps.height;

      const imgHeightInMm = (canvasHeight * printableWidth) / canvasWidth;

      let heightLeft = imgHeightInMm;
      let position = margin; 

      pdf.addImage(imgData, "JPEG", margin, position, printableWidth, imgHeightInMm);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightInMm + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, printableWidth, imgHeightInMm);
        heightLeft -= printableHeight;
      }
      
      const cleanName = bsaAnalysisData?.person_name?.replace(/[^a-z0-9]/gi, '_') || "User";
      pdf.save(`Bank_Statement_Analysis_${cleanName}.pdf`);
      
      toast({
        title: "Download Complete",
        description: "Your Bank Statement Analysis report has been downloaded as a PDF.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      toast({
        title: "Download Failed",
        description: err.message || "Failed to generate PDF report.",
        variant: "destructive"
      });
    } finally {
      if (clone && document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      setIsGeneratingBSAPDF(false);
    }
  };

  // Fetch User's Consolidated Profile & Stored Reports
  useEffect(() => {
    async function init() {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        
        // 1. Fetch Consolidated Profile
        const profileRes = await fetch(`${apiBase}/profile/consolidated/${userId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const profileInfo = profileData.profile_info || {};
          
          // Restore CIBIL from profile
          if (profileData.cibil_report && Object.keys(profileData.cibil_report).length > 0) {
             setStoredCibilReport(profileData.cibil_report);
          }
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setCibilLoading(false);
      }
    }
    init();
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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBsaFile(file);
      setBsaError(null);
    }
  };

  // BSA Streaming Progress Modal States
  const [bsaModalOpen, setBsaModalOpen] = useState<boolean>(false);
  const [bsaModalStep, setBsaModalStep] = useState<number>(1);
  const [bsaModalMessage, setBsaModalMessage] = useState<string>("");
  const [bsaModalLogs, setBsaModalLogs] = useState<LogEntry[]>([]);
  const [bsaSessionId, setBsaSessionId] = useState<string>("");

  const performBsaUpload = async (file: File, isCibilContext: boolean = false) => {
    setBsaUploading(true);
    setBsaError(null);
    setBsaModalOpen(true);
    setBsaModalStep(1);
    setBsaModalMessage("Initializing secure bank statement analysis...");
    setBsaModalLogs([]);
    setBsaSessionId("");

    const addLog = (stepNum: number, textMsg: string) => {
      setBsaModalLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          text: textMsg,
          step: stepNum,
        },
      ]);
    };

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("file", file);
    if (bsaPassword) {
      formData.append("password", bsaPassword);
    }
    if (isCibilContext && cibilReport?.id) {
      formData.append("report_id", cibilReport.id);
    }

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {};
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }
      
      const session = getStoredAuthSession();
      const activeUserId = userId || session?.userId;
      if (activeUserId) {
        headers["X-Requester-ID"] = activeUserId;
      }

      const response = await fetch(`${apiBase}/cibil/bsa/upload-stream`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to analyze bank statement");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Unable to read response stream.");
      }

      let done = false;
      let finalBsaData: any = null;
      let buffer = "";

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const jsonStr = trimmed.replace(/^data:\s*/, "");
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.sess_id) {
                  setBsaSessionId(parsed.sess_id);
                }
                if (parsed.step) {
                  setBsaModalStep(parsed.step);
                }
                if (parsed.message) {
                  setBsaModalMessage(parsed.message);
                  addLog(parsed.step || 1, parsed.message);
                }
                if (parsed.data) {
                  finalBsaData = parsed.data;
                }
              } catch (e: any) {
                if (e.message && !e.message.includes("JSON")) {
                  throw e;
                }
              }
            }
          }
        }
      }

      const data = finalBsaData;
      if (!data) {
        throw new Error("BSA analysis stream finished without data.");
      }

      if (isCibilContext && cibilReport) {
        setCibilReport({
          ...cibilReport,
          bsa_analysis: data,
        });
        setBsaAnalysisData(data);
        toast({
          title: "Statement Attached",
          description: "Bank statement analysis successfully attached to this CIBIL report.",
        });
      } else {
        if (data.metrics) {
          setEligIncome(String(Math.round(data.metrics.verified_monthly_salary || 0)));
          setEligEmi(String(Math.round(data.metrics.total_existing_monthly_emi || 0)));
        }
        if (data.excel_report_url) {
          setBsaExcelUrl(data.excel_report_url);
        }
        setBsaBankName(data.bank_name || "Verified Bank");
        setBsaPeriod(data.metrics?.statement_period || "");
        setBsaVerified(true);
        setBsaAnalysisData(data);
      }

      window.dispatchEvent(new CustomEvent("finheal:wellness_update"));

      setTimeout(() => {
        setBsaModalOpen(false);
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setBsaError(err.message || "Failed to process file");
      toast({
        title: "Analysis Failed",
        description: err.message || "Failed to process bank statement",
        variant: "destructive",
      });
    } finally {
      setBsaUploading(false);
    }
  };

  const submitBsaAnalysis = async () => {
    if (!selectedBsaFile) return;
    await performBsaUpload(selectedBsaFile, false);
  };

  const handleBsaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await performBsaUpload(file);
  };

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
    setCibilReport(null);
    try {
      const result = await fetchCibilReport(
        userId, 
        effectiveName, 
        cibilPhone, 
        cibilBureau === "experian" ? undefined : cibilPan.toUpperCase(), 
        cibilBureau, 
        cibilReportType,
        selectedEmployeeId || undefined
      );
      setCibilReport(result);
      setStoredCibilReport(result);
      setEligCibil(String(result.score));
      setCibilError(null);
      toast({ title: "Report Retrieved!", description: `${cibilBureau.toUpperCase()} Score: ${result.score}` });
      window.dispatchEvent(new CustomEvent("finheal:wellness_update"));
      window.dispatchEvent(new CustomEvent("finheal:cibil_update"));
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
    setIsGeneratingCAM(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {};
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }
      
      const report = cibilReport || storedCibilReport;
      const fetchUrl = report?.id 
        ? `${apiBase}/cibil/cam/generate/${userId}?report_id=${report.id}`
        : `${apiBase}/cibil/cam/generate/${userId}`;
        
      const res = await fetch(fetchUrl, { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate CAM Excel report.");
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanName = report?.name ? report.name.replace(/[^a-zA-Z0-9_]/g, "_") : "User";
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
      <div className="eligibility-view relative h-full w-full flex flex-col overflow-hidden bg-gray-50 lg:rounded-[20px] lg:border lg:border-gray-200 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-[14px] border-b border-gray-100 bg-white py-[16px] px-[20px] shrink-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-100 rounded w-64"></div>
            </div>
          </div>
          <div className="flex gap-2 hidden sm:flex">
            <div className="h-[36px] w-[120px] bg-gray-200 rounded-[10px]"></div>
            <div className="h-[36px] w-[36px] bg-gray-200 rounded-[10px]"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-[16px] sm:p-[24px] overflow-hidden">
          <div className="max-w-[1200px] mx-auto space-y-[24px]">
            {/* Tabs Skeleton */}
            <div className="flex gap-4 border-b border-gray-200 pb-[12px]">
              <div className="h-[36px] w-[140px] bg-gray-200 rounded-full"></div>
              <div className="h-[36px] w-[140px] bg-gray-200 rounded-full"></div>
              <div className="h-[36px] w-[140px] bg-gray-200 rounded-full"></div>
            </div>

            {/* Main Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
              <div className="lg:col-span-2 space-y-[24px]">
                <div className="h-[320px] bg-white border border-gray-200 rounded-[16px] p-[24px]">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-8"></div>
                  <div className="space-y-4">
                    <div className="h-[48px] bg-gray-100 rounded-[10px] w-full"></div>
                    <div className="h-[48px] bg-gray-100 rounded-[10px] w-full"></div>
                    <div className="h-[48px] bg-gray-100 rounded-[10px] w-full"></div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 space-y-[24px]">
                <div className="h-[320px] bg-white border border-gray-200 rounded-[16px] p-[24px] flex flex-col items-center justify-center">
                  <div className="w-[140px] h-[140px] rounded-full bg-gray-100 border-[8px] border-gray-50 mb-6"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eligibility-view relative h-full w-full flex flex-col overflow-y-auto overflow-x-hidden bg-gray-50 lg:rounded-[20px] lg:border lg:border-gray-200">
      
      {/* Header */}
      <header className="flex flex-col gap-[14px] border-b border-gray-100 bg-white py-[16px] pl-[20px] pr-[96px] sm:pr-[96px] 2xl:pr-[20px] shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={onToggleSidebar}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-gray-50 hover:bg-gray-100 lg:hidden cursor-pointer cibil-print-hide"
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
          <div className="flex items-center gap-2 cibil-print-hide">
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

      {/* CIBIL / Eligibility Tab Switcher */}
      <div className="border-b border-gray-150 bg-white pt-4 px-[16px] sm:px-[20px] pb-3 shrink-0 cibil-print-hide z-10 shadow-sm relative">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            type="button"
            onClick={() => setCibilSubTab("eligibility")}
            className={`px-4 py-2 rounded-[12px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              cibilSubTab === "eligibility"
                ? "bg-primary text-white shadow-md border border-transparent"
                : "bg-gray-55/40 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Eligibility Checker</span>
          </button>
          <button
            type="button"
            onClick={() => setCibilSubTab("cibil")}
            className={`px-4 py-2 rounded-[12px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              cibilSubTab === "cibil"
                ? "bg-primary text-white shadow-md border border-transparent"
                : "bg-gray-55/40 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isGuest ? <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
            <span>CIBIL Score Checker</span>
          </button>
          {hasCibilViewPermission && (
            <button
              type="button"
              onClick={() => onOpenAdmin?.("cibil-enquiries")}
              className="px-4 py-2 rounded-[12px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 bg-gray-55/40 border border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>Past Reports fetched</span>
            </button>
          )}
          {hasLendersEditPermission && (
            <button
              type="button"
              onClick={() => setCibilSubTab("lenders")}
              className={`px-4 py-2 rounded-[12px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                cibilSubTab === "lenders"
                  ? "bg-primary text-white shadow-md border border-transparent"
                  : "bg-gray-55/40 border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Landmark className="h-4 w-4 shrink-0" />
              <span>Lenders Catalog</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCibilSubTab("bsa")}
            className={`px-4 py-2 rounded-[12px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              cibilSubTab === "bsa"
                ? "bg-primary text-white shadow-md border border-transparent"
                : "bg-gray-55/40 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isGuest ? <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" /> : <Sparkles className="h-4 w-4 shrink-0" />}
            <span>Bank Statement Analyzer</span>
          </button>
        </div>
      </div>

      <div className="w-full h-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px]">
        
        {/* ----------------- LENDERS CATALOG SUBTAB ----------------- */}
        {cibilSubTab === "lenders" && hasLendersEditPermission && (
          <div className="relative animate-fade-up max-w-5xl w-full mx-auto pb-12">
            <LendersTab
              filteredLenders={filteredLenders}
              filterLenderSearch={filterLenderSearch}
              setFilterLenderSearch={setFilterLenderSearch}
              lendersLoading={isLoadingLenders}
              handleOpenAddLender={handleOpenAddLender}
              handleOpenEditLender={handleOpenEditLender}
              handleDeleteLender={handleDeleteLender}
            />
          </div>
        )}
        
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
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] font-semibold text-gray-700">Gross Monthly Income</label>
                    {bsaVerified && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-150">
                        <Check className="h-2.5 w-2.5" /> Verified
                      </span>
                    )}
                  </div>
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
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] font-semibold text-gray-700">Existing Monthly Debt (EMIs)</label>
                    {bsaVerified && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-150">
                        <Check className="h-2.5 w-2.5" /> Verified
                      </span>
                    )}
                  </div>
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
              <div className="border border-gray-200 rounded-[18px] p-5 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
                <div className="flex flex-col">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[1px] text-gray-400">
                    Max Eligible Loan Amount
                  </span>
                  <span className="text-[28px] font-extrabold text-primary mt-1">
                    {formatCurrency(eligCalculations.eligibleAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap sm:justify-end justify-start">
                  <button
                    type="button"
                    onClick={handleAskAssistant}
                    className="min-w-[140px] px-4 py-2.5 bg-primary text-white text-[12px] font-bold rounded-[12px] hover:opacity-90 transition-all cursor-pointer shadow-[0_2px_8px_rgba(50,68,230,0.15)] hover:-translate-y-0.5 whitespace-nowrap flex items-center justify-center text-center"
                  >
                    Ask Assistant
                  </button>
                  {onTalkToAdvisor && (
                    <button
                      type="button"
                      onClick={handleTalkToAdvisorClick}
                      className="min-w-[140px] px-4 py-2.5 bg-emerald-600 text-white text-[12px] font-bold rounded-[12px] hover:bg-emerald-500 transition-all cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 whitespace-nowrap flex items-center justify-center text-center"
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
          <div className="relative animate-fade-up min-h-[400px]">
            {isGuest && (
              <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none rounded-[20px]">
                <div className="bg-white border border-gray-150 rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.15)] animate-scale-in">
                  <div className="text-[32px] text-center mb-[12px]">🔒</div>
                  <h3 className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign up to check CIBIL Score</h3>
                  <p className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
                    Create a free account or sign in to verify your official credit score, monitor open accounts, and access personalized AI recommendations.
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

            <div className={isGuest ? "pointer-events-none select-none filter blur-[4px]" : ""}>
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
                    
                    {!hasCibilFetchPermission ? (
                      <div className="text-center py-4">
                        <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-3">
                          <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-[16px] font-bold text-gray-900">
                          Credit Check Locked
                        </h2>
                        <p className="text-[11px] text-gray-400 mt-[2px] font-semibold">Access Denied</p>
                        <div className="my-4 p-4 rounded-[14px] bg-rose-550 border border-rose-100 text-rose-900 text-left" style={{ backgroundColor: "#fef2f2" }}>
                          <p className="text-[12px] leading-normal text-rose-700 font-medium">
                            You do not have permission to fetch credit score reports. Please contact your Super Admin to adjust your Role-Based Access controls (RBA).
                          </p>
                        </div>
                        {storedCibilReport && (
                          <button
                            type="button"
                            onClick={() => setCibilReport(storedCibilReport)}
                            className="w-full bg-primary text-white font-bold py-2.5 rounded-[10px] hover:opacity-95 transition-all cursor-pointer shadow-md shadow-primary/10"
                          >
                            View Stored Report
                          </button>
                        )}
                      </div>
                    ) : storedCibilReport && isReportFresh(storedCibilReport.fetched_at) && !isExemptRole(userEmail, storedCibilReport.name) ? (
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
                            Individual {cibilBureau === "experian" ? "Experian" : "CIBIL"}
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
                            Company {cibilBureau === "experian" ? "Experian" : "CIBIL"}
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
                                      title=""
                                      value={cibilFirstName}
                                      onChange={(e) => setCibilFirstName(e.target.value)}
                                      placeholder="e.g. Rahul"
                                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white text-gray-700 border border-gray-200 shadow-sm font-medium">
                                    Please fill out this field.
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
                                      title=""
                                      value={cibilLastName}
                                      onChange={(e) => setCibilLastName(e.target.value)}
                                      placeholder="e.g. Sharma"
                                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white text-gray-700 border border-gray-200 shadow-sm font-medium">
                                    Please fill out this field.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">
                              {cibilReportType === "company" ? "Company Registered Name (As on PAN)" : "Full Name (As on PAN)"}
                            </label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="text"
                                    required
                                    title=""
                                    value={cibilName}
                                    onChange={(e) => setCibilName(e.target.value)}
                                    placeholder={cibilReportType === "company" ? "e.g. F2 Fintech Private Limited" : "e.g. Rahul Sharma"}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-white text-gray-700 border border-gray-200 shadow-sm font-medium">
                                  Please fill out this field.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        )}

                        {cibilBureau === "experian" ? (
                          <div className="flex flex-col">
                            <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">Mobile Number</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="tel"
                                    required
                                    title=""
                                    pattern="[0-9]{10}"
                                    value={cibilPhone}
                                    onChange={handlePhoneChange}
                                    placeholder="e.g. 98765XXXXX"
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-white text-gray-700 border border-gray-200 shadow-sm font-medium">
                                  Please fill out this field.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">
                                {cibilReportType === "company" ? "Auth Signatory Mobile Number" : "Mobile Number"}
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <input
                                      type="tel"
                                      required
                                      title=""
                                      pattern="[0-9]{10}"
                                      value={cibilPhone}
                                      onChange={handlePhoneChange}
                                      placeholder="e.g. 98765XXXXX"
                                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white text-gray-700 border border-gray-200 shadow-sm font-medium">
                                    Please fill out this field.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">
                                {cibilReportType === "company" ? "Company PAN Number" : "PAN Card Number"}
                              </label>
                              <div className="relative">
                                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <input
                                      type="text"
                                      required
                                      title=""
                                      value={cibilPan}
                                      onChange={handlePanChange}
                                      placeholder="e.g. AAAAA1111B"
                                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white text-gray-700 border border-gray-200 shadow-sm font-medium">
                                    Please fill out this field.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col mb-4 mt-2">
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

                        {isSuperAdmin && (
                          <div className="flex flex-col mb-4 mt-2" ref={employeeDropdownRef}>
                            <label className="text-[12px] font-bold text-gray-700 uppercase mb-1.5">Fetch On Behalf Of (Admin Only)</label>
                            <div className="relative">
                              <div
                                onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                                className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-semibold flex items-center justify-between cursor-pointer select-none hover:border-primary/50 transition-colors"
                              >
                                <span className="truncate">
                                  {selectedEmployeeId === "" 
                                    ? "System Admin (Self)" 
                                    : employeeDirectory.find(e => (e.f2FintechId || e.id) === selectedEmployeeId)?.name 
                                      ? `${employeeDirectory.find(e => (e.f2FintechId || e.id) === selectedEmployeeId)?.name} ${employeeDirectory.find(e => (e.f2FintechId || e.id) === selectedEmployeeId)?.designation ? `- ${employeeDirectory.find(e => (e.f2FintechId || e.id) === selectedEmployeeId)?.designation}` : ""}`
                                      : "System Admin (Self)"}
                                </span>
                                <ChevronDown className={`absolute right-3 w-4 h-4 text-gray-500 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                              </div>
                              
                              {isEmployeeDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[10px] shadow-lg overflow-hidden flex flex-col max-h-[240px]">
                                  <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={employeeSearchQuery}
                                        onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-[6px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>
                                  <div className="overflow-y-auto overflow-x-hidden flex-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
                                    <div
                                      onClick={() => {
                                        setSelectedEmployeeId("");
                                        setIsEmployeeDropdownOpen(false);
                                        setEmployeeSearchQuery("");
                                      }}
                                      className={`px-3 py-2.5 text-[12.5px] cursor-pointer transition-colors ${selectedEmployeeId === "" ? "bg-primary/10 text-primary font-bold" : "hover:bg-gray-50 text-gray-700 font-medium"}`}
                                    >
                                      System Admin (Self)
                                    </div>
                                    {employeeDirectory
                                      .filter(emp => {
                                        const search = employeeSearchQuery.toLowerCase();
                                        const name = (emp.name || "").toLowerCase();
                                        const desig = (emp.designation || "").toLowerCase();
                                        return name.includes(search) || desig.includes(search);
                                      })
                                      .map((emp: any) => {
                                        const id = emp.f2FintechId || emp.id;
                                        return (
                                          <div
                                            key={id}
                                            onClick={() => {
                                              setSelectedEmployeeId(id);
                                              setIsEmployeeDropdownOpen(false);
                                              setEmployeeSearchQuery("");
                                            }}
                                            className={`px-3 py-2.5 text-[12.5px] cursor-pointer transition-colors border-t border-gray-50 ${selectedEmployeeId === id ? "bg-primary/10 text-primary font-bold" : "hover:bg-gray-50 text-gray-700 font-medium"}`}
                                          >
                                            <div className="truncate">
                                              {emp.name} <span className="text-gray-400 font-normal">{emp.designation ? `- ${emp.designation}` : ""}</span>
                                            </div>
                                          </div>
                                        );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex bg-gray-55/30 pt-2 rounded-[12px]">
                          <input
                            type="checkbox"
                            id="terms-check"
                            required
                            checked={cibilAgreed}
                            onChange={(e) => setCibilAgreed(e.target.checked)}
                            className="mt-0.5 shrink-0 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor="terms-check" className="ml-2 text-[11px] text-gray-500 leading-normal select-none">
                            By logging in, you agree to the following{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("credit-consent");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary hover:underline font-bold"
                            >
                              Credit Consent
                            </button>,{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("terms-of-use");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary hover:underline font-bold"
                            >
                              Terms of Use
                            </button>,{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("privacy-policy");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary hover:underline font-bold"
                            >
                              Privacy Policy
                            </button>,{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("dpdp-notice");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary hover:underline font-bold"
                            >
                              DPDP Notice
                            </button> and{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTermsTab("data-retention");
                                setIsTermsModalOpen(true);
                              }}
                              className="text-primary hover:underline font-bold"
                            >
                              Data Retention Policy
                            </button>
                          </label>
                        </div>

                        <div className="text-[15.5px] flex flex-col gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={cibilFetching || !cibilAgreed}
                            className="w-full bg-primary text-white font-bold py-3 rounded-[14px] hover:bg-[#1e2db8] transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cibilFetching ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Verifying Credit Record...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4.5 h-4.5" />
                                <span>Download {cibilBureau === "experian" ? "Experian" : "CIBIL"} Credit Report</span>
                              </>
                            )}
                          </button>
                          
                          <div className="flex items-center justify-center gap-1.5 mt-2 pb-1">
                            <ShieldCheck className="w-[15px] h-[15px] text-emerald-500" />
                            <span className="text-[11px] text-gray-400 font-medium tracking-tight">Secure connection. Your credit history is safe with us.</span>
                          </div>
                        </div>
                      </form>
                    </TooltipProvider>
                  </div>
                </div>
              ) : (
                // CIBIL Report Dashboard (Retrieved)
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up pb-3">
                  
                  {/* Gauge dial card */}
                  <div className="lg:col-span-1 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="flex justify-between items-center w-full mb-3 shrink-0">
                      <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.8px]">Credit Score Bureau</h3>
                      {(() => {
                        const fresh = isReportFresh(cibilReport?.fetched_at);
                        const exempt = isExemptRole(userEmail, cibilReport?.name);
                        
                        if (fresh && !exempt) {
                          const nextDate = getNextAvailableFetchDate(cibilReport?.fetched_at);
                          return (
                            <span className="text-[9.5px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-[5px] font-semibold font-sans" title={`Next update available on ${nextDate}`}>
                              Next update: {nextDate}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="relative w-[180px] h-[180px] flex items-center justify-center my-1 select-none">
                      <svg width="180" height="180" className="transform -rotate-90">
                        <circle
                          cx="90"
                          cy="90"
                          r={scoreGauge.radius}
                          stroke="#f3f4f6"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="90"
                          cy="90"
                          r={scoreGauge.radius}
                          stroke={scoreTheme.fill}
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={scoreGauge.dashArray}
                          strokeDashoffset={scoreGauge.dashOffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[36px] font-black text-gray-800 leading-none">{cibilReport.score}</span>
                        <span className={`text-[13px] font-bold mt-[6px] px-[12px] py-[3px] rounded-[20px] ${scoreTheme.bg} ${scoreTheme.color} border ${scoreTheme.border}`}>
                          {cibilReport.band}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-[12px]">PAN: {cibilReport.pan} | Phone: {cibilReport.phone || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 mt-[2px]">Fetched at {cibilReport.fetched_at ? new Date(cibilReport.fetched_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                    {cibilReport.pdf_url && (
                      <a
                        href={getBureauPdfDownloadUrl(cibilReport.pdf_url, `${cibilReport.name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9_]/g, "_")}_${(cibilReport.bureau || cibilBureau || "cibil").toLowerCase()}_report.pdf`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-[14px] flex items-center justify-center gap-[6px] bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold px-[16px] py-[8px] rounded-[10px] shadow-sm transition-all cursor-pointer w-full cibil-print-hide"
                      >
                        <FileText className="w-[14px] h-[14px]" />
                        <span>Download PDF Report</span>
                      </a>
                    )}
                    
                    {!cibilReport.bsa_analysis && (
                      <div className="mt-2.5 w-full relative cibil-print-hide">
                        <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Statement Password (if any)"
                          value={bsaPassword}
                          onChange={(e) => setBsaPassword(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-gray-55/30 border border-gray-200 rounded-[10px] text-[11px] font-medium text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                          disabled={bsaUploading || !!cibilReport.bsa_analysis}
                        />
                      </div>
                    )}
                    {cibilReport.bsa_analysis ? (
                      <div className="flex flex-col gap-2 mt-2 w-full cibil-print-hide">
                        <div className="w-full font-bold py-2.5 rounded-[10px] text-[11.5px] transition-all flex items-center justify-center gap-1.5 shadow-sm bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Bank Statement Ready ✓</span>
                        </div>
                        {cibilReport.bsa_analysis.excel_report_url && (isStaff || isExemptRole(userEmail, cibilReport.name)) && (
                          <a 
                            href={cibilReport.bsa_analysis.excel_report_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-full bg-white border border-indigo-200 text-indigo-700 font-bold py-2.5 rounded-[10px] hover:bg-indigo-50 hover:border-indigo-300 transition-all text-[11.5px] flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download Excel Report
                          </a>
                        )}
                      </div>
                    ) : selectedBsaFile ? (
                      <div className="mt-2 flex flex-col gap-2 w-full cibil-print-hide">
                        <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs">
                          <span className="font-medium text-indigo-700 truncate">{selectedBsaFile.name}</span>
                          <button onClick={() => setSelectedBsaFile(null)} className="text-indigo-400 hover:text-indigo-600 ml-2 font-bold p-1" disabled={bsaUploading}>✕</button>
                        </div>
                        <button 
                          onClick={() => performBsaUpload(selectedBsaFile, true)}
                          disabled={bsaUploading}
                          className={`w-full font-bold py-2.5 rounded-[10px] text-[11.5px] transition-all flex items-center justify-center gap-1.5 shadow-sm ${bsaUploading ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                          {bsaUploading ? (
                            <span>Analyzing Bank Statement...</span>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 shrink-0" />
                              <span>Start Bank Statement Analysis</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <label className="mt-2 w-full font-bold py-2.5 rounded-[10px] text-[11.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm cibil-print-hide bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>Upload Bank Statement</span>
                        <input
                          type="file"
                          accept=".pdf,.xls,.xlsx,.csv"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={bsaUploading}
                        />
                      </label>
                    )}
                    {bsaError && (
                      <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-left w-full shadow-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1 text-[10.5px] leading-relaxed">
                          <span className="font-semibold text-rose-800">Error:</span>{" "}
                          {(() => {
                            if (bsaError.includes("{")) {
                              const parts = bsaError.split("{");
                              const prefix = parts[0].trim();
                              const jsonStr = "{" + parts.slice(1).join("{");
                              try {
                                const parsed = JSON.parse(jsonStr);
                                const errMsg = parsed.message || parsed.detail || "Details in JSON log below";
                                return (
                                  <>
                                    <span>{prefix.replace("Here is exactly what FinEye sent back:", "")}</span>
                                    <div className="mt-1 font-semibold text-rose-900">
                                      Reason: {errMsg}
                                    </div>
                                    <details className="mt-1.5 cursor-pointer">
                                      <summary className="text-[9.5px] font-bold text-rose-500 hover:text-rose-600 select-none">
                                        View details
                                      </summary>
                                      <pre className="mt-1 bg-white/70 p-1.5 rounded border border-rose-100/80 overflow-x-auto font-mono text-[8.5px] text-rose-600 leading-normal max-h-[80px]">
                                        {JSON.stringify(parsed, null, 2)}
                                      </pre>
                                    </details>
                                  </>
                                );
                              } catch (e) {
                                return <span>{bsaError}</span>;
                              }
                            }
                            return <span>{bsaError}</span>;
                          })()}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateCAM}
                      disabled={isGeneratingCAM}
                      className="mt-[8px] flex items-center justify-center gap-[6px] bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold px-[16px] py-[8px] rounded-[10px] shadow-sm transition-all cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed cibil-print-hide"
                    >
                      <FileText className="w-[14px] h-[14px]" />
                      <span>{isGeneratingCAM ? "Generating CAM..." : "Generate CAM Report 📊"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCibilReport(null)}
                      className="mt-[14px] text-[11px] font-bold text-primary hover:underline cursor-pointer cibil-print-hide"
                    >
                      Check Different PAN
                    </button>
                  </div>

                  {/* Impact factors cards */}
                  <div className="lg:col-span-2 rounded-[20px] border border-gray-200 bg-white p-[24px] shadow-sm flex flex-col">
                    <h3 className="text-[14px] font-extrabold text-[#1e293b] uppercase tracking-[1px] mb-[24px]">Key Credit Impact Factors</h3>
                    
                    <table className="w-full border-collapse">
                      <colgroup>
                        <col style={{ width: '45%' }} />
                        <col style={{ width: '35%' }} />
                        <col style={{ width: '20%' }} />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-[#64748b] font-medium text-[12px] pb-[12px]">Factor</th>
                          <th className="text-left text-[#64748b] font-medium text-[12px] pb-[12px]">Your Status</th>
                          <th className="text-right text-[#64748b] font-medium text-[12px] pb-[12px]">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Row 1: Payment History */}
                        <tr className="border-b border-gray-100 border-dashed">
                          <td className="py-[14px] pr-[8px]">
                            <div className="flex items-center gap-[14px]">
                              <div className="w-[44px] h-[44px] rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                <CalendarCheck className="w-[20px] h-[20px]" />
                              </div>
                              <div>
                                <div className="font-extrabold text-[#1e293b] text-[13.5px]">Payment History</div>
                                <div className="text-[#64748b] text-[11.5px] font-medium mt-[3px]">On-time payments</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-[14px] pr-[24px]">
                            <div className="font-extrabold text-[#1e293b] text-[13.5px] mb-[8px]">{cibilReport.metrics.payment_on_time_pct}%</div>
                            <div className="w-full h-[6px] bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cibilReport.metrics.payment_on_time_pct}%` }} />
                            </div>
                          </td>
                          <td className="py-[14px] text-right">
                            {cibilReport.metrics.payment_on_time_pct >= 95 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-emerald-50 text-emerald-600">Excellent</span>
                            ) : cibilReport.metrics.payment_on_time_pct >= 90 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-blue-50 text-blue-600">Good</span>
                            ) : (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-red-50 text-red-600">Poor</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 2: Credit Utilization */}
                        <tr className="border-b border-gray-100 border-dashed">
                          <td className="py-[14px] pr-[8px]">
                            <div className="flex items-center gap-[14px]">
                              <div className="w-[44px] h-[44px] rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                <PieChart className="w-[20px] h-[20px]" />
                              </div>
                              <div>
                                <div className="font-extrabold text-[#1e293b] text-[13.5px]">Credit Utilization</div>
                                <div className="text-[#64748b] text-[11.5px] font-medium mt-[3px]">Of credit limit utilized</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-[14px] pr-[24px]">
                            <div className="font-extrabold text-[#1e293b] text-[13.5px] mb-[8px]">{cibilReport.metrics.credit_utilization_pct}%</div>
                            <div className="w-full h-[6px] bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(cibilReport.metrics.credit_utilization_pct, 100)}%` }} />
                            </div>
                          </td>
                          <td className="py-[14px] text-right">
                            {cibilReport.metrics.credit_utilization_pct <= 30 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-emerald-50 text-emerald-600">Excellent</span>
                            ) : cibilReport.metrics.credit_utilization_pct <= 50 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-blue-50 text-blue-600">Good</span>
                            ) : (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-red-50 text-red-600">Poor</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 3: Credit Age */}
                        <tr className="border-b border-gray-100 border-dashed">
                          <td className="py-[14px] pr-[8px]">
                            <div className="flex items-center gap-[14px]">
                              <div className="w-[44px] h-[44px] rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                <Hourglass className="w-[20px] h-[20px]" />
                              </div>
                              <div>
                                <div className="font-extrabold text-[#1e293b] text-[13.5px]">Credit Age</div>
                                <div className="text-[#64748b] text-[11.5px] font-medium mt-[3px]">Credit history length</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-[14px] pr-[24px]">
                            <div className="font-extrabold text-[#1e293b] text-[13.5px] mb-[8px]">{cibilReport.metrics.credit_history_age_years} years</div>
                            <div className="w-full h-[6px] bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((cibilReport.metrics.credit_history_age_years / 10) * 100, 100)}%` }} />
                            </div>
                          </td>
                          <td className="py-[14px] text-right">
                            {cibilReport.metrics.credit_history_age_years >= 5 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-emerald-50 text-emerald-600">Excellent</span>
                            ) : cibilReport.metrics.credit_history_age_years >= 3 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-blue-50 text-blue-600">Good</span>
                            ) : (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-red-50 text-red-600">Poor</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 4: Recent Enquiries */}
                        <tr>
                          <td className="py-[14px] pr-[8px]">
                            <div className="flex items-center gap-[14px]">
                              <div className="w-[44px] h-[44px] rounded-full bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
                                <Search className="w-[20px] h-[20px]" />
                              </div>
                              <div>
                                <div className="font-extrabold text-[#1e293b] text-[13.5px]">Recent Enquiries</div>
                                <div className="text-[#64748b] text-[11.5px] font-medium mt-[3px]">Bureau queries (3M)</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-[14px] pr-[24px]">
                            <div className="font-extrabold text-[#1e293b] text-[13.5px] mb-[8px]">{cibilReport.metrics.enquiries_l3m}</div>
                            <div className="w-full h-[6px] bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${cibilReport.metrics.enquiries_l3m === 0 ? 0 : Math.min((cibilReport.metrics.enquiries_l3m / 5) * 100, 100)}%` }} />
                            </div>
                          </td>
                          <td className="py-[14px] text-right">
                            {cibilReport.metrics.enquiries_l3m <= 1 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-emerald-50 text-emerald-600">Excellent</span>
                            ) : cibilReport.metrics.enquiries_l3m <= 2 ? (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-blue-50 text-blue-600">Good</span>
                            ) : (
                              <span className="inline-block px-[14px] py-[6px] rounded-full text-[11.5px] font-extrabold bg-red-50 text-red-600">Poor</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Information Footer */}
                    <div className="mt-[24px] bg-[#f8fafc] border border-gray-100 rounded-[12px] p-[16px] flex items-start gap-[12px]">
                      <Info className="w-[20px] h-[20px] text-blue-500 shrink-0 mt-[1px]" />
                      <span className="text-[12.5px] font-semibold text-gray-500 leading-relaxed">
                        Your CIBIL score is calculated using: Payment History (35%), Credit Utilization (30%), Credit History Age (15%), Credit Mix / Recent Inquiries (20%).
                      </span>
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
                          <div className="py-6 text-center text-gray-450 bg-gray-55/30 rounded-[12px] border border-gray-150 border-dashed text-[12px] font-medium">
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
                                  <p className="text-[11px] text-gray-400 mt-1">{acc.type} | Opened: {(String(acc.open_date).match(/^\d{8}$/) ? new Date(`${String(acc.open_date).slice(0,4)}-${String(acc.open_date).slice(4,6)}-${String(acc.open_date).slice(6,8)}`) : new Date(acc.open_date)).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-[12.5px] font-extrabold text-gray-808">₹{acc.outstanding_balance.toLocaleString('en-IN')}</div>
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
                        onClick={handleTalkToAdvisorClick}
                        className="mt-4 w-full bg-primary/5 hover:bg-primary/10 text-primary font-bold py-2 rounded-[10px] text-[11.5px] transition-all border border-primary/15 cursor-pointer"
                      >
                        Speak to Credit Advisor
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Floating Comparison Bar */}
      {cibilSubTab === "eligibility" && selectedLenderIds.length > 0 && (
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
                {compareError && (
                  <span className="text-[11px] font-semibold text-rose-600 animate-fade-in mt-1">
                    {compareError}
                  </span>
                )}
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
                onClick={() => {
                  if (selectedLenderIds.length < 2) {
                    toast({
                      title: "Selection Required",
                      description: "Please select 2 or more lenders to compare.",
                      variant: "destructive"
                    });
                    setCompareError("Please select 2 or more lenders to compare.");
                    setTimeout(() => setCompareError(null), 4000);
                    return;
                  }
                  setIsCompareModalOpen(true);
                }}
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

      {/* Pre-Session Prep Modal */}
      {isPrepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[6px] animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full shadow-2xl animate-scale-up border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header (Fixed) */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-gray-800">
                    Pre-Session Prep Checklist
                  </h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Reframer your financial worries into constructive agenda questions.</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrepModalOpen(false)}
                className="p-1.5 hover:bg-gray-150 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Checklist Body */}
            <div className="flex-1 overflow-y-auto p-6 py-4 space-y-4">
              <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                Before booking your slot, select any specific topics or worries you would like to address. We'll automatically build an agenda list for your human advisor to prepare beforehand:
              </p>
              
              <div className="space-y-3">
                {PREP_OPTIONS.map((opt) => {
                  const isChecked = selectedAnxieties.includes(opt.id);
                  return (
                    <div 
                      key={opt.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedAnxieties(selectedAnxieties.filter(id => id !== opt.id));
                        } else {
                          setSelectedAnxieties([...selectedAnxieties, opt.id]);
                        }
                      }}
                      className={`p-3.5 rounded-[16px] border-[1.5px] cursor-pointer transition-all duration-200 flex items-start gap-3 select-none ${
                        isChecked 
                          ? 'border-emerald-500 bg-emerald-50/30' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-4.5 h-4.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-[12.5px] font-bold text-gray-800 block">
                          {opt.label}
                        </span>
                        <span className="text-[11.5px] text-gray-500 mt-0.5 block leading-normal italic">
                          "{opt.desc}"
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons (Fixed) */}
            <div className="p-6 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button
                onClick={() => setIsPrepModalOpen(false)}
                className="flex-1 py-2.5 px-4 border border-gray-200 rounded-[10px] text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPrep}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] text-[12px] font-bold transition-colors cursor-pointer shadow-md hover:shadow-lg text-center"
              >
                Continue to Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- BANK STATEMENT ANALYZER (BSA) SUBTAB ----------------- */}
      {cibilSubTab === "bsa" && (
        <div className="relative animate-fade-up max-w-5xl w-full mx-auto mt-0 mb-6 pb-12">
          {isGuest && (
            <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none rounded-[20px]">
              <div className="bg-white border border-gray-150 rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.15)] animate-scale-in">
                <div className="text-[32px] text-center mb-[12px]">🔒</div>
                <h3 className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign up to analyze statement</h3>
                <p className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
                  Create a free account or sign in to upload your bank statement and get detailed income, EMI, and cashflow indicators analyzed instantly.
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

          <div className={`flex flex-col gap-6 ${isGuest ? "pointer-events-none select-none filter blur-[4px]" : ""}`}>
            <div ref={bsaAnalyzerRef} className="flex flex-col gap-6 w-full">
            
            {/* Card 1: Upload Box */}
            <div className="rounded-[20px] border border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-6 shadow-sm relative overflow-hidden flex flex-col gap-4 text-center justify-center max-w-[600px] mx-auto w-full">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
              
              <div className="flex items-center justify-center gap-2 text-center w-full">
                <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse shrink-0" />
                <span className="text-[14.5px] font-extrabold text-indigo-950">Verify instantly with Bank Statement Analyzer</span>
              </div>
              <p className="text-[12px] text-gray-500 leading-normal text-center w-full">
                Upload your bank statement PDF. Our Bank Statement Analyzer will securely analyze your statement and identify key financial details.
              </p>
              
              {bsaVerified ? (
                <div className="bg-white border border-gray-200 rounded-[16px] p-4 flex flex-col shadow-sm text-left relative overflow-hidden w-full mx-auto mt-2">
                  
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                    <span className="text-[14px] font-extrabold text-emerald-600">Statement Verified</span>
                  </div>
                  
                  {/* Bank Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-[10px] border border-gray-200 shadow-sm flex items-center justify-center bg-white shrink-0 overflow-hidden p-1 relative">
                      {(() => {
                        const bName = bsaBankName || bsaAnalysisData?.bank_name || '';
                        const BANK_DOMAINS: Record<string, string> = {
                          "canara bank": "canarabank.com",
                          "hdfc bank": "hdfcbank.com",
                          "icici bank": "icicibank.com",
                          "sbi": "sbi.co.in",
                          "state bank of india": "sbi.co.in",
                          "axis bank": "axisbank.com",
                          "kotak mahindra bank": "kotak.com",
                          "yes bank": "yesbank.in",
                          "indusind bank": "indusind.com",
                          "punjab national bank": "pnbindia.in",
                          "pnb": "pnbindia.in",
                          "bank of baroda": "bankofbaroda.in",
                        };
                        const domain = BANK_DOMAINS[bName.toLowerCase().trim()];
                        if (domain) {
                          return (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center text-indigo-200">
                                <Landmark className="h-5 w-5" />
                              </div>
                              <img 
                                src={`https://unavatar.io/${domain}?fallback=false`} 
                                alt={bName} 
                                className="w-full h-full object-contain relative z-10 bg-white" 
                                onError={(e) => { 
                                  e.currentTarget.style.display = 'none'; 
                                }} 
                              />
                            </>
                          );
                        }
                        return <Landmark className="h-5 w-5 text-indigo-600" />;
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900">{bsaBankName || bsaAnalysisData?.bank_name || 'Unknown'}</span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {bsaAnalysisData?.raw_json_data?.user_info_and_summary_data?.user_account_information?.bank_account_details?.account_type || 'Savings'}
                        {' • '}
                        {(() => {
                           const accStr = bsaAnalysisData?.raw_json_data?.user_info_and_summary_data?.user_account_information?.bank_account_details?.account_number;
                           return accStr ? 'XX' + String(accStr).slice(-4) : 'XX1234';
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Grid Data */}
                  <div className="flex flex-wrap gap-y-3 border-t border-gray-100 pt-3.5">
                    <div className="w-full flex flex-col gap-0.5 pb-1 border-b border-gray-100/50">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <UserIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Account Holder</span>
                      </div>
                      <span className="text-[12px] font-extrabold text-gray-800">
                        {bsaAnalysisData?.person_name || bsaAnalysisData?.raw_json_data?.user_info_and_summary_data?.user_account_information?.personal_details?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="w-[45%] flex flex-col gap-0.5 pr-2">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-semibold">Period Analysed</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">{formatDateRange(bsaPeriod || bsaAnalysisData?.metrics?.statement_period || '')}</span>
                    </div>
                    
                    <div className="w-[30%] flex flex-col gap-0.5 border-l border-gray-100 pl-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-semibold">Months Analysed</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">
                        {(() => {
                           const durationStr = bsaAnalysisData?.raw_json_data?.user_info_and_summary_data?.user_account_information?.account_statement_details?.statement_duration;
                           if (durationStr && durationStr.includes('days')) {
                             const days = parseInt(durationStr);
                             return Math.round(days / 30.44);
                           }
                           // Fallback to date diff if we can parse it
                           if (bsaPeriod) {
                             const parts = bsaPeriod.split('to').map(s => s.trim());
                             if (parts.length === 2) {
                               const d1 = new Date(parts[0].split('-').reverse().join('-'));
                               const d2 = new Date(parts[1].split('-').reverse().join('-'));
                               if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                                 const diffTime = Math.abs(d2.getTime() - d1.getTime());
                                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                 return Math.round(diffDays / 30.44);
                               }
                             }
                           }
                           return bsaAnalysisData?.months?.length || 6;
                        })()} Months
                      </span>
                    </div>

                    <div className="w-[25%] flex flex-col gap-0.5 border-l border-gray-100 pl-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <span className="text-[10px] font-semibold">Transactions</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">{
                        (() => {
                          const credits = bsaAnalysisData?.raw_json_data?.user_info_and_summary_data?.financial_summary?.credit_summary?.overall_period?.total_count || 0;
                          const debits = bsaAnalysisData?.raw_json_data?.user_info_and_summary_data?.financial_summary?.debit_summary?.overall_period?.total_count || 0;
                          const total = credits + debits;
                          return total > 0 ? total : '426';
                        })()
                      }</span>
                    </div>

                    <div className="w-[45%] flex flex-col gap-0.5 pr-2">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-semibold">Uploaded On</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">
                        {(() => {
                           const d = new Date();
                           return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
                        })()}
                      </span>
                    </div>

                    <div className="w-[55%] flex flex-col gap-0.5 border-l border-gray-100 pl-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-semibold">Last Updated</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">Just now</span>
                    </div>
                  </div>
                  
                  {/* Replace Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setBsaVerified(false);
                      setBsaExcelUrl("");
                      setBsaBankName("");
                      setBsaPeriod("");
                      setBsaError(null);
                      setBsaAnalysisData(null);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 border-2 border-indigo-500/20 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 font-bold py-1.5 rounded-[10px] transition-colors text-[11px] cibil-print-hide"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Replace Statement
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Enter statement password (if any)"
                      value={bsaPassword}
                      onChange={(e) => setBsaPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-[10px] text-[12px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium shadow-inner"
                    />
                  </div>
                  
                  {selectedBsaFile ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs">
                        <span className="font-medium text-indigo-700 truncate">{selectedBsaFile.name}</span>
                        <button onClick={() => setSelectedBsaFile(null)} className="text-indigo-400 hover:text-indigo-600 ml-2 font-bold p-1" disabled={bsaUploading}>✕</button>
                      </div>
                      <button 
                        onClick={submitBsaAnalysis}
                        disabled={bsaUploading}
                        className={`w-full font-bold py-3 rounded-[14px] text-[12.5px] transition-all flex items-center justify-center gap-1.5 shadow-sm ${bsaUploading ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        {bsaUploading ? (
                          <span>Analyzing Bank Statement...</span>
                        ) : (
                          <>
                            <FileText className="w-4.5 h-4.5 shrink-0" />
                            <span>Start Bank Statement Analysis</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <label className="w-full flex items-center justify-center gap-2 border border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/10 py-4 rounded-[14px] cursor-pointer transition-all shadow-sm">
                      <FileText className="h-4.5 w-4.5 text-indigo-500" />
                      <span className="text-[12.5px] font-bold text-indigo-700 font-sans">
                        Upload Bank Statement (PDF/Excel)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.xls,.xlsx,.csv"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={bsaUploading}
                      />
                    </label>
                  )}
                  {bsaError && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-700 text-left w-full shadow-xs">
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 text-[11px] leading-relaxed">
                        <span className="font-bold">Analysis Error:</span>{" "}
                        {(() => {
                          if (bsaError.includes("{")) {
                            const parts = bsaError.split("{");
                            const prefix = parts[0].trim();
                            const jsonStr = "{" + parts.slice(1).join("{");
                            try {
                              const parsed = JSON.parse(jsonStr);
                              const errMsg = parsed.message || parsed.detail || "Details in JSON log below";
                              return (
                                <>
                                  <span>{prefix.replace("Here is exactly what FinEye sent back:", "")}</span>
                                  <div className="mt-1 font-bold text-rose-800">
                                    Reason: {errMsg}
                                  </div>
                                  <details className="mt-1.5 cursor-pointer">
                                    <summary className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 select-none">
                                      Show technical logs
                                    </summary>
                                    <pre className="mt-1.5 bg-white/70 p-2 rounded-lg border border-rose-100/80 overflow-x-auto font-mono text-[9px] text-rose-600 leading-normal max-h-[100px]">
                                      {JSON.stringify(parsed, null, 2)}
                                    </pre>
                                  </details>
                                </>
                              );
                            } catch (e) {
                              return <span>{bsaError}</span>;
                            }
                          }
                          return <span>{bsaError}</span>;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: Results Dashboard / Empty State */}
            <div className="w-full">
              {bsaAnalysisData ? (() => {
                let bounceEventsCount = bsaAnalysisData.metrics?.bounce_events_count;
                if (bounceEventsCount === undefined || bounceEventsCount === null || bounceEventsCount === 0) {
                  const bouncedData = bsaAnalysisData.raw_json_data?.bounced_transaction_data;
                  if (bouncedData) {
                    const txnsDict = bouncedData.trasactions || bouncedData.transactions;
                    if (txnsDict) {
                      let count = 0;
                      for (const k in txnsDict) {
                        if (Array.isArray(txnsDict[k])) {
                          count += txnsDict[k].length;
                        }
                      }
                      if (count > 0) bounceEventsCount = count;
                    }
                    if (bounceEventsCount === undefined || bounceEventsCount === null || bounceEventsCount === 0) {
                      const summary = bouncedData.bounces_summary;
                      if (Array.isArray(summary)) {
                        const totalItem = summary.find((s: any) => s?.month === 'Total');
                        if (totalItem) {
                          bounceEventsCount = (
                            (totalItem.ecs_bounce?.count || 0) +
                            (totalItem.ach_bounce?.count || 0) +
                            (totalItem.cheque_inward_bounce?.count || 0) +
                            (totalItem.cheque_outward_bounce?.count || 0)
                          );
                        }
                      }
                    }
                  }
                }
                const finalBounceCount = bounceEventsCount || 0;

                // Recalculate Average Monthly Salary
                let calculatedSalary = 0;
                try {
                  const salaryCredit = bsaAnalysisData.raw_json_data?.cam_analysis_data?.credits?.salary_credit || bsaAnalysisData.raw_json_data?.salary_credit || bsaAnalysisData.raw_json_data?.income_analysis?.salary_credit || bsaAnalysisData.raw_json_data?.user_info_and_summary_data?.salary_credit;
                  let monthsCount = 6;
                  const durationStr = bsaAnalysisData?.raw_json_data?.user_info_and_summary_data?.user_account_information?.account_statement_details?.statement_duration;
                  if (durationStr && durationStr.includes('days')) {
                    const days = parseInt(durationStr);
                    monthsCount = Math.round(days / 30.44) || 1;
                  } else if (bsaPeriod || bsaAnalysisData?.metrics?.statement_period) {
                    const period = bsaPeriod || bsaAnalysisData?.metrics?.statement_period || "";
                    const parts = period.split('to').map((s: string) => s.trim());
                    if (parts.length === 2) {
                      const d1 = new Date(parts[0].split('-').reverse().join('-'));
                      const d2 = new Date(parts[1].split('-').reverse().join('-'));
                      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                        const diffTime = Math.abs(d2.getTime() - d1.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        monthsCount = Math.round(diffDays / 30.44) || 1;
                      }
                    }
                  } else if (bsaAnalysisData?.months?.length) {
                    monthsCount = bsaAnalysisData.months.length;
                  }

                  if (salaryCredit?.amount?.Total) {
                    calculatedSalary = Math.round(salaryCredit.amount.Total / monthsCount);
                  } else {
                    calculatedSalary = bsaAnalysisData.metrics?.verified_monthly_salary || 
                                       bsaAnalysisData.raw_json_data?.user_info_and_summary_data?.insights?.key_insights?.income_insights?.total_income || 
                                       0;
                  }
                } catch (e) {
                  calculatedSalary = 0;
                }

                // Recalculate Average Monthly EMI
                let calculatedEmi = 0;
                try {
                  const emiData = bsaAnalysisData.raw_json_data?.cam_analysis_data?.debits?.emi_and_loan;
                  if (emiData?.amount?.Total && emiData?.count?.Total > 0) {
                    calculatedEmi = Math.round(emiData.amount.Total / emiData.count.Total);
                  } else {
                    calculatedEmi = bsaAnalysisData.metrics?.total_existing_monthly_emi || 0;
                  }
                } catch (e) {
                  calculatedEmi = 0;
                }

                // Calculate FOIR
                let calculatedFoir = 0;
                if (calculatedSalary > 0) {
                  calculatedFoir = (calculatedEmi / calculatedSalary) * 100;
                } else {
                  try {
                    let rawFoirVal = bsaAnalysisData.metrics?.foir;
                    if (rawFoirVal === undefined || rawFoirVal === null) {
                      const findFoir = (obj: any): any => {
                        if (!obj || typeof obj !== 'object') return null;
                        if (obj.monthwise_foir_score?.amount?.Total !== undefined && !Number.isNaN(obj.monthwise_foir_score?.amount?.Total)) {
                          return obj.monthwise_foir_score.amount.Total;
                        }
                        for (const key in obj) {
                          const res = findFoir(obj[key]);
                          if (res !== null) return res;
                        }
                        return null;
                      };
                      if (bsaAnalysisData.raw_json_data) {
                        rawFoirVal = findFoir(bsaAnalysisData.raw_json_data);
                      }
                    }
                    if (rawFoirVal !== null && rawFoirVal !== undefined) {
                      calculatedFoir = parseFloat(rawFoirVal) || 0;
                    }
                  } catch (e) {}
                }

                return (
                  <div className="flex flex-col gap-4 animate-fade-in w-full bg-transparent p-0">

                    {/* Key Metrics Grid */}
                    <div className="relative w-full overflow-visible">
                      {/* Decorative ambient glassmorphism glows */}
                      <div className="absolute top-1/2 left-[5%] -translate-y-1/2 w-[350px] h-32 bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,transparent_75%)] rounded-full blur-[25px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
                      <div className="absolute top-1/2 right-[5%] -translate-y-1/2 w-[350px] h-32 bg-[radial-gradient(circle,rgba(16,185,129,0.12)_0%,transparent_75%)] rounded-full blur-[25px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
                        <div className="border border-white/75 rounded-[16px] p-3 xl:p-4 shadow-[0_8px_32px_rgba(31,41,55,0.03)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col justify-between gap-1.5 h-full relative" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)' }}>
                        <div className="absolute top-[1px] bottom-[1px] left-[1px] w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-[15px]" />
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider leading-snug">Average Monthly Salary</span>
                          <div className="group shrink-0">
                            <Info className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 w-[220px] z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-24 bg-[radial-gradient(ellipse,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_70%)] rounded-full -z-10" />
                              <div className="relative w-full p-3.5 shadow-xl rounded-[16px]">
                                <div className="absolute inset-0 rounded-[16px] border border-white/20 bg-slate-900/40 backdrop-blur-xl transform-gpu -z-10" style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', transform: 'translateZ(0)' }} />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_45%,transparent_45%,transparent_100%)] rounded-[16px] pointer-events-none -z-10" />
                                <p className="relative z-10 text-white text-[11px] font-medium leading-[1.6] normal-case tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Average of all consistent incoming salary credits across the analyzed period.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[15px] xs:text-[16px] xl:text-[18px] font-extrabold tracking-tight text-emerald-600">₹{calculatedSalary.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border border-white/75 rounded-[16px] p-3 xl:p-4 shadow-[0_8px_32px_rgba(31,41,55,0.03)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col justify-between gap-1.5 h-full relative" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)' }}>
                        <div className="absolute top-[1px] bottom-[1px] left-[1px] w-1 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-l-[15px]" />
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider leading-snug">Average Monthly Credit</span>
                          <div className="group shrink-0">
                            <Info className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-24 bg-[radial-gradient(ellipse,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_70%)] rounded-full -z-10" />
                              <div className="relative w-full p-3.5 shadow-xl rounded-[16px]">
                                <div className="absolute inset-0 rounded-[16px] border border-white/20 bg-slate-900/40 backdrop-blur-xl transform-gpu -z-10" style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', transform: 'translateZ(0)' }} />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_45%,transparent_45%,transparent_100%)] rounded-[16px] pointer-events-none -z-10" />
                                <p className="relative z-10 text-white text-[11px] font-medium leading-[1.6] normal-case tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Total incoming funds (excluding internal transfers and loan disbursals) divided by the number of months.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[15px] xs:text-[16px] xl:text-[18px] font-extrabold tracking-tight text-indigo-600">₹{
                          (() => {
                            try {
                              const creditsData = bsaAnalysisData.raw_json_data?.cam_analysis_data?.credits;
                              if (creditsData?.total_credit?.amount && creditsData?.loan_disbursed?.amount) {
                                const totalAmtDict = creditsData.total_credit.amount;
                                const loanAmtDict = creditsData.loan_disbursed.amount;
                                
                                const months = Object.keys(totalAmtDict).filter(k => k.toLowerCase() !== 'total');
                                if (months.length > 0) {
                                  let sum = 0;
                                  months.forEach(m => {
                                    const totalVal = totalAmtDict[m] || 0;
                                    const loanVal = loanAmtDict[m] || 0;
                                    sum += Math.max(0, totalVal - loanVal);
                                  });
                                  return Math.round(sum / months.length).toLocaleString('en-IN');
                                }
                              }
                              
                              return (bsaAnalysisData.monthly_credits?.amount?.length > 0 
                                ? Math.round(bsaAnalysisData.monthly_credits.amount.reduce((a: number, b: number) => a + b, 0) / bsaAnalysisData.monthly_credits.amount.length)
                                : 0).toLocaleString('en-IN');
                            } catch(e) {
                              return '0';
                            }
                          })()
                        }</span>
                      </div>
                      <div className="border border-white/75 rounded-[16px] p-3 xl:p-4 shadow-[0_8px_32px_rgba(31,41,55,0.03)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col justify-between gap-1.5 h-full relative" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)' }}>
                        <div className="absolute top-[1px] bottom-[1px] left-[1px] w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-[15px]" />
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider leading-snug">Average Monthly EMI</span>
                          <div className="group shrink-0">
                            <Info className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-24 bg-[radial-gradient(ellipse,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_70%)] rounded-full -z-10" />
                              <div className="relative w-full p-3.5 shadow-xl rounded-[16px]">
                                <div className="absolute inset-0 rounded-[16px] border border-white/20 bg-slate-900/40 backdrop-blur-xl transform-gpu -z-10" style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', transform: 'translateZ(0)' }} />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_45%,transparent_45%,transparent_100%)] rounded-[16px] pointer-events-none -z-10" />
                                <p className="relative z-10 text-white text-[11px] font-medium leading-[1.6] normal-case tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Average of all identified EMI and loan repayment transaction amounts.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[15px] xs:text-[16px] xl:text-[18px] font-extrabold tracking-tight text-amber-600">₹{calculatedEmi.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border border-white/75 rounded-[16px] p-3 xl:p-4 shadow-[0_8px_32px_rgba(31,41,55,0.03)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col justify-between gap-1.5 h-full relative" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)' }}>
                        <div className="absolute top-[1px] bottom-[1px] left-[1px] w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-[15px]" />
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider leading-snug">Average Monthly Balance</span>
                          <div className="group shrink-0">
                            <Info className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-24 bg-[radial-gradient(ellipse,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_70%)] rounded-full -z-10" />
                              <div className="relative w-full p-3.5 shadow-xl rounded-[16px]">
                                <div className="absolute inset-0 rounded-[16px] border border-white/20 bg-slate-900/40 backdrop-blur-xl transform-gpu -z-10" style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', transform: 'translateZ(0)' }} />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_45%,transparent_45%,transparent_100%)] rounded-[16px] pointer-events-none -z-10" />
                                <p className="relative z-10 text-white text-[11px] font-medium leading-[1.6] normal-case tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">The average end-of-day bank balance maintained throughout the statement period.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[15px] xs:text-[16px] xl:text-[18px] font-extrabold tracking-tight text-blue-600">₹{
                          (bsaAnalysisData.metrics?.average_monthly_balance || 
                          bsaAnalysisData.raw_json_data?.user_info_and_summary_data?.financial_summary?.abb_summary?.abb_last_30_days || 
                          0).toLocaleString('en-IN')
                        }</span>
                      </div>
                      <div className="border border-white/75 rounded-[16px] p-3 xl:p-4 shadow-[0_8px_32px_rgba(31,41,55,0.03)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col justify-between gap-1.5 h-full relative" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)' }}>
                        <div className={`absolute top-[1px] bottom-[1px] left-[1px] w-1 rounded-l-[15px] ${finalBounceCount > 0 ? 'bg-gradient-to-b from-rose-400 to-rose-600' : 'bg-gradient-to-b from-emerald-400 to-emerald-600'}`} />
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider leading-snug">Bounce Events</span>
                          <div className="group shrink-0">
                            <Info className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-24 bg-[radial-gradient(ellipse,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_70%)] rounded-full -z-10" />
                              <div className="relative w-full p-3.5 shadow-xl rounded-[16px]">
                                <div className="absolute inset-0 rounded-[16px] border border-white/20 bg-slate-900/40 backdrop-blur-xl transform-gpu -z-10" style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', transform: 'translateZ(0)' }} />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_45%,transparent_45%,transparent_100%)] rounded-[16px] pointer-events-none -z-10" />
                                <p className="relative z-10 text-white text-[11px] font-medium leading-[1.6] normal-case tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Number of returned inward cheques or failed auto-debits (NACH/ECS) due to insufficient funds.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[15px] xs:text-[16px] xl:text-[18px] font-extrabold tracking-tight ${finalBounceCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {finalBounceCount}
                        </span>
                      </div>
                      <div className="border border-white/75 rounded-[16px] p-3 xl:p-4 shadow-[0_8px_32px_rgba(31,41,55,0.03)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col justify-between gap-1.5 h-full relative" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)' }}>
                        <div className="absolute top-[1px] bottom-[1px] left-[1px] w-1 bg-gradient-to-b from-fuchsia-400 to-fuchsia-600 rounded-l-[15px]" />
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider leading-snug">FOIR</span>
                          <div className="group shrink-0">
                            <Info className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-[220px] z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-24 bg-[radial-gradient(ellipse,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_70%)] rounded-full -z-10" />
                              <div className="relative w-full p-3.5 shadow-xl rounded-[16px]">
                                <div className="absolute inset-0 rounded-[16px] border border-white/20 bg-slate-900/40 backdrop-blur-xl transform-gpu -z-10" style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', transform: 'translateZ(0)' }} />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_45%,transparent_45%,transparent_100%)] rounded-[16px] pointer-events-none -z-10" />
                                <p className="relative z-10 text-white text-[11px] font-medium leading-[1.6] normal-case tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Fixed Obligation to Income Ratio. Calculated as (Total EMIs ÷ Net Salary) × 100. Lower is better.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[15px] xs:text-[16px] xl:text-[18px] font-extrabold tracking-tight text-fuchsia-600">{calculatedFoir.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Alerts */}
                  <div className="flex flex-col gap-3">
                    {finalBounceCount > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-[12px] p-4 flex items-start gap-3 shadow-sm">
                        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[13px] font-bold text-rose-800">Cheque/EMI Bounces Detected</span>
                          <span className="text-[11.5px] text-rose-600 leading-snug font-medium">
                            We detected {finalBounceCount} bounce events in the last 6 months. This negatively impacts creditworthiness and loan eligibility.
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {(() => {
                      if (calculatedFoir > 0) {
                        const numericFoir = calculatedFoir;
                        if (!Number.isNaN(numericFoir)) {
                          const displayFoir = numericFoir.toFixed(2);
                          if (numericFoir > 70) {
                            return (
                              <div className="bg-rose-100 border border-rose-300 rounded-[12px] p-4 flex items-start gap-3 shadow-sm">
                                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                  <span className="text-[13px] font-bold text-rose-900">Extremely High FOIR ({displayFoir}%)</span>
                                  <span className="text-[11.5px] text-rose-700 leading-snug font-medium">
                                    You are highly over-leveraged. Standard loans will likely be rejected outright. Focus on debt consolidation or clearing existing EMIs before applying for new credit.
                                  </span>
                                </div>
                              </div>
                            );
                          } else if (numericFoir > 65) {
                            return (
                              <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 flex items-start gap-3 shadow-sm">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                  <span className="text-[13px] font-bold text-red-800">Critical FOIR Warning ({displayFoir}%)</span>
                                  <span className="text-[11.5px] text-red-600 leading-snug font-medium">
                                    This is critically high. Most lenders cap FOIR at 60-65%. Approval chances are severely restricted without a strong co-applicant or collateral.
                                  </span>
                                </div>
                              </div>
                            );
                          } else if (numericFoir > 50) {
                            return (
                              <div className="bg-orange-50 border border-orange-200 rounded-[12px] p-4 flex items-start gap-3 shadow-sm">
                                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                  <span className="text-[13px] font-bold text-orange-800">High FOIR Warning ({displayFoir}%)</span>
                                  <span className="text-[11.5px] text-orange-700 leading-snug font-medium">
                                    A FOIR above 50% indicates a high debt burden. This may reduce the chances of loan approval or result in higher interest rates.
                                  </span>
                                </div>
                              </div>
                            );
                          } else if (numericFoir > 30) {
                            return (
                              <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-4 flex items-start gap-3 shadow-sm">
                                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                  <span className="text-[13px] font-bold text-amber-800">Moderate FOIR ({displayFoir}%)</span>
                                  <span className="text-[11.5px] text-amber-700 leading-snug font-medium">
                                    This is a moderate debt level. You still have room for additional credit, but banks will start analyzing your surplus income closer.
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        }
                      }
                      return null;
                    })()}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm flex flex-col gap-4">
                      <h4 className="text-[13px] font-bold text-black uppercase tracking-wider">Monthly Inflow Trend</h4>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(() => {
                            if (!bsaAnalysisData?.months) return [];
                            
                            const totalAmtDict = bsaAnalysisData.raw_json_data?.cam_analysis_data?.credits?.total_credit?.amount;
                            const loanAmtDict = bsaAnalysisData.raw_json_data?.cam_analysis_data?.credits?.loan_disbursed?.amount;
                            
                            return bsaAnalysisData.months.map((month: string, i: number) => {
                              let inflows = bsaAnalysisData.monthly_credits?.amount?.[i] || 0;
                              if (totalAmtDict && loanAmtDict && totalAmtDict[month] !== undefined) {
                                const totalVal = totalAmtDict[month] || 0;
                                const loanVal = loanAmtDict[month] || 0;
                                inflows = Math.max(0, totalVal - loanVal);
                              }
                              return { month, inflows };
                            });
                          })()}>
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }} angle={-45} textAnchor="end" interval={0} height={45} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }} tickFormatter={(val) => `₹${val/1000}k`} width={35} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 600, color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Inflows']} />
                            <Bar dataKey="inflows" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm flex flex-col gap-4">
                      <h4 className="text-[13px] font-bold text-black uppercase tracking-wider">Average Bank Balance</h4>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={bsaAnalysisData?.months?.map((month: string, i: number) => {
                            let avgEodObj = null;
                            const findAvg = (obj: any): any => {
                              if (!obj || typeof obj !== 'object') return null;
                              if (obj.average_eod_balance?.amount && obj.average_eod_balance?.amount[month] !== undefined) return obj.average_eod_balance.amount;
                              for (const key in obj) {
                                const res = findAvg(obj[key]);
                                if (res) return res;
                              }
                              return null;
                            };
                            if (bsaAnalysisData?.raw_json_data) {
                              avgEodObj = findAvg(bsaAnalysisData.raw_json_data);
                            }
                            const balance = (avgEodObj && avgEodObj[month]) || bsaAnalysisData.daily_balances?.["15th"]?.[i] || bsaAnalysisData.metrics?.average_monthly_balance || 0;
                            return { month, balance };
                          }) || []}>
                            <defs>
                              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }} angle={-45} textAnchor="end" interval={0} height={45} padding={{ left: 20, right: 20 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }} tickFormatter={(val) => `₹${val/1000}k`} width={35} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 600, color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Avg Balance']} />
                            <Area type="monotone" dataKey="balance" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#areaGradient)" dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Expanded EOD Balance View */}
                  {bsaAnalysisData.daily_balances && Object.keys(bsaAnalysisData.daily_balances).length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm flex flex-col gap-4 overflow-x-auto">
                      <h4 className="text-[13px] font-extrabold text-gray-800">Expanded EOD Balance View</h4>
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr>
                            <th className="py-2.5 px-3 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wide bg-gray-50/50">EOD Date</th>
                            {bsaAnalysisData.months?.map((m: string) => (
                              <th key={m} className="py-2.5 px-3 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wide text-right bg-gray-50/50">{m}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {['5th', '10th', '15th', '20th', '25th', '30th'].map((day) => (
                            <tr key={day} className="hover:bg-gray-50 transition-colors">
                              <td className="py-2.5 px-3 border-b border-gray-50 text-[12px] font-bold text-gray-700">{day}</td>
                              {bsaAnalysisData.months?.map((m: string, i: number) => {
                                const bal = bsaAnalysisData.daily_balances[day]?.[i];
                                return (
                                  <td key={m} className="py-2.5 px-3 border-b border-gray-50 text-[12px] font-medium text-gray-700 text-right">
                                    {bal !== undefined && bal !== null ? `₹${bal.toLocaleString('en-IN')}` : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={handleDownloadBSAPDF}
                      disabled={isGeneratingBSAPDF}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-[14px] shadow-sm transition-all text-[13px] disabled:opacity-50 disabled:cursor-not-allowed cibil-print-hide"
                    >
                      <Download className="w-4.5 h-4.5" />
                      {isGeneratingBSAPDF ? "Generating PDF..." : "Download PDF Report"}
                    </button>
                    
                    {bsaAnalysisData.excel_report_url && (isStaff || isExemptRole(userEmail, storedCibilReport?.name)) && (
                      <a 
                        href={bsaAnalysisData.excel_report_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full bg-white border border-indigo-200 text-indigo-700 font-bold py-3.5 rounded-[14px] hover:bg-indigo-50 hover:border-indigo-300 transition-all text-[13px] flex items-center justify-center gap-2 shadow-sm cibil-print-hide"
                      >
                        <Download className="w-4.5 h-4.5" />
                        Download Detailed BSA Excel Report
                      </a>
                    )}
                  </div>
                </div>
                );
              })() : bsaUploading ? (
                <div className="rounded-[20px] border border-indigo-200 bg-indigo-50/10 p-8 flex flex-col items-center justify-center text-center min-h-[220px] gap-4 animate-pulse">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                  <div>
                    <h3 className="text-[14px] font-extrabold text-indigo-900">Analysis In Progress</h3>
                    <p className="text-[11.5px] text-indigo-500 mt-1.5 max-w-[340px] leading-normal font-medium font-sans">
                      FinEye is parsing transaction records, verifying salary income, and compiling your cashflow indicators. This may take up to 15 minutes for larger statements.
                    </p>
                  </div>
                </div>
              ) : selectedBsaFile ? (
                // Hide the card completely when a statement is selected but not yet analyzed
                null
              ) : (
                <div className="rounded-[20px] border border-gray-200 border-dashed bg-gray-50/30 p-8 flex flex-col items-center justify-center text-center min-h-[210px] gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-700">No Statement Uploaded Yet</h3>
                    <p className="text-[11.5px] text-gray-400 mt-1 max-w-[340px] leading-normal font-medium font-sans">
                      Please upload your bank e-statement above. The system will process your cashflows and show a detailed dashboard of your verified financial indicators here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          
            </div>
          </div>
        </div>
      )}



      {/* ===================== LENDERS ADD/EDIT POPUP MODAL ======================= */}
      {lenderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[550px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingLender ? `Edit Lender: ${editingLender.name}` : "Add New Lender Product"}
              </h3>
              <button onClick={() => setLenderModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[70vh] scrollbar-thin">
              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Lender Name</label>
                  <select
                    value={isOtherSelected ? "__other__" : (lenderForm.name || "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__other__") {
                        setIsOtherSelected(true);
                        handleUpdateLenderField({ name: "" });
                      } else {
                        setIsOtherSelected(false);
                        handleUpdateLenderField({ name: val });
                      }
                    }}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white cursor-pointer"
                  >
                    <option value="">Select Lender</option>
                    {Array.from(new Set(lenders.map(l => l.name).filter(Boolean))).sort().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="__other__">Other (Add new partner...)</option>
                  </select>
                  
                  {isOtherSelected && (
                    <input
                      type="text"
                      value={lenderForm.name || ""}
                      onChange={(e) => handleUpdateLenderField({ name: e.target.value })}
                      placeholder="Type new lender name (e.g. Axis Bank)"
                      className="w-full mt-[8px] px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary animate-fade-in"
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Product Type</label>
                  <input
                    type="text"
                    value={lenderForm.productType || ""}
                    onChange={(e) => handleUpdateLenderField({ productType: e.target.value })}
                    placeholder="e.g. Home Loan"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Category</label>
                  <select
                    value={lenderForm.category || "HOME"}
                    onChange={(e) => handleUpdateLenderField({ category: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white animate-fade-in"
                  >
                    <option value="HOME">Home Loan</option>
                    <option value="PERSONAL">Personal Loan</option>
                    <option value="PROFESSIONAL">Professional Loan</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Lender Type</label>
                  <select
                    value={lenderForm.lenderType || "NBFC"}
                    onChange={(e) => setLenderForm({ ...lenderForm, lenderType: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white animate-fade-in"
                  >
                    <option value="PSU">PSU Bank</option>
                    <option value="Private Bank">Private Bank</option>
                    <option value="NBFC">NBFC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Product ID</label>
                  <input
                    type="text"
                    value={lenderForm.id || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, id: e.target.value })}
                    placeholder="e.g. HL-SBI"
                    disabled={!!editingLender}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Rate (%)</label>
                  <input
                    type="text"
                    value={lenderForm.minRate || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minRate: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Rate (%)</label>
                  <input
                    type="text"
                    value={lenderForm.maxRate || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxRate: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Tenure (Y)</label>
                  <input
                    type="text"
                    value={lenderForm.minTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minTenureYears: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Tenure (Y)</label>
                  <input
                    type="text"
                    value={lenderForm.maxTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxTenureYears: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min CIBIL</label>
                  <input
                    type="text"
                    value={lenderForm.minCibil || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minCibil: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max FOIR (%)</label>
                  <input
                    type="text"
                    value={lenderForm.maxFoirPct || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxFoirPct: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Monthly Income</label>
                  <input
                    type="text"
                    value={lenderForm.minMonthlyIncome || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minMonthlyIncome: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                  {Number(lenderForm.minMonthlyIncome) > 0 && (
                    <span className="text-[10px] text-primary/80 font-bold block mt-[2px] ml-[2px]">
                      ₹{Number(lenderForm.minMonthlyIncome).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Loan Amount</label>
                  <input
                    type="text"
                    value={lenderForm.minAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minAmount: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                  {Number(lenderForm.minAmount) > 0 && (
                    <span className="text-[10px] text-primary/80 font-bold block mt-[2px] ml-[2px]">
                      ₹{Number(lenderForm.minAmount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Loan Amount</label>
                  <input
                    type="text"
                    value={lenderForm.maxAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxAmount: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                  {Number(lenderForm.maxAmount) > 0 && (
                    <span className="text-[10px] text-primary/80 font-bold block mt-[2px] ml-[2px]">
                      ₹{Number(lenderForm.maxAmount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Disbursal TAT</label>
                  <input
                    type="text"
                    value={lenderForm.disbursalTime || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, disbursalTime: e.target.value })}
                    placeholder="e.g. 2-5 working days"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Processing Fee</label>
                  <input
                    type="text"
                    value={lenderForm.processingFee || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, processingFee: e.target.value })}
                    placeholder="e.g. 2.0% + GST"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Annual Maintenance Charges</label>
                  <input
                    type="text"
                    value={lenderForm.annualMaintenanceCharges || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, annualMaintenanceCharges: e.target.value })}
                    placeholder="e.g. ₹500/year"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                  {renderRupeeHelper(lenderForm.annualMaintenanceCharges || "")}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Insurance Charges</label>
                  <input
                    type="text"
                    value={lenderForm.insuranceCharges || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, insuranceCharges: e.target.value })}
                    placeholder="e.g. Group term cover"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                  {renderRupeeHelper(lenderForm.insuranceCharges || "")}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Other Charges</label>
                  <input
                    type="text"
                    value={lenderForm.otherCharges || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, otherCharges: e.target.value })}
                    placeholder="e.g. Legal/Valuation"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                  {renderRupeeHelper(lenderForm.otherCharges || "")}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Pros</label>
                <input
                  type="text"
                  value={lenderForm.pros || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, pros: e.target.value })}
                  placeholder="Fast approvals, Digital KYC"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Cons</label>
                <input
                  type="text"
                  value={lenderForm.cons || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, cons: e.target.value })}
                  placeholder="Higher ROI band, Documentation heavy"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Required Documents</label>
                <textarea
                  value={lenderForm.docsRequired || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, docsRequired: e.target.value })}
                  placeholder="PAN & Aadhaar KYC, Medical/CA degree, 6 months banking statements"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] h-[55px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-[10px] border-t border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <button onClick={() => setLenderModalOpen(false)} className="px-[16px] py-[8px] bg-white border border-gray-300 rounded-[10px] text-[12px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveLender} className="px-[16px] py-[8px] bg-primary text-white hover:opacity-90 rounded-[10px] text-[12px] font-bold cursor-pointer">
                Save Product
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== LENDER DELETE CONFIRMATION MODAL ==================== */}
      {lenderDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-[400px] w-full mx-4 p-[24px] shadow-[0_20px_60px_rgba(15,23,42,0.18)] border border-gray-100 flex flex-col items-center text-center">
            <div className="w-[48px] h-[48px] rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-[16px] text-[22px]">
              ⚠️
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-[8px]">Delete Lender Product?</h3>
            <p className="text-[12.5px] text-gray-500 mb-[24px] leading-relaxed">
              Are you sure you want to permanently remove <strong>{lenderToDelete?.name} ({lenderToDelete?.productType})</strong>? This will remove it from catalog.
            </p>
            <div className="flex items-center gap-[10px] w-full">
              <button
                onClick={() => {
                  setLenderDeleteConfirmOpen(false);
                  setLenderToDelete(null);
                }}
                disabled={isDeletingLender}
                className="flex-1 py-[10px] bg-white border border-gray-300 rounded-[10px] text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteLender}
                disabled={isDeletingLender}
                className="flex-1 py-[10px] bg-red-600 text-white hover:bg-red-700 rounded-[10px] text-[12.5px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingLender ? "Deleting..." : "Confirm Delete"}
              </button>
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

      {/* BSA Real-time Log Stream & Progress Stepper Modal */}
      <BsaProgressModal
        isOpen={bsaModalOpen}
        currentStep={bsaModalStep}
        currentMessage={bsaModalMessage}
        logs={bsaModalLogs}
        fileName={selectedBsaFile?.name || "bank_statement.pdf"}
        sessionId={bsaSessionId}
        error={bsaError}
        onClose={() => {
          setBsaModalOpen(false);
          setBsaUploading(false);
        }}
      />
    </div>
  );
}

