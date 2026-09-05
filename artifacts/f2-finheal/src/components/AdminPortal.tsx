import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useRoute, useLocation } from "wouter";
import { Lock, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAdminStats, type BackendStats, fetchAdvisors, saveAdvisor, deleteAdvisor, updateAdvisorAvailability, updateAdvisorNextSlot, fetchAllAppointments, uploadAdvisorAvatar, updateAppointmentStatus, rescheduleAppointment, updateAdvisorPassword, isAdvisorSlotActive, generateReferral, listReferrals, type ReferralCode, updateAdvisorRole, signInUser, joinAppointment, updateAdvisorActiveStatus, checkAdvisorCibilLimit, fetchAllTestResults, type AdminTestResult, deleteAdminTestResult, fetchCibilTrash, restoreCibilEnquiry, fetchAdvisorsTrash, restoreAdvisor, deleteAppointment, restoreAppointment, permanentlyDeleteAppointment, fetchAppointmentsTrash, fetchLendersTrash, restoreLender, getDefaultCreditLimitForEmployee } from "@/lib/backendAuth";
import { advisorsData, type Advisor, hasSessionEnded } from "@/components/AdvisorPanel";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { CONTENT, type ContentItem } from "@/components/FinancialEducation";
import { testCards, type TestCard } from "@/components/FinancialHealthTestCatalog";
import { creditReadinessQuestions } from "@/features/credit-readiness/creditReadinessConfig";
import { debtBalanceQuestions } from "@/features/debt-balance/debtBalanceConfig";
import { emergencyFundQuestions } from "@/features/emergency-fund/emergencyFundConfig";
import { financialLiteracyQuestions } from "@/features/financial-literacy/financialLiteracyConfig";
import { loanFitQuestions } from "@/features/loan-fit/loanFitConfig";
import { type LenderProduct } from "./LoanCalculatorView";

// Lazy-loaded Admin Sub-tab components for ~60% bundle size reduction
const EmployeeDirectory = lazy(() => import("./admin/EmployeeDirectory"));
const ExpertsTab = lazy(() => import("./admin/ExpertsTab"));
const EducationTab = lazy(() => import("./admin/EducationTab"));
const TestsTab = lazy(() => import("./admin/TestsTab"));
const AppointmentsTab = lazy(() => import("./admin/AppointmentsTab"));
const LendersTab = lazy(() => import("./admin/LendersTab"));
const TrashTab = lazy(() => import("./admin/TrashTab"));
const CibilEnquiriesTab = lazy(() => import("./admin/CibilEnquiriesTab"));
const CibilAnalyzerView = lazy(() => import("./CibilAnalyzerView"));

const AdminTabFallback = () => (
  <div className="flex items-center justify-center p-12 bg-white rounded-[20px] border border-gray-200 shadow-xs">
    <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span>Loading module...</span>
    </div>
  </div>
);
interface AdminPortalProps {
  userId: string;
  userEmail: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  initialTab?: string;
}

interface Appointment {
  id?: string;
  advisorId: string;
  advisorName: string;
  date: string;
  time: string;
  notes?: string;
  clientEmail?: string;
  clientName?: string;
  bookedAt: string;
  completed?: boolean;
  cancelled?: boolean;
  rating?: number;
  feedback?: string;
  meetUrl?: string;
  joined?: boolean;
  agenda?: string[] | null;
  deletedAt?: string;
}

export function classifyEnquiryRole(email: string, name: string, advisors: any[] = []): "Admin" | "Manager" | "Senior Leadership" | "User" {
  const cleanEmail = (email || "").toLowerCase().trim();

  // 1. Admin Classification (Strict admin emails only)
  if (
    cleanEmail === "admin@finheal.com" ||
    cleanEmail === "admin@f2finheal.com" ||
    cleanEmail.startsWith("admin@")
  ) {
    return "Admin";
  }

  // 2. Senior Leadership (Explicit leadership emails only)
  if (["ceo@finheal.com", "cto@finheal.com", "cfo@finheal.com", "coo@finheal.com", "director@finheal.com"].includes(cleanEmail)) {
    return "Senior Leadership";
  }

  // 3. Manager / Advisor (Strict Match by Unique ID or Registered Advisor Email ONLY - No Name Matching)
  const isAdvisor = advisors.some(adv => {
    const advId = (adv.f2FintechId || adv.id || "").toLowerCase().trim();
    const advEmail = (adv.email || "").toLowerCase().trim();
    return (
      cleanEmail && (cleanEmail === advId || cleanEmail === advEmail)
    );
  });

  if (isAdvisor) {
    return "Manager";
  }

  // 4. Default: Every other enquiry is strictly a User (Lead)
  return "User";
}



const TEST_NAMES: Record<string, string> = {
  "financial-literacy": "Money IQ Arena",
  "financial_literacy": "Money IQ Arena",
  "debt-balance": "Debt Pressure Analysis",
  "debt_balance": "Debt Pressure Analysis",
  "emergency-fund": "Financial Safety Score",
  "emergency_fund": "Financial Safety Score",
  "credit-readiness": "Credit Health Analyzer",
  "credit_readiness": "Credit Health Analyzer",
  "loan-fit": "Loan Comfort Analysis",
  "loan_fit": "Loan Comfort Analysis"
};

