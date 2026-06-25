import { useState, useEffect, useRef } from "react";
import { useGetWellnessScore } from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from "recharts";
import type { UserProfile } from "@/utils/user";
import { listUserGoals, type Goal } from "@/utils/localGoals";
import { getConversations } from "@/lib/backendChat";
import { listLocalConversations } from "@/utils/localConversations";
import { getStoredAuthSession } from "@/utils/authSession";
import { fetchAdvisors, fetchUserProfile, isAdvisorSlotActive, fetchUserReports, type UserReport, fetchAdvisorAppointments, fetchAdminStats, fetchAllAppointments } from "@/lib/backendAuth";
import { classifyEnquiryRole } from "./AdminPortal";
import { hasSessionEnded } from "./AdvisorPanel";
import { getEffectiveAvailability } from "@/utils/availability";
import { getStoredCibilReport, type CibilReport, type CibilAccount } from "../services/cibil";


export interface DashboardProps {
  userId: string;
  userProfile: UserProfile;
  onNavigate: (page: string, conversationId?: string) => void;
  onToggleSidebar?: () => void;
  onToggleInsights?: () => void;
  isSidebarOpen?: boolean;
  isInsightsOpen?: boolean;
}

const BRAND = "#3244e6";


/* ─── Animated number hook ─── */
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!target || started.current) return;
    started.current = true;
    const steps = 60;
    const step = target / steps;
    let cur = 0;
    const iv = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(iv); }
      else setVal(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(iv);
  }, [target, duration]);
  return val;
}

/* ─── Animated bar ─── */
function AnimBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 300 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

