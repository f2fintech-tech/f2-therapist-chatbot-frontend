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
import { fetchAdvisors, fetchUserProfile } from "@/lib/backendAuth";
import { hasSessionEnded } from "./AdvisorPanel";
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
function StatCard({ icon, label, value, sub, color, delay = 0 }: any) {
  return (
    <div className="dashboard-card animate-fade-up flex flex-col gap-3 p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px]" style={{ background: `${color}18` }}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <div className="font-serif text-[28px] font-bold text-gray-900 leading-none">{value}</div>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-[10px] p-3">
          <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Monthly EMI</div>
          <div className="text-[16px] font-bold text-gray-900">₹{emi.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 rounded-[10px] p-3">
          <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Remaining</div>
          <div className="text-[16px] font-bold" style={{ color }}>₹{remaining.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Advisor card ─── */
function AdvisorCard({ initials, name, title, rating, sessions, available, color, avatarUrl, delay = 0, onChat }: any) {
  const isOnline = available === "available";
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
            <span className="text-[10px] font-medium text-[#10b981]">Online</span>
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
        className="w-full py-2.5 rounded-[10px] text-[12px] font-semibold transition-all active:scale-95 cursor-pointer"
        style={{ background: isActionable ? BRAND : "#f3f4f6", color: isActionable ? "#fff" : "#6b7280" }}
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

  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
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
        } catch {}

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
        } catch {}
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

  const [advisors, setAdvisors] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    async function loadAdvisors() {
      try {
        const list = await fetchAdvisors();
        if (active) {
          setAdvisors(list);
        }
      } catch (err) {
        console.error("Failed to load dashboard advisors:", err);
        const stored = localStorage.getItem("finheal_advisors_list");
        if (stored && active) {
          try { setAdvisors(JSON.parse(stored)); } catch {}
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

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "loans", label: "Loans", icon: "💳" },
    { key: "reports", label: "Reports", icon: "📈" },
    { key: "advisor", label: "Advisors", icon: "🧑‍💼" },
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
        <div className="flex px-8 pb-0 gap-1 mt-1 relative z-10">
          {tabs.map((t) => (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold rounded-t-[10px] transition-all ${
                activeTab === t.key
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

      {/* ── Tab content (scrollable) ── */}
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="💰" label="Net Worth" value={`₹${(netWorth / 100000).toFixed(1)}L`} sub="↑ 5.7% vs last month" color="#10b981" delay={0} />
              <StatCard icon="📉" label="Total Debt" value={`₹${(totalDebt / 100000).toFixed(1)}L`} sub={`${activeLoansCount} active loan${activeLoansCount === 1 ? "" : "s"}`} color="#ef4444" delay={80} />
              <StatCard icon="🏦" label="Monthly EMI" value={`₹${totalEmiVal.toLocaleString()}`} sub={`${emiPct}% of income`} color={BRAND} delay={160} />
              <StatCard icon="💸" label="Monthly Savings" value={`₹${Math.round(incomeVal * 0.27).toLocaleString()}`} sub="Based on 27% savings rate" color="#f59e0b" delay={240} />
            </div>

            {/* Chart row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Income vs Expense area chart */}
              <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-3 p-5" style={{ animationDelay: "100ms" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[13px] font-semibold text-gray-800">Income vs Expenses</div>
                    <div className="text-[11px] text-gray-400">Last 6 months</div>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3244e6]" />Income</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]" />Expenses</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={dynamicSpendData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" name="Income" stroke={BRAND} strokeWidth={2} fill="url(#gradIncome)" dot={false} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpense)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Spend pie */}
              <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-2 p-5" style={{ animationDelay: "150ms" }}>
                <div className="text-[13px] font-semibold text-gray-800 mb-0.5">Spending Breakdown</div>
                <div className="text-[11px] text-gray-400 mb-3">This month · ₹{(incomeVal - Math.round(incomeVal * 0.27)).toLocaleString()}</div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={dynamicSpendPie} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                      {dynamicSpendPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2">
                  {dynamicSpendPie.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[10.5px]">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.color }} />
                        <span className="text-gray-500">{item.name}</span>
                      </span>
                      <span className="font-semibold text-gray-700">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stress level chart row */}
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
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={stressData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="stress" name="Stress Index" stroke="url(#stressGrad)" strokeWidth={3} dot={{ fill: "#f43f5e", r: 4, strokeWidth: 1 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Quick Insights or summary card */}
              <div className="dashboard-card animate-fade-up col-span-1 lg:col-span-2 p-5 flex flex-col justify-between" style={{ animationDelay: "250ms" }}>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800 mb-1">Stress Analysis</div>
                  <div className="text-[11px] text-gray-400 mb-4">Weekly overview</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Average Stress Level</span>
                      <span className="font-bold text-gray-800">46 / 100</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Peak Stress Day</span>
                      <span className="font-bold text-red-500">Wednesday (72)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Lowest Stress Day</span>
                      <span className="font-bold text-emerald-500">Sunday (25)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[10px] p-3 text-[11px] text-[#b91c1c] leading-relaxed mt-4">
                  <strong>💡 Stress Nudge:</strong> {stressNudgeText}
                </div>
              </div>
            </div>

            {/* Goals overview */}
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
                            <span className="text-[12px] font-semibold text-gray-700">{g.name}</span>
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
                        <div className="flex-1 text-[12px] text-gray-600 truncate group-hover:text-gray-900 transition-colors">{s.title}</div>
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
        )}

        {/* ══ LOANS TAB ══ */}
        {activeTab === "loans" && (
          <div className="flex flex-col gap-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon="💰" label="Total Outstanding" value={`₹${(totalDebtVal / 100000).toFixed(1)}L`} sub={`Across ${activeLoansCount} loan${activeLoansCount === 1 ? "" : "s"}`} color="#ef4444" delay={0} />
              <StatCard icon="📅" label="Monthly EMI" value={`₹${totalEmiVal.toLocaleString()}`} sub={`${emiPct}% of ₹${Math.round(incomeVal / 1000)}K income`} color={BRAND} delay={80} />
              <StatCard icon="📉" label="Interest This Year" value={`₹${(activeLoansCount > 0 ? (dynamicLoans.reduce((sum, l) => sum + (l.emi * 12 * 0.45), 0) / 100000) : 2.1).toFixed(1)}L`} sub="Paid so far in 2026" color="#f59e0b" delay={160} />
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

            {/* EMI bar chart */}
            <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "200ms" }}>
              <div className="text-[13px] font-semibold text-gray-800 mb-0.5">EMI Timeline</div>
              <div className="text-[11px] text-gray-400 mb-4">Monthly obligations over the next 6 months</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dynamicSpendData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Income" fill={`${BRAND}25`} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="EMI + Expenses" fill={BRAND} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>


          </div>
        )}

        {/* ══ REPORTS TAB ══ */}
        {activeTab === "reports" && (
          <div className="flex flex-col gap-6">

            {/* Health summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "0ms" }}>
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

              <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "80ms" }}>
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
            <div className="dashboard-card animate-fade-up p-5" style={{ animationDelay: "160ms" }}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "220ms" }}>
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
                  { icon: "🎯", title: "Goal Progress", value: `${avgGoalProgress}%`, tag: avgGoalProgress >= 50 ? "Good" : "Needs Attention", tagColor: avgGoalProgress >= 50 ? BRAND : "#f59e0b", desc: `${localGoals.length} active goal${localGoals.length === 1 ? "" : "s"} tracked. Redirect surplus to speed up progress.` },
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
                  const isAvailable = a.availability || (a.available ? "available" : "unavailable");
                  
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
