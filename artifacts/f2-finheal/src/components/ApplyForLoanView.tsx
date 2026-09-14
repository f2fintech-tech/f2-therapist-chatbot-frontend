import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Menu,
  CheckCircle,
  FileText,
  User as UserIcon,
  UserCheck,
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
  GraduationCap,
  ChevronLeft,
  X,
  FileCheck,
  Building,
  RefreshCw
} from "lucide-react";
import PolicyModal from "./PolicyModal";

interface DirectorDetail {
  id: string;
  name: string;
  phone: string;
  email: string;
  aadhaarDoc: {
    mode?: "pdf" | "photo";
    fileName?: string;
    fileList?: string[];
    frontPhoto?: string;
    backPhoto?: string;
    isEncrypted?: boolean;
    pdfPassword?: string;
  };
  panDoc: {
    mode?: "pdf" | "photo";
    fileName?: string;
    fileList?: string[];
    frontPhoto?: string;
    backPhoto?: string;
    isEncrypted?: boolean;
    pdfPassword?: string;
  };
  photoDoc: {
    fileName?: string;
    photoPreview?: string;
  };
}

interface PartnerDetail {
  id: string;
  name: string;
  phone: string;
  aadhaarDoc: {
    mode?: "pdf" | "photo";
    fileName?: string;
    fileList?: string[];
    frontPhoto?: string;
    backPhoto?: string;
    isEncrypted?: boolean;
    pdfPassword?: string;
  };
  panDoc: {
    mode?: "pdf" | "photo";
    fileName?: string;
    fileList?: string[];
    frontPhoto?: string;
    backPhoto?: string;
    isEncrypted?: boolean;
    pdfPassword?: string;
  };
}

export interface EducationLoanDetails {
  applicantEmail: string;
  applicantMobile: string;
  applicantMotherName: string;
  applicantAadhaarDoc: { mode?: "pdf" | "photo"; fileName?: string; fileList?: string[]; frontPhoto?: string; backPhoto?: string; isEncrypted?: boolean; pdfPassword?: string };
  applicantPanDoc: { mode?: "pdf" | "photo"; fileName?: string; fileList?: string[]; frontPhoto?: string; backPhoto?: string; isEncrypted?: boolean; pdfPassword?: string };
  applicantMarksheetsDoc: { fileName?: string; fileList?: string[] };
  applicantOfferLetterDoc: { fileName?: string; fileList?: string[] };
  applicantFeeStructureDoc: { fileName?: string; fileList?: string[] };
  applicantEntranceExamDoc: { fileName?: string; fileList?: string[] };
  applicantCancelledChequeDoc: { fileName?: string; fileList?: string[] };

  coApplicantRelation: string;
  coApplicantRelationOther: string;
  coApplicantEmploymentType: "salaried" | "self_employed";
  coApplicantEmail: string;
  coApplicantMobile: string;
  coApplicantMotherName: string;
  coApplicantAadhaarDoc: { mode?: "pdf" | "photo"; fileName?: string; fileList?: string[]; frontPhoto?: string; backPhoto?: string; isEncrypted?: boolean; pdfPassword?: string };
  coApplicantPanDoc: { mode?: "pdf" | "photo"; fileName?: string; fileList?: string[]; frontPhoto?: string; backPhoto?: string; isEncrypted?: boolean; pdfPassword?: string };
  coApplicantCancelledChequeDoc: { fileName?: string; fileList?: string[] };

  coApplicantForm16Doc: { fileName?: string; fileList?: string[] };
  coApplicantSalarySlipsDoc: { fileName?: string; fileList?: string[] };
  coApplicantCompanyIdDoc: { fileName?: string; fileList?: string[] };

  coApplicantItrDoc: { fileName?: string; fileList?: string[] };
  coApplicantUdyamDoc: { fileName?: string; fileList?: string[] };
  coApplicantGstDoc: { fileName?: string; fileList?: string[] };
  coApplicantFinancialsDoc: { fileName?: string; fileList?: string[] };
}

const initialEduDetails: EducationLoanDetails = {
  applicantEmail: "",
  applicantMobile: "",
  applicantMotherName: "",
  applicantAadhaarDoc: { mode: "pdf" },
  applicantPanDoc: { mode: "pdf" },
  applicantMarksheetsDoc: {},
  applicantOfferLetterDoc: {},
  applicantFeeStructureDoc: {},
  applicantEntranceExamDoc: {},
  applicantCancelledChequeDoc: {},

  coApplicantRelation: "father",
  coApplicantRelationOther: "",
  coApplicantEmploymentType: "salaried",
  coApplicantEmail: "",
  coApplicantMobile: "",
  coApplicantMotherName: "",
  coApplicantAadhaarDoc: { mode: "pdf" },
  coApplicantPanDoc: { mode: "pdf" },
  coApplicantCancelledChequeDoc: {},

  coApplicantForm16Doc: {},
  coApplicantSalarySlipsDoc: {},
  coApplicantCompanyIdDoc: {},

  coApplicantItrDoc: {},
  coApplicantUdyamDoc: {},
  coApplicantGstDoc: {},
  coApplicantFinancialsDoc: {}
};

export interface ProfessionalLoanDetails {
  professionType: "doctor" | "ca_cs_cma";
  doctorUgDegreeDoc: { fileName?: string; fileList?: string[]; photoPreview?: string };
  doctorUgRegistrationDoc: { fileName?: string; fileList?: string[]; photoPreview?: string };
  doctorPgDegreeDoc: { fileName?: string; fileList?: string[]; photoPreview?: string };
  doctorPgRegistrationDoc: { fileName?: string; fileList?: string[]; photoPreview?: string };
  doctorConsultancyLetterDoc: { fileName?: string; fileList?: string[]; photoPreview?: string };
  doctorLetterHeadDoc: { fileName?: string; fileList?: string[] };
  doctorItrDoc: { fileName?: string; fileList?: string[] };
  doctorCoiDoc: { fileName?: string; fileList?: string[] };
  doctorUdyamDoc: { fileName?: string; fileList?: string[] };

  financialCopDoc: { fileName?: string; fileList?: string[] };
  financialComDoc: { fileName?: string; fileList?: string[] };
  financialFirmCardDoc: { fileName?: string; fileList?: string[] };
  financialLetterHeadDoc: { fileName?: string; fileList?: string[] };
  financialItrCoiDoc: { fileName?: string; fileList?: string[] };
  financialUdyamShopDoc: { fileName?: string; fileList?: string[] };
}

const initialProDetails: ProfessionalLoanDetails = {
  professionType: "doctor",
  doctorUgDegreeDoc: {},
  doctorUgRegistrationDoc: {},
  doctorPgDegreeDoc: {},
  doctorPgRegistrationDoc: {},
  doctorConsultancyLetterDoc: {},
  doctorLetterHeadDoc: {},
  doctorItrDoc: {},
  doctorCoiDoc: {},
  doctorUdyamDoc: {},

  financialCopDoc: {},
  financialComDoc: {},
  financialFirmCardDoc: {},
  financialLetterHeadDoc: {},
  financialItrCoiDoc: {},
  financialUdyamShopDoc: {}
};

export interface HlLapDetails {
  employmentType: "salaried" | "self_employed";
  salariedForm16Doc: { fileName?: string; fileList?: string[] };
  salariedItrDoc: { fileName?: string; fileList?: string[] };
  hlBbaAtsDoc: { fileName?: string; fileList?: string[] };
  hlSalesDeedDoc: { fileName?: string; fileList?: string[] };
  hlSanctionLetterDoc: { fileName?: string; fileList?: string[] };
  hlSoaDoc: { fileName?: string; fileList?: string[] };
  lapRegistryCopyDoc: { fileName?: string; fileList?: string[] };
  lapSalesDeedDoc: { fileName?: string; fileList?: string[] };
  lapGpaPowerDoc: { fileName?: string; fileList?: string[] };
}

