import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Phone,
  User,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Calculator,
  Scale,
  Coins,
  CheckCircle2,
  FileText,
  HelpCircle,
  Percent,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowRight,
  Info,
  X
} from "lucide-react";
import { fetchCibilReport, getStoredCibilReport, CibilReport, CibilAccount } from "../services/cibil";
import { isExemptRole, isReportFresh, getNextAvailableFetchDate } from "./EligibilityCibilView";
import { useToast } from "@/hooks/use-toast";
import PolicyModal from "./PolicyModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

 
interface CibilAnalyzerViewProps {
  userId: string;
  userEmail?: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onApplyNow?: (loanType: string, amount: number, rate: number, tenure: number, details?: string) => void;
  onTalkToAdvisor?: () => void;
  overrideReport?: CibilReport | null;
}

interface LenderProduct {
  id: string;
  name: string;
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
  pros: string[];
  cons: string[];
}

export default function CibilAnalyzerView({
  userId,
  userEmail,
  onToggleSidebar,
  onToggleInsights,
  onApplyNow,
  onTalkToAdvisor,
  overrideReport = null
}: CibilAnalyzerViewProps) {
  const { toast } = useToast();
  const analyzerRef = React.useRef<HTMLDivElement>(null);

  // Core CIBIL Report State
  const [report, setReport] = useState<CibilReport | null>(null);
  const [storedReport, setStoredReport] = useState<CibilReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isGeneratingCAM, setIsGeneratingCAM] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // Form inputs
  const [formName, setFormName] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formPan, setFormPan] = useState<string>("");

  // Sub-calculator tab state
  const [activeTab, setActiveTab] = useState<"report" | "emi" | "eligibility" | "compare" | "prepayment">("report");

  // Open accounts filter (Bureau Accounts Summary table)
  const [activeAccountFilter, setActiveAccountFilter] = useState<string | null>(null);

  // Loaders Catalog
  const [lenders, setLenders] = useState<LenderProduct[]>([]);
  const [isLoadingLenders, setIsLoadingLenders] = useState<boolean>(true);

  // --- Sub-Calculator States ---
  // 1. EMI Calculator
  const [emiAmount, setEmiAmount] = useState<string>("500000");
  const [emiRate, setEmiRate] = useState<string>("10.5");
  const [emiTenure, setEmiTenure] = useState<string>("5");

  // 2. Eligibility
  const [eligIncome, setEligIncome] = useState<string>("75000");
  const [eligEmi, setEligEmi] = useState<string>("10000");
  const [eligLoanType, setEligLoanType] = useState<string>("home");
  const [eligTenure, setEligTenure] = useState<string>("20");

  // 3. Compare Loans
  const [compAmountA, setCompAmountA] = useState<string>("1000000");
  const [compRateA, setCompRateA] = useState<string>("9.5");
  const [compTenureA, setCompTenureA] = useState<string>("15");
  const [compAmountB, setCompAmountB] = useState<string>("1000000");
  const [compRateB, setCompRateB] = useState<string>("11.0");
  const [compTenureB, setCompTenureB] = useState<string>("10");

  // 4. Prepayment
  const [prepAmount, setPrepAmount] = useState<string>("500000");
  const [prepRate, setPrepRate] = useState<string>("12.0");
  const [prepTenure, setPrepTenure] = useState<string>("5");
  const [prepExtraPay, setPrepExtraPay] = useState<string>("5000");
  const [prepLumpSum, setPrepLumpSum] = useState<string>("50000");
  const [prepLumpMonth, setPrepLumpMonth] = useState<string>("12");

  // Privacy Policy state
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [activeTermsTab, setActiveTermsTab] = useState<"credit-consent" | "terms-of-use" | "privacy-policy" | "dpdp-notice" | "data-retention">("credit-consent");

  // Fetch initial stored CIBIL report and lenders catalog on mount
  useEffect(() => {
    async function init() {
      if (overrideReport) {
        setStoredReport(overrideReport);
        setReport(overrideReport);
        setIsLoading(false);
        
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
          const res = await fetch(`${apiBase}/lenders`);
          if (res.ok) {
            const data = await res.json();
            setLenders(data);
          }
        } catch (err) {
          console.error("Failed to load lenders catalog:", err);
        } finally {
          setIsLoadingLenders(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const reportData = await getStoredCibilReport(userId);
        if (reportData) {
          setStoredReport(reportData);
          setReport(reportData);
        }
      } catch (err) {
        console.log("No stored CIBIL report found on mount:", err);
      } finally {
        setIsLoading(false);
      }
 
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const res = await fetch(`${apiBase}/lenders`);
        if (res.ok) {
          const data = await res.json();
          setLenders(data);
        }
      } catch (err) {
        console.error("Failed to load lenders catalog:", err);
      } finally {
        setIsLoadingLenders(false);
      }
    }
    init();
  }, [userId, overrideReport]);

  // Cap eligibility EMI at gross income
  useEffect(() => {
    const income = Number(eligIncome) || 0;
    const emi = Number(eligEmi) || 0;
    if (emi > income) {
      setEligEmi(String(income));
    }
  }, [eligIncome, eligEmi]);

  // Phone and PAN input change handlers to strictly enforce formatting rules
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      setFormPhone(val);
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
    setFormPan(formatted);
  };

  // Handle Form Submit
  const handleFetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formName.trim()) {
      toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (formPhone.replace(/\D/g, "").length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formPan.trim())) {
      toast({ title: "Invalid PAN Card", description: "Standard PAN card format is ABCDE1234F.", variant: "destructive" });
      return;
    }

    setIsFetching(true);
    try {
      const result = await fetchCibilReport(userId, formName, formPhone, formPan.toUpperCase());
      setReport(result);
      setStoredReport(result);
      toast({ 
        title: "Report Retrieved!", 
        description: `Successfully fetched credit report. CIBIL Score: ${result.score}`,
        variant: "default"
      });
      // Trigger update event to notify wellness score sidebar
      const event = new CustomEvent("finheal:wellness_update");
      window.dispatchEvent(event);
    } catch (err: any) {
      toast({ 
        title: "Fetch Failed", 
        description: err.message || "Something went wrong fetching your credit profile.", 
        variant: "destructive" 
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerateCAM = async () => {
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

  const handleDownloadPDF = async () => {
    if (!report) return;
    setIsGeneratingPDF(true);
    try {
      const element = analyzerRef.current;
      if (!element) {
        throw new Error("Report element not found in DOM");
      }
      
      // Temporarily mark the container to apply print-hiding styles during pdf render
      element.classList.add("cibil-pdf-downloading");
      
      // Wait for layout reflow to expand scroll height and hide print-hidden elements
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate canvas using html2canvas-pro (which supports oklch)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // A4 dimensions: 210mm x 297mm
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2); // 190mm
      const printableHeight = pdfHeight - margin; // 287mm (prevents 10mm overlap of rows)
      
      // Calculate how the canvas height maps to PDF height
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;
      
      // Page 1
      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= printableHeight;
      
      // Additional pages
      while (heightLeft > 0) {
        position = (heightLeft - imgHeight) + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= printableHeight;
      }
      
      pdf.save(`CIBIL_Analysis_${report.name.replace(/[^a-zA-Z0-9_]/g, "_")}.pdf`);
      
      toast({
        title: "PDF Saved!",
        description: "Your platform credit analysis report has been saved successfully.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast({
        title: "Download Failed",
        description: err.message || "Failed to compile PDF report.",
        variant: "destructive"
      });
    } finally {
      const element = analyzerRef.current;
      if (element) {
        element.classList.remove("cibil-pdf-downloading");
      }
      setIsGeneratingPDF(false);
    }
  };

  // Score Band Color Helper
  const scoreTheme = useMemo(() => {
    if (!report) return { color: "text-gray-400", border: "border-gray-200", bg: "bg-gray-50", fill: "#9ca3af" };
    const score = report.score;
    if (score >= 750) return { color: "text-emerald-500", border: "border-emerald-200", bg: "bg-emerald-50", fill: "#10b981", gradient: "from-emerald-500 to-teal-500" };
    if (score >= 700) return { color: "text-blue-500", border: "border-blue-200", bg: "bg-blue-50", fill: "#3b82f6", gradient: "from-blue-500 to-indigo-500" };
    if (score >= 630) return { color: "text-amber-500", border: "border-amber-200", bg: "bg-amber-50", fill: "#f59e0b", gradient: "from-amber-500 to-orange-500" };
    return { color: "text-rose-500", border: "border-rose-200", bg: "bg-rose-50", fill: "#f43f5e", gradient: "from-rose-500 to-red-500" };
  }, [report]);

  // SVG circular properties for Score Gauge
  const scoreGauge = useMemo(() => {
    if (!report) return { dashArray: 0, dashOffset: 0 };
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    // Map CIBIL score (300-900) to 0-100 percentage
    const pct = Math.max(0, Math.min(100, ((report.score - 300) / 600) * 100));
    const strokeLength = (pct / 100) * circumference;
    const offset = circumference - strokeLength;
    return {
      radius,
      circumference,
      dashArray: circumference,
      dashOffset: offset
    };
  }, [report]);

  // --- Calculations Logic ---
  
  // 1. EMI Calculations
  const emiOutput = useMemo(() => {
    const amt = Number(emiAmount) || 0;
    const rate = Number(emiRate) || 0;
    const tenure = Number(emiTenure) || 1;
    const monthlyRate = rate / 12 / 100;
    const totalMonths = tenure * 12;

    const emi = monthlyRate === 0
      ? amt / totalMonths
      : (amt * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const totalPayable = emi * totalMonths;
    const totalInterest = totalPayable - amt;

    return {
      monthlyPayment: Math.round(emi),
      totalPayable: Math.round(totalPayable),
      totalInterest: Math.round(totalInterest),
    };
  }, [emiAmount, emiRate, emiTenure]);

  // 2. Loan Eligibility Checker using CIBIL & Lenders Catalog
  const eligibilityOutput = useMemo(() => {
    const cibilVal = report ? report.score : 700;
    const income = Number(eligIncome) || 0;
    const existingEmi = Number(eligEmi) || 0;
    const tenure = Number(eligTenure) || 1;

    // Dynamic acceptable FOIR based on gross monthly income
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

    const maxAffordableEmi = Math.max(0, (income * (maxFoirPct / 100)) - existingEmi);
    const foirPct = income > 0 ? ((existingEmi + maxAffordableEmi) / income) * 100 : 0;

    // Filter and map lenders
    const matched = lenders.filter(l => l.category === eligLoanType).map(l => {
      const reasons: string[] = [];
      let eligible = true;

      // Gate 1: CIBIL check
      if (cibilVal < l.minCibil) {
        eligible = false;
        reasons.push(`CIBIL score ${cibilVal} is below lender minimum of ${l.minCibil}`);
      }
      // Gate 2: Income check
      if (income < l.minMonthlyIncome) {
        eligible = false;
        reasons.push(`Monthly income ${income.toLocaleString()} is below lender minimum of ${l.minMonthlyIncome.toLocaleString()}`);
      }
      // Gate 3: Tenure check
      if (tenure > l.maxTenureYears) {
        eligible = false;
        reasons.push(`Tenure exceeds lender max of ${l.maxTenureYears} years`);
      }

      // Calculate maximum eligible loan amount
      const monthlyRate = l.minRate / 12 / 100;
      const totalMonths = tenure * 12;
      let calculatedLimit = 0;
      if (maxAffordableEmi > 0 && monthlyRate > 0) {
        calculatedLimit = (maxAffordableEmi * (Math.pow(1 + monthlyRate, totalMonths) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
      } else if (maxAffordableEmi > 0) {
        calculatedLimit = maxAffordableEmi * totalMonths;
      }
      
      const maxLimit = Math.min(calculatedLimit, l.maxAmount);
      
      if (maxLimit < l.minAmount) {
        eligible = false;
        reasons.push(`Max eligible amount is below lender minimum loan size of ${l.minAmount.toLocaleString()}`);
      }

      // Likelihood rating
      let likelihood: "High" | "Medium" | "Low" | "Ineligible" = "Ineligible";
      if (!eligible) {
        likelihood = "Ineligible";
      } else {
        const scoreDiff = cibilVal - l.minCibil;
        if (scoreDiff >= 50 && foirPct < 45) likelihood = "High";
        else if (scoreDiff >= 20) likelihood = "Medium";
        else likelihood = "Low";
      }

      return {
        lender: l,
        eligibleLimit: eligible ? Math.round(maxLimit) : 0,
        likelihood,
        reasons
      };
    });

    // Sort: High likelihood first, ineligible last
    const sorted = [...matched].sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2, Ineligible: 3 };
      return order[a.likelihood] - order[b.likelihood];
    });

    return {
      maxAffordableEmi: Math.round(maxAffordableEmi),
      foirPct: Math.round(foirPct),
      offers: sorted,
      maxFoirPct
    };
  }, [report, lenders, eligIncome, eligEmi, eligLoanType, eligTenure]);

  // 3. Comparison Output
  const comparisonOutput = useMemo(() => {
    const calculateEmi = (amt: number, rate: number, tenure: number) => {
      const monthlyRate = rate / 12 / 100;
      const totalMonths = tenure * 12;
      const emi = monthlyRate === 0
        ? amt / totalMonths
        : (amt * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      return {
        emi: Math.round(emi),
        totalPayable: Math.round(emi * totalMonths),
        totalInterest: Math.round((emi * totalMonths) - amt)
      };
    };

    const loanA = calculateEmi(Number(compAmountA) || 0, Number(compRateA) || 0, Number(compTenureA) || 1);
    const loanB = calculateEmi(Number(compAmountB) || 0, Number(compRateB) || 0, Number(compTenureB) || 1);

    return {
      loanA,
      loanB,
      emiDiff: Math.abs(loanA.emi - loanB.emi),
      interestDiff: Math.abs(loanA.totalInterest - loanB.totalInterest),
      bestLoan: loanA.totalPayable < loanB.totalPayable ? "Loan A" : "Loan B"
    };
  }, [compAmountA, compRateA, compTenureA, compAmountB, compRateB, compTenureB]);

  // 4. Prepayment Output
  const prepaymentOutput = useMemo(() => {
    const amt = Number(prepAmount) || 0;
    const rate = Number(prepRate) || 0;
    const tenure = Number(prepTenure) || 1;
    const extraEmi = Number(prepExtraPay) || 0;
    const lumpSum = Number(prepLumpSum) || 0;
    const lumpMonth = Number(prepLumpMonth) || 0;

    const monthlyRate = rate / 12 / 100;
    const totalMonths = tenure * 12;
    const standardEmi = monthlyRate === 0
      ? amt / totalMonths
      : (amt * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const standardTotalInterest = (standardEmi * totalMonths) - amt;

    // Simulate prepayment path
    let balance = amt;
    let monthsElapsed = 0;
    let prepaidInterestPaid = 0;

    while (balance > 0 && monthsElapsed < 600) {
      monthsElapsed += 1;
      const interestForMonth = balance * monthlyRate;
      let principalForMonth = standardEmi - interestForMonth;

      // Add extra monthly prepayment
      principalForMonth += extraEmi;

      // Add lumpsum payment if active month
      if (monthsElapsed === lumpMonth) {
        principalForMonth += lumpSum;
      }

      if (balance <= principalForMonth) {
        prepaidInterestPaid += interestForMonth;
        balance = 0;
      } else {
        prepaidInterestPaid += interestForMonth;
        balance -= principalForMonth;
      }
    }

    const interestSaved = Math.max(0, standardTotalInterest - prepaidInterestPaid);
    const monthsSaved = Math.max(0, totalMonths - monthsElapsed);
    const tenureReductionYears = (monthsSaved / 12).toFixed(1);

    return {
      standardEmi: Math.round(standardEmi),
      standardInterest: Math.round(standardTotalInterest),
      prepaidInterest: Math.round(prepaidInterestPaid),
      interestSaved: Math.round(interestSaved),
      monthsSaved,
      tenureReductionYears,
      monthsElapsed
    };
  }, [prepAmount, prepRate, prepTenure, prepExtraPay, prepLumpSum, prepLumpMonth]);

  // Loading state skeleton
  if (isLoading) {
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
    <div ref={analyzerRef} className="cibil-view flex h-full w-full flex-col overflow-hidden bg-gray-50 lg:rounded-[20px] lg:border lg:border-gray-200 cibil-print-section">
      
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-[20px] py-[16px] shrink-0">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={onToggleSidebar}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-gray-50 hover:bg-gray-100 lg:hidden cursor-pointer"
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
          <div className="w-[36px] h-[36px] rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
            <CreditCard className="w-[20px] h-[20px]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-bold text-gray-800 tracking-tight">CIBIL Bureau Analyzer</h1>
              {report && (
                <span className="text-[11px] bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full inline-block cibil-pdf-only-name">
                  {report.name}
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]">Official Credit Diagnostic Toolkit</p>
          </div>
        </div>
        
        {/* Download Analysis Button */}
        {report && (
          <div className="shrink-0 cibil-print-hide">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-[6px] bg-primary hover:bg-opacity-95 text-white px-[16px] py-[8px] rounded-[12px] text-[12px] font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-none bg-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FileText className="w-[14px] h-[14px]" />
              <span>{isGeneratingPDF ? "Downloading..." : "Download Analysis"}</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-[20px] min-h-0 cibil-print-scrollable">        {!report ? (
          // State A: Form to retrieve CIBIL Report
          <div className="mx-auto max-w-[520px] my-[24px]">
            <div className="rounded-[20px] border border-gray-200 bg-white p-[28px] shadow-lg relative overflow-hidden">
              {/* Premium top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-primary via-[#4a5cf0] to-[#6366f1]" />
              
              {storedReport && isReportFresh(storedReport.fetched_at) && !isExemptRole(userEmail, storedReport.name) ? (
                <div className="text-center py-4">
                  <div className="mx-auto w-[44px] h-[44px] rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-3">
                    <Lock className="w-[20px] h-[20px]" />
                  </div>
                  <h2 className="text-[18px] font-bold text-gray-800">Credit Report Fetch Locked</h2>
                  <div className="my-4 p-4 rounded-[14px] bg-amber-50 border border-amber-220 text-amber-900 text-left">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12.5px] leading-normal text-amber-700 font-semibold">
                          You have fetched your credit report recently (on {new Date(storedReport.fetched_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}).
                          To manage bureau API limits and cost, you can only fetch a fresh report once every 30 days.
                          You will be able to retrieve a fresh refresh on <strong>{getNextAvailableFetchDate(storedReport.fetched_at)}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReport(storedReport)}
                    className="w-full bg-primary text-white font-bold py-2.5 rounded-[10px] hover:opacity-95 transition-all cursor-pointer shadow-md shadow-primary/10"
                  >
                    View Stored Report
                  </button>
                </div>
              ) : (
                <>

                  <div className="text-center mb-[24px]">
                    <div className="mx-auto w-[44px] h-[44px] rounded-full bg-primary/10 flex items-center justify-center text-primary mb-[10px]">
                      <Lock className="w-[20px] h-[20px]" />
                    </div>
                    <h2 className="text-[18px] font-bold text-gray-800">Check Your Official CIBIL Score</h2>
                    <p className="text-[13px] text-gray-500 mt-[4px]">Retrieve your actual credit report securely from the bureau.</p>
                  </div>

                  {isFetching ? (
                    <div className="flex flex-col items-center justify-center py-[48px] gap-[16px]">
                      <div className="relative flex items-center justify-center">
                        <div className="h-[72px] w-[72px] animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <CreditCard className="w-[24px] h-[24px] text-primary absolute animate-bounce" />
                      </div>
                      <div className="text-center">
                        <p className="text-[14px] font-bold text-gray-700">Verifying Identity & PAN...</p>
                        <p className="text-[12px] text-gray-400 mt-[2px] animate-pulse">Retrieving encrypted credit data from CIBIL bureau</p>
                      </div>
                    </div>
                  ) : (
                    <TooltipProvider delayDuration={0}>
                      <form onSubmit={handleFetchReport} className="space-y-[18px]">
                        <div>
                          <label className="text-[12px] font-bold text-gray-700 uppercase block mb-[6px]">Full Name (as on PAN Card)</label>
                          <div className="relative">
                            <User className="absolute left-[12px] top-[10px] w-[16px] h-[16px] text-gray-400" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <input
                                  type="text"
                                  required
                                  value={formName}
                                  onChange={(e) => setFormName(e.target.value)}
                                  placeholder="e.g. Rahul Sharma"
                                  className="w-full pl-[36px] pr-[12px] py-[8px] border border-gray-300 rounded-[10px] text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                          <div>
                            <label className="text-[12px] font-bold text-gray-700 uppercase block mb-[6px]">Mobile Number</label>
                            <div className="relative">
                              <Phone className="absolute left-[12px] top-[10px] w-[16px] h-[16px] text-gray-400" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="tel"
                                    required
                                    value={formPhone}
                                    onChange={handlePhoneChange}
                                    placeholder="e.g. 9876543210"
                                    className="w-full pl-[36px] pr-[12px] py-[8px] border border-gray-300 rounded-[10px] text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                          <div>
                            <label className="text-[12px] font-bold text-gray-700 uppercase block mb-[6px]">PAN Card Number</label>
                            <div className="relative">
                              <FileText className="absolute left-[12px] top-[10px] w-[16px] h-[16px] text-gray-400" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="text"
                                    required
                                    value={formPan}
                                    onChange={handlePanChange}
                                    placeholder="e.g. AAAAA1111B"
                                    className="w-full pl-[36px] pr-[12px] py-[8px] border border-gray-300 rounded-[10px] text-[13px] uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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

                      <div className="flex items-start gap-[10px] my-[12px] text-left">
                        <input
                          type="checkbox"
                          id="cibil-privacy-policy"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-[2px] h-[16px] w-[16px] rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <label htmlFor="cibil-privacy-policy" className="text-[11px] text-gray-500 leading-normal cursor-pointer select-none">
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
                        disabled={!agreedToTerms}
                        className={`w-full bg-primary text-white font-bold py-[10px] rounded-[10px] transition-all text-[13px] flex items-center justify-center gap-[8px] shadow-md ${
                          agreedToTerms ? "hover:opacity-95 cursor-pointer" : "opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <Sparkles className="w-[16px] h-[16px]" />
                        <span>Download CIBIL Credit Report</span>
                      </button>

                      {/* Encryption trust badge */}
                      <div className="flex items-center justify-center gap-[6px] text-[11px] text-gray-400 mt-[12px]">
                        <ShieldCheck className="w-[12px] h-[12px] text-emerald-500" />
                        <span>256-bit SSL encrypted connection. Your data remains strictly confidential.</span>
                      </div>
                    </form>
                  </TooltipProvider>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          // State B: CIBIL Report Dashboard + Loan Toolkit
          <div className="space-y-[24px]">
            {/* CIBIL Score Summary card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
              
              {/* Score Gauge Card */}
              <div className="lg:col-span-1 rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="flex justify-between items-center w-full mb-3 shrink-0">
                  <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.8px]">Credit Score Bureau</h3>
                  {(() => {
                    const fresh = isReportFresh(report?.fetched_at);
                    const exempt = isExemptRole(userEmail, report?.name);
                    
                    if (fresh && !exempt) {
                      const nextDate = getNextAvailableFetchDate(report?.fetched_at);
                      return (
                        <span className="text-[9.5px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-[5px] font-semibold font-sans" title={`Next update available on ${nextDate}`}>
                          Next update: {nextDate}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {/* SVG circular gauge */}
                <div className="relative w-[180px] h-[180px] flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                      cx="90"
                      cy="90"
                      r={scoreGauge.radius}
                      stroke="#f3f4f6"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Foreground Score Ring */}
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
                  
                  {/* Score details centered */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[36px] font-black text-gray-800 leading-none">{report.score}</span>
                    <span className={`text-[13px] font-bold mt-[6px] px-[12px] py-[3px] rounded-[20px] ${scoreTheme.bg} ${scoreTheme.color} border ${scoreTheme.border}`}>
                      {report.band}
                    </span>
                  </div>
                </div>
                
                <p className="text-[11px] text-gray-400 mt-[12px]">PAN: {report.pan} | Phone: {report.phone}</p>
                <p className="text-[10px] text-gray-400 mt-[2px]">Fetched at {new Date(report.fetched_at).toLocaleDateString()}</p>
                {report.pdf_url && (
                  <a
                    href={report.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-[14px] flex items-center justify-center gap-[6px] bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold px-[16px] py-[8px] rounded-[10px] shadow-sm transition-all cursor-pointer w-full cibil-print-hide"
                  >
                    <FileText className="w-[14px] h-[14px]" />
                    <span>Download PDF Report</span>
                  </a>
                )}
                
                <button
                  onClick={handleGenerateCAM}
                  disabled={isGeneratingCAM}
                  className="mt-[8px] flex items-center justify-center gap-[6px] bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold px-[16px] py-[8px] rounded-[10px] shadow-sm transition-all cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed cibil-print-hide"
                >
                  <FileText className="w-[14px] h-[14px]" />
                  <span>{isGeneratingCAM ? "Generating CAM..." : "Generate CAM Report 📊"}</span>
                </button>
              </div>

              {/* Core Factors Card */}
              <div className="lg:col-span-2 rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm flex flex-col">
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.8px] mb-[16px]">Key Credit Impact Factors</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] flex-1">
                  <FactorCard
                    label="Payment History"
                    value={`${report.metrics.payment_on_time_pct}%`}
                    subtext="On-time payments"
                    status={report.metrics.payment_on_time_pct >= 95 ? "Excellent" : report.metrics.payment_on_time_pct >= 90 ? "Good" : "Poor"}
                  />
                  <FactorCard
                    label="Credit Utilization"
                    value={`${report.metrics.credit_utilization_pct}%`}
                    subtext="Of limit utilized"
                    status={report.metrics.credit_utilization_pct <= 30 ? "Excellent" : report.metrics.credit_utilization_pct <= 50 ? "Good" : "Poor"}
                  />
                  <FactorCard
                    label="Credit Age"
                    value={`${report.metrics.credit_history_age_years} yrs`}
                    subtext="Credit vintage"
                    status={report.metrics.credit_history_age_years >= 5 ? "Excellent" : report.metrics.credit_history_age_years >= 3 ? "Good" : "Poor"}
                  />
                  <FactorCard
                    label="Recent Enquiries"
                    value={String(report.metrics.enquiries_l6m)}
                    subtext="Bureau queries"
                    status={report.metrics.enquiries_l6m <= 1 ? "Excellent" : report.metrics.enquiries_l6m <= 3 ? "Good" : "Poor"}
                  />
                </div>
                
                <div className="mt-[16px] bg-gray-50 border border-gray-100 rounded-[12px] p-[12px] flex items-start gap-[8px] text-[12px] text-gray-600">
                  <Info className="w-[16px] h-[16px] text-primary shrink-0 mt-[1px]" />
                  <span>The CIBIL score is computed from your payment history (35%), credit utilization (30%), history age (15%), and credit mix/recent inquiries (20%).</span>
                </div>
              </div>
            </div>

            {/* Credit Toolkit Navigation Tabs */}
            <div className="border-b border-gray-200 cibil-print-hide">
              <nav className="flex space-x-[8px] overflow-x-auto pb-[2px]">
                <TabButton active={activeTab === "report"} onClick={() => setActiveTab("report")} icon={<FileText className="w-[14px] h-[14px]" />} label="Credit Report" />
                <TabButton active={activeTab === "emi"} onClick={() => setActiveTab("emi")} icon={<Calculator className="w-[14px] h-[14px]" />} label="EMI Calculator" />
                <TabButton active={activeTab === "eligibility"} onClick={() => setActiveTab("eligibility")} icon={<CheckCircle2 className="w-[14px] h-[14px]" />} label="Eligibility Check" />
                <TabButton active={activeTab === "compare"} onClick={() => setActiveTab("compare")} icon={<Scale className="w-[14px] h-[14px]" />} label="Compare Loans" />
                <TabButton active={activeTab === "prepayment"} onClick={() => setActiveTab("prepayment")} icon={<Coins className="w-[14px] h-[14px]" />} label="Prepayment Planner" />
              </nav>
            </div>

            {/* TAB CONTENTS */}
            <div className="min-h-[300px]">
              
              {/* Tab 1: Credit Report & Tips */}
              {activeTab === "report" && (() => {
                // Compute open accounts grouped by display category
                const openAccounts = report.accounts.filter(a => a.is_active);
                const closedCount = report.accounts.length - openAccounts.length;

                const CATEGORY_DEFS: { key: string; label: string; short: string; color: string; bg: string; border: string }[] = [
                  { key: "Credit Card",       label: "Credit Card",       short: "CC",  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
                  { key: "Personal Loan",     label: "Personal Loan",     short: "PL",  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
                  { key: "Business Loan",     label: "Business Loan",     short: "BL",  color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200" },
                  { key: "Auto Loan",         label: "Auto / Vehicle",    short: "AL",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
                  { key: "Overdraft",         label: "Overdraft",         short: "OD",  color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
                  { key: "Professional Loan", label: "Professional Loan", short: "PrL", color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200" },
                  { key: "Housing Loan",      label: "Housing Loan",      short: "HL",  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
                  { key: "Consumer Loan",     label: "Consumer Loan",     short: "CL",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
                  { key: "Other",             label: "Other Loans",       short: "OL",  color: "text-gray-700",    bg: "bg-gray-100",   border: "border-gray-300" },
                ];

                const categoryKey = (type: string): string => {
                  const t = type.toLowerCase();
                  if (t.includes("credit card"))   return "Credit Card";
                  if (t.includes("personal loan")) return "Personal Loan";
                  if (t.includes("business loan")) return "Business Loan";
                  if (t.includes("auto") || t.includes("vehicle") || t.includes("two wheeler")) return "Auto Loan";
                  if (t.includes("overdraft"))     return "Overdraft";
                  if (t.includes("professional"))  return "Professional Loan";
                  if (t.includes("housing") || t.includes("home loan")) return "Housing Loan";
                  if (t.includes("consumer"))      return "Consumer Loan";
                  return "Other";
                };

                const categoryCounts: Record<string, number> = {};
                const categoryAccounts: Record<string, typeof openAccounts> = {};
                for (const acc of openAccounts) {
                  const k = categoryKey(acc.type);
                  categoryCounts[k] = (categoryCounts[k] || 0) + 1;
                  if (!categoryAccounts[k]) categoryAccounts[k] = [];
                  categoryAccounts[k].push(acc);
                }

                const filteredAccounts = activeAccountFilter ? (categoryAccounts[activeAccountFilter] || []) : openAccounts;

                return (
                  <div className="space-y-[20px]">

                    {/* ── Bureau Open Accounts Summary Table ── */}
                    <div className="rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm">
                      <div className="flex items-center justify-between mb-[14px]">
                        <div>
                          <h3 className="text-[13px] font-bold text-gray-800">Bureau Open Accounts Summary</h3>
                          <p className="text-[11px] text-gray-400 mt-[1px]">
                            {openAccounts.length} open · {closedCount} closed · {report.accounts.length} total accounts on file
                          </p>
                        </div>
                        {report.pdf_url && (
                          <a
                            href={report.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-[10px] py-[4px] rounded-[8px] font-bold flex items-center gap-[4px] hover:bg-primary/20 transition-all cursor-pointer shrink-0 cibil-print-hide"
                          >
                            <FileText className="w-[12px] h-[12px]" />
                            <span>PDF Report</span>
                          </a>
                        )}
                      </div>

                      {/* Category chips / filter row */}
                      <div className="flex flex-wrap gap-[8px] mb-[16px] cibil-print-hide">
                        <button
                          onClick={() => setActiveAccountFilter(null)}
                          className={`px-[12px] py-[5px] rounded-[10px] text-[11px] font-bold border transition-all cursor-pointer ${
                            activeAccountFilter === null
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          All Open ({openAccounts.length})
                        </button>
                        {CATEGORY_DEFS.filter(def => (categoryCounts[def.key] || 0) > 0).map(def => (
                          <button
                            key={def.key}
                            onClick={() => setActiveAccountFilter(activeAccountFilter === def.key ? null : def.key)}
                            className={`px-[12px] py-[5px] rounded-[10px] text-[11px] font-bold border transition-all cursor-pointer ${
                              activeAccountFilter === def.key
                                ? `${def.bg} ${def.color} ${def.border} shadow-sm`
                                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {def.label} ({categoryCounts[def.key] || 0})
                          </button>
                        ))}
                      </div>

                      {/* Summary grid table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px] border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-y border-gray-100">
                              <th className="text-left px-[12px] py-[8px] font-bold text-gray-500 text-[11px] uppercase tracking-[0.5px]">Category</th>
                              <th className="text-center px-[12px] py-[8px] font-bold text-gray-500 text-[11px] uppercase tracking-[0.5px]">Open A/C</th>
                              <th className="text-right px-[12px] py-[8px] font-bold text-gray-500 text-[11px] uppercase tracking-[0.5px]">Total Outstanding</th>
                            </tr>
                          </thead>
                          <tbody>
                            {CATEGORY_DEFS.filter(def => (categoryCounts[def.key] || 0) > 0).map((def, idx) => {
                              const accs = categoryAccounts[def.key] || [];
                              const totalOutstanding = accs.reduce((sum, a) => sum + a.outstanding_balance, 0);
                              return (
                                <tr
                                  key={def.key}
                                  onClick={() => setActiveAccountFilter(activeAccountFilter === def.key ? null : def.key)}
                                  className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50/70 ${
                                    activeAccountFilter === def.key ? def.bg : ""
                                  }`}
                                >
                                  <td className="px-[12px] py-[10px]">
                                    <div className="flex items-center gap-[8px]">
                                      <span className={`text-[10px] font-bold px-[6px] py-[2px] rounded-[6px] ${def.bg} ${def.color} ${def.border} border`}>
                                        {def.short}
                                      </span>
                                      <span className={`font-semibold ${ activeAccountFilter === def.key ? def.color : "text-gray-700"}`}>{def.label}</span>
                                    </div>
                                  </td>
                                  <td className="px-[12px] py-[10px] text-center">
                                    <span className={`text-[14px] font-black ${ activeAccountFilter === def.key ? def.color : "text-gray-800"}`}>
                                      {categoryCounts[def.key] || 0}
                                    </span>
                                  </td>
                                  <td className="px-[12px] py-[10px] text-right font-semibold text-gray-700">
                                    ₹{totalOutstanding.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Totals row */}
                            <tr className="bg-gray-50 font-bold">
                              <td className="px-[12px] py-[10px] text-gray-800">Total Open Accounts</td>
                              <td className="px-[12px] py-[10px] text-center text-[14px] font-black text-primary">{openAccounts.length}</td>
                              <td className="px-[12px] py-[10px] text-right text-gray-800">
                                ₹{openAccounts.reduce((s, a) => s + a.outstanding_balance, 0).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── Filtered Account Detail Cards ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">

                      {/* Account list (filtered) */}
                      <div className="lg:col-span-2">
                        <div className="rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm">
                          <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.5px] mb-[12px]">
                            {activeAccountFilter ? `${activeAccountFilter} — Open Accounts (${filteredAccounts.length})` : `All Open Accounts (${openAccounts.length})`}
                          </h4>

                          {filteredAccounts.length === 0 ? (
                            <div className="py-[32px] text-center text-gray-400 text-[13px]">
                              No open accounts found for this category.
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {filteredAccounts.map((acc, index) => (
                                <div key={index} className="py-[12px] flex items-center justify-between first:pt-0 last:pb-0">
                                  <div>
                                    <div className="flex items-center gap-[6px]">
                                      <h4 className="text-[13px] font-bold text-gray-800">{acc.lender}</h4>
                                      <span className="text-[10px] font-semibold px-[6px] py-[1.5px] rounded-[8px] bg-emerald-50 text-emerald-700">
                                        Active
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-[2px]">
                                      {acc.type}
                                      {acc.open_date ? ` | Opened: ${new Date(acc.open_date).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}` : ""}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[13px] font-extrabold text-gray-800">₹{acc.outstanding_balance.toLocaleString()}</div>
                                    <div className="flex items-center gap-[4px] justify-end mt-[2px]">
                                      <span className={`w-[6px] h-[6px] rounded-full ${acc.payment_status.includes("Past Due") ? "bg-rose-500" : "bg-emerald-500"}`} />
                                      <span className={`text-[11px] font-medium ${acc.payment_status.includes("Past Due") ? "text-rose-600" : "text-gray-500"}`}>
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

                      {/* AI Recommendations */}
                      <div className="lg:col-span-1">
                        <div className="rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm relative overflow-hidden h-full">
                          <div className="absolute -right-[20px] -bottom-[20px] w-[110px] h-[110px] rounded-full bg-primary/5" />
                          
                          <div className="flex items-center gap-[8px] mb-[14px]">
                            <Sparkles className="w-[18px] h-[18px] text-primary" />
                            <h3 className="text-[13px] font-bold text-gray-800">FinHeal AI Recommendations</h3>
                          </div>

                          <div className="space-y-[12px] relative z-10">
                            {report.tips.map((tip, idx) => (
                              <div key={idx} className="flex gap-[8px] text-[12px] text-gray-600 bg-gray-55/40 border border-gray-100 rounded-[12px] p-[10px]">
                                <span className="text-primary font-bold">{idx + 1}.</span>
                                <p className="leading-relaxed">{tip}</p>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={onTalkToAdvisor}
                            className="mt-[20px] w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-[9px] rounded-[10px] text-[12px] transition-all flex items-center justify-center gap-[6px] border border-gray-200 cursor-pointer"
                          >
                            Talk to Credit Score Repair Expert
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Tab 2: EMI Calculator */}
              {activeTab === "emi" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] rounded-[20px] border border-gray-200 bg-white p-[24px] shadow-sm">
                  
                  {/* Inputs */}
                  <div className="space-y-[20px]">
                    <h3 className="text-[14px] font-bold text-gray-800">EMI Calculator</h3>
                    
                    <div>
                      <div className="flex justify-between text-[12px] font-semibold text-gray-600 mb-[6px]">
                        <span>Loan Amount</span>
                        <span className="text-primary font-bold">₹{Number(emiAmount).toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="20000000"
                        step="25000"
                        value={emiAmount}
                        onChange={(e) => setEmiAmount(e.target.value)}
                        className="w-full accent-primary h-[4px] rounded-lg bg-gray-200"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-[4px]">
                        <span>₹50K</span>
                        <span>₹2 Cr</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-[16px]">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 uppercase block mb-[6px]">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="5"
                          max="25"
                          value={emiRate}
                          onChange={(e) => setEmiRate(e.target.value)}
                          className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 uppercase block mb-[6px]">Tenure (Years)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={emiTenure}
                          onChange={(e) => setEmiTenure(e.target.value)}
                          className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[13px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Outputs */}
                  <div className="bg-gray-50 border border-gray-100 rounded-[16px] p-[20px] flex flex-col justify-between">
                    <div>
                      <div className="text-center py-[10px] border-b border-gray-200/60 mb-[16px]">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Your Monthly EMI</span>
                        <div className="text-[32px] font-black text-primary mt-[2px]">₹{emiOutput.monthlyPayment.toLocaleString()}</div>
                      </div>

                      <div className="space-y-[8px]">
                        <div className="flex justify-between text-[12px] text-gray-600">
                          <span>Principal Loan Amount:</span>
                          <span className="font-semibold text-gray-800">₹{Number(emiAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[12px] text-gray-600">
                          <span>Total Interest Payable:</span>
                          <span className="font-semibold text-gray-800">₹{emiOutput.totalInterest.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[12px] text-gray-600 border-t border-gray-200/40 pt-[8px] mt-[8px]">
                          <span>Total Amount Payable:</span>
                          <span className="font-bold text-gray-800">₹{emiOutput.totalPayable.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onApplyNow?.("general", Number(emiAmount), Number(emiRate), Number(emiTenure))}
                      className="w-full bg-primary text-white font-bold py-[10px] rounded-[10px] text-[12px] hover:opacity-95 transition-all mt-[16px] cursor-pointer"
                    >
                      Apply for this Loan via Chat
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Eligibility Checker */}
              {activeTab === "eligibility" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
                  
                  {/* Left Side: Inputs */}
                  <div className="lg:col-span-1 rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm space-y-[18px]">
                    <h3 className="text-[14px] font-bold text-gray-800">Eligibility Criteria</h3>
                    
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 uppercase block mb-[4px]">Loan Category</label>
                      <select
                        value={eligLoanType}
                        onChange={(e) => setEligLoanType(e.target.value)}
                        className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px] focus:outline-none focus:border-primary"
                      >
                        <option value="home">🏠 Home Loan</option>
                        <option value="personal">💳 Personal Loan</option>
                        <option value="business">💼 Business Loan</option>
                        <option value="lap">🏢 Loan Against Property</option>
                        <option value="education">🎓 Education Loan</option>
                        <option value="professional">🩺 Professional Loan</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-[4px]">
                        <span>Monthly Gross Income</span>
                        <span className="text-primary font-bold">₹{Number(eligIncome).toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="500000"
                        step="5000"
                        value={eligIncome}
                        onChange={(e) => setEligIncome(e.target.value)}
                        className="w-full accent-primary h-[4px]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-[4px]">
                        <span>Existing Monthly EMIs</span>
                        <span className="text-primary font-bold">₹{Number(eligEmi).toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Number(eligIncome) || 0}
                        step="2500"
                        value={eligEmi}
                        onChange={(e) => setEligEmi(e.target.value)}
                        className="w-full accent-primary h-[4px]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600 uppercase block mb-[6px]">Tenure (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={eligTenure}
                        onChange={(e) => setEligTenure(e.target.value)}
                        className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                      />
                    </div>

                    {/* FOIR status meter */}
                    <div className="pt-[10px] border-t border-gray-100">
                      <div className="flex justify-between text-[12px] text-gray-600 mb-[4px]">
                        <span>Obligation Ratio (FOIR):</span>
                        <span className={`font-bold ${eligibilityOutput.foirPct > 45 ? "text-rose-500" : "text-emerald-500"}`}>
                          {eligibilityOutput.foirPct}%
                        </span>
                      </div>
                      <div className="h-[4px] bg-gray-200 rounded-[4px] overflow-hidden">
                        <div 
                          className={`h-full ${eligibilityOutput.foirPct > 45 ? "bg-rose-500" : "bg-emerald-500"}`} 
                          style={{ width: `${Math.min(eligibilityOutput.foirPct, 100)}%` }} 
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-[2px] block">Lenders prefer FOIR ratio below {eligibilityOutput.maxFoirPct}%</span>
                    </div>
                  </div>

                  {/* Right Side: Matched Offers */}
                  <div className="lg:col-span-2 rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm">
                    <div className="flex items-center justify-between mb-[14px]">
                      <h3 className="text-[13px] font-bold text-gray-800">Lender Approval Matching Engine</h3>
                      <span className="text-[11px] text-gray-400 font-semibold">CIBIL score tied: {report.score}</span>
                    </div>

                    {isLoadingLenders ? (
                      <div className="text-center py-[48px] text-gray-400">Loading catalog offers...</div>
                    ) : eligibilityOutput.offers.length === 0 ? (
                      <div className="text-center py-[48px] text-gray-400">No lenders registered for this category.</div>
                    ) : (
                      <div className="space-y-[12px]">
                        {eligibilityOutput.offers.map((off, idx) => (
                          <div key={idx} className={`border rounded-[14px] p-[14px] flex flex-col sm:flex-row sm:items-center justify-between transition-all hover:bg-gray-55 ${off.likelihood === "Ineligible" ? "border-gray-100 opacity-60" : "border-gray-200"}`}>
                            <div>
                              <div className="flex items-center gap-[8px]">
                                <h4 className="text-[13px] font-bold text-gray-800">{off.lender.name}</h4>
                                <span className={`text-[10px] font-bold px-[8px] py-[2px] rounded-[10px] border ${
                                  off.likelihood === "High" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  off.likelihood === "Medium" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                  off.likelihood === "Low" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                  "bg-rose-50 text-rose-700 border-rose-100"
                                }`}>
                                  {off.likelihood} Odds
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-[2px]">Rates: {off.lender.minRate}% - {off.lender.maxRate}%</p>
                              
                              {/* Reasons list for poor/ineligible cards */}
                              {off.reasons.length > 0 && (
                                <div className="mt-[6px] space-y-[2px]">
                                  {off.reasons.map((r, i) => (
                                    <p key={i} className="text-[10px] text-rose-500 font-medium flex items-center gap-[4px]">
                                      <AlertCircle className="w-[10px] h-[10px] shrink-0" />
                                      <span>{r}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="text-left sm:text-right mt-[8px] sm:mt-0">
                              <span className="text-[11px] text-gray-400 block font-medium">Eligible Loan Limit</span>
                              <div className="text-[15px] font-black text-gray-800">
                                {off.likelihood === "Ineligible" ? "₹0" : `₹${off.eligibleLimit.toLocaleString()}`}
                              </div>
                              
                              {off.likelihood !== "Ineligible" && (
                                <button
                                  onClick={() => onApplyNow?.(off.lender.category, off.eligibleLimit, off.lender.minRate, Number(eligTenure), `Approved offer with ${off.lender.name}`)}
                                  className="mt-[6px] bg-primary hover:opacity-95 text-white font-bold px-[12px] py-[4px] rounded-[8px] text-[11px] cursor-pointer"
                                >
                                  Apply Now
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Compare Loans */}
              {activeTab === "compare" && (
                <div className="space-y-[20px]">
                  
                  {/* Sliding Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
                    {/* Loan A */}
                    <div className="rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm space-y-[12px]">
                      <h4 className="text-[13px] font-bold text-gray-800 border-b border-gray-100 pb-[8px]">Loan Offer A</h4>
                      
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-600 mb-[4px]">
                          <span>Loan Amount</span>
                          <span className="font-bold text-primary">₹{Number(compAmountA).toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="50000"
                          max="10000000"
                          step="50000"
                          value={compAmountA}
                          onChange={(e) => setCompAmountA(e.target.value)}
                          className="w-full accent-primary h-[3px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-[12px]">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={compRateA}
                            onChange={(e) => setCompRateA(e.target.value)}
                            className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">Tenure (Yrs)</label>
                          <input
                            type="number"
                            value={compTenureA}
                            onChange={(e) => setCompTenureA(e.target.value)}
                            className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Loan B */}
                    <div className="rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm space-y-[12px]">
                      <h4 className="text-[13px] font-bold text-gray-800 border-b border-gray-100 pb-[8px]">Loan Offer B</h4>
                      
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-600 mb-[4px]">
                          <span>Loan Amount</span>
                          <span className="font-bold text-primary">₹{Number(compAmountB).toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="50000"
                          max="10000000"
                          step="50000"
                          value={compAmountB}
                          onChange={(e) => setCompAmountB(e.target.value)}
                          className="w-full accent-primary h-[3px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-[12px]">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={compRateB}
                            onChange={(e) => setCompRateB(e.target.value)}
                            className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">Tenure (Yrs)</label>
                          <input
                            type="number"
                            value={compTenureB}
                            onChange={(e) => setCompTenureB(e.target.value)}
                            className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Output Card */}
                  <div className="rounded-[20px] border border-gray-200 bg-white p-[20px] shadow-sm">
                    <h4 className="text-[13px] font-bold text-gray-800 mb-[14px]">Comparison Breakdown</h4>
                    
                    <div className="grid grid-cols-3 gap-[10px] text-center border-b border-gray-100 pb-[10px] mb-[10px] text-[12px] font-semibold text-gray-500">
                      <div>Metric</div>
                      <div>Loan Offer A</div>
                      <div>Loan Offer B</div>
                    </div>

                    <div className="space-y-[10px] text-center text-[13px]">
                      <div className="grid grid-cols-3 gap-[10px] py-[6px] border-b border-gray-55 items-center">
                        <div className="text-left font-medium text-gray-500">Monthly EMI</div>
                        <div className="font-extrabold text-gray-800">₹{comparisonOutput.loanA.emi.toLocaleString()}</div>
                        <div className="font-extrabold text-gray-800">₹{comparisonOutput.loanB.emi.toLocaleString()}</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-[10px] py-[6px] border-b border-gray-55 items-center">
                        <div className="text-left font-medium text-gray-500">Total Interest</div>
                        <div className="font-bold text-gray-700">₹{comparisonOutput.loanA.totalInterest.toLocaleString()}</div>
                        <div className="font-bold text-gray-700">₹{comparisonOutput.loanB.totalInterest.toLocaleString()}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-[10px] py-[6px] border-b border-gray-55 items-center">
                        <div className="text-left font-medium text-gray-500">Total Outflow</div>
                        <div className="font-bold text-gray-700">₹{comparisonOutput.loanA.totalPayable.toLocaleString()}</div>
                        <div className="font-bold text-gray-700">₹{comparisonOutput.loanB.totalPayable.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* AI Recommendation Decision */}
                    <div className="mt-[16px] bg-primary/5 border border-primary/10 rounded-[14px] p-[14px] flex items-center justify-between">
                      <div className="flex items-center gap-[8px]">
                        <Sparkles className="w-[18px] h-[18px] text-primary shrink-0 animate-bounce" />
                        <div>
                          <p className="text-[12px] text-gray-600 font-medium">FinHeal AI analysis shows:</p>
                          <p className="text-[14px] font-black text-gray-800">
                            {comparisonOutput.bestLoan} saves you ₹{comparisonOutput.interestDiff.toLocaleString()} in interest outflow!
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          const isA = comparisonOutput.bestLoan === "Loan A";
                          onApplyNow?.(
                            "compare",
                            isA ? Number(compAmountA) : Number(compAmountB),
                            isA ? Number(compRateA) : Number(compRateB),
                            isA ? Number(compTenureA) : Number(compTenureB)
                          );
                        }}
                        className="bg-primary hover:opacity-95 text-white text-[12px] font-bold px-[14px] py-[8px] rounded-[10px] cursor-pointer"
                      >
                        Apply Best Loan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Prepayment Planner */}
              {activeTab === "prepayment" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] rounded-[20px] border border-gray-200 bg-white p-[24px] shadow-sm">
                  
                  {/* Left Side: Inputs */}
                  <div className="space-y-[18px]">
                    <h3 className="text-[14px] font-bold text-gray-800">Prepayment Planner</h3>
                    
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-[4px]">
                        <span>Current Loan Principal</span>
                        <span className="font-bold text-primary">₹{Number(prepAmount).toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="5000000"
                        step="25000"
                        value={prepAmount}
                        onChange={(e) => setPrepAmount(e.target.value)}
                        className="w-full accent-primary h-[3px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-[12px]">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">Rate (%)</label>
                        <input
                          type="number"
                          value={prepRate}
                          onChange={(e) => setPrepRate(e.target.value)}
                          className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">Tenure (Yrs)</label>
                        <input
                          type="number"
                          value={prepTenure}
                          onChange={(e) => setPrepTenure(e.target.value)}
                          className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-[12px] pt-[10px] border-t border-gray-100">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">Extra Monthly Pay</label>
                        <input
                          type="number"
                          step="500"
                          value={prepExtraPay}
                          onChange={(e) => setPrepExtraPay(e.target.value)}
                          className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-[4px]">One-Time Lump Sum</label>
                        <input
                          type="number"
                          step="1000"
                          value={prepLumpSum}
                          onChange={(e) => setPrepLumpSum(e.target.value)}
                          className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Savings Output */}
                  <div className="bg-gray-50 border border-gray-100 rounded-[16px] p-[20px] flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] mb-[12px]">Prepayment Savings Summary</h4>
                      
                      <div className="space-y-[12px] mb-[16px]">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[14px] p-[12px] flex items-center justify-between">
                          <div className="flex items-center gap-[6px]">
                            <TrendingUp className="w-[18px] h-[18px] text-emerald-600 shrink-0" />
                            <span className="text-[12px] text-gray-700 font-semibold">Total Interest Saved:</span>
                          </div>
                          <span className="text-[16px] font-black text-emerald-700">
                            ₹{prepaymentOutput.interestSaved.toLocaleString()}
                          </span>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-[14px] p-[12px] flex items-center justify-between">
                          <div className="flex items-center gap-[6px]">
                            <Calendar className="w-[18px] h-[18px] text-blue-600 shrink-0" />
                            <span className="text-[12px] text-gray-700 font-semibold">Tenure Reduced By:</span>
                          </div>
                          <span className="text-[16px] font-black text-blue-700">
                            {prepaymentOutput.tenureReductionYears} Years
                          </span>
                        </div>
                      </div>

                      <div className="space-y-[6px] text-[11.5px] text-gray-500">
                        <div className="flex justify-between">
                          <span>Standard Total Interest:</span>
                          <span>₹{prepaymentOutput.standardInterest.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Interest after prepayments:</span>
                          <span>₹{prepaymentOutput.prepaidInterest.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revised Tenure:</span>
                          <span>{((prepaymentOutput.monthsElapsed) / 12).toFixed(1)} years</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onTalkToAdvisor}
                      className="w-full bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-800 font-bold py-[9px] rounded-[10px] text-[12px] transition-all flex items-center justify-center gap-[6px] cursor-pointer mt-[16px]"
                    >
                      Consult Advisor on Debt Prepayment Strategy
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </div>

      {/* Terms & Conditions Modal */}
      <PolicyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        defaultTab={activeTermsTab}
        showAcceptCheckbox={!report}
        agreed={agreedToTerms}
        onAgreeChange={setAgreedToTerms}
      />
    </div>
  );
}

// Sub-components for styling cleanliness
interface FactorCardProps {
  label: string;
  value: string;
  subtext: string;
  status: "Excellent" | "Good" | "Poor";
}

function FactorCard({ label, value, subtext, status }: FactorCardProps) {
  return (
    <div className="rounded-[16px] border border-gray-100 bg-gray-55/35 p-[14px] flex flex-col justify-between text-left transition-all hover:-translate-y-[1px] hover:shadow-sm">
      <div>
        <span className="text-[11px] font-semibold text-gray-400 block tracking-[0.5px]">{label}</span>
        <div className="text-[20px] font-extrabold text-gray-800 mt-[4px]">{value}</div>
      </div>
      <div className="mt-[8px]">
        <p className="text-[10px] text-gray-400 leading-none">{subtext}</p>
        <span className={`text-[10px] font-bold inline-block mt-[4px] px-[8px] py-[2px] rounded-[10px] ${
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

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-[6px] px-[16px] py-[8px] border-b-2 font-bold text-[12px] tracking-tight shrink-0 transition-all cursor-pointer ${
        active 
          ? "border-primary text-primary" 
          : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
