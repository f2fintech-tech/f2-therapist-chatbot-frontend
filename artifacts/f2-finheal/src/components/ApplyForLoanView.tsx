import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
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
  Mail,
  Wallet,
  Shield,
  Info,
  BarChart2,
  Banknote,
  Calendar,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Key,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  FileCheck,
  Building,
  RefreshCw
} from "lucide-react";
import PolicyModal from "./PolicyModal";

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
  additionalDocFields: { id: string; label: string; description: string; required: boolean }[];
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
    ],
    additionalDocFields: [
      { id: "address_proof", label: "Current Address Proof (Rent Agreement / Utility Bill)", description: "Upload if current address differs from Aadhaar card", required: false },
      { id: "form_16", label: "Form 16 / Income Tax Return", description: "Upload Form 16 Part A & B for tax verification", required: false }
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
    ],
    additionalDocFields: [
      { id: "business_proof", label: "Business Ownership Proof (GST / Udhyam / Partnership Deed)", description: "Mandatory for business verification", required: true },
      { id: "financials_2yr", label: "2 Years Audited Financials & CA Certified ITR", description: "Balance sheet, P&L statement with computation", required: true }
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
    ],
    additionalDocFields: [
      { id: "property_docs", label: "Property Legal Agreement to Sale / Allotment Letter", description: "Copy of property purchase agreement", required: true },
      { id: "approved_map", label: "Approved Building Map & Title Chain Documents", description: "Municipal approved plan & past title deeds", required: false }
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
    ],
    additionalDocFields: [
      { id: "title_deed", label: "Registered Property Title Deed & Conveyance Deed", description: "Mandatory legal ownership deed", required: true },
      { id: "property_tax", label: "Recent Property Tax Receipt & Utility Bills", description: "Latest paid tax receipt for property", required: false }
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
    ],
    additionalDocFields: [
      { id: "medical_degree", label: "Medical Degree Certificate (MBBS / MD / BDS / MS)", description: "Copy of qualification certificate", required: true },
      { id: "council_reg", label: "Medical Council Registration Certificate", description: "State or MCI registration certificate", required: true }
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
  const DRAFT_STORAGE_KEY = "f2_loan_application_draft_v1";

  // Helper to load saved draft from localStorage
  const loadSavedDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load saved loan draft", e);
    }
    return null;
  };

  const initialDraft = useMemo(() => loadSavedDraft(), []);

  const [activeTab, setActiveTab] = useState<string>(initialDraft?.activeTab || initialCategory);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<"credit-consent" | "terms-of-use" | "privacy-policy" | "dpdp-notice" | "data-retention">("privacy-policy");

  // 3-Step Wizard Navigation State
  const wizardFormRef = useRef<HTMLDivElement | null>(null);
  const [applyLoanToggle, setApplyLoanToggle] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialDraft?.currentStep || 1);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(Boolean(initialDraft));

  const handleScrollToApplicantForm = () => {
    setApplyLoanToggle(true);
    if (wizardFormRef.current) {
      wizardFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      document.getElementById("applicantFormWizardSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Form Data State - Email is empty by default unless saved draft exists
  const [formData, setFormData] = useState(initialDraft?.formData || {
    fullName: "",
    fatherName: "",
    motherName: "",
    mobileNumber: "",
    email: "",
    city: "",
    desiredAmount: 500000,
    tenureYears: 3,
    employmentType: "salaried",
    monthlyIncome: "",
    acceptTerms: false
  });

  // Document Upload States
  const [aadhaarDoc, setAadhaarDoc] = useState(initialDraft?.aadhaarDoc || { mode: "pdf" });
  const [panDoc, setPanDoc] = useState(initialDraft?.panDoc || { mode: "pdf" });
  const [photoDoc, setPhotoDoc] = useState(initialDraft?.photoDoc || {});
  const [salarySlipsDoc, setSalarySlipsDoc] = useState(initialDraft?.salarySlipsDoc || {});
  const [idCardDoc, setIdCardDoc] = useState(initialDraft?.idCardDoc || {});
  const [bankStatementDoc, setBankStatementDoc] = useState(initialDraft?.bankStatementDoc || {});
  const [additionalUploaded, setAdditionalUploaded] = useState<Record<string, { fileName?: string; fileList?: string[] }>>(initialDraft?.additionalUploaded || {});

  // Auto-save form & stage progress to localStorage whenever state updates
  useEffect(() => {
    try {
      const payload = {
        activeTab,
        currentStep,
        formData,
        aadhaarDoc,
        panDoc,
        photoDoc,
        salarySlipsDoc,
        idCardDoc,
        bankStatementDoc,
        additionalUploaded,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save loan draft", e);
    }
  }, [activeTab, currentStep, formData, aadhaarDoc, panDoc, photoDoc, salarySlipsDoc, idCardDoc, bankStatementDoc, additionalUploaded]);

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to reset the form and start a new application?")) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) { }
      setIsDraftRestored(false);
      setCurrentStep(1);
      setFormData({
        fullName: "",
        fatherName: "",
        motherName: "",
        mobileNumber: "",
        email: "",
        city: "",
        desiredAmount: 500000,
        tenureYears: 3,
        employmentType: "salaried",
        monthlyIncome: "",
        acceptTerms: false
      });
      setAadhaarDoc({ mode: "pdf" });
      setPanDoc({ mode: "pdf" });
      setPhotoDoc({});
      setSalarySlipsDoc({});
      setIdCardDoc({});
      setBankStatementDoc({});
      setAdditionalUploaded({});
    }
  };

  // Helper to extract file list from doc state (array of strings)
  const getDocFiles = (docState: any): string[] => {
    if (!docState) return [];
    if (Array.isArray(docState.fileList) && docState.fileList.length > 0) {
      return docState.fileList;
    }
    if (docState.fileName) {
      return [docState.fileName];
    }
    return [];
  };

  const getAdditionalFiles = (fieldId: string): string[] => {
    const item = additionalUploaded[fieldId];
    if (!item) return [];
    if (Array.isArray(item.fileList) && item.fileList.length > 0) {
      return item.fileList;
    }
    if (item.fileName) {
      return [item.fileName];
    }
    return [];
  };

  // Helper to add files to doc state
  const addFilesToDoc = (setter: React.Dispatch<React.SetStateAction<any>>, newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const names = Array.from(newFiles).map((f) => f.name);
    setter((prev: any) => {
      const existing = getDocFiles(prev);
      const updated = Array.from(new Set([...existing, ...names]));
      return {
        ...prev,
        fileName: updated[0],
        fileList: updated
      };
    });
  };

  // Helper to remove individual file by index from doc state
  const removeFileFromDoc = (setter: React.Dispatch<React.SetStateAction<any>>, indexToRemove: number) => {
    setter((prev: any) => {
      const existing = getDocFiles(prev);
      const updated = existing.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        fileName: updated[0] || undefined,
        fileList: updated,
        isEncrypted: updated.length === 0 ? false : prev.isEncrypted,
        pdfPassword: updated.length === 0 ? "" : prev.pdfPassword
      };
    });
  };

  // Real WebRTC Device Camera Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraModalTarget, setCameraModalTarget] = useState<string | null>(null);
  const [simulatedSnapshot, setSimulatedSnapshot] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedRefNo, setSubmittedRefNo] = useState("");

  const currentCategory = LOAN_CATEGORIES.find((cat) => cat.id === activeTab) || LOAN_CATEGORIES[0];

  // Bank Statement Notice Example
  const bankStatementNotice = {
    subtext: "Please upload your updated 6 months bank statement",
    exampleText: "For Example: As today is 8 Sep, please upload the bank statement from 8 March to 6 Sep"
  };

  const handleTabChange = (catId: string) => {
    setActiveTab(catId);
    const newCat = LOAN_CATEGORIES.find((c) => c.id === catId);
    if (newCat) {
      setFormData((prev: any) => ({
        ...prev,
        desiredAmount: newCat.defaultAmountNum,
        tenureYears: newCat.defaultTenureNum
      }));
    }
  };

  const handleNextStep1 = () => {
    if (!formData.fullName.trim()) {
      alert("Please enter your Full Name.");
      return;
    }
    if (!formData.fatherName.trim()) {
      alert("Please enter your Father's Name.");
      return;
    }
    if (!formData.motherName.trim()) {
      alert("Please enter your Mother's Name.");
      return;
    }
    if (!formData.mobileNumber.trim() || formData.mobileNumber.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit Mobile Number.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      alert("Please enter a valid Email Address.");
      return;
    }
    if (!formData.city.trim()) {
      alert("Please enter your City / Location.");
      return;
    }

    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    // Validate Mandatory Docs
    const hasAadhaar = aadhaarDoc.mode === "pdf" ? Boolean(aadhaarDoc.fileName) : Boolean(aadhaarDoc.frontPhoto);
    if (!hasAadhaar) {
      alert("Please upload your Aadhaar Card (PDF or Photo).");
      return;
    }

    const hasPan = panDoc.mode === "pdf" ? Boolean(panDoc.fileName) : Boolean(panDoc.frontPhoto);
    if (!hasPan) {
      alert("Please upload your PAN Card (PDF or Photo).");
      return;
    }

    if (!photoDoc.fileName && !photoDoc.photoPreview) {
      alert("Please upload or capture your Passport Size Photo.");
      return;
    }

    if (!bankStatementDoc.fileName) {
      alert("Please upload your 6 Months Bank Statement.");
      return;
    }

    setCurrentStep(3);
  };

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      alert("Please authorize F2 Fintech consent terms to proceed.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const randomRef = "F2-" + Math.floor(100000 + Math.random() * 900000);
      setSubmittedRefNo(randomRef);
      setIsSubmittedSuccess(true);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) { }
    }, 1200);
  };

  // Request browser camera permissions and start stream
  const startRealCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setCameraStream(stream);
      } else {
        setCameraError("Camera API is not supported in this browser.");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera permissions in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device found on your laptop/device.");
      } else {
        setCameraError("Unable to access camera. Please verify device permissions.");
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  // Stop camera tracks on close or snapshot
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraModalTarget(null);
    setSimulatedSnapshot(null);
    setCameraError(null);
  };

  // Open camera modal and prompt browser for camera permission
  const triggerCameraModal = (targetKey: string) => {
    setCameraModalTarget(targetKey);
    setSimulatedSnapshot(null);
    startRealCamera();
  };

  // Capture frame from active video stream onto canvas
  const captureRealPhotoSnapshot = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setSimulatedSnapshot(dataUrl);

        // Turn off active camera stream once snapshot is taken
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }
      }
    } else {
      // Fallback fallback sample photo if stream is unavailable
      const mockImages = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
      ];
      const picked = mockImages[Math.floor(Math.random() * mockImages.length)];
      setSimulatedSnapshot(picked);
    }
  };

  const confirmCapturedPhoto = () => {
    if (!cameraModalTarget || !simulatedSnapshot) return;

    if (cameraModalTarget === "aadhaar_front") {
      setAadhaarDoc((prev: any) => ({ ...prev, mode: "photo", frontPhoto: simulatedSnapshot }));
    } else if (cameraModalTarget === "aadhaar_back") {
      setAadhaarDoc((prev: any) => ({ ...prev, mode: "photo", backPhoto: simulatedSnapshot }));
    } else if (cameraModalTarget === "pan_front") {
      setPanDoc((prev: any) => ({ ...prev, mode: "photo", frontPhoto: simulatedSnapshot }));
    } else if (cameraModalTarget === "photo") {
      setPhotoDoc({ fileName: "photo_camera_capture.jpg", photoPreview: simulatedSnapshot });
    }

    stopCameraStream();
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
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Apply for Loan</h1>
              <span className="bg-primary/10 text-primary text-xs sm:text-sm font-bold px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" /> F2 Fintech Assist
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 font-medium hidden sm:block mt-1">
              Choose your loan product, compare top lenders, and get end-to-end disbursal guidance.
            </p>
          </div>
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

        {/* Loan Category Selector Tabs (5 Tabs with Glassmorphism Effect & Theme Blue Palette) */}
        <div className="py-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2.5 overflow-visible">
            {LOAN_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <div key={cat.id} className="relative group overflow-visible">
                  <button
                    type="button"
                    onClick={() => handleTabChange(cat.id)}
                    className={`w-full flex flex-col items-center text-center p-3.5 rounded-2xl transition-all duration-300 cursor-pointer relative backdrop-blur-xl ${
                      isActive
                        ? "bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-700/90 text-white shadow-xl shadow-blue-600/35 font-bold scale-[1.03] ring-2 ring-blue-400/40 border border-white/40"
                        : "bg-white/50 hover:bg-white/85 text-slate-800 hover:text-blue-950 border border-white/70 hover:border-blue-300/80 shadow-xs hover:shadow-lg hover:shadow-blue-500/10 backdrop-saturate-150"
                    }`}
                  >
                    <span className="text-2xl mb-1.5 transition-transform duration-200 group-hover:scale-110">{cat.icon}</span>
                    <span className="text-xs font-bold truncate max-w-full tracking-tight">{cat.name}</span>

                    {cat.badge && (
                      <span
                        className={`absolute -top-2.5 -right-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md z-20 whitespace-nowrap transition-all backdrop-blur-md ${
                          isActive
                            ? "bg-amber-400/95 text-slate-950 border border-amber-200/90 shadow-amber-400/20"
                            : "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white border border-amber-300/50 shadow-orange-500/20"
                        }`}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Category Details */}
        <div className="space-y-6">
          {/* 1. Category Header & Key Metrics Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300 space-y-4 relative mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
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

            {/* Apply Loan Theme Blue Action Button centered in the middle on the bottom border line of the card */}
            <div className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 z-10">
              <button
                type="button"
                onClick={handleScrollToApplicantForm}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs px-5 py-2 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-white border border-blue-400/40 group shrink-0"
                title="Click to jump to Applicant Form below"
              >
                <span>Apply Loan</span>
                <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* 2. Why Choose F2 Fintech Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-xl p-6 border border-indigo-800/50 hover:shadow-lg transition-shadow duration-300 space-y-4">
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

          {/* RESTORED PREVIOUS FORMAT: REQUIRED DOCUMENTS SIDE-BY-SIDE CARDS */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Required Documents</h4>
                <p className="text-xs text-gray-500">Check required documents based on your employment profile for {currentCategory.name}</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${([currentCategory.requiredDocs.salaried, currentCategory.requiredDocs.selfEmployed, currentCategory.requiredDocs.doctors].filter(Boolean).length > 2)
                ? "md:grid-cols-2 lg:grid-cols-3"
                : "md:grid-cols-2"
              } gap-4 pt-1`}>
              {/* Salaried Employees */}
              {currentCategory.requiredDocs.salaried && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <Briefcase className="w-4 h-4 text-blue-600" /> Salaried Employees
                  </h5>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {currentCategory.requiredDocs.salaried.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Self-Employed / Business */}
              {currentCategory.requiredDocs.selfEmployed && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <Building className="w-4 h-4 text-indigo-600" /> Self-Employed / Business
                  </h5>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {currentCategory.requiredDocs.selfEmployed.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Doctors / Medical Professionals */}
              {currentCategory.requiredDocs.doctors && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" /> Doctors / Professionals
                  </h5>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {currentCategory.requiredDocs.doctors.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 3-STEP INTERACTIVE APPLICATION WIZARD CARD */}
          <div ref={wizardFormRef} id="applicantFormWizardSection" className="bg-white rounded-2xl border-2 border-blue-500/30 hover:shadow-xl transition-shadow duration-300 p-6 sm:p-8 relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-primary animate-gradient" />

            {/* Saved Draft Progress Restored Notice */}
            {isDraftRestored && (
              <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-blue-950 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold">
                  <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Draft Restored: You are right where you left off at Step {currentStep}!</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-blue-700 hover:text-blue-900 font-bold text-[11px] underline cursor-pointer shrink-0"
                >
                  Start Fresh
                </button>
              </div>
            )}

            {/* Stepper Progress Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Apply for {currentCategory.name}</h3>
                  <p className="text-xs text-gray-500">Complete the 3 quick steps below for guaranteed fast callback & disbursal assistance</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                    Step {currentStep} of 3 ({currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%"})
                  </span>
                </div>
              </div>

              {/* Progress Line */}
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100}%` }}
                />
              </div>

              {/* Step Badges Row */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`py-2.5 px-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${currentStep === 1
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20"
                      : currentStep > 1
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-50 text-gray-400 border-gray-200"
                    }`}
                >
                  <span>1. Applicant Details</span>
                  {currentStep > 1 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep > 1) setCurrentStep(2);
                  }}
                  className={`py-2.5 px-2 rounded-xl border transition-all duration-200 flex items-center justify-center gap-1.5 ${currentStep === 2
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20 cursor-pointer"
                      : currentStep > 2
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                >
                  <span>2. Core Documents</span>
                  {currentStep > 2 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 3) setCurrentStep(3);
                  }}
                  className={`py-2.5 px-2 rounded-xl border transition-all duration-200 flex items-center justify-center gap-1.5 ${currentStep === 3
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20 cursor-pointer"
                      : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                >
                  <span>3. Additional Docs</span>
                </button>
              </div>
            </div>

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
                  An F2 Fintech Relationship Manager will review your details & uploaded documents and contact you within 2 hours to finalize bank selection and disbursal.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmittedSuccess(false);
                    setSubmittedRefNo("");
                    setCurrentStep(1);
                  }}
                  className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Submit Another Loan Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitFinal} className="space-y-6">
                {/* STEP 1: APPLICANT DETAILS */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-primary" /> Step 1: Personal & Applicant Details
                      </h4>
                      <span className="text-[11px] text-gray-400">* Required Fields</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantFullName">
                          Full Name (As per PAN Card) *
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
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Father's Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantFatherName">
                          Father's Name *
                        </label>
                        <div className="relative">
                          <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantFatherName"
                            type="text"
                            required
                            value={formData.fatherName}
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            placeholder="Enter father's full name"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Mother's Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantMotherName">
                          Mother's Name *
                        </label>
                        <div className="relative">
                          <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantMotherName"
                            type="text"
                            required
                            value={formData.motherName}
                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                            placeholder="Enter mother's full name"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantMobile">
                          Mobile Number *
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
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Email (Mandatory) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantEmail">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantEmail"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email address"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* City */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantCity">
                          City / Location *
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantCity"
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="e.g. Mumbai, Delhi, Bengaluru"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                          />
                        </div>
                      </div>

                      {/* Employment Profile */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">Employment Profile</label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          <select
                            value={formData.employmentType}
                            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                            className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white appearance-none cursor-pointer"
                          >
                            <option value="salaried">Salaried (Pvt / Govt / MNC)</option>
                            <option value="self-employed">Self-Employed / Business</option>
                            <option value="doctor">Doctor / Professional</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Monthly Income */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 block">Monthly Income Range (Approx.)</label>
                        <div className="relative">
                          <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          <select
                            value={formData.monthlyIncome}
                            onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                            className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white appearance-none cursor-pointer"
                          >
                            <option value="">Select income range</option>
                            <option value="below_25k">Below ₹25,000</option>
                            <option value="25k_50k">₹25,000 - ₹50,000</option>
                            <option value="50k_1lakh">₹50,000 - ₹1,00,000</option>
                            <option value="above_1lakh">Above ₹1,00,000</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextStep1}
                        className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Next: Upload Documents</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: CORE UPLOAD DOCUMENTS (COMMON FOR ALL USERS) */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" /> Step 2: Upload Core Documents (Mandatory)
                        </h4>
                        <p className="text-xs text-gray-500">Common documents required for instant verification across all bank partners</p>
                      </div>
                      <span className="text-[11px] bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-md border border-amber-200">
                        100% Encrypted & Safe
                      </span>
                    </div>
                    

                    <div className="space-y-5">
                      {/* 1. AADHAAR CARD */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                              <FileCheck className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">1. Aadhaar Card <span className="text-red-500">* (Mandatory)</span></h5>
                              <p className="text-[11px] text-gray-500">Upload e-Aadhaar PDF or capture front & back photos</p>
                            </div>
                          </div>

                          {/* Mode Toggle */}
                          <div className="flex items-center bg-white border border-gray-200 p-0.5 rounded-lg text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => setAadhaarDoc({ ...aadhaarDoc, mode: "pdf" })}
                              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${aadhaarDoc.mode === "pdf" ? "bg-blue-600 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                              Upload PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => setAadhaarDoc({ ...aadhaarDoc, mode: "photo" })}
                              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${aadhaarDoc.mode === "photo" ? "bg-blue-600 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                              Front & Back Photo
                            </button>
                          </div>
                        </div>

                        {aadhaarDoc.mode === "pdf" ? (
                          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <input
                                id="aadhaarPdfInput"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => addFilesToDoc(setAadhaarDoc, e.target.files)}
                                className="hidden"
                              />
                              <label
                                htmlFor="aadhaarPdfInput"
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                              >
                                <Upload className="w-4 h-4" />
                                <span>{getDocFiles(aadhaarDoc).length > 0 ? "Add More PDF" : "Choose Aadhaar PDF"}</span>
                              </label>

                              {getDocFiles(aadhaarDoc).map((name, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-950 shadow-2xs">
                                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                  <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFileFromDoc(setAadhaarDoc, idx)}
                                    className="p-0.5 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-all cursor-pointer shrink-0 ml-1"
                                    title="Remove PDF"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Password Option Toggle */}
                            <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={aadhaarDoc.isEncrypted || false}
                                  onChange={(e) => setAadhaarDoc((prev: any) => ({ ...prev, isEncrypted: e.target.checked }))}
                                  className="w-3.5 h-3.5 text-blue-600 rounded"
                                />
                                <span className="font-semibold">Is this PDF Password Encrypted?</span>
                              </label>

                              {aadhaarDoc.isEncrypted && (
                                <div className="flex-1 max-w-xs relative">
                                  <Key className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                                  <input
                                    type="text"
                                    value={aadhaarDoc.pdfPassword || ""}
                                    onChange={(e) => setAadhaarDoc((prev: any) => ({ ...prev, pdfPassword: e.target.value }))}
                                    placeholder="Enter PDF Password (e.g. Name+DOB)"
                                    className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Front Photo */}
                              <div className="space-y-2 text-center p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <span className="text-xs font-bold text-gray-700 block">Aadhaar Front Side *</span>
                                {aadhaarDoc.frontPhoto ? (
                                  <div className="relative">
                                    <img src={aadhaarDoc.frontPhoto} alt="Aadhaar Front" className="h-24 mx-auto rounded border object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setAadhaarDoc((prev: any) => ({ ...prev, frontPhoto: undefined }))}
                                      className="mt-1 text-[10px] text-red-600 font-bold hover:underline"
                                    >
                                      Remove Photo
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("aadhaar_front")}
                                      className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer"
                                    >
                                      <Camera className="w-3.5 h-3.5" /> Capture / Upload Front
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Back Photo */}
                              <div className="space-y-2 text-center p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <span className="text-xs font-bold text-gray-700 block">Aadhaar Back Side *</span>
                                {aadhaarDoc.backPhoto ? (
                                  <div className="relative">
                                    <img src={aadhaarDoc.backPhoto} alt="Aadhaar Back" className="h-24 mx-auto rounded border object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setAadhaarDoc((prev: any) => ({ ...prev, backPhoto: undefined }))}
                                      className="mt-1 text-[10px] text-red-600 font-bold hover:underline"
                                    >
                                      Remove Photo
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("aadhaar_back")}
                                      className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer"
                                    >
                                      <Camera className="w-3.5 h-3.5" /> Capture / Upload Back
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Password Option Toggle for Aadhaar */}
                            <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={aadhaarDoc.isEncrypted || false}
                                  onChange={(e) => setAadhaarDoc((prev: any) => ({ ...prev, isEncrypted: e.target.checked }))}
                                  className="w-3.5 h-3.5 text-blue-600 rounded"
                                />
                                <span className="font-semibold">Is this PDF Password Encrypted?</span>
                              </label>

                              {aadhaarDoc.isEncrypted && (
                                <div className="flex-1 max-w-xs relative">
                                  <Key className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                                  <input
                                    type="text"
                                    value={aadhaarDoc.pdfPassword || ""}
                                    onChange={(e) => setAadhaarDoc((prev: any) => ({ ...prev, pdfPassword: e.target.value }))}
                                    placeholder="Enter Aadhaar Password (e.g. Name+DOB)"
                                    className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. PAN CARD */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                              <FileCheck className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">2. PAN Card <span className="text-red-500">* (Mandatory)</span></h5>
                              <p className="text-[11px] text-gray-500">Upload e-PAN PDF or capture front card photo</p>
                            </div>
                          </div>

                          <div className="flex items-center bg-white border border-gray-200 p-0.5 rounded-lg text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => setPanDoc({ ...panDoc, mode: "pdf" })}
                              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${panDoc.mode === "pdf" ? "bg-indigo-600 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                              Upload PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => setPanDoc({ ...panDoc, mode: "photo" })}
                              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${panDoc.mode === "photo" ? "bg-indigo-600 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                              Photo Capture
                            </button>
                          </div>
                        </div>

                        {panDoc.mode === "pdf" ? (
                          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <input
                                id="panPdfInput"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => addFilesToDoc(setPanDoc, e.target.files)}
                                className="hidden"
                              />
                              <label
                                htmlFor="panPdfInput"
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                              >
                                <Upload className="w-4 h-4" />
                                <span>{getDocFiles(panDoc).length > 0 ? "Add More PDF" : "Choose PAN PDF"}</span>
                              </label>

                              {getDocFiles(panDoc).map((name, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs text-indigo-950 shadow-2xs">
                                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFileFromDoc(setPanDoc, idx)}
                                    className="p-0.5 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-all cursor-pointer shrink-0 ml-1"
                                    title="Remove PDF"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={panDoc.isEncrypted || false}
                                  onChange={(e) => setPanDoc((prev: any) => ({ ...prev, isEncrypted: e.target.checked }))}
                                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                                />
                                <span className="font-semibold">Is this PDF Password Encrypted?</span>
                              </label>

                              {panDoc.isEncrypted && (
                                <div className="flex-1 max-w-xs relative">
                                  <Key className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                                  <input
                                    type="text"
                                    value={panDoc.pdfPassword || ""}
                                    onChange={(e) => setPanDoc((prev: any) => ({ ...prev, pdfPassword: e.target.value }))}
                                    placeholder="Enter PAN PDF Password"
                                    className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center">
                            {panDoc.frontPhoto ? (
                              <div className="relative">
                                <img src={panDoc.frontPhoto} alt="PAN Front" className="h-28 mx-auto rounded border object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setPanDoc((prev: any) => ({ ...prev, frontPhoto: undefined }))}
                                  className="mt-1 text-[10px] text-red-600 font-bold hover:underline"
                                >
                                  Remove Photo
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerCameraModal("pan_front")}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg inline-flex items-center gap-2 cursor-pointer"
                              >
                                <Camera className="w-4 h-4" /> Capture / Upload PAN Card Photo
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. PASSPORT SIZE PHOTO */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                              <ImageIcon className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">3. Passport Size Photo <span className="text-red-500">* (1 Photo - Mandatory)</span></h5>
                              <p className="text-[11px] text-gray-500">Upload PNG/JPG image or take live photo from camera</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                          {photoDoc.photoPreview ? (
                            <div className="relative shrink-0">
                              <img src={photoDoc.photoPreview} alt="User Photo" className="w-20 h-24 object-cover rounded-lg border-2 border-emerald-500" />
                              <button
                                type="button"
                                onClick={() => setPhotoDoc({})}
                                className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full text-xs shadow"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                              <UserIcon className="w-8 h-8" />
                            </div>
                          )}

                          <div className="space-y-2 text-center sm:text-left flex-1">
                            <div className="flex flex-wrap gap-2">
                              <input
                                id="userPhotoInput"
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    setPhotoDoc({ fileName: file.name, photoPreview: url });
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="userPhotoInput"
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Upload className="w-4 h-4" /> Upload Image (PNG/JPG)
                              </label>

                              <button
                                type="button"
                                onClick={() => triggerCameraModal("photo")}
                                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer border border-gray-300"
                              >
                                <Camera className="w-4 h-4 text-emerald-600" /> Take Photo from Camera
                              </button>
                            </div>
                            <p className="text-[11px] text-gray-500">{photoDoc.fileName || "Clear front facing photo required for KYC"}</p>
                          </div>
                        </div>
                      </div>

                      {/* 4. 3 MONTHS SALARY SLIPS (OPTIONAL) */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                              <FileText className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">4. Three Months Salary Slips <span className="text-gray-400 font-normal">(Optional)</span></h5>
                              <p className="text-[11px] text-gray-500">Upload last 3 months salary slips if salaried employee</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <input
                              id="salarySlipsInput"
                              type="file"
                              multiple
                              accept=".pdf, image/*"
                              onChange={(e) => addFilesToDoc(setSalarySlipsDoc, e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor="salarySlipsInput"
                              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{getDocFiles(salarySlipsDoc).length > 0 ? "Add More Salary Slips" : "Upload Salary Slips"}</span>
                            </label>

                            {getDocFiles(salarySlipsDoc).map((name, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs text-purple-950 shadow-2xs">
                                <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                                <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFileFromDoc(setSalarySlipsDoc, idx)}
                                  className="p-0.5 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-all cursor-pointer shrink-0 ml-1"
                                  title="Remove this PDF"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 5. PROFESSIONAL / COMPANY ID CARD (OPTIONAL) */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                              <Briefcase className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">5. Company ID Card / Professional Registration <span className="text-gray-400 font-normal">(Optional)</span></h5>
                              <p className="text-[11px] text-gray-500">Required if professional or company employee</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <input
                              id="idCardInput"
                              type="file"
                              accept=".pdf, image/*"
                              onChange={(e) => addFilesToDoc(setIdCardDoc, e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor="idCardInput"
                              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{getDocFiles(idCardDoc).length > 0 ? "Add More File" : "Upload ID Card"}</span>
                            </label>

                            {getDocFiles(idCardDoc).map((name, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-950 shadow-2xs">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFileFromDoc(setIdCardDoc, idx)}
                                  className="p-0.5 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-all cursor-pointer shrink-0 ml-1"
                                  title="Remove this file"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 6. SIX MONTHS BANK STATEMENT (MANDATORY WITH EXAMPLE NOTICE) */}
                      <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/90 p-4 sm:p-5 rounded-2xl border-2 border-amber-300/80 space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-amber-600 text-white rounded-lg shadow-2xs">
                              <Banknote className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">6. Six Months Bank Statement <span className="text-red-500">* (Mandatory)</span></h5>
                              <p className="text-[11px] text-amber-900 font-bold">{bankStatementNotice.subtext}</p>
                            </div>
                          </div>
                        </div>

                        {/* Statement Date Example Box */}
                        <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950">
                            <Info className="w-4 h-4 text-amber-600" />
                            <span>Statement Date Example:</span>
                          </div>
                          <p className="text-[11px] text-gray-700 leading-snug font-medium">
                            {bankStatementNotice.exampleText}
                          </p>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <input
                              id="bankStatementPdfInput"
                              type="file"
                              accept=".pdf"
                              onChange={(e) => addFilesToDoc(setBankStatementDoc, e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor="bankStatementPdfInput"
                              className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{getDocFiles(bankStatementDoc).length > 0 ? "Add More PDF" : "Choose Bank Statement PDF"}</span>
                            </label>

                            {getDocFiles(bankStatementDoc).map((name, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg text-xs text-amber-950 shadow-2xs">
                                <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                                <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFileFromDoc(setBankStatementDoc, idx)}
                                  className="p-0.5 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-all cursor-pointer shrink-0 ml-1"
                                  title="Remove this Bank Statement PDF"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={bankStatementDoc.isEncrypted || false}
                                onChange={(e) => setBankStatementDoc((prev: any) => ({ ...prev, isEncrypted: e.target.checked }))}
                                className="w-3.5 h-3.5 text-amber-600 rounded"
                              />
                              <span className="font-semibold">Is Bank Statement PDF Password Protected?</span>
                            </label>

                            {bankStatementDoc.isEncrypted && (
                              <div className="flex-1 max-w-xs relative">
                                <Key className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                                <input
                                  type="text"
                                  value={bankStatementDoc.pdfPassword || ""}
                                  onChange={(e) => setBankStatementDoc((prev: any) => ({ ...prev, pdfPassword: e.target.value }))}
                                  placeholder="Enter Bank PDF Password"
                                  className="w-full pl-8 pr-2 py-1.5 border border-amber-300 rounded-lg text-xs bg-amber-50/50"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-gray-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep2}
                        className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Next: Additional Documents</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: ADDITIONAL DOCUMENTS (CUSTOMIZED PER LOAN TYPE) */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" /> Step 3: Additional Documents for {currentCategory.name}
                        </h4>
                        <p className="text-xs text-gray-500">Customized document requirements for {currentCategory.name} disbursal</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {currentCategory.additionalDocFields.map((field) => (
                        <div key={field.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-900 block">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <span className="text-[10px] text-gray-400">{field.required ? "Mandatory" : "Optional"}</span>
                          </div>
                          <p className="text-[11px] text-gray-500">{field.description}</p>

                          <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <input
                              id={`additional_${field.id}`}
                              type="file"
                              accept=".pdf, image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setAdditionalUploaded((prev) => {
                                    const currentList = getAdditionalFiles(field.id);
                                    const updated = Array.from(new Set([...currentList, file.name]));
                                    return {
                                      ...prev,
                                      [field.id]: { fileName: updated[0], fileList: updated }
                                    };
                                  });
                                }
                              }}
                              className="hidden"
                            />
                            <label
                              htmlFor={`additional_${field.id}`}
                              className="px-3.5 py-1.5 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 font-bold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{getAdditionalFiles(field.id).length > 0 ? "Add More File" : "Upload Document"}</span>
                            </label>

                            {getAdditionalFiles(field.id).map((name: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-950 shadow-2xs">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdditionalUploaded((prev) => {
                                      const currentList = getAdditionalFiles(field.id);
                                      const updated = currentList.filter((_: string, i: number) => i !== idx);
                                      if (updated.length === 0) {
                                        const copy = { ...prev };
                                        delete copy[field.id];
                                        return copy;
                                      }
                                      return {
                                        ...prev,
                                        [field.id]: { fileName: updated[0], fileList: updated }
                                      };
                                    });
                                  }}
                                  className="p-0.5 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-all cursor-pointer shrink-0 ml-1"
                                  title="Remove File"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Authorization Checkbox */}
                    <div className="flex items-start gap-2.5 pt-2 bg-blue-50/70 p-4 rounded-xl border border-blue-100">
                      <input
                        id="acceptTermsCheckbox"
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer shrink-0"
                      />
                      <label htmlFor="acceptTermsCheckbox" className="text-xs text-gray-700 leading-snug cursor-pointer select-none">
                        I hereby authorize F2 Fintech and its partner lenders to process my application and uploaded KYC documents for loan sanction and disbursal.
                      </label>
                    </div>

                    {/* Final Submit & Back Buttons */}
                    <div className="pt-4 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-gray-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Core Docs</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.acceptTerms}
                        className="py-3.5 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Submitting Application...</span>
                          </>
                        ) : (
                          <>
                            <span>Complete & Submit Loan Application via F2 Fintech</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Bottom Inverted Blue Gradient Strip */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-indigo-500 to-blue-600 animate-gradient" />
          </div>

          {/* Clean Section Partition Divider in the Gap Between Wizard Form & FAQs */}
          <div className="my-2 flex items-center gap-4">
            <div className="flex-1 border-t border-slate-300/80" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3.5 py-1 bg-slate-100/90 rounded-full border border-slate-200/80 shadow-2xs">
              Help & Support
            </span>
            <div className="flex-1 border-t border-slate-300/80" />
          </div>

          {/* FAQs Accordion */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300 space-y-4">
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

      {/* LIVE CAMERA CAPTURE WEBRTC MODAL */}
      {cameraModalTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 animate-pulse" />
                <h4 className="text-sm font-bold text-gray-900">
                  {cameraModalTarget === "photo" ? "Take Passport Photo" : "Capture Document Photo"}
                </h4>
              </div>
              <button
                type="button"
                onClick={stopCameraStream}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 text-center text-white space-y-3 relative overflow-hidden min-h-[240px] flex flex-col items-center justify-center border border-slate-800">
              {simulatedSnapshot ? (
                <div className="space-y-2 w-full">
                  <img src={simulatedSnapshot} alt="Captured Preview" className="h-48 mx-auto rounded-lg border-2 border-emerald-400 object-cover shadow-md" />
                  <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Photo Captured Successfully!
                  </p>
                </div>
              ) : cameraError ? (
                <div className="p-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-red-300 font-medium leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startRealCamera}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Camera Access
                  </button>
                </div>
              ) : (
                <div className="relative w-full space-y-2">
                  {isCameraLoading ? (
                    <div className="py-12 space-y-2">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-gray-300">Requesting laptop/device camera permission...</p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={(el) => {
                          videoRef.current = el;
                          if (el && cameraStream && el.srcObject !== cameraStream) {
                            el.srcObject = cameraStream;
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-48 object-cover rounded-lg border border-slate-700 bg-black"
                      />
                      <p className="text-[11px] text-gray-300 font-medium">Position your document/face inside frame & click snap photo</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {simulatedSnapshot ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedSnapshot(null);
                      startRealCamera();
                    }}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" /> Use This Photo
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={captureRealPhotoSnapshot}
                  disabled={Boolean(cameraError) || isCameraLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> Click Snap Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terms, Privacy Policy & DPDP Consent Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        defaultTab={activePolicyTab}
      />
    </div>
  );
}
// added new comment at the bottom for sync 2.0