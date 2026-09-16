import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Building,
  UserCheck,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Upload,
  ArrowRight,
  Filter,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Download,
  SlidersHorizontal,
  User,
  BadgeCheck,
  Send,
  Building2,
  FileCheck,
  Zap,
  Menu,
  BarChart2,
  Lock,
  Plus
} from "lucide-react";

export interface TicketStage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  status: "completed" | "current" | "pending" | "action_required";
  timestamp?: string;
  actor?: string;
  notes?: string;
}

export interface LoanTicket {
  ticketId: string;
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  loanCategory: string; // e.g. "Personal Loan", "Home Loan", "Business Loan", "Doctor Loan", "Education Loan", "LAP"
  loanAmount: number;
  tenureYears: number;
  createdDate: string;
  currentStageId: number; // 1 to 5
  bankPartner: string;
  createdByRole: "user" | "employee" | "admin";
  createdByUserId?: string;
  creditManager: {
    name: string;
    role: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
  };
  stages: TicketStage[];
  docsStatus: {
    name: string;
    status: "verified" | "pending" | "resubmit_required";
    remarks?: string;
  }[];
  actionRequiredNote?: string;
  sanctionLetterUrl?: string;
}

export interface CreditManagerProfile {
  empCode: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

export const FINHEAL_CREDIT_MANAGERS: CreditManagerProfile[] = [
  {
    empCode: "F2-369-403",
    name: "Puneet Gautam",
    role: "Credit Manager",
    phone: "7844957879"
  },
  {
    empCode: "F2-369-536",
    name: "Akshay Jain",
    role: "Credit Executive",
    phone: "6388561901"
  },
  {
    empCode: "F2-369-445",
    name: "Md Mehboob",
    role: "Asst. Ops Manager",
    phone: "9310179765"
  },
  {
    empCode: "F2-369-019",
    name: "Furkan Jung",
    role: "Sr. Operations & Alliances Manager",
    phone: "8791876992"
  }
];

export function getCreditManagerInfo(input?: any): CreditManagerProfile | null {
  if (!input) return null;

  let nameStr = "";
  let empCodeStr = "";
  let phoneStr = "";
  let roleStr = "";
  let emailStr = "";

  if (typeof input === "object" && input !== null) {
    nameStr = (input.name || input.assignedTo || input.creditManagerName || "").toString().trim();
    empCodeStr = (input.empCode || input.emp_code || input.id || "").toString().trim();
    phoneStr = (input.phone || input.mobile || input.contact || "").toString().replace(/\D/g, "");
    roleStr = (input.role || "").toString().trim();
    emailStr = (input.email || "").toString().trim();
  } else if (typeof input === "string") {
    nameStr = input.trim();
    empCodeStr = input.trim();
  }

  if (!nameStr && !empCodeStr && !phoneStr) {
    return null;
  }

  const lowerName = nameStr.toLowerCase();
  if (["credit operations", "system automated", "pending", "unassigned", "n/a", "none", ""].includes(lowerName)) {
    return null;
  }

  if (empCodeStr) {
    const match = FINHEAL_CREDIT_MANAGERS.find(
      (m) => m.empCode.toLowerCase() === empCodeStr.toLowerCase()
    );
    if (match) return match;
  }

  if (nameStr) {
    const match = FINHEAL_CREDIT_MANAGERS.find(
      (m) =>
        m.name.toLowerCase().includes(lowerName) ||
        lowerName.includes(m.name.toLowerCase())
    );
    if (match) return match;

    return {
      empCode: empCodeStr || "",
      name: nameStr,
      role: roleStr || "Credit Officer",
      phone: phoneStr,
      email: emailStr
    };
  }

  if (phoneStr) {
    const match = FINHEAL_CREDIT_MANAGERS.find((m) => m.phone === phoneStr);
    if (match) return match;
  }

  return null;
}

const DEFAULT_MOCK_TICKETS: LoanTicket[] = [];

interface TrackApplicationViewProps {
  userId?: string;
  userEmail?: string;
  portalRole?: "user" | "employee" | "admin";
  onToggleSidebar?: () => void;
  onToggleInsights?: () => void;
  onApplyNewLoan?: () => void;
  isStaffRole?: boolean;
}

function formatDateTimeWithTime(rawDate: any): string {
  if (!rawDate) return "Recently";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      return String(rawDate);
    }
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return String(rawDate);
  }
}

function mapOmsTicketToLoanTicket(raw: any): LoanTicket {
  const statusLower = String(raw.ticketStatus || raw.loanStatus || "").toLowerCase();

  // Determine current stage: 1 to 5
  let stageId = 1;
  if (statusLower.includes("disburs")) {
    stageId = 5;
  } else if (statusLower.includes("sanction") || statusLower.includes("approv") || raw.approvedAt) {
    stageId = 3;
  } else if (statusLower.includes("credit") || statusLower.includes("operation") || statusLower.includes("review") || statusLower.includes("process")) {
    stageId = 2;
  }

  const rawCreated = raw.createdAt || raw.created_at || raw.ticketCreatedDate || raw.createdDate || raw.applicationDate;
  const createdDateFormatted = formatDateTimeWithTime(rawCreated);

  const rawAmt = parseFloat(String(raw.applicationAmount || 0).replace(/,/g, "")) || 0;
  const rawTenure = parseInt(String(raw.applicationTenure || 3), 10) || 3;
  const rawType = raw.loanType ? (raw.loanType.charAt(0).toUpperCase() + raw.loanType.slice(1)) : "Personal Loan";

  // Build 5-stage progressive timeline
  const stages: TicketStage[] = [
    {
      id: 1,
      title: "Application Received",
      subtitle: "FinHeal Digital Onboarding",
      description: "Loan application and basic identity submitted to OMS.",
      status: stageId > 1 ? "completed" : "current",
      timestamp: createdDateFormatted,
      actor: "FinHeal Portal"
    },
    {
      id: 2,
      title: "Credit Verification",
      subtitle: "Bank Hub & Ops Underwriting",
      description: "Documents and banking statements under underwriting review.",
      status: stageId > 2 ? "completed" : stageId === 2 ? "current" : "pending",
      timestamp: stageId >= 2 ? createdDateFormatted : undefined,
      actor: "Credit Operations"
    },
    {
      id: 3,
      title: "Bank Sanction Approved",
      subtitle: raw.applicationProvider || "Partner Bank",
      description: raw.approvedAmount ? `Sanctioned loan amount of ₹${Number(raw.approvedAmount).toLocaleString("en-IN")}.` : "Credit checks cleared and in-principle sanction approved.",
      status: stageId > 3 ? "completed" : stageId === 3 ? "current" : "pending",
      timestamp: raw.approvedAt ? formatDateTimeWithTime(raw.approvedAt) : undefined,
      actor: raw.applicationProvider || "Lender Desk"
    },
    {
      id: 4,
      title: "Agreement & e-Sign",
      subtitle: "Loan Contract Signing",
      description: "Borrower agreement and repayment mandate execution.",
      status: stageId > 4 ? "completed" : stageId === 4 ? "current" : "pending",
      actor: "Legal & Operations"
    },
    {
      id: 5,
      title: "Funds Disbursed",
      subtitle: "Direct Account Credit",
      description: raw.disbursedAmount ? `Funds of ₹${Number(raw.disbursedAmount).toLocaleString("en-IN")} credited.` : "Direct account transfer completed by lender.",
      status: stageId === 5 ? "completed" : "pending",
      timestamp: raw.disbursedAt ? formatDateTimeWithTime(raw.disbursedAt) : undefined,
      actor: "Disbursement Desk"
    }
  ];

  return {
    ticketId: String(raw.ticketId ? `${raw.ticketId}` : (raw.applicationId ? `${raw.applicationId}` : "LIVE")),
    applicantName: raw.customerName || "Applicant",
    applicantMobile: raw.customerContact || "",
    applicantEmail: raw.customerEmail || "",
    loanCategory: rawType,
    loanAmount: rawAmt,
    tenureYears: rawTenure,
    createdDate: createdDateFormatted,
    currentStageId: stageId,
    bankPartner: raw.applicationProvider || "Partner Bank",
    createdByRole: raw.appliedBy ? "employee" : "user",
    creditManager: {
      name: raw.creditManagerName || raw.assignedTo || raw.creditOfficer || "",
      role: raw.creditManagerRole || "",
      phone: raw.creditManagerContact || raw.creditManagerPhone || "",
      email: raw.creditManagerEmail || ""
    },
    stages,
    docsStatus: [
      { name: "Identity & Address Proof", status: "verified" },
      { name: "Bank Statement", status: "verified" },
      { name: "Income / Salary Proof", status: "verified" }
    ]
  };
}

export default function TrackApplicationView({
  userId,
  userEmail,
  portalRole,
  onToggleSidebar,
  onToggleInsights,
  onApplyNewLoan,
  isStaffRole = false
}: TrackApplicationViewProps) {
  // Determine exact role: "user" | "employee" | "admin"
  const isSuperAdmin = userEmail ? ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase()) : false;
  const activeRole: "user" | "employee" | "admin" = portalRole || (isSuperAdmin ? "admin" : isStaffRole ? "employee" : "user");

  // Loading state for live OMS fetch
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Load tickets from localStorage or start empty
  const [tickets, setTickets] = useState<LoanTicket[]>(() => {
    try {
      const saved = localStorage.getItem("f2_loan_tickets_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(
            (t) => !["FIN-2026-8942", "FIN-2026-7310", "FIN-2026-9921"].includes(t.ticketId)
          );
          return realOnly;
        }
      }
    } catch (e) {
      console.warn("Could not load local loan tickets", e);
    }
    return [];
  });

  // Fetch live tickets strictly with applicationSource = 'finheal'
  const fetchLiveTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/loan-applications/tickets?source=finheal`);
      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.tickets) ? json.tickets : (json.data?.data?.results || []);

        // Double safety filter: strictly retain only tickets where applicationSource is 'finheal'
        const finhealOnly = rawList.filter(
          (t: any) => String(t.applicationSource || "").trim().toLowerCase() === "finheal"
        );

        const mapped = finhealOnly.map(mapOmsTicketToLoanTicket);
        setTickets(mapped);
      }
    } catch (e) {
      console.warn("[TrackApplicationView] Could not fetch live FinHeal tickets:", e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchLiveTickets();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("f2_loan_tickets_v1", JSON.stringify(tickets));
    } catch (e) {
      console.warn("Could not save loan tickets to localStorage", e);
    }
  }, [tickets]);

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Employee & Admin Tab Filters
  const [employeeTab, setEmployeeTab] = useState<"all" | "my">("all");
  const [adminTab, setAdminTab] = useState<"all" | "user" | "staff" | "admin">("all");
  const [opsFilterStage, setOpsFilterStage] = useState<string>("all");

  // Filter tickets based on active role
  const roleFilteredTickets = tickets.filter((t) => {
    if (activeRole === "user") {
      // User Portal: only show user's own tickets
      if (userEmail && t.applicantEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      if (userId && t.createdByUserId === userId) return true;
      return t.createdByRole === "user" || !t.createdByRole;
    } else if (activeRole === "employee") {
      // Employee Portal
      if (employeeTab === "my") {
        return t.createdByRole === "employee" || (t.creditManager.email ? t.creditManager.email.toLowerCase() === (userEmail || "").toLowerCase() : false);
      }
      return true;
    } else {
      // Admin Portal
      if (adminTab === "user") return t.createdByRole === "user";
      if (adminTab === "staff") return t.createdByRole === "employee";
      if (adminTab === "admin") return t.createdByRole === "admin";
      return true;
    }
  });

  // Search filter
  const filteredTickets = roleFilteredTickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticketId.toLowerCase().includes(q) ||
      t.applicantName.toLowerCase().includes(q) ||
      t.loanCategory.toLowerCase().includes(q) ||
      t.applicantMobile.includes(q)
    );
  });

  const [selectedTicketId, setSelectedTicketId] = useState<string>("");

  // Keep selectedTicketId valid
  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.some(t => t.ticketId === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].ticketId);
    }
  }, [filteredTickets, selectedTicketId]);

  const activeTicket = filteredTickets.find((t) => t.ticketId.toLowerCase() === selectedTicketId.toLowerCase()) || filteredTickets[0] || null;

  const handleCopyTicketId = (tid: string) => {
    navigator.clipboard.writeText(tid);
    setCopiedTicketId(tid);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };

  // Helper to advance ticket stage (Ops/Admin action)
  const handleAdvanceStage = (ticketId: string, nextStageId: number) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId !== ticketId) return t;
        const now = new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        const updatedStages = t.stages.map((stage) => {
          if (stage.id < nextStageId) {
            return { ...stage, status: "completed" as const, timestamp: stage.timestamp || now };
          }
          if (stage.id === nextStageId) {
            return { ...stage, status: "current" as const, timestamp: now };
          }
          return { ...stage, status: "pending" as const };
        });

        return {
          ...t,
          currentStageId: nextStageId,
          stages: updatedStages
        };
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[f8fafc] overflow-y-auto">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 lg:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                {activeRole === "user" && "Track Your Loan Applications"}
                {activeRole === "employee" && "Track Company Tickets & Operations"}
                {activeRole === "admin" && "Track All Platform Tickets (Admin)"}
              </h1>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              {activeRole === "user" && "Real-time tracking of your loan applications, queries & submitted files"}
              {activeRole === "employee" && "Manage & process loan tickets submitted by applicants and employees across the company"}
              {activeRole === "admin" && "Complete system-wide overview of all loan tickets created across the platform"}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLiveTickets}
            disabled={isLoadingTickets}
            title="Refresh Live FinHeal Tickets from OMS"
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden md:inline">{isLoadingTickets ? "Syncing..." : "Sync Live Tickets"}</span>
          </button>

          {activeRole === "user" && onApplyNewLoan && (
            <button
              type="button"
              onClick={onApplyNewLoan}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Apply New Loan
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Employee / Admin Role Specific Tab Navigation */}
        {activeRole === "employee" && (
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEmployeeTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${employeeTab === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Building className="w-4 h-4" /> All Company Tickets ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setEmployeeTab("my")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${employeeTab === "my" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <UserCheck className="w-4 h-4" /> My Created / Assigned Tickets ({tickets.filter(t => t.createdByRole === "employee").length})
            </button>
          </div>
        )}

        {activeRole === "admin" && (
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${adminTab === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <ShieldCheck className="w-4 h-4" /> All System Tickets ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("user")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${adminTab === "user" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <User className="w-4 h-4" /> User Applied ({tickets.filter(t => t.createdByRole === "user").length})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("staff")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${adminTab === "staff" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Building2 className="w-4 h-4" /> Staff / Credit Applied ({tickets.filter(t => t.createdByRole === "employee").length})
            </button>
          </div>
        )}

        {/* Overview Metrics (Shown for Employee / Admin Portals) */}
        {(activeRole === "employee" || activeRole === "admin") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Active OMS Tickets</span>
              <div className="text-2xl font-black text-slate-900">{filteredTickets.length} Tickets</div>
              <p className="text-[11px] text-slate-500">Tracked across HDFC, SBI & ICICI hubs</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">In Credit Verification</span>
              <div className="text-2xl font-black text-blue-900">
                {filteredTickets.filter((t) => t.currentStageId <= 3).length} Applications
              </div>
              <p className="text-[11px] text-blue-600 font-medium">SLA Target: &lt; 24 Hours</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Bank Sanction Approved</span>
              <div className="text-2xl font-black text-amber-900">
                {filteredTickets.filter((t) => t.currentStageId === 4).length} Applications
              </div>
              <p className="text-[11px] text-amber-600 font-medium">Awaiting agreement signing</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Disbursed Volume</span>
              <div className="text-2xl font-black text-emerald-900">
                ₹
                {filteredTickets
                  .filter((t) => t.currentStageId === 5)
                  .reduce((sum, t) => sum + t.loanAmount, 0)
                  .toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">100% Payout Complete</p>
            </div>
          </div>
        )}

        {/* Master Unified Loan Tickets Queue Data Table */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>
                  {activeRole === "user" ? "Your Loan Applications" : "Loan Processing Tickets Queue"}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Click any row below to inspect its live stage progress & timeline</p>
            </div>

            {/* Controls: Stage Filter & Search Input */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {(activeRole === "employee" || activeRole === "admin") && (
                <select
                  value={opsFilterStage}
                  onChange={(e) => setOpsFilterStage(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50/80 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="all">All Stages</option>
                  <option value="1">Stage 1: Application Created</option>
                  <option value="2">Stage 2: Credit Verified</option>
                  <option value="3">Stage 3: Bank Underwriting</option>
                  <option value="4">Stage 4: Sanction Approved</option>
                  <option value="5">Stage 5: Loan Disbursed</option>
                </select>
              )}

              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Ticket ID, Name or Loan Category..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Master Data Table */}
          {isLoadingTickets ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">Syncing Live FinHeal Tickets...</h4>
                <p className="text-xs text-slate-400">Connecting to OMS platform to fetch latest records</p>
              </div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">No loan applications found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeRole === "user"
                    ? "You haven't submitted any loan applications yet. New loan requests will appear here with live status tracking."
                    : "No active loan tickets found matching your current filters."}
                </p>
              </div>
              {activeRole === "user" && onApplyNewLoan && (
                <button
                  type="button"
                  onClick={onApplyNewLoan}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Apply for a Loan
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[380px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">Select</th>
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Applicant Name</th>
                    <th className="p-3 whitespace-nowrap">Category</th>
                    <th className="p-3">Loan Amount</th>
                    <th className="p-3">Created Date & Time</th>
                    {(activeRole === "employee" || activeRole === "admin") && (
                      <th className="p-3">Created By</th>
                    )}
                    <th className="p-3">Current Processing Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTickets.map((t) => {
                    const isSelected = activeTicket?.ticketId === t.ticketId;
                    const stageName = t.stages.find((s) => s.id === t.currentStageId)?.title.split("&")[0].split("Pick")[0].trim() || "In Progress";

                    return (
                      <tr
                        key={t.ticketId}
                        onClick={() => setSelectedTicketId(t.ticketId)}
                        className={`transition-colors cursor-pointer ${isSelected
                          ? "bg-blue-50/90 font-bold border-l-4 border-l-blue-600"
                          : "hover:bg-slate-50/80 bg-white"
                          }`}
                      >
                        {/* Radio Indicator */}
                        <td className="p-3 text-center">
                          <div className={`w-4 h-4 mx-auto rounded-full flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 text-white shadow-2xs" : "border border-slate-300 bg-white"
                            }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </td>

                        {/* Ticket ID */}
                        <td className="p-3 font-black text-blue-900 whitespace-nowrap">
                          {t.ticketId}
                        </td>

                        {/* Applicant Details */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{t.applicantName}</div>
                          <div className="text-[10px] text-slate-400">{t.applicantMobile}</div>
                        </td>

                        {/* Category */}
                        <td className="p-3 whitespace-nowrap">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md whitespace-nowrap inline-block ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                            {t.loanCategory.split("(")[0].trim()}
                          </span>
                        </td>

                        {/* Loan Amount */}
                        <td className="p-3 font-extrabold text-slate-900 whitespace-nowrap">
                          ₹{t.loanAmount.toLocaleString("en-IN")}
                        </td>

                        {/* Created Date & Time */}
                        <td className="p-3 text-slate-600 text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {t.createdDate}
                          </div>
                        </td>

                        {/* Created By (Employee/Admin View) */}
                        {(activeRole === "employee" || activeRole === "admin") && (
                          <td className="p-3 whitespace-nowrap">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${t.createdByRole === "user"
                              ? "bg-slate-100 text-slate-700"
                              : t.createdByRole === "employee"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                              }`}>
                              {t.createdByRole || "user"}
                            </span>
                          </td>
                        )}

                        {/* Current Processing Stage */}
                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-lg border text-[10.5px] ${t.currentStageId === 5
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : t.currentStageId === 4
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-blue-50 text-blue-900 border-blue-200"
                            }`}>
                            Stage {t.currentStageId}/5: {stageName}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Ticket Active View */}
        {activeTicket && (
          <div className="space-y-6">
            {/* Active Ticket Banner Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Live OMS Ticket
                    </span>
                    <span className="bg-white/10 text-slate-200 text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                      {activeTicket.loanCategory}
                    </span>
                    <span className="text-xs text-slate-300">Created on {activeTicket.createdDate}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Ticket {activeTicket.ticketId}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleCopyTicketId(activeTicket.ticketId)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy Ticket ID"
                    >
                      {copiedTicketId === activeTicket.ticketId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300 pt-1">
                    <div>
                      Applicant: <span className="font-bold text-white">{activeTicket.applicantName}</span> ({activeTicket.applicantMobile})
                    </div>
                    <div>
                      Loan Amount: <span className="font-extrabold text-emerald-400 text-sm">₹{activeTicket.loanAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      Target Banks: <span className="font-bold text-blue-300">{activeTicket.bankPartner}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex flex-col justify-between space-y-2 min-w-[240px]">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Current Processing Status</span>
                  <div className="flex items-center gap-2">
                    {activeTicket.currentStageId === 5 ? (
                      <span className="text-emerald-400 font-extrabold text-base flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Loan Disbursed
                      </span>
                    ) : activeTicket.currentStageId === 4 ? (
                      <span className="text-amber-300 font-extrabold text-base flex items-center gap-1.5">
                        <BadgeCheck className="w-5 h-5 text-amber-300" /> Sanction Approved
                      </span>
                    ) : (
                      <span className="text-blue-300 font-extrabold text-base flex items-center gap-1.5">
                        <Clock className="w-5 h-5 text-blue-400 animate-spin" /> Under Verification (Stage {activeTicket.currentStageId}/5)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Est. Response: <span className="font-bold text-white">Within 24-48 Hours</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Required Alert Box (if present) */}
            {activeTicket.actionRequiredNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Action Needed from Applicant</h4>
                  <p className="text-xs text-amber-800">{activeTicket.actionRequiredNote}</p>
                </div>
                <button
                  type="button"
                  onClick={onApplyNewLoan}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors shrink-0"
                >
                  Upload Pending Document
                </button>
              </div>
            )}

            {/* HORIZONTAL STEPPER PROGRESS TRACKER (ONLINE ORDER TRACKING STYLE) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-600" />
                    <span>Application Progress & Live Stages</span>
                  </h3>
                  <p className="text-xs text-slate-500">Ticket {activeTicket.ticketId} — Created on {activeTicket.createdDate}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTickets([...tickets])}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh Status
                </button>
              </div>

              {/* Horizontal Stepper Progress Bar */}
              <div className="relative py-6 px-2 overflow-x-auto scrollbar-none">
                <div className="min-w-[750px] relative">
                  {/* Progress Line Behind Nodes */}
                  <div className="absolute left-[8%] right-[8%] top-6 h-1.5 bg-slate-200 rounded-full z-0">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-blue-600 rounded-full transition-all duration-700"
                      style={{
                        width: `${((activeTicket.currentStageId - 1) / 4) * 100}%`
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 relative z-10">
                    {activeTicket.stages.map((stage) => {
                      const isCompleted = stage.id < activeTicket.currentStageId;
                      const isCurrent = stage.id === activeTicket.currentStageId;

                      let StageIcon = FileText;
                      if (stage.id === 1) StageIcon = FileCheck;
                      else if (stage.id === 2) StageIcon = UserCheck;
                      else if (stage.id === 3) StageIcon = Building2;
                      else if (stage.id === 4) StageIcon = BadgeCheck;
                      else if (stage.id === 5) StageIcon = CheckCircle2;

                      const formattedTime = stage.timestamp
                        ? stage.timestamp.replace(",", " | ")
                        : (isCompleted || isCurrent ? activeTicket.createdDate.replace(",", " | ") : "Pending");

                      return (
                        <div key={stage.id} className="flex flex-col items-center text-center space-y-2 group cursor-pointer">
                          {/* Node Icon */}
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all shadow-md ${isCompleted
                              ? "bg-amber-500 text-white shadow-amber-500/20"
                              : isCurrent
                                ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-blue-500/30 scale-110"
                                : "bg-white border-2 border-slate-200 text-slate-400"
                              }`}
                          >
                            <StageIcon className="w-6 h-6" />
                          </div>

                          {/* Stage Title */}
                          <h4
                            className={`text-xs font-extrabold line-clamp-2 max-w-[130px] pt-1 ${isCurrent ? "text-blue-900" : isCompleted ? "text-amber-900" : "text-slate-400"
                              }`}
                          >
                            {stage.title}
                          </h4>

                          {/* Date and Time (Formatted horizontally under each node) */}
                          <div className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{formattedTime}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* TWO COLUMN SUMMARY: Credit Officer & Document Verification Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credit Officer Info */}
              {(() => {
                const manager = getCreditManagerInfo(activeTicket.creditManager);

                if (!manager) {
                  return (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <UserCheck className="w-5 h-5 text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-900">Assigned Finheal Credit Officer</h3>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 font-extrabold text-base flex items-center justify-center shrink-0">
                          <UserCheck className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-700">Not Assigned Yet</h4>
                          <p className="text-xs text-slate-400">Waiting for Credit Officer assignment</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <PhoneCall className="w-4 h-4 text-slate-400" /> Call Officer
                        </button>
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <MessageSquare className="w-4 h-4 text-slate-400" /> WhatsApp Chat
                        </button>
                      </div>
                    </div>
                  );
                }

                const cleanPhone = manager.phone ? manager.phone.replace(/\D/g, "") : "";
                const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

                return (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">Assigned Finheal Credit Officer</h3>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shrink-0">
                        {manager.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {manager.name}
                          <BadgeCheck className="w-4 h-4 text-blue-600" />
                        </h4>
                        <p className="text-xs text-slate-500">
                          {manager.role} {manager.empCode ? `(${manager.empCode})` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={cleanPhone ? `tel:${cleanPhone}` : "#"}
                        className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                          cleanPhone
                            ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 cursor-pointer"
                            : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <PhoneCall className="w-4 h-4 text-blue-600" /> Call Officer
                      </a>
                      <a
                        href={waPhone ? `https://wa.me/${waPhone}` : "#"}
                        target={waPhone ? "_blank" : undefined}
                        rel="noreferrer"
                        className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                          waPhone
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer"
                            : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Chat
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Document Audit Checklist */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Uploaded Document Audit Checklist</h3>
                </div>

                <div className="space-y-2.5">
                  {activeTicket.docsStatus.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <span className="font-semibold text-slate-800">{doc.name}</span>
                      {doc.status === "verified" ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                        </span>
                      ) : doc.status === "resubmit_required" ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Re-upload Needed
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-200 font-semibold px-2.5 py-0.5 rounded-full">
                          Under Review
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