const renderApptNotes = (notes: string | undefined | null, agenda: string[] | undefined | null) => {
  const hasAgenda = agenda && agenda.length > 0;

  if (!hasAgenda) {
    if (!notes) return null;
    return (
      <div className="text-[11px] text-gray-500 mt-[4px] bg-gray-55/60 p-[8px] rounded-[8px] whitespace-pre-wrap text-left italic">
        &quot;{notes}&quot;
      </div>
    );
  }

  // If agenda has 1 item and it is exactly notes, render as plain notes instead of checkmarks
  if (agenda.length === 1 && agenda[0] === notes) {
    return (
      <div className="text-[11px] text-gray-500 mt-[4px] bg-gray-55/60 p-[8px] rounded-[8px] whitespace-pre-wrap text-left italic">
        &quot;{notes}&quot;
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5 text-left">
      <div className="bg-emerald-50/20 border border-emerald-100/30 rounded-[10px] p-2.5 flex flex-col gap-1">
        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-[0.5px] block">📋 Pre-Session Agenda Topics</span>
        <div className="space-y-1">
          {agenda.map((item, i) => (
            <div key={i} className="text-[10.5px] text-gray-650 font-medium leading-relaxed flex items-start gap-1">
              <span className="text-emerald-500 select-none font-bold">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {notes && notes.trim() !== "" && notes !== agenda.join("\n") && (
        <div className="text-[10.5px] text-gray-500 italic bg-gray-55/60 p-2 border border-gray-100 rounded-[8px] leading-relaxed whitespace-pre-wrap">
          &quot;{notes}&quot;
        </div>
      )}
    </div>
  );
};

export default function AdminPortal({ userId, userEmail, onToggleSidebar, onToggleInsights, initialTab }: AdminPortalProps) {
  const isAdmin = userEmail === "admin@finheal.com" || userEmail === "admin@f2finheal.com";



  // Active Admin Tabs: experts, education, tests, appointments, lenders, cibil-enquiries, employees, trash
  // Dynamic URL Routing for admin tabs (replacing local useState to support URLs like /admin/tests)
  const [matchAdmin, paramsAdmin] = useRoute("/admin/:tab");
  const [matchWorkspace, paramsWorkspace] = useRoute("/advisor-workspace/:tab");
  const match = matchAdmin || matchWorkspace;
  const params = matchAdmin ? paramsAdmin : paramsWorkspace;

  const [_, setLocation] = useLocation();

  const activeTabUrl = (match && params?.tab && ["experts", "education", "tests", "appointments", "lenders", "cibil-enquiries", "employees", "trash"].includes(params.tab))
    ? (params.tab as "experts" | "education" | "tests" | "appointments" | "lenders" | "cibil-enquiries" | "employees" | "trash")
    : null;

  const validInitialTab = initialTab && ["experts", "education", "tests", "appointments", "lenders", "cibil-enquiries", "employees", "trash"].includes(initialTab)
    ? (initialTab as "experts" | "education" | "tests" | "appointments" | "lenders" | "cibil-enquiries" | "employees" | "trash")
    : null;

  const activeTab = activeTabUrl || validInitialTab || "experts";

  const setActiveTab = (newTab: "experts" | "education" | "tests" | "appointments" | "lenders" | "cibil-enquiries" | "employees" | "trash") => {
    setLocation(isAdmin ? `/admin/${newTab}` : `/advisor-workspace/${newTab}`);
  };

  // State Management
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorsLoading, setAdvisorsLoading] = useState(false);
  const [employees, setEmployees] = useState<Advisor[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [educationContent, setEducationContent] = useState<ContentItem[]>([]);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationTrash, setEducationTrash] = useState<ContentItem[]>([]);
  const [testCatalog, setTestCatalog] = useState<TestCard[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [filterAdvisor, setFilterAdvisor] = useState<string>("all");
  const [filterTestName, setFilterTestName] = useState<string>("all");
  const [filterLenderSearch, setFilterLenderSearch] = useState<string>("");
  const [filterEduType, setFilterEduType] = useState<string>("all");
  const [filterApptStatus, setFilterApptStatus] = useState<string>("all");
  const [filterApptStartDate, setFilterApptStartDate] = useState<string>("");
  const [filterApptEndDate, setFilterApptEndDate] = useState<string>("");

  // Manage Tests Submissions States
  const [testSubTab, setTestSubTab] = useState<"templates" | "logs">("templates");
  const [testSubmissions, setTestSubmissions] = useState<AdminTestResult[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState<boolean>(false);
  const [submissionsSearch, setSubmissionsSearch] = useState<string>("");
  const [submissionsPage, setSubmissionsPage] = useState<number>(1);

  // Lenders Catalog States
  const [lenderList, setLenderList] = useState<LenderProduct[]>([]);
  const [lendersLoading, setLendersLoading] = useState(false);
  const [lenderModalOpen, setLenderModalOpen] = useState(false);
  const [editingLender, setEditingLender] = useState<LenderProduct | null>(null);
  const [lenderDeleteConfirmOpen, setLenderDeleteConfirmOpen] = useState(false);
  const [lenderToDelete, setLenderToDelete] = useState<LenderProduct | null>(null);
  const [isDeletingLender, setIsDeletingLender] = useState(false);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [lenderForm, setLenderForm] = useState({
    id: "",
    name: "",
    lenderType: "NBFC",
    productType: "Home Loan",
    category: "home",
    minRate: 8.5,
    maxRate: 12.0,
    minTenureYears: 5,
    maxTenureYears: 20,
    minMonthlyIncome: 30000,
    minCibil: 700,
    maxFoirPct: 60,
    minAmount: 100000,
    maxAmount: 5000000,
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

  // Loading and Error States
  const [statsLoading, setStatsLoading] = useState(false);
  const [savingExpert, setSavingExpert] = useState(false);

  // Edit / Add Modal States
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Advisor | null>(null);

  // Deletion Password Verification Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [isDeletingExpert, setIsDeletingExpert] = useState(false);

  // CIBIL Enquiry Deletion Modal States
  const [cibilDeleteConfirmOpen, setCibilDeleteConfirmOpen] = useState(false);
  const [cibilToDelete, setCibilToDelete] = useState<string | null>(null);
  const [isDeletingCibil, setIsDeletingCibil] = useState(false);
  const [cibilDeleteResult, setCibilDeleteResult] = useState<string | null>(null);
  const [animatingCibilRows, setAnimatingCibilRows] = useState<string[]>([]);

  // Department Renaming Modal States
  const [renameDeptModalOpen, setRenameDeptModalOpen] = useState(false);
  const [renameOldDept, setRenameOldDept] = useState("");
  const [renameNewDept, setRenameNewDept] = useState("");
  const [renamingDept, setRenamingDept] = useState(false);
  const [renameDeptError, setRenameDeptError] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Deactivation reason modal states
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<any>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestCard | null>(null);

  // Expert form state
  const [expertForm, setExpertForm] = useState({
    f2FintechId: "",
    name: "",
    designation: "",
    avatarUrl: "",
    availability: "available" as string,
    expertise: "",
    strength: "",
    bio: "",
    category: "wealth" as any,
    customCategory: "",
    rating: 0.0,
    reviewsCount: 0,
    nextSlot: "Tomorrow, 10:00 AM",
    fee: 899,
    testComment: "",
    testRating: 5,
    department: "Founder's Office",
    isAdvisor: false,
    permissions: ["cibil_fetch", "cibil_view", "cibil_view_all", "scheduled_calls", "lenders_edit"] as string[],
    creditReportLimit: -1 as number | null,
    creditReportTempLimit: "" as number | string | null,
    creditReportTempMonth: "" as string | null
  });

  // Education form state
  const [eduForm, setEduForm] = useState({
    type: "article" as "article" | "video",
    title: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    category: "Loans",
    emoji: "📚",
    bgColor: "#E6F1FB",
    youtubeId: "",
    articleUrl: "",
    description: "",
    source: "f2fintech.com",
    readTime: "5 min read",
    duration: "5 min"
  });

  // Test form state
  const [testForm, setTestForm] = useState({
    title: "",
    description: "",
    duration: "5 min",
    focus: "",
    result: "",
    accent: "from-[#3344e6] to-[#7c8cff]",
    questions: [] as any[],
    pillar: "money_iq"
  });

  const [selectedEditLevel, setSelectedEditLevel] = useState<number>(1);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Next Slot state for specific Advisor Workspace
  const [expertNextSlot, setExpertNextSlot] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStartDate, setSlotStartDate] = useState("");
  const [slotEndDate, setSlotEndDate] = useState("");
  const [slotFromTime, setSlotFromTime] = useState("");
  const [slotToTime, setSlotToTime] = useState("");
  const [addedSlots, setAddedSlots] = useState<string[]>([]);
  const [cancellingApptId, setCancellingApptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Referrals State
  const [referrals, setReferrals] = useState<ReferralCode[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [generatingReferral, setGeneratingReferral] = useState(false);

  // Reschedule meeting states
  const [reschedulingApptId, setReschedulingApptId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const timeSlots = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
    "09:00 PM"
  ];

  const formatSlotValue = (dateStr: string, timeStr: string, endDateStr?: string): string => {
    if (!dateStr || !timeStr) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const startDateObj = new Date(dateStr);
    const startMonth = months[startDateObj.getMonth()];
    const startDay = startDateObj.getDate();
    const startDayName = days[startDateObj.getDay()];

    if (!endDateStr || endDateStr === dateStr) {
      return `${startMonth} ${startDay} (${startDayName}), ${timeStr}`;
    }

    const endDateObj = new Date(endDateStr);
    const endMonth = months[endDateObj.getMonth()];
    const endDay = endDateObj.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${timeStr}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${timeStr}`;
  };

  // Self profile state for specific Advisor Workspace
  const [selfEditForm, setSelfEditForm] = useState({
    name: "",
    designation: "",
    avatarUrl: "",
    expertise: "",
    strength: "",
    bio: "",
    fee: 899
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [testReviewHoverRating, setTestReviewHoverRating] = useState(0);


  // Dynamically map logged-in email prefix to advisor ID based on name slug or F2 Fintech ID
  const getExpertIdFromEmail = (email: string) => {
    if (!email) return null;
    const prefix = email.split("@")[0].toLowerCase().replace(".", "-");

    // Direct match against F2 ID or database ID first
    const directMatch = advisors.find(a =>
      (a.f2FintechId && a.f2FintechId.toLowerCase() === prefix) ||
      (a.id && a.id.toLowerCase() === prefix)
    );
    if (directMatch) return directMatch.id || directMatch.f2FintechId;

    const found = advisors.find(a => {
      const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return slug.startsWith(prefix) || slug.includes(prefix) || prefix.includes(slug);
    });
    return found ? found.id : null;
  };

  const isEmployeeId = userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const currentExpertId = isEmployeeId ? userId : getExpertIdFromEmail(userEmail);

  const foundAdvisor = currentExpertId ? advisors.find(a => (a.id === currentExpertId || a.f2FintechId === currentExpertId)) : null;

  const activeExpert = foundAdvisor || (isEmployeeId ? (() => {
    try {
      const sessionStr = localStorage.getItem("finheal-auth-session");
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        return {
          id: userId,
          f2FintechId: userId,
          name: parsed.displayName || userEmail,
          isAdvisor: parsed.isAdvisor || false,
          permissions: parsed.permissions || [],
          expertise: [],
          designation: "Staff",
          avatarUrl: "",
          rating: 0,
          availability: "available",
          reviewsCount: 0,
          nextSlot: "",
          category: "Advisor",
          strength: "Financial planning",
          bio: "Certified staff member",
          fee: 899
        } as Advisor;
      }
    } catch (e) { }
    return null;
  })() : null);

  useEffect(() => {
    if (activeExpert?.nextSlot && activeExpert.nextSlot !== "Not available" && activeExpert.nextSlot !== "Tomorrow, 10:00 AM") {
      const chips = activeExpert.nextSlot.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
      if (chips.length > 0) {
        setAddedSlots(chips);
      }
    }
  }, [activeExpert?.f2FintechId, activeExpert?.nextSlot]);

  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [limitFetchCount, setLimitFetchCount] = useState(0);

  const checkCibilFetchThreshold = async () => {
    if (isAdmin || !currentExpertId) return;
    try {
      const res = await checkAdvisorCibilLimit(currentExpertId);
      if (res.trigger_warning) {
        setLimitFetchCount(res.fetch_count);
        setShowLimitWarning(true);
      }
    } catch (err) {
      console.error("Failed to check advisor CIBIL limit:", err);
    }
  };

  useEffect(() => {
    if (currentExpertId && !isAdmin) {
      checkCibilFetchThreshold();
    }
  }, [currentExpertId, isAdmin]);

  // Load backend stats (disabled since stats cards are not rendered in the Admin UI)
  // useEffect(() => {
  //   if (isAdmin) {
  //     setStatsLoading(true);
  //     fetchAdminStats()
  //       .then(stats => setBackendStats(stats))
  //       .catch(err => console.error("Error loading stats", err))
  //       .finally(() => setStatsLoading(false));
  //   }
  // }, [isAdmin]);

  // Fetch Lenders Catalog from backend JSON database
  const fetchLenders = async () => {
    try {
      setLendersLoading(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/lenders`);
      if (res.ok) {
        const data = await res.json();
        setLenderList(data);
      }
    } catch (err) {
      console.error("Error loading lenders list:", err);
    } finally {
      setLendersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "lenders") {
      fetchLenders();
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (isAdmin && activeTab === "trash") {
      fetchTrashData();
    }
  }, [isAdmin, activeTab]);

  // Trash State & Fetchers
  const [cibilTrash, setCibilTrash] = useState<any[]>([]);
  const [advisorsTrash, setAdvisorsTrash] = useState<Advisor[]>([]);
  const [appointmentsTrash, setAppointmentsTrash] = useState<Appointment[]>([]);
  const [lendersTrash, setLendersTrash] = useState<any[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  const fetchTrashData = async () => {
    try {
      setTrashLoading(true);
      const [cibilRes, advisorsRes, appointmentsRes, lendersRes] = await Promise.all([
        fetchCibilTrash(userId).catch(() => []),
        fetchAdvisorsTrash().catch(() => []),
        fetchAppointmentsTrash().catch(() => []),
        fetchLendersTrash().catch(() => [])
      ]);
      setCibilTrash(cibilRes);
      setAdvisorsTrash(advisorsRes);
      setAppointmentsTrash(appointmentsRes);
      setLendersTrash(lendersRes);
    } catch (err) {
      console.error("Error loading trash data:", err);
    } finally {
      setTrashLoading(false);
    }
  };

  const handleRestoreLender = async (lenderId: string) => {
    try {
      await restoreLender(lenderId);
      alert("Lender product successfully restored.");
      fetchTrashData();
      window.dispatchEvent(new CustomEvent("finheal:lenders_update"));
    } catch (err: any) {
      alert(err.message || "Failed to restore lender product.");
    }
  };

  const handleDeleteAppointment = async (apptId: string) => {
    if (!window.confirm("Are you sure you want to move this scheduled call to trash?")) return;
    try {
      await deleteAppointment(apptId);
      alert("Scheduled call moved to trash successfully.");
      loadGlobalAppointments(true); // Refresh active appointments
    } catch (err: any) {
      alert(err.message || "Failed to delete scheduled call.");
    }
  };

  const handleRestoreAppointment = async (apptId: string) => {
    try {
      await restoreAppointment(apptId);
      alert("Scheduled call successfully restored.");
      fetchTrashData();
      loadGlobalAppointments(true); // Refresh active appointments
    } catch (err: any) {
      alert(err.message || "Failed to restore scheduled call.");
    }
  };

  const handlePermanentlyDeleteAppointment = async (apptId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this scheduled call from the database? This action cannot be undone.")) return;
    try {
      await permanentlyDeleteAppointment(apptId);
      alert("Scheduled call permanently purged.");
      fetchTrashData();
    } catch (err: any) {
      alert(err.message || "Failed to permanently delete scheduled call.");
    }
  };

  const handleRestoreCibil = async (reportId: string) => {
    try {
      await restoreCibilEnquiry(reportId, userId);
      alert("CIBIL Enquiry record successfully restored.");
      fetchTrashData();
      fetchCibilEnquiries(); // Refresh active list as well
    } catch (err: any) {
      console.error("Error restoring CIBIL enquiry:", err);
      alert(err.message || "Failed to restore enquiry.");
    }
  };

  const handleRestoreAdvisor = async (f2FintechId: string) => {
    try {
      await restoreAdvisor(f2FintechId);
      alert("Employee/Advisor profile successfully restored.");
      fetchTrashData();
      fetchAdvisors(); // Refresh active advisors list
    } catch (err: any) {
      console.error("Error restoring employee:", err);
      alert(err.message || "Failed to restore employee.");
    }
  };

  // CIBIL Enquiries State and Fetcher
  const [cibilEnquiries, setCibilEnquiries] = useState<any[]>([]);
  const [cibilTotal, setCibilTotal] = useState<number>(0);
  const [viewingCibilReport, setViewingCibilReport] = useState<any | null>(null);
  const [viewingCibilReportId, setViewingCibilReportId] = useState<string | null>(null);
  const [viewingCibilReportUserId, setViewingCibilReportUserId] = useState<string | null>(null);
  const [cibilLoading, setCibilLoading] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterLoanType, setFilterLoanType] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // 300ms debounce on search input to prevent network request spam on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filterSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterSearch]);
  const [filterBureau, setFilterBureau] = useState<string>("all");

  const allDepartments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort() as string[];
  }, [employees]);

  const [cibilPage, setCibilPage] = useState<number>(1);
  const cibilPageSize = 15;

  const todayStr = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  // Reset page when filters change (handled implicitly by backend if page exceeds total)
  useEffect(() => {
    setCibilPage(1);
  }, [filterDate, filterEndDate, filterRole, filterEmployee, filterLoanType, debouncedSearch, filterBureau]);




  const getDateFilterDescription = () => {
    if (filterDate && filterEndDate) {
      if (filterDate === filterEndDate) {
        return `Showing records fetched on ${new Date(filterDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
      return `Showing records fetched between ${new Date(filterDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} and ${new Date(filterEndDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (filterDate) {
      return `Showing records fetched on ${new Date(filterDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (filterEndDate) {
      return `Showing records fetched up to ${new Date(filterEndDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return "Showing all credit score fetches across the platform.";
  };

  const totalPages = Math.ceil(cibilTotal / cibilPageSize) || 1;
  const safeCibilPage = Math.min(cibilPage, totalPages);
  const paginatedEnquiries = cibilEnquiries;

  const escapeXml = (unsafe: string) => {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const getColumnLetter = (colIndex: number) => {
    let temp = colIndex;
    let letter = "";
    while (temp > 0) {
      let modulo = (temp - 1) % 26;
      letter = String.fromCharCode(65 + modulo) + letter;
      temp = Math.floor((temp - modulo) / 26);
    }
    return letter;
  };

  const handleExportExcel = () => {
    if (cibilEnquiries.length === 0) return;

    // 1. Helper function for CRC32 calculation
    const makeCRCTable = () => {
      let c;
      const crcTable = [];
      for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
          c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
      }
      return crcTable;
    };

    const crcTable = makeCRCTable();

    const calculateCrc32 = (bytes: Uint8Array) => {
      let crc = 0 ^ (-1);
      for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
      }
      return (crc ^ (-1)) >>> 0;
    };

    // 2. Helper function to create an uncompressed ZIP file
    const createZipBlob = (files: { name: string; content: string }[]) => {
      const encoder = new TextEncoder();
      const zipData: { nameBytes: Uint8Array; contentBytes: Uint8Array; crc: number; offset: number }[] = [];
      let currentOffset = 0;
      const parts: BlobPart[] = [];

      files.forEach((file) => {
        const nameBytes = encoder.encode(file.name);
        const contentBytes = encoder.encode(file.content);
        const crc = calculateCrc32(contentBytes);

        const header = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 10, true);         // Version needed to extract
        view.setUint16(6, 0, true);          // General purpose bit flag
        view.setUint16(8, 0, true);          // Compression method (0 = Store)
        view.setUint32(10, 0, true);         // Last mod time / date (not set)
        view.setUint32(14, crc, true);       // CRC-32
        view.setUint32(18, contentBytes.length, true); // Compressed size
        view.setUint32(22, contentBytes.length, true); // Uncompressed size
        view.setUint16(26, nameBytes.length, true);    // File name length
        view.setUint16(28, 0, true);         // Extra field length

        header.set(nameBytes, 30);

        zipData.push({
          nameBytes,
          contentBytes,
          crc,
          offset: currentOffset
        });

        parts.push(header);
        parts.push(contentBytes);

        currentOffset += header.length + contentBytes.length;
      });

      const centralDirectoryOffset = currentOffset;
      let centralDirectorySize = 0;

      zipData.forEach((file) => {
        const header = new Uint8Array(46 + file.nameBytes.length);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x02014b50, true); // Central file header signature
        view.setUint16(4, 20, true);         // Version made by
        view.setUint16(6, 10, true);         // Version needed to extract
        view.setUint16(8, 0, true);          // General purpose bit flag
        view.setUint16(10, 0, true);         // Compression method (Store)
        view.setUint32(12, 0, true);         // Last mod time / date
        view.setUint32(16, file.crc, true);  // CRC-32
        view.setUint32(20, file.contentBytes.length, true); // Compressed size
        view.setUint32(24, file.contentBytes.length, true); // Uncompressed size
        view.setUint16(28, file.nameBytes.length, true);    // File name length
        view.setUint16(30, 0, true);         // Extra field length
        view.setUint16(32, 0, true);         // File comment length
        view.setUint16(34, 0, true);         // Disk number start
        view.setUint16(36, 0, true);         // Internal file attributes
        view.setUint32(38, 0, true);         // External file attributes
        view.setUint32(42, file.offset, true); // Local header offset

        header.set(file.nameBytes, 46);
        parts.push(header);

        centralDirectorySize += header.length;
        currentOffset += header.length;
      });

      const eocd = new Uint8Array(22);
      const view = new DataView(eocd.buffer);

      view.setUint32(0, 0x06054b50, true); // End of central dir signature
      view.setUint16(4, 0, true);          // Number of this disk
      view.setUint16(6, 0, true);          // Disk where central dir starts
      view.setUint16(8, files.length, true); // Directory records on this disk
      view.setUint16(10, files.length, true); // Total directory records
      view.setUint32(12, centralDirectorySize, true); // Size of central dir
      view.setUint32(16, centralDirectoryOffset, true); // Offset of central dir
      view.setUint16(20, 0, true);         // Comment length

      parts.push(eocd);

      return new Blob(parts, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    };

    // 3. Split data
    const under700 = cibilEnquiries.filter(enq => {
      const scoreVal = Number(enq.score);
      return isNaN(scoreVal) || scoreVal < 700;
    });
    const above700 = cibilEnquiries.filter(enq => {
      const scoreVal = Number(enq.score);
      return !isNaN(scoreVal) && scoreVal >= 700;
    });

    const loanTypesConfig = [
      { key: "home_loan", label: "Home Loan" },
      { key: "personal_loan", label: "Personal Loan" },
      { key: "professional_loan", label: "Professional Loan" },
      { key: "car_loan", label: "Car Loan" },
      { key: "credit_card", label: "Credit Card" },
      { key: "education_loan", label: "Education Loan" },
      { key: "business_loan", label: "Business Loan" },
      { key: "gold_loan", label: "Gold Loan" },
      { key: "other_loans", label: "Other Loan" }
    ];

    const maxLoanCounts: Record<string, number> = {};
    loanTypesConfig.forEach(cfg => {
      let maxCount = 0;
      cibilEnquiries.forEach(enq => {
        const val = enq[cfg.key];
        if (val) {
          const count = val.split("; ").filter(Boolean).length;
          if (count > maxCount) {
            maxCount = count;
          }
        }
      });
      maxLoanCounts[cfg.key] = maxCount;
    });

    const generateWorksheetXml = (data: any[]) => {
      const headers = ["Name", "Phone", "PAN No.", "CIBIL Score", "Email", "Bureau", "Date Fetched"];
      const loanCols: { key: string; label: string; count: number }[] = [];

      loanTypesConfig.forEach(cfg => {
        const count = maxLoanCounts[cfg.key] || 0;
        if (count > 0) {
          loanCols.push({ key: cfg.key, label: cfg.label, count });
          for (let i = 0; i < count; i++) {
            headers.push(count > 1 ? `${cfg.label} ${i + 1}` : cfg.label);
          }
        }
      });

      const totalCols = headers.length;
      const lastColLetter = getColumnLetter(totalCols);

      let sheetDataXml = "";

      // Header row
      sheetDataXml += `    <row r="1" spans="1:${totalCols}">\n`;
      headers.forEach((h, idx) => {
        const r = `${getColumnLetter(idx + 1)}1`;
        sheetDataXml += `      <c r="${r}" s="1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>\n`;
      });
      sheetDataXml += `    </row>\n`;

      // Data rows
      data.forEach((enq, rowIdx) => {
        const rowIndex = rowIdx + 2;
        sheetDataXml += `    <row r="${rowIndex}" spans="1:${totalCols}">\n`;

        const dateFormatted = enq.fetched_at
          ? new Date(enq.fetched_at.endsWith("Z") || enq.fetched_at.includes("+") ? enq.fetched_at : `${enq.fetched_at}Z`).toLocaleString("en-IN")
          : "-";

        const isBsa = enq.bureau?.toLowerCase() === "bsa_standalone";
        const fields = [
          enq.name || "Guest",
          enq.phone || "-",
          enq.pan || "-",
          isBsa ? "N/A" : (enq.score !== undefined && enq.score !== null ? String(enq.score) : "-"),
          enq.email || "-",
          isBsa ? "BSA" : (enq.bureau || "CIBIL"),
          dateFormatted
        ];

        loanCols.forEach(col => {
          const val = enq[col.key] || "";
          const loansList = val.split("; ").filter(Boolean);
          for (let i = 0; i < col.count; i++) {
            if (i < loansList.length) {
              fields.push(loansList[i]);
            } else {
              fields.push("-");
            }
          }
        });

        fields.forEach((val, colIdx) => {
          const r = `${getColumnLetter(colIdx + 1)}${rowIndex}`;
          const isNumber = colIdx === 3 && !isNaN(Number(val)) && val !== "-";
          if (isNumber) {
            sheetDataXml += `      <c r="${r}" s="2" t="n"><v>${val}</v></c>\n`;
          } else {
            sheetDataXml += `      <c r="${r}" s="0" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
          }
        });

        sheetDataXml += `    </row>\n`;
      });

      let colsXml = "  <cols>\n";
      colsXml += `    <col min="1" max="1" width="22" customWidth="1"/>\n`; // Name
      colsXml += `    <col min="2" max="2" width="16" customWidth="1"/>\n`; // Phone
      colsXml += `    <col min="3" max="3" width="16" customWidth="1"/>\n`; // PAN
      colsXml += `    <col min="4" max="4" width="14" customWidth="1"/>\n`; // CIBIL Score
      colsXml += `    <col min="5" max="5" width="26" customWidth="1"/>\n`; // Email
      colsXml += `    <col min="6" max="6" width="12" customWidth="1"/>\n`; // Bureau
      colsXml += `    <col min="7" max="7" width="20" customWidth="1"/>\n`; // Date Fetched
      if (totalCols > 7) {
        colsXml += `    <col min="8" max="${totalCols}" width="35" customWidth="1"/>\n`; // Dynamic Loans
      }
      colsXml += "  </cols>\n";

      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColLetter}${data.length + 1}"/>
${colsXml}
  <sheetData>
${sheetDataXml}
  </sheetData>
</worksheet>`;
    };

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Leads CIBIL under 700" sheetId="1" r:id="rId1"/>
    <sheet name="Leads CIBIL 700 and above" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Segoe UI"/><family val="2"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/><family val="2"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border/>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;

    const sheet1Xml = generateWorksheetXml(under700);
    const sheet2Xml = generateWorksheetXml(above700);

    const files = [
      { name: "[Content_Types].xml", content: contentTypesXml },
      { name: "_rels/.rels", content: relsXml },
      { name: "xl/workbook.xml", content: workbookXml },
      { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml },
      { name: "xl/styles.xml", content: stylesXml },
      { name: "xl/worksheets/sheet1.xml", content: sheet1Xml },
      { name: "xl/worksheets/sheet2.xml", content: sheet2Xml }
    ];

    const blob = createZipBlob(files);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${dateStr}.xlsx`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateCAM = async (userId: string, name: string, reportId?: string) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {};
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }

      const requestUrl = reportId
        ? `${apiBase}/cibil/cam/generate/${userId}?report_id=${reportId}`
        : `${apiBase}/cibil/cam/generate/${userId}`;

      const res = await fetch(requestUrl, { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate CAM Excel report.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanName = name.replace(/[^a-zA-Z0-9_]/g, "_");
      link.setAttribute("href", url);
      link.setAttribute("download", `CAM_Report_${cleanName}.xlsx`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("Error generating CAM:", err);
      alert(err.message || "Failed to generate CAM Excel report.");
    }
  };

  const fetchCibilEnquiries = async () => {
    try {
      setCibilLoading(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }
      if (userId) {
        headers["X-Requester-ID"] = userId;
      }

      const queryParams = new URLSearchParams({
        page: cibilPage.toString(),
        limit: cibilPageSize.toString()
      });
      if (debouncedSearch) queryParams.append("search", debouncedSearch);
      if (filterRole !== "all") queryParams.append("role", filterRole);
      if (filterEmployee !== "all") queryParams.append("employee_id", filterEmployee);
      if (filterLoanType !== "all") queryParams.append("loan_type", filterLoanType);
      if (filterBureau !== "all") queryParams.append("bureau", filterBureau);
      if (filterDate) queryParams.append("start_date", filterDate);
      if (filterEndDate) queryParams.append("end_date", filterEndDate);

      const res = await fetch(`${apiBase}/cibil/leads?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCibilEnquiries(data);
          setCibilTotal(data.length);
        } else {
          setCibilEnquiries(data.data || []);
          setCibilTotal(data.total || 0);
        }
      }
    } catch (err) {
      console.error("Error loading CIBIL enquiries:", err);
    } finally {
      setCibilLoading(false);
    }
  };

  const handleDeleteEnquiry = (reportId: string) => {
    setCibilToDelete(reportId);
    setCibilDeleteConfirmOpen(true);
  };

  const executeDeleteCibil = async () => {
    if (!cibilToDelete) return;
    setIsDeletingCibil(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }
      if (userId) {
        headers["X-Requester-ID"] = userId;
      }

      const res = await fetch(`${apiBase}/cibil/leads/${cibilToDelete}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setCibilDeleteResult("Enquiry moved to trash.");
        // We will fetchCibilEnquiries after the user clicks OK to allow the animation to play
      } else {
        const errData = await res.json();
        setCibilDeleteResult(errData.detail || "Failed to delete the credit report.");
      }
    } catch (err: any) {
      console.error("Error deleting enquiry:", err);
      setCibilDeleteResult("Error: " + (err.message || "An unexpected error occurred."));
    } finally {
      setIsDeletingCibil(false);
    }
  };

  useEffect(() => {
    if ((isAdmin && (activeTab === "cibil-enquiries")) || currentExpertId) {
      fetchCibilEnquiries();
      if (!isAdmin && currentExpertId) {
        checkCibilFetchThreshold();
      }
    }
  }, [isAdmin, activeTab, currentExpertId, cibilPage, filterDate, filterEndDate, filterRole, filterEmployee, filterLoanType, debouncedSearch, filterBureau]);

  // Lenders CRUD Handlers
  const getProductPrefix = (category: string, productType: string): string => {
    const cat = (category || "").toLowerCase().trim();
    const prod = (productType || "").toLowerCase().trim();

    if (cat === "home") return "HL";
    if (cat === "personal") return "PL";
    if (cat === "professional") return "PR";

    if (prod.includes("home")) return "HL";
    if (prod.includes("personal")) return "PL";
    if (prod.includes("professional") || prod.includes("prof")) return "PR";

    const words = (productType || category || "").split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    const cleanStr = (productType || category || "").replace(/[^a-zA-Z]/g, "");
    if (cleanStr.length >= 2) {
      return cleanStr.substring(0, 2).toUpperCase();
    }
    return "LN";
  };

  const handleUpdateLenderField = (updatedFields: Partial<typeof lenderForm>) => {
    const nextForm = { ...lenderForm, ...updatedFields };
    const prefix = getProductPrefix(nextForm.category || "", nextForm.productType || "");
    const cleanName = (nextForm.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    nextForm.id = cleanName ? `${prefix}-${cleanName}` : prefix;
    setLenderForm(nextForm);
  };

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

  const handleOpenAddLender = () => {
    setEditingLender(null);
    setIsOtherSelected(false);
    setLenderForm({
      id: "",
      name: "",
      lenderType: "NBFC",
      productType: "Home Loan",
      category: "home",
      minRate: 8.5,
      maxRate: 12.0,
      minTenureYears: 5,
      maxTenureYears: 20,
      minMonthlyIncome: 30000,
      minCibil: 700,
      maxFoirPct: 60,
      minAmount: 100000,
      maxAmount: 5000000,
      disbursalTime: "2-5 days",
      pros: "Fast approvals, Digital KYC",
      cons: "Documentation heavy",
      docsRequired: "PAN & Aadhaar, 3 months salary slips, 6 months bank statements",
      processingFee: "Up to 2% + GST",
      emiPerLakhMin: "",
      annualMaintenanceCharges: "",
      insuranceCharges: "",
      otherCharges: "",
    });
    setLenderModalOpen(true);
  };

  const handleOpenEditLender = (l: LenderProduct) => {
    setEditingLender(l);
    const existingLenderNames = Array.from(new Set(lenderList.map(item => item.name).filter(Boolean)));
    setIsOtherSelected(!existingLenderNames.includes(l.name));
    setLenderForm({
      id: l.id,
      name: l.name,
      lenderType: l.lenderType,
      productType: l.productType,
      category: l.category,
      minRate: l.minRate,
      maxRate: l.maxRate,
      minTenureYears: l.minTenureYears,
      maxTenureYears: l.maxTenureYears,
      minMonthlyIncome: l.minMonthlyIncome,
      minCibil: l.minCibil,
      maxFoirPct: l.maxFoirPct,
      minAmount: l.minAmount,
      maxAmount: l.maxAmount,
      disbursalTime: l.disbursalTime,
      pros: l.pros.join(", "),
      cons: l.cons.join(", "),
      docsRequired: l.docsRequired.join(", "),
      processingFee: l.processingFee || "",
      emiPerLakhMin: l.emiPerLakhMin || "",
      annualMaintenanceCharges: l.annualMaintenanceCharges || "",
      insuranceCharges: l.insuranceCharges || "",
      otherCharges: l.otherCharges || "",
    });
    setLenderModalOpen(true);
  };

  const handleSaveLender = async () => {
    if (!lenderForm.name?.trim() || !lenderForm.productType?.trim()) {
      alert("Lender Name and Product Type are required!");
      return;
    }

    const generatedId = lenderForm.id?.trim() || `${lenderForm.category}-${lenderForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`;

    const item: LenderProduct = {
      id: generatedId,
      name: lenderForm.name.trim(),
      lenderType: lenderForm.lenderType,
      productType: lenderForm.productType.trim(),
      category: lenderForm.category,
      minRate: Number(lenderForm.minRate) || 8.5,
      maxRate: Number(lenderForm.maxRate) || Number(lenderForm.minRate) || 8.5,
      minTenureYears: Number(lenderForm.minTenureYears) || 1,
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
      updatedList = lenderList.map(l => l.id === editingLender.id ? item : l);
    } else {
      updatedList = [...lenderList, item];
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
        setLenderList(updatedList);
        setLenderModalOpen(false);
        // Sync with active LoanCalculatorView matching engine
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
    const updatedList = lenderList.filter(l => l.id !== lenderToDelete.id);
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
        setLenderList(updatedList);
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

  const handleRenameDepartment = async () => {
    const oldName = renameOldDept?.trim();
    const newName = renameNewDept?.trim();
    if (!oldName || !newName) {
      setRenameDeptError("Both old and new department names are required!");
      return;
    }
    if (oldName === newName) {
      setRenameDeptError("The new name must be different from the old name!");
      return;
    }

    setRenamingDept(true);
    setRenameDeptError("");
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/advisors/departments/rename`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_name: oldName,
          new_name: newName,
        }),
      });
      if (res.ok) {
        await loadEmployees(true);
        await loadAdvisors();
        setRenameDeptModalOpen(false);
        setRenameOldDept("");
        setRenameNewDept("");
      } else {
        const err = await res.json();
        setRenameDeptError(err.detail || "Failed to rename department.");
      }
    } catch (err) {
      console.error("Error renaming department:", err);
      setRenameDeptError("Network error connecting to backend API.");
    } finally {
      setRenamingDept(false);
    }
  };

  const loadAdvisors = async (showLoading: boolean = false) => {
    try {
      if (showLoading) setAdvisorsLoading(true);
      const list = await fetchAdvisors();
      const sortedList = [...list].sort((a, b) => {
        const idA = (a.f2FintechId || a.id || "").toLowerCase();
        const idB = (b.f2FintechId || b.id || "").toLowerCase();
        return idA.localeCompare(idB);
      });
      const newListStr = JSON.stringify(sortedList);
      const oldListStr = localStorage.getItem("finheal_advisors_list");

      setAdvisors(sortedList);
      if (newListStr !== oldListStr) {
        localStorage.setItem("finheal_advisors_list", newListStr);
        dispatchUpdateEvent("finheal:advisors_update");
      }
    } catch (err) {
      console.error("Error loading advisors from backend:", err);
      const stored = localStorage.getItem("finheal_advisors_list");
      if (stored) {
        try { setAdvisors(JSON.parse(stored)); } catch { setAdvisors([]); }
      } else {
        localStorage.setItem("finheal_advisors_list", JSON.stringify([]));
        setAdvisors([]);
      }
    } finally {
      if (showLoading) setAdvisorsLoading(false);
    }
  };

  const loadEmployees = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setEmployeesLoading(true);
      }
      const list = await fetchAdvisors(undefined, true);
      const sortedList = [...list].sort((a, b) => {
        const idA = (a.f2FintechId || a.id || "").toLowerCase();
        const idB = (b.f2FintechId || b.id || "").toLowerCase();
        return idA.localeCompare(idB);
      });
      setEmployees(sortedList);
    } catch (err) {
      console.error("Error loading employees from backend:", err);
    } finally {
      if (showLoading) {
        setEmployeesLoading(false);
      }
    }
  };

  const handleToggleAdvisorRole = async (f2FintechId: string, currentIsAdvisor: boolean) => {
    try {
      await updateAdvisorRole(f2FintechId, !currentIsAdvisor);
      await loadAdvisors();
      await loadEmployees();
    } catch (err) {
      console.error("Error toggling role:", err);
      alert("Failed to update employee role.");
    }
  };

  // Load local storage states (static content with zero network cost)
  useEffect(() => {
    // 1. Educational content & Trash
    const storedContent = localStorage.getItem("finheal_education_content");
    let activeList: ContentItem[] = [];
    if (storedContent) {
      try {
        activeList = JSON.parse(storedContent);
      } catch (e) {
        activeList = [...CONTENT];
      }
    } else {
      activeList = [...CONTENT];
    }

    const storedTrash = localStorage.getItem("finheal_education_trash");
    let trashList: ContentItem[] = [];
    if (storedTrash) {
      try {
        const parsedTrash = JSON.parse(storedTrash);
        const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days
        // Prune expired trash items
        trashList = parsedTrash.filter((item: any) => {
          const deletedAtTime = new Date(item.deletedAt).getTime();
          return deletedAtTime >= cutoff;
        });
      } catch (e) {
        trashList = [];
      }
    }

    // Check if any default CONTENT items are missing (Self-healing)
    let missingDefaults: ContentItem[] = [];
    CONTENT.forEach((defItem) => {
      const existsInActive = activeList.some(item => item.id === defItem.id);
      const existsInTrash = trashList.some(item => item.id === defItem.id);
      if (!existsInActive && !existsInTrash) {
        missingDefaults.push(defItem);
      }
    });

    if (missingDefaults.length > 0) {
      activeList = [...activeList, ...missingDefaults];
      localStorage.setItem("finheal_education_content", JSON.stringify(activeList));
    }

    setEducationContent(activeList);
    setEducationTrash(trashList);
    localStorage.setItem("finheal_education_trash", JSON.stringify(trashList));
    setEducationLoading(false);

    // 2. Tests List
    setTestCatalog(testCards);
  }, []);

  const fetchCustomTests = async (showLoading: boolean = false) => {
    try {
      if (showLoading) setTestsLoading(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {};
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }
      const res = await fetch(`${apiBase}/custom-tests`, { headers });
      if (res.ok) {
        const customTestsList = await res.json();
        const merged = [...testCards];
        customTestsList.forEach((ct: any) => {
          const idx = merged.findIndex(t => t.id === ct.id);
          if (idx !== -1) {
            merged[idx] = ct;
          } else {
            merged.push(ct);
          }
        });
        setTestCatalog(merged);
      }
    } catch (err) {
      console.error("Error loading custom tests:", err);
    } finally {
      if (showLoading) setTestsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomTests(true);
  }, []);

  // Lazy load and poll advisors/employees only when needed
  useEffect(() => {
    const shouldLoadAdvisors = !isAdmin || activeTab === "experts" || activeTab === "cibil-enquiries";
    const shouldLoadEmployees = activeTab === "employees" || activeTab === "cibil-enquiries";

    let intervalIdAdvisors: any = null;
    let intervalIdEmployees: any = null;

    if (shouldLoadAdvisors) {
      loadAdvisors(true);
      intervalIdAdvisors = setInterval(() => loadAdvisors(false), 300000); // 5 minutes polling
    }
    if (shouldLoadEmployees) {
      loadEmployees(true); // Initial load with spinner
      intervalIdEmployees = setInterval(() => loadEmployees(false), 300000); // Silent background updates
    }

    const handleUpdate = () => {
      const stored = localStorage.getItem("finheal_advisors_list");
      if (stored) {
        try { setAdvisors(JSON.parse(stored)); } catch { }
      }
      if (shouldLoadEmployees) {
        loadEmployees(false);
      }
    };

    window.addEventListener("finheal:advisors_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      if (intervalIdAdvisors) clearInterval(intervalIdAdvisors);
      if (intervalIdEmployees) clearInterval(intervalIdEmployees);
      window.removeEventListener("finheal:advisors_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [isAdmin, activeTab]);

  // Lazy load appointments based on tab or advisor workspace
  useEffect(() => {
    const shouldLoadAppointments = (!isAdmin && currentExpertId) || (isAdmin && activeTab === "appointments");
    let intervalId: any = null;

    const handleAppointmentsUpdate = () => {
      loadGlobalAppointments();
    };

    if (shouldLoadAppointments) {
      loadGlobalAppointments(true);
      intervalId = setInterval(() => loadGlobalAppointments(false), 30000); // 30s interval for appointments (low impact)
      window.addEventListener("storage", handleAppointmentsUpdate);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("storage", handleAppointmentsUpdate);
    };
  }, [isAdmin, activeTab, currentExpertId]);

  // Sync specific Advisor next slot and self-edit form
  useEffect(() => {
    if (currentExpertId && advisors.length > 0) {
      const current = advisors.find(a => a.id === currentExpertId);
      if (current) {
        setExpertNextSlot(current.nextSlot);
        setSelfEditForm({
          name: current.name || "",
          designation: current.designation || "",
          avatarUrl: current.avatarUrl || "",
          expertise: current.expertise ? current.expertise.join(", ") : "",
          strength: current.strength || "",
          bio: current.bio || "",
          fee: current.fee || 899
        });
      }
    }
  }, [currentExpertId, advisors]);

  useEffect(() => {
    if (currentExpertId && !isAdmin) {
      setReferralsLoading(true);
      listReferrals(currentExpertId)
        .then(data => {
          // Sort by latest first
          const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setReferrals(sorted);
        })
        .catch(err => console.error("Error loading referrals", err))
        .finally(() => setReferralsLoading(false));
    }
  }, [currentExpertId, isAdmin]);

  // Load test submissions
  useEffect(() => {
    if (isAdmin && activeTab === "tests") {
      loadTestSubmissions();
    }
  }, [isAdmin, activeTab]);

  const loadTestSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const data = await fetchAllTestResults();
      setTestSubmissions(data);
    } catch (err) {
      console.error("Error loading test submissions:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleDeleteTestLog = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this test log?")) return;
    try {
      await deleteAdminTestResult(id);
      setTestSubmissions((prev) => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete log.");
    }
  };

  useEffect(() => {
    if (!expertNextSlot) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setSlotDate(`${yyyy}-${mm}-${dd}`);
      setSlotFromTime("09:00 AM");
      setSlotToTime("10:00 AM");
      setAddedSlots([]);
      return;
    }
    const regex = /^([a-zA-Z]{3})\s+(\d+)\s*\([a-zA-Z]{3}\),\s*(.+)$/;
    const match = expertNextSlot.match(regex);
    if (match) {
      const [_, monthStr, dayStr, timeStr] = match;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIdx = months.indexOf(monthStr);
      if (monthIdx !== -1) {
        const currentYear = new Date().getFullYear();
        const dateObj = new Date(currentYear, monthIdx, parseInt(dayStr, 10));
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        setSlotDate(`${yyyy}-${mm}-${dd}`);

        // Split by ampersand to load multiple slots
        const ranges = timeStr.split(/\s*&\s*/);
        setAddedSlots(ranges);

        setSlotFromTime("09:00 AM");
        setSlotToTime("10:00 AM");
        return;
      }
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSlotDate(`${yyyy}-${mm}-${dd}`);
    setSlotFromTime("09:00 AM");
    setSlotToTime("10:00 AM");
    setAddedSlots([]);
  }, [expertNextSlot]);

  const loadGlobalAppointments = async (showLoading: boolean = false) => {
    try {
      if (showLoading) setAppointmentsLoading(true);
      const list = await fetchAllAppointments();
      setAllAppointments(list);
    } catch (err) {
      console.error("Error loading appointments from backend:", err);
      const list: Appointment[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("finheal_advisor_appointments:")) {
          try {
            const userAppts = JSON.parse(localStorage.getItem(key) || "[]");
            const clientEmailStr = key.replace("finheal_advisor_appointments:", "");
            userAppts.forEach((appt: any) => {
              list.push({
                ...appt,
                clientEmail: clientEmailStr === "anonymous" ? "Guest User" : clientEmailStr
              });
            });
          } catch (e) { }
        }
      }
      // Sort by date / bookedAt descending
      list.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
      setAllAppointments(list);
    } finally {
      if (showLoading) setAppointmentsLoading(false);
    }
  };

  const dispatchUpdateEvent = (eventName: string) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  // ==================== Expert CRUD Actions ====================
  const handleOpenAddExpert = () => {
    setEditingExpert(null);
    setExpertForm({
      f2FintechId: "",
      name: "",
      designation: "",
      avatarUrl: "",
      availability: "available",
      expertise: "",
      strength: "",
      bio: "",
      category: "wealth",
      customCategory: "",
      rating: 0.0,
      reviewsCount: 0,
      nextSlot: "Tomorrow, 10:00 AM",
      fee: 899,
      testComment: "",
      testRating: 5,
      department: "Founder's Office",
      isAdvisor: false,
      permissions: ["cibil_fetch", "cibil_view", "cibil_view_all", "scheduled_calls", "lenders_edit"],
      creditReportLimit: -1,
      creditReportTempLimit: "",
      creditReportTempMonth: ""
    });
    setExpertModalOpen(true);
  };

  const handleOpenEditExpert = (adv: Advisor) => {
    setEditingExpert(adv);
    const isCustomCategory = !["wealth", "tax", "debt", "property", "insurance"].includes(adv.category);
    const rawAvail = (adv.availability || "").toLowerCase().trim();
    const normAvail = rawAvail.includes("meeting")
      ? "in meeting"
      : (rawAvail.includes("available") && !rawAvail.includes("not available") && !rawAvail.includes("unavailable"))
        ? "available"
        : "unavailable";

    setExpertForm({
      f2FintechId: adv.f2FintechId || adv.id,
      name: adv.name,
      designation: adv.designation,
      avatarUrl: adv.avatarUrl,
      availability: normAvail,
      expertise: adv.expertise ? (Array.isArray(adv.expertise) ? adv.expertise.join(", ") : adv.expertise) : "",
      strength: adv.strength || "",
      bio: adv.bio || "",
      category: isCustomCategory ? "manual" : adv.category,
      customCategory: (isCustomCategory && adv.category !== "manual") ? adv.category : "",
      rating: adv.rating,
      reviewsCount: adv.reviewsCount,
      nextSlot: adv.nextSlot || "",
      fee: adv.fee || 899,
      testComment: "",
      testRating: 5,
      department: (adv.department && adv.department !== "General") ? adv.department : "Founder's Office",
      isAdvisor: adv.isAdvisor ?? false,
      permissions: adv.permissions || ["cibil_fetch", "cibil_view", "cibil_view_all", "scheduled_calls", "lenders_edit"],
      creditReportLimit: adv.creditReportLimit !== undefined && adv.creditReportLimit !== null ? adv.creditReportLimit : getDefaultCreditLimitForEmployee(adv.department, adv.designation),
      creditReportTempLimit: adv.creditReportTempLimit ?? "",
      creditReportTempMonth: adv.creditReportTempMonth ?? ""
    });
    setExpertModalOpen(true);
  };

  const handleSaveExpert = async () => {
    if (!expertForm.f2FintechId.trim()) {
      alert("F2 Fintech ID is required!");
      return;
    }
    if (!expertForm.name.trim() || !expertForm.designation.trim()) {
      alert("Name and designation are required!");
      return;
    }
    if (
      expertForm.isAdvisor &&
      expertForm.category === "manual" &&
      (!expertForm.customCategory.trim() || expertForm.customCategory.toLowerCase().trim() === "manual")
    ) {
      alert("Please write a valid custom category name (cannot be empty or 'manual').");
      return;
    }

    const resolvedCategory = expertForm.isAdvisor
      ? (expertForm.category === "manual" ? expertForm.customCategory.trim() : expertForm.category)
      : "General";

    const rawExpertise = expertForm.expertise.split(",").map((e: string) => e.trim()).filter(Boolean);
    const resolvedExpertise = rawExpertise.length > 0
      ? rawExpertise
      : resolvedCategory.split(",").map((c: string) => c.trim()).filter(Boolean);

    const f2FintechIdClean = expertForm.f2FintechId.trim();

    const item: Advisor = {
      id: f2FintechIdClean,
      f2FintechId: f2FintechIdClean,
      name: expertForm.name.trim(),
      designation: expertForm.designation.trim(),
      avatarUrl: expertForm.avatarUrl.trim(),
      availability: expertForm.availability,
      expertise: resolvedExpertise,
      strength: expertForm.strength.trim() || "Financial planning",
      bio: expertForm.bio.trim() || "Certified Financial Advisor",
      category: resolvedCategory || "General",
      rating: expertForm.rating,
      reviewsCount: expertForm.reviewsCount,
      nextSlot: expertForm.nextSlot.trim() || "Tomorrow, 10:00 AM",
      fee: Number(expertForm.fee) || 899,
      testComment: expertForm.testComment?.trim() || "",
      testRating: expertForm.testRating || 5,
      department: (expertForm.department && expertForm.department.trim() !== "General") ? expertForm.department.trim() : "Founder's Office",
      isAdvisor: expertForm.isAdvisor,
      permissions: expertForm.permissions,
      creditReportLimit: (expertForm.creditReportLimit !== undefined && expertForm.creditReportLimit !== null && String(expertForm.creditReportLimit).trim() !== "") ? Number(expertForm.creditReportLimit) : null,
      creditReportTempLimit: (expertForm.creditReportTempLimit !== undefined && expertForm.creditReportTempLimit !== null && String(expertForm.creditReportTempLimit).trim() !== "") ? Number(expertForm.creditReportTempLimit) : null,
      creditReportTempMonth: expertForm.creditReportTempMonth ? String(expertForm.creditReportTempMonth) : null,
      isActive: editingExpert ? editingExpert.isActive : true,
      deactivationReason: editingExpert ? editingExpert.deactivationReason : undefined
    };

    if (savingExpert) return;
    setSavingExpert(true);
    try {
      await saveAdvisor(item);
      await loadAdvisors();
      await loadEmployees();
      dispatchUpdateEvent("finheal:advisors_update");
      setExpertModalOpen(false);
    } catch (err) {
      console.error("Error saving advisor to backend:", err);
      alert("Failed to save expert to the database.");
    } finally {
      setSavingExpert(false);
    }
  };

  const handleDeleteExpert = (id: string) => {
    setDeleteTargetId(id);
    setAdminPassword("");
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteExpert = async () => {
    if (!adminPassword) {
      setDeleteError("Password is required.");
      return;
    }

    setIsDeletingExpert(true);
    setDeleteError(null);
    try {
      // Verify Admin Password via signInUser check
      await signInUser(userEmail, adminPassword);

      // If verification succeeds, execute deletion
      if (deleteTargetId) {
        await deleteAdvisor(deleteTargetId);
        await loadAdvisors();
        await loadEmployees();
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setAdminPassword("");
      alert("Employee deleted successfully.");
    } catch (err) {
      console.error("Verification or deletion failed:", err);
      setDeleteError("Invalid Admin password. Access denied.");
    } finally {
      setIsDeletingExpert(false);
    }
  };

  const handleToggleActive = async (adv: any) => {
    const nextStatus = adv.isActive !== false ? false : true;
    const label = adv.isAdvisor ? "Advisor" : "Employee";
    if (nextStatus) {
      // Activating: clear deactivation reason automatically
      try {
        await updateAdvisorActiveStatus(adv.f2FintechId || adv.id, true);
        alert(`${label} ${adv.name} has been activated successfully.`);
        await loadAdvisors();
        await loadEmployees();
      } catch (err) {
        console.error(`Failed to activate ${label.toLowerCase()}:`, err);
        alert(`Error activating ${label.toLowerCase()}.`);
      }
    } else {
      // Deactivating: prompt for reason
      setDeactivateTarget(adv);
      setDeactivateReason("");
      setDeactivateConfirmOpen(true);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const label = deactivateTarget.isAdvisor ? "Advisor" : "Employee";
    setIsDeactivating(true);
    try {
      await updateAdvisorActiveStatus(deactivateTarget.f2FintechId || deactivateTarget.id, false, deactivateReason);
      alert(`${label} ${deactivateTarget.name} has been deactivated.`);
      setDeactivateConfirmOpen(false);
      setDeactivateTarget(null);
      setDeactivateReason("");
      await loadAdvisors();
      await loadEmployees();
    } catch (err) {
      console.error(`Failed to deactivate ${label.toLowerCase()}:`, err);
      alert(`Error deactivating ${label.toLowerCase()}.`);
    } finally {
      setIsDeactivating(false);
    }
  };

  // ==================== Education CRUD Actions ====================
  const handleOpenAddEdu = () => {
    setEditingContent(null);
    setEduForm({
      type: "article",
      title: "",
      level: "Beginner",
      category: "Loans",
      emoji: "📚",
      bgColor: "#E6F1FB",
      youtubeId: "",
      articleUrl: "",
      description: "",
      source: "f2fintech.com",
      readTime: "5 min read",
      duration: "5 min"
    });
    setEducationModalOpen(true);
  };

  const handleOpenEditEdu = (item: ContentItem) => {
    setEditingContent(item);
    setEduForm({
      type: item.type,
      title: item.title,
      level: item.level,
      category: item.category,
      emoji: item.emoji,
      bgColor: item.bgColor,
      youtubeId: item.youtubeId || "",
      articleUrl: item.articleUrl || "",
      description: item.description,
      source: item.source,
      readTime: item.readTime || "5 min read",
      duration: item.duration || "5 min"
    });
    setEducationModalOpen(true);
  };

  const handleSaveEdu = () => {
    if (!eduForm.title.trim() || !eduForm.description.trim()) {
      alert("Title and description are required!");
      return;
    }

    const item: ContentItem = {
      id: editingContent ? editingContent.id : `content-${Date.now()}`,
      type: eduForm.type,
      title: eduForm.title.trim(),
      level: eduForm.level,
      category: eduForm.category,
      emoji: eduForm.emoji.trim(),
      bgColor: eduForm.bgColor.trim(),
      youtubeId: eduForm.type === "video" ? eduForm.youtubeId.trim() : undefined,
      articleUrl: eduForm.type === "article" ? eduForm.articleUrl.trim() : undefined,
      description: eduForm.description.trim(),
      source: eduForm.source.trim() || "f2fintech.com",
      readTime: eduForm.type === "article" ? eduForm.readTime : undefined,
      duration: eduForm.type === "video" ? eduForm.duration : undefined
    };

    let updatedList;
    if (editingContent) {
      updatedList = educationContent.map(c => c.id === editingContent.id ? item : c);
    } else {
      updatedList = [...educationContent, item];
    }

    setEducationContent(updatedList);
    localStorage.setItem("finheal_education_content", JSON.stringify(updatedList));
    dispatchUpdateEvent("finheal:education_update");
    setEducationModalOpen(false);
  };

  const handleDeleteEdu = (id: string) => {
    const itemToDelete = educationContent.find(c => c.id === id);
    if (itemToDelete && confirm("Are you sure you want to move this educational content to Trash?")) {
      const updatedList = educationContent.filter(c => c.id !== id);
      setEducationContent(updatedList);
      localStorage.setItem("finheal_education_content", JSON.stringify(updatedList));

      const trashedItem = {
        ...itemToDelete,
        isDeleted: true,
        deletedAt: new Date().toISOString()
      };
      const updatedTrash = [...educationTrash, trashedItem];
      setEducationTrash(updatedTrash);
      localStorage.setItem("finheal_education_trash", JSON.stringify(updatedTrash));

      dispatchUpdateEvent("finheal:education_update");
    }
  };

  const handleRestoreEdu = (id: string) => {
    const itemToRestore = educationTrash.find(c => c.id === id);
    if (itemToRestore) {
      // 1. Remove from trash
      const updatedTrash = educationTrash.filter(c => c.id !== id);
      setEducationTrash(updatedTrash);
      localStorage.setItem("finheal_education_trash", JSON.stringify(updatedTrash));

      // 2. Add back to active content
      const restoredItem = { ...itemToRestore } as any;
      delete restoredItem.isDeleted;
      delete restoredItem.deletedAt;
      const updatedActive = [...educationContent, restoredItem as ContentItem];
      setEducationContent(updatedActive);
      localStorage.setItem("finheal_education_content", JSON.stringify(updatedActive));

      dispatchUpdateEvent("finheal:education_update");
    }
  };

  const handlePermanentDeleteEdu = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this content? This action cannot be undone.")) {
      const updatedTrash = educationTrash.filter(c => c.id !== id);
      setEducationTrash(updatedTrash);
      localStorage.setItem("finheal_education_trash", JSON.stringify(updatedTrash));
      dispatchUpdateEvent("finheal:education_update");
    }
  };

  // ==================== Tests CRUD Actions ====================
  const handleOpenAddTest = () => {
    setEditingTest(null);
    setTestForm({
      title: "",
      description: "",
      duration: "5 min",
      focus: "",
      result: "",
      accent: "from-[#3344e6] to-[#7c8cff]",
      questions: [],
      pillar: "money_iq"
    });
    setTestModalOpen(true);
  };

  const handleOpenEditTest = (test: TestCard) => {
    setEditingTest(test);
    setSelectedEditLevel(1);

    let initialQuestions = test.questions || [];
    if (test.id === "financial-literacy") {
      initialQuestions = (test.questions && test.questions.length > 0 ? test.questions : []).map((q, idx) => {
        const defaultQ = financialLiteracyQuestions.find(dq => dq.id === q.id);
        const level = q.level || defaultQ?.level || (idx < 20 ? 1 : idx < 40 ? 2 : 3);
        return {
          ...q,
          level
        };
      });
      if (initialQuestions.length === 0) {
        initialQuestions = financialLiteracyQuestions.map(q => ({
          id: q.id,
          level: q.level,
          questionText: q.prompt,
          options: q.options,
          correctOptionIndex: q.correctAnswer === "A" ? 0 : q.correctAnswer === "B" ? 1 : q.correctAnswer === "C" ? 2 : 3
        }));
      }
    } else if (initialQuestions.length === 0) {
      if (test.id === "credit-readiness") {
        initialQuestions = creditReadinessQuestions.map(q => ({
          id: q.id,
          questionText: q.prompt,
          options: q.options.map(opt => opt.label),
          correctOptionIndex: 0
        }));
      } else if (test.id === "emergency-fund") {
        initialQuestions = emergencyFundQuestions.map(q => ({
          id: q.id,
          questionText: q.prompt,
          options: q.options.map(opt => opt.label),
          correctOptionIndex: 0
        }));
      } else if (test.id === "debt-balance") {
        initialQuestions = debtBalanceQuestions.map(q => ({
          id: q.id,
          questionText: q.prompt,
          options: q.options.map(opt => opt.label),
          correctOptionIndex: 0
        }));
      } else if (test.id === "loan-fit") {
        initialQuestions = loanFitQuestions.map(q => ({
          id: q.id,
          questionText: q.prompt,
          options: q.options.map(opt => opt.label),
          correctOptionIndex: 0
        }));
      }
    }

    setTestForm({
      title: test.title,
      description: test.description,
      duration: test.duration,
      focus: test.focus,
      result: test.result,
      accent: test.accent,
      questions: initialQuestions,
      pillar: test.pillar || "money_iq"
    });
    setTestModalOpen(true);
  };

  const handleSaveTest = async () => {
    if (!testForm.title.trim() || !testForm.description.trim()) {
      alert("Title and description are required!");
      return;
    }

    const item: TestCard = {
      id: editingTest ? editingTest.id : `test-${Date.now()}`,
      title: testForm.title.trim(),
      description: testForm.description.trim(),
      duration: testForm.duration.trim() || "5 min",
      focus: testForm.focus.trim() || "Affordability analysis",
      result: testForm.result.trim() || "Instant diagnostic score",
      accent: testForm.accent.trim(),
      questions: testForm.questions,
      pillar: testForm.pillar
    };

    let updatedList;
    if (editingTest) {
      updatedList = testCatalog.map(t => t.id === editingTest.id ? item : t);
    } else {
      updatedList = [...testCatalog, item];
    }

    setTestCatalog(updatedList);
    dispatchUpdateEvent("finheal:tests_update");
    setTestModalOpen(false);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (configuredApiKey) {
        headers["Authorization"] = `Bearer ${configuredApiKey}`;
        headers["X-API-Key"] = configuredApiKey;
      }
      const res = await fetch(`${apiBase}/custom-tests`, {
        method: "POST",
        headers,
        body: JSON.stringify(item)
      });
      if (res.ok) {
        fetchCustomTests();
      }
    } catch (err) {
      console.error("Error syncing custom test to DB:", err);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (confirm("Are you sure you want to retire this health test?")) {
      const updatedList = testCatalog.filter(t => t.id !== id);
      setTestCatalog(updatedList);
      dispatchUpdateEvent("finheal:tests_update");

      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();
        const headers: Record<string, string> = {};
        if (configuredApiKey) {
          headers["Authorization"] = `Bearer ${configuredApiKey}`;
          headers["X-API-Key"] = configuredApiKey;
        }
        await fetch(`${apiBase}/custom-tests/${id}`, {
          method: "DELETE",
          headers
        });
        fetchCustomTests();
      } catch (err) {
        console.error("Error deleting custom test from DB:", err);
      }
    }
  };

  // ==================== Expert Workspace Actions ====================
  const handleSetExpertAvailability = async (nextAvail: string) => {
    const targetId = currentExpertId || activeExpert?.f2FintechId || activeExpert?.id;
    if (!targetId) return;
    try {
      await updateAdvisorAvailability(targetId, nextAvail);
      await loadAdvisors();
      dispatchUpdateEvent("finheal:advisors_update");
    } catch (err) {
      console.error("Error setting availability:", err);
    }
  };

  const handleAddTimeRange = () => {
    const startDate = slotStartDate || slotDate;
    const endDate = slotEndDate || startDate;
    if (!startDate) {
      alert("Please select a From Date first.");
      return;
    }
    if (!slotFromTime || !slotToTime) {
      alert("Please select both From and To times.");
      return;
    }
    const range = `${slotFromTime} - ${slotToTime}`;
    const formattedDateSlot = formatSlotValue(startDate, range, endDate);
    if (addedSlots.includes(formattedDateSlot)) {
      alert("This date & time slot has already been added.");
      return;
    }
    setAddedSlots(prev => [...prev, formattedDateSlot]);
  };

  const handleRemoveTimeRange = (index: number) => {
    setAddedSlots(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateExpertNextSlot = async () => {
    const targetId = currentExpertId || activeExpert?.f2FintechId || activeExpert?.id;
    if (!targetId) {
      alert("No active advisor session found.");
      return;
    }

    let slotsToSave = [...addedSlots];
    if (slotsToSave.length === 0) {
      const startDate = slotStartDate || slotDate;
      const endDate = slotEndDate || startDate;
      if (startDate && slotFromTime && slotToTime) {
        slotsToSave.push(formatSlotValue(startDate, `${slotFromTime} - ${slotToTime}`, endDate));
      } else {
        alert("Please add at least one date & time slot.");
        return;
      }
    }

    const combinedSlot = slotsToSave.join(" | ");
    try {
      await updateAdvisorNextSlot(targetId, combinedSlot);
      await loadAdvisors();
      dispatchUpdateEvent("finheal:advisors_update");
      alert("Available slots updated successfully!");
    } catch (err) {
      console.error("Error updating next slot:", err);
      alert("Failed to update slots.");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeExpert) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const f2FintechId = activeExpert.f2FintechId || activeExpert.id;
    try {
      const response = await uploadAdvisorAvatar(f2FintechId, file);
      setSelfEditForm(prev => ({
        ...prev,
        avatarUrl: response.url
      }));
      await loadAdvisors();
      alert("Profile photo updated successfully!");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Failed to upload avatar image: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveSelfProfile = async () => {
    if (!currentExpertId || !activeExpert) return;
    if (!selfEditForm.name.trim() || !selfEditForm.designation.trim()) {
      alert("Name and designation are required!");
      return;
    }
    const rawExpertise = selfEditForm.expertise.split(",").map((e: string) => e.trim()).filter(Boolean);
    const resolvedExpertise = rawExpertise.length > 0
      ? rawExpertise
      : activeExpert.expertise;

    const item: Advisor = {
      ...activeExpert,
      name: selfEditForm.name.trim(),
      designation: selfEditForm.designation.trim(),
      avatarUrl: selfEditForm.avatarUrl.trim(),
      expertise: resolvedExpertise,
      strength: selfEditForm.strength.trim() || "Financial planning",
      bio: selfEditForm.bio.trim() || "Certified Financial Advisor",
      fee: Number(selfEditForm.fee) || 899
    };

    try {
      await saveAdvisor(item);
      await loadAdvisors();
      alert("Your profile has been updated successfully!");
    } catch (err) {
      console.error("Error saving self profile:", err);
      alert("Failed to update profile.");
    }
  };

  const handleGenerateReferral = async () => {
    if (!currentExpertId) return;
    setGeneratingReferral(true);
    try {
      const newRef = await generateReferral(currentExpertId);
      setReferrals(prev => [newRef, ...prev]);
    } catch (err) {
      console.error("Error generating referral", err);
      alert("Failed to generate referral code.");
    } finally {
      setGeneratingReferral(false);
    }
  };

  const copyReferralLink = (code: string) => {
    const signupUrl = `${window.location.origin}/signup?ref=${code}`;
    const message = `Join me on FinHeal, the platform for professional financial advice and health. Use my invite link to get a 50% discount on premium plans and expert sessions!\n\n${signupUrl}`;
    navigator.clipboard.writeText(message);
    alert("Invite message and link copied to clipboard!");
  };

  const handleUpdatePassword = async () => {
    if (!currentExpertId || !activeExpert) return;
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from the current password.");
      return;
    }

    const f2FintechId = activeExpert.f2FintechId || activeExpert.id;
    setIsChangingPassword(true);

    try {
      await updateAdvisorPassword(f2FintechId, currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.message || "Failed to change password";
      try {
        const parsed = JSON.parse(msg);
        setPasswordError(parsed.detail || msg);
      } catch {
        setPasswordError(msg);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };


  const handleCancelAppointment = async (apptId: string) => {
    if (!cancelReason.trim()) return;
    try {
      await updateAppointmentStatus(apptId, { cancelled: true, feedback: cancelReason.trim() });
      setCancellingApptId(null);
      setCancelReason("");
      await loadGlobalAppointments();
      alert("Consultation has been cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Failed to cancel appointment.");
    }
  };

  // ---------- Reschedule handler ----------
  const generateRescheduleDateList = () => {
    const dates: { dayName: string; dayNum: number; fullStr: string }[] = [];
    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = i === 0 ? "Today" : daysShort[d.getDay()];
      const dayNum = d.getDate();
      const fullStr = `${monthsShort[d.getMonth()]} ${dayNum} (${daysShort[d.getDay()]})`;
      dates.push({ dayName, dayNum, fullStr });
    }
    return dates;
  };

  const handleRescheduleAppointment = async (apptId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both a new date and time slot.");
      return;
    }
    try {
      await rescheduleAppointment(apptId, rescheduleDate, rescheduleTime);

      // Save rescheduled apptId in localStorage
      const rescheduled = JSON.parse(localStorage.getItem("finheal_rescheduled_appts") || "[]");
      if (!rescheduled.includes(apptId)) {
        rescheduled.push(apptId);
        localStorage.setItem("finheal_rescheduled_appts", JSON.stringify(rescheduled));
      }

      setReschedulingApptId(null);
      setRescheduleDate("");
      setRescheduleTime("");
      await loadGlobalAppointments();
      alert("Consultation has been rescheduled successfully.");
      dispatchUpdateEvent("finheal:advisors_update");
    } catch (err) {
      console.error("Error rescheduling appointment:", err);
      alert("Failed to reschedule appointment.");
    }
  };

  const handleJoinMeeting = async (apptId?: string) => {
    if (!apptId) return;
    try {
      await joinAppointment(apptId);
      await loadGlobalAppointments();
    } catch (err) {
      console.error("Error joining meeting:", err);
    }
  };

  const handleRescheduleClick = (appt: any) => {
    setReschedulingApptId(appt.id || null);
    setRescheduleDate("");
    setRescheduleTime("");
    setCancellingApptId(null);
  };

  const handleStatusClick = (appt: any) => {
    setCancellingApptId(appt.id || null);
    setCancelReason("");
    setReschedulingApptId(null);
  };

  const activeExpertAppointments = allAppointments.filter(a => a.advisorId === currentExpertId);
  const expertUpcomingAppointments = activeExpertAppointments.filter(a => !a.completed && !a.cancelled && !hasSessionEnded(a.date, a.time));
  const expertPastAppointments = activeExpertAppointments.filter(a => a.completed || a.cancelled || hasSessionEnded(a.date, a.time));

  const filteredAppointments = allAppointments.filter((appt) => {
    if (filterAdvisor !== "all") {
      const matchAdv = advisors.find(a => (a.f2FintechId || a.id) === filterAdvisor || a.id === filterAdvisor);
      if (matchAdv) {
        const matchId = matchAdv.id;
        const matchF2Id = matchAdv.f2FintechId || "";

        const apptAdvIdClean = (appt.advisorId || "").toLowerCase().trim();
        const selectIdClean = matchId.toLowerCase().trim();
        const selectF2IdClean = matchF2Id.toLowerCase().trim();

        if (apptAdvIdClean !== selectIdClean && apptAdvIdClean !== selectF2IdClean) {
          return false;
        }
      } else {
        if ((appt.advisorId || "").toLowerCase().trim() !== filterAdvisor.toLowerCase().trim()) {
          return false;
        }
      }
    }

    // Status Filter
    if (filterApptStatus !== "all") {
      const isCompleted = appt.completed || hasSessionEnded(appt.date, appt.time);
      const isCancelled = appt.cancelled;
      const isPending = !appt.completed && !appt.cancelled && !hasSessionEnded(appt.date, appt.time);

      if (filterApptStatus === "completed" && !isCompleted) return false;
      if (filterApptStatus === "cancelled" && !isCancelled) return false;
      if (filterApptStatus === "pending" && !isPending) return false;
    }

    // Date Range Filter
    if (filterApptStartDate) {
      if (appt.date < filterApptStartDate) return false;
    }
    if (filterApptEndDate) {
      if (appt.date > filterApptEndDate) return false;
    }

    return true;
  });

  const filteredTests = testCatalog.filter((test) => {
    if (filterTestName !== "all" && test.title !== filterTestName) {
      return false;
    }
    return true;
  });

  const filteredSubmissions = useMemo(() => {
    return testSubmissions.filter((sub) => {
      // 1. Filter by Test Name
      if (filterTestName !== "all") {
        const subFriendlyName = TEST_NAMES[sub.test_type] || sub.test_type.replace(/_|-/g, " ");
        if (filterTestName.toLowerCase().trim() !== subFriendlyName.toLowerCase().trim()) {
          return false;
        }
      }
      // 2. Filter by search query (user name, email)
      if (submissionsSearch.trim() !== "") {
        const query = submissionsSearch.toLowerCase().trim();
        const nameMatch = (sub.user_name || "").toLowerCase().includes(query);
        const emailMatch = (sub.user_email || "").toLowerCase().includes(query);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [testSubmissions, filterTestName, submissionsSearch]);

  // Submissions pagination parameters
  const submissionsPerPage = 8;
  const totalSubPages = Math.ceil(filteredSubmissions.length / submissionsPerPage) || 1;
  const safeSubPage = Math.min(submissionsPage, totalSubPages);
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (safeSubPage - 1) * submissionsPerPage;
    return filteredSubmissions.slice(startIndex, startIndex + submissionsPerPage);
  }, [filteredSubmissions, safeSubPage]);

  const testAttemptCounts = useMemo(() => {
    const standardNames = [
      "Money IQ Arena",
      "Debt Pressure Analysis",
      "Financial Safety Score",
      "Credit Health Analyzer",
      "Loan Comfort Analysis"
    ];

    const counts: Record<string, number> = {};
    // Initialize standard tests with 0
    standardNames.forEach((name) => {
      counts[name] = 0;
    });

    // Count attempts dynamically for all submissions in the database
    testSubmissions.forEach((sub) => {
      const friendlyName = TEST_NAMES[sub.test_type] || sub.test_type.replace(/_|-/g, " ");
      counts[friendlyName] = (counts[friendlyName] || 0) + 1;
    });

    // Format for Recharts and sort by attempt count
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [testSubmissions]);

  const filteredLenders = lenderList.filter((l) => {
    if (filterLenderSearch.trim() !== "") {
      const query = filterLenderSearch.toLowerCase().trim();
      const nameMatch = (l.name || "").toLowerCase().includes(query);
      const productMatch = (l.productType || "").toLowerCase().includes(query);
      const lenderTypeMatch = (l.lenderType || "").toLowerCase().includes(query);
      if (!nameMatch && !productMatch && !lenderTypeMatch) {
        return false;
      }
    }
    return true;
  });

  const filteredEducation = educationContent.filter((item) => {
    if (filterEduType !== "all" && item.type.toLowerCase() !== filterEduType.toLowerCase()) {
      return false;
    }
    return true;
  });

  // ==================== RENDERING WORKSPACE ====================
  let hasSessionPermission = false;
  try {
    const session = JSON.parse(localStorage.getItem("finheal-auth-session") || "{}");
    hasSessionPermission = (session?.permissions || []).includes("cibil_view") || (session?.permissions || []).includes("cibil_view_all");
  } catch (e) { }

  const showAdminView = isAdmin || (activeTab === "cibil-enquiries" && (
    hasSessionPermission ||
    (activeExpert?.permissions || []).some((p: string) => p === "cibil_view" || p === "cibil_view_all")
  ));
  console.log("DEBUG ADMIN PORTAL", { isAdmin, activeExpert, userId, isEmployeeId, currentExpertId, showAdminView });
  if (!isAdmin && !isEmployeeId) {
    return (
      <main className="admin-view flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 justify-center items-center p-6 text-center animate-fade-in">
        <div className="bg-white border border-gray-150 rounded-[24px] p-[32px] max-w-[400px] w-full shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="text-[32px] text-center mb-[12px]">🔒</div>
          <h3 className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Access Denied</h3>
          <p className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
            You must be an approved active client-facing advisor to access this workspace. Please contact the Super Admin to promote your role.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-view flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">

      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 border-b border-gray-100 py-[14px] shrink-0 bg-white rounded-t-[20px] sm:py-[12px] pl-[16px] pr-[96px] sm:pl-[20px] sm:pr-[96px] 2xl:pr-[20px]">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">
            {isAdmin ? "Super Admin Portal" : "Advisor Workspace"}
          </div>
          <div className="text-[10px] text-gray-400 sm:text-[11px]">
            {isAdmin
              ? "Exclusively managing advisors, educational logs, test catalogs, and platform stats."
              : `Managing professional logs and live availability for ${activeExpert?.name || "Expert"}.`}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px] scrollbar-thin">

        {/* ========================================================================= */}
        {/* ===================== SUPER ADMIN VIEW RENDER =========================== */}
        {/* ========================================================================= */}
        {showAdminView ? (
          <div className="space-y-[24px]">

            {/* TABS MENU */}
            {isAdmin && (
              <div style={{ display: "flex", gap: "4px", borderBottom: "1.5px solid #e5e7eb", overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }} className="no-scrollbar">
                <style>{`
                  .no-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {[
                  { id: "experts", label: "🧑‍💼 Manage Experts" },
                  { id: "education", label: "📚 Manage Education" },
                  { id: "tests", label: "🧭 Manage Tests" },
                  { id: "appointments", label: "📅 Scheduled Calls" },
                  { id: "lenders", label: "🏦 Lenders Catalog" },
                  { id: "cibil-enquiries", label: "📋 CIBIL Enquiries" },
                  { id: "employees", label: "👥 Employees Directory" },
                  { id: "trash", label: "🗑️ Trash Manager" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`padding px-[16px] py-[8px] rounded-t-[12px] border-none text-[12px] font-bold cursor-pointer transition ${activeTab === t.id ? "bg-primary text-white" : "background-transparent text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}



            {/* TAB: MANAGE EXPERTS */}
            <Suspense fallback={<AdminTabFallback />}>
              {activeTab === "experts" && (
                <ExpertsTab
                  advisors={advisors}
                  advisorsLoading={advisorsLoading}
                  handleOpenAddExpert={handleOpenAddExpert}
                  handleToggleActive={handleToggleActive}
                  handleOpenEditExpert={handleOpenEditExpert}
                  handleDeleteExpert={handleDeleteExpert}
                />
              )}

              {/* TAB: MANAGE EDUCATION */}
              {activeTab === "education" && (
                <EducationTab
                  filteredEducation={filteredEducation}
                  filterEduType={filterEduType}
                  setFilterEduType={setFilterEduType}
                  educationLoading={educationLoading}
                  handleOpenAddEdu={handleOpenAddEdu}
                  handleOpenEditEdu={handleOpenEditEdu}
                  handleDeleteEdu={handleDeleteEdu}
                />
              )}

              {/* TAB: MANAGE HEALTH TESTS */}
              {activeTab === "tests" && (
                <TestsTab
                  testSubTab={testSubTab}
                  setTestSubTab={setTestSubTab}
                  filteredTests={filteredTests}
                  testCatalog={testCatalog}
                  filterTestName={filterTestName}
                  setFilterTestName={setFilterTestName}
                  testsLoading={testsLoading}
                  handleOpenAddTest={handleOpenAddTest}
                  handleOpenEditTest={handleOpenEditTest}
                  handleDeleteTest={handleDeleteTest}
                  testSubmissions={testSubmissions}
                  filteredSubmissions={filteredSubmissions}
                  paginatedSubmissions={paginatedSubmissions}
                  submissionsLoading={submissionsLoading}
                  submissionsSearch={submissionsSearch}
                  setSubmissionsSearch={setSubmissionsSearch}
                  setSubmissionsPage={setSubmissionsPage}
                  safeSubPage={safeSubPage}
                  totalSubPages={totalSubPages}
                  testAttemptCounts={testAttemptCounts}
                  handleDeleteTestLog={handleDeleteTestLog}
                />
              )}

              {/* TAB: SCHEDULED CALLS FEED */}
              {activeTab === "appointments" && (
                <AppointmentsTab
                  filteredAppointments={filteredAppointments}
                  advisors={advisors}
                  filterAdvisor={filterAdvisor}
                  setFilterAdvisor={setFilterAdvisor}
                  filterApptStatus={filterApptStatus}
                  setFilterApptStatus={setFilterApptStatus}
                  filterApptStartDate={filterApptStartDate}
                  setFilterApptStartDate={setFilterApptStartDate}
                  filterApptEndDate={filterApptEndDate}
                  setFilterApptEndDate={setFilterApptEndDate}
                  appointmentsLoading={appointmentsLoading}
                  handleDeleteAppointment={handleDeleteAppointment}
                  hasSessionEnded={hasSessionEnded}
                  renderApptNotes={renderApptNotes}
                />
              )}

              {/* TAB: MANAGE LENDERS */}
              {activeTab === "lenders" && (
                <LendersTab
                  filteredLenders={filteredLenders}
                  filterLenderSearch={filterLenderSearch}
                  setFilterLenderSearch={setFilterLenderSearch}
                  lendersLoading={lendersLoading}
                  handleOpenAddLender={handleOpenAddLender}
                  handleOpenEditLender={handleOpenEditLender}
                  handleDeleteLender={handleDeleteLender}
                />
              )}

              {/* TAB: CIBIL ENQUIRIES */}
              {activeTab === "cibil-enquiries" && (
                <CibilEnquiriesTab
                  cibilTotal={cibilTotal}
                  getDateFilterDescription={getDateFilterDescription}
                  isAdmin={isAdmin}
                  setActiveTab={setActiveTab}
                  safeCibilPage={safeCibilPage}
                  setCibilPage={setCibilPage}
                  totalPages={totalPages}
                  filterSearch={filterSearch}
                  setFilterSearch={setFilterSearch}
                  filterBureau={filterBureau}
                  setFilterBureau={setFilterBureau}
                  filterRole={filterRole}
                  setFilterRole={(val) => { setFilterRole(val); setFilterEmployee("all"); }}
                  filterEmployee={filterEmployee}
                  setFilterEmployee={setFilterEmployee}
                  allDepartments={allDepartments}
                  filterLoanType={filterLoanType}
                  setFilterLoanType={setFilterLoanType}
                  filterDate={filterDate}
                  setFilterDate={setFilterDate}
                  filterEndDate={filterEndDate}
                  setFilterEndDate={setFilterEndDate}
                  todayStr={todayStr}
                  handleExportExcel={handleExportExcel}
                  cibilLoading={cibilLoading}
                  cibilEnquiries={cibilEnquiries}
                  paginatedEnquiries={paginatedEnquiries}
                  advisors={advisors}
                  employees={employees}
                  animatingCibilRows={animatingCibilRows}
                  setViewingCibilReport={setViewingCibilReport}
                  setViewingCibilReportId={setViewingCibilReportId}
                  setViewingCibilReportUserId={setViewingCibilReportUserId}
                  handleGenerateCAM={handleGenerateCAM}
                  handleDeleteEnquiry={handleDeleteEnquiry}
                  classifyEnquiryRole={classifyEnquiryRole}
                />
              )}

              {/* TAB: EMPLOYEES DIRECTORY */}
              {activeTab === "employees" && (
                <EmployeeDirectory
                  employees={employees}
                  employeesLoading={employeesLoading}
                  handleOpenAddExpert={handleOpenAddExpert}
                  handleToggleAdvisorRole={handleToggleAdvisorRole}
                  handleToggleActive={handleToggleActive}
                  handleOpenEditExpert={handleOpenEditExpert}
                  handleDeleteExpert={handleDeleteExpert}
                  onRenameDeptClick={(deptName) => {
                    setRenameDeptError("");
                    setRenameOldDept(deptName);
                    setRenameNewDept("");
                    setRenameDeptModalOpen(true);
                  }}
                  onOpenTrash={() => setActiveTab("trash")}
                />
              )}

              {/* TAB: TRASH MANAGER */}
              {activeTab === "trash" && (
                <TrashTab
                  trashLoading={trashLoading}
                  cibilTrash={cibilTrash}
                  advisorsTrash={advisorsTrash}
                  appointmentsTrash={appointmentsTrash}
                  educationTrash={educationTrash}
                  lendersTrash={lendersTrash}
                  handleRestoreCibil={handleRestoreCibil}
                  handleRestoreAdvisor={handleRestoreAdvisor}
                  handleRestoreAppointment={handleRestoreAppointment}
                  handleRestoreEdu={handleRestoreEdu}
                  handleRestoreLender={handleRestoreLender}
                  handlePermanentDeleteEdu={handlePermanentDeleteEdu}
                />
              )}
            </Suspense>

          </div>
        ) : (
          /* ========================================================================= */
          /* ==================== ADVISOR WORKSPACE VIEW RENDER ====================== */
          /* ========================================================================= */
          <div className="space-y-[24px] animate-fade-in">
            {activeExpert ? (
              <>
                {/* Advisor Workspace Welcome Banner */}
                <div className="border border-primary/20 bg-gradient-to-br from-[#f8f9ff] to-[#f0f2ff] rounded-[20px] p-[20px] flex flex-col sm:flex-row gap-[18px] items-center">
                  <div className="relative group shrink-0">
                    {activeExpert.avatarUrl ? (
                      <img
                        src={activeExpert.avatarUrl}
                        alt={activeExpert.name}
                        className="w-[84px] h-[84px] rounded-2xl object-cover shadow-md border-2 border-white"
                      />
                    ) : (
                      <div className="w-[84px] h-[84px] rounded-2xl bg-primary/10 border-2 border-white shadow-md text-primary flex items-center justify-center font-bold text-[32px] uppercase">
                        {activeExpert.name ? activeExpert.name.charAt(0) : "U"}
                      </div>
                    )}
                    <label
                      htmlFor="avatar-upload-input"
                      className="absolute -bottom-1 -right-1 bg-primary text-white h-[28px] w-[28px] rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-md hover:scale-105 transition-all"
                      title="Upload new profile photo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </label>
                    <input
                      type="file"
                      id="avatar-upload-input"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <h2 className="text-[20px] font-serif font-bold text-gray-900">Welcome Back, {activeExpert.name}!</h2>
                    <p className="text-[12px] text-gray-500 mt-[2px]">{activeExpert.designation}</p>

                    <div className="flex flex-wrap gap-[6px] mt-[8px] justify-center sm:justify-start">
                      {activeExpert.expertise.map((exp, idx) => (
                        <span key={idx} className="bg-white border border-[#d4d8fa] text-primary text-[10px] font-bold px-[8px] py-[2px] rounded-full">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slot editor and appointments list */}
                <div className="grid gap-[20px] md:grid-cols-3">

                  {/* Left Column: Next Slot Editor & Profile Editor */}
                  <div className="md:col-span-1 space-y-[20px] h-fit">
                    {/* Card 1: Slot Editor */}
                    {activeExpert?.permissions?.includes("scheduled_calls") && (
                      <Card className="border-gray-200 shadow-xs">
                        <CardHeader className="p-[16px] pb-[4px]">
                          <CardTitle className="text-[14px] font-bold">Update Next Slot</CardTitle>
                          <CardDescription className="text-[11px] text-gray-400">Set the next available booking slot users will see on your card.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-[16px] space-y-[12px]">
                          {/* Current Configured Availability Status Box */}
                          <div className="bg-gradient-to-br from-[#f6f8ff] to-[#eff2fe] border border-[#d4d8fa] rounded-[12px] p-[10px] space-y-[6px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.5px]">Your Live Status</span>
                              {(() => {
                                const norm = (activeExpert.availability || "").toLowerCase().trim();
                                const isAvail = norm.includes("available") && !norm.includes("not available") && !norm.includes("unavailable");
                                const isInMeeting = norm.includes("meeting");
                                return isAvail ? (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-[7px] py-[2px] rounded-full border border-emerald-200">🟢 Available</span>
                                ) : isInMeeting ? (
                                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-[7px] py-[2px] rounded-full border border-indigo-200">🟣 In Meeting</span>
                                ) : (
                                  <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-[7px] py-[2px] rounded-full border border-rose-200">🔴 Not Available</span>
                                );
                              })()}
                            </div>
                            <div>
                              <span className="text-[9.5px] font-bold text-gray-400 uppercase block mb-[1px]">Configured Slot Ranges</span>
                              <p className="text-[11.5px] font-bold text-gray-900 break-words">
                                {activeExpert.nextSlot && activeExpert.nextSlot !== "Not available" ? (
                                  <span className="text-primary font-bold">📅 {activeExpert.nextSlot}</span>
                                ) : (
                                  <span className="text-gray-400 font-normal italic">No slot range configured</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-[10px]">
                            <div className="grid grid-cols-2 gap-[10px]">
                              <div>
                                <label className="text-[10.5px] font-bold text-gray-400 uppercase block mb-[2px]">From Date</label>
                                <input
                                  type="date"
                                  value={slotStartDate}
                                  onChange={(e) => {
                                    setSlotStartDate(e.target.value);
                                    if (!slotEndDate || slotEndDate < e.target.value) {
                                      setSlotEndDate(e.target.value);
                                    }
                                  }}
                                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10.5px] font-bold text-gray-400 uppercase block mb-[2px]">To Date</label>
                                <input
                                  type="date"
                                  value={slotEndDate}
                                  min={slotStartDate}
                                  onChange={(e) => setSlotEndDate(e.target.value)}
                                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium bg-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[10px]">
                              <div>
                                <label className="text-[10.5px] font-bold text-gray-400 uppercase block mb-[2px]">From Time</label>
                                <select
                                  value={slotFromTime}
                                  onChange={(e) => setSlotFromTime(e.target.value)}
                                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium bg-white"
                                >
                                  {timeSlots.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10.5px] font-bold text-gray-400 uppercase block mb-[2px]">To Time</label>
                                <select
                                  value={slotToTime}
                                  onChange={(e) => setSlotToTime(e.target.value)}
                                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium bg-white"
                                >
                                  {timeSlots.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddTimeRange}
                              className="w-full border border-primary text-primary hover:bg-primary/5 font-semibold py-[8px] rounded-[10px] text-[11.5px] transition cursor-pointer"
                            >
                              + Add Time Range
                            </button>
                          </div>
                          {addedSlots.length > 0 && (
                            <div className="space-y-[6px] bg-gray-50 p-2.5 rounded-[10px] border border-gray-100">
                              <label className="text-[10px] font-bold text-gray-400 uppercase block">Added Slots</label>
                              <div className="flex flex-wrap gap-[6px]">
                                {addedSlots.map((slotRange, idx) => (
                                  <div key={idx} className="flex items-center gap-[6px] bg-primary/10 text-primary text-[11px] font-bold px-[10px] py-[3px] rounded-full border border-primary/20">
                                    <span>{slotRange}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTimeRange(idx)}
                                      className="text-primary hover:text-rose-500 font-extrabold focus:outline-none cursor-pointer"
                                      title="Remove this slot"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={handleUpdateExpertNextSlot}
                            className="w-full bg-primary hover:opacity-90 text-white font-bold py-[9px] rounded-[10px] text-[12px] transition cursor-pointer shadow-md shadow-primary/10"
                          >
                            Save Next Slot
                          </button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Card 2: Self Profile Editor */}
                    <Card className="border-gray-200 shadow-xs">
                      <CardHeader className="p-[16px] pb-[4px]">
                        <CardTitle className="text-[14px] font-bold">Edit Profile Details</CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">Update your professional info visible to clients.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-[16px] space-y-[12px]">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-[2px]">Full Name</label>
                          <input
                            type="text"
                            value={selfEditForm.name}
                            onChange={(e) => setSelfEditForm({ ...selfEditForm, name: e.target.value })}
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-[2px]">Designation</label>
                          <input
                            type="text"
                            value={selfEditForm.designation}
                            onChange={(e) => setSelfEditForm({ ...selfEditForm, designation: e.target.value })}
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-[2px]">Expertise (Comma-separated)</label>
                          <input
                            type="text"
                            value={selfEditForm.expertise}
                            onChange={(e) => setSelfEditForm({ ...selfEditForm, expertise: e.target.value })}
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-[2px]">Core Strength</label>
                          <input
                            type="text"
                            value={selfEditForm.strength}
                            onChange={(e) => setSelfEditForm({ ...selfEditForm, strength: e.target.value })}
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-[2px]">Consultation Fee / Hr (INR)</label>
                          <input
                            type="number"
                            value={selfEditForm.fee}
                            onChange={(e) => setSelfEditForm({ ...selfEditForm, fee: Number(e.target.value) })}
                            min={0}
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-[2px]">Advisor Bio</label>
                          <textarea
                            value={selfEditForm.bio}
                            onChange={(e) => setSelfEditForm({ ...selfEditForm, bio: e.target.value })}
                            rows={3}
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px]"
                          />
                        </div>
                        <button
                          onClick={handleSaveSelfProfile}
                          className="w-full bg-primary hover:opacity-90 text-white font-bold py-[9px] rounded-[10px] text-[12px] transition cursor-pointer shadow-md shadow-primary/10"
                        >
                          Save Profile Details
                        </button>
                      </CardContent>
                    </Card>

                  </div>

                  {/* Right Column: Booked consultations list */}
                  {activeExpert?.permissions?.includes("scheduled_calls") ? (
                    <div className="md:col-span-2 space-y-[18px]">
                      {/* Section 1: Upcoming Scheduled Consultations */}
                      <div className="space-y-[10px]">
                        <h3 className="text-[13px] font-bold text-gray-900 flex items-center gap-[6px]">
                          📅 Upcoming Scheduled Consultations ({expertUpcomingAppointments.length})
                        </h3>

                        {expertUpcomingAppointments.length === 0 ? (
                          <div className="text-center py-[24px] bg-gray-50 border border-dashed rounded-[16px]">
                            <div className="text-[24px]">🕒</div>
                            <div className="text-[11px] text-gray-400 mt-[4px]">No upcoming scheduled sessions.</div>
                          </div>
                        ) : (
                          <div className="space-y-[10px]">
                            {expertUpcomingAppointments.map((appt, idx) => (
                              <div key={idx} className="border border-gray-200 bg-white p-[16px] rounded-[16px] flex flex-col gap-[10px]">
                                <div className="flex flex-col justify-between sm:flex-row sm:items-center">
                                  <div className="space-y-[4px]">
                                    <div className="text-[13px] font-bold text-gray-900 flex items-center gap-[6px] flex-wrap">
                                      {appt.clientName && (
                                        <>
                                          Client Name: <span className="text-gray-950 font-extrabold">{appt.clientName}</span>
                                          <span className="text-gray-300">|</span>
                                        </>
                                      )}
                                      Client Email: <span className="text-primary font-bold">{appt.clientEmail}</span>
                                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-[6px] py-[1.5px] rounded-full uppercase">Scheduled</span>
                                    </div>
                                    {appt.meetUrl && (
                                      <div className="text-[11.5px] text-gray-600 mt-[4px] flex items-center gap-[6px]">
                                        <span>🌐 <strong>Room Link:</strong></span>
                                        <a
                                          href={appt.meetUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline font-bold"
                                        >
                                          {appt.meetUrl}
                                        </a>
                                      </div>
                                    )}
                                    {renderApptNotes(appt.notes, appt.agenda)}
                                  </div>

                                  <div className="text-right shrink-0 mt-[10px] pt-[10px] border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0">
                                    <div className="text-[13px] font-bold text-gray-900">{appt.date}</div>
                                    <div className="text-[12px] font-semibold text-gray-400 mt-[2px]">{appt.time} (IST)</div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-[8px] pt-[8px] border-t border-gray-100/60 justify-end">
                                  {appt.meetUrl && (
                                    <a
                                      href={appt.meetUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => handleJoinMeeting(appt.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-[6px] px-[12px] rounded-[8px] text-[11px] transition shadow-xs flex items-center gap-[4px] cursor-pointer"
                                    >
                                      <span>🎥</span> {appt.joined ? "Re-join Meeting" : "Join Consultation"}
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleRescheduleClick(appt)}
                                    className="bg-primary hover:bg-opacity-95 text-white font-bold py-[6px] px-[12px] rounded-[8px] text-[11px] transition shadow-xs cursor-pointer"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => handleStatusClick(appt)}
                                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-[6px] px-[12px] rounded-[8px] text-[11px] transition cursor-pointer"
                                  >
                                    Update Status
                                  </button>
                                </div>

                                {cancellingApptId === appt.id && (
                                  <div className="mt-[4px] p-[12px] bg-rose-50/50 border border-rose-100 rounded-[12px] space-y-[8px] text-left animate-fade-in">
                                    <label className="text-[10px] font-bold text-rose-800 uppercase block">Reason for Cancellation *</label>
                                    <textarea
                                      value={cancelReason}
                                      onChange={(e) => setCancelReason(e.target.value)}
                                      placeholder="Please write why you are cancelling the call (required to cancel)..."
                                      rows={2}
                                      className="w-full px-[10px] py-[8px] border border-rose-200 rounded-[8px] text-[12px] focus:outline-none focus:border-rose-400 bg-white"
                                    />
                                    <div className="flex gap-[8px] justify-end">
                                      <button
                                        onClick={() => {
                                          setCancellingApptId(null);
                                          setCancelReason("");
                                        }}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition cursor-pointer"
                                      >
                                        Back
                                      </button>
                                      <button
                                        onClick={() => appt.id && handleCancelAppointment(appt.id)}
                                        disabled={!cancelReason.trim()}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-white bg-rose-600 rounded-[8px] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                      >
                                        Confirm Cancellation
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {reschedulingApptId === appt.id && (
                                  <div className="mt-[4px] p-[12px] bg-blue-50/50 border border-blue-100 rounded-[12px] space-y-[8px] text-left animate-fade-in">
                                    <label className="text-[10px] font-bold text-blue-800 uppercase block">Reschedule — Select New Date & Time</label>
                                    <div className="flex gap-[6px] overflow-x-auto pb-[4px] scrollbar-none">
                                      {generateRescheduleDateList().map((dt, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => { setRescheduleDate(dt.fullStr); setRescheduleTime(""); }}
                                          className={`flex flex-col items-center justify-center min-w-[54px] h-[56px] rounded-[10px] border transition cursor-pointer ${rescheduleDate === dt.fullStr
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200/40"
                                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                          <span className={`text-[9px] font-medium leading-none ${rescheduleDate === dt.fullStr ? "text-white/80" : "text-gray-400"}`}>{dt.dayName}</span>
                                          <span className="text-[14px] font-bold mt-[3px] leading-none">{dt.dayNum}</span>
                                        </button>
                                      ))}
                                    </div>
                                    {rescheduleDate && (
                                      <div className="grid grid-cols-4 gap-[6px]">
                                        {timeSlots.map((slot) => (
                                          <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setRescheduleTime(slot)}
                                            className={`py-[7px] px-[6px] rounded-[8px] text-[10.5px] font-semibold text-center border transition cursor-pointer ${rescheduleTime === slot
                                              ? "bg-blue-600/10 border-blue-600 text-blue-700 font-bold"
                                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                              }`}
                                          >
                                            {slot}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex gap-[8px] justify-end">
                                      <button
                                        onClick={() => {
                                          setReschedulingApptId(null);
                                          setRescheduleDate("");
                                          setRescheduleTime("");
                                        }}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition cursor-pointer"
                                      >
                                        Back
                                      </button>
                                      <button
                                        onClick={() => appt.id && handleRescheduleAppointment(appt.id)}
                                        disabled={!rescheduleDate || !rescheduleTime}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-white bg-blue-600 rounded-[8px] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                      >
                                        Confirm Reschedule
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Past Consultations History */}
                      <div className="space-y-[10px]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[13px] font-bold text-gray-900 flex items-center gap-[6px]">
                            📜 Past Consultations History ({expertPastAppointments.length})
                          </h3>
                        </div>

                        {expertPastAppointments.length === 0 ? (
                          <div className="text-center py-[24px] bg-gray-50 border border-dashed rounded-[16px]">
                            <div className="text-[11px] text-gray-400 mt-[4px]">No past sessions recorded.</div>
                          </div>
                        ) : (
                          <div className="space-y-[8px]">
                            {expertPastAppointments.map((appt, idx) => (
                              <div key={idx} className="border border-gray-150 bg-gray-50/40 hover:bg-gray-50/80 transition-colors p-[16px] rounded-[16px] flex flex-col gap-[10px]">
                                <div className="flex flex-col justify-between sm:flex-row sm:items-center text-left">
                                  <div className="space-y-[4px]">
                                    <div className="text-[12px] font-bold text-gray-800 flex items-center gap-[6px] flex-wrap">
                                      {appt.clientName && (
                                        <>
                                          Client: <span className="text-gray-900 font-extrabold">{appt.clientName}</span>
                                          <span className="text-gray-300">|</span>
                                        </>
                                      )}
                                      Email: <span className="text-primary/90 font-bold">{appt.clientEmail}</span>
                                      {appt.cancelled ? (
                                        <span className="text-[8.5px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 px-[6px] py-[1.5px] rounded-full uppercase">Cancelled</span>
                                      ) : appt.completed && appt.rating ? (
                                        <span className="text-[8.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 px-[6px] py-[1.5px] rounded-full uppercase">✓ Completed & Rated</span>
                                      ) : (
                                        <span className="text-[8.5px] font-extrabold bg-[#ecfdf5] text-emerald-800 border border-emerald-200 px-[6px] py-[1.5px] rounded-full uppercase">✓ Completed</span>
                                      )}
                                    </div>
                                    {appt.meetUrl && (
                                      <div className="text-[11px] text-gray-400 mt-[2px]">
                                        🌐 Room Link: <span className="font-semibold text-gray-500">{appt.meetUrl}</span>
                                      </div>
                                    )}
                                    {appt.completed && appt.rating && (
                                      <div className="flex flex-col gap-[3px] text-[11px] font-semibold text-amber-600 bg-amber-50/20 border border-amber-100/30 px-[10px] py-[6px] rounded-[10px] w-fit mt-[4px]">
                                        <div className="flex items-center gap-[4px]">
                                          <span>{"★".repeat(appt.rating || 0)}</span>
                                          <span className="text-gray-500">({appt.rating}/5 stars)</span>
                                        </div>
                                      </div>
                                    )}
                                    {appt.cancelled && appt.feedback && (
                                      <div className="text-[11px] italic text-rose-700 bg-rose-50/40 border border-rose-100/60 p-[10px] rounded-[12px] max-w-[440px] mt-[6px] flex flex-col gap-[3px] text-left">
                                        <span className="text-[9.5px] font-extrabold text-rose-800 uppercase tracking-wider block">🚫 Cancellation Reason</span>
                                        <span>&quot;{appt.feedback}&quot;</span>
                                      </div>
                                    )}
                                    {!appt.cancelled && appt.completed && appt.feedback && (
                                      <div className="text-[11px] italic text-gray-700 bg-emerald-50/40 border border-emerald-100/60 p-[10px] rounded-[12px] max-w-[440px] mt-[6px] flex flex-col gap-[3px] text-left">
                                        <span className="text-[9.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">💬 Client Feedback Review</span>
                                        <span>&quot;{appt.feedback}&quot;</span>
                                      </div>
                                    )}
                                    {!appt.completed && !appt.cancelled && (
                                      <div className="text-[10.5px] text-amber-600 font-bold mt-[4px] flex items-center gap-[4px]">
                                        <span>🕒</span> Awaiting client completion and rating
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-right shrink-0 mt-[10px] pt-[10px] border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0 text-gray-400">
                                    <div className="text-[13px] font-bold">{appt.date}</div>
                                    <div className="text-[12px] font-semibold mt-[2px]">{appt.time} (IST)</div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-[8px] pt-[8px] border-t border-gray-100/60 justify-end">
                                  {!appt.cancelled && (
                                    <>
                                      <button
                                        onClick={() => alert("We have sent the Google Calendar invite link to you and your client.")}
                                        className="bg-[#ecfdf5] hover:bg-[#d1fae5] text-emerald-800 text-[10px] font-bold px-[8px] py-[3px] rounded-[6px] border border-emerald-100 transition cursor-pointer"
                                      >
                                        Accept session
                                      </button>
                                      <button
                                        onClick={() => {
                                          setCancellingApptId(appt.id || null);
                                          setCancelReason("");
                                          setReschedulingApptId(null);
                                        }}
                                        className="border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold px-[12px] py-[6px] rounded-[8px] transition cursor-pointer"
                                      >
                                        Cancel Call
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReschedulingApptId(appt.id || null);
                                          setRescheduleDate("");
                                          setRescheduleTime("");
                                          setCancellingApptId(null);
                                        }}
                                        className="border border-blue-200 hover:bg-blue-50 text-blue-600 text-[11px] font-bold px-[12px] py-[6px] rounded-[8px] transition cursor-pointer"
                                      >
                                        Reschedule
                                      </button>
                                    </>
                                  )}
                                </div>

                                {cancellingApptId === appt.id && (
                                  <div className="mt-[4px] p-[12px] bg-rose-50/50 border border-rose-100 rounded-[12px] space-y-[8px] text-left animate-fade-in">
                                    <label className="text-[10px] font-bold text-rose-800 uppercase block">Reason for Cancellation *</label>
                                    <textarea
                                      value={cancelReason}
                                      onChange={(e) => setCancelReason(e.target.value)}
                                      placeholder="Please write why you are cancelling the call (required to cancel)..."
                                      rows={2}
                                      className="w-full px-[10px] py-[8px] border border-rose-200 rounded-[8px] text-[12px] focus:outline-none focus:border-rose-400 bg-white"
                                    />
                                    <div className="flex gap-[8px] justify-end">
                                      <button
                                        onClick={() => {
                                          setCancellingApptId(null);
                                          setCancelReason("");
                                        }}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition cursor-pointer"
                                      >
                                        Back
                                      </button>
                                      <button
                                        onClick={() => appt.id && handleCancelAppointment(appt.id)}
                                        disabled={!cancelReason.trim()}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-white bg-rose-600 rounded-[8px] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                      >
                                        Confirm Cancellation
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {reschedulingApptId === appt.id && (
                                  <div className="mt-[4px] p-[12px] bg-blue-50/50 border border-blue-100 rounded-[12px] space-y-[8px] text-left animate-fade-in">
                                    <label className="text-[10px] font-bold text-blue-800 uppercase block">Reschedule — Select New Date & Time</label>
                                    <div className="flex gap-[6px] overflow-x-auto pb-[4px] scrollbar-none">
                                      {generateRescheduleDateList().map((dt, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => { setRescheduleDate(dt.fullStr); setRescheduleTime(""); }}
                                          className={`flex flex-col items-center justify-center min-w-[54px] h-[56px] rounded-[10px] border transition cursor-pointer ${rescheduleDate === dt.fullStr
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200/40"
                                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                          <span className={`text-[9px] font-medium leading-none ${rescheduleDate === dt.fullStr ? "text-white/80" : "text-gray-400"}`}>{dt.dayName}</span>
                                          <span className="text-[14px] font-bold mt-[3px] leading-none">{dt.dayNum}</span>
                                        </button>
                                      ))}
                                    </div>
                                    {rescheduleDate && (
                                      <div className="grid grid-cols-4 gap-[6px]">
                                        {timeSlots.map((slot) => (
                                          <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setRescheduleTime(slot)}
                                            className={`py-[7px] px-[6px] rounded-[8px] text-[10.5px] font-semibold text-center border transition cursor-pointer ${rescheduleTime === slot
                                              ? "bg-blue-600/10 border-blue-600 text-blue-700 font-bold"
                                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                              }`}
                                          >
                                            {slot}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex gap-[8px] justify-end">
                                      <button
                                        onClick={() => {
                                          setReschedulingApptId(null);
                                          setRescheduleDate("");
                                          setRescheduleTime("");
                                        }}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition cursor-pointer"
                                      >
                                        Back
                                      </button>
                                      <button
                                        onClick={() => appt.id && handleRescheduleAppointment(appt.id)}
                                        disabled={!rescheduleDate || !rescheduleTime}
                                        className="px-[12px] py-[6px] text-[11px] font-bold text-white bg-blue-600 rounded-[8px] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                      >
                                        Confirm Reschedule
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="md:col-span-2 space-y-[18px]">
                      {/* Section 2: Past Consultations History */}
                      <div className="space-y-[10px] pt-[8px]">
                        <h3 className="text-[13px] font-bold text-gray-900 flex items-center gap-[6px]">
                          📜 Past Consultations History ({expertPastAppointments.length})
                        </h3>

                        {expertPastAppointments.length === 0 ? (
                          <div className="text-center py-[24px] bg-gray-50 border border-dashed rounded-[16px]">
                            <div className="text-[24px]">📜</div>
                            <div className="text-[11px] text-gray-400 mt-[4px]">No past sessions recorded.</div>
                          </div>
                        ) : (
                          <div className="space-y-[10px]">
                            {expertPastAppointments.map((appt, idx) => (
                              <div key={idx} className="border border-gray-200 bg-gray-50/50 p-[16px] rounded-[16px] flex flex-col justify-between sm:flex-row sm:items-center text-left">
                                <div className="space-y-[4px]">
                                  <div className="text-[13px] font-bold text-gray-900 flex items-center gap-[6px] flex-wrap">
                                    {appt.clientName && (
                                      <>
                                        Client Name: <span className="text-gray-950 font-extrabold">{appt.clientName}</span>
                                        <span className="text-gray-300">|</span>
                                      </>
                                    )}
                                    Client Email: <span className="text-gray-650 font-bold">{appt.clientEmail}</span>
                                    {appt.cancelled ? (
                                      <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-[6px] py-[1.5px] rounded-full uppercase">🚫 Cancelled</span>
                                    ) : appt.completed && appt.rating ? (
                                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-[6px] py-[1.5px] rounded-full uppercase">✓ Completed & Rated</span>
                                    ) : (
                                      <span className="text-[9px] font-bold bg-[#ecfdf5] text-emerald-800 border border-emerald-200 px-[6px] py-[1.5px] rounded-full uppercase">✓ Completed</span>
                                    )}
                                  </div>
                                  {appt.meetUrl && (
                                    <div className="text-[11px] text-gray-400 mt-[2px]">
                                      🌐 Room Link: <span className="font-semibold text-gray-500">{appt.meetUrl}</span>
                                    </div>
                                  )}
                                  {appt.completed && appt.rating && (
                                    <div className="flex flex-col gap-[3px] text-[11px] font-semibold text-amber-600 bg-amber-50/20 border border-amber-100/30 px-[10px] py-[6px] rounded-[10px] w-fit mt-[4px]">
                                      <div className="flex items-center gap-[4px]">
                                        <span>{"★".repeat(appt.rating || 0)}</span>
                                        <span className="text-gray-500">({appt.rating}/5 stars)</span>
                                      </div>
                                    </div>
                                  )}
                                  {appt.cancelled && appt.feedback && (
                                    <div className="text-[11px] italic text-rose-700 bg-rose-50/40 border border-rose-100/60 p-[10px] rounded-[12px] max-w-[440px] mt-[6px] flex flex-col gap-[3px] text-left">
                                      <span className="text-[9.5px] font-extrabold text-rose-800 uppercase tracking-wider block">🚫 Cancellation Reason</span>
                                      <span>&quot;{appt.feedback}&quot;</span>
                                    </div>
                                  )}
                                  {!appt.cancelled && appt.completed && appt.feedback && (
                                    <div className="text-[11px] italic text-gray-700 bg-emerald-50/40 border border-emerald-100/60 p-[10px] rounded-[12px] max-w-[440px] mt-[6px] flex flex-col gap-[3px] text-left">
                                      <span className="text-[9.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">💬 Client Feedback Review</span>
                                      <span>&quot;{appt.feedback}&quot;</span>
                                    </div>
                                  )}
                                  {!appt.completed && !appt.cancelled && (
                                    <div className="text-[10.5px] text-amber-600 font-bold mt-[4px] flex items-center gap-[4px]">
                                      <span>🕒</span> Awaiting client completion and rating
                                    </div>
                                  )}
                                </div>

                                <div className="text-right shrink-0 mt-[10px] pt-[10px] border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0 text-gray-400">
                                  <div className="text-[13px] font-bold">{appt.date}</div>
                                  <div className="text-[12px] font-semibold mt-[2px]">{appt.time} (IST)</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  }
                </div>

                {/* Section 3: Referral Engine */}
                <div className="border border-[#e0e7ff] bg-gradient-to-r from-[#f8faff] to-[#f3f6ff] rounded-[20px] p-[20px] shadow-sm animate-fade-in mt-[20px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[16px] gap-[12px]">
                    <div>
                      <h3 className="text-[15px] font-bold text-indigo-900 flex items-center gap-[8px]">
                        🎁 Refer & Earn (Advisor Referral Engine)
                      </h3>
                      <p className="text-[12px] text-indigo-600/80 mt-[2px]">
                        Generate unique referral invites for your clients. They get a 50% discount on premium plans and sessions.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateReferral}
                      disabled={generatingReferral}
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] transition cursor-pointer shadow-md shadow-indigo-200"
                    >
                      {generatingReferral ? "Generating..." : "+ Generate Unique Invite"}
                    </button>
                  </div>

                  <div className="border border-white/50 rounded-[16px] overflow-x-auto bg-white/60 shadow-inner">
                    <table className="w-full min-w-[700px] text-left text-[12px] border-collapse">
                      <thead>
                        <tr className="bg-indigo-50/50 border-b border-indigo-100 text-indigo-800/70 font-bold">
                          <th className="p-[12px]">Referral Code</th>
                          <th className="p-[12px]">Status</th>
                          <th className="p-[12px]">Generated On</th>
                          <th className="p-[12px]">Expires On</th>
                          <th className="p-[12px] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralsLoading ? (
                          <tr>
                            <td colSpan={5} className="text-center p-6 text-indigo-400 font-medium">Loading referral history...</td>
                          </tr>
                        ) : referrals.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-6 text-indigo-400 font-medium">No referrals generated yet. Click the button above to create one!</td>
                          </tr>
                        ) : (
                          referrals.map((ref) => (
                            <tr key={ref.id} className="border-b border-indigo-50/50 hover:bg-white/80 transition-colors">
                              <td className="p-[12px]">
                                <span className="font-mono font-bold text-indigo-900 bg-white border border-indigo-100 px-[8px] py-[3px] rounded-[6px] tracking-widest">{ref.code}</span>
                              </td>
                              <td className="p-[12px]">
                                {ref.status === "pending" ? (
                                  <span className="bg-amber-100 text-amber-800 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-amber-200 uppercase tracking-wider">Pending</span>
                                ) : (
                                  <span className="bg-emerald-100 text-emerald-800 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">Used</span>
                                )}
                              </td>
                              <td className="p-[12px] text-indigo-600/80 font-medium">
                                {new Date(ref.created_at + "Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="p-[12px] text-indigo-600/80 font-medium">
                                {new Date(ref.expires_at + "Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="p-[12px] text-right">
                                <button
                                  onClick={() => copyReferralLink(ref.code)}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold bg-white border border-indigo-200 hover:border-indigo-300 px-[12px] py-[4px] rounded-[8px] cursor-pointer transition shadow-xs"
                                >
                                  Copy Link
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section: CIBIL Enquiries */}
                {(activeExpert?.permissions?.includes("cibil_view") || activeExpert?.permissions?.includes("cibil_view_all")) && (
                  <div className="border border-gray-200 rounded-[20px] p-[20px] bg-white shadow-sm space-y-[16px] text-left animate-fade-in mt-[20px]">
                    <div className="border-b border-gray-100 pb-3 space-y-3">
                      {/* Row 1: Title & Pagination */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-[6px]">
                            📋 CIBIL Credit Score Enquiries ({cibilEnquiries.length})
                          </h3>
                          <p className="text-[10px] text-gray-400 mt-[2px]">
                            {getDateFilterDescription()}
                          </p>
                        </div>

                        {/* Compact Pagination Controls */}
                        {cibilEnquiries.length > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              disabled={safeCibilPage === 1}
                              onClick={() => setCibilPage(prev => Math.max(prev - 1, 1))}
                              className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-650 transition flex items-center justify-center cursor-pointer"
                              title="Previous Page"
                            >
                              ←
                            </button>
                            <span className="text-[11px] font-semibold text-gray-500 px-1 min-w-[36px] text-center">
                              {safeCibilPage} / {totalPages}
                            </span>
                            <button
                              disabled={safeCibilPage === totalPages}
                              onClick={() => setCibilPage(prev => Math.min(prev + 1, totalPages))}
                              className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-650 transition flex items-center justify-center cursor-pointer"
                              title="Next Page"
                            >
                              →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Row 2: Filters & Export */}
                      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 pt-1">
                        {/* Active Loan Type Filter Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 font-semibold">Active Loan Type:</span>
                          <select
                            value={filterLoanType}
                            onChange={(e) => setFilterLoanType(e.target.value)}
                            className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                          >
                            <option value="all">All Loan Types</option>
                            <option value="home">Home Loan</option>
                            <option value="personal">Personal Loan</option>
                            <option value="professional">Professional Loan</option>
                            <option value="creditcard">Credit Card</option>
                            <option value="auto">Auto / Vehicle Loan</option>
                            <option value="business">Business Loan</option>
                            <option value="gold">Gold Loan</option>
                            <option value="education">Education Loan</option>
                            <option value="property">Loan Against Property (LAP)</option>
                            <option value="other">Other Loans</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-gray-500 font-semibold">From:</span>
                          <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            max={todayStr}
                            className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                          />
                          <span className="text-[11px] text-gray-500 font-semibold">To:</span>
                          <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            max={todayStr}
                            className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                          />
                          {(filterDate || filterEndDate || filterRole !== "all" || filterLoanType !== "all") && (
                            <button
                              onClick={() => { setFilterDate(""); setFilterEndDate(""); setFilterRole("all"); setFilterLoanType("all"); }}
                              className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-650 cursor-pointer transition"
                            >
                              Reset Filters
                            </button>
                          )}
                          {cibilEnquiries.length > 0 && (
                            <button
                              onClick={handleExportExcel}
                              className="h-[32px] px-[12px] rounded-[10px] bg-primary text-white hover:bg-opacity-95 text-[11px] font-bold shadow-xs cursor-pointer transition flex items-center gap-1"
                              title="Export leads to Excel workbook (.xlsx)"
                            >
                              📥 Export Leads (Excel)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-[16px] overflow-x-auto bg-white shadow-xs">
                      <table className="w-full min-w-[800px] text-left text-[12px] border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                            <th className="p-[12px]">User Identity</th>
                            <th className="p-[12px]">Bureau</th>
                            <th className="p-[12px]">PAN Card</th>
                            <th className="p-[12px]">Credit Score</th>
                            <th className="p-[12px]">Date & Time</th>
                            <th className="p-[12px] text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cibilLoading ? (
                            <tr>
                              <td colSpan={6} className="text-center p-6 text-gray-400">
                                {filterBureau === "experian"
                                  ? "Loading Experian enquiries..."
                                  : filterBureau === "cibil"
                                    ? "Loading CIBIL enquiries..."
                                    : "Loading all enquiries..."}
                              </td>
                            </tr>
                          ) : cibilEnquiries.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center p-6 text-gray-400">
                                {filterDate
                                  ? `No ${filterBureau === "experian" ? "Experian" : filterBureau === "cibil" ? "CIBIL" : ""} inquiries found for this particular day.`
                                  : `No ${filterBureau === "experian" ? "Experian" : filterBureau === "cibil" ? "CIBIL" : ""} inquiries found on the platform.`}
                              </td>
                            </tr>
                          ) : (
                            paginatedEnquiries.map((enq) => {
                              let scoreColorClass = "text-red-500";
                              let bandText = "Poor";
                              if (enq.score >= 750) {
                                scoreColorClass = "text-emerald-600";
                                bandText = "Excellent";
                              } else if (enq.score >= 700) {
                                scoreColorClass = "text-green-500";
                                bandText = "Good";
                              } else if (enq.score >= 630) {
                                scoreColorClass = "text-amber-500";
                                bandText = "Fair";
                              }

                              const role = classifyEnquiryRole(enq.email, enq.name, advisors);

                              return (
                                <tr key={enq.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-500 ease-in-out ${animatingCibilRows.includes(enq.id) ? "opacity-0 -translate-x-full scale-95" : ""}`}>
                                  <td className="p-[12px] max-w-[220px] break-words">
                                    <strong className="text-gray-900 block">{enq.name}</strong>
                                    {enq.email && <span className="text-[10px] text-gray-400 block">{enq.email}</span>}
                                    {enq.phone && <span className="text-[10px] text-gray-400 block">📞 {enq.phone}</span>}
                                    <div className="mt-[4px]">
                                      <span className={`inline-flex items-center px-[6px] py-[1.5px] rounded-full text-[8.5px] font-extrabold uppercase border ${role === "Admin"
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : role === "Senior Leadership"
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : role === "Manager"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-250"
                                        }`}>
                                        {role === "User" ? "User (Lead)" : role}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-[12px]">
                                    <span className={`inline-flex px-[8px] py-[2px] rounded-full text-[9px] font-bold uppercase ${enq.bureau.toLowerCase() === "experian"
                                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                                      : "bg-blue-100 text-blue-700 border border-blue-200"
                                      }`}>
                                      {enq.bureau}
                                    </span>
                                  </td>
                                  <td className="p-[12px] font-mono font-semibold text-gray-700 uppercase">
                                    {enq.pan || "-"}
                                  </td>
                                  <td className="p-[12px]">
                                    <span className={`text-[15px] font-extrabold ${scoreColorClass}`}>
                                      {enq.score}
                                    </span>
                                    <span className="text-[10px] text-gray-450 block font-medium">
                                      {bandText}
                                    </span>
                                  </td>
                                  <td className="p-[12px] text-gray-500">
                                    {new Date(enq.fetched_at && !enq.fetched_at.endsWith("Z") && !enq.fetched_at.includes("+") ? `${enq.fetched_at}Z` : enq.fetched_at).toLocaleString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </td>
                                  <td className="p-[12px] text-right">
                                    {enq.report_data ? (
                                      <button
                                        onClick={() => {
                                          setViewingCibilReport({
                                            ...(enq.report_data || {}),
                                            name: enq.name,
                                            phone: enq.phone,
                                            email: enq.email,
                                            bureau: enq.bureau || "CIBIL"
                                          });
                                          setViewingCibilReportId(enq.id);
                                        }}
                                        className="text-primary hover:underline font-bold text-[11px] block ml-auto cursor-pointer border-none bg-transparent"
                                      >
                                        View Report ↗
                                      </button>
                                    ) : enq.pdf_url ? (
                                      <a
                                        href={enq.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-bold text-[11px] block"
                                      >
                                        View PDF ↗
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 block">-</span>
                                    )}
                                    <button
                                      onClick={() => handleGenerateCAM(enq.user_id, enq.name, enq.id)}
                                      className="text-emerald-600 hover:underline font-bold text-[10px] block mt-1 ml-auto cursor-pointer border-none bg-transparent"
                                    >
                                      Generate CAM 📊
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEnquiry(enq.id)}
                                      className="text-rose-600 hover:underline font-bold text-[10px] block mt-1 ml-auto cursor-pointer border-none bg-transparent"
                                    >
                                      Delete Inquiry 🗑️
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Bottom Pagination Controls */}
                    {cibilEnquiries.length > 0 && (
                      <div className="flex items-center justify-end gap-1.5 pt-2">
                        <button
                          disabled={safeCibilPage === 1}
                          onClick={() => setCibilPage(prev => Math.max(prev - 1, 1))}
                          className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-650 transition flex items-center justify-center cursor-pointer"
                          title="Previous Page"
                        >
                          ←
                        </button>
                        <span className="text-[11px] font-semibold text-gray-500 px-1 min-w-[36px] text-center">
                          {safeCibilPage} / {totalPages}
                        </span>
                        <button
                          disabled={safeCibilPage === totalPages}
                          onClick={() => setCibilPage(prev => Math.min(prev + 1, totalPages))}
                          className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-650 transition flex items-center justify-center cursor-pointer"
                          title="Next Page"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-[48px]">
                <div className="text-[32px]">⚠️</div>
                <div className="text-[14px] font-bold text-gray-800 mt-[8px]">Expert Profile Match Failed</div>
                <div className="text-[11px] text-gray-400 mt-[4px]">We couldn&apos;t load advisor credentials mapped to this email. Please check configuration.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ===================== EXPERT ADD/EDIT POPUP MODAL ======================= */}
      {/* ========================================================================= */}
      {expertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingExpert ? `Edit Profile: ${editingExpert.name}` : "Add New Advisor Profile"}
              </h3>
              <button onClick={() => setExpertModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[60vh] scrollbar-thin">
              <div className="grid grid-cols-2 gap-[10px]">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">F2 Fintech ID (Manager Login User/ID) *</label>
                  <input
                    type="text"
                    value={expertForm.f2FintechId}
                    onChange={(e) => setExpertForm({ ...expertForm, f2FintechId: e.target.value })}
                    placeholder="e.g. sneha@finheal.com or unique-manager-id"
                    disabled={!!editingExpert}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white disabled:bg-gray-100 disabled:text-gray-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Full Name</label>
                  <input
                    type="text"
                    value={expertForm.name}
                    onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
                    placeholder="e.g. Sneha Reddy"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Designation</label>
                  <input
                    type="text"
                    value={expertForm.designation}
                    onChange={(e) => {
                      const newDesig = e.target.value;
                      const defaultLimit = getDefaultCreditLimitForEmployee(expertForm.department, newDesig);
                      setExpertForm({
                        ...expertForm,
                        designation: newDesig,
                        creditReportLimit: expertForm.creditReportLimit === -1 || expertForm.creditReportLimit === 50 || expertForm.creditReportLimit === 300
                          ? defaultLimit
                          : expertForm.creditReportLimit
                      });
                    }}
                    placeholder="e.g. CFP / Portfolio Manager"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Department</label>
                  <select
                    value={expertForm.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const defaultLimit = getDefaultCreditLimitForEmployee(newDept, expertForm.designation);
                      setExpertForm({
                        ...expertForm,
                        department: newDept,
                        creditReportLimit: defaultLimit
                      });
                    }}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Founder's Office">Founder's Office</option>
                    <option value="Product">Product</option>
                    <option value="Credit & Operations">Credit & Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="Human Resource">Human Resource</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Avatar URL</label>
                <input
                  type="text"
                  value={expertForm.avatarUrl}
                  onChange={(e) => setExpertForm({ ...expertForm, avatarUrl: e.target.value })}
                  placeholder="Unsplash image link"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              {/* Is Advisor Checkbox */}
              <div className="py-2 flex items-center gap-[8px]">
                <input
                  type="checkbox"
                  id="is-advisor-checkbox"
                  checked={expertForm.isAdvisor}
                  onChange={(e) => setExpertForm({ ...expertForm, isAdvisor: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-350 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="is-advisor-checkbox" className="text-[12px] font-bold text-gray-700 cursor-pointer select-none">
                  Is Active Client-Facing Advisor (Offers consultations)
                </label>
              </div>

              {/* Permissions Checklist & Quota Configuration */}
              <div className="border border-indigo-100 bg-[#f7f8ff] p-[16px] rounded-[16px] space-y-[10px]">
                <label className="text-[12px] font-bold text-indigo-800 uppercase tracking-[0.5px] block">
                  Permissions / Feature Access
                </label>
                <div className="grid grid-cols-2 gap-[10px]">
                  {[
                    { key: "cibil_fetch", label: "Credit Report Fetching" },
                    { key: "cibil_view", label: "View Credit Records" },
                    { key: "cibil_view_all", label: "View All Credit Reports" },
                    { key: "scheduled_calls", label: "Manage Call Calendars" },
                    { key: "lenders_edit", label: "Edit Lenders Catalog" },
                  ].map((perm) => {
                    const isChecked = expertForm.permissions?.includes(perm.key);
                    return (
                      <div key={perm.key} className="flex items-center gap-[6px] py-[2px]">
                        <input
                          type="checkbox"
                          id={`perm-checkbox-${perm.key}`}
                          checked={isChecked}
                          onChange={(e) => {
                            const nextPerms = e.target.checked
                              ? [...(expertForm.permissions || []), perm.key]
                              : (expertForm.permissions || []).filter((k) => k !== perm.key);
                            setExpertForm({ ...expertForm, permissions: nextPerms });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <label
                          htmlFor={`perm-checkbox-${perm.key}`}
                          className="text-[11.5px] font-medium text-gray-700 cursor-pointer select-none"
                        >
                          {perm.label}
                        </label>
                      </div>
                    );
                  })}
                </div>

                {/* Monthly Credit Report Limits Configuration */}
                {expertForm.permissions?.includes("cibil_fetch") && (
                  <div className="mt-3 pt-3 border-t border-indigo-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-[0.5px]">
                        Credit Report Monthly Limit
                      </span>
                      <span className="text-[9.5px] font-semibold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-full">
                        CIBIL + Experian Combined
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Base Recurring Monthly Limit */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700 flex items-center justify-between">
                          <span>Base Monthly Limit</span>
                          <span className="text-[9.5px] text-gray-400 font-medium">
                            {expertForm.department === "Founder's Office" ? "Default: Unlimited" : expertForm.department?.includes("Credit") ? "Default: 300" : "Default: 50"}
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={expertForm.creditReportLimit === -1 ? "" : (expertForm.creditReportLimit ?? "")}
                            disabled={expertForm.creditReportLimit === -1}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 50 : Number(e.target.value);
                              setExpertForm({ ...expertForm, creditReportLimit: val });
                            }}
                            placeholder={expertForm.creditReportLimit === -1 ? "Unlimited" : "e.g. 50, 300"}
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px] focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextLimit = expertForm.creditReportLimit === -1
                                ? (getDefaultCreditLimitForEmployee(expertForm.department, expertForm.designation) === -1 ? 50 : getDefaultCreditLimitForEmployee(expertForm.department, expertForm.designation))
                                : -1;
                              setExpertForm({ ...expertForm, creditReportLimit: nextLimit });
                            }}
                            className={`px-2.5 py-1.5 rounded-[8px] text-[10px] font-bold border transition shrink-0 cursor-pointer ${
                              expertForm.creditReportLimit === -1
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {expertForm.creditReportLimit === -1 ? "Unlimited ✓" : "Unlimited"}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Resets every month automatically (Founder/Admin: Unlimited, Credit & Ops: 300, Sales: 50).
                        </p>
                      </div>

                      {/* Current Month Active Override */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700 flex items-center justify-between">
                          <span>Current Month Override</span>
                          <span className="text-[9.5px] text-amber-600 font-bold uppercase">
                            {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })} Only
                          </span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={expertForm.creditReportTempLimit ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? null : Number(e.target.value);
                            const currentYm = new Date().toISOString().substring(0, 7);
                            setExpertForm({
                              ...expertForm,
                              creditReportTempLimit: val,
                              creditReportTempMonth: val !== null ? currentYm : null
                            });
                          }}
                          placeholder="e.g. 55, 310"
                          className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[12px] focus:outline-none focus:border-primary bg-white"
                        />
                        <p className="text-[10px] text-amber-700/90 leading-tight">
                          💡 Temporary boost for active month. Automatically reverts to base limit next month.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {expertForm.isAdvisor && (
                <>

                  <div className="grid grid-cols-2 gap-[10px]">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Category</label>
                      <select
                        value={expertForm.category}
                        onChange={(e) => setExpertForm({ ...expertForm, category: e.target.value as any })}
                        className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                      >
                        <option value="wealth">Wealth & Investing</option>
                        <option value="tax">Tax & Retirement</option>
                        <option value="debt">Debt & Credit</option>
                        <option value="property">Real Estate</option>
                        <option value="insurance">Insurance</option>
                        <option value="manual">Manual Type</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Initial Availability</label>
                      <select
                        value={expertForm.availability}
                        onChange={(e) => setExpertForm({ ...expertForm, availability: e.target.value as any })}
                        className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white font-medium"
                      >
                        <option value="available">Available (Green dot)</option>
                        <option value="unavailable">Not Available (Red dot)</option>
                        <option value="in meeting">In Meeting (Indigo dot)</option>
                      </select>
                    </div>
                  </div>

                  {expertForm.category === "manual" && (
                    <div className="mt-[4px] border border-blue-50 bg-blue-50/20 p-[10px] rounded-[12px]">
                      <label className="text-[11px] font-bold text-[#3344e6] uppercase tracking-[0.5px] block mb-[4px]">Write Own Category</label>
                      <input
                        type="text"
                        value={expertForm.customCategory}
                        onChange={(e) => setExpertForm({ ...expertForm, customCategory: e.target.value })}
                        placeholder="e.g. Mutual Fund Consultant"
                        autoFocus
                        className="w-full px-[10px] py-[8px] border border-[#d4d8fa] rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Consultation Fee / Hr (INR)</label>
                    <input
                      type="number"
                      value={expertForm.fee}
                      onChange={(e) => setExpertForm({ ...expertForm, fee: Number(e.target.value) })}
                      placeholder="e.g. 899"
                      min={0}
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Expertise Tags</label>
                    <input
                      type="text"
                      value={expertForm.expertise}
                      onChange={(e) => setExpertForm({ ...expertForm, expertise: e.target.value })}
                      placeholder="e.g. Stock Markets, Tax, Debt repair"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Core Strength</label>
                    <input
                      type="text"
                      value={expertForm.strength}
                      onChange={(e) => setExpertForm({ ...expertForm, strength: e.target.value })}
                      placeholder="e.g. Dynamic Asset allocation"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Advisor Bio</label>
                    <textarea
                      value={expertForm.bio}
                      onChange={(e) => setExpertForm({ ...expertForm, bio: e.target.value })}
                      placeholder="A short profile paragraph explaining their professional focus..."
                      rows={3}
                      className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="border border-amber-100 bg-amber-50/20 p-[12px] rounded-[16px] space-y-[6px]">
                    <label className="text-[12.5px] font-bold text-amber-700 uppercase tracking-[0.5px] block">
                      Add a Comment
                    </label>

                    <div className="flex items-center gap-[6px] py-[2px]">
                      <span className="text-[11px] font-bold text-amber-800 tracking-[0.3px]">Rating:</span>
                      <div className="flex items-center gap-[4px]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setTestReviewHoverRating(star)}
                            onMouseLeave={() => setTestReviewHoverRating(0)}
                            onClick={() => setExpertForm({ ...expertForm, testRating: star })}
                            className="text-[20px] cursor-pointer transition-all duration-150 hover:scale-125 border-none bg-transparent outline-none focus:outline-none select-none p-0"
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                          >
                            <span
                              className={`transition-colors duration-150 ${star <= (testReviewHoverRating || expertForm.testRating)
                                ? "text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]"
                                : "text-gray-200"
                                }`}
                            >
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100/50 px-[6px] py-[2px] rounded-full">
                        {expertForm.testRating} Star{expertForm.testRating > 1 ? "s" : ""}
                      </span>
                    </div>

                    <textarea
                      value={expertForm.testComment}
                      onChange={(e) => setExpertForm({ ...expertForm, testComment: e.target.value })}
                      placeholder="e.g. Excellent advice! (Writing here creates a completed test appointment in the database with the selected Rating above)."
                      rows={2}
                      className="w-full px-[12px] py-[8px] border border-amber-200 rounded-[10px] text-[12px] focus:outline-none focus:border-amber-500 bg-white placeholder-gray-400 text-gray-800"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button onClick={() => setExpertModalOpen(false)} className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSaveExpert}
                disabled={savingExpert}
                className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
              >
                {savingExpert ? "Saving..." : "Save Expert"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== DELETE PASSWORD VERIFICATION MODAL ================== */}
      {/* ========================================================================= */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-rose-50/50">
              <h3 className="text-[13px] font-bold text-rose-950 flex items-center gap-[8px]">
                ⚠️ Verify Admin Password
              </h3>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[14px]">
              <p className="text-[12px] leading-relaxed text-gray-600">
                You are about to permanently delete this employee record.
                This action cannot be undone. To authorize, please enter your Admin password:
              </p>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[6px]">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-rose-500 bg-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleConfirmDeleteExpert();
                    }
                  }}
                />
              </div>

              {deleteError && (
                <div className="p-[10px] bg-rose-50 border border-rose-100 rounded-[10px] text-[11.5px] text-rose-700 font-medium">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteExpert}
                disabled={isDeletingExpert || !adminPassword}
                className="flex-1 py-[11px] bg-rose-600 text-white font-bold rounded-[12px] text-[12px] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
              >
                {isDeletingExpert ? "Verifying..." : "Delete Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== DELETE LENDER PRODUCT CONFIRMATION MODAL ============ */}
      {/* ========================================================================= */}
      {lenderDeleteConfirmOpen && lenderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col animate-scale-up">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-rose-50/50">
              <h3 className="text-[13px] font-bold text-rose-950 flex items-center gap-[8px]">
                ⚠️ Delete Lender Product
              </h3>
              <button
                onClick={() => setLenderDeleteConfirmOpen(false)}
                className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[14px]">
              <p className="text-[12px] leading-relaxed text-gray-600">
                Are you sure you want to permanently delete the loan product <strong className="text-gray-800">{lenderToDelete.name} — {lenderToDelete.productType}</strong>?
                This action cannot be undone and will remove it from the catalogue.
              </p>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button
                onClick={() => setLenderDeleteConfirmOpen(false)}
                className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteLender}
                disabled={isDeletingLender}
                className="flex-1 py-[11px] bg-rose-600 text-white font-bold rounded-[12px] text-[12px] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
              >
                {isDeletingLender ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== BULK RENAME DEPARTMENT MODAL ======================= */}
      {/* ========================================================================= */}
      {renameDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col animate-scale-up">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[13px] font-bold text-gray-900 flex items-center gap-[8px]">
                🏢 Bulk Rename Department
              </h3>
              <button
                onClick={() => setRenameDeptModalOpen(false)}
                className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[14px]">
              <p className="text-[11px] leading-relaxed text-gray-500">
                This will rename the department for all matching employees in the directory.
              </p>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[6px]">
                  Select Department
                </label>
                <select
                  value={renameOldDept}
                  onChange={(e) => setRenameOldDept(e.target.value)}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary bg-white cursor-pointer"
                >
                  <option value="">-- Choose Department --</option>
                  {Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[6px]">
                  New Department Name
                </label>
                <input
                  type="text"
                  value={renameNewDept}
                  onChange={(e) => setRenameNewDept(e.target.value)}
                  placeholder="e.g. Sales"
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary bg-white"
                />
              </div>

              {renameDeptError && (
                <div className="p-[10px] bg-rose-50 border border-rose-100 rounded-[10px] text-[11px] text-rose-700 font-medium">
                  {renameDeptError}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button
                onClick={() => setRenameDeptModalOpen(false)}
                className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameDepartment}
                disabled={renamingDept || !renameOldDept || !renameNewDept}
                className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
              >
                {renamingDept ? "Renaming..." : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DEACTIVATE ADVISOR REASON MODAL ==================== */}
      {deactivateConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-amber-50/50">
              <h3 className="text-[13px] font-bold text-amber-950 flex items-center gap-[8px]">
                🚫 Deactivate {deactivateTarget?.isAdvisor ? "Advisor" : "Employee"} Profile
              </h3>
              <button
                onClick={() => setDeactivateConfirmOpen(false)}
                className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[14px]">
              <p className="text-[12px] leading-relaxed text-gray-600">
                Please enter the reason for temporarily deactivating <strong>{deactivateTarget?.name}</strong>:
              </p>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[6px]">
                  Deactivation Reason
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="e.g. Leave of absence, health reasons, temporary assignment"
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-amber-500 bg-white min-h-[80px]"
                  autoFocus
                />
              </div>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button
                onClick={() => setDeactivateConfirmOpen(false)}
                className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivate}
                disabled={isDeactivating || !deactivateReason.trim()}
                className="flex-1 py-[11px] bg-amber-600 text-white font-bold rounded-[12px] text-[12px] hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
              >
                {isDeactivating ? "Updating..." : "Deactivate Profile"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* =================== EDUCATION ADD/EDIT POPUP MODAL ====================== */}
      {/* ========================================================================= */}
      {educationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingContent ? `Edit Dynamic Content` : "Add Educational Article or Video"}
              </h3>
              <button onClick={() => setEducationModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[60vh] scrollbar-thin">
              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Resource Type</label>
                  <select
                    value={eduForm.type}
                    onChange={(e) => setEduForm({ ...eduForm, type: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="article">📄 Article</option>
                    <option value="video">🎥 YouTube Video</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Difficulty Level</label>
                  <select
                    value={eduForm.level}
                    onChange={(e) => setEduForm({ ...eduForm, level: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Resource Title</label>
                <input
                  type="text"
                  value={eduForm.title}
                  onChange={(e) => setEduForm({ ...eduForm, title: e.target.value })}
                  placeholder="e.g. 5 Strategies to cut your tax"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Category Topic</label>
                  <select
                    value={eduForm.category}
                    onChange={(e) => setEduForm({ ...eduForm, category: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Loans">Loans</option>
                    <option value="Credit">Credit</option>
                    <option value="Savings">Savings</option>
                    <option value="Debt">Debt</option>
                    <option value="Tax">Tax</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Icon Emoji</label>
                  <input
                    type="text"
                    value={eduForm.emoji}
                    onChange={(e) => setEduForm({ ...eduForm, emoji: e.target.value })}
                    placeholder="e.g. 📚"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {eduForm.type === "article" ? (
                <div className="grid grid-cols-2 gap-[10px]">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Article URL Link</label>
                    <input
                      type="text"
                      value={eduForm.articleUrl}
                      onChange={(e) => setEduForm({ ...eduForm, articleUrl: e.target.value })}
                      placeholder="https://f2fintech.com/blogs/..."
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Estimated Read Time</label>
                    <input
                      type="text"
                      value={eduForm.readTime}
                      onChange={(e) => setEduForm({ ...eduForm, readTime: e.target.value })}
                      placeholder="e.g. 5 min read"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-[10px]">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">YouTube Video ID</label>
                    <input
                      type="text"
                      value={eduForm.youtubeId}
                      onChange={(e) => setEduForm({ ...eduForm, youtubeId: e.target.value })}
                      placeholder="YouTube ID (e.g., _efmpZ5k9S8)"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Video Duration</label>
                    <input
                      type="text"
                      value={eduForm.duration}
                      onChange={(e) => setEduForm({ ...eduForm, duration: e.target.value })}
                      placeholder="e.g. 5 min"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Short Description Summary</label>
                <textarea
                  value={eduForm.description}
                  onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                  placeholder="Describe what the user will learn from this educational content card..."
                  rows={3}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button onClick={() => setEducationModalOpen(false)} className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveEdu} className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md">
                Save Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===================== TESTS ADD/EDIT POPUP MODAL ======================== */}
      {/* ========================================================================= */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[650px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingTest ? `Edit Test Catalog Card` : "Add New Financial Health Test Card"}
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[16px] overflow-y-auto max-h-[70vh] scrollbar-thin">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Test Card Title</label>
                <input
                  type="text"
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="e.g. Budget Affordability Review"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Test Duration</label>
                  <input
                    type="text"
                    value={testForm.duration}
                    onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })}
                    placeholder="e.g. 5 min"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Card Gradient Accent</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={testForm.accent}
                      onChange={(e) => setTestForm({ ...testForm, accent: e.target.value })}
                      className="flex-1 px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white cursor-pointer"
                    >
                      <option value="from-[#3344e6] to-[#7c8cff]">Royal Blue to Purple</option>
                      <option value="from-[#10b981] to-[#34d399]">emerald Green</option>
                      <option value="from-[#f59e0b] to-[#fbbf24]">amber Orange</option>
                      <option value="from-[#06b6d4] to-[#22d3ee]">cyan Blue</option>
                      <option value="from-[#8b5cf6] to-[#a78bfa]">lavender Violet</option>
                    </select>
                    {/* Live Gradient Color Ball Preview */}
                    <div
                      className={`w-[28px] h-[28px] rounded-full border border-gray-200 shrink-0 shadow-inner bg-gradient-to-r ${testForm.accent}`}
                      title="Selected Gradient Preview"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Core Focus Area</label>
                <input
                  type="text"
                  value={testForm.focus}
                  onChange={(e) => setTestForm({ ...testForm, focus: e.target.value })}
                  placeholder="e.g. Monthly cashflows and emergency buffers"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Result Output Style</label>
                <input
                  type="text"
                  value={testForm.result}
                  onChange={(e) => setTestForm({ ...testForm, result: e.target.value })}
                  placeholder="e.g. Diagnostic Safety score + buffer tips"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Target Wellness Pillar</label>
                <select
                  value={testForm.pillar}
                  onChange={(e) => setTestForm({ ...testForm, pillar: e.target.value })}
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white cursor-pointer"
                >
                  <option value="money_iq">Money IQ</option>
                  <option value="debt_health">Debt Health</option>
                  <option value="financial_safety">Financial Safety</option>
                  <option value="credit_health">Credit Health</option>
                  <option value="loan_comfort">Loan Comfort</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Card Description Summary</label>
                <textarea
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  placeholder="Describe what the health test assesses..."
                  rows={3}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              {/* ===================== QUESTIONS SECTION (Google Forms Style) ===================== */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.8px]">Questions ({testForm.questions?.length || 0})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newQ = {
                        id: `q-${Date.now()}-${testForm.questions?.length || 0}`,
                        level: editingTest?.id === "financial-literacy" ? selectedEditLevel : undefined,
                        questionText: "",
                        options: ["Option 1", "Option 2"],
                        correctOptionIndex: 0
                      };
                      setTestForm({ ...testForm, questions: [...(testForm.questions || []), newQ] });
                    }}
                    className="px-[12px] py-[6px] bg-primary text-white rounded-[10px] text-[11px] font-bold cursor-pointer hover:opacity-95 transition flex items-center gap-[4px]"
                  >
                    + Add Question
                  </button>
                </div>

                {editingTest?.id === "financial-literacy" && (
                  <div className="mb-4 p-3 bg-indigo-50/40 border border-indigo-100 rounded-[14px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-[0.5px]">Filter by Test Level:</span>
                      <select
                        value={selectedEditLevel}
                        onChange={(e) => setSelectedEditLevel(Number(e.target.value))}
                        className="px-[12px] py-[6px] border border-indigo-200 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white cursor-pointer font-semibold text-indigo-900"
                      >
                        <option value={1}>Beginner (Level 1)</option>
                        <option value={2}>Intermediate (Level 2)</option>
                        <option value={3}>Advanced (Level 3)</option>
                      </select>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      Showing {testForm.questions.filter((q: any) => q.level === selectedEditLevel).length} of {testForm.questions.length} questions
                    </span>
                  </div>
                )}

                {(!testForm.questions || testForm.questions.length === 0) ? (
                  <div className="text-center py-8 border border-dashed border-gray-200 rounded-[16px] text-gray-400 text-[11px]">
                    No questions added yet. Click "+ Add Question" to start building your quiz.
                  </div>
                ) : editingTest?.id === "financial-literacy" && testForm.questions.filter((q: any) => q.level === selectedEditLevel).length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-indigo-200 rounded-[16px] text-indigo-400/80 text-[11px] bg-indigo-50/10">
                    No questions added yet for Level {selectedEditLevel}. Click "+ Add Question" to add one to this level.
                  </div>
                ) : (
                  <div className="space-y-[16px]">
                    {testForm.questions.map((q, qIndex) => {
                      if (editingTest?.id === "financial-literacy" && q.level !== selectedEditLevel) {
                        return null;
                      }
                      return (
                        <div
                          key={q.id || qIndex}
                          draggable
                          onDragStart={(e) => {
                            const target = e.currentTarget;
                            target.classList.add("shadow-[0_25px_50px_-12px_rgba(50,68,230,0.25)]", "scale-[1.03]", "border-primary/60", "bg-white", "rotate-[1.5deg]", "z-50");
                            e.dataTransfer.effectAllowed = "move";
                            setTimeout(() => {
                              target.classList.remove("shadow-[0_25px_50px_-12px_rgba(50,68,230,0.25)]", "scale-[1.03]", "border-primary/60", "bg-white", "rotate-[1.5deg]", "z-50");
                              setDraggedIndex(qIndex);
                            }, 0);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={() => {
                            if (draggedIndex !== null && draggedIndex !== qIndex) {
                              const updated = [...testForm.questions];
                              const draggedItem = updated[draggedIndex];
                              updated.splice(draggedIndex, 1);
                              updated.splice(qIndex, 0, draggedItem);
                              setDraggedIndex(qIndex);
                              setTestForm({ ...testForm, questions: updated });
                            }
                          }}
                          onDragEnd={() => setDraggedIndex(null)}
                          className={`p-[16px] bg-gray-50 border rounded-[18px] transition relative ${draggedIndex === qIndex
                            ? "border-dashed border-primary opacity-40 bg-primary/5 scale-[0.98]"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >

                          {/* Question Input */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-[6px]">
                              <div className="flex items-center gap-[6px]">
                                {/* Drag Handle Dot Pattern */}
                                <div
                                  className="text-gray-400 cursor-grab active:cursor-grabbing font-bold text-[14px] select-none hover:text-gray-600 px-[4px] py-[2px] rounded hover:bg-gray-200/50 flex items-center justify-center transition"
                                  title="Drag to reorder question"
                                >
                                  ⠿
                                </div>
                                <span className="text-[11px] font-bold text-gray-700">Question {qIndex + 1}</span>
                              </div>
                              <div className="flex items-center gap-[12px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = testForm.questions.filter((_, idx) => idx !== qIndex);
                                    setTestForm({ ...testForm, questions: updated });
                                  }}
                                  className="text-red-500 hover:text-red-700 text-[11px] font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={q.questionText}
                              onChange={(e) => {
                                const updated = [...testForm.questions];
                                updated[qIndex] = { ...q, questionText: e.target.value };
                                setTestForm({ ...testForm, questions: updated });
                              }}
                              placeholder="e.g. What is the recommended emergency fund size?"
                              className="w-full px-[12px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                            />
                          </div>

                          {/* Options Input List */}
                          <div className="space-y-[8px]">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] block">Options (Select radio for correct answer)</span>
                            {q.options.map((opt: string, oIndex: number) => (
                              <div key={oIndex} className="flex items-center gap-[8px]">
                                <input
                                  type="radio"
                                  name={`correct-${q.id || qIndex}`}
                                  checked={q.correctOptionIndex === oIndex}
                                  onChange={() => {
                                    const updated = [...testForm.questions];
                                    updated[qIndex] = { ...q, correctOptionIndex: oIndex };
                                    setTestForm({ ...testForm, questions: updated });
                                  }}
                                  className="h-[16px] w-[16px] text-primary border-gray-300 focus:ring-primary cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...testForm.questions];
                                    const newOpts = [...q.options];
                                    newOpts[oIndex] = e.target.value;
                                    updated[qIndex] = { ...q, options: newOpts };
                                    setTestForm({ ...testForm, questions: updated });
                                  }}
                                  placeholder={`Option ${oIndex + 1}`}
                                  className="flex-1 px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[11px] focus:outline-none focus:border-primary bg-white"
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...testForm.questions];
                                      const newOpts = q.options.filter((_: string, idx: number) => idx !== oIndex);
                                      let nextCorrect = q.correctOptionIndex;
                                      if (q.correctOptionIndex === oIndex) {
                                        nextCorrect = 0;
                                      } else if (q.correctOptionIndex > oIndex) {
                                        nextCorrect -= 1;
                                      }
                                      updated[qIndex] = { ...q, options: newOpts, correctOptionIndex: nextCorrect };
                                      setTestForm({ ...testForm, questions: updated });
                                    }}
                                    className="text-gray-400 hover:text-red-500 text-[14px] cursor-pointer font-bold px-[4px]"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...testForm.questions];
                                updated[qIndex] = { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
                                setTestForm({ ...testForm, questions: updated });
                              }}
                              className="text-primary hover:opacity-90 font-bold text-[10px] cursor-pointer"
                            >
                              + Add Option
                            </button>
                          </div>

                        </div>
                      );
                    })}

                    {/* Append-only Add Question button at the very bottom of the list */}
                    <div className="flex justify-center pt-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = {
                            id: `q-${Date.now()}-${testForm.questions?.length || 0}`,
                            level: editingTest?.id === "financial-literacy" ? selectedEditLevel : undefined,
                            questionText: "",
                            options: ["Option 1", "Option 2"],
                            correctOptionIndex: 0
                          };
                          setTestForm({ ...testForm, questions: [...(testForm.questions || []), newQ] });
                        }}
                        className="px-[14px] py-[8px] bg-primary text-white rounded-[10px] text-[12px] font-bold cursor-pointer hover:opacity-95 transition flex items-center gap-[4px]"
                      >
                        + Add Question
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button onClick={() => setTestModalOpen(false)} className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveTest} className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md">
                Save Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===================== LENDERS ADD/EDIT POPUP MODAL ======================= */}
      {/* ========================================================================= */}
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
                    {Array.from(new Set(lenderList.map(l => l.name).filter(Boolean))).sort().map(name => (
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
                    value={lenderForm.category || "home"}
                    onChange={(e) => handleUpdateLenderField({ category: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white animate-fade-in"
                  >
                    <option value="home">Home Loan</option>
                    <option value="personal">Personal Loan</option>
                    <option value="professional">Professional Loan</option>
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
                    type="number"
                    step="0.01"
                    value={lenderForm.minRate || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minRate: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lenderForm.maxRate || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxRate: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Tenure (Y)</label>
                  <input
                    type="number"
                    value={lenderForm.minTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minTenureYears: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Tenure (Y)</label>
                  <input
                    type="number"
                    value={lenderForm.maxTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxTenureYears: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min CIBIL</label>
                  <input
                    type="number"
                    value={lenderForm.minCibil || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minCibil: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max FOIR (%)</label>
                  <input
                    type="number"
                    value={lenderForm.maxFoirPct || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxFoirPct: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Monthly Income</label>
                  <input
                    type="number"
                    value={lenderForm.minMonthlyIncome || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minMonthlyIncome: Number(e.target.value) })}
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
                    type="number"
                    value={lenderForm.minAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minAmount: Number(e.target.value) })}
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
                    type="number"
                    value={lenderForm.maxAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxAmount: Number(e.target.value) })}
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
              <button onClick={handleSaveLender} className="px-[16px] py-[8px] bg-primary text-white hover:opacity-90 rounded-[10px] text-[12px] font-bold cursor-pointer animate-pulse-ring">
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingCibilReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in cibil-modal-backdrop">
          <div className="bg-white rounded-[24px] max-w-[1100px] w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[90vh] max-h-[850px] animate-scale-up cibil-modal-content">
            <div className="flex items-center justify-between border-b border-gray-100 px-[25px] py-[18px] bg-[#f9faff] shrink-0 cibil-print-hide">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 flex flex-wrap items-center gap-2">
                  <span>Credit Score Report:</span>
                  <span className="text-primary font-extrabold">{viewingCibilReport.name}</span>
                  {(viewingCibilReport.pan || (viewingCibilReport.phone && viewingCibilReport.phone !== "-")) && (
                    <span className="text-[11.5px] text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-md font-sans">
                      {viewingCibilReport.pan ? `PAN: ${viewingCibilReport.pan}` : ""}
                      {viewingCibilReport.pan && viewingCibilReport.phone && viewingCibilReport.phone !== "-" ? " | " : ""}
                      {viewingCibilReport.phone && viewingCibilReport.phone !== "-" ? `Mobile: ${viewingCibilReport.phone}` : ""}
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => {
                  setViewingCibilReport(null);
                  setViewingCibilReportId(null);
                  setViewingCibilReportUserId(null);
                }}
                className="text-[22px] text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent transition font-bold leading-none p-1"
                title="Close Report"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 cibil-modal-scroll">
              <Suspense fallback={<AdminTabFallback />}>
                <CibilAnalyzerView
                  userId={viewingCibilReportUserId || "anonymous"}
                  overrideReport={viewingCibilReport}
                  reportId={viewingCibilReportId || undefined}
                  onToggleSidebar={() => { }}
                  onToggleInsights={() => { }}
                  onTalkToAdvisor={() => {
                    setViewingCibilReport(null);
                    setViewingCibilReportId(null);
                    setViewingCibilReportUserId(null);
                    setLocation("/advisor");
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CIBIL ENQUIRY CONFIRMATION MODAL ============ */}
      {cibilDeleteConfirmOpen && cibilToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[420px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col animate-scale-up transition-all duration-500">

            <div className={`flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] transition-colors duration-500 ${cibilDeleteResult ? (cibilDeleteResult.includes("Error") || cibilDeleteResult.includes("Failed") ? 'bg-rose-50/50' : 'bg-emerald-50/50') : 'bg-amber-50/50'}`}>
              <h3 className={`text-[14px] font-bold flex items-center gap-[8px] transition-colors duration-500 ${cibilDeleteResult ? (cibilDeleteResult.includes("Error") || cibilDeleteResult.includes("Failed") ? 'text-rose-950' : 'text-emerald-950') : 'text-amber-950'}`}>
                {cibilDeleteResult ? (
                  <span className="animate-scale-up inline-flex items-center gap-2">
                    {cibilDeleteResult.includes("Error") || cibilDeleteResult.includes("Failed") ? '❌ Error' : '✅ Success'}
                  </span>
                ) : '⚠️ Move to Trash'}
              </h3>
              <button
                onClick={() => {
                  setCibilDeleteConfirmOpen(false);
                  setCibilToDelete(null);
                  setCibilDeleteResult(null);
                }}
                className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-[22px] space-y-[14px]">
              <p className="text-[13px] leading-relaxed text-gray-700 min-h-[40px] flex items-center relative overflow-hidden">
                {cibilDeleteResult ? (
                  <span className="block animate-fade-in absolute w-full">{cibilDeleteResult}</span>
                ) : (
                  <span className="block transition-opacity duration-300">Are you sure you want to move this enquiry to trash? It can be restored within 3 days before it is permanently deleted.</span>
                )}
              </p>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px] transition-all duration-500">
              {cibilDeleteResult ? (
                <button
                  onClick={() => {
                    const idToAnimate = cibilToDelete;
                    setCibilDeleteConfirmOpen(false);
                    setCibilToDelete(null);
                    setCibilDeleteResult(null);

                    if (idToAnimate && !cibilDeleteResult.includes("Error") && !cibilDeleteResult.includes("Failed")) {
                      setAnimatingCibilRows(prev => [...prev, idToAnimate]);
                      setTimeout(() => {
                        fetchCibilEnquiries();
                        setAnimatingCibilRows(prev => prev.filter(id => id !== idToAnimate));
                      }, 400);
                    } else {
                      fetchCibilEnquiries();
                    }
                  }}
                  className="flex-1 py-[11px] bg-gray-900 text-white font-bold rounded-[12px] text-[13px] hover:bg-gray-800 transition-all active:scale-[0.98] cursor-pointer shadow-md animate-fade-in"
                >
                  OK
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setCibilDeleteConfirmOpen(false);
                      setCibilToDelete(null);
                    }}
                    className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[13px] font-bold text-gray-700 hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDeleteCibil}
                    disabled={isDeletingCibil}
                    className="flex-1 py-[11px] bg-amber-500 text-white font-bold rounded-[12px] text-[13px] hover:bg-amber-600 disabled:opacity-80 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer shadow-md flex items-center justify-center gap-[8px]"
                  >
                    {isDeletingCibil && (
                      <svg className="animate-spin h-[14px] w-[14px] text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isDeletingCibil ? "Moving..." : "OK"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showLimitWarning && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-amber-100 rounded-[24px] p-6 max-w-sm w-full mx-4 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <div>
              <h4 className="text-[14px] font-extrabold text-gray-800">CIBIL Fetch Threshold</h4>
              <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed font-medium">
                You have fetched a total of <strong>{limitFetchCount}</strong> CIBIL reports. Please verify your usage guidelines.
              </p>
            </div>
            <button
              onClick={() => setShowLimitWarning(false)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