/* ─── Radial score ring (SVG) ─── */
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 400);
    return () => clearTimeout(t);
  }, [score]);
  const offset = circ - (animated / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

/* ─── Stat card ─── */
function StatCard({ icon, label, value, sub, color, delay = 0, onClick, className }: any) {
  return (
    <div 
      className={`dashboard-card animate-fade-up flex flex-col gap-3 p-5 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-200' : ''} ${className || ''}`} 
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] shrink-0" style={{ background: `${color}18` }}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right flex-1 min-w-0">{label}</span>
      </div>
      <div>
        <div className="font-sans text-[28px] font-bold text-gray-900 leading-none tracking-tight">{value}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Loan card ─── */
function LoanCard({ icon, name, emi, remaining, total, rate, months, color, delay = 0 }: any) {
  const pct = Math.round(((total - remaining) / total) * 100);
  return (
    <div className="dashboard-card animate-fade-up p-5 flex flex-col gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px]" style={{ background: `${BRAND}10` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-gray-800 truncate">{name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{rate}% p.a. · {months} months left</div>
        </div>
        <div className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>
          {pct}% paid
        </div>
      </div>

      <AnimBar pct={pct} color={color} />

      <div className="bg-gray-50 rounded-[10px] p-3">
        <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Remaining</div>
        <div className="text-[16px] font-bold" style={{ color }}>₹{remaining.toLocaleString()}</div>
      </div>
    </div>
  );
}

/* ─── Advisor card ─── */
function AdvisorCard({ initials, name, title, rating, sessions, available, color, avatarUrl, delay = 0, onChat }: any) {
  const isOnline = available === "available" || (available && available !== "unavailable" && available !== "Not Available" && available !== "in meeting" && isAdvisorSlotActive(available));
  const isInMeeting = available === "in meeting";
  const isActionable = isOnline || isInMeeting;

  return (
    <div className="dashboard-card animate-fade-up p-5 flex flex-col gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
          style={{ background: avatarUrl ? "transparent" : `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-gray-800">{name}</div>
          <div className="text-[11px] text-gray-400">{title}</div>
        </div>
        {isOnline && (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-[10px] font-medium text-[#10b981]">
              {available === "available" ? "Online" : available}
            </span>
          </div>
        )}
        {isInMeeting && (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-medium text-indigo-600">In Meeting</span>
          </div>
        )}
      </div>
      <div className="flex gap-4 text-center">
        <div className="flex-1 bg-gray-50 rounded-[10px] p-2">
          <div className="text-[14px] font-bold text-gray-900">⭐ {rating}</div>
          <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">Rating</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-[10px] p-2">
          <div className="text-[14px] font-bold text-gray-900">{sessions}</div>
          <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">Sessions</div>
        </div>
      </div>
      <button
        data-testid={`btn-book-${initials}`}
        onClick={onChat}
        className="w-full py-2.5 rounded-[10px] text-[12px] font-semibold transition-all active:scale-95 cursor-pointer hover:-translate-y-px hover:shadow-md hover:opacity-95"
        style={{ background: BRAND, color: "#fff" }}
      >
        {isActionable ? "Book Session" : "View Profile"}
      </button>
    </div>
  );
}

/* ─── Monthly spend data ─── */
const spendData = [
  { month: "Jan", income: 85000, expenses: 62000 },
  { month: "Feb", income: 85000, expenses: 58000 },
  { month: "Mar", income: 90000, expenses: 71000 },
  { month: "Apr", income: 90000, expenses: 65000 },
  { month: "May", income: 92000, expenses: 68000 },
  { month: "Jun", income: 92000, expenses: 60000 },
];

const netWorthData = [
  { month: "Jan", worth: 420000 },
  { month: "Feb", worth: 435000 },
  { month: "Mar", worth: 428000 },
  { month: "Apr", worth: 452000 },
  { month: "May", worth: 471000 },
  { month: "Jun", worth: 498000 },
];

const spendPie = [
  { name: "Loans / EMI", value: 31200, color: BRAND },
  { name: "Living", value: 18500, color: "#10b981" },
  { name: "Food", value: 8200, color: "#f59e0b" },
  { name: "Transport", value: 4100, color: "#8b5cf6" },
  { name: "Other", value: 6000, color: "#e5e7eb" },
];

const stressData = [
  { day: "Mon", stress: 45 },
  { day: "Tue", stress: 58 },
  { day: "Wed", stress: 72 },
  { day: "Thu", stress: 50 },
  { day: "Fri", stress: 38 },
  { day: "Sat", stress: 30 },
  { day: "Sun", stress: 25 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-[10px] p-3 shadow-lg text-[11px]">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.name === "Stress Index" ? "#f43f5e" : (p.color || p.stroke) }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">
            {p.name === "Stress Index" ? "" : "₹"}{p.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Parse monthly income string/number helper ─── */
const parseMonthlyIncome = (incomeStr: string | null | undefined): number => {
  if (!incomeStr) return 87000;
  const num = parseInt(incomeStr.replace(/\D/g, ""), 10);
  if (!isNaN(num) && num > 0) return num;
  switch (incomeStr) {
    case "under-25000":
      return 20000;
    case "25000-50000":
      return 37500;
    case "50000-100000":
      return 75000;
    case "above-100000":
      return 150000;
    case "prefer-not-to-say":
    default:
      return 87000;
  }
};

/* ─── Map CIBIL accounts to Dashboard UI loan cards ─── */
const mapCibilAccountsToLoans = (accounts: CibilAccount[], brandColor: string) => {
  const colors = [brandColor, "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];
  return accounts.map((acc, index) => {
    const typeLower = (acc.type || "").toLowerCase();

    // 1. Determine icon, rate, and default tenure based on loan type
    let icon = "💼";
    let rate = 12.0;
    let defaultTenureYears = 5;

    if (typeLower.includes("home") || typeLower.includes("housing") || typeLower.includes("property")) {
      icon = "🏠";
      rate = 8.5;
      defaultTenureYears = 15;
    } else if (typeLower.includes("auto") || typeLower.includes("vehicle") || typeLower.includes("car") || typeLower.includes("two wheeler")) {
      icon = "🚗";
      rate = 9.2;
      defaultTenureYears = 5;
    } else if (typeLower.includes("card") || typeLower.includes("credit card")) {
      icon = "💳";
      rate = 36.0;
      defaultTenureYears = 1;
    } else if (typeLower.includes("personal") || typeLower.includes("consumer")) {
      icon = "💳";
      rate = 13.5;
      defaultTenureYears = 3;
    } else if (typeLower.includes("business") || typeLower.includes("commercial")) {
      icon = "💼";
      rate = 14.0;
      defaultTenureYears = 5;
    } else if (typeLower.includes("education")) {
      icon = "🎓";
      rate = 9.5;
      defaultTenureYears = 7;
    }

    // 2. Estimate remaining months based on open_date if possible
    let remainingMonths = defaultTenureYears * 12;
    if (acc.open_date) {
      try {
        const openDate = new Date(acc.open_date);
        const currentDate = new Date();
        const diffMonths = (currentDate.getFullYear() - openDate.getFullYear()) * 12 + (currentDate.getMonth() - openDate.getMonth());
        const elapsed = Math.max(0, diffMonths);
        const totalEstimatedMonths = defaultTenureYears * 12;
        remainingMonths = Math.max(1, totalEstimatedMonths - elapsed);
      } catch (e) {
        console.error("Error calculating remaining months from open_date:", e);
      }
    }

    // 3. Estimate monthly EMI
    const totalAmount = acc.sanctioned_amount || acc.outstanding_balance || 0;
    const remainingAmount = acc.outstanding_balance || 0;
    let emi = 0;

    if (typeLower.includes("card")) {
      // For credit cards, minimum payment is typically 5% of outstanding balance
      emi = Math.max(250, Math.round(remainingAmount * 0.05));
      remainingMonths = remainingAmount > 0 ? Math.ceil(remainingAmount / emi) : 0;
    } else {
      const p = totalAmount;
      const r = (rate / 12) / 100;
      const n = defaultTenureYears * 12;
      if (r > 0 && n > 0) {
        const factor = Math.pow(1 + r, n);
        emi = Math.round((p * r * factor) / (factor - 1));
      } else {
        emi = Math.round(p / n);
      }
    }

    if (emi > remainingAmount && remainingAmount > 0) {
      emi = remainingAmount;
    }

    const color = colors[index % colors.length];

    // Capitalize lender name nicely
    const displayName = acc.lender
      ? acc.lender.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
      : (acc.type || "Loan");

    return {
      icon,
      name: displayName,
      emi: emi || 0,
      remaining: remainingAmount,
      total: totalAmount || remainingAmount || 0,
      rate,
      months: remainingMonths,
      color
    };
  });
};

export default function Dashboard({
  userId,
  userProfile,
  onNavigate,
  onToggleSidebar,
  onToggleInsights,
  isSidebarOpen = false,
  isInsightsOpen = false,
}: DashboardProps) {
  const { data: wellness } = useGetWellnessScore(userId);

  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    async function loadSummary() {
      if (!userId) return;
      try {
        setLoadingSummary(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const res = await fetch(`${apiBase}/dashboard/summary?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setDashboardSummary(data);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard summary:", err);
      } finally {
        if (active) {
          setLoadingSummary(false);
        }
      }
    }
    loadSummary();

    const handleWellnessUpdate = () => {
      loadSummary();
    };
    window.addEventListener("finheal:wellness_update", handleWellnessUpdate);
    return () => {
      active = false;
      window.removeEventListener("finheal:wellness_update", handleWellnessUpdate);
    };
  }, [userId]);

  const getMemberSinceText = () => {
    try {
      const storageKey = `finheal_setup_date_${userId}`;
      let setupDateStr = localStorage.getItem(storageKey);
      if (!setupDateStr) {
        const session = getStoredAuthSession();
        setupDateStr = session?.authenticatedAt || new Date().toISOString();
        localStorage.setItem(storageKey, setupDateStr);
      }

      const setupDate = new Date(setupDateStr);
      const formatted = setupDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      });

      return `Member since ${formatted}`;
    } catch {
      return "Member since Jun 2026";
    }
  };

  const [activeTab, setActiveTab] = useState<"overview" | "loans" | "reports" | "advisor">("overview");

  const isUserAdvisor = (email?: string) => {
    if (email && ["admin@finheal.com", "admin@f2finheal.com"].includes(email.toLowerCase())) return false;
    try {
      const storedSession = localStorage.getItem("finheal-auth-session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed?.isAdvisor) return true;
      }
    } catch (e) { }

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
          )
        );
      } catch (e) { }
    }
    return false;
  };

  const authSession = getStoredAuthSession();
  const userEmail = authSession?.email;
  const isAdvisor = isUserAdvisor(userEmail);
  const isStaff = isAdvisor || (userEmail && ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase()));
  const isAdmin = userEmail === "admin@finheal.com" || userEmail === "admin@f2finheal.com";

  // Admin stats states
  const [backendStats, setBackendStats] = useState<any>(null);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [lenderList, setLenderList] = useState<any[]>([]);
  const [cibilEnquiries, setCibilEnquiries] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [cibilLoading, setCibilLoading] = useState(false);

  const [advisorAppointments, setAdvisorAppointments] = useState<any[]>([]);
  const [loadingAdvisorAppts, setLoadingAdvisorAppts] = useState(false);
  const [advisors, setAdvisors] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdvisor) return;
    let active = true;
    async function loadAdvisorAppts() {
      try {
        setLoadingAdvisorAppts(true);
        const storedSession = localStorage.getItem("finheal-auth-session");
        const parsed = storedSession ? JSON.parse(storedSession) : null;
        const advId = parsed?.f2FintechId || parsed?.userId || userId;

        if (advId) {
          const appts = await fetchAdvisorAppointments(advId);
          if (active) {
            setAdvisorAppointments(appts || []);
          }
        }
      } catch (err) {
        console.error("Failed to load advisor appointments:", err);
      } finally {
        if (active) {
          setLoadingAdvisorAppts(false);
        }
      }
    }
    loadAdvisorAppts();
    const handleAdvisorsUpdate = () => {
      loadAdvisorAppts();
    };
    window.addEventListener("finheal:advisors_update", handleAdvisorsUpdate);
    return () => {
      active = false;
      window.removeEventListener("finheal:advisors_update", handleAdvisorsUpdate);
    };
  }, [userId, isAdvisor]);

  useEffect(() => {
    if (!isAdmin) return;

    setStatsLoading(true);
    fetchAdminStats()
      .then(stats => setBackendStats(stats))
      .catch(err => console.error("Error loading admin stats in dashboard", err))
      .finally(() => setStatsLoading(false));

    fetchAllAppointments()
      .then(appts => setAllAppointments(appts))
      .catch(err => console.error("Error loading appointments in dashboard", err));

    // Fetch Lenders
    const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    fetch(`${apiBase}/lenders`)
      .then(res => res.json())
      .then(data => setLenderList(data))
      .catch(err => console.error("Error loading lenders in dashboard", err));

    // Fetch CIBIL Enquiries
    setCibilLoading(true);
    const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (configuredApiKey) {
      headers["Authorization"] = `Bearer ${configuredApiKey}`;
      headers["X-API-Key"] = configuredApiKey;
    }
    if (userId) {
      headers["X-Requester-ID"] = userId;
    }
    fetch(`${apiBase}/cibil/enquiries`, { headers })
      .then(res => res.json())
      .then(data => setCibilEnquiries(data))
      .catch(err => console.error("Error loading CIBIL enquiries in dashboard", err))
      .finally(() => setCibilLoading(false));

  }, [isAdmin]);

  // Helper to map date string to day of week
  const getDayOfWeek = (dateStr: string): string => {
    if (!dateStr) return "";
    const lower = dateStr.toLowerCase();
    if (lower.includes("mon")) return "Mon";
    if (lower.includes("tue")) return "Tue";
    if (lower.includes("wed")) return "Wed";
    if (lower.includes("thu")) return "Thu";
    if (lower.includes("fri")) return "Fri";
    if (lower.includes("sat")) return "Sat";
    if (lower.includes("sun")) return "Sun";

    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[d.getDay()];
      }
    } catch (e) { }
    return "";
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Calculate call hours dynamically (each completed appt counts as 45 mins = 0.75 hours)
  const advisorCallHoursData = daysOfWeek.map(day => {
    const appts = advisorAppointments.filter(a => {
      if (!a.completed || a.cancelled) return false;
      return getDayOfWeek(a.date) === day;
    });
    return { day, hours: appts.length * 0.75 };
  });

  const totalAdvisorCallHours = advisorCallHoursData.reduce((sum, d) => sum + d.hours, 0);

  // Group client ratings into satisfaction bands
  const ratedAppts = advisorAppointments.filter(a => typeof a.rating === "number" && a.rating > 0);
  const positiveCount = ratedAppts.filter(a => a.rating >= 4).length;
  const neutralCount = ratedAppts.filter(a => a.rating === 3).length;
  const negativeCount = ratedAppts.filter(a => a.rating > 0 && a.rating <= 2).length;

  const advisorSentimentData = [
    { name: "Positive (4-5 ★)", value: positiveCount, color: "#10b981" },
    { name: "Neutral (3 ★)", value: neutralCount, color: "#f59e0b" },
    { name: "Needs Attention (1-2 ★)", value: negativeCount, color: "#ef4444" }
  ].filter(item => item.value > 0);

  // Extract advisor nextSlot configuration
  const currentAdvisor = advisors.find(a => {
    return a.email?.toLowerCase() === userProfile?.email?.toLowerCase() ||
      a.f2FintechId?.toLowerCase() === userProfile?.email?.split("@")[0]?.toLowerCase();
  });
  const activeSlotsList = currentAdvisor?.nextSlot
    ? currentAdvisor.nextSlot.split("&").map((s: string) => s.trim())
    : [];

  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
  const [reportsList, setReportsList] = useState<UserReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [activeReportSubTab, setActiveReportSubTab] = useState<"daily" | "fortnightly" | "monthly">("daily");
  useEffect(() => {
    setLocalGoals(listUserGoals(userId));

    const handleGoalsUpdated = () => {
      setLocalGoals(listUserGoals(userId));
    };
    window.addEventListener("finheal:goals-updated", handleGoalsUpdated);
    return () => window.removeEventListener("finheal:goals-updated", handleGoalsUpdated);
  }, [userId, activeTab]);

  const [actualSessions, setActualSessions] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    async function loadSessions() {
      try {
        const nextConversations = await getConversations(userId).catch(() => []);
        const local = listLocalConversations(userId);
        const merged = [...local, ...nextConversations].reduce<any[]>((acc, cur) => {
          if (!acc.find((c) => c.id === cur.id)) acc.push(cur);
          return acc;
        }, []).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

        if (active) {
          setActualSessions(merged);
        }
      } catch (err) {
        console.error("Failed to load dashboard sessions:", err);
      }
    }
    loadSessions();
    return () => {
      active = false;
    };
  }, [userId, activeTab]);


  const [cibilReport, setCibilReport] = useState<CibilReport | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<string | null>(null);
  const [loadingCibil, setLoadingCibil] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    async function loadCibilAndProfile() {
      if (!userId) return;
      try {
        setLoadingCibil(true);
        let storedIncome: string | null = null;
        try {
          const stored = window.localStorage.getItem(`finheal_profile_extra_${userId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.monthlyIncome) {
              storedIncome = parsed.monthlyIncome;
              if (active) setMonthlyIncome(storedIncome);
            }
          }
        } catch { }

        try {
          const report = await getStoredCibilReport(userId);
          if (active) setCibilReport(report);
        } catch {
          if (active) setCibilReport(null);
        }

        try {
          const profile = await fetchUserProfile(userId);
          if (active && profile?.monthly_income) {
            setMonthlyIncome(profile.monthly_income);
          }
        } catch { }
      } finally {
        if (active) setLoadingCibil(false);
      }
    }

    loadCibilAndProfile();

    const handleWellnessUpdate = () => {
      loadCibilAndProfile();
    };
    window.addEventListener("finheal:wellness_update", handleWellnessUpdate);
    return () => {
      active = false;
      window.removeEventListener("finheal:wellness_update", handleWellnessUpdate);
    };
  }, [userId]);

  const loans = [
    { icon: "🏠", name: "Home Loan", emi: 24500, remaining: 3200000, total: 5000000, rate: 8.5, months: 156, color: BRAND },
    { icon: "🚗", name: "Car Loan", emi: 8200, remaining: 240000, total: 600000, rate: 9.2, months: 29, color: "#8b5cf6" },
    { icon: "💳", name: "Personal Loan", emi: 5800, remaining: 120000, total: 300000, rate: 13.5, months: 21, color: "#10b981" },
  ];

  const incomeVal = parseMonthlyIncome(monthlyIncome);
  const activeAccounts = cibilReport?.accounts?.filter(a => a.is_active) || [];
  const dynamicLoans = cibilReport ? mapCibilAccountsToLoans(activeAccounts, BRAND) : loans;

  const totalDebtVal = dynamicLoans.reduce((sum, l) => sum + l.remaining, 0);
  const totalEmiVal = dynamicLoans.reduce((sum, l) => sum + l.emi, 0);
  const emiPct = incomeVal > 0 ? Math.round((totalEmiVal / incomeVal) * 100) : 0;

  const score = useCountUp(wellness?.score ?? 0);
  const netWorth = useCountUp(Math.max(100000, incomeVal * 5.7), 1600);
  const totalDebt = useCountUp(totalDebtVal, 1400);

  const activeLoansCount = cibilReport ? activeAccounts.length : 3;

  const stressNudgeText = activeLoansCount > 0
    ? "Your stress peaked on Wednesday due to loan payment reminders. Try setting up auto-pay to reduce recurring mid-week anxiety."
    : "Your stress levels are moderate. Keep maintaining a healthy savings buffer to prevent unexpected financial anxiety.";

  const dynamicSpendData = spendData.map(d => {
    const scaledIncome = Math.round(incomeVal * (d.income / 92000));
    const baseExpenses = Math.round(scaledIncome * 0.4);
    const scaledExpenses = baseExpenses + totalEmiVal;
    return {
      month: d.month,
      income: scaledIncome,
      expenses: scaledExpenses
    };
  });

  const dynamicSpendPie = [
    { name: "Loans / EMI", value: totalEmiVal, color: BRAND },
    { name: "Living", value: Math.round(incomeVal * 0.25), color: "#10b981" },
    { name: "Food", value: Math.round(incomeVal * 0.12), color: "#f59e0b" },
    { name: "Transport", value: Math.round(incomeVal * 0.06), color: "#8b5cf6" },
    { name: "Other", value: Math.max(2000, incomeVal - totalEmiVal - Math.round(incomeVal * 0.43) - Math.round(incomeVal * 0.27)), color: "#e5e7eb" },
  ];

  const DEFAULT_ADVISORS = [
    { initials: "PK", name: "Priya Kapoor", title: "Debt & Savings Specialist", rating: 4.9, sessions: 312, available: true, color: "#3244e6" },
    { initials: "RS", name: "Rahul Sharma", title: "Investment Advisor", rating: 4.7, sessions: 228, available: false, color: "#8b5cf6" },
    { initials: "AN", name: "Anjali Nair", title: "Tax & Credit Expert", rating: 4.8, sessions: 185, available: true, color: "#10b981" },
  ];

  useEffect(() => {
    let active = true;
    async function loadAdvisors() {
      try {
        const list = await fetchAdvisors(userId);
        if (active) {
          setAdvisors(list);
        }
      } catch (err) {
        console.error("Failed to load dashboard advisors:", err);
        const stored = localStorage.getItem("finheal_advisors_list");
        if (stored && active) {
          try { setAdvisors(JSON.parse(stored)); } catch { }
        }
      }
    }
    loadAdvisors();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const [appointments, setAppointments] = useState<any[]>([]);
  useEffect(() => {
    const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setAppointments(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse appointments in Dashboard", e);
      }
    }
  }, [userId, activeTab]);

  const activeAppointments = appointments.filter(a => !a.completed && !a.cancelled && !hasSessionEnded(a.date, a.time));
  const pastAppointments = appointments.filter(a => a.completed || a.cancelled || hasSessionEnded(a.date, a.time));

  useEffect(() => {
    if (!userId || activeTab !== "reports") return;

    let active = true;
    async function loadReports() {
      setLoadingReports(true);
      try {
        const list = await fetchUserReports(userId);
        if (active) {
          setReportsList(list);
        }
      } catch (err) {
        console.error("Failed to load user reports:", err);
      } finally {
        if (active) {
          setLoadingReports(false);
        }
      }
    }
    loadReports();
    return () => {
      active = false;
    };
  }, [userId, activeTab]);

  // Calculate CIBIL distribution data for users
  const userCibilEnquiries = cibilEnquiries.filter(enq => classifyEnquiryRole(enq.email, enq.name, advisors) === "User");
  let excellentCount = 0; // >= 750
  let goodCount = 0;      // 700 - 749
  let fairCount = 0;      // 600 - 699
  let poorCount = 0;      // < 600

  userCibilEnquiries.forEach(enq => {
    const scoreVal = typeof enq.score === "number" ? enq.score : parseInt(enq.score, 10);
    if (isNaN(scoreVal) || scoreVal <= 0) return;
    if (scoreVal >= 750) excellentCount++;
    else if (scoreVal >= 700) goodCount++;
    else if (scoreVal >= 600) fairCount++;
    else poorCount++;
  });

  const totalValidScores = excellentCount + goodCount + fairCount + poorCount;
  const isCibilDemoData = totalValidScores === 0;

  // Fallback to beautiful mockup counts if no data exists
  const finalExcellent = isCibilDemoData ? 14 : excellentCount;
  const finalGood = isCibilDemoData ? 18 : goodCount;
  const finalFair = isCibilDemoData ? 6 : fairCount;
  const finalPoor = isCibilDemoData ? 4 : poorCount;
  const finalTotal = finalExcellent + finalGood + finalFair + finalPoor;

  const cibilDistributionData = [
    { name: "Excellent (750+)", value: finalExcellent, color: "#10b981", percent: finalTotal > 0 ? Math.round((finalExcellent / finalTotal) * 100) : 0 },
    { name: "Good (700-749)", value: finalGood, color: "#3b82f6", percent: finalTotal > 0 ? Math.round((finalGood / finalTotal) * 100) : 0 },
    { name: "Fair (600-699)", value: finalFair, color: "#f59e0b", percent: finalTotal > 0 ? Math.round((finalFair / finalTotal) * 100) : 0 },
    { name: "Poor (< 600)", value: finalPoor, color: "#ef4444", percent: finalTotal > 0 ? Math.round((finalPoor / finalTotal) * 100) : 0 }
  ];

  // Calculate sorted advisors list for Super Admin
  const sortedAdvisorsForAdmin = [...(advisors.length > 0 ? advisors : DEFAULT_ADVISORS)]
    .sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      const reviewsA = a.reviewsCount !== undefined ? a.reviewsCount : (a.sessions || 0);
      const reviewsB = b.reviewsCount !== undefined ? b.reviewsCount : (b.sessions || 0);
      return reviewsB - reviewsA;
    })
    .slice(0, 5);

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "loans", label: "Loans", icon: "💳" },
    ...(!isAdvisor && !isAdmin ? [{ key: "reports", label: "Reports", icon: "📈" }] : []),
    ...(!isAdvisor && !isAdmin ? [{ key: "advisor", label: "Advisors", icon: "🧑‍💼" }] : []),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 relative">

      {/* Fixed Sidebar Toggle Button (shows on screen < lg, overlays open sidebar) */}
      {onToggleSidebar && !isSidebarOpen && (
        <button
          onClick={onToggleSidebar}
          className="fixed left-[12px] top-[12px] flex h-[32px] w-[32px] cursor-pointer rounded-[6px] bg-gray-100 text-gray-600 items-center justify-center text-[18px] transition-all hover:bg-gray-200 lg:hidden z-50 shadow-sm"
          aria-label="Toggle Navigation"
        >
          ☰
        </button>
      )}

      {/* Fixed Insights Toggle Button (shows on screen < 2xl, overlays open insights panel) */}
      {onToggleInsights && !isInsightsOpen && (
        <button
          onClick={onToggleInsights}
          className="fixed right-[12px] top-[12px] flex h-[32px] w-[32px] cursor-pointer rounded-[6px] bg-gray-100 text-gray-600 items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden z-50 shadow-sm"
          aria-label="Toggle Insights"
        >
          ☰
        </button>
      )}

      {/* ── Hero Profile Banner ── */}
      <div className="relative overflow-hidden shrink-0" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #1e2db8 60%, #4a5cf0 100%)` }}>
        {/* decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-4 right-1/4 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />

        <div className="relative pl-[64px] pr-6 py-6 sm:pl-[76px] sm:pr-8 sm:py-7 lg:px-8 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          {/* Profile Details Group */}
          <div className="flex items-center gap-4 sm:gap-6 w-full xl:w-auto">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 border-2 border-white/30 backdrop-blur-sm flex items-center justify-center text-[20px] sm:text-[22px] font-bold text-white overflow-hidden">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.displayName} className="w-full h-full object-cover" />
                ) : (
                  userProfile.initials
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#10b981] border-2 border-white" />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-serif text-xl sm:text-2xl text-white font-bold italic truncate">{userProfile.displayName}</h1>
                <span className="text-[9px] sm:text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full tracking-wider uppercase">
                  {userProfile.userTier || "Standard"}
                </span>
              </div>
              <div className="text-white/70 text-[11px] sm:text-[12px] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {userProfile.email && (
                  <>
                    <span className="truncate">📧 {userProfile.email}</span>
                    <span>·</span>
                  </>
                )}
                <span>{getMemberSinceText()}</span>
                <span>·</span>
                <span>{actualSessions.length} sessions</span>
              </div>
            </div>
          </div>


        </div>

        {/* Tabs */}
        <div className="flex px-4 sm:px-8 pb-0 gap-1 mt-1 relative z-10 overflow-x-auto no-scrollbar max-w-full">
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          {tabs.map((t) => (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold rounded-t-[10px] transition-all shrink-0 whitespace-nowrap ${activeTab === t.key
                ? "bg-white text-primary"
                : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === "overview" && (
          isAdmin ? (
            <div className="flex flex-col gap-6">
              {/* Metrics Cards Grid */}
              <div className="grid gap-[12px] grid-cols-2 md:grid-cols-3 animate-fade-up">
                <StatCard icon="👥" label="Total Platform Users" value={statsLoading ? "..." : String(backendStats?.total_users ?? 0)} sub="Total platform accounts" color={BRAND} delay={0} />
                <StatCard icon="👤" label="Registered Members" value={statsLoading ? "..." : String(backendStats?.registered_users ?? 0)} sub="Signed-up user accounts" color={BRAND} delay={80} />
                <StatCard icon="📈" label="Conversion Rate" value={statsLoading || !backendStats?.total_users ? "0%" : `${Math.round((backendStats.registered_users / backendStats.total_users) * 100)}%`} sub="Guests to members" color="#10b981" delay={160} />
                <StatCard icon="💬" label="Active Conversations" value={statsLoading ? "..." : String(backendStats?.total_conversations ?? 0)} sub="Total AI chats started" color="#6366f1" delay={240} />
                <StatCard icon="📑" label="User CIBIL Enquiries" value={cibilLoading ? "..." : String(cibilEnquiries.filter(enq => classifyEnquiryRole(enq.email, enq.name, advisors) === "User").length)} sub="CIBIL reports generated" color="#f43f5e" delay={320} />
                <StatCard icon="📞" label="Scheduled Calls" value={String(allAppointments.filter(a => !a.completed && !a.cancelled).length)} sub="Active consultations" color="#3b82f6" delay={400} />
                <StatCard icon="✅" label="Completed Calls" value={String(allAppointments.filter(a => a.completed).length)} sub="Concluded consultations" color="#10b981" delay={480} />
                <StatCard icon="🧑‍💼" label="Expert Advisors" value={String(advisors.length)} sub="Listed expert professionals" color="#d97706" delay={560} />
                <StatCard icon="🏦" label="Loan Products" value={String(lenderList.length)} sub="Listed lender offerings" color="#0d9488" delay={640} />
              </div>

              {/* Additional Visual Panel */}
              <div className="grid gap-[18px] md:grid-cols-2">
                {/* Platform Wellness Summary Card */}
                <div className="border border-[#d4d8fa] bg-gradient-to-br from-[#f8f9ff] to-[#f0f2ff] rounded-[20px] p-[20px] shadow-xs animate-fade-up" style={{ animationDelay: "100ms" }}>
                  <h3 className="text-[14px] font-bold text-gray-900 mb-[4px] flex items-center gap-[6px]">
                    🏆 Platform Wellness Average
                  </h3>
                  <p className="text-[12px] text-gray-500 mb-[16px]">Current aggregated score based on all registered user tests.</p>

                  <div className="flex items-end gap-[10px] mb-[12px]">
                    <div className="text-[54px] font-serif font-bold text-primary leading-none">68</div>
                    <div className="text-[16px] text-gray-400 pb-[6px]">/ 100</div>
                    <span className="mb-[6px] ml-[8px] bg-emerald-100 text-emerald-800 text-[10px] font-bold px-[8px] py-[3px] rounded-full uppercase tracking-wider">
                      Good Health
                    </span>
                  </div>

                  <div className="h-[6px] bg-gray-200 rounded-[6px] overflow-hidden mb-[16px]">
                    <div className="h-full bg-primary" style={{ width: "68%" }} />
                  </div>

                  <div className="grid grid-cols-3 gap-[10px] text-[11px] text-gray-600 text-center">
                    <div className="bg-white border border-gray-100 rounded-[10px] p-[8px]">
                      <div className="text-gray-400 font-medium">Tests Done</div>
                      <div className="text-gray-800 font-bold mt-[2px]">34 active</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-[10px] p-[8px]">
                      <div className="text-gray-400 font-medium">Top Category</div>
                      <div className="text-gray-800 font-bold mt-[2px]">Money IQ</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-[10px] p-[8px]">
                      <div className="text-gray-400 font-medium">Risk Mix</div>
                      <div className="text-gray-800 font-bold mt-[2px]">Low (12%)</div>
                    </div>
                  </div>
                </div>

                {/* CIBIL Score Band Distribution (Donut Chart) */}
                <div className="border border-gray-200 bg-white rounded-[20px] p-[20px] shadow-xs flex flex-col justify-between animate-fade-up" style={{ animationDelay: "150ms" }}>
                  <div>
                    <div className="flex items-center justify-between mb-[4px]">
                      <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-[6px]">
                        📊 CIBIL Score Band Distribution
                      </h3>
                      {isCibilDemoData && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-[6px] py-[2px] rounded-[6px] uppercase tracking-wider">
                          Demo Data
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 mb-[12px]">Credit health breakdown of platform user base.</p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Donut Chart */}
                      <div className="relative flex items-center justify-center w-[130px] h-[130px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={cibilDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={42}
                              outerRadius={58}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {cibilDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white border border-gray-150 rounded-[10px] p-2.5 shadow-md text-[10.5px]">
                                      <div className="font-bold" style={{ color: data.color }}>{data.name}</div>
                                      <div className="text-gray-500 mt-0.5">
                                        Users: <span className="text-gray-900 font-bold">{data.value}</span> ({data.percent}%)
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-[18px] font-bold text-gray-900 leading-none">{totalValidScores}</span>
                          <span className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wide mt-0.5">Reports</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex-1 w-full space-y-1.5">
                        {cibilDistributionData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-[11px] border-b border-gray-50 pb-1.5 last:border-b-0 last:pb-0">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: item.color }} />
                              <span className="text-gray-600 font-medium">{item.name}</span>
                            </span>
                            <span className="font-bold text-gray-800">
                              {item.value} <span className="text-gray-400 font-normal">({item.percent}%)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-[12px] text-left text-[10.5px] text-gray-400 border-t border-gray-50 mt-[12px]">
                    {isCibilDemoData 
                      ? "Score distribution will update automatically as platform users check their CIBIL score."
                      : "Aggregated score stats filtered to show customer enquiries only."}
                  </div>
                </div>
              </div>

              {/* Resources & Performance Panel */}
              <div className="grid gap-[18px] md:grid-cols-[1fr_2fr]">
                {/* Catalog Distribution summary */}
                <div className="border border-gray-200 bg-white rounded-[20px] p-[20px] shadow-xs flex flex-col justify-between animate-fade-up" style={{ animationDelay: "200ms" }}>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 mb-[4px]">
                      📚 Catalog Content Distribution
                    </h3>
                    <p className="text-[12px] text-gray-500 mb-[16px]">Summary breakdown of all dynamic libraries managed by Admin.</p>
                    
                    <div className="space-y-[10px]">
                      <div className="flex items-center justify-between text-[13px] border-b border-gray-50 pb-[8px]">
                        <span className="text-gray-600 flex items-center gap-[6px]">📄 Educational Articles</span>
                        <span className="font-bold text-gray-800">8 active</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] border-b border-gray-50 pb-[8px]">
                        <span className="text-gray-600 flex items-center gap-[6px]">🎥 Educational Videos</span>
                        <span className="font-bold text-gray-800">4 active</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] border-b border-gray-50 pb-[8px]">
                        <span className="text-gray-600 flex items-center gap-[6px]">📋 Financial Health Tests</span>
                        <span className="font-bold text-gray-800">5 active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-[16px] text-left text-[11px] text-gray-400 border-t border-gray-50 mt-[12px]">
                    Admins can manage these contents through the Super Admin Portal tab.
                  </div>
                </div>

                {/* Top Performing Advisors */}
                <div className="border border-gray-200 bg-white rounded-[20px] p-[20px] shadow-xs flex flex-col justify-between animate-fade-up" style={{ animationDelay: "250ms" }}>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 mb-[4px] flex items-center gap-[6px]">
                      ⭐ Top Performing Advisors
                    </h3>
                    <p className="text-[12px] text-gray-500 mb-[16px]">Active advisors ranked by average user ratings and reviews count.</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px] text-left text-gray-500">
                        <thead className="text-[10px] text-gray-450 uppercase bg-gray-50/50 rounded-lg">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-bold rounded-l-lg">Rank</th>
                            <th scope="col" className="px-3 py-2 font-bold">Advisor</th>
                            <th scope="col" className="px-3 py-2 font-bold text-center">Rating</th>
                            <th scope="col" className="px-3 py-2 font-bold text-center">Reviews</th>
                            <th scope="col" className="px-3 py-2 font-bold rounded-r-lg text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {sortedAdvisorsForAdmin.map((adv, idx) => {
                            const getInitials = (n: string) => {
                              if (!n) return "";
                              const parts = n.trim().split(/\s+/);
                              if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                              return parts[0][0].toUpperCase();
                            };

                            const initials = adv.initials || getInitials(adv.name);
                            const title = adv.designation || adv.title || "Advisor";
                            const rating = adv.rating || 4.8;
                            const reviews = adv.reviewsCount !== undefined ? adv.reviewsCount : (adv.sessions || 15);
                            
                            // Determine status
                            const dbStatus = adv.availability || (adv.available ? "available" : "unavailable");
                            const status = adv.nextSlot ? getEffectiveAvailability(dbStatus, adv.nextSlot) : dbStatus;
                            const isOnline = status === "available" || (status && status !== "unavailable" && status !== "Not Available" && status !== "in meeting" && isAdvisorSlotActive(status));
                            const isInMeeting = status === "in meeting";

                            const colors = ["#3244e6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];
                            const color = adv.color || colors[idx % colors.length];

                            return (
                              <tr key={adv.id || adv.f2FintechId || adv.name} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-3 py-2.5 font-bold text-gray-900">
                                  #{idx + 1}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                      style={{ background: adv.avatarUrl ? "transparent" : `linear-gradient(135deg, ${color}, ${color}cc)` }}>
                                      {adv.avatarUrl ? (
                                        <img src={adv.avatarUrl} alt={adv.name} className="w-full h-full object-cover" />
                                      ) : (
                                        initials
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-gray-900 truncate max-w-[150px]">{adv.name}</div>
                                      <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{title}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-gray-850">
                                  ★ {rating.toFixed(1)}
                                </td>
                                <td className="px-3 py-2.5 text-center font-semibold text-gray-600">
                                  {reviews}
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  {isOnline ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Online
                                    </span>
                                  ) : isInMeeting ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                      Meeting
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100">
                                      Offline
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-[12px] text-left text-[11px] text-gray-400 border-t border-gray-50 mt-[16px]">
                    Admins can manage advisors and ratings in the Super Admin Portal.
                  </div>
                </div>
              </div>
            </div>
          ) : isAdvisor ? (
            <div className="flex flex-col gap-6">
              {/* Advisor KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="🧑‍💼" label="Total Booked Calls" value={String(advisorAppointments.length)} sub="All-time sessions" color={BRAND} delay={0} />
                <StatCard icon="📅" label="Upcoming Scheduled Calls" value={String(advisorAppointments.filter(a => !a.completed && !a.cancelled).length)} sub="Upcoming consultations" color="#10b981" delay={80} />
                <StatCard icon="🔄" label="Rescheduled Calls" value={String(advisorAppointments.filter(a => {
                  const rescheduledIds = JSON.parse(localStorage.getItem("finheal_rescheduled_appts") || "[]");
                  return rescheduledIds.includes(a.id);
                }).length)} sub="Rescheduled consultations" color="#f59e0b" delay={160} />
                <StatCard icon="🚫" label="Cancelled Calls" value={String(advisorAppointments.filter(a => a.cancelled).length)} sub="Cancelled sessions" color="#ef4444" delay={240} />
              </div>

              {/* Advisor Visualizations & Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Weekly Call Hours dedicated */}
                <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-3 p-5" style={{ animationDelay: "80ms" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[13px] font-bold text-gray-800">Productivity: Call Hours Dedicated</div>
                      <div className="text-[11px] text-gray-400">Hours spent in completed calls per day (45 min / session)</div>
                    </div>
                    {totalAdvisorCallHours > 0 && (
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Weekly Hours</span>
                        <div className="text-[18px] font-bold text-primary">{totalAdvisorCallHours.toFixed(1)}h</div>
                      </div>
                    )}
                  </div>

                  {totalAdvisorCallHours === 0 ? (
                    <div className="text-center py-10 bg-gray-50 border border-dashed rounded-[16px] flex flex-col items-center justify-center h-[200px]">
                      <p className="text-[28px]">📊</p>
                      <p className="text-[12px] font-bold text-gray-700 mt-2">No Call Hours Dedicated Yet</p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-[280px]">Weekly hours update automatically as you host and complete consultations with clients.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={advisorCallHoursData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                        <Tooltip formatter={(v: any) => [`${v}h`, "Time Spent"]} />
                        <Bar dataKey="hours" fill={BRAND} radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Client Sentiment and Availability Slots */}
                <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-2 p-5 flex flex-col justify-between" style={{ animationDelay: "120ms" }}>
                  <div>
                    <div className="text-[13px] font-bold text-gray-800 mb-0.5">Diagnostics & Availability</div>
                    <div className="text-[11px] text-gray-400 mb-4">Client satisfaction reviews and scheduled slots</div>

                    {/* Client Sentiment */}
                    <div className="mb-4">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-2">
                        🌟 Client Satisfaction Distribution
                      </span>
                      {advisorSentimentData.length === 0 ? (
                        <div className="text-center py-5 bg-gray-50/50 border border-dashed border-gray-150 rounded-[12px] text-[11px] text-gray-400">
                          No feedback reviews or ratings recorded yet.
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width="40%" height={80}>
                            <PieChart>
                              <Pie data={advisorSentimentData} cx="50%" cy="50%" innerRadius={18} outerRadius={30} paddingAngle={2} dataKey="value">
                                {advisorSentimentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                              </Pie>
                              <Tooltip formatter={(v: any) => [`${v} calls`, "Sessions"]} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-1.5">
                            {advisorSentimentData.map((item) => (
                              <div key={item.name} className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: item.color }} />
                                  <span className="text-gray-500">{item.name}</span>
                                </span>
                                <span className="font-bold text-gray-700">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Availability Slots */}
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-2">
                      🕒 Next Scheduled Slots
                    </span>
                    {activeSlotsList.length === 0 ? (
                      <div className="text-[11px] text-gray-400 italic">
                        No active slots scheduled. Set slots in the workspace.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                        {activeSlotsList.map((slot: string, idx: number) => (
                          <span key={idx} className="text-[9.5px] font-bold bg-[#eef0fd] text-primary px-2.5 py-1 rounded-[8px] border border-[#dde0f8]">
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advisor Schedule & History row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Schedule */}
                <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "100ms" }}>
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                      📅 Upcoming Scheduled Consultations ({advisorAppointments.filter(a => !a.completed && !a.cancelled).length})
                    </h3>
                  </div>

                  {advisorAppointments.filter(a => !a.completed && !a.cancelled).length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 border border-dashed rounded-[16px]">
                      <p className="text-[24px]">🕒</p>
                      <p className="text-[11px] text-gray-400 mt-[4px]">No upcoming scheduled sessions.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                      {advisorAppointments.filter(a => !a.completed && !a.cancelled).map((appt, idx) => (
                        <div key={appt.id || idx} className="border border-gray-200 bg-white p-4 rounded-[16px] flex flex-col gap-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="text-[12px] font-bold text-gray-900">
                                Client: <span className="text-primary">{appt.clientName ? `${appt.clientName} (${appt.clientEmail})` : (appt.clientEmail || appt.userId)}</span>
                              </div>
                              {appt.notes && (
                                <p className="text-[11px] text-gray-500 mt-1 italic">&quot;{appt.notes}&quot;</p>
                              )}
                            </div>
                            <div className="text-right sm:text-right text-[11.5px] font-semibold text-gray-750">
                              <div className="text-primary font-bold">{appt.date}</div>
                              <div className="text-gray-500">{appt.time} (IST)</div>
                            </div>
                          </div>
                          {appt.meetUrl && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-1">
                              <a href={appt.meetUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline font-bold truncate max-w-[200px]">
                                {appt.meetUrl}
                              </a>
                              <a href={appt.meetUrl} target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-opacity-95 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-[8px] transition-all">
                                Join Call
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Consultations History */}
                <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "150ms" }}>
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                      📜 Past Consultations History ({advisorAppointments.filter(a => a.completed || a.cancelled).length})
                    </h3>
                  </div>

                  {advisorAppointments.filter(a => a.completed || a.cancelled).length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 border border-dashed rounded-[16px]">
                      <p className="text-[24px]">📜</p>
                      <p className="text-[11px] text-gray-400 mt-[4px]">No past sessions recorded.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                      {advisorAppointments.filter(a => a.completed || a.cancelled).map((appt, idx) => (
                        <div key={appt.id || idx} className="border border-gray-150 bg-gray-50/30 p-4 rounded-[16px] flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="text-[12px] font-bold text-gray-700">
                                Client: <span className="text-gray-900 font-semibold">{appt.clientName ? `${appt.clientName} (${appt.clientEmail})` : (appt.clientEmail || appt.userId)}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${appt.cancelled ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                  {appt.cancelled ? "Cancelled" : "Completed"}
                                </span>
                                {appt.rating && (
                                  <span className="text-amber-500 text-[11px] font-bold">
                                    {"★".repeat(appt.rating)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-[11px] text-gray-500">
                              <div className="font-semibold">{appt.date}</div>
                              <div>{appt.time}</div>
                            </div>
                          </div>
                          {appt.feedback && (
                            <div className="mt-2.5">
                              <span className={`text-[9.5px] font-extrabold uppercase tracking-wider block mb-1 ${appt.cancelled ? 'text-rose-800' : 'text-gray-400'}`}>
                                {appt.cancelled ? "🚫 Cancellation Reason" : "💬 Client Feedback"}
                              </span>
                              <p className={`text-[11px] italic p-2 rounded-lg border leading-relaxed ${appt.cancelled ? 'text-rose-700 bg-rose-50/30 border-rose-100/50' : 'text-gray-500 bg-white border-gray-100'}`}>
                                &quot;{appt.feedback}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 animate-pulse">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
                  <p className="text-[12px] text-gray-500 font-semibold">Generating your dashboard telemetry...</p>
                </div>
              ) : (
                <>
                  {/* KPI row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Credit Health Card */}
                    <StatCard 
                      icon="🛡️" 
                      label="Credit Health" 
                      value={dashboardSummary?.credit_score?.score ? String(dashboardSummary.credit_score.score) : "No Score"} 
                      sub={dashboardSummary?.credit_score?.score ? `Bureau: ${dashboardSummary.credit_score.bureau.toUpperCase()} · Synced` : "Check your CIBIL score →"} 
                      color={dashboardSummary?.credit_score?.score ? (dashboardSummary.credit_score.score >= 750 ? "#10b981" : dashboardSummary.credit_score.score >= 700 ? BRAND : "#f59e0b") : "#ef4444"} 
                      delay={0} 
                      onClick={() => onNavigate("Eligibility & CIBIL Checker")}
                    />
                    
                    {/* Advisor Call Card */}
                    <StatCard 
                      icon="📅" 
                      label="Advisor Call" 
                      value={dashboardSummary?.next_appointment ? dashboardSummary.next_appointment.advisor_name : "No Bookings"} 
                      sub={dashboardSummary?.next_appointment ? `${dashboardSummary.next_appointment.date} · ${dashboardSummary.next_appointment.time}` : "Schedule a call now →"} 
                      color={dashboardSummary?.next_appointment ? "#10b981" : "#f59e0b"} 
                      delay={80} 
                      onClick={dashboardSummary?.next_appointment ? () => { if (dashboardSummary.next_appointment.meet_url) window.open(dashboardSummary.next_appointment.meet_url, "_blank"); } : () => onNavigate("Talk to an Advisor")}
                    />
                    
                    {/* Financial Health Tests Card */}
                    <StatCard 
                      icon="🧭" 
                      label="Tests Attempted" 
                      value={String(dashboardSummary?.tests?.total_attempted ?? 0)} 
                      sub={dashboardSummary?.tests?.scores?.[0] ? `Last: ${dashboardSummary.tests.scores[0].title} (${dashboardSummary.tests.scores[0].score}%)` : "Take a financial quiz →"} 
                      color={BRAND} 
                      delay={160} 
                      onClick={() => onNavigate("Financial Health Test")}
                    />
                    
                    {/* Educational Resources Card */}
                    <StatCard 
                      icon="📚" 
                      label="Content Consumed" 
                      value={String((dashboardSummary?.education?.articles_read_count ?? 0) + (dashboardSummary?.education?.videos_watched_count ?? 0))} 
                      sub={`${dashboardSummary?.education?.articles_read_count ?? 0} articles · ${dashboardSummary?.education?.videos_watched_count ?? 0} videos`} 
                      color="#8b5cf6" 
                      delay={240} 
                      onClick={() => onNavigate("Financial Education")}
                    />
                  </div>

                  {/* Chart row - Financial Health Tests */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Test Scores Bar Chart */}
                    <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-3 p-5" style={{ animationDelay: "100ms" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-[13px] font-semibold text-gray-800">Financial Health Quiz Performance</div>
                          <div className="text-[11px] text-gray-400">Score percentage for each attempted test category</div>
                        </div>
                        <div className="flex gap-3 text-[10px]">
                          <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3244e6]" />Score (%)</span>
                        </div>
                      </div>
                      
                      {(!dashboardSummary?.tests?.scores || dashboardSummary.tests.scores.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-[180px] bg-gray-50/50 border border-dashed rounded-[16px] text-center p-4">
                          <p className="text-[24px] mb-2">🧭</p>
                          <p className="text-[12px] font-bold text-gray-700">No Test Data Available</p>
                          <p className="text-[11px] text-gray-400 max-w-[280px] mt-1">Take your first Financial Health Test to view your score breakdown and personal benchmarks here.</p>
                          <button
                            onClick={() => onNavigate("Financial Health Test")}
                            className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-white bg-primary rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            Start Test Now
                          </button>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={[...dashboardSummary.tests.scores].reverse()} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="title" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <Tooltip formatter={(v: any) => [`${v}%`, "Score"]} />
                            <Bar dataKey="score" fill={BRAND} radius={[4, 4, 0, 0]} barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Test Suggestions Card */}
                    <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-2 p-5 flex flex-col justify-between" style={{ animationDelay: "150ms" }}>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800 mb-0.5">Test Results & Insights</div>
                        <div className="text-[11px] text-gray-400 mb-3">
                          {dashboardSummary?.tests?.total_attempted ?? 0} total test(s) completed
                        </div>
                        
                        <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1 scrollbar-thin">
                          {(!dashboardSummary?.tests?.scores || dashboardSummary.tests.scores.length === 0) ? (
                            <div className="text-[11px] text-gray-400 italic py-2 text-center">No completed tests record found.</div>
                          ) : (
                            dashboardSummary.tests.scores.map((item: any) => {
                              const badgeColor = item.score >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : item.score >= 50 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100";
                              return (
                                <div key={item.test_id} className="flex items-center justify-between text-[11px] border-b border-gray-50 pb-1.5 last:border-b-0 last:pb-0">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <div className="font-semibold text-gray-700 truncate">{item.title}</div>
                                    <div className="text-[9px] text-gray-455">{item.date}</div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
                                    {item.score}%
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-[10px] p-3 text-[10.5px] text-[#92400e] leading-relaxed">
                          <strong>💡 Test Nudge:</strong> {dashboardSummary?.tests?.nudge_message}
                        </div>
                        
                        {dashboardSummary?.tests?.recommended_test_id && (
                          <button
                            onClick={() => onNavigate("Financial Health Test")}
                            className="w-full mt-3 py-2 rounded-[10px] text-[11px] font-semibold text-white bg-primary hover:opacity-95 transition-all active:scale-95 text-center cursor-pointer"
                          >
                            Attempt Recommended Quiz →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stress level chart row - Chat Telemetry Mood trends & Education */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Daily Stress Level line chart */}
                    <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-3 p-5" style={{ animationDelay: "200ms" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-[13px] font-semibold text-gray-800">Daily Stress Level</div>
                          <div className="text-[11px] text-gray-400">Last 7 days · Stress Index</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #f43f5e, #6366f1)" }} />
                          <span className="text-gray-500">Stress Index (0-100)</span>
                        </div>
                      </div>
                      
                      {(!dashboardSummary?.mood_trends || dashboardSummary.mood_trends.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-[180px] bg-gray-50/50 border border-dashed rounded-[16px] text-center p-4">
                          <p className="text-[24px] mb-2">💬</p>
                          <p className="text-[12px] font-bold text-gray-700">No Chat Logged Moods</p>
                          <p className="text-[11px] text-gray-400 max-w-[280px] mt-1">Start chatting with FinHeal, your AI Therapist, to generate live emotional and wellness insights.</p>
                          <button
                            onClick={() => onNavigate("Talk to FinHeal")}
                            className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-white bg-primary rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            Start Chatting
                          </button>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={dashboardSummary.mood_trends} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                            <defs>
                              <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip content={({ active, payload, label }: any) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div className="bg-white border border-gray-100 rounded-[10px] p-2.5 shadow-lg text-[11px]">
                                    <div className="font-semibold text-gray-700 mb-1">{label}</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                                      <span className="text-gray-500">Stress:</span>
                                      <span className="font-semibold text-gray-800">{payload[0].value}%</span>
                                    </div>
                                  </div>
                                );
                              }} />
                            <Line type="monotone" dataKey="stress" name="Stress Index" stroke="url(#stressGrad)" strokeWidth={3} dot={{ fill: "#f43f5e", r: 4, strokeWidth: 1 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Educational Consumption Suggestions Card */}
                    <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-2 p-5 flex flex-col justify-between" style={{ animationDelay: "250ms" }}>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800 mb-0.5">Educational Insights</div>
                        <div className="text-[11px] text-gray-400 mb-4">Consumption by topic category</div>
                        
                        <div className="space-y-3">
                          {["Loans", "Credit", "Business"].map((cat) => {
                            const count = dashboardSummary?.education?.category_breakdown?.[cat] ?? 0;
                            // Calculate simple progress width representation
                            const maxVal = Math.max(1, ...Object.values(dashboardSummary?.education?.category_breakdown ?? {}).map((v: any) => typeof v === 'number' ? v : 0));
                            const pct = Math.round((count / maxVal) * 100);
                            const colorsMap: Record<string, string> = { Loans: BRAND, Credit: "#10b981", Business: "#f59e0b" };
                            return (
                              <div key={cat}>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-gray-500 font-medium">{cat} Articles & Videos</span>
                                  <span className="font-bold text-gray-700">{count} consumed</span>
                                </div>
                                <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: colorsMap[cat] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-4 border-t border-gray-50 pt-3">
                        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] p-3 text-[10.5px] text-[#1e40af] leading-relaxed">
                          <strong>📚 Suggestion:</strong> {dashboardSummary?.education?.nudge_message}
                        </div>
                        
                        {dashboardSummary?.education?.recommended_content_id && (
                          <button
                            onClick={() => onNavigate("Financial Education")}
                            className="w-full mt-3 py-2 rounded-[10px] text-[11px] font-semibold text-white bg-primary hover:opacity-95 transition-all active:scale-95 text-center cursor-pointer"
                          >
                            View Recommended Guide →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Goals overview */}
              {!isStaff && (
                <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "300ms" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[13px] font-semibold text-gray-800">Financial Goals</div>
                      <div className="text-[11px] text-gray-400">{localGoals.length} active goals</div>
                    </div>
                    <button
                      data-testid="btn-view-all-goals"
                      onClick={() => onNavigate("Financial Goals")}
                      className="text-[11px] font-semibold text-primary px-3 py-1.5 rounded-[8px] bg-[#eef0fd] hover:bg-[#dde0f8] transition-colors cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {localGoals.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-[12px] text-gray-400">No active goals. Add a new goal in the sidebar to track it here!</p>
                      </div>
                    ) : (
                      localGoals.map((g: any, i: number) => {
                        const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
                        const color = g.color;
                        return (
                          <div key={g.id} className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-[8px] bg-[#eef0fd] flex items-center justify-center text-[15px] shrink-0">{g.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[12px] font-semibold text-gray-750">{g.name}</span>
                                <span className="text-[11px] font-semibold" style={{ color }}>{pct}%</span>
                              </div>
                              <AnimBar pct={pct} color={color} delay={i * 150} />
                              <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-gray-400">{g.currency}{g.currentAmount.toLocaleString()} saved</span>
                                <span className="text-[10px] text-gray-400">Target: {g.currency}{g.targetAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Recent sessions */}
              <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "350ms" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[13px] font-semibold text-gray-800">Recent Sessions</div>
                  <button
                    data-testid="btn-start-chat"
                    onClick={() => onNavigate("Talk to FinHeal")}
                    className="text-[11px] font-semibold text-white px-3 py-1.5 rounded-[8px] transition-all hover:-translate-y-px"
                    style={{ background: BRAND }}
                  >
                    + New Chat
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {actualSessions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[12px] text-gray-400">No recent sessions. Start a new chat to get financial advice!</p>
                    </div>
                  ) : (
                    actualSessions.slice(0, 5).map((s: any) => {
                      const dotColor = s.moodColor === "green" ? "#10b981" : s.moodColor === "amber" ? "#f59e0b" : BRAND;
                      const dateVal = s.updatedAt || s.createdAt;
                      return (
                        <div
                          key={s.id}
                          onClick={() => onNavigate("Talk to FinHeal", s.id)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                          <div className="flex-1 text-[12px] text-gray-650 truncate group-hover:text-gray-900 transition-colors">{s.title}</div>
                          <div className="text-[10px] text-gray-400 shrink-0">
                            {dateVal ? new Date(dateVal).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* ══ LOANS TAB ══ */}
        {activeTab === "loans" && (
          <div className="flex flex-col gap-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard icon="💰" label="Total Outstanding" value={`₹${(totalDebtVal / 100000).toFixed(1)}L`} sub={`Across ${activeLoansCount} loan${activeLoansCount === 1 ? "" : "s"}`} color="#ef4444" delay={0} />
              <StatCard icon="📁" label="Active Loans" value={`${activeLoansCount} Account${activeLoansCount === 1 ? "" : "s"}`} sub="Sync'd from credit report" color="#f59e0b" delay={80} />
            </div>

            {/* Loan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dynamicLoans.length === 0 ? (
                <div className="col-span-full text-center py-10 bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
                  <p className="text-[20px] mb-1">🎉</p>
                  <p className="text-[12px] font-semibold text-gray-750">No Active Loans</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[280px] mx-auto">
                    Your synced credit profile shows no outstanding loan accounts. Great job!
                  </p>
                </div>
              ) : (
                dynamicLoans.map((l, i) => <LoanCard key={`${l.name}-${i}`} {...l} delay={i * 100} />)
              )}
            </div>

          </div>
        )}

        {/* ══ REPORTS TAB ══ */}
        {activeTab === "reports" && (
          <div className="flex flex-col gap-6">

            {/* Personalized Wellness & Therapy Reports */}
            <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "0ms" }}>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-[14px] font-bold text-gray-800">💡 Personalized Wellness & Therapy Reports</h3>
                  <p className="text-[11px] text-gray-400">Generated automatically from your chat logs and activities</p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                  {(["daily", "fortnightly", "monthly"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveReportSubTab(type)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${activeReportSubTab === type
                        ? "bg-white text-primary shadow-xs"
                        : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                      {type === "daily" ? "Daily" : type === "fortnightly" ? "15-Day" : "30-Day"}
                    </button>
                  ))}
                </div>
              </div>

              {loadingReports && reportsList.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-[12px] text-gray-400 animate-pulse">Loading wellness reports...</div>
                </div>
              ) : (() => {
                const activeReport = reportsList.find((r) => r.reportType === activeReportSubTab);
                if (!activeReport) {
                  return (
                    <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <div className="text-[32px] mb-2">🎯</div>
                      <h4 className="text-[13px] font-bold text-gray-700">No {activeReportSubTab === "daily" ? "Daily" : activeReportSubTab === "fortnightly" ? "15-Day" : "30-Day"} Report Yet</h4>
                      <p className="text-[11px] text-gray-400 max-w-[320px] mx-auto mt-1 leading-relaxed">
                        To unlock this report, continue talking to your AI Therapist or use tools like CIBIL checker, tests, and calculators. Reports are pre-generated automatically at the end of the period.
                      </p>
                    </div>
                  );
                }

                // Render active report content
                return (
                  <div className="space-y-5">
                    {/* Compassionate Therapy Analysis */}
                    <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-4 text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-15 text-[64px] font-serif select-none pointer-events-none">“</div>
                      <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider mb-2.5 inline-block">
                        Therapist Analysis
                      </span>
                      <p className="text-[12.5px] italic text-gray-650 leading-relaxed font-medium relative z-10">
                        &quot;{activeReport.summary}&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Activity Summary Log */}
                      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30">
                        <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-3 block">
                          Period Activity Log
                        </span>
                        <div className="space-y-2">
                          {[
                            { label: "AI Therapy Chat Messages", count: activeReport.activitySummary?.msg_count || 0, icon: "💬" },
                            { label: "CIBIL Score Checker Syncs", count: activeReport.activitySummary?.cibil_checks || 0, icon: "🔍" },
                            { label: "Financial Quizzes Completed", count: activeReport.activitySummary?.tests_completed || 0, icon: "📝" },
                            { label: "Loan Calculator runs", count: activeReport.activitySummary?.calculator_runs || 0, icon: "🧮" },
                            { label: "Educational Videos Watched", count: activeReport.activitySummary?.videos_watched || 0, icon: "🎥" }
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center text-[11.5px] border-b border-gray-100/50 pb-1.5 last:border-0 last:pb-0">
                              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                <span>{item.icon}</span> {item.label}
                              </span>
                              <span className={`font-bold rounded-full px-2 py-0.5 text-[10.5px] ${item.count > 0 ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"}`}>
                                {item.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mood Trend Analysis */}
                      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30">
                        <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-3 block">
                          Avg Stress & Telemetry Trend
                        </span>
                        <div className="space-y-2.5">
                          {[
                            { label: "Stress Level", val: activeReport.moodTrend?.stress, color: "#f43f5e" },
                            { label: "Financial Urgency", val: activeReport.moodTrend?.urgency, color: "#ef4444" },
                            { label: "Openness to Solutions", val: activeReport.moodTrend?.openness, color: "#10b981" },
                            { label: "Learning Willingness", val: activeReport.moodTrend?.willingness, color: BRAND },
                            { label: "General Emotion", val: activeReport.moodTrend?.emotion, color: "#f59e0b" }
                          ].map((dim) => {
                            const valLabel = typeof dim.val === "number" ? `${Math.round(dim.val)}%` : "—";
                            return (
                              <div key={dim.label} className="flex items-center gap-2">
                                <div className="text-[11px] text-gray-600 w-[90px] font-medium shrink-0">{dim.label}</div>
                                <div className="flex-1 h-[4.5px] bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${dim.val ?? 0}%`, backgroundColor: dim.color }} />
                                </div>
                                <div className="text-[10px] text-gray-400 w-[24px] text-right shrink-0">{valLabel}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Key Recommendations & Takeaways */}
                    {activeReport.keyTakeaways && activeReport.keyTakeaways.length > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        <span className="text-[10.5px] font-extrabold text-gray-500 uppercase tracking-wider mb-3 block">
                          📋 Recommended Therapist Action Steps
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {activeReport.keyTakeaways.map((takeaway, idx) => (
                            <div key={idx} className="bg-amber-50/20 border border-amber-100/40 rounded-xl p-3 flex gap-2">
                              <span className="text-[12px] text-gray-650 leading-relaxed font-semibold">
                                {takeaway}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Health summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "80ms" }}>
                <div className="text-[13px] font-semibold text-gray-800 mb-4">Financial Health Breakdown</div>
                {[
                  { label: "Savings Rate", pct: 27, color: "#10b981" },
                  { label: "Debt Ratio", pct: emiPct, color: "#ef4444" },
                  { label: "Credit Score", pct: Math.min(100, Math.max(0, Math.round(((cibilReport?.score || 742) - 300) / 600 * 100))), color: BRAND },
                  { label: "Emergency Fund", pct: 20, color: "#f59e0b" },
                  { label: "Investment Rate", pct: 12, color: "#8b5cf6" },
                ].map((item, i) => (
                  <div key={item.label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-gray-500 font-medium">{item.label}</span>
                      <span className="font-semibold" style={{ color: item.color }}>{item.pct}%</span>
                    </div>
                    <AnimBar pct={item.pct} color={item.color} delay={i * 120} />
                  </div>
                ))}
              </div>

              <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "160ms" }}>
                <div className="text-[13px] font-semibold text-gray-800 mb-0.5">Net Worth Trend</div>
                <div className="text-[11px] text-gray-400 mb-3">↑ ₹78K growth in 6 months</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={netWorthData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradNW" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                    <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
                    <Area type="monotone" dataKey="worth" name="Net Worth" stroke="#10b981" strokeWidth={2.5} fill="url(#gradNW)" dot={{ fill: "#10b981", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Full income/expense bar */}
            <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[13px] font-semibold text-gray-800">Monthly Cash Flow</div>
                  <div className="text-[11px] text-gray-400">Income vs total outflows</div>
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: BRAND }} />Income</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#ef4444]" />Expenses</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dynamicSpendData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Income" fill={BRAND} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insight tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "240ms" }}>
              {(() => {
                const currentScore = cibilReport?.score || 742;
                const scoreBand = cibilReport?.band || (currentScore >= 750 ? "Excellent" : currentScore >= 700 ? "Good" : currentScore >= 630 ? "Fair" : "Poor");
                const scoreTagColor = currentScore >= 750 ? "#10b981" : currentScore >= 700 ? BRAND : currentScore >= 630 ? "#f59e0b" : "#ef4444";
                const scoreDesc = cibilReport
                  ? `Your score is ${currentScore} (${scoreBand}). Stored PAN: ${cibilReport.pan}.`
                  : "No CIBIL report fetched yet. Use the CIBIL Score Checker to sync your credit profile.";

                const avgGoalProgress = localGoals.length > 0
                  ? Math.round(localGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / localGoals.length * 100)
                  : 0;

                const tiles = [
                  { icon: "📊", title: "CIBIL Score", value: String(currentScore), tag: scoreBand, tagColor: scoreTagColor, desc: scoreDesc },
                  ...(!isStaff ? [{ icon: "🎯", title: "Goal Progress", value: `${avgGoalProgress}%`, tag: avgGoalProgress >= 50 ? "Good" : "Needs Attention", tagColor: avgGoalProgress >= 50 ? BRAND : "#f59e0b", desc: `${localGoals.length} active goal${localGoals.length === 1 ? "" : "s"} tracked. Redirect surplus to speed up progress.` }] : []),
                  { icon: "💡", title: "Savings Potential", value: `₹${Math.round(incomeVal * 0.05).toLocaleString()}`, tag: "Opportunity", tagColor: "#f59e0b", desc: `Reduce unnecessary dining & transport by 5%. Redirect to your emergency fund.` },
                ];

                return tiles.map((tile) => (
                  <div key={tile.title} className="dashboard-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[18px]">{tile.icon}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${tile.tagColor}18`, color: tile.tagColor }}>{tile.tag}</span>
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{tile.title}</div>
                    <div className="font-serif text-[26px] font-bold text-gray-900 leading-none mb-2">{tile.value}</div>
                    <div className="text-[11px] text-gray-500 leading-relaxed">{tile.desc}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ══ ADVISORS TAB ══ */}
        {activeTab === "advisor" && (
          <div className="flex flex-col gap-6">
            <div className="animate-fade-up rounded-[14px] p-5 flex items-center gap-5" style={{ background: `linear-gradient(135deg, ${BRAND}10, ${BRAND}05)`, border: `1.5px solid ${BRAND}25` }}>
              <div className="text-[36px]">🧑‍💼</div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-gray-800 mb-0.5">Talk to a Real Financial Advisor</div>
                <div className="text-[12px] text-gray-500 leading-relaxed">Connect with professional financial experts for 1-on-1 guidance. Get personalised advice tailored to your exact situation — no generic templates.</div>
              </div>
              <button
                data-testid="btn-browse-advisors"
                onClick={() => onNavigate("Talk to an Advisor")}
                className="shrink-0 text-[12px] font-semibold text-white px-5 py-2.5 rounded-[10px] transition-all hover:-translate-y-px hover:shadow-lg cursor-pointer"
                style={{ background: BRAND }}
              >
                Browse All →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const advisorsToDisplay = advisors.length > 0 ? advisors.slice(0, 3) : DEFAULT_ADVISORS;
                return advisorsToDisplay.map((a, i) => {
                  const getInitials = (n: string) => {
                    if (!n) return "";
                    const parts = n.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[1][0]).toUpperCase();
                    }
                    return parts[0][0].toUpperCase();
                  };

                  const initials = a.initials || getInitials(a.name);
                  const title = a.designation || a.title || "Advisor";
                  const rating = a.rating || 4.8;
                  const sessions = a.reviewsCount !== undefined ? a.reviewsCount : (a.sessions || 15);
                  const dbStatus = a.availability || (a.available ? "available" : "unavailable");
                  const isAvailable = a.nextSlot ? getEffectiveAvailability(dbStatus, a.nextSlot) : dbStatus;

                  const colors = ["#3244e6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];
                  const color = a.color || colors[i % colors.length];

                  return (
                    <AdvisorCard
                      key={a.id || a.f2FintechId || a.name}
                      initials={initials}
                      name={a.name}
                      title={title}
                      rating={rating}
                      sessions={sessions}
                      available={isAvailable}
                      color={color}
                      avatarUrl={a.avatarUrl}
                      delay={i * 100}
                      onChat={() => onNavigate("Talk to an Advisor")}
                    />
                  );
                });
              })()}
            </div>

            {/* How it works */}
            <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "200ms" }}>
              <div className="text-[13px] font-semibold text-gray-800 mb-4">How Advisory Sessions Work</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { step: "01", icon: "🔍", title: "Pick Your Advisor", desc: "Filter by specialty — debt, investments, tax, or goals." },
                  { step: "02", icon: "📅", title: "Book a Slot", desc: "Choose a time that works. Video or chat sessions available." },
                  { step: "03", icon: "💬", title: "Share Your Situation", desc: "Your FinHeal profile is shared automatically (with consent)." },
                  { step: "04", icon: "✅", title: "Get Your Plan", desc: "Receive a written action plan within 24 hours of your session." },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[#eef0fd] text-primary text-[11px] font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
                    <div className="text-[18px] mb-2">{s.icon}</div>
                    <div className="text-[12px] font-semibold text-gray-800 mb-1">{s.title}</div>
                    <div className="text-[11px] text-gray-400 leading-relaxed">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Bookings Card */}
            <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "250ms" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[13px] font-semibold text-gray-800">My Consultations</h3>
                  <p className="text-[11px] text-gray-400">Manage your scheduled sessions with advisors</p>
                </div>
                <span className="text-[9px] font-bold bg-[#eef0fd] text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                  {appointments.length} Total
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
                  <p className="text-[18px] mb-1">📅</p>
                  <p className="text-[12px] font-semibold text-gray-700">No Bookings Yet</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[240px] mx-auto">
                    You haven't scheduled any advisory sessions. Select an advisor above to book your first call.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upcoming Bookings */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      📅 Current & Upcoming ({activeAppointments.length})
                    </h4>
                    {activeAppointments.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-100 rounded-[10px] p-4 text-center py-6 text-gray-400 text-[11px]">
                        No upcoming sessions scheduled.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {activeAppointments.map((appt, idx) => (
                          <div key={idx} className="bg-[#f8f9ff] border border-[#e8ecff] rounded-[10px] p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-[12px] font-bold text-gray-800">{appt.advisorName}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  {appt.date} · {appt.time}
                                </div>
                              </div>
                              <span className="text-[9px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">
                                Scheduled
                              </span>
                            </div>
                            {appt.notes && (
                              <div className="text-[10px] text-gray-500 bg-white/50 border border-gray-100 rounded-[6px] p-2 leading-relaxed italic">
                                "{appt.notes}"
                              </div>
                            )}
                            {appt.meetUrl && (
                              <a
                                href={appt.meetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] text-[11px] font-semibold text-white transition-all bg-[#3244e6] hover:bg-[#2836b8]"
                              >
                                Join Video Call 🎥
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Bookings */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      📜 Consultation History ({pastAppointments.length})
                    </h4>
                    {pastAppointments.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-100 rounded-[10px] p-4 text-center py-6 text-gray-400 text-[11px]">
                        No past consultations record found.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                        {pastAppointments.map((appt, idx) => (
                          <div key={idx} className="bg-gray-50 border border-gray-100 rounded-[10px] p-3.5 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[12px] font-semibold text-gray-700">{appt.advisorName}</span>
                              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase ${appt.cancelled ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                                {appt.cancelled ? 'Cancelled' : 'Completed'}
                              </span>
                            </div>
                            <div className="text-[10.5px] text-gray-400">
                              {appt.date} · {appt.time}
                            </div>
                            {appt.rating && (
                              <div className="text-[10.5px] text-amber-500 font-medium">
                                Rated: {"⭐".repeat(appt.rating)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
