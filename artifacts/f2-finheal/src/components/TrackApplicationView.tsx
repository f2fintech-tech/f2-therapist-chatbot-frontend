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
  Plus,
  History,
  Calendar,
  Activity,
  XCircle,
  Ban,
  Image as ImageIcon
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
  status: string; // Real OMS Status matching dropdown
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
  isOmsTicket?: boolean;
  documents?: { type: string; filename?: string; url: string }[];
}

export interface TicketHistoryItem {
  id: number;
  ticket_id: number;
  action: string;
  created_at: string;
  company_id: number;
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

export function formatReadableHistoryAction(action: string): string {
  if (!action) return "";
  const trimmed = action.trim();

  // Pattern: "<actor> changed File Status from <fromStatus> to <toStatus>"
  const statusMatch = trimmed.match(/^(.*?)\s+changed\s+file\s+status\s+from\s+(.+)$/i);
  if (statusMatch) {
    const rawActor = statusMatch[1].trim();
    const actor = rawActor ? rawActor.charAt(0).toUpperCase() + rawActor.slice(1) : "Operations";
    const rest = statusMatch[2].trim();

    const knownStatuses = [
      "file sent to banker - awaiting response",
      "under credit review",
      "file send to banker",
      "pendency in file",
      "to be disbursed",
      "to be approved",
      "carry forward",
      "operations",
      "forwarded",
      "disbursed",
      "approved",
      "rejected",
      "drop",
      "hold"
    ];

    let fromStatus = "";
    let toStatus = "";

    for (const st of knownStatuses) {
      const escaped = st.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\s+to\\s+(${escaped})$`, "i");
      const m = rest.match(regex);
      if (m && m.index !== undefined) {
        fromStatus = rest.substring(0, m.index).trim();
        toStatus = m[1].trim();
        break;
      }
    }

    if (!fromStatus || !toStatus) {
      const lastToIdx = rest.toLowerCase().lastIndexOf(" to ");
      if (lastToIdx > 0) {
        fromStatus = rest.substring(0, lastToIdx).trim();
        toStatus = rest.substring(lastToIdx + 4).trim();
      } else {
        fromStatus = rest;
        toStatus = "";
      }
    }

    fromStatus = fromStatus.replace(/^['"]|['"]$/g, "");
    toStatus = toStatus.replace(/^['"]|['"]$/g, "");

    if (toStatus) {
      return `${actor} changed File Status from '${fromStatus}' to '${toStatus}'`;
    }
    return `${actor} changed File Status: '${fromStatus}'`;
  }

  // Pattern: "<actor> set the expected decision date to <date>"
  const dateMatch = trimmed.match(/^(.*?)\s+set\s+the\s+expected\s+decision\s+date\s+to\s+(.+)$/i);
  if (dateMatch) {
    const rawActor = dateMatch[1].trim();
    const actor = rawActor ? rawActor.charAt(0).toUpperCase() + rawActor.slice(1) : "Operations";
    const dateVal = dateMatch[2].trim().replace(/^['"]|['"]$/g, "");
    return `${actor} set the expected decision date to '${dateVal}'`;
  }

  // Pattern: "<actor> picked the loan application"
  const pickedMatch = trimmed.match(/^(.*?)\s+picked\s+the\s+loan\s+application(.*)$/i);
  if (pickedMatch) {
    const rawActor = pickedMatch[1].trim();
    const actor = rawActor ? rawActor.charAt(0).toUpperCase() + rawActor.slice(1) : "Operations";
    return `${actor} picked the loan application${pickedMatch[2] || ""}`;
  }

  return trimmed;
}

export function renderReadableHistoryAction(action: string) {
  const formattedText = formatReadableHistoryAction(action);
  const parts = formattedText.split(/'([^']+)'/g);

  if (parts.length <= 1) {
    return <span>{formattedText}</span>;
  }

  return (
    <span>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <span
              key={i}
              className="inline-block bg-blue-50/80 text-blue-900 border border-blue-200/90 font-bold px-1.5 py-0.5 rounded text-xs mx-0.5"
            >
              '{part}'
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export const OMS_STAGE_OPTIONS = [
  "All Statuses",
  "Under Credit Review",
  "Operations",
  "Pendency In File",
  "File Send To Banker",
  "File Sent To Banker - Awaiting Response",
  "To Be Approved",
  "To Be Disbursed",
  "Approved",
  "Disbursed",
  "Carry Forward",
  "Rejected",
  "Drop",
  "Hold"
] as const;

export function normalizeOmsStatus(rawStatus: any): string {
  if (!rawStatus) return "Operations";
  const s = String(rawStatus).trim().toLowerCase();
  if (s === "under credit review") return "Under Credit Review";
  if (s === "operations") return "Operations";
  if (s.includes("pendency")) return "Pendency In File";
  if (s.includes("awaiting response")) return "File Sent To Banker - Awaiting Response";
  if (s.includes("file send") || s.includes("file sent")) return "File Send To Banker";
  if (s.includes("to be approved")) return "To Be Approved";
  if (s.includes("to be disbursed")) return "To Be Disbursed";
  if (s.includes("approved") || s.includes("sanction")) return "Approved";
  if (s.includes("disburs")) return "Disbursed";
  if (s.includes("carry forward")) return "Carry Forward";
  if (s.includes("reject")) return "Rejected";
  if (s.includes("drop")) return "Drop";
  if (s.includes("hold")) return "Hold";

  return String(rawStatus)
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function getOmsStatusBadgeColor(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "disbursed") {
    return "bg-emerald-50 text-emerald-800 border-emerald-300";
  }
  if (s === "approved" || s === "to be disbursed" || s === "to be approved") {
    return "bg-teal-50 text-teal-800 border-teal-300";
  }
  if (s === "file send to banker" || s === "file sent to banker - awaiting response") {
    return "bg-indigo-50 text-indigo-800 border-indigo-300";
  }
  if (s === "operations" || s === "under credit review") {
    return "bg-blue-50 text-blue-900 border-blue-300";
  }
  if (s === "pendency in file" || s === "hold" || s === "carry forward") {
    return "bg-amber-50 text-amber-900 border-amber-300";
  }
  if (s.includes("awaiting") || s === "submitted") {
    return "bg-amber-50 text-amber-900 border-amber-300 font-black";
  }
  if (s === "rejected" || s === "drop") {
    return "bg-rose-50 text-rose-900 border-rose-300";
  }
  return "bg-slate-100 text-slate-800 border-slate-300";
}

export interface OmsHorizontalStage {
  id: number;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const OMS_HORIZONTAL_STAGES: OmsHorizontalStage[] = [
  { id: 1, name: "Under Credit Review", shortName: "Credit Review", icon: FileCheck },
  { id: 2, name: "Operations", shortName: "Operations", icon: UserCheck },
  { id: 3, name: "Pendency In File", shortName: "Pendency", icon: AlertCircle },
  { id: 4, name: "File Send To Banker", shortName: "Send to Banker", icon: Send },
  { id: 5, name: "File Sent To Banker - Awaiting Response", shortName: "Awaiting Banker", icon: Clock },
  { id: 6, name: "To Be Approved", shortName: "To Be Approved", icon: Check },
  { id: 7, name: "To Be Disbursed", shortName: "To Be Disbursed", icon: Zap },
  { id: 8, name: "Approved", shortName: "Approved", icon: BadgeCheck },
  { id: 9, name: "Disbursed", shortName: "Disbursed", icon: CheckCircle2 },
  { id: 10, name: "Carry Forward", shortName: "Carry Forward", icon: ArrowRight },
  { id: 11, name: "Rejected", shortName: "Rejected", icon: XCircle },
  { id: 12, name: "Drop", shortName: "Drop", icon: Ban },
  { id: 13, name: "Hold", shortName: "Hold", icon: Lock }
];

export function getStageTimestamp(stageName: string, histories: TicketHistoryItem[], fallbackDate: string): string {
  const sLow = stageName.toLowerCase();
  if (!histories || histories.length === 0) return fallbackDate;

  const match = histories.find((h) => {
    const act = (h.action || "").toLowerCase();
    if (sLow === "pendency in file" && act.includes("pendency")) return true;
    if (sLow === "file send to banker" && (act.includes("file send") || act.includes("forwarded to file send"))) return true;
    if (sLow === "operations" && (act.includes("operations") || act.includes("picked"))) return true;
    if (sLow.includes("decision") && act.includes("decision")) return true;
    if (act.includes(sLow)) return true;
    return false;
  });

  if (match && match.created_at) {
    return formatDateTimeWithTime(match.created_at);
  }
  return fallbackDate;
}

function mapOmsTicketToLoanTicket(raw: any): LoanTicket {
  const rawStatus = raw.ticketStatus || raw.loanStatus || "Operations";
  const displayStatus = normalizeOmsStatus(rawStatus);

  // Map 13 OMS statuses to 5 progressive pipeline stages
  let stageId = 2; // default: operations / review
  const sLower = displayStatus.toLowerCase();
  if (sLower === "disbursed") {
    stageId = 5;
  } else if (sLower === "approved" || sLower === "to be disbursed") {
    stageId = 4;
  } else if (sLower.includes("banker") || sLower === "to be approved") {
    stageId = 3;
  } else if (sLower === "operations" || sLower === "under credit review" || sLower.includes("pendency")) {
    stageId = 2;
  } else if (raw.createdDate && !raw.ticketStatus) {
    stageId = 1;
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
    status: displayStatus,
    bankPartner: raw.applicationProvider || "Partner Bank",
    createdByRole: (
      raw.journey_type === "admin" ||
      String(raw.lead_type || raw.leadType || "").toLowerCase() === "admin" ||
      ["7318", "7317", "7316", "7315", "7313"].includes(String(raw.ticketId || raw.id || ""))
    )
      ? "admin"
      : (raw.journey_type === "employee" || String(raw.lead_type || raw.leadType || "").toLowerCase() === "employee" || Boolean(raw.appliedBy))
      ? "employee"
      : "user",
    isOmsTicket: raw.isOmsTicket !== false && !String(raw.ticketId || "").startsWith("APP-"),
    documents: Array.isArray(raw.documents) ? raw.documents : [],
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

  const storageKey = activeRole === "user"
    ? `f2_loan_tickets_user_${encodeURIComponent((userEmail || "guest").toLowerCase())}`
    : "f2_loan_tickets_admin";

  // Load tickets from localStorage or start empty
  const [tickets, setTickets] = useState<LoanTicket[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
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
      // If user portal, pass user's email to backend for safety
      const emailParam = (activeRole === "user" && userEmail) ? `&email=${encodeURIComponent(userEmail.trim())}` : "";
      const res = await fetch(`${apiBase}/loan-applications/tickets?source=finheal${emailParam}`);
      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.tickets) ? json.tickets : (json.data?.data?.results || []);

        // Double safety filter: strictly retain only tickets where applicationSource is 'finheal'
        const finhealOnly = rawList.filter(
          (t: any) => String(t.applicationSource || t.source || "").trim().toLowerCase() === "finheal"
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
  }, [userEmail, activeRole]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tickets));
    } catch (e) {
      console.warn("Could not save loan tickets to localStorage", e);
    }
  }, [tickets, storageKey]);

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Live Ticket Audit History from OMS
  const [ticketHistories, setTicketHistories] = useState<TicketHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchTicketHistory = async (ticketId: string) => {
    const cleanId = String(ticketId).replace(/\D/g, "");
    if (!cleanId) {
      setTicketHistories([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/loan-applications/tickets/${cleanId}/history`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.history)) {
          setTicketHistories(json.history);
        } else {
          setTicketHistories([]);
        }
      }
    } catch (e) {
      console.warn("[TrackApplicationView] Could not fetch ticket history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Employee & Admin Tab Filters
  const [employeeTab, setEmployeeTab] = useState<"all" | "my">("all");
  const [adminTab, setAdminTab] = useState<"all" | "user" | "staff" | "admin" | "awaiting">("all");
  const [opsFilterStage, setOpsFilterStage] = useState<string>("all");

  // Filter tickets based on active role
  const roleFilteredTickets = tickets.filter((t) => {
    if (activeRole === "user") {
      // User Portal: strictly show only user's own tickets matching their email or user ID
      const currentEmail = (userEmail || "").trim().toLowerCase();
      const ticketEmail = (t.applicantEmail || "").trim().toLowerCase();
      if (currentEmail && ticketEmail && currentEmail === ticketEmail) {
        return true;
      }
      if (userId && t.createdByUserId && t.createdByUserId === userId) {
        return true;
      }
      // Strictly never show other applicants' tickets to a regular user!
      return false;
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
      if (adminTab === "awaiting") return t.isOmsTicket === false;
      return true;
    }
  });

  // Search and status filter
  const filteredTickets = roleFilteredTickets.filter((t) => {
    // 1. OMS Status filter
    if (opsFilterStage !== "all" && opsFilterStage.trim() !== "") {
      if (t.status.toLowerCase() !== opsFilterStage.toLowerCase()) {
        return false;
      }
    }
    // 2. Search text filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticketId.toLowerCase().includes(q) ||
      t.applicantName.toLowerCase().includes(q) ||
      t.loanCategory.toLowerCase().includes(q) ||
      t.applicantMobile.includes(q) ||
      t.status.toLowerCase().includes(q)
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

  // Automatically fetch history when active ticket changes
  useEffect(() => {
    if (activeTicket?.ticketId) {
      fetchTicketHistory(activeTicket.ticketId);
    } else {
      setTicketHistories([]);
    }
  }, [activeTicket?.ticketId]);

  const handleCopyTicketId = (tid: string) => {
    navigator.clipboard.writeText(tid);
    setCopiedTicketId(tid);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };

  const handleInspectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setTimeout(() => {
      document.getElementById("ticketInspectionSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
              <ShieldCheck className="w-4 h-4" /> All Applications ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("awaiting")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${adminTab === "awaiting" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Clock className="w-4 h-4" /> Awaiting Pick ({tickets.filter(t => t.isOmsTicket === false).length})
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
              onClick={() => setAdminTab("admin")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${adminTab === "admin" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin Applied ({tickets.filter(t => t.createdByRole === "admin").length})
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
              <div className="text-2xl font-black text-slate-900">
                {tickets.filter((t) => t.isOmsTicket !== false).length} Tickets
              </div>
              <p className="text-[11px] text-slate-500">
                {tickets.filter((t) => t.isOmsTicket === false).length > 0
                  ? `${tickets.filter((t) => t.isOmsTicket === false).length} awaiting OMS employee pick`
                  : "Tracked across HDFC, SBI & ICICI hubs"}
              </p>
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

            {/* Controls: OMS Status Filter & Search Input */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={opsFilterStage}
                onChange={(e) => setOpsFilterStage(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50/80 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {OMS_STAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt === "All Statuses" ? "all" : opt}>
                    {opt}
                  </option>
                ))}
              </select>

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
                    <th className="p-3">OMS Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTickets.map((t) => {
                    const isSelected = activeTicket?.ticketId === t.ticketId;
                    const stageName = t.stages.find((s) => s.id === t.currentStageId)?.title.split("&")[0].split("Pick")[0].trim() || "In Progress";

                    return (
                      <tr
                        key={t.ticketId}
                        onClick={() => handleInspectTicket(t.ticketId)}
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

                        {/* Current OMS Status */}
                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 font-extrabold px-2.5 py-1 rounded-lg border text-[10.5px] ${getOmsStatusBadgeColor(t.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {t.status}
                          </span>
                        </td>

                        {/* Inspect / Open Details Action */}
                        <td className="p-3 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectTicket(t.ticketId);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-blue-500/20"
                                : "bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white"
                            }`}
                          >
                            <span>Open Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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
        {activeTicket && (() => {
          const currentStatusLower = (activeTicket.status || "").trim().toLowerCase();
          let effectiveStageIdx = OMS_HORIZONTAL_STAGES.findIndex(
            (s) => s.name.toLowerCase() === currentStatusLower
          );
          if (effectiveStageIdx === -1) {
            if (currentStatusLower.includes("review")) effectiveStageIdx = 0;
            else if (currentStatusLower.includes("pendency")) effectiveStageIdx = 2;
            else if (currentStatusLower.includes("banker")) effectiveStageIdx = 3;
            else if (currentStatusLower.includes("approv")) effectiveStageIdx = 7;
            else if (currentStatusLower.includes("disburs")) effectiveStageIdx = 8;
            else effectiveStageIdx = 1;
          }

          return (
            <div className="space-y-6">
              {/* Active Ticket Banner Card */}
              <div id="ticketInspectionSection" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
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
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Current OMS Status</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-extrabold text-base flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        {activeTicket.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold">
                      Stage {effectiveStageIdx + 1} of {OMS_HORIZONTAL_STAGES.length} in OMS Pipeline
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

              {/* HORIZONTAL STEPPER PROGRESS TRACKER (ALL 13 OMS STAGES) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-blue-600" />
                      <span>OMS Lifecycle & Live Horizontal Stages</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        13 Stages
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ticket #{activeTicket.ticketId} — Current: <span className="font-bold text-slate-800">{activeTicket.status}</span> (Stage {effectiveStageIdx + 1}/{OMS_HORIZONTAL_STAGES.length})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTickets([...tickets])}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh Status
                    </button>
                  </div>
                </div>

                {/* Horizontal Stepper Progress Bar for all 13 OMS Stages */}
                <div className="relative py-6 px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 pb-6">
                  <div className="min-w-[1650px] relative px-4">
                    {/* Progress Line Behind Nodes */}
                    <div className="absolute left-[45px] right-[45px] top-6 h-1.5 bg-slate-200 rounded-full z-0">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(0, Math.min(100, (effectiveStageIdx / (OMS_HORIZONTAL_STAGES.length - 1)) * 100))}%`
                        }}
                      />
                    </div>

                    <div className="flex items-start justify-between relative z-10">
                      {OMS_HORIZONTAL_STAGES.map((stage, idx) => {
                        const isCompleted = idx < effectiveStageIdx;
                        const isCurrent = idx === effectiveStageIdx;
                        const StageIcon = stage.icon;

                        // Check historical timestamp or fallback
                        const stageTime = getStageTimestamp(stage.name, ticketHistories, activeTicket.createdDate);
                        const displayTime = isCurrent || isCompleted
                          ? stageTime.replace(",", " | ")
                          : "Pending";

                        // Dynamic Node Colors
                        let nodeStyle = "bg-white border-2 border-slate-200 text-slate-400";
                        let titleColor = "text-slate-400 font-medium";
                        let timeColor = "text-slate-400";

                        if (isCompleted) {
                          nodeStyle = "bg-emerald-500 text-white shadow-md shadow-emerald-500/20";
                          titleColor = "text-slate-700 font-bold";
                          timeColor = "text-emerald-700 font-semibold";
                        } else if (isCurrent) {
                          const sName = stage.name.toLowerCase();
                          if (sName.includes("pendency") || sName.includes("hold") || sName.includes("carry")) {
                            nodeStyle = "bg-amber-500 text-white ring-4 ring-amber-100 shadow-lg shadow-amber-500/30 scale-110";
                            titleColor = "text-amber-900 font-black";
                            timeColor = "text-amber-700 font-black";
                          } else if (sName.includes("reject") || sName.includes("drop")) {
                            nodeStyle = "bg-rose-600 text-white ring-4 ring-rose-100 shadow-lg shadow-rose-500/30 scale-110";
                            titleColor = "text-rose-900 font-black";
                            timeColor = "text-rose-700 font-black";
                          } else if (sName.includes("disburs") || sName.includes("approved")) {
                            nodeStyle = "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-lg shadow-emerald-500/30 scale-110";
                            titleColor = "text-emerald-900 font-black";
                            timeColor = "text-emerald-700 font-black";
                          } else {
                            nodeStyle = "bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-500/30 scale-110";
                            titleColor = "text-blue-900 font-black";
                            timeColor = "text-blue-700 font-black";
                          }
                        }

                        return (
                          <div key={stage.id} className="w-[120px] flex flex-col items-center text-center space-y-2 group cursor-pointer shrink-0">
                            {/* Node Icon */}
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all ${nodeStyle}`}
                              title={`${stage.name} (${isCurrent ? "Current Active Stage" : isCompleted ? "Completed" : "Pending"})`}
                            >
                              <StageIcon className="w-5 h-5" />
                            </div>

                            {/* Stage Title */}
                            <h4
                              className={`text-[11px] leading-tight line-clamp-2 max-w-[115px] pt-1 ${titleColor}`}
                              title={stage.name}
                            >
                              {stage.name}
                            </h4>

                            {/* Date & Time */}
                            <div className={`text-[10px] flex items-center justify-center gap-1 ${timeColor}`}>
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[105px]">{displayTime}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            {/* REAL-TIME OMS TICKET OPS AUDIT TRAIL & HISTORY */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <History className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      Live OMS Operations Activity Log
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live Stream
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Chronological audit log of movements, banker submissions, and status changes for Ticket #{activeTicket.ticketId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchTicketHistory(activeTicket.ticketId)}
                  disabled={isLoadingHistory}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
                  title="Refresh Activity Log"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingHistory ? "animate-spin text-blue-600" : ""}`} />
                  <span>Refresh History</span>
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Fetching real-time OMS ticket audit log...</p>
                </div>
              ) : ticketHistories.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Historical Events Yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto px-4">
                    As soon as an operations executive or banker updates the status or sets an expected decision date in OMS, it will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {ticketHistories.map((hist, idx) => {
                    const isLatest = idx === 0;

                    return (
                      <div key={hist.id || idx} className="relative group">
                        {/* Node marker on vertical line */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                            isLatest
                              ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-100 scale-110"
                              : "bg-white text-slate-400 border-2 border-slate-300 group-hover:border-blue-400 group-hover:text-blue-600"
                          }`}
                        >
                          {isLatest ? (
                            <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
                          )}
                        </div>

                        {/* Content Card */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                          isLatest
                            ? "bg-blue-50/40 border-blue-200 shadow-2xs"
                            : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {isLatest && (
                                <span className="bg-emerald-600 text-white text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs tracking-wider">
                                  Current Action
                                </span>
                              )}
                              <span className="text-[10.5px] font-mono text-slate-400 font-medium">
                                Ref #{hist.id}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDateTimeWithTime(hist.created_at)}</span>
                            </div>
                          </div>

                          <div className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                            {renderReadableHistoryAction(hist.action)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

              {/* Applicant Uploaded Documents Vault */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Applicant Uploaded Documents</h3>
                      <p className="text-[11px] text-slate-500">
                        {activeTicket.documents && activeTicket.documents.length > 0
                          ? `${activeTicket.documents.length} verified files stored on AWS S3`
                          : "Files submitted by the applicant for verification"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> S3 Stored
                  </span>
                </div>

                {activeTicket.documents && activeTicket.documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                    {activeTicket.documents.map((doc, idx) => {
                      const isImage = (doc.filename || "").match(/\.(jpg|jpeg|png|webp)$/i) || (doc.type || "").toLowerCase().includes("photo");
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-blue-50/40 rounded-2xl border border-slate-200/80 hover:border-blue-200 transition-all text-xs group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isImage
                                ? "bg-purple-50 text-purple-600 border-purple-100"
                                : "bg-blue-50 text-blue-600 border-blue-100"
                            }`}>
                              {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-800 text-xs truncate">
                                {doc.type}
                              </h4>
                              <p className="text-[10.5px] text-slate-400 font-mono truncate max-w-[170px] sm:max-w-xs">
                                {doc.filename || `${doc.type.toLowerCase().replace(/ /g, "_")}.pdf`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              >
                                <span>View File</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="px-3 py-1 bg-slate-200 text-slate-600 font-semibold text-[11px] rounded-xl">
                                Uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold">No uploaded documents attached</p>
                    <p className="text-[11px] text-slate-400">Documents submitted during the application wizard will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}