const initialHlLapDetails: HlLapDetails = {
  employmentType: "salaried",
  salariedForm16Doc: {},
  salariedItrDoc: {},
  hlBbaAtsDoc: {},
  hlSalesDeedDoc: {},
  hlSanctionLetterDoc: {},
  hlSoaDoc: {},
  lapRegistryCopyDoc: {},
  lapSalesDeedDoc: {},
  lapGpaPowerDoc: {}
};

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
    startRate: "9.99% p.a.",
    maxTenure: "Up to 5 Years",
    processingTime: "24 - 48 Hours",
    defaultAmountNum: 500000,
    minAmountNum: 50000,
    maxAmountNum: 4000000,
    stepAmountNum: 25000,
    defaultRateNum: 9.99,
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
      { id: "form_16_2yr", label: "Form 16 (Last 2 Years - Part A & Part B)", description: "For the last 2 financial years", required: true },
      { id: "itr_2yr", label: "ITR (Last 2 Financial Years)", description: "For the last 2 financial years", required: true }
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
    startRate: "14.5% p.a.",
    maxTenure: "Up to 7 Years",
    processingTime: "48 - 72 Hours",
    defaultAmountNum: 2000000,
    minAmountNum: 200000,
    maxAmountNum: 10000000,
    stepAmountNum: 100000,
    defaultRateNum: 14.5,
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
    startRate: "7.35% p.a.",
    maxTenure: "Up to 30 Years",
    processingTime: "4 - 7 Days",
    defaultAmountNum: 5000000,
    minAmountNum: 500000,
    maxAmountNum: 30000000,
    stepAmountNum: 250000,
    defaultRateNum: 7.35,
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
    startRate: "8.0% p.a.",
    maxTenure: "Up to 15 Years",
    processingTime: "4 - 7 Days",
    defaultAmountNum: 7500000,
    minAmountNum: 1000000,
    maxAmountNum: 50000000,
    stepAmountNum: 500000,
    defaultRateNum: 8.0,
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
    name: "Professional Loan",
    icon: "👨‍💼",
    badge: "Exclusive Professional Credit",
    heroTagline: "Tailored High-Limit Financing for Certified Doctors, CAs, CS, CMAs & Professionals",
    description: "Specialized credit facilities for Chartered Accountants (CA), Company Secretaries (CS), Cost Accountants (CMA), Doctors (MBBS, BDS, MD, MS, BAMS, BHMS), and certified professionals to set up offices/clinics, purchase equipment, or expand professional practice.",
    maxAmount: "Up to ₹1 Crore",
    startRate: "11.5% p.a.",
    maxTenure: "Up to 7 Years",
    processingTime: "24 - 48 Hours",
    defaultAmountNum: 2500000,
    minAmountNum: 200000,
    maxAmountNum: 10000000,
    stepAmountNum: 100000,
    defaultRateNum: 13.5,
    defaultTenureNum: 5,
    features: [
      "Pre-approved loan limits up to ₹1 Cr based on qualification degree & COP",
      "Zero collateral required for qualified medical & financial professionals",
      "Office expansion, clinic setup & equipment purchase financing",
      "Flexible repayment terms up to 84 months",
      "Minimal documentation with fast-track processing"
    ],
    f2Advantages: [
      "Exclusive professional loan programs in partnership with premier lenders",
      "Simplified evaluation based on degree certificate, COP & practice duration",
      "Special low interest rate brackets tailored for CAs, CS, CMAs & Doctors",
      "Doorstep service by F2 Professional Loan Experts",
      "No financial statement audit required for limits up to ₹25 Lakhs"
    ],
    requiredDocs: {
      doctors: [
        "PAN Card & Aadhaar Card",
        "Professional Qualification Certificate & COP (CA / CS / CMA / MBBS / BDS / MD / MS)",
        "Professional Institute / Council Registration (ICAI / ICSI / ICMAI / MCI / State Council)",
        "Last 6 Months Bank Statement",
        "Proof of Practice / Office / Clinic Registration (if applicable)"
      ]
    },
    eligibilityCriteria: [
      "Recognized professional degree & COP certified by ICAI / ICSI / ICMAI / MCI / State Council",
      "Minimum 1 year of post-qualification experience or practice",
      "Age between 25 to 65 years"
    ],
    faq: [
      {
        q: "Do I need financial statements (ITR) for a Professional Loan?",
        a: "For pre-approved professional loan limits up to ₹25 Lakhs, financial statements are often waived based on your professional COP or registration certificate!"
      },
      {
        q: "Can I use the Professional Loan to expand my office or clinic?",
        a: "Yes! Funds can be used for office/clinic expansion, equipment, technology upgrades, interior setup, or general professional expenses."
      }
    ],
    additionalDocFields: [
      { id: "professional_degree", label: "Professional Qualification Certificate & COP (CA / CS / CMA / MBBS / MD / BDS)", description: "Copy of professional degree certificate & COP", required: true },
      { id: "council_reg", label: "Professional Institute / Council Registration (ICAI / ICSI / ICMAI / MCI)", description: "Registration certificate from ICAI, ICSI, ICMAI, or MCI/State Council", required: true }
    ]
  },
  {
    id: "education",
    name: "Education Loan",
    icon: "🎓",
    badge: "100% Studies Financing",
    heroTagline: "Fund Higher Education in India & Abroad with Flexible Repayment",
    description: "Comprehensive financial support for Premier Domestic Colleges and Abroad Universities covering tuition fees, accommodation, travel, & study expenses.",
    maxAmount: "Up to ₹1.5 Crore",
    startRate: "8.5% p.a.",
    maxTenure: "Up to 15 Years",
    processingTime: "4 - 7 Days",
    defaultAmountNum: 1500000,
    minAmountNum: 100000,
    maxAmountNum: 15000000,
    stepAmountNum: 50000,
    defaultRateNum: 8.5,
    defaultTenureNum: 10,
    features: [
      "Collateral-free loans available up to ₹40 Lakhs for top premier universities",
      "Moratorium period (Course duration + 1 year grace period before EMI starts)",
      "Covers tuition fees, hostel fees, books, laptops, and travel tickets",
      "Tax deduction benefits on interest paid under Section 80E without upper cap",
      "Pre-admission loan sanction letter for visa & university application"
    ],
    f2Advantages: [
      "Direct tie-ups with 20+ specialized Education Loan Lenders & International Lenders",
      "Fast-track pre-visa sanction letters within 48 hours for overseas studies",
      "Flexible co-borrower criteria (parents, siblings, or spouse)",
      "Doorstep guidance by dedicated F2 Overseas & Domestic Education Loan Experts",
      "Zero processing fee offers for top-ranked STEM & Management programs"
    ],
    requiredDocs: {
      salaried: [
        "KYC: Student & Co-Applicant PAN & Aadhaar Card",
        "Admission Offer Letter / I-20 Form from College / University",
        "Mark Sheets / Passing Certificates of 10th, 12th & Graduation",
        "Co-Applicant Income Proofs: Last 3 Months Salary Slips & 6 Months Bank Statement"
      ],
      selfEmployed: [
        "KYC: Student & Co-Applicant PAN & Aadhaar Card",
        "Admission Offer Letter & Fee Structure from Institution",
        "Past Academic Certificates (Mark sheets, Entrance Exam Scorecard)",
        "Co-Applicant Income Proofs: Last 2 Years ITR & 12 Months Bank Statement"
      ]
    },
    eligibilityCriteria: [
      "Indian citizen with confirmed admission in recognized Indian or foreign institution",
      "Solid academic track record in 10th, 12th, or undergraduate degree",
      "Earning co-borrower (Parent, Spouse, or Relative) with stable income source"
    ],
    faq: [
      {
        q: "What is the Moratorium Period in an Education Loan?",
        a: "The moratorium period is a repayment holiday during your course duration plus an additional 6 to 12 months grace period. Full EMI repayment starts only after your course completion!"
      },
      {
        q: "Can I get an Education Loan without collateral?",
        a: "Yes! F2 Fintech offers collateral-free education loans up to ₹40 Lakhs for leading Indian premier institutes (IITs, IIMs, NITs) and top foreign universities."
      },
      {
        q: "Is there any tax benefit on Education Loans?",
        a: "Yes! Under Section 80E of the Income Tax Act, the entire interest paid on an education loan is 100% tax deductible without any maximum cap!"
      }
    ],
    additionalDocFields: [
      { id: "admission_letter", label: "University Admission Offer Letter / I-20 / Fee Structure", description: "Official acceptance letter from institution", required: true },
      { id: "academic_records", label: "Academic Marksheets (10th, 12th, Graduation)", description: "Pass certificates and entrance test scorecards", required: true }
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

  const normalizeCategory = (cat?: string) => {
    if (!cat) return "personal";
    if (cat === "professional" || cat === "doctor") return "doctor";
    return cat;
  };

  const initialDraft = useMemo(() => loadSavedDraft(), []);

  const [activeTab, setActiveTab] = useState<string>(normalizeCategory(initialDraft?.activeTab || initialCategory));
  const [businessType, setBusinessType] = useState<string>(initialDraft?.businessType || "sole_proprietorship");
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
    officialEmail: "",
    city: "",
    currentAddress: "",
    permanentAddress: "",
    sameAsCurrentAddress: false,
    workingAddress: "",
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
  const [currentAddressProofDoc, setCurrentAddressProofDoc] = useState(initialDraft?.currentAddressProofDoc || {});
  const [permanentAddressProofDoc, setPermanentAddressProofDoc] = useState(initialDraft?.permanentAddressProofDoc || {});
  const [form26ASDoc, setForm26ASDoc] = useState(initialDraft?.form26ASDoc || {});
  const [additionalUploaded, setAdditionalUploaded] = useState<Record<string, { fileName?: string; fileList?: string[] }>>(initialDraft?.additionalUploaded || {});
  const [companyOfficialEmail, setCompanyOfficialEmail] = useState<string>(initialDraft?.companyOfficialEmail || "");
  const [pvtDirectors, setPvtDirectors] = useState<DirectorDetail[]>(
    initialDraft?.pvtDirectors || [
      {
        id: "dir_1",
        name: "",
        phone: "",
        email: "",
        aadhaarDoc: { mode: "pdf" },
        panDoc: { mode: "pdf" },
        photoDoc: {}
      }
    ]
  );
  const [partnershipPartners, setPartnershipPartners] = useState<PartnerDetail[]>(
    initialDraft?.partnershipPartners || [
      {
        id: "partner_1",
        name: "",
        phone: "",
        aadhaarDoc: { mode: "pdf" },
        panDoc: { mode: "pdf" }
      }
    ]
  );
  const [eduDetails, setEduDetails] = useState<EducationLoanDetails>({ ...initialEduDetails, ...(initialDraft?.eduDetails || {}) });
  const [proDetails, setProDetails] = useState<ProfessionalLoanDetails>({ ...initialProDetails, ...(initialDraft?.proDetails || {}) });
  const [hlLapDetails, setHlLapDetails] = useState<HlLapDetails>({ ...initialHlLapDetails, ...(initialDraft?.hlLapDetails || {}) });

  // Synchronize category and prefilled values when navigated from Eligibility Checker or other tabs
  useEffect(() => {
    if (initialCategory) {
      const norm = normalizeCategory(initialCategory);
      setActiveTab(norm);
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.formData?.desiredAmount) {
            setFormData((prev: any) => ({
              ...prev,
              desiredAmount: parsed.formData.desiredAmount,
              tenureYears: parsed.formData.tenureYears || prev.tenureYears
            }));
          }
        }
      } catch { }
    }
  }, [initialCategory]);

  // Auto-save form & stage progress to localStorage whenever state updates
  useEffect(() => {
    try {
      const payload = {
        activeTab,
        currentStep,
        formData,
        businessType,
        aadhaarDoc,
        panDoc,
        photoDoc,
        salarySlipsDoc,
        idCardDoc,
        bankStatementDoc,
        currentAddressProofDoc,
        permanentAddressProofDoc,
        form26ASDoc,
        additionalUploaded,
        companyOfficialEmail,
        pvtDirectors,
        partnershipPartners,
        eduDetails,
        proDetails,
        hlLapDetails,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save loan draft", e);
    }
  }, [activeTab, currentStep, formData, businessType, aadhaarDoc, panDoc, photoDoc, salarySlipsDoc, idCardDoc, bankStatementDoc, currentAddressProofDoc, permanentAddressProofDoc, form26ASDoc, additionalUploaded, companyOfficialEmail, pvtDirectors, partnershipPartners, eduDetails, proDetails, hlLapDetails]);

  // Ensure minimum 2 directors for Limited Liability Partnership (LLP)
  useEffect(() => {
    if (businessType === "llp" && pvtDirectors.length < 2) {
      setPvtDirectors((prev) => {
        if (prev.length >= 2) return prev;
        const copy = [...prev];
        while (copy.length < 2) {
          copy.push({
            id: `dir_${Date.now()}_${copy.length + 1}`,
            name: "",
            phone: "",
            email: "",
            aadhaarDoc: { mode: "pdf" },
            panDoc: { mode: "pdf" },
            photoDoc: {}
          });
        }
        return copy;
      });
    }
  }, [businessType]);

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to reset the form and start a new application?")) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) { }
      setIsDraftRestored(false);
      setCurrentStep(1);
      setBusinessType("sole_proprietorship");
      setCompanyOfficialEmail("");
      setPvtDirectors([
        {
          id: "dir_1",
          name: "",
          phone: "",
          email: "",
          aadhaarDoc: { mode: "pdf" },
          panDoc: { mode: "pdf" },
          photoDoc: {}
        }
      ]);
      setPartnershipPartners([
        {
          id: "partner_1",
          name: "",
          phone: "",
          aadhaarDoc: { mode: "pdf" },
          panDoc: { mode: "pdf" }
        }
      ]);
      setEduDetails(initialEduDetails);
      setProDetails(initialProDetails);
      setHlLapDetails(initialHlLapDetails);
      setFormData({
        fullName: "",
        fatherName: "",
        motherName: "",
        mobileNumber: "",
        email: "",
        officialEmail: "",
        city: "",
        currentAddress: "",
        permanentAddress: "",
        sameAsCurrentAddress: false,
        workingAddress: "",
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
      setCurrentAddressProofDoc({});
      setPermanentAddressProofDoc({});
      setForm26ASDoc({});
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
    if (docState.photoPreview) {
      return ["captured_photo.jpg"];
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

  // Dynamic helper for additional document fields customized per loan & entity type
  const getEffectiveDocFields = () => {
    if (activeTab === "business" || ((activeTab === "home" || activeTab === "lap") && hlLapDetails.employmentType === "self_employed")) {
      if (businessType === "sole_proprietorship") {
        return [
          {
            id: "comp_income_2yr",
            label: "Computation of Income (Last 2 Financial Years)",
            description: "Upload Computation of Income sheet for the last 2 financial years",
            required: true
          },
          {
            id: "financials_pnl_bs",
            label: "Financials (Profit & Loss Statement & Balance Sheet - Last 2 Years)",
            description: "Upload Profit & Loss Statement & Audited/Certified Balance Sheet for the last 2 years",
            required: true
          },
          {
            id: "udyam_shop_act",
            label: "Udyam Registration / Shop & Establishment Act Registration",
            description: "Upload Udyam Aadhar or Shop & Establishment Act Registration certificate",
            required: true
          },
          {
            id: "gst_cert",
            label: "GST Registration Certificate & Returns",
            description: "Upload GST Registration certificate & recent GST returns",
            required: false
          },
          {
            id: "itr_2yr_biz",
            label: "ITR (Last 2 Financial Years)",
            description: "Upload Income Tax Returns (ITR with computation sheet) for the last 2 years",
            required: true
          }
        ];
      }
      if (businessType === "pvt_ltd") {
        return [
          {
            id: "bank_stmt_1yr_pvt",
            label: "1 Year Current Account Bank Statement",
            description: "Upload official bank account statement for the last 12 months for the company's primary current account",
            required: true
          },
          {
            id: "itr_2yr_pvt",
            label: "ITR (Last 2 Financial Years)",
            description: "Upload Income Tax Returns for the company for the last 2 financial years",
            required: true
          },
          {
            id: "comp_income_2yr_ca_pvt",
            label: "Computation of Income (Last 2 Financial Years - Verified by CA)",
            description: "Upload Computation of Income sheet for the last 2 financial years certified and verified by a Chartered Accountant (CA)",
            required: true
          },
          {
            id: "financials_pnl_bs_pvt",
            label: "Financial Statements (Profit & Loss Statement & Balance Sheet - Last 2 Years)",
            description: "Upload Audited Profit & Loss Statement and Balance Sheet for the last 2 financial years",
            required: true
          },
          {
            id: "gstr_3b_2yr_pvt",
            label: "GSTR-3B Returns (Last 2 Financial Years)",
            description: "Upload GSTR-3B monthly/quarterly returns filed for the last 2 years",
            required: true
          },
          {
            id: "lod_pvt",
            label: "List of Directors (LOD)",
            description: "Upload certified List of Directors (LOD) on company letterhead signed by authorized signatory",
            required: true
          },
          {
            id: "shareholders_list_pvt",
            label: "List of Shareholders",
            description: "Upload certified list of current shareholders with equity percentage breakdown",
            required: true
          },
          {
            id: "aoa_pvt",
            label: "Articles of Association (AOA)",
            description: "Upload official Articles of Association of the company",
            required: true
          },
          {
            id: "moa_pvt",
            label: "Memorandum of Association (MOA)",
            description: "Upload official Memorandum of Association of the company",
            required: true
          },
          {
            id: "udyam_pvt",
            label: "Udyam Registration Certificate",
            description: "Upload Udyam MSME registration certificate of the company",
            required: true
          },
          {
            id: "company_pan_pvt",
            label: "Company PAN Card",
            description: "Upload clear PDF or image of the Company PAN Card",
            required: true
          },
          {
            id: "gst_cert_pvt",
            label: "GST Registration Certificate",
            description: "Upload GST Registration Certificate (Form REG-06)",
            required: true
          }
        ];
      }
      if (businessType === "partnership") {
        return [
          {
            id: "partnership_deed",
            label: "Partnership Deed",
            description: "Upload registered or notarized Partnership Deed of the firm",
            required: true
          },
          {
            id: "udyam_partnership",
            label: "Udyam Registration Certificate",
            description: "Upload Udyam MSME Registration Certificate of the Partnership firm",
            required: true
          },
          {
            id: "gst_cert_partnership",
            label: "GST Registration Certificate",
            description: "Upload GST Registration Certificate (Form REG-06)",
            required: true
          },
          {
            id: "financials_pnl_bs_partnership",
            label: "Financial Statements - Profit & Loss Statement & Balance Sheet (Last 2 Years)",
            description: "Upload Profit & Loss Statement and Audited/Certified Balance Sheet for the last 2 years",
            required: true
          },
          {
            id: "comp_income_2yr_partnership",
            label: "Computation of Income (Last 2 Financial Years)",
            description: "Upload Computation of Income sheet for the firm for the last 2 financial years",
            required: true
          }
        ];
      }
      if (businessType === "llp") {
        return [
          {
            id: "bank_stmt_1yr_llp",
            label: "1 Year Current Account Bank Statement",
            description: "Upload official bank account statement for the last 12 months for the firm's primary current account",
            required: true
          },
          {
            id: "coi_llp",
            label: "Certificate of Incorporation",
            description: "Upload Certificate of Incorporation issued by Registrar of Companies (ROC)",
            required: true
          },
          {
            id: "board_resolution_llp",
            label: "Board Resolution (BR)",
            description: "Upload Board Resolution passed by partners authorizing loan application",
            required: true
          },
          {
            id: "lod_llp",
            label: "List of Directors / Designated Partners (LOD)",
            description: "Upload certified List of Directors / Designated Partners (LOD) on firm letterhead signed by authorized partner",
            required: true
          },
          {
            id: "itr_2yr_llp",
            label: "ITR (Last 2 Financial Years)",
            description: "Upload Income Tax Returns for the firm for the last 2 financial years",
            required: true
          },
          {
            id: "comp_income_2yr_ca_llp",
            label: "Computation of Income (Last 2 Financial Years - Verified by CA)",
            description: "Upload Computation of Income sheet for the last 2 financial years certified and verified by a CA",
            required: true
          },
          {
            id: "financials_pnl_bs_llp",
            label: "Financial Statements (Profit & Loss Statement & Balance Sheet - Last 2 Years)",
            description: "Upload Audited Profit & Loss Statement and Balance Sheet for the last 2 financial years",
            required: true
          },
          {
            id: "gstr_3b_2yr_llp",
            label: "GSTR-3B Returns (Last 2 Financial Years)",
            description: "Upload GSTR-3B monthly/quarterly returns filed for the last 2 years",
            required: true
          },
          {
            id: "shareholders_list_llp",
            label: "List of Shareholders / Partners",
            description: "Upload certified list of current partners/shareholders with contribution breakdown",
            required: true
          },
          {
            id: "llp_agreement",
            label: "LLP Agreement / Articles of Association",
            description: "Upload registered LLP Agreement or Articles of Association",
            required: true
          },
          {
            id: "moa_llp",
            label: "Memorandum of Association (MOA)",
            description: "Upload official Memorandum of Association of the firm",
            required: true
          },
          {
            id: "udyam_llp",
            label: "Udyam Registration Certificate",
            description: "Upload Udyam MSME registration certificate of the firm",
            required: true
          },
          {
            id: "company_pan_llp",
            label: "Company / Firm PAN Card",
            description: "Upload clear PDF or image of the Firm PAN Card",
            required: true
          },
          {
            id: "gst_cert_llp",
            label: "GST Registration Certificate",
            description: "Upload GST Registration Certificate (Form REG-06)",
            required: true
          }
        ];
      }
      if (businessType === "huf") {
        return [
          {
            id: "huf_deed",
            label: "Deed of HUF / HUF Declaration",
            description: "Upload registered Deed of HUF or HUF declaration certificate",
            required: true
          },
          {
            id: "huf_pan",
            label: "HUF PAN Card",
            description: "Upload clear PDF or image of the HUF PAN Card",
            required: true
          },
          {
            id: "comp_income_2yr_huf",
            label: "Computation of Income (Last 2 Financial Years)",
            description: "Upload Computation of Income sheet of HUF for the last 2 financial years",
            required: true
          },
          {
            id: "financials_pnl_bs_huf",
            label: "Financial Statements (Profit & Loss Statement & Balance Sheet - Last 2 Years)",
            description: "Upload Audited/Certified Profit & Loss Statement and Balance Sheet for the last 2 years",
            required: true
          },
          {
            id: "itr_2yr_huf",
            label: "ITR (Last 2 Financial Years)",
            description: "Upload Income Tax Returns of HUF for the last 2 financial years",
            required: true
          },
          {
            id: "bank_stmt_1yr_huf",
            label: "1 Year Bank Account Statement",
            description: "Upload official bank account statement for the last 12 months for the HUF bank account",
            required: true
          },
          {
            id: "udyam_huf",
            label: "Udyam Registration Certificate",
            description: "Upload Udyam MSME registration certificate if applicable",
            required: false
          }
        ];
      }
      return [];
    }
    if (activeTab === "education" || activeTab === "doctor") {
      return [];
    }
    return currentCategory.additionalDocFields;
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

  const currentCategory = LOAN_CATEGORIES.find((cat) => cat.id === activeTab || (activeTab === "professional" && cat.id === "doctor")) || LOAN_CATEGORIES[0];

  // Dynamic Real-Time Bank Statement Notice Date Calculation
  const bankStatementNotice = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthStr = months[today.getMonth()];
    const todayFormatted = `${day} ${currentMonthStr}`;

    // Calculate 6 months prior, starting from the 1st of that month
    const sixMonthsAgoDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const startMonthStr = months[sixMonthsAgoDate.getMonth()];
    const startDateFormatted = `1 ${startMonthStr}`;

    return {
      subtext: "Please upload your updated 6 months bank statement",
      exampleText: `For Example: As today is ${todayFormatted}, please upload the bank statement from ${startDateFormatted} to ${todayFormatted}. (Note: Bank statements must start from the 1st date of the month, not mid-month).`
    };
  }, []);

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
      alert("Please enter a valid Personal Email ID.");
      return;
    }
    if (formData.officialEmail?.trim() && !formData.officialEmail.includes("@")) {
      alert("Please enter a valid Official Email Address.");
      return;
    }
    if (!formData.city.trim()) {
      alert("Please enter your City / Location.");
      return;
    }
    if (!formData.monthlyIncome?.trim()) {
      alert("Please enter your Monthly Income.");
      return;
    }
    if (!formData.currentAddress?.trim()) {
      alert("Please enter your Current Address.");
      return;
    }
    if (!formData.permanentAddress?.trim()) {
      alert("Please enter your Permanent Address.");
      return;
    }
    if (!formData.workingAddress?.trim()) {
      alert("Please enter your Working Address.");
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

    if (!bankStatementDoc.fileName && getDocFiles(bankStatementDoc).length === 0) {
      alert("Please upload your 6 Months Bank Statement.");
      return;
    }

    if (!currentAddressProofDoc.fileName && getDocFiles(currentAddressProofDoc).length === 0) {
      alert("Please upload Address Proof for Current Address (Electricity bill, LPG bill, or Rent agreement).");
      return;
    }

    if (!permanentAddressProofDoc.fileName && getDocFiles(permanentAddressProofDoc).length === 0) {
      alert("Please upload Address Proof for Permanent Address (Electricity bill, LPG bill, Home Tax, Water Tax, or Govt issued document).");
      return;
    }

    setCurrentStep(3);
  };

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveFields = getEffectiveDocFields();
    for (const field of effectiveFields) {
      if (field.required && getAdditionalFiles(field.id).length === 0) {
        alert(`Please upload mandatory document: ${field.label}`);
        return;
      }
    }

    if (activeTab === "business" && (businessType === "pvt_ltd" || businessType === "llp")) {
      if (!companyOfficialEmail.trim() || !companyOfficialEmail.includes("@")) {
        alert("Please enter a valid Company / Firm Official Email ID.");
        return;
      }

      const minDirectorsRequired = businessType === "llp" ? 2 : 1;
      if (!pvtDirectors || pvtDirectors.length < minDirectorsRequired) {
        alert(`Limited Liability Partnership (LLP) requires at least ${minDirectorsRequired} Directors / Designated Partners to be added.`);
        return;
      }

      for (let i = 0; i < pvtDirectors.length; i++) {
        const dir = pvtDirectors[i];
        const num = i + 1;
        if (!dir.name.trim()) {
          alert(`Please enter Full Name for Director #${num}.`);
          return;
        }
        if (!dir.phone.trim() || dir.phone.replace(/\D/g, "").length < 10) {
          alert(`Please enter a valid 10-digit Phone Number for Director #${num}.`);
          return;
        }
        if (!dir.email.trim() || !dir.email.includes("@")) {
          alert(`Please enter a valid Email ID for Director #${num}.`);
          return;
        }

        const hasDirAadhaar = dir.aadhaarDoc.mode === "pdf"
          ? Boolean(dir.aadhaarDoc.fileName || (dir.aadhaarDoc.fileList && dir.aadhaarDoc.fileList.length > 0))
          : Boolean(dir.aadhaarDoc.frontPhoto);
        if (!hasDirAadhaar) {
          alert(`Please upload Aadhaar Card for Director #${num}.`);
          return;
        }

        const hasDirPan = dir.panDoc.mode === "pdf"
          ? Boolean(dir.panDoc.fileName || (dir.panDoc.fileList && dir.panDoc.fileList.length > 0))
          : Boolean(dir.panDoc.frontPhoto);
        if (!hasDirPan) {
          alert(`Please upload PAN Card for Director #${num}.`);
          return;
        }

        const hasDirPhoto = Boolean(dir.photoDoc.fileName || dir.photoDoc.photoPreview);
        if (!hasDirPhoto) {
          alert(`Please upload or capture Passport Size Photo for Director #${num}.`);
          return;
        }
      }
    }

    if (activeTab === "business" && businessType === "partnership") {
      if (!partnershipPartners || partnershipPartners.length === 0) {
        alert("Please add at least one Partner detail.");
        return;
      }

      for (let i = 0; i < partnershipPartners.length; i++) {
        const part = partnershipPartners[i];
        const num = i + 1;
        if (!part.name.trim()) {
          alert(`Please enter Full Name for Partner #${num}.`);
          return;
        }
        if (!part.phone.trim() || part.phone.replace(/\D/g, "").length < 10) {
          alert(`Please enter a valid 10-digit Mobile Number for Partner #${num}.`);
          return;
        }

        const hasPartAadhaar = part.aadhaarDoc.mode === "pdf"
          ? Boolean(part.aadhaarDoc.fileName || (part.aadhaarDoc.fileList && part.aadhaarDoc.fileList.length > 0))
          : Boolean(part.aadhaarDoc.frontPhoto);
        if (!hasPartAadhaar) {
          alert(`Please upload Aadhaar Card for Partner #${num}.`);
          return;
        }

        const hasPartPan = part.panDoc.mode === "pdf"
          ? Boolean(part.panDoc.fileName || (part.panDoc.fileList && part.panDoc.fileList.length > 0))
          : Boolean(part.panDoc.frontPhoto);
        if (!hasPartPan) {
          alert(`Please upload PAN Card for Partner #${num}.`);
          return;
        }
      }
    }

    if (activeTab === "education") {
      // Validate Applicant
      if (!eduDetails.applicantEmail.trim() || !eduDetails.applicantEmail.includes("@")) {
        alert("Please enter a valid Email ID for the Main Applicant.");
        return;
      }
      if (!eduDetails.applicantMobile.trim() || eduDetails.applicantMobile.replace(/\D/g, "").length < 10) {
        alert("Please enter a valid 10-digit Mobile Number for the Main Applicant.");
        return;
      }
      if (!eduDetails.applicantMotherName.trim()) {
        alert("Please enter Mother's Name for the Main Applicant.");
        return;
      }
      const hasAppAadhaar = eduDetails.applicantAadhaarDoc.mode === "pdf"
        ? Boolean(eduDetails.applicantAadhaarDoc.fileName || (eduDetails.applicantAadhaarDoc.fileList && eduDetails.applicantAadhaarDoc.fileList.length > 0))
        : Boolean(eduDetails.applicantAadhaarDoc.frontPhoto);
      if (!hasAppAadhaar) {
        alert("Please upload or capture Aadhaar Card for the Main Applicant.");
        return;
      }
      const hasAppPan = eduDetails.applicantPanDoc.mode === "pdf"
        ? Boolean(eduDetails.applicantPanDoc.fileName || (eduDetails.applicantPanDoc.fileList && eduDetails.applicantPanDoc.fileList.length > 0))
        : Boolean(eduDetails.applicantPanDoc.frontPhoto);
      if (!hasAppPan) {
        alert("Please upload or capture PAN Card for the Main Applicant.");
        return;
      }
      if (getDocFiles(eduDetails.applicantMarksheetsDoc).length === 0) {
        alert("Please upload Class 10th, 12th & Graduation Marksheets for the Main Applicant.");
        return;
      }
      if (getDocFiles(eduDetails.applicantOfferLetterDoc).length === 0) {
        alert("Please upload College / University Offer Letter for the Main Applicant.");
        return;
      }
      if (getDocFiles(eduDetails.applicantFeeStructureDoc).length === 0) {
        alert("Please upload Fee Structure Document for the Main Applicant.");
        return;
      }
      if (getDocFiles(eduDetails.applicantCancelledChequeDoc).length === 0) {
        alert("Please upload Cancelled Cheque of Bank Account for the Main Applicant.");
        return;
      }

      // Validate Co-Applicant
      if (eduDetails.coApplicantRelation === "other" && !eduDetails.coApplicantRelationOther.trim()) {
        alert("Please specify the relation of Co-Applicant with Applicant.");
        return;
      }
      if (!eduDetails.coApplicantEmail.trim() || !eduDetails.coApplicantEmail.includes("@")) {
        alert("Please enter a valid Email ID for the Co-Applicant.");
        return;
      }
      if (!eduDetails.coApplicantMobile.trim() || eduDetails.coApplicantMobile.replace(/\D/g, "").length < 10) {
        alert("Please enter a valid 10-digit Mobile Number for the Co-Applicant.");
        return;
      }
      if (!eduDetails.coApplicantMotherName.trim()) {
        alert("Please enter Mother's Name for the Co-Applicant.");
        return;
      }
      const hasCoAppAadhaar = eduDetails.coApplicantAadhaarDoc.mode === "pdf"
        ? Boolean(eduDetails.coApplicantAadhaarDoc.fileName || (eduDetails.coApplicantAadhaarDoc.fileList && eduDetails.coApplicantAadhaarDoc.fileList.length > 0))
        : Boolean(eduDetails.coApplicantAadhaarDoc.frontPhoto);
      if (!hasCoAppAadhaar) {
        alert("Please upload or capture Aadhaar Card for the Co-Applicant.");
        return;
      }
      const hasCoAppPan = eduDetails.coApplicantPanDoc.mode === "pdf"
        ? Boolean(eduDetails.coApplicantPanDoc.fileName || (eduDetails.coApplicantPanDoc.fileList && eduDetails.coApplicantPanDoc.fileList.length > 0))
        : Boolean(eduDetails.coApplicantPanDoc.frontPhoto);
      if (!hasCoAppPan) {
        alert("Please upload or capture PAN Card for the Co-Applicant.");
        return;
      }
      if (getDocFiles(eduDetails.coApplicantCancelledChequeDoc).length === 0) {
        alert("Please upload Cancelled Cheque of Bank Account for the Co-Applicant.");
        return;
      }

      // Validate Co-Applicant Employment Specific Docs
      if (eduDetails.coApplicantEmploymentType === "salaried") {
        if (getDocFiles(eduDetails.coApplicantForm16Doc).length === 0) {
          alert("Please upload Form 16 Part A-B (Last 2 Years) for the Co-Applicant.");
          return;
        }
        if (getDocFiles(eduDetails.coApplicantSalarySlipsDoc).length === 0) {
          alert("Please upload Last 3 Months Salary Slips for the Co-Applicant.");
          return;
        }
        if (getDocFiles(eduDetails.coApplicantCompanyIdDoc).length === 0) {
          alert("Please upload Company / Govt ID Card for the Co-Applicant.");
          return;
        }
      } else if (eduDetails.coApplicantEmploymentType === "self_employed") {
        if (getDocFiles(eduDetails.coApplicantItrDoc).length === 0) {
          alert("Please upload Last 2 Years ITR with Computation of Income for the Co-Applicant.");
          return;
        }
        if (getDocFiles(eduDetails.coApplicantUdyamDoc).length === 0) {
          alert("Please upload Udyam Registration Certificate for the Co-Applicant.");
          return;
        }
        if (getDocFiles(eduDetails.coApplicantGstDoc).length === 0) {
          alert("Please upload GST Certificate for the Co-Applicant.");
          return;
        }
        if (getDocFiles(eduDetails.coApplicantFinancialsDoc).length === 0) {
          alert("Please upload Last 2 Years Financials (P/L, B/S) for the Co-Applicant.");
          return;
        }
      }
    }

    if (activeTab === "doctor") {
      if (proDetails.professionType === "doctor") {
        if (getDocFiles(proDetails.doctorUgDegreeDoc).length === 0) {
          alert("Please upload UG Degree (MBBS / BDS / BAMS / BHMS).");
          return;
        }
        if (getDocFiles(proDetails.doctorConsultancyLetterDoc).length === 0) {
          alert("Please upload Consultancy Letter.");
          return;
        }
        if (getDocFiles(proDetails.doctorUgRegistrationDoc).length === 0) {
          alert("Please upload UG Registration Certificate.");
          return;
        }
        if (getDocFiles(proDetails.doctorLetterHeadDoc).length === 0) {
          alert("Please upload Doctor / Clinic Letter Head.");
          return;
        }
      } else {
        if (getDocFiles(proDetails.financialCopDoc).length === 0) {
          alert("Please upload Certificate of Practice (COP).");
          return;
        }
        if (getDocFiles(proDetails.financialComDoc).length === 0) {
          alert("Please upload Certificate of Membership (COM).");
          return;
        }
        if (getDocFiles(proDetails.financialFirmCardDoc).length === 0) {
          alert("Please upload Firm Card.");
          return;
        }
        if (getDocFiles(proDetails.financialLetterHeadDoc).length === 0) {
          alert("Please upload Letter Head.");
          return;
        }
        if (getDocFiles(proDetails.financialItrCoiDoc).length === 0) {
          alert("Please upload 2 Years ITR & Computation of Income (COI).");
          return;
        }
        if (getDocFiles(proDetails.financialUdyamShopDoc).length === 0) {
          alert("Please upload Udyam & Shop Establishment Registration.");
          return;
        }
      }
    }

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

    if (cameraModalTarget.startsWith("partner_")) {
      const parts = cameraModalTarget.split("_");
      const idx = parseInt(parts[1], 10);
      const docType = parts[2];
      const side = parts[3];

      setPartnershipPartners((prev) => {
        const list = [...prev];
        if (!list[idx]) return prev;
        const targetPart = { ...list[idx] };
        if (docType === "aadhaar") {
          targetPart.aadhaarDoc = {
            ...targetPart.aadhaarDoc,
            mode: "photo",
            [side === "front" ? "frontPhoto" : "backPhoto"]: simulatedSnapshot
          };
        } else if (docType === "pan") {
          targetPart.panDoc = {
            ...targetPart.panDoc,
            mode: "photo",
            [side === "front" ? "frontPhoto" : "backPhoto"]: simulatedSnapshot
          };
        }
        list[idx] = targetPart;
        return list;
      });
    } else if (cameraModalTarget.startsWith("director_")) {
      const parts = cameraModalTarget.split("_");
      const idx = parseInt(parts[1], 10);
      const docType = parts[2];
      const side = parts[3];

      setPvtDirectors((prev) => {
        const list = [...prev];
        if (!list[idx]) return prev;
        const targetDir = { ...list[idx] };
        if (docType === "aadhaar") {
          targetDir.aadhaarDoc = {
            ...targetDir.aadhaarDoc,
            mode: "photo",
            [side === "front" ? "frontPhoto" : "backPhoto"]: simulatedSnapshot
          };
        } else if (docType === "pan") {
          targetDir.panDoc = {
            ...targetDir.panDoc,
            mode: "photo",
            [side === "front" ? "frontPhoto" : "backPhoto"]: simulatedSnapshot
          };
        } else if (docType === "photo") {
          targetDir.photoDoc = {
            fileName: "director_photo_capture.jpg",
            photoPreview: simulatedSnapshot
          };
        }
        list[idx] = targetDir;
        return list;
      });
    } else if (cameraModalTarget === "aadhaar_front") {
      setAadhaarDoc((prev: any) => ({ ...prev, mode: "photo", frontPhoto: simulatedSnapshot }));
    } else if (cameraModalTarget === "aadhaar_back") {
      setAadhaarDoc((prev: any) => ({ ...prev, mode: "photo", backPhoto: simulatedSnapshot }));
    } else if (cameraModalTarget === "pan_front") {
      setPanDoc((prev: any) => ({ ...prev, mode: "photo", frontPhoto: simulatedSnapshot }));
    } else if (cameraModalTarget === "pan_back") {
      setPanDoc((prev: any) => ({ ...prev, mode: "photo", backPhoto: simulatedSnapshot }));
    } else if (cameraModalTarget.startsWith("edu_")) {
      const target = cameraModalTarget;
      setEduDetails((prev) => {
        const copy = { ...prev };
        if (target === "edu_applicant_aadhaar_front") {
          copy.applicantAadhaarDoc = { ...copy.applicantAadhaarDoc, mode: "photo", frontPhoto: simulatedSnapshot };
        } else if (target === "edu_applicant_aadhaar_back") {
          copy.applicantAadhaarDoc = { ...copy.applicantAadhaarDoc, mode: "photo", backPhoto: simulatedSnapshot };
        } else if (target === "edu_applicant_pan_front") {
          copy.applicantPanDoc = { ...copy.applicantPanDoc, mode: "photo", frontPhoto: simulatedSnapshot };
        } else if (target === "edu_applicant_pan_back") {
          copy.applicantPanDoc = { ...copy.applicantPanDoc, mode: "photo", backPhoto: simulatedSnapshot };
        } else if (target === "edu_coapplicant_aadhaar_front") {
          copy.coApplicantAadhaarDoc = { ...copy.coApplicantAadhaarDoc, mode: "photo", frontPhoto: simulatedSnapshot };
        } else if (target === "edu_coapplicant_aadhaar_back") {
          copy.coApplicantAadhaarDoc = { ...copy.coApplicantAadhaarDoc, mode: "photo", backPhoto: simulatedSnapshot };
        } else if (target === "edu_coapplicant_pan_front") {
          copy.coApplicantPanDoc = { ...copy.coApplicantPanDoc, mode: "photo", frontPhoto: simulatedSnapshot };
        } else if (target === "edu_coapplicant_pan_back") {
          copy.coApplicantPanDoc = { ...copy.coApplicantPanDoc, mode: "photo", backPhoto: simulatedSnapshot };
        }
        return copy;
      });
    } else if (cameraModalTarget.startsWith("pro_doctor_")) {
      const target = cameraModalTarget;
      setProDetails((prev) => {
        const copy = { ...prev };
        if (target === "pro_doctor_ug_degree") {
          copy.doctorUgDegreeDoc = { ...copy.doctorUgDegreeDoc, fileName: "ug_degree_photo.jpg", photoPreview: simulatedSnapshot };
        } else if (target === "pro_doctor_ug_reg") {
          copy.doctorUgRegistrationDoc = { ...copy.doctorUgRegistrationDoc, fileName: "ug_registration_photo.jpg", photoPreview: simulatedSnapshot };
        } else if (target === "pro_doctor_pg_degree") {
          copy.doctorPgDegreeDoc = { ...copy.doctorPgDegreeDoc, fileName: "pg_degree_photo.jpg", photoPreview: simulatedSnapshot };
        } else if (target === "pro_doctor_pg_reg") {
          copy.doctorPgRegistrationDoc = { ...copy.doctorPgRegistrationDoc, fileName: "pg_registration_photo.jpg", photoPreview: simulatedSnapshot };
        } else if (target === "pro_doctor_consultancy") {
          copy.doctorConsultancyLetterDoc = { ...copy.doctorConsultancyLetterDoc, fileName: "consultancy_letter_photo.jpg", photoPreview: simulatedSnapshot };
        }
        return copy;
      });
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

        {/* Loan Category Selector Tabs (6 Tabs with Glassmorphism Effect & Theme Blue Palette) */}
        <div className="py-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2.5 overflow-visible">
            {LOAN_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <div key={cat.id} className="relative group overflow-visible">
                  <button
                    type="button"
                    onClick={() => handleTabChange(cat.id)}
                    className={`w-full flex flex-col items-center text-center p-3.5 rounded-2xl transition-all duration-300 cursor-pointer relative backdrop-blur-xl ${isActive
                        ? "bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-700/90 text-white shadow-xl shadow-blue-600/35 font-bold scale-[1.03] ring-2 ring-blue-400/40 border border-white/40"
                        : "bg-white/50 hover:bg-white/85 text-slate-800 hover:text-blue-950 border border-white/70 hover:border-blue-300/80 shadow-xs hover:shadow-lg hover:shadow-blue-500/10 backdrop-saturate-150"
                      }`}
                  >
                    <span className="text-2xl mb-1.5 transition-transform duration-200 group-hover:scale-110">{cat.icon}</span>
                    <span className="text-xs font-bold truncate max-w-full tracking-tight">{cat.name}</span>

                    {cat.badge && (
                      <span
                        className={`absolute -top-2.5 -right-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md z-20 whitespace-nowrap transition-all backdrop-blur-md ${isActive
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
          <div ref={wizardFormRef} id="applicantFormWizardSection" className="bg-white rounded-2xl border-2 border-blue-500/30 hover:shadow-xl transition-shadow duration-300 p-5 sm:p-6 pb-4 sm:pb-5 relative overflow-hidden space-y-4">
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
              <form onSubmit={handleSubmitFinal} className="space-y-4">
                {/* STEP 1: APPLICANT DETAILS */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
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

                      {/* Personal Email (Mandatory) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantEmail">
                          Personal Email ID *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantEmail"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your personal email ID"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Official Email ID (Optional) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantOfficialEmail">
                          Official Email ID <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantOfficialEmail"
                            type="email"
                            value={formData.officialEmail || ""}
                            onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                            placeholder="Enter work / official email (optional)"
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantMonthlyIncome">
                          Monthly Income (₹) *
                        </label>
                        <div className="relative">
                          <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantMonthlyIncome"
                            type="text"
                            required
                            value={formData.monthlyIncome || ""}
                            onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                            placeholder="e.g. 75,000"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Address Details Sub-heading */}
                      <div className="pt-2 border-t border-gray-100 sm:col-span-2">
                        <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <MapPin className="w-4 h-4 text-blue-600" /> Residential & Working Address Details
                        </h5>
                        <p className="text-[11px] text-gray-500">Provide complete addresses for physical verification & documentation</p>
                      </div>

                      {/* Current Address */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantCurrentAddress">
                          Current Address *
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantCurrentAddress"
                            type="text"
                            required
                            value={formData.currentAddress || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev: any) => ({
                                ...prev,
                                currentAddress: val,
                                permanentAddress: prev.sameAsCurrentAddress ? val : prev.permanentAddress
                              }));
                            }}
                            placeholder="Enter current residential address (House/Flat No., Street, Area, Landmark, Pincode)"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Permanent Address */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantPermanentAddress">
                            Permanent Address *
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-blue-600 font-medium cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={formData.sameAsCurrentAddress || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData((prev: any) => ({
                                  ...prev,
                                  sameAsCurrentAddress: checked,
                                  permanentAddress: checked ? prev.currentAddress : prev.permanentAddress
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>Same as Current Address</span>
                          </label>
                        </div>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantPermanentAddress"
                            type="text"
                            required
                            disabled={formData.sameAsCurrentAddress}
                            value={formData.permanentAddress || ""}
                            onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                            placeholder="Enter permanent address as per Aadhaar / Passport"
                            className={`w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all ${formData.sameAsCurrentAddress ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
                              }`}
                          />
                        </div>
                      </div>

                      {/* Working Address */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 block" htmlFor="applicantWorkingAddress">
                          Working / Office Address *
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            id="applicantWorkingAddress"
                            type="text"
                            required
                            value={formData.workingAddress || ""}
                            onChange={(e) => setFormData({ ...formData, workingAddress: e.target.value })}
                            placeholder="Enter office / company / business location address"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
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
                              <p className="text-[11px] text-gray-500">Upload e-PAN PDF or capture front & back card photos</p>
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
                              Front & Back Photo
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
                          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Front Photo */}
                              <div className="space-y-2 text-center p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <span className="text-xs font-bold text-gray-700 block">PAN Front Side *</span>
                                {panDoc.frontPhoto ? (
                                  <div className="relative">
                                    <img src={panDoc.frontPhoto} alt="PAN Front" className="h-24 mx-auto rounded border object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setPanDoc((prev: any) => ({ ...prev, frontPhoto: undefined }))}
                                      className="mt-1 text-[10px] text-red-600 font-bold hover:underline"
                                    >
                                      Remove Photo
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("pan_front")}
                                      className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer"
                                    >
                                      <Camera className="w-3.5 h-3.5" /> Capture / Upload Front
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Back Photo */}
                              <div className="space-y-2 text-center p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <span className="text-xs font-bold text-gray-700 block">PAN Back Side <span className="text-gray-400 font-normal">(Optional)</span></span>
                                {panDoc.backPhoto ? (
                                  <div className="relative">
                                    <img src={panDoc.backPhoto} alt="PAN Back" className="h-24 mx-auto rounded border object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setPanDoc((prev: any) => ({ ...prev, backPhoto: undefined }))}
                                      className="mt-1 text-[10px] text-red-600 font-bold hover:underline"
                                    >
                                      Remove Photo
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("pan_back")}
                                      className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer"
                                    >
                                      <Camera className="w-3.5 h-3.5" /> Capture / Upload Back
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Password Option Toggle for PAN */}
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
                                    placeholder="Enter PAN Password"
                                    className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
                                  />
                                </div>
                              )}
                            </div>
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

                      {/* 7. ADDRESS PROOF FOR CURRENT ADDRESS (MANDATORY) */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                              <MapPin className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">
                                7. Address Proof for Current Address <span className="text-red-500">* (Mandatory)</span>
                              </h5>
                              <p className="text-[11px] text-gray-500">Electricity Bill, LPG Bill, Rent Agreement, etc.</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <input
                              id="currentAddressProofInput"
                              type="file"
                              multiple
                              accept=".pdf, image/*"
                              onChange={(e) => addFilesToDoc(setCurrentAddressProofDoc, e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor="currentAddressProofInput"
                              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{getDocFiles(currentAddressProofDoc).length > 0 ? "Add More File" : "Upload Current Address Proof"}</span>
                            </label>

                            {getDocFiles(currentAddressProofDoc).map((name, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-950 shadow-2xs">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFileFromDoc(setCurrentAddressProofDoc, idx)}
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

                      {/* 8. ADDRESS PROOF FOR PERMANENT ADDRESS (MANDATORY) */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                              <Building className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">
                                8. Address Proof for Permanent Address <span className="text-red-500">* (Mandatory)</span>
                              </h5>
                              <p className="text-[11px] text-gray-500">Electricity Bill, LPG Bill, Home Tax, Water Tax, or Govt issued document</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <input
                              id="permanentAddressProofInput"
                              type="file"
                              multiple
                              accept=".pdf, image/*"
                              onChange={(e) => addFilesToDoc(setPermanentAddressProofDoc, e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor="permanentAddressProofInput"
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{getDocFiles(permanentAddressProofDoc).length > 0 ? "Add More File" : "Upload Permanent Address Proof"}</span>
                            </label>

                            {getDocFiles(permanentAddressProofDoc).map((name, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs text-indigo-950 shadow-2xs">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFileFromDoc(setPermanentAddressProofDoc, idx)}
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

                      {/* 9. FORM 26AS (LAST TWO YEARS) (OPTIONAL) */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                              <FileSpreadsheet className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">
                                9. Form 26AS (Last 2 Financial Years) <span className="text-gray-400 font-normal">(Optional)</span>
                              </h5>
                              <p className="text-[11px] text-gray-500">Upload Form 26AS for last 2 years for income & tax verification</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <input
                              id="form26ASInput"
                              type="file"
                              multiple
                              accept=".pdf, image/*"
                              onChange={(e) => addFilesToDoc(setForm26ASDoc, e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor="form26ASInput"
                              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{getDocFiles(form26ASDoc).length > 0 ? "Add More Form 26AS" : "Upload Form 26AS"}</span>
                            </label>

                            {getDocFiles(form26ASDoc).map((name, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-950 shadow-2xs">
                                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFileFromDoc(setForm26ASDoc, idx)}
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
                    </div>

                    <div className="pt-2 flex justify-between">
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

                    {/* Business Entity Type Selector (Visible for Business Loan) */}
                    {activeTab === "business" && (
                      <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200/80 space-y-2">
                        <label className="text-xs font-bold text-gray-900 block flex items-center gap-1.5" htmlFor="businessTypeSelect">
                          <Briefcase className="w-4 h-4 text-blue-600" /> Select Type of Business / Entity *
                        </label>
                        <p className="text-[11px] text-gray-500">Document requirements will automatically update based on your selected business structure</p>
                        <div className="relative max-w-md pt-1">
                          <select
                            id="businessTypeSelect"
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="w-full pl-3.5 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer shadow-2xs"
                          >
                            <option value="sole_proprietorship">1. Sole Proprietorship</option>
                            <option value="pvt_ltd">2. Private Limited</option>
                            <option value="llp">3. Limited Liability Partnership (LLP)</option>
                            <option value="huf">4. HUF (Hindu Undivided Family)</option>
                            <option value="partnership">5. Partnership</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-4 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* Notice for unconfigured business entity types */}
                    {activeTab === "business" && businessType !== "sole_proprietorship" && businessType !== "pvt_ltd" && businessType !== "partnership" && businessType !== "llp" && (
                      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-amber-950 text-xs">Checklist Pending for HUF</h5>
                          <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                            Specific additional document requirements for HUF will be customized soon. You can complete your application with the core documents already uploaded in Step 1 & Step 2.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Private Limited & LLP Specific Inputs: Company/Firm Official Email & List of Directors */}
                    {activeTab === "business" && (businessType === "pvt_ltd" || businessType === "llp") && (
                      <div className="space-y-4">
                        {/* Company Official Email ID */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <label className="text-xs font-bold text-gray-900 block" htmlFor="companyOfficialEmailInput">
                            Company Official Email ID <span className="text-red-500 font-bold ml-1">* (Mandatory)</span>
                          </label>
                          <p className="text-[11px] text-gray-500">Official email address registered with Ministry of Corporate Affairs (MCA) / GST</p>
                          <div className="relative max-w-md pt-1">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                            <input
                              id="companyOfficialEmailInput"
                              type="email"
                              required
                              value={companyOfficialEmail}
                              onChange={(e) => setCompanyOfficialEmail(e.target.value)}
                              placeholder="e.g. contact@yourcompany.com"
                              className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white"
                            />
                          </div>
                        </div>

                        {/* List of Directors Management UI */}
                        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                List of Directors / Designated Partners <span className="text-red-500 font-bold">* (Mandatory)</span>
                              </h5>
                              <p className="text-[11px] text-gray-500">
                                Provide details and KYC documents (Aadhaar, PAN, Photo) for directors/partners {businessType === "llp" && <span className="text-blue-700 font-bold">(Minimum 2 Directors Required for LLP)</span>}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPvtDirectors((prev) => [
                                  ...prev,
                                  {
                                    id: `dir_${Date.now()}`,
                                    name: "",
                                    phone: "",
                                    email: "",
                                    aadhaarDoc: { mode: "pdf" },
                                    panDoc: { mode: "pdf" },
                                    photoDoc: {}
                                  }
                                ]);
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <span>+ Add More Director</span>
                            </button>
                          </div>

                          {pvtDirectors.map((director, index) => (
                            <div key={director.id} className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-2xs relative">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                  Director / Designated Partner #{index + 1}
                                </span>
                                {((businessType === "llp" && pvtDirectors.length > 2) || (businessType !== "llp" && pvtDirectors.length > 1)) && (
                                  <button
                                    type="button"
                                    onClick={() => setPvtDirectors((prev) => prev.filter((_, i) => i !== index))}
                                    className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" /> Remove Director
                                  </button>
                                )}
                              </div>

                              {/* Inputs for Name, Phone, Email */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs font-semibold text-gray-700 block mb-1">Director Name *</label>
                                  <input
                                    type="text"
                                    required
                                    value={director.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPvtDirectors((prev) => {
                                        const list = [...prev];
                                        list[index] = { ...list[index], name: val };
                                        return list;
                                      });
                                    }}
                                    placeholder="Full Name as per PAN"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-semibold text-gray-700 block mb-1">Phone No. *</label>
                                  <input
                                    type="tel"
                                    required
                                    maxLength={10}
                                    value={director.phone}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      setPvtDirectors((prev) => {
                                        const list = [...prev];
                                        list[index] = { ...list[index], phone: val };
                                        return list;
                                      });
                                    }}
                                    placeholder="10-digit Mobile"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-semibold text-gray-700 block mb-1">Email ID *</label>
                                  <input
                                    type="email"
                                    required
                                    value={director.email}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPvtDirectors((prev) => {
                                        const list = [...prev];
                                        list[index] = { ...list[index], email: val };
                                        return list;
                                      });
                                    }}
                                    placeholder="Director Email ID"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                  />
                                </div>
                              </div>

                              {/* KYC Documents for Director: Aadhaar, PAN, Photo */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                                {/* Director Aadhaar Card */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800">Aadhaar Card <span className="text-red-500">*</span></span>
                                    <div className="flex text-[10px] bg-white border border-gray-200 rounded p-0.5 font-semibold">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPvtDirectors((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, mode: "pdf" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${director.aadhaarDoc?.mode === "pdf" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPvtDirectors((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, mode: "photo" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${director.aadhaarDoc?.mode === "photo" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        Photo
                                      </button>
                                    </div>
                                  </div>

                                  {director.aadhaarDoc?.mode === "pdf" ? (
                                    <div className="space-y-1.5">
                                      <input
                                        id={`dir_${index}_aadhaar_input`}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                          const files = e.target.files;
                                          if (files && files.length > 0) {
                                            const names = Array.from(files).map((f) => f.name);
                                            setPvtDirectors((prev) => {
                                              const list = [...prev];
                                              const existing = list[index].aadhaarDoc?.fileList || (list[index].aadhaarDoc?.fileName ? [list[index].aadhaarDoc.fileName!] : []);
                                              const updated = Array.from(new Set([...existing, ...names]));
                                              list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, fileName: updated[0], fileList: updated } };
                                              return list;
                                            });
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`dir_${index}_aadhaar_input`}
                                        className="w-full py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 font-bold text-[11px] rounded flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Choose Aadhaar PDF
                                      </label>

                                      {(director.aadhaarDoc?.fileList || (director.aadhaarDoc?.fileName ? [director.aadhaarDoc.fileName] : [])).map((fn, fIdx) => (
                                        <div key={fIdx} className="flex items-center justify-between text-[11px] bg-blue-50 px-2 py-1 rounded text-blue-900">
                                          <span className="truncate max-w-[120px]">{fn}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPvtDirectors((prev) => {
                                                const list = [...prev];
                                                const existing = list[index].aadhaarDoc?.fileList || [];
                                                const updated = existing.filter((_, i) => i !== fIdx);
                                                list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, fileName: updated[0], fileList: updated } };
                                                return list;
                                              });
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => triggerCameraModal(`director_${index}_aadhaar_front`)}
                                          className="flex-1 py-1 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                                        >
                                          <Camera className="w-3 h-3" /> Front Photo
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => triggerCameraModal(`director_${index}_aadhaar_back`)}
                                          className="flex-1 py-1 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                                        >
                                          <Camera className="w-3 h-3" /> Back Photo
                                        </button>
                                      </div>
                                      {director.aadhaarDoc?.frontPhoto && (
                                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Front Photo Captured
                                        </p>
                                      )}
                                      {director.aadhaarDoc?.backPhoto && (
                                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Back Photo Captured
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Director PAN Card */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800">PAN Card <span className="text-red-500">*</span></span>
                                    <div className="flex text-[10px] bg-white border border-gray-200 rounded p-0.5 font-semibold">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPvtDirectors((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], panDoc: { ...list[index].panDoc, mode: "pdf" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${director.panDoc?.mode === "pdf" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPvtDirectors((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], panDoc: { ...list[index].panDoc, mode: "photo" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${director.panDoc?.mode === "photo" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        Photo
                                      </button>
                                    </div>
                                  </div>

                                  {director.panDoc?.mode === "pdf" ? (
                                    <div className="space-y-1.5">
                                      <input
                                        id={`dir_${index}_pan_input`}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                          const files = e.target.files;
                                          if (files && files.length > 0) {
                                            const names = Array.from(files).map((f) => f.name);
                                            setPvtDirectors((prev) => {
                                              const list = [...prev];
                                              const existing = list[index].panDoc?.fileList || (list[index].panDoc?.fileName ? [list[index].panDoc.fileName!] : []);
                                              const updated = Array.from(new Set([...existing, ...names]));
                                              list[index] = { ...list[index], panDoc: { ...list[index].panDoc, fileName: updated[0], fileList: updated } };
                                              return list;
                                            });
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`dir_${index}_pan_input`}
                                        className="w-full py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 font-bold text-[11px] rounded flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Choose PAN PDF
                                      </label>

                                      {(director.panDoc?.fileList || (director.panDoc?.fileName ? [director.panDoc.fileName] : [])).map((fn, fIdx) => (
                                        <div key={fIdx} className="flex items-center justify-between text-[11px] bg-blue-50 px-2 py-1 rounded text-blue-900">
                                          <span className="truncate max-w-[120px]">{fn}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPvtDirectors((prev) => {
                                                const list = [...prev];
                                                const existing = list[index].panDoc?.fileList || [];
                                                const updated = existing.filter((_, i) => i !== fIdx);
                                                list[index] = { ...list[index], panDoc: { ...list[index].panDoc, fileName: updated[0], fileList: updated } };
                                                return list;
                                              });
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <button
                                        type="button"
                                        onClick={() => triggerCameraModal(`director_${index}_pan_front`)}
                                        className="w-full py-1 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                                      >
                                        <Camera className="w-3 h-3" /> Capture PAN Photo
                                      </button>
                                      {director.panDoc?.frontPhoto && (
                                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                          <Check className="w-3 h-3" /> PAN Photo Captured
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Director Passport Photo */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                  <span className="text-[11px] font-bold text-gray-800 block">Director Photo <span className="text-red-500">*</span></span>
                                  {director.photoDoc?.photoPreview || director.photoDoc?.fileName ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-1.5 rounded">
                                      {director.photoDoc?.photoPreview ? (
                                        <img src={director.photoDoc.photoPreview} alt="Director" className="w-8 h-8 rounded object-cover border" />
                                      ) : (
                                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                                      )}
                                      <span className="text-[10px] font-semibold text-emerald-900 truncate flex-1">{director.photoDoc?.fileName || "Photo Attached"}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPvtDirectors((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], photoDoc: {} };
                                            return list;
                                          });
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1.5">
                                      <input
                                        id={`dir_${index}_photo_input`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setPvtDirectors((prev) => {
                                              const list = [...prev];
                                              list[index] = { ...list[index], photoDoc: { fileName: file.name } };
                                              return list;
                                            });
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`dir_${index}_photo_input`}
                                        className="flex-1 py-1 px-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Upload
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => triggerCameraModal(`director_${index}_photo`)}
                                        className="flex-1 py-1 px-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Camera className="w-3 h-3" /> Click Photo
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Partnership Specific Inputs: List of Partners */}
                    {activeTab === "business" && businessType === "partnership" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                List of Partners <span className="text-red-500 font-bold">* (Mandatory)</span>
                              </h5>
                              <p className="text-[11px] text-gray-500">Provide details and KYC documents (Aadhaar & PAN) for all partners in the firm</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPartnershipPartners((prev) => [
                                  ...prev,
                                  {
                                    id: `partner_${Date.now()}`,
                                    name: "",
                                    phone: "",
                                    aadhaarDoc: { mode: "pdf" },
                                    panDoc: { mode: "pdf" }
                                  }
                                ]);
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <span>+ Add Another Partner</span>
                            </button>
                          </div>

                          {partnershipPartners.map((partner, index) => (
                            <div key={partner.id} className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-2xs relative">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                  Partner #{index + 1}
                                </span>
                                {partnershipPartners.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setPartnershipPartners((prev) => prev.filter((_, i) => i !== index))}
                                    className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" /> Remove Partner
                                  </button>
                                )}
                              </div>

                              {/* Inputs for Name, Phone */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-semibold text-gray-700 block mb-1">Partner Name *</label>
                                  <input
                                    type="text"
                                    required
                                    value={partner.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPartnershipPartners((prev) => {
                                        const list = [...prev];
                                        list[index] = { ...list[index], name: val };
                                        return list;
                                      });
                                    }}
                                    placeholder="Full Name as per PAN"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-semibold text-gray-700 block mb-1">Mobile No. *</label>
                                  <input
                                    type="tel"
                                    required
                                    maxLength={10}
                                    value={partner.phone}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      setPartnershipPartners((prev) => {
                                        const list = [...prev];
                                        list[index] = { ...list[index], phone: val };
                                        return list;
                                      });
                                    }}
                                    placeholder="10-digit Mobile Number"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                  />
                                </div>
                              </div>

                              {/* KYC Documents for Partner: Aadhaar & PAN */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                {/* Partner Aadhaar Card */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800">Aadhaar Card <span className="text-red-500">*</span></span>
                                    <div className="flex text-[10px] bg-white border border-gray-200 rounded p-0.5 font-semibold">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPartnershipPartners((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, mode: "pdf" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${partner.aadhaarDoc?.mode === "pdf" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPartnershipPartners((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, mode: "photo" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${partner.aadhaarDoc?.mode === "photo" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        Photo
                                      </button>
                                    </div>
                                  </div>

                                  {partner.aadhaarDoc?.mode === "pdf" ? (
                                    <div className="space-y-1.5">
                                      <input
                                        id={`partner_${index}_aadhaar_input`}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                          const files = e.target.files;
                                          if (files && files.length > 0) {
                                            const names = Array.from(files).map((f) => f.name);
                                            setPartnershipPartners((prev) => {
                                              const list = [...prev];
                                              const existing = list[index].aadhaarDoc?.fileList || (list[index].aadhaarDoc?.fileName ? [list[index].aadhaarDoc.fileName!] : []);
                                              const updated = Array.from(new Set([...existing, ...names]));
                                              list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, fileName: updated[0], fileList: updated } };
                                              return list;
                                            });
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`partner_${index}_aadhaar_input`}
                                        className="w-full py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 font-bold text-[11px] rounded flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Choose Aadhaar PDF
                                      </label>

                                      {(partner.aadhaarDoc?.fileList || (partner.aadhaarDoc?.fileName ? [partner.aadhaarDoc.fileName] : [])).map((fn, fIdx) => (
                                        <div key={fIdx} className="flex items-center justify-between text-[11px] bg-blue-50 px-2 py-1 rounded text-blue-900">
                                          <span className="truncate max-w-[150px]">{fn}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPartnershipPartners((prev) => {
                                                const list = [...prev];
                                                const existing = list[index].aadhaarDoc?.fileList || [];
                                                const updated = existing.filter((_, i) => i !== fIdx);
                                                list[index] = { ...list[index], aadhaarDoc: { ...list[index].aadhaarDoc, fileName: updated[0], fileList: updated } };
                                                return list;
                                              });
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => triggerCameraModal(`partner_${index}_aadhaar_front`)}
                                          className="flex-1 py-1 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                                        >
                                          <Camera className="w-3 h-3" /> Front Photo
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => triggerCameraModal(`partner_${index}_aadhaar_back`)}
                                          className="flex-1 py-1 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                                        >
                                          <Camera className="w-3 h-3" /> Back Photo
                                        </button>
                                      </div>
                                      {partner.aadhaarDoc?.frontPhoto && (
                                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Front Photo Captured
                                        </p>
                                      )}
                                      {partner.aadhaarDoc?.backPhoto && (
                                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Back Photo Captured
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Partner PAN Card */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800">PAN Card <span className="text-red-500">*</span></span>
                                    <div className="flex text-[10px] bg-white border border-gray-200 rounded p-0.5 font-semibold">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPartnershipPartners((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], panDoc: { ...list[index].panDoc, mode: "pdf" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${partner.panDoc?.mode === "pdf" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPartnershipPartners((prev) => {
                                            const list = [...prev];
                                            list[index] = { ...list[index], panDoc: { ...list[index].panDoc, mode: "photo" } };
                                            return list;
                                          });
                                        }}
                                        className={`px-1.5 py-0.5 rounded cursor-pointer ${partner.panDoc?.mode === "photo" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                                      >
                                        Photo
                                      </button>
                                    </div>
                                  </div>

                                  {partner.panDoc?.mode === "pdf" ? (
                                    <div className="space-y-1.5">
                                      <input
                                        id={`partner_${index}_pan_input`}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                          const files = e.target.files;
                                          if (files && files.length > 0) {
                                            const names = Array.from(files).map((f) => f.name);
                                            setPartnershipPartners((prev) => {
                                              const list = [...prev];
                                              const existing = list[index].panDoc?.fileList || (list[index].panDoc?.fileName ? [list[index].panDoc.fileName!] : []);
                                              const updated = Array.from(new Set([...existing, ...names]));
                                              list[index] = { ...list[index], panDoc: { ...list[index].panDoc, fileName: updated[0], fileList: updated } };
                                              return list;
                                            });
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`partner_${index}_pan_input`}
                                        className="w-full py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 font-bold text-[11px] rounded flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Choose PAN PDF
                                      </label>

                                      {(partner.panDoc?.fileList || (partner.panDoc?.fileName ? [partner.panDoc.fileName] : [])).map((fn, fIdx) => (
                                        <div key={fIdx} className="flex items-center justify-between text-[11px] bg-blue-50 px-2 py-1 rounded text-blue-900">
                                          <span className="truncate max-w-[150px]">{fn}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPartnershipPartners((prev) => {
                                                const list = [...prev];
                                                const existing = list[index].panDoc?.fileList || [];
                                                const updated = existing.filter((_, i) => i !== fIdx);
                                                list[index] = { ...list[index], panDoc: { ...list[index].panDoc, fileName: updated[0], fileList: updated } };
                                                return list;
                                              });
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <button
                                        type="button"
                                        onClick={() => triggerCameraModal(`partner_${index}_pan_front`)}
                                        className="w-full py-1 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                                      >
                                        <Camera className="w-3 h-3" /> Capture PAN Photo
                                      </button>
                                      {partner.panDoc?.frontPhoto && (
                                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                          <Check className="w-3 h-3" /> PAN Photo Captured
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Home Loan & LAP Minimalist Step 3 UI */}
                    {(activeTab === "home" || activeTab === "lap") && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/80">
                                {activeTab === "home" ? <Building className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h5 className="text-base font-bold text-slate-900">
                                    {activeTab === "home" ? "Home Loan" : "Loan Against Property (LAP)"} Additional Documents
                                  </h5>
                                  <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold border border-blue-100">
                                    Property & Income Verification
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Select your employment profile & upload required financial and property ownership documents
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 1. Employment Type Selector Dropdown */}
                          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 space-y-2 max-w-md">
                            <label className="text-xs font-bold text-slate-800 block flex items-center gap-1.5" htmlFor="hlLapEmploymentTypeSelect">
                              <Briefcase className="w-4 h-4 text-blue-600" /> Select Employment Type <span className="text-red-500 font-bold">*</span>
                            </label>
                            <p className="text-[11px] text-slate-500">Document checklist will update based on Salaried or Self-Employed selection</p>
                            <select
                              id="hlLapEmploymentTypeSelect"
                              value={hlLapDetails.employmentType}
                              onChange={(e) => setHlLapDetails(prev => ({ ...prev, employmentType: e.target.value as "salaried" | "self_employed" }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
                            >
                              <option value="salaried">Salaried (Pvt / Govt / MNC Employee)</option>
                              <option value="self_employed">Self-Employed (Business Owner / Businessman)</option>
                            </select>
                          </div>

                          {/* SALARIED DOCUMENTS (Same as Personal Loan Additional Docs) */}
                          {hlLapDetails.employmentType === "salaried" && (
                            <div className="space-y-4 pt-2">
                              <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-emerald-600" />
                                <span>Salaried Income Documents (Personal Loan Requirements)</span>
                              </h6>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Form 16 */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Form 16 (Last 2 Years - Part A & Part B) <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="hllap_form16"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          salariedForm16Doc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.salariedForm16Doc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="hllap_form16" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {hlLapDetails.salariedForm16Doc.fileList?.length ? "Add Form 16" : "Upload Form 16"}
                                  </label>
                                  {(hlLapDetails.salariedForm16Doc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, salariedForm16Doc: { fileList: prev.salariedForm16Doc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* ITR Last 2 Financial Years */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    ITR (Last 2 Financial Years) <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="hllap_itr_salaried"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          salariedItrDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.salariedItrDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="hllap_itr_salaried" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {hlLapDetails.salariedItrDoc.fileList?.length ? "Add ITR" : "Upload 2 Yrs ITR"}
                                  </label>
                                  {(hlLapDetails.salariedItrDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, salariedItrDoc: { fileList: prev.salariedItrDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* SELF-EMPLOYED DOCUMENTS (Same as Business Loan Requirements) */}
                          {hlLapDetails.employmentType === "self_employed" && (
                            <div className="space-y-6 pt-2 border-t border-slate-100">
                              <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                <span>Self-Employed Business Documents (Business Loan Requirements)</span>
                              </h6>

                              {/* Business Entity Type Selector */}
                              <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200/80 space-y-2 max-w-md">
                                <label className="text-xs font-bold text-gray-900 block flex items-center gap-1.5" htmlFor="businessTypeSelectHlLap">
                                  <Briefcase className="w-4 h-4 text-blue-600" /> Select Type of Business / Entity *
                                </label>
                                <p className="text-[11px] text-gray-500">Document requirements will update based on your selected business structure</p>
                                <div className="relative max-w-md pt-1">
                                  <select
                                    id="businessTypeSelectHlLap"
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="w-full pl-3.5 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer shadow-2xs"
                                  >
                                    <option value="sole_proprietorship">1. Sole Proprietorship</option>
                                    <option value="pvt_ltd">2. Private Limited</option>
                                    <option value="llp">3. Limited Liability Partnership (LLP)</option>
                                    <option value="huf">4. HUF (Hindu Undivided Family)</option>
                                    <option value="partnership">5. Partnership</option>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-4 pointer-events-none" />
                                </div>
                              </div>

                              {/* Private Limited & LLP Specific Inputs */}
                              {(businessType === "pvt_ltd" || businessType === "llp") && (
                                <div className="space-y-4">
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                    <label className="text-xs font-bold text-gray-900 block" htmlFor="companyOfficialEmailHlLap">
                                      Company Official Email ID <span className="text-red-500 font-bold ml-1">* (Mandatory)</span>
                                    </label>
                                    <p className="text-[11px] text-gray-500">Official email address registered with MCA / GST</p>
                                    <div className="relative max-w-md pt-1">
                                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                      <input
                                        id="companyOfficialEmailHlLap"
                                        type="email"
                                        required
                                        value={companyOfficialEmail}
                                        onChange={(e) => setCompanyOfficialEmail(e.target.value)}
                                        placeholder="e.g. contact@yourcompany.com"
                                        className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                                      <div>
                                        <h5 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                                          <Users className="w-4 h-4 text-blue-600" />
                                          List of Directors / Designated Partners <span className="text-red-500 font-bold">* (Mandatory)</span>
                                        </h5>
                                        <p className="text-[11px] text-gray-500">
                                          Provide details and KYC documents (Aadhaar, PAN, Photo) for directors/partners {businessType === "llp" && <span className="text-blue-700 font-bold">(Minimum 2 Directors Required for LLP)</span>}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPvtDirectors((prev) => [
                                            ...prev,
                                            {
                                              id: `dir_${Date.now()}`,
                                              name: "",
                                              phone: "",
                                              email: "",
                                              aadhaarDoc: { mode: "pdf" },
                                              panDoc: { mode: "pdf" },
                                              photoDoc: {}
                                            }
                                          ]);
                                        }}
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                                      >
                                        <span>+ Add Director</span>
                                      </button>
                                    </div>

                                    {pvtDirectors.map((director, index) => (
                                      <div key={director.id} className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-2xs relative">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                          <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                            Director / Partner #{index + 1}
                                          </span>
                                          {((businessType === "llp" && pvtDirectors.length > 2) || (businessType !== "llp" && pvtDirectors.length > 1)) && (
                                            <button
                                              type="button"
                                              onClick={() => setPvtDirectors((prev) => prev.filter((_, i) => i !== index))}
                                              className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                                            >
                                              <X className="w-3.5 h-3.5" /> Remove
                                            </button>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                          <div>
                                            <label className="text-xs font-semibold text-gray-700 block mb-1">Director Name *</label>
                                            <input
                                              type="text"
                                              required
                                              value={director.name}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setPvtDirectors((prev) => {
                                                  const list = [...prev];
                                                  list[index] = { ...list[index], name: val };
                                                  return list;
                                                });
                                              }}
                                              placeholder="Full Name as per PAN"
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs font-semibold text-gray-700 block mb-1">Phone No. *</label>
                                            <input
                                              type="tel"
                                              required
                                              maxLength={10}
                                              value={director.phone}
                                              onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                setPvtDirectors((prev) => {
                                                  const list = [...prev];
                                                  list[index] = { ...list[index], phone: val };
                                                  return list;
                                                });
                                              }}
                                              placeholder="10-digit Mobile"
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs font-semibold text-gray-700 block mb-1">Email ID *</label>
                                            <input
                                              type="email"
                                              required
                                              value={director.email}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setPvtDirectors((prev) => {
                                                  const list = [...prev];
                                                  list[index] = { ...list[index], email: val };
                                                  return list;
                                                });
                                              }}
                                              placeholder="Director Email ID"
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Partnership Specific Inputs */}
                              {businessType === "partnership" && (
                                <div className="space-y-4">
                                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                                      <div>
                                        <h5 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                                          <Users className="w-4 h-4 text-blue-600" />
                                          List of Partners <span className="text-red-500 font-bold">* (Mandatory)</span>
                                        </h5>
                                        <p className="text-[11px] text-gray-500">Provide details and KYC documents for all partners in the firm</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPartnershipPartners((prev) => [
                                            ...prev,
                                            {
                                              id: `partner_${Date.now()}`,
                                              name: "",
                                              phone: "",
                                              aadhaarDoc: { mode: "pdf" },
                                              panDoc: { mode: "pdf" }
                                            }
                                          ]);
                                        }}
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                                      >
                                        <span>+ Add Partner</span>
                                      </button>
                                    </div>

                                    {partnershipPartners.map((partner, index) => (
                                      <div key={partner.id} className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-2xs relative">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                          <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                            Partner #{index + 1}
                                          </span>
                                          {partnershipPartners.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => setPartnershipPartners((prev) => prev.filter((_, i) => i !== index))}
                                              className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                                            >
                                              <X className="w-3.5 h-3.5" /> Remove
                                            </button>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-xs font-semibold text-gray-700 block mb-1">Partner Name *</label>
                                            <input
                                              type="text"
                                              required
                                              value={partner.name}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setPartnershipPartners((prev) => {
                                                  const list = [...prev];
                                                  list[index] = { ...list[index], name: val };
                                                  return list;
                                                });
                                              }}
                                              placeholder="Full Name as per PAN"
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                            />
                                          </div>

                                          <div>
                                            <label className="text-xs font-semibold text-gray-700 block mb-1">Mobile No. *</label>
                                            <input
                                              type="tel"
                                              required
                                              maxLength={10}
                                              value={partner.phone}
                                              onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                setPartnershipPartners((prev) => {
                                                  const list = [...prev];
                                                  list[index] = { ...list[index], phone: val };
                                                  return list;
                                                });
                                              }}
                                              placeholder="10-digit Mobile"
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                 </div>
                               )}

                              {/* Business Required Document Upload Cards */}
                              <div className="space-y-4 pt-4 border-t border-slate-200/80">
                                <h6 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span>Required Business Documents ({businessType === "sole_proprietorship" ? "Sole Proprietorship" : businessType === "pvt_ltd" ? "Private Limited" : businessType === "partnership" ? "Partnership" : businessType === "llp" ? "LLP (Limited Liability Partnership)" : "HUF (Hindu Undivided Family)"})</span>
                                </h6>

                                {getEffectiveDocFields().map((field) => (
                                  <div key={field.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                    <div>
                                      <label className="text-xs font-bold text-gray-900 block">
                                        {field.label} {field.required ? <span className="text-red-500 font-bold ml-1">* (Mandatory)</span> : <span className="text-gray-400 font-normal ml-1">(Optional)</span>}
                                      </label>
                                    </div>
                                    <p className="text-[11px] text-gray-500">{field.description}</p>

                                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                      <input
                                        id={`additional_hllap_${field.id}`}
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
                                        htmlFor={`additional_hllap_${field.id}`}
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
                            </div>
                          )}

                          {/* 2. PROPERTY DOCUMENTS SECTION */}
                          <div className="space-y-4 pt-4 border-t border-slate-200/80">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Building className="w-4 h-4 text-blue-600" />
                                <span>{activeTab === "home" ? "Home Loan Property Legal Documents" : "LAP Property Legal Documents"}</span>
                              </h6>
                              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                                Property Ownership & Sanction Docs
                              </span>
                            </div>

                            {/* HOME LOAN PROPERTY DOCUMENTS */}
                            {activeTab === "home" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 1. BBA and ATS */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    BBA and ATS (Builder Buyer Agreement / Agreement To Sell) <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="hl_bba_ats"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          hlBbaAtsDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.hlBbaAtsDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="hl_bba_ats" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {hlLapDetails.hlBbaAtsDoc.fileList?.length ? "Add BBA & ATS" : "Upload BBA and ATS"}
                                  </label>
                                  {(hlLapDetails.hlBbaAtsDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, hlBbaAtsDoc: { fileList: prev.hlBbaAtsDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 2. Property Sales DEED */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Property Sales DEED <span className="text-slate-500 font-normal">(In case of Resale)</span> <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="hl_sales_deed"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          hlSalesDeedDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.hlSalesDeedDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="hl_sales_deed" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {hlLapDetails.hlSalesDeedDoc.fileList?.length ? "Add Sales Deed" : "Upload Property Sales DEED"}
                                  </label>
                                  {(hlLapDetails.hlSalesDeedDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, hlSalesDeedDoc: { fileList: prev.hlSalesDeedDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 3. Sanction Letter (Optional - Balance Transfer) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Sanction Letter <span className="text-slate-500 font-normal">(In case of Balance Transfer)</span> <span className="text-slate-400 font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    id="hl_sanction_letter"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          hlSanctionLetterDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.hlSanctionLetterDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="hl_sanction_letter" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" /> {hlLapDetails.hlSanctionLetterDoc.fileList?.length ? "Add Sanction Letter" : "Upload Sanction Letter"}
                                  </label>
                                  {(hlLapDetails.hlSanctionLetterDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, hlSanctionLetterDoc: { fileList: prev.hlSanctionLetterDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 4. SOA (Optional - Balance Transfer) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    SOA - Statement of Account <span className="text-slate-500 font-normal">(In case of Balance Transfer)</span> <span className="text-slate-400 font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    id="hl_soa"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          hlSoaDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.hlSoaDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="hl_soa" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" /> {hlLapDetails.hlSoaDoc.fileList?.length ? "Add SOA" : "Upload Statement of Account (SOA)"}
                                  </label>
                                  {(hlLapDetails.hlSoaDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, hlSoaDoc: { fileList: prev.hlSoaDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* LAP PROPERTY DOCUMENTS */}
                            {activeTab === "lap" && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* 1. Copy of Registry */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Copy of Registry <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="lap_registry_copy"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          lapRegistryCopyDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.lapRegistryCopyDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="lap_registry_copy" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {hlLapDetails.lapRegistryCopyDoc.fileList?.length ? "Add Registry" : "Upload Copy of Registry"}
                                  </label>
                                  {(hlLapDetails.lapRegistryCopyDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, lapRegistryCopyDoc: { fileList: prev.lapRegistryCopyDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 2. Sales Deed */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Sales Deed <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="lap_sales_deed"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          lapSalesDeedDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.lapSalesDeedDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="lap_sales_deed" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {hlLapDetails.lapSalesDeedDoc.fileList?.length ? "Add Sales Deed" : "Upload Sales Deed"}
                                  </label>
                                  {(hlLapDetails.lapSalesDeedDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, lapSalesDeedDoc: { fileList: prev.lapSalesDeedDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 3. GPA / Power of Attorney */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    GPA / Power of Attorney <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="lap_gpa_power"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setHlLapDetails(prev => ({
                                          ...prev,
                                          lapGpaPowerDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.lapGpaPowerDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="lap_gpa_power" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {hlLapDetails.lapGpaPowerDoc.fileList?.length ? "Add GPA" : "Upload GPA / Power of Attorney"}
                                  </label>
                                  {(hlLapDetails.lapGpaPowerDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setHlLapDetails(prev => ({ ...prev, lapGpaPowerDoc: { fileList: prev.lapGpaPowerDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Professional Loan Minimalist Step 3 UI */}
                    {activeTab === "doctor" && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80">
                                <UserCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h5 className="text-base font-bold text-slate-900">
                                    Professional Additional Documents
                                  </h5>
                                  <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                                    Professional Verification
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Select your qualification field and upload mandatory practice certificates
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Profession Selector Dropdown */}
                          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 space-y-2 max-w-md">
                            <label className="text-xs font-bold text-slate-800 block flex items-center gap-1.5" htmlFor="professionTypeSelect">
                              <Briefcase className="w-4 h-4 text-indigo-600" /> Select Professional Qualification <span className="text-red-500 font-bold">*</span>
                            </label>
                            <p className="text-[11px] text-slate-500">Document upload list will update based on your professional selection</p>
                            <select
                              id="professionTypeSelect"
                              value={proDetails.professionType}
                              onChange={(e) => setProDetails(prev => ({ ...prev, professionType: e.target.value as "doctor" | "ca_cs_cma" }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
                            >
                              <option value="doctor">Doctor (MBBS, BDS, BAMS, BHMS)</option>
                              <option value="ca_cs_cma">CA / CS / CMA (Chartered Accountant, CS, CMA)</option>
                            </select>
                          </div>

                          {/* DOCTOR FIELDS */}
                          {proDetails.professionType === "doctor" && (
                            <div className="space-y-4 pt-2">
                              <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                <span>Doctor Practice & Qualification Documents</span>
                              </h6>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 1. UG Degree (With Camera Option) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    UG Degree (MBBS, BDS, BAMS, BHMS) <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_doc_ug_degree"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorUgDegreeDoc: {
                                            ...prev.doctorUgDegreeDoc,
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorUgDegreeDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <label htmlFor="pro_doc_ug_degree" className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">{proDetails.doctorUgDegreeDoc.fileList?.length ? "Add File" : "Upload File"}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("pro_doctor_ug_degree")}
                                      className="py-2 px-2.5 bg-white hover:bg-blue-50 text-blue-600 font-medium text-[11px] rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">Click Photo</span>
                                    </button>
                                  </div>
                                  {proDetails.doctorUgDegreeDoc.photoPreview && (
                                    <div className="relative border border-blue-200 rounded-lg p-1 bg-blue-50/50">
                                      <img src={proDetails.doctorUgDegreeDoc.photoPreview} alt="UG Degree Snapshot" className="h-16 w-full object-cover rounded" />
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorUgDegreeDoc: { ...prev.doctorUgDegreeDoc, photoPreview: undefined } }))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700 cursor-pointer">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {(proDetails.doctorUgDegreeDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorUgDegreeDoc: { ...prev.doctorUgDegreeDoc, fileList: prev.doctorUgDegreeDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 2. UG Registration (With Camera Option) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    UG Registration Certificate <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_doc_ug_reg"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorUgRegistrationDoc: {
                                            ...prev.doctorUgRegistrationDoc,
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorUgRegistrationDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <label htmlFor="pro_doc_ug_reg" className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">{proDetails.doctorUgRegistrationDoc.fileList?.length ? "Add File" : "Upload File"}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("pro_doctor_ug_reg")}
                                      className="py-2 px-2.5 bg-white hover:bg-blue-50 text-blue-600 font-medium text-[11px] rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">Click Photo</span>
                                    </button>
                                  </div>
                                  {proDetails.doctorUgRegistrationDoc.photoPreview && (
                                    <div className="relative border border-blue-200 rounded-lg p-1 bg-blue-50/50">
                                      <img src={proDetails.doctorUgRegistrationDoc.photoPreview} alt="UG Registration Snapshot" className="h-16 w-full object-cover rounded" />
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorUgRegistrationDoc: { ...prev.doctorUgRegistrationDoc, photoPreview: undefined } }))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700 cursor-pointer">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {(proDetails.doctorUgRegistrationDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorUgRegistrationDoc: { ...prev.doctorUgRegistrationDoc, fileList: prev.doctorUgRegistrationDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 3. PG Degree (MD, MS, MCH) (With Camera Option) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    PG Degree (MD, MS, MCH) <span className="text-slate-400 font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    id="pro_doc_pg_degree"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorPgDegreeDoc: {
                                            ...prev.doctorPgDegreeDoc,
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorPgDegreeDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <label htmlFor="pro_doc_pg_degree" className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" /> <span className="truncate">{proDetails.doctorPgDegreeDoc.fileList?.length ? "Add File" : "Upload File"}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("pro_doctor_pg_degree")}
                                      className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" /> <span className="truncate">Click Photo</span>
                                    </button>
                                  </div>
                                  {proDetails.doctorPgDegreeDoc.photoPreview && (
                                    <div className="relative border border-slate-200 rounded-lg p-1 bg-slate-50">
                                      <img src={proDetails.doctorPgDegreeDoc.photoPreview} alt="PG Degree Snapshot" className="h-16 w-full object-cover rounded" />
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorPgDegreeDoc: { ...prev.doctorPgDegreeDoc, photoPreview: undefined } }))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700 cursor-pointer">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {(proDetails.doctorPgDegreeDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorPgDegreeDoc: { ...prev.doctorPgDegreeDoc, fileList: prev.doctorPgDegreeDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 4. PG Registration (With Camera Option) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    PG Registration Certificate <span className="text-slate-400 font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    id="pro_doc_pg_reg"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorPgRegistrationDoc: {
                                            ...prev.doctorPgRegistrationDoc,
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorPgRegistrationDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <label htmlFor="pro_doc_pg_reg" className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" /> <span className="truncate">{proDetails.doctorPgRegistrationDoc.fileList?.length ? "Add File" : "Upload File"}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("pro_doctor_pg_reg")}
                                      className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" /> <span className="truncate">Click Photo</span>
                                    </button>
                                  </div>
                                  {proDetails.doctorPgRegistrationDoc.photoPreview && (
                                    <div className="relative border border-slate-200 rounded-lg p-1 bg-slate-50">
                                      <img src={proDetails.doctorPgRegistrationDoc.photoPreview} alt="PG Registration Snapshot" className="h-16 w-full object-cover rounded" />
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorPgRegistrationDoc: { ...prev.doctorPgRegistrationDoc, photoPreview: undefined } }))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700 cursor-pointer">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {(proDetails.doctorPgRegistrationDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorPgRegistrationDoc: { ...prev.doctorPgRegistrationDoc, fileList: prev.doctorPgRegistrationDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 5. Consultancy Letter (With Camera Option) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Consultancy Letter <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_doc_consultancy"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorConsultancyLetterDoc: {
                                            ...prev.doctorConsultancyLetterDoc,
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorConsultancyLetterDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <label htmlFor="pro_doc_consultancy" className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">{proDetails.doctorConsultancyLetterDoc.fileList?.length ? "Add File" : "Upload File"}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => triggerCameraModal("pro_doctor_consultancy")}
                                      className="py-2 px-2.5 bg-white hover:bg-blue-50 text-blue-600 font-medium text-[11px] rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">Click Photo</span>
                                    </button>
                                  </div>
                                  {proDetails.doctorConsultancyLetterDoc.photoPreview && (
                                    <div className="relative border border-blue-200 rounded-lg p-1 bg-blue-50/50">
                                      <img src={proDetails.doctorConsultancyLetterDoc.photoPreview} alt="Consultancy Letter Snapshot" className="h-16 w-full object-cover rounded" />
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorConsultancyLetterDoc: { ...prev.doctorConsultancyLetterDoc, photoPreview: undefined } }))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700 cursor-pointer">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {(proDetails.doctorConsultancyLetterDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorConsultancyLetterDoc: { ...prev.doctorConsultancyLetterDoc, fileList: prev.doctorConsultancyLetterDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 6. Doctor / Clinic Letter Head */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Doctor / Clinic Letter Head <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_doc_letterhead"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorLetterHeadDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorLetterHeadDoc?.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_doc_letterhead" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-600" /> {proDetails.doctorLetterHeadDoc?.fileList?.length ? "Add Letter Head" : "Upload Letter Head"}
                                  </label>
                                  {(proDetails.doctorLetterHeadDoc?.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[180px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorLetterHeadDoc: { fileList: prev.doctorLetterHeadDoc?.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 7. ITR (Last 2 Financial Years) (Optional) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    ITR (Last 2 Financial Years) <span className="text-slate-400 font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    id="pro_doc_itr"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorItrDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorItrDoc?.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_doc_itr" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" /> {proDetails.doctorItrDoc?.fileList?.length ? "Add ITR" : "Upload 2 Yrs ITR"}
                                  </label>
                                  {(proDetails.doctorItrDoc?.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[180px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorItrDoc: { fileList: prev.doctorItrDoc?.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 8. COI (Optional) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Certificate of Incorporation (COI) <span className="text-slate-400 font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    id="pro_doc_coi"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorCoiDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorCoiDoc?.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_doc_coi" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" /> {proDetails.doctorCoiDoc?.fileList?.length ? "Add COI" : "Upload COI"}
                                  </label>
                                  {(proDetails.doctorCoiDoc?.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[180px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorCoiDoc: { fileList: prev.doctorCoiDoc?.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 9. Udyam Registration Certificate (Optional) */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5 sm:col-span-2 max-w-md">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Udyam Registration Certificate <span className="text-slate-400 font-normal">(Optional)</span>
                                  </label>
                                  <input
                                    id="pro_doc_udyam"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          doctorUdyamDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.doctorUdyamDoc?.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_doc_udyam" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" /> {proDetails.doctorUdyamDoc?.fileList?.length ? "Add Udyam Certificate" : "Upload Udyam Certificate"}
                                  </label>
                                  {(proDetails.doctorUdyamDoc?.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[180px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, doctorUdyamDoc: { fileList: prev.doctorUdyamDoc?.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* CA / CS / CMA FIELDS */}
                          {proDetails.professionType === "ca_cs_cma" && (
                            <div className="space-y-4 pt-2">
                              <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" />
                                <span>CA / CS / CMA Practice & Accreditation Documents</span>
                              </h6>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 1. COP */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Certificate of Practice (COP) <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_fin_cop"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          financialCopDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.financialCopDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_fin_cop" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-indigo-600" /> {proDetails.financialCopDoc.fileList?.length ? "Add COP" : "Upload COP Certificate"}
                                  </label>
                                  {(proDetails.financialCopDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, financialCopDoc: { fileList: prev.financialCopDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 2. COM */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Certificate of Membership (COM) <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_fin_com"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          financialComDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.financialComDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_fin_com" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-indigo-600" /> {proDetails.financialComDoc.fileList?.length ? "Add COM" : "Upload COM Certificate"}
                                  </label>
                                  {(proDetails.financialComDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, financialComDoc: { fileList: prev.financialComDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 3. Firm Card */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Firm Card <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_fin_firm_card"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          financialFirmCardDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.financialFirmCardDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_fin_firm_card" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-indigo-600" /> {proDetails.financialFirmCardDoc.fileList?.length ? "Add Firm Card" : "Upload Firm Card"}
                                  </label>
                                  {(proDetails.financialFirmCardDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, financialFirmCardDoc: { fileList: prev.financialFirmCardDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 4. Letter Head */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Letter Head <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_fin_letterhead"
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          financialLetterHeadDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.financialLetterHeadDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_fin_letterhead" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-indigo-600" /> {proDetails.financialLetterHeadDoc.fileList?.length ? "Add Letter Head" : "Upload Letter Head"}
                                  </label>
                                  {(proDetails.financialLetterHeadDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, financialLetterHeadDoc: { fileList: prev.financialLetterHeadDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 5. 2 yrs ITR and COI */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    2 Yrs ITR & Computation (COI) <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_fin_itr_coi"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          financialItrCoiDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.financialItrCoiDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_fin_itr_coi" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-indigo-600" /> {proDetails.financialItrCoiDoc.fileList?.length ? "Add ITR & COI" : "Upload 2 Yrs ITR & COI"}
                                  </label>
                                  {(proDetails.financialItrCoiDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, financialItrCoiDoc: { fileList: prev.financialItrCoiDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 6. Udyam & Shop registration */}
                                <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                  <label className="text-xs font-semibold text-slate-800 block">
                                    Udyam & Shop Registration <span className="text-red-500 font-bold">*</span>
                                  </label>
                                  <input
                                    id="pro_fin_udyam_shop"
                                    type="file"
                                    accept=".pdf, image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files?.length) {
                                        const names = Array.from(e.target.files).map(f => f.name);
                                        setProDetails(prev => ({
                                          ...prev,
                                          financialUdyamShopDoc: {
                                            fileName: names[0],
                                            fileList: Array.from(new Set([...(prev.financialUdyamShopDoc.fileList || []), ...names]))
                                          }
                                        }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="pro_fin_udyam_shop" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-indigo-600" /> {proDetails.financialUdyamShopDoc.fileList?.length ? "Add Registration" : "Upload Udyam / Shop Reg"}
                                  </label>
                                  {(proDetails.financialUdyamShopDoc.fileList || []).map((fn, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                      <span className="truncate max-w-[150px]">{fn}</span>
                                      <button type="button" onClick={() => setProDetails(prev => ({ ...prev, financialUdyamShopDoc: { fileList: prev.financialUdyamShopDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Education Loan Minimalist Step 3 UI */}
                    {activeTab === "education" && (
                      <div className="space-y-7">
                        {/* SECTION 1: MAIN APPLICANT (STUDENT) */}
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/80">
                                <GraduationCap className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h5 className="text-base font-bold text-slate-900">
                                    1. Main Applicant Details & Documents
                                  </h5>
                                  <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold border border-blue-100">
                                    Student
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Academic records, offer letter, fee structure & personal identity
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Applicant Basic Info Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Applicant Email ID <span className="text-red-500 font-bold">*</span>
                              </label>
                              <input
                                type="email"
                                value={eduDetails.applicantEmail}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, applicantEmail: e.target.value }))}
                                placeholder="e.g. student@gmail.com"
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Applicant Mobile No. <span className="text-red-500 font-bold">*</span>
                              </label>
                              <input
                                type="tel"
                                maxLength={10}
                                value={eduDetails.applicantMobile}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, applicantMobile: e.target.value.replace(/\D/g, "") }))}
                                placeholder="10-digit mobile number"
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Applicant Mother's Name <span className="text-red-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                value={eduDetails.applicantMotherName}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, applicantMotherName: e.target.value }))}
                                placeholder="Full Mother's Name"
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                              />
                            </div>
                          </div>

                          {/* Identity KYC Section */}
                          <div>
                            <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2">
                              Identity & Address Verification
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Applicant Aadhaar */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-4 transition-all space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    Applicant Aadhaar Card <span className="text-red-500 font-bold">*</span>
                                  </span>
                                  <div className="flex text-[10px] bg-white border border-slate-200 rounded-lg p-0.5 font-medium shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, applicantAadhaarDoc: { ...prev.applicantAadhaarDoc, mode: "pdf" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.applicantAadhaarDoc.mode === "pdf" ? "bg-blue-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      PDF
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, applicantAadhaarDoc: { ...prev.applicantAadhaarDoc, mode: "photo" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.applicantAadhaarDoc.mode === "photo" ? "bg-blue-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      Front & Back Photo
                                    </button>
                                  </div>
                                </div>

                                {eduDetails.applicantAadhaarDoc.mode === "pdf" ? (
                                  <div className="space-y-2">
                                    <input
                                      id="edu_app_aadhaar_pdf"
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.length) {
                                          const names = Array.from(e.target.files).map(f => f.name);
                                          setEduDetails(prev => ({
                                            ...prev,
                                            applicantAadhaarDoc: {
                                              ...prev.applicantAadhaarDoc,
                                              fileName: names[0],
                                              fileList: Array.from(new Set([...(prev.applicantAadhaarDoc.fileList || []), ...names]))
                                            }
                                          }));
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label htmlFor="edu_app_aadhaar_pdf" className="w-full py-2.5 px-3.5 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 font-medium text-xs rounded-xl border border-slate-200 hover:border-blue-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-blue-600" /> {eduDetails.applicantAadhaarDoc.fileList?.length ? "Add More PDF" : "Choose Aadhaar PDF"}
                                    </label>
                                    {(eduDetails.applicantAadhaarDoc.fileList || []).map((fn, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-lg text-blue-950 font-medium">
                                        <span className="truncate max-w-[200px]">{fn}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEduDetails(prev => ({
                                            ...prev,
                                            applicantAadhaarDoc: {
                                              ...prev.applicantAadhaarDoc,
                                              fileList: prev.applicantAadhaarDoc.fileList?.filter((_, i) => i !== idx)
                                            }
                                          }))}
                                          className="text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Front Photo <span className="text-red-500">*</span></span>
                                      {eduDetails.applicantAadhaarDoc.frontPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.applicantAadhaarDoc.frontPhoto} alt="Aadhaar Front" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantAadhaarDoc: { ...prev.applicantAadhaarDoc, frontPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_applicant_aadhaar_front")} className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>

                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Back Photo <span className="text-red-500">*</span></span>
                                      {eduDetails.applicantAadhaarDoc.backPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.applicantAadhaarDoc.backPhoto} alt="Aadhaar Back" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantAadhaarDoc: { ...prev.applicantAadhaarDoc, backPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_applicant_aadhaar_back")} className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Applicant PAN */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-4 transition-all space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    Applicant PAN Card <span className="text-red-500 font-bold">*</span>
                                  </span>
                                  <div className="flex text-[10px] bg-white border border-slate-200 rounded-lg p-0.5 font-medium shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, applicantPanDoc: { ...prev.applicantPanDoc, mode: "pdf" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.applicantPanDoc.mode === "pdf" ? "bg-indigo-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      PDF
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, applicantPanDoc: { ...prev.applicantPanDoc, mode: "photo" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.applicantPanDoc.mode === "photo" ? "bg-indigo-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      Front & Back Photo
                                    </button>
                                  </div>
                                </div>

                                {eduDetails.applicantPanDoc.mode === "pdf" ? (
                                  <div className="space-y-2">
                                    <input
                                      id="edu_app_pan_pdf"
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.length) {
                                          const names = Array.from(e.target.files).map(f => f.name);
                                          setEduDetails(prev => ({
                                            ...prev,
                                            applicantPanDoc: {
                                              ...prev.applicantPanDoc,
                                              fileName: names[0],
                                              fileList: Array.from(new Set([...(prev.applicantPanDoc.fileList || []), ...names]))
                                            }
                                          }));
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label htmlFor="edu_app_pan_pdf" className="w-full py-2.5 px-3.5 bg-white hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 font-medium text-xs rounded-xl border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-indigo-600" /> {eduDetails.applicantPanDoc.fileList?.length ? "Add More PDF" : "Choose PAN PDF"}
                                    </label>
                                    {(eduDetails.applicantPanDoc.fileList || []).map((fn, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-lg text-indigo-950 font-medium">
                                        <span className="truncate max-w-[200px]">{fn}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEduDetails(prev => ({
                                            ...prev,
                                            applicantPanDoc: {
                                              ...prev.applicantPanDoc,
                                              fileList: prev.applicantPanDoc.fileList?.filter((_, i) => i !== idx)
                                            }
                                          }))}
                                          className="text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Front Photo <span className="text-red-500">*</span></span>
                                      {eduDetails.applicantPanDoc.frontPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.applicantPanDoc.frontPhoto} alt="PAN Front" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantPanDoc: { ...prev.applicantPanDoc, frontPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_applicant_pan_front")} className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>

                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Back Photo <span className="text-slate-400 font-normal">(Opt)</span></span>
                                      {eduDetails.applicantPanDoc.backPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.applicantPanDoc.backPhoto} alt="PAN Back" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantPanDoc: { ...prev.applicantPanDoc, backPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_applicant_pan_back")} className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Academic & Fee Proofs Section */}
                          <div>
                            <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2">
                              Academic & Admission Proofs
                            </h6>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {/* Marksheets */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                <label className="text-xs font-semibold text-slate-800 block">
                                  Marksheets (10th, 12th, Grad) <span className="text-red-500 font-bold">*</span>
                                </label>
                                <input
                                  id="edu_app_marksheets"
                                  type="file"
                                  accept=".pdf, image/*"
                                  multiple
                                  onChange={(e) => {
                                    if (e.target.files?.length) {
                                      const names = Array.from(e.target.files).map(f => f.name);
                                      setEduDetails(prev => ({
                                        ...prev,
                                        applicantMarksheetsDoc: {
                                          fileName: names[0],
                                          fileList: Array.from(new Set([...(prev.applicantMarksheetsDoc.fileList || []), ...names]))
                                        }
                                      }));
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="edu_app_marksheets" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                  <Upload className="w-3.5 h-3.5 text-blue-600" /> {eduDetails.applicantMarksheetsDoc.fileList?.length ? "Add Marksheets" : "Upload Marksheets"}
                                </label>
                                {(eduDetails.applicantMarksheetsDoc.fileList || []).map((fn, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                    <span className="truncate max-w-[130px]">{fn}</span>
                                    <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantMarksheetsDoc: { fileList: prev.applicantMarksheetsDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* College Offer Letter */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                <label className="text-xs font-semibold text-slate-800 block">
                                  College Offer Letter <span className="text-red-500 font-bold">*</span>
                                </label>
                                <input
                                  id="edu_app_offer_letter"
                                  type="file"
                                  accept=".pdf, image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.length) {
                                      const names = Array.from(e.target.files).map(f => f.name);
                                      setEduDetails(prev => ({
                                        ...prev,
                                        applicantOfferLetterDoc: {
                                          fileName: names[0],
                                          fileList: Array.from(new Set([...(prev.applicantOfferLetterDoc.fileList || []), ...names]))
                                        }
                                      }));
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="edu_app_offer_letter" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                  <Upload className="w-3.5 h-3.5 text-blue-600" /> {eduDetails.applicantOfferLetterDoc.fileList?.length ? "Add Offer Letter" : "Upload Offer Letter"}
                                </label>
                                {(eduDetails.applicantOfferLetterDoc.fileList || []).map((fn, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                    <span className="truncate max-w-[130px]">{fn}</span>
                                    <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantOfferLetterDoc: { fileList: prev.applicantOfferLetterDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Fee Structure */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                <label className="text-xs font-semibold text-slate-800 block">
                                  Fee Structure Document <span className="text-red-500 font-bold">*</span>
                                </label>
                                <input
                                  id="edu_app_fee_structure"
                                  type="file"
                                  accept=".pdf, image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.length) {
                                      const names = Array.from(e.target.files).map(f => f.name);
                                      setEduDetails(prev => ({
                                        ...prev,
                                        applicantFeeStructureDoc: {
                                          fileName: names[0],
                                          fileList: Array.from(new Set([...(prev.applicantFeeStructureDoc.fileList || []), ...names]))
                                        }
                                      }));
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="edu_app_fee_structure" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                  <Upload className="w-3.5 h-3.5 text-blue-600" /> {eduDetails.applicantFeeStructureDoc.fileList?.length ? "Add Fee Structure" : "Upload Fee Structure"}
                                </label>
                                {(eduDetails.applicantFeeStructureDoc.fileList || []).map((fn, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                    <span className="truncate max-w-[130px]">{fn}</span>
                                    <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantFeeStructureDoc: { fileList: prev.applicantFeeStructureDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Entrance & Bank Details Section */}
                          <div>
                            <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2">
                              Entrance Exam & Banking
                            </h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Entrance Exam Result */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                <label className="text-xs font-semibold text-slate-800 block">
                                  Entrance Exam Scorecard <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                  id="edu_app_entrance_exam"
                                  type="file"
                                  accept=".pdf, image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.length) {
                                      const names = Array.from(e.target.files).map(f => f.name);
                                      setEduDetails(prev => ({
                                        ...prev,
                                        applicantEntranceExamDoc: {
                                          fileName: names[0],
                                          fileList: Array.from(new Set([...(prev.applicantEntranceExamDoc.fileList || []), ...names]))
                                        }
                                      }));
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="edu_app_entrance_exam" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                  <Upload className="w-3.5 h-3.5 text-slate-500" /> {eduDetails.applicantEntranceExamDoc.fileList?.length ? "Add Scorecard" : "Upload Entrance Scorecard"}
                                </label>
                                {(eduDetails.applicantEntranceExamDoc.fileList || []).map((fn, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                    <span className="truncate max-w-[150px]">{fn}</span>
                                    <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantEntranceExamDoc: { fileList: prev.applicantEntranceExamDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Applicant Cancelled Cheque */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5">
                                <label className="text-xs font-semibold text-slate-800 block">
                                  Applicant Bank Cancelled Cheque <span className="text-red-500 font-bold">*</span>
                                </label>
                                <input
                                  id="edu_app_cheque"
                                  type="file"
                                  accept=".pdf, image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.length) {
                                      const names = Array.from(e.target.files).map(f => f.name);
                                      setEduDetails(prev => ({
                                        ...prev,
                                        applicantCancelledChequeDoc: {
                                          fileName: names[0],
                                          fileList: Array.from(new Set([...(prev.applicantCancelledChequeDoc.fileList || []), ...names]))
                                        }
                                      }));
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="edu_app_cheque" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                  <Upload className="w-3.5 h-3.5 text-blue-600" /> {eduDetails.applicantCancelledChequeDoc.fileList?.length ? "Add Cheque" : "Upload Cancelled Cheque"}
                                </label>
                                {(eduDetails.applicantCancelledChequeDoc.fileList || []).map((fn, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                    <span className="truncate max-w-[150px]">{fn}</span>
                                    <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, applicantCancelledChequeDoc: { fileList: prev.applicantCancelledChequeDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 2: CO-APPLICANT (GUARANTOR) */}
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h5 className="text-base font-bold text-slate-900">
                                    2. Co-Applicant Details & Income Proofs
                                  </h5>
                                  <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                                    Guarantor
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Relationship, identity verification & financial income proof
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Co-Applicant Relationship & Basic Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Relation with Applicant <span className="text-red-500 font-bold">*</span>
                              </label>
                              <select
                                value={eduDetails.coApplicantRelation}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, coApplicantRelation: e.target.value }))}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                              >
                                <option value="father">Father</option>
                                <option value="mother">Mother</option>
                                <option value="other">Other (Specify)</option>
                              </select>
                            </div>

                            {eduDetails.coApplicantRelation === "other" && (
                              <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                  Specify Relation <span className="text-red-500 font-bold">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={eduDetails.coApplicantRelationOther}
                                  onChange={(e) => setEduDetails(prev => ({ ...prev, coApplicantRelationOther: e.target.value }))}
                                  placeholder="e.g. Guardian, Uncle, Brother"
                                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                />
                              </div>
                            )}

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Co-Applicant Employment Type <span className="text-red-500 font-bold">*</span>
                              </label>
                              <select
                                value={eduDetails.coApplicantEmploymentType}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, coApplicantEmploymentType: e.target.value as "salaried" | "self_employed" }))}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                              >
                                <option value="salaried">Salaried</option>
                                <option value="self_employed">Self Employed</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Co-Applicant Email ID <span className="text-red-500 font-bold">*</span>
                              </label>
                              <input
                                type="email"
                                value={eduDetails.coApplicantEmail}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, coApplicantEmail: e.target.value }))}
                                placeholder="e.g. parent@gmail.com"
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Co-Applicant Mobile No. <span className="text-red-500 font-bold">*</span>
                              </label>
                              <input
                                type="tel"
                                maxLength={10}
                                value={eduDetails.coApplicantMobile}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, coApplicantMobile: e.target.value.replace(/\D/g, "") }))}
                                placeholder="10-digit mobile number"
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                Co-Applicant Mother's Name <span className="text-red-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                value={eduDetails.coApplicantMotherName}
                                onChange={(e) => setEduDetails(prev => ({ ...prev, coApplicantMotherName: e.target.value }))}
                                placeholder="Full Mother's Name"
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                              />
                            </div>
                          </div>

                          {/* Identity KYC Section */}
                          <div>
                            <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2">
                              Co-Applicant Identity Verification
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Co-Applicant Aadhaar */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-4 transition-all space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    Co-Applicant Aadhaar Card <span className="text-red-500 font-bold">*</span>
                                  </span>
                                  <div className="flex text-[10px] bg-white border border-slate-200 rounded-lg p-0.5 font-medium shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, coApplicantAadhaarDoc: { ...prev.coApplicantAadhaarDoc, mode: "pdf" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.coApplicantAadhaarDoc.mode === "pdf" ? "bg-indigo-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      PDF
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, coApplicantAadhaarDoc: { ...prev.coApplicantAadhaarDoc, mode: "photo" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.coApplicantAadhaarDoc.mode === "photo" ? "bg-indigo-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      Front & Back Photo
                                    </button>
                                  </div>
                                </div>

                                {eduDetails.coApplicantAadhaarDoc.mode === "pdf" ? (
                                  <div className="space-y-2">
                                    <input
                                      id="edu_coapp_aadhaar_pdf"
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.length) {
                                          const names = Array.from(e.target.files).map(f => f.name);
                                          setEduDetails(prev => ({
                                            ...prev,
                                            coApplicantAadhaarDoc: {
                                              ...prev.coApplicantAadhaarDoc,
                                              fileName: names[0],
                                              fileList: Array.from(new Set([...(prev.coApplicantAadhaarDoc.fileList || []), ...names]))
                                            }
                                          }));
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label htmlFor="edu_coapp_aadhaar_pdf" className="w-full py-2.5 px-3.5 bg-white hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 font-medium text-xs rounded-xl border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-indigo-600" /> {eduDetails.coApplicantAadhaarDoc.fileList?.length ? "Add More PDF" : "Upload Aadhaar PDF"}
                                    </label>
                                    {(eduDetails.coApplicantAadhaarDoc.fileList || []).map((fn, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-lg text-indigo-950 font-medium">
                                        <span className="truncate max-w-[200px]">{fn}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEduDetails(prev => ({
                                            ...prev,
                                            coApplicantAadhaarDoc: {
                                              ...prev.coApplicantAadhaarDoc,
                                              fileList: prev.coApplicantAadhaarDoc.fileList?.filter((_, i) => i !== idx)
                                            }
                                          }))}
                                          className="text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Front Photo <span className="text-red-500">*</span></span>
                                      {eduDetails.coApplicantAadhaarDoc.frontPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.coApplicantAadhaarDoc.frontPhoto} alt="Aadhaar Front" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantAadhaarDoc: { ...prev.coApplicantAadhaarDoc, frontPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_coapplicant_aadhaar_front")} className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>

                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Back Photo <span className="text-red-500">*</span></span>
                                      {eduDetails.coApplicantAadhaarDoc.backPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.coApplicantAadhaarDoc.backPhoto} alt="Aadhaar Back" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantAadhaarDoc: { ...prev.coApplicantAadhaarDoc, backPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_coapplicant_aadhaar_back")} className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Co-Applicant PAN */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-4 transition-all space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    Co-Applicant PAN Card <span className="text-red-500 font-bold">*</span>
                                  </span>
                                  <div className="flex text-[10px] bg-white border border-slate-200 rounded-lg p-0.5 font-medium shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, coApplicantPanDoc: { ...prev.coApplicantPanDoc, mode: "pdf" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.coApplicantPanDoc.mode === "pdf" ? "bg-indigo-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      PDF
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEduDetails(prev => ({ ...prev, coApplicantPanDoc: { ...prev.coApplicantPanDoc, mode: "photo" } }))}
                                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${eduDetails.coApplicantPanDoc.mode === "photo" ? "bg-indigo-600 text-white font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                      Front & Back Photo
                                    </button>
                                  </div>
                                </div>

                                {eduDetails.coApplicantPanDoc.mode === "pdf" ? (
                                  <div className="space-y-2">
                                    <input
                                      id="edu_coapp_pan_pdf"
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.length) {
                                          const names = Array.from(e.target.files).map(f => f.name);
                                          setEduDetails(prev => ({
                                            ...prev,
                                            coApplicantPanDoc: {
                                              ...prev.coApplicantPanDoc,
                                              fileName: names[0],
                                              fileList: Array.from(new Set([...(prev.coApplicantPanDoc.fileList || []), ...names]))
                                            }
                                          }));
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label htmlFor="edu_coapp_pan_pdf" className="w-full py-2.5 px-3.5 bg-white hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 font-medium text-xs rounded-xl border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                      <Upload className="w-3.5 h-3.5 text-indigo-600" /> {eduDetails.coApplicantPanDoc.fileList?.length ? "Add More PDF" : "Upload PAN PDF"}
                                    </label>
                                    {(eduDetails.coApplicantPanDoc.fileList || []).map((fn, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-lg text-indigo-950 font-medium">
                                        <span className="truncate max-w-[200px]">{fn}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEduDetails(prev => ({
                                            ...prev,
                                            coApplicantPanDoc: {
                                              ...prev.coApplicantPanDoc,
                                              fileList: prev.coApplicantPanDoc.fileList?.filter((_, i) => i !== idx)
                                            }
                                          }))}
                                          className="text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Front Photo <span className="text-red-500">*</span></span>
                                      {eduDetails.coApplicantPanDoc.frontPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.coApplicantPanDoc.frontPhoto} alt="PAN Front" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantPanDoc: { ...prev.coApplicantPanDoc, frontPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_coapplicant_pan_front")} className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>

                                    <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-white space-y-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700 block">Back Photo <span className="text-slate-400 font-normal">(Opt)</span></span>
                                      {eduDetails.coApplicantPanDoc.backPhoto ? (
                                        <div className="relative pt-1">
                                          <img src={eduDetails.coApplicantPanDoc.backPhoto} alt="PAN Back" className="h-14 mx-auto rounded border object-cover" />
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantPanDoc: { ...prev.coApplicantPanDoc, backPhoto: undefined } }))} className="text-[10px] text-red-600 font-semibold hover:underline mt-1 cursor-pointer block mx-auto">Remove</button>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => triggerCameraModal("edu_coapplicant_pan_back")} className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                          <Camera className="w-3.5 h-3.5" /> Capture
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Banking & Income Proofs Section */}
                          <div>
                            <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2 flex items-center justify-between">
                              <span>Banking & Income Proofs</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                                {eduDetails.coApplicantEmploymentType === "salaried" ? "Salaried Person" : "Self-Employed"}
                              </span>
                            </h6>
                            
                            <div className="space-y-4">
                              {/* Cancelled Cheque */}
                              <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2.5 max-w-md">
                                <label className="text-xs font-semibold text-slate-800 block">
                                  Co-Applicant Bank Cancelled Cheque <span className="text-red-500 font-bold">*</span>
                                </label>
                                <input
                                  id="edu_coapp_cheque"
                                  type="file"
                                  accept=".pdf, image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.length) {
                                      const names = Array.from(e.target.files).map(f => f.name);
                                      setEduDetails(prev => ({
                                        ...prev,
                                        coApplicantCancelledChequeDoc: {
                                          fileName: names[0],
                                          fileList: Array.from(new Set([...(prev.coApplicantCancelledChequeDoc.fileList || []), ...names]))
                                        }
                                      }));
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="edu_coapp_cheque" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                                  <Upload className="w-3.5 h-3.5 text-indigo-600" /> {eduDetails.coApplicantCancelledChequeDoc.fileList?.length ? "Add Cancelled Cheque" : "Upload Cancelled Cheque"}
                                </label>
                                {(eduDetails.coApplicantCancelledChequeDoc.fileList || []).map((fn, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                    <span className="truncate max-w-[180px]">{fn}</span>
                                    <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantCancelledChequeDoc: { fileList: prev.coApplicantCancelledChequeDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Conditional Income Proofs for Co-Applicant */}
                              {eduDetails.coApplicantEmploymentType === "salaried" ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <FileCheck className="w-4 h-4 text-emerald-600" />
                                    <span>Salaried Income Documents</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Form 16 */}
                                    <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2">
                                      <label className="text-xs font-semibold text-slate-800 block">
                                        Form 16 Part A-B (2 Yrs) <span className="text-red-500 font-bold">*</span>
                                      </label>
                                      <input
                                        id="edu_coapp_form16"
                                        type="file"
                                        accept=".pdf, image/*"
                                        multiple
                                        onChange={(e) => {
                                          if (e.target.files?.length) {
                                            const names = Array.from(e.target.files).map(f => f.name);
                                            setEduDetails(prev => ({
                                              ...prev,
                                              coApplicantForm16Doc: {
                                                fileName: names[0],
                                                fileList: Array.from(new Set([...(prev.coApplicantForm16Doc.fileList || []), ...names]))
                                              }
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edu_coapp_form16" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                        <Upload className="w-3.5 h-3.5 text-emerald-600" /> {eduDetails.coApplicantForm16Doc.fileList?.length ? "Add Form 16" : "Upload Form 16"}
                                      </label>
                                      {(eduDetails.coApplicantForm16Doc.fileList || []).map((fn, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                          <span className="truncate max-w-[120px]">{fn}</span>
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantForm16Doc: { fileList: prev.coApplicantForm16Doc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Salary Slips */}
                                    <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2">
                                      <label className="text-xs font-semibold text-slate-800 block">
                                        3 Months Salary Slips <span className="text-red-500 font-bold">*</span>
                                      </label>
                                      <input
                                        id="edu_coapp_slips"
                                        type="file"
                                        accept=".pdf, image/*"
                                        multiple
                                        onChange={(e) => {
                                          if (e.target.files?.length) {
                                            const names = Array.from(e.target.files).map(f => f.name);
                                            setEduDetails(prev => ({
                                              ...prev,
                                              coApplicantSalarySlipsDoc: {
                                                fileName: names[0],
                                                fileList: Array.from(new Set([...(prev.coApplicantSalarySlipsDoc.fileList || []), ...names]))
                                              }
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edu_coapp_slips" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                        <Upload className="w-3.5 h-3.5 text-emerald-600" /> {eduDetails.coApplicantSalarySlipsDoc.fileList?.length ? "Add Slips" : "Upload Slips"}
                                      </label>
                                      {(eduDetails.coApplicantSalarySlipsDoc.fileList || []).map((fn, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                          <span className="truncate max-w-[120px]">{fn}</span>
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantSalarySlipsDoc: { fileList: prev.coApplicantSalarySlipsDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Company / Govt ID */}
                                    <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2">
                                      <label className="text-xs font-semibold text-slate-800 block">
                                        Company / Govt ID Card <span className="text-red-500 font-bold">*</span>
                                      </label>
                                      <input
                                        id="edu_coapp_comp_id"
                                        type="file"
                                        accept=".pdf, image/*"
                                        onChange={(e) => {
                                          if (e.target.files?.length) {
                                            const names = Array.from(e.target.files).map(f => f.name);
                                            setEduDetails(prev => ({
                                              ...prev,
                                              coApplicantCompanyIdDoc: {
                                                fileName: names[0],
                                                fileList: Array.from(new Set([...(prev.coApplicantCompanyIdDoc.fileList || []), ...names]))
                                              }
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edu_coapp_comp_id" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                        <Upload className="w-3.5 h-3.5 text-emerald-600" /> {eduDetails.coApplicantCompanyIdDoc.fileList?.length ? "Add ID Card" : "Upload ID Card"}
                                      </label>
                                      {(eduDetails.coApplicantCompanyIdDoc.fileList || []).map((fn, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                          <span className="truncate max-w-[120px]">{fn}</span>
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantCompanyIdDoc: { fileList: prev.coApplicantCompanyIdDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <Briefcase className="w-4 h-4 text-amber-600" />
                                    <span>Self-Employed Business Documents</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Last 2 Years ITR */}
                                    <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2">
                                      <label className="text-xs font-semibold text-slate-800 block">
                                        ITR & Computation (2 Yrs) <span className="text-red-500 font-bold">*</span>
                                      </label>
                                      <input
                                        id="edu_coapp_itr"
                                        type="file"
                                        accept=".pdf, image/*"
                                        multiple
                                        onChange={(e) => {
                                          if (e.target.files?.length) {
                                            const names = Array.from(e.target.files).map(f => f.name);
                                            setEduDetails(prev => ({
                                              ...prev,
                                              coApplicantItrDoc: {
                                                fileName: names[0],
                                                fileList: Array.from(new Set([...(prev.coApplicantItrDoc.fileList || []), ...names]))
                                              }
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edu_coapp_itr" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                        <Upload className="w-3.5 h-3.5 text-amber-600" /> {eduDetails.coApplicantItrDoc.fileList?.length ? "Add ITR" : "Upload ITR & Computation"}
                                      </label>
                                      {(eduDetails.coApplicantItrDoc.fileList || []).map((fn, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                          <span className="truncate max-w-[140px]">{fn}</span>
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantItrDoc: { fileList: prev.coApplicantItrDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Udyam Certificate */}
                                    <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2">
                                      <label className="text-xs font-semibold text-slate-800 block">
                                        Udyam Registration <span className="text-red-500 font-bold">*</span>
                                      </label>
                                      <input
                                        id="edu_coapp_udyam"
                                        type="file"
                                        accept=".pdf, image/*"
                                        onChange={(e) => {
                                          if (e.target.files?.length) {
                                            const names = Array.from(e.target.files).map(f => f.name);
                                            setEduDetails(prev => ({
                                              ...prev,
                                              coApplicantUdyamDoc: {
                                                fileName: names[0],
                                                fileList: Array.from(new Set([...(prev.coApplicantUdyamDoc.fileList || []), ...names]))
                                              }
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edu_coapp_udyam" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                        <Upload className="w-3.5 h-3.5 text-amber-600" /> {eduDetails.coApplicantUdyamDoc.fileList?.length ? "Add Certificate" : "Upload Udyam Certificate"}
                                      </label>
                                      {(eduDetails.coApplicantUdyamDoc.fileList || []).map((fn, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                          <span className="truncate max-w-[140px]">{fn}</span>
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantUdyamDoc: { fileList: prev.coApplicantUdyamDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* GST Certificate */}
                                    <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2">
                                      <label className="text-xs font-semibold text-slate-800 block">
                                        GST Certificate <span className="text-red-500 font-bold">*</span>
                                      </label>
                                      <input
                                        id="edu_coapp_gst"
                                        type="file"
                                        accept=".pdf, image/*"
                                        onChange={(e) => {
                                          if (e.target.files?.length) {
                                            const names = Array.from(e.target.files).map(f => f.name);
                                            setEduDetails(prev => ({
                                              ...prev,
                                              coApplicantGstDoc: {
                                                fileName: names[0],
                                                fileList: Array.from(new Set([...(prev.coApplicantGstDoc.fileList || []), ...names]))
                                              }
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edu_coapp_gst" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                        <Upload className="w-3.5 h-3.5 text-amber-600" /> {eduDetails.coApplicantGstDoc.fileList?.length ? "Add GST" : "Upload GST Certificate"}
                                      </label>
                                      {(eduDetails.coApplicantGstDoc.fileList || []).map((fn, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                          <span className="truncate max-w-[140px]">{fn}</span>
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantGstDoc: { fileList: prev.coApplicantGstDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Financial Statements (P/L, B/S) */}
                                    <div className="bg-slate-50/30 hover:bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all space-y-2">
                                      <label className="text-xs font-semibold text-slate-800 block">
                                        Financials (P/L & B/S - 2 Yrs) <span className="text-red-500 font-bold">*</span>
                                      </label>
                                      <input
                                        id="edu_coapp_financials"
                                        type="file"
                                        accept=".pdf, image/*"
                                        multiple
                                        onChange={(e) => {
                                          if (e.target.files?.length) {
                                            const names = Array.from(e.target.files).map(f => f.name);
                                            setEduDetails(prev => ({
                                              ...prev,
                                              coApplicantFinancialsDoc: {
                                                fileName: names[0],
                                                fileList: Array.from(new Set([...(prev.coApplicantFinancialsDoc.fileList || []), ...names]))
                                              }
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edu_coapp_financials" className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                                        <Upload className="w-3.5 h-3.5 text-amber-600" /> {eduDetails.coApplicantFinancialsDoc.fileList?.length ? "Add Financials" : "Upload Financials (P/L & B/S)"}
                                      </label>
                                      {(eduDetails.coApplicantFinancialsDoc.fileList || []).map((fn, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                                          <span className="truncate max-w-[140px]">{fn}</span>
                                          <button type="button" onClick={() => setEduDetails(prev => ({ ...prev, coApplicantFinancialsDoc: { fileList: prev.coApplicantFinancialsDoc.fileList?.filter((_, i) => i !== idx) } }))} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab !== "doctor" && activeTab !== "education" && activeTab !== "home" && activeTab !== "lap" && (
                      <div className="space-y-4">
                        {getEffectiveDocFields().map((field) => (
                        <div key={field.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div>
                            <label className="text-xs font-bold text-gray-900 block">
                              {field.label} {field.required ? <span className="text-red-500 font-bold ml-1">* (Mandatory)</span> : <span className="text-gray-400 font-normal ml-1">(Optional)</span>}
                            </label>
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
                  )}

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
                    <div className="pt-2 flex justify-between items-center">
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