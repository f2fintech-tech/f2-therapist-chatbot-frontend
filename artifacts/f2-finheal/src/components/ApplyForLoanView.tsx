import React, { useState } from "react";
import { useLocation } from "wouter";
import PolicyModal from "./PolicyModal";
import {
  Menu,
  CheckCircle,
  FileText,
  User as UserIcon,
  Phone,
  MapPin,
  HelpCircle,
  Sparkles,
  Briefcase,
  Stethoscope,
  ArrowRight,
  Send,
  Zap,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Calculator,
  ExternalLink,
  FileSpreadsheet,
  Lock,
  Shield,
  Info,
  Banknote,
  Calendar,
  Mail,
  Wallet,
  BarChart2
} from "lucide-react";

interface ApplyForLoanViewProps {
  userId: string;
  userEmail?: string;
  onToggleSidebar: () => void;
  onToggleInsights?: () => void;
  onOpenLoanCalculator?: (loanType?: string) => void;
  initialCategory?: string;
}

interface LoanCategoryConfig {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  heroTagline: string;
  description: string;
  maxAmount: string;
  startRate: string;
  maxTenure: string;
  processingTime: string;
  defaultAmountNum: number;
  minAmountNum: number;
  maxAmountNum: number;
  stepAmountNum: number;
  defaultRateNum: number;
  defaultTenureNum: number;
  features: string[];
  f2Advantages: string[];
  requiredDocs: {
    salaried?: string[];
    selfEmployed?: string[];
    doctors?: string[];
  };
  eligibilityCriteria: string[];
  faq: { q: string; a: string }[];
}

const LOAN_CATEGORIES: LoanCategoryConfig[] = [
  {
    id: "personal",
    name: "Personal Loan",
    icon: "👤",
    heroTagline: "Instant Unsecured Funds for Any Urgent Financial Need",
    description: "Get instant approval for medical emergencies, travel, weddings, education, or consolidating existing debts without offering collateral.",
    maxAmount: "Up to ₹40 Lakhs",
    startRate: "10.5% p.a.",
    maxTenure: "Up to 5 Years",
    processingTime: "24 - 48 Hours",
    defaultAmountNum: 500000,
    minAmountNum: 50000,
    maxAmountNum: 4000000,
    stepAmountNum: 25000,
    defaultRateNum: 11.5,
    defaultTenureNum: 3,
    features: [
      "No collateral or guarantor required",
      "Minimal paperwork & digital verification",
      "Flexible repayment options (12 to 60 months)",
      "Zero restriction on end-use of funds",
      "Quick disbursal directly to bank account"
    ],
    f2Advantages: [
      "Access to 100+ leading partner Banks & NBFCs in one application",
      "Single application pre-screening to prevent multiple hard queries",
      "Dedicated F2 Fintech Relationship Manager assigned to your file",
      "Special rate discounts for salaried employees in Tier 1 & MNC companies",
      "Complete doorstep & digital document assistance"
    ],
    requiredDocs: {
      salaried: [
        "PAN Card & Aadhaar Card",
        "Last 3 Months Salary Slips",
        "Last 6 Months Bank Statement",
        "Form 16 / Company ID Card"
      ],
      selfEmployed: [
        "PAN Card & Aadhaar Card",
        "Last 2 Years ITR with Computation",
        "Last 6 Months Bank Statement",
        "Business Ownership Proof (GST / Udhyam)"
      ]
    },
    eligibilityCriteria: [
      "Age between 21 to 60 years",
      "Minimum monthly income of ₹25,000",
      "At least 1 year of continuous work experience",
      "Indian Resident Citizen"
    ],
    faq: [
      {
        q: "What is the maximum Personal Loan amount I can get through F2 Fintech?",
        a: "Depending on your net monthly salary and existing obligations, you can get unsecured personal loans up to ₹40 Lakhs across our 100+ partner banks."
      },
      {
        q: "Can I apply for a personal loan if I am self-employed?",
        a: "Yes! F2 Fintech offers specialized personal loans for self-employed individuals based on ITR returns and 6-month bank cash flows."
      },
      {
        q: "How fast will the money be disbursed?",
        a: "Once approved, funds are disbursed within 24 to 48 hours directly into your primary bank account."
      }
    ]
  },
  {
    id: "business",
    name: "Business Loan",
    icon: "💼",
    badge: "Popular for MSMEs",
    heroTagline: "Fuel Your Business Expansion & Working Capital Growth",
    description: "Tailored collateral-free business financing for micro, small, and medium enterprises (MSMEs), retailers, and manufacturers.",
    maxAmount: "Up to ₹50 Lakhs / ₹5 Cr",
    startRate: "13.5% p.a.",
    maxTenure: "Up to 7 Years",
    processingTime: "48 - 72 Hours",
    defaultAmountNum: 2000000,
    minAmountNum: 200000,
    maxAmountNum: 10000000,
    stepAmountNum: 100000,
    defaultRateNum: 14.0,
    defaultTenureNum: 4,
    features: [
      "Collateral-free options available up to ₹50 Lakhs",
      "Customized working capital & machinery financing options",
      "Overdraft (OD) and Term Loan structures",
      "Flexible EMI payment schedule matching cash flows",
      "Tax benefits on interest paid for business expenses"
    ],
    f2Advantages: [
      "Customized underwriting using GST returns & banking turnover",
      "Partnership with top 25 MSME lenders & NBFCs",
      "Doorstep consultation by F2 Business Loan Experts",
      "High loan-to-turnover ratio approvals",
      "Fast track approval for existing GST registered businesses"
    ],
    requiredDocs: {
      selfEmployed: [
        "PAN Card & Aadhaar Card of Promoters/Partners",
        "Business Registration (GST / Udhyam / Partnership Deed / MOA)",
        "Last 2 Years Audited Financials with CA Certified ITR",
        "Last 12 Months Business Bank Account Statement"
      ]
    },
    eligibilityCriteria: [
      "Business vintage of at least 2 years",
      "Minimum annual turnover of ₹20 Lakhs",
      "Business owner age between 24 to 65 years",
      "Profitable business operation for past 2 years"
    ],
    faq: [
      {
        q: "Is collateral mandatory for a Business Loan?",
        a: "No! We offer unsecured collateral-free business loans up to ₹50 Lakhs based on your business turnover and GST returns."
      },
      {
        q: "Can I get a loan if my business is 1 year old?",
        a: "We have specific MSME startup funding schemes for businesses with 1+ year vintage if turnover meets bank thresholds."
      }
    ]
  },
  {
    id: "home",
    name: "Home Loan",
    icon: "🏠",
    badge: "Lowest Interest Rates",
    heroTagline: "Build or Buy Your Dream Home with Lowest EMIs",
    description: "Long-term home financing with attractive interest rates for property purchase, plot acquisition, home construction, or balance transfers.",
    maxAmount: "Up to ₹10 Crore",
    startRate: "8.35% p.a.",
    maxTenure: "Up to 30 Years",
    processingTime: "3 - 7 Days",
    defaultAmountNum: 5000000,
    minAmountNum: 500000,
    maxAmountNum: 30000000,
    stepAmountNum: 250000,
    defaultRateNum: 8.5,
    defaultTenureNum: 20,
    features: [
      "Financing up to 85%-90% of property cost",
      "Ultra-low interest rates with maximum tenure up to 30 years",
      "PMAY subsidy eligibility guidance (where applicable)",
      "Balance transfer option with top-up loan facility",
      "Tax deduction benefits under Section 80C and Section 24(b)"
    ],
    f2Advantages: [
      "Multi-lender rate comparison across 15+ prime housing banks",
      "End-to-end legal & technical property report verification",
      "Assistance with balance transfers to reduce current EMI by up to 20%",
      "Zero hidden processing charges guarantee through F2 Fintech",
      "Personalized home loan advisor dedicated from login to registry"
    ],
    requiredDocs: {
      salaried: [
        "KYC: PAN, Aadhaar, Passport / Voter ID",
        "Last 6 Months Salary Slip & 6 Months Bank Statement",
        "Property Legal Documents (Agreement to Sale, Approved Plan, Title Chain)"
      ],
      selfEmployed: [
        "KYC: PAN, Aadhaar, Business Proof",
        "Last 3 Years ITR with Financial Statements & Audit Reports",
        "Last 12 Months Bank Account Statement",
        "Property Documents & All allotment letters"
      ]
    },
    eligibilityCriteria: [
      "Age 21 to 70 years (at loan maturity)",
      "Stable source of regular income (Salaried or Self-employed)",
      "Clear legal title and technical approval for property"
    ],
    faq: [
      {
        q: "What is the maximum tenure for a Home Loan?",
        a: "Home loans can be availed for up to 30 years, giving you the lowest monthly EMI payments."
      },
      {
        q: "Can F2 Fintech help me transfer my existing high-rate Home Loan?",
        a: "Yes! F2 Fintech specializes in Home Loan Balance Transfer (HLBT) with Top-Up loans to reduce your current interest rate significantly."
      }
    ]
  },
  {
    id: "lap",
    name: "Loan Against Property",
    icon: "🏢",
    heroTagline: "Unlock Maximum Cash Value from Your Property Asset",
    description: "Leverage your residential, commercial, or industrial property to secure high-value loans at interest rates lower than personal loans.",
    maxAmount: "Up to ₹15 Crore",
    startRate: "9.5% p.a.",
    maxTenure: "Up to 15 Years",
    processingTime: "4 - 7 Days",
    defaultAmountNum: 7500000,
    minAmountNum: 1000000,
    maxAmountNum: 50000000,
    stepAmountNum: 500000,
    defaultRateNum: 10.0,
    defaultTenureNum: 12,
    features: [
      "High LTV (Loan to Value) up to 70% of market property valuation",
      "Accepts residential, commercial, or industrial property",
      "Longer tenure compared to business loans (up to 15 years)",
      "Property remains 100% in your use while unlocked for liquidity",
      "Attractive interest rates compared to unsecured credit"
    ],
    f2Advantages: [
      "Highest property valuation assessment through trusted bank valuer panel",
      "Customized repayment structures for business cashflow cycles",
      "Doorstep documentation and legal clearance assistance",
      "Special balance transfer options with top-up cash availability",
      "Dedicated mortgage specialist for smooth disbursal"
    ],
    requiredDocs: {
      salaried: [
        "PAN & Aadhaar Card",
        "Income Proofs: Salary Slips & 6 Months Bank Statement",
        "Property Documents (Title Deed, Approved Building Plan, Property Tax Receipts)"
      ],
      selfEmployed: [
        "PAN & Aadhaar Card",
        "3 Years ITR & Audited Balance Sheets",
        "12 Months Bank Account Statement",
        "Complete Property Ownership Chain Documents"
      ]
    },
    eligibilityCriteria: [
      "Property owner with clear legal title",
      "Age between 23 to 65 years",
      "Sufficient income proof to service property EMI"
    ],
    faq: [
      {
        q: "What types of property are accepted for LAP?",
        a: "Residential houses, flats, commercial offices, shops, and industrial plots with clear titles are accepted."
      },
      {
        q: "Can joint owners apply for Loan Against Property?",
        a: "Yes! All co-owners of the property must join as co-applicants for LAP."
      }
    ]
  },
  {
    id: "doctor",
    name: "Doctor Loan",
    icon: "🩺",
    badge: "Exclusive Professional Credit",
    heroTagline: "Tailored High-Limit Financing for Certified Doctors & Medical Experts",
    description: "Specialized credit facilities for MBBS, BDS, MD, MS, BAMS, BHMS, and certified medical professionals to set up clinics, purchase medical equipment, or expand healthcare facilities.",
    maxAmount: "Up to ₹1 Crore",
    startRate: "9.99% p.a.",
    maxTenure: "Up to 7 Years",
    processingTime: "24 - 48 Hours",
    defaultAmountNum: 2500000,
    minAmountNum: 200000,
    maxAmountNum: 10000000,
    stepAmountNum: 100000,
    defaultRateNum: 10.5,
    defaultTenureNum: 5,
    features: [
      "Pre-approved loan limits up to ₹1 Cr based on qualification degree",
      "Zero collateral required for qualified medical practitioners",
      "Medical equipment purchase & clinic setup financing",
      "Flexible repayment terms up to 84 months",
      "Minimal documentation with fast-track processing"
    ],
    f2Advantages: [
      "Exclusive doctor loan programs in partnership with premier healthcare lenders",
      "Simplified evaluation based on degree certificate & practice duration",
      "Special low interest rate brackets tailored for medical professionals",
      "Doorstep service by F2 Professional Loan Experts",
      "No financial statement audit required for limits up to ₹25 Lakhs"
    ],
    requiredDocs: {
      doctors: [
        "PAN Card & Aadhaar Card",
        "Medical Degree Certificate (MBBS / BDS / MD / MS / BAMS / BHMS)",
        "Medical Council Registration Certificate",
        "Last 6 Months Bank Statement",
        "Proof of Practice / Clinic Registration (if applicable)"
      ]
    },
    eligibilityCriteria: [
      "Recognized medical degree certified by MCI / State Council",
      "Minimum 1 year of post-qualification experience",
      "Age between 25 to 65 years"
    ],
    faq: [
      {
        q: "Do I need financial statements (ITR) for a Doctor Loan?",
        a: "For pre-approved doctor loan limits up to ₹25 Lakhs, financial statements are often waived based on your medical registration certificate!"
      },
      {
        q: "Can I use the Doctor Loan to buy medical equipment?",
        a: "Yes! Funds can be used for buying diagnostic machines, clinic equipment, interior setup, or general professional expenses."
      }
    ]
  }
];

export default function ApplyForLoanView({
  userId,
  userEmail,
  onToggleSidebar,
  onToggleInsights,
  onOpenLoanCalculator,
  initialCategory = "personal"
}: ApplyForLoanViewProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>(initialCategory);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<"credit-consent" | "terms-of-use" | "privacy-policy" | "dpdp-notice" | "data-retention">("privacy-policy");
  const [showEmiInfoTooltip, setShowEmiInfoTooltip] = useState(false);

  // Form State for Inline Quick Application
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: userEmail || "",
    city: "",
    desiredAmount: 500000,
    tenureYears: 3,
    employmentType: "salaried",
    monthlyIncome: "",
    purpose: "",
    acceptTerms: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedRefNo, setSubmittedRefNo] = useState("");

  const currentCategory = LOAN_CATEGORIES.find((cat) => cat.id === activeTab) || LOAN_CATEGORIES[0];

  // Calculate estimated monthly EMI for current slider selection
  const emiCalc = React.useMemo(() => {
    const principal = formData.desiredAmount;
    const annualRate = currentCategory.defaultRateNum;
    const monthlyRate = annualRate / 12 / 100;
    const months = formData.tenureYears * 12;

    if (monthlyRate === 0) {
      return {
        monthlyEmi: Math.round(principal / months),
        totalPayment: principal,
        totalInterest: 0
      };
    }
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    return {
      monthlyEmi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest)
    };
  }, [formData.desiredAmount, formData.tenureYears, currentCategory]);

  const handleTabChange = (catId: string) => {
    setActiveTab(catId);
    const newCat = LOAN_CATEGORIES.find((c) => c.id === catId);
    if (newCat) {
      setFormData((prev) => ({
        ...prev,
        desiredAmount: newCat.defaultAmountNum,
        tenureYears: newCat.defaultTenureNum
      }));
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim()) {
      alert("Please enter your full name and contact mobile number.");
      return;
    }
    if (formData.mobileNumber.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    // Simulate clean API call response
    setTimeout(() => {
      setIsSubmitting(false);
      const randomRef = "F2-" + Math.floor(100000 + Math.random() * 900000);
      setSubmittedRefNo(randomRef);
      setIsSubmittedSuccess(true);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#f8fafc] overflow-y-auto">
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Apply for Loan</h1>
              <span className="bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> F2 Fintech Assist
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Choose your loan product, compare top lenders, and get end-to-end disbursal guidance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleInsights && (
            <button
              type="button"
              onClick={onToggleInsights}
              className="p-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5 border border-gray-200"
            >
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="hidden md:inline">Advisor Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Hero Banner Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e1b4b] text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md border border-white/15">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Fastest Loan Disbursal Partner</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Get Your Loan Disbursed Hassle-Free with <span className="text-primary-300 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-200">F2 Fintech</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              We connect your loan application with 100+ leading partner Banks & NBFCs, negotiating the lowest interest rates and managing end-to-end documentation for guaranteed quick disbursal.
            </p>

            {/* Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100+ Bank Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dedicated F2 Advisor</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Doorstep Guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Hidden Fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Category Selector Tabs (5 Tabs) */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
            {LOAN_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleTabChange(cat.id)}
                  className={`flex flex-col items-center text-center p-3 rounded-lg transition-all cursor-pointer relative ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25 font-semibold"
                      : "bg-gray-50/80 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-100"
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-xs font-bold truncate max-w-full">{cat.name}</span>

                  {cat.badge && !isActive && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Category Details & Application Flow */}
        <div className="space-y-6">
          {/* 1. Category Header & Key Metrics Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{currentCategory.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{currentCategory.name}</h3>
                    <p className="text-xs text-primary font-semibold">{currentCategory.heroTagline}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                  {currentCategory.description}
                </p>
              </div>
            </div>

            {/* Key Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-3.5 border border-slate-100 text-center">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Max Amount</div>
                <div className="text-sm sm:text-base font-bold text-gray-900">{currentCategory.maxAmount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Interest Rate</div>
                <div className="text-sm sm:text-base font-bold text-emerald-600">From {currentCategory.startRate}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Max Tenure</div>
                <div className="text-sm sm:text-base font-bold text-gray-900">{currentCategory.maxTenure}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Processing Time</div>
                <div className="text-sm sm:text-base font-bold text-primary">{currentCategory.processingTime}</div>
              </div>
            </div>

            {/* Category Features */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" /> Key Loan Features
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
                {currentCategory.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-md border border-gray-100">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2. Why Choose F2 Fintech Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-xl p-6 shadow-md border border-indigo-800/50 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg text-primary-300">
                <Award className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">How F2 Fintech Helps You For Disbursal</h4>
                <p className="text-xs text-indigo-200">Our dedicated team ensures maximum approval success & fast disbursal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {currentCategory.f2Advantages.map((adv, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-white/5 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                  <div className="w-5 h-5 rounded-full bg-primary/30 text-indigo-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-gray-200 leading-snug">{adv}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Required Documents Matrix */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Required Documents Checklist
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {currentCategory.requiredDocs.salaried && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-primary" /> For Salaried Individuals
                  </div>
                  <ul className="space-y-1.5 text-gray-600">
                    {currentCategory.requiredDocs.salaried.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentCategory.requiredDocs.selfEmployed && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> For Self-Employed / Business
                  </div>
                  <ul className="space-y-1.5 text-gray-600">
                    {currentCategory.requiredDocs.selfEmployed.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentCategory.requiredDocs.doctors && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 sm:col-span-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> For Doctors & Medical Practitioners
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-gray-600">
                    {currentCategory.requiredDocs.doctors.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 4. INLINE Application Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 sm:p-8 space-y-6">

            {isSubmittedSuccess ? (
              <div className="text-center py-10 space-y-5 animate-in fade-in zoom-in duration-300 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xl font-bold text-gray-900">Loan Application Submitted!</h4>
                  <p className="text-sm text-gray-600">
                    Thank you for applying for <span className="font-semibold text-gray-900">{currentCategory.name}</span>.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Application Reference Number</div>
                  <div className="text-xl font-extrabold text-primary tracking-widest mt-1">{submittedRefNo}</div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  An F2 Fintech Relationship Manager will review your loan requirement and contact you within 2 hours to help you choose the best lender and finalize disbursal.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmittedSuccess(false);
                    setSubmittedRefNo("");
                  }}
                  className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Submit Another Loan Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                  {/* LEFT COLUMN: 1. Configure Your Loan */}
                  <div className="space-y-6">
                    {/* Step 1 Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                        1
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Configure Your Loan</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Adjust the loan amount and tenure to see your estimated EMI.</p>
                      </div>
                    </div>

                    {/* Loan Amount Block */}
                    <div className="space-y-3 bg-slate-50/40 p-4 rounded-2xl border border-slate-200/70 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Banknote className="w-4 h-4" />
                          </span>
                          <label htmlFor="desiredAmountInput" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Loan Amount
                          </label>
                        </div>
                        <span className="text-sm sm:text-base font-extrabold text-blue-600 bg-blue-50/80 px-3.5 py-1 rounded-xl border border-blue-100/80">
                          ₹{formData.desiredAmount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Range Slider */}
                      <div className="space-y-1.5 pt-1">
                        <input
                          id="desiredAmountInput"
                          type="range"
                          min={currentCategory.minAmountNum}
                          max={currentCategory.maxAmountNum}
                          step={currentCategory.stepAmountNum}
                          value={formData.desiredAmount}
                          onChange={(e) => setFormData({ ...formData, desiredAmount: Number(e.target.value) })}
                          className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-gray-400 font-medium px-0.5">
                          <span>₹{currentCategory.minAmountNum.toLocaleString("en-IN")}</span>
                          <span>₹{currentCategory.maxAmountNum.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Preferred Tenure Block */}
                    <div className="space-y-3 bg-slate-50/40 p-4 rounded-2xl border border-slate-200/70 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <label className="text-xs sm:text-sm font-semibold text-gray-800">
                          Preferred Tenure
                        </label>
                      </div>

                      <div className="grid grid-cols-4 gap-2.5">
                        {[1, 3, 5, 7].map((yrs) => (
                          <button
                            key={yrs}
                            type="button"
                            onClick={() => setFormData({ ...formData, tenureYears: yrs })}
                            className={`py-2.5 px-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer text-center ${
                              formData.tenureYears === yrs
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {yrs} {yrs === 1 ? "Year" : "Years"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Estimated Monthly EMI Card */}
                    <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-150 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs relative overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs">
                            <Calculator className="w-4 h-4" />
                          </span>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900">
                            <span>Estimated Monthly EMI</span>
                            <button
                              type="button"
                              onClick={() => setShowEmiInfoTooltip(!showEmiInfoTooltip)}
                              className="text-blue-500 hover:text-blue-700 cursor-pointer p-0.5 rounded transition-colors"
                              title="Click for EMI calculation formula & ROI info"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200/60">
                          Base Estimate
                        </span>
                      </div>

                      {showEmiInfoTooltip && (
                        <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-blue-200 text-[11px] text-gray-600 space-y-1.5 animate-in fade-in duration-200 shadow-xs">
                          <div className="font-bold text-blue-900 flex items-center justify-between">
                            <span>EMI Calculation Formula</span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-100">Reducing Balance</span>
                          </div>
                          <p className="leading-relaxed text-gray-700">
                            Calculated at <strong>{currentCategory.defaultRateNum}% p.a.</strong> interest rate for <strong>₹{formData.desiredAmount.toLocaleString("en-IN")}</strong> over <strong>{formData.tenureYears * 12} months</strong> ({formData.tenureYears} {formData.tenureYears === 1 ? "Year" : "Years"}).
                          </p>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] text-slate-700 font-mono">
                            EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                            ₹{emiCalc.monthlyEmi.toLocaleString("en-IN")}
                            <span className="text-xs font-medium text-gray-500 ml-1">/ month</span>
                          </div>
                        </div>

                        {/* 3D Calculator Illustration Icon Graphic */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-2.5 text-white flex items-center justify-center shadow-md relative shrink-0">
                          <Calculator className="w-7 h-7" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                            ₹
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-200/60 text-xs">
                        <div>
                          <div className="text-gray-500 text-[11px] font-medium">Interest Rate (ROI)</div>
                          <div className="font-bold text-blue-700 mt-0.5">{currentCategory.defaultRateNum}% p.a.</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-[11px] font-medium">Principal Amount</div>
                          <div className="font-bold text-gray-900 mt-0.5">₹{formData.desiredAmount.toLocaleString("en-IN")}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-[11px] font-medium">Total Payable</div>
                          <div className="font-bold text-gray-900 mt-0.5">₹{emiCalc.totalPayment.toLocaleString("en-IN")}</div>
                        </div>
                      </div>
                    </div>

                    {/* Get Detailed Loan Calculation Card */}
                    <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/70 rounded-2xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <span className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                          <BarChart2 className="w-4 h-4" />
                        </span>
                        <div className="space-y-0.5">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900">Get Detailed Loan Calculation</h4>
                          <p className="text-[11px] text-gray-600 leading-snug">
                            View month-by-month amortization, interest breakdown and smart prepayment recommendations.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenLoanCalculator) {
                            onOpenLoanCalculator(currentCategory.id);
                          } else {
                            setLocation(`/loan-calculator/${currentCategory.id}`);
                          }
                        }}
                        className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-blue-600 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Open Loan & Prepayment Calculator</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: 2. Applicant Details */}
                  <div className="space-y-6">
                    {/* Step 2 Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                          2
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Applicant Details</h3>
                          <p className="text-xs text-gray-500 mt-0.5 leading-normal">Enter your details to proceed. We will use this to get in touch with you.</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActivePolicyTab("privacy-policy");
                          setIsPolicyModalOpen(true);
                        }}
                        className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/60 rounded-full text-[10px] text-slate-500 font-medium shrink-0 max-w-[210px] leading-tight transition-colors cursor-pointer text-left"
                      >
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Your information is secure and will be used only for your loan application.</span>
                      </button>
                    </div>

                    {/* Full Name Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantFullName">
                        Full Name (As per PAN Card) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          id="applicantFullName"
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Enter your full name"
                          className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    </div>

                    {/* Mobile & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantMobile">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantMobile"
                            type="tel"
                            required
                            maxLength={10}
                            value={formData.mobileNumber}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, "") })}
                            placeholder="10-digit mobile number"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantEmail">
                          Email (Optional)
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantEmail"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email address"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* City Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantCity">
                        City / Location
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          id="applicantCity"
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Mumbai, Delhi, Bengaluru"
                          className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    </div>

                    {/* Employment & Monthly Income Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">
                          Employment Profile
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          <select
                            value={formData.employmentType}
                            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                            className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white appearance-none cursor-pointer"
                          >
                            <option value="salaried">Salaried (Private / Public / MNC)</option>
                            <option value="self-employed">Self-Employed / Business Owner</option>
                            <option value="doctor">Doctor / Certified Professional</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">
                          Monthly Income (Approx.)
                        </label>
                        <div className="relative">
                          <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          <select
                            value={formData.monthlyIncome}
                            onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                            className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white appearance-none cursor-pointer"
                          >
                            <option value="">Select range</option>
                            <option value="below_25k">Below ₹25,000</option>
                            <option value="25k_50k">₹25,000 - ₹50,000</option>
                            <option value="50k_1lakh">₹50,000 - ₹1,00,000</option>
                            <option value="above_1lakh">Above ₹1,00,000</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Consent Checkbox */}
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        id="acceptTermsCheckbox"
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer shrink-0"
                      />
                      <label htmlFor="acceptTermsCheckbox" className="text-xs text-gray-600 leading-snug cursor-pointer select-none">
                        I authorize F2 Fintech and its partner lenders to contact me via call, SMS, email or WhatsApp regarding my loan application.
                      </label>
                    </div>

                    {/* Security / Privacy Banner Card */}
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2 text-blue-950">
                        <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] sm:text-xs text-slate-700 leading-tight">
                          Your data is safe with us. We follow industry-standard security practices and will never share your information without your consent.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePolicyTab("privacy-policy");
                          setIsPolicyModalOpen(true);
                        }}
                        className="text-blue-600 font-bold text-xs whitespace-nowrap hover:underline cursor-pointer shrink-0"
                      >
                        Learn more →
                      </button>
                    </div>

                    {/* Submit Loan Application Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.acceptTerms}
                        className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Submitting Application...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Loan Application via F2 Fintech</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* 5. FAQs Accordion (Positioned AT THE VERY END / LAST) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" /> Frequently Asked Questions
            </h4>

            <div className="space-y-2.5">
              {currentCategory.faq.map((item, idx) => {
                const isExpanded = expandedFaqIndex === idx;
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden transition-colors">
                    <button
                      type="button"
                      onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                      className="w-full px-4 py-3 text-left font-semibold text-xs text-gray-800 bg-gray-50/50 hover:bg-gray-100 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span>{item.q}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 py-3 text-xs text-gray-600 bg-white border-t border-gray-100 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Terms, Privacy Policy & DPDP Consent Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        defaultTab={activePolicyTab}
      />
    </div>
  );
}
