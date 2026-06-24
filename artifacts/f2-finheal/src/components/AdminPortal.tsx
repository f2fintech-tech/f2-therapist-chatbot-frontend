import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAdminStats, type BackendStats, fetchAdvisors, saveAdvisor, deleteAdvisor, updateAdvisorAvailability, updateAdvisorNextSlot, fetchAllAppointments, uploadAdvisorAvatar, updateAppointmentStatus, rescheduleAppointment, updateAdvisorPassword, isAdvisorSlotActive, generateReferral, listReferrals, type ReferralCode } from "@/lib/backendAuth";
import { advisorsData, type Advisor, hasSessionEnded } from "@/components/AdvisorPanel";
import { getEffectiveAvailability } from "@/utils/availability";
import { CONTENT, type ContentItem } from "@/components/FinancialEducation";
import { testCards, type TestCard } from "@/components/FinancialHealthTestCatalog";
import { type LenderProduct } from "./LoanCalculatorView";
interface AdminPortalProps {
  userId: string;
  userEmail: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
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
}

export function classifyEnquiryRole(email: string, name: string, advisors: any[] = []): "Admin" | "Manager" | "Senior Leadership" | "User" {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanName = (name || "").toLowerCase().trim();

  // 1. Admin Classification
  if (
    cleanEmail === "admin@finheal.com" ||
    cleanEmail === "admin@f2finheal.com" ||
    cleanEmail.startsWith("admin@") ||
    cleanName.includes("admin") ||
    cleanName === "finheal admin"
  ) {
    return "Admin";
  }

  // 2. Senior Leadership Classification
  const leadershipPrefixes = ["ceo", "cto", "cfo", "coo", "vp", "president", "founder", "director", "exec", "executive"];
  const isInternalDomain = cleanEmail.endsWith("@finheal.com") || cleanEmail.endsWith("@f2finheal.com") || cleanEmail.endsWith("@f2fintech.com");

  const hasLeadershipEmail = leadershipPrefixes.some(pref => cleanEmail.startsWith(`${pref}@`) || cleanEmail.includes(`.${pref}@`) || cleanEmail.includes(`-${pref}@`));
  const hasLeadershipName = cleanName.includes("ceo") || cleanName.includes("cto") || cleanName.includes("cfo") || cleanName.includes("coo") || cleanName.includes("vp") || cleanName.includes("president") || cleanName.includes("founder") || cleanName.includes("director") || cleanName.includes("executive");

  if ((isInternalDomain && hasLeadershipEmail) || hasLeadershipName) {
    return "Senior Leadership";
  }

  // 3. Manager Classification
  // Check against advisors list
  const isAdvisor = advisors.some(adv => {
    const advId = (adv.f2FintechId || adv.id || "").toLowerCase().trim();
    const advEmail = (adv.email || "").toLowerCase().trim();
    const advName = (adv.name || "").toLowerCase().trim();
    return (
      (cleanEmail && (cleanEmail === advId || cleanEmail === advEmail)) ||
      (cleanName && cleanName === advName)
    );
  });

  const managerPrefixes = ["manager", "advisor", "lead", "supervisor", "head"];
  const hasManagerEmail = managerPrefixes.some(pref => cleanEmail.startsWith(`${pref}@`));
  const hasManagerName = cleanName.includes("manager") || cleanName.includes("advisor") || cleanName.includes("lead") || cleanName.includes("head") || cleanName.includes("supervisor");

  if (isAdvisor || hasManagerEmail || (isInternalDomain && hasManagerName)) {
    return "Manager";
  }

  // 4. Regular User / Lead
  return "User";
}

export default function AdminPortal({ userId, userEmail, onToggleSidebar, onToggleInsights }: AdminPortalProps) {
  const isAdmin = userEmail === "admin@finheal.com" || userEmail === "admin@f2finheal.com";



  // Active Admin Tabs: experts, education, tests, appointments, lenders, cibil-enquiries
  // Dynamic URL Routing for admin tabs (replacing local useState to support URLs like /admin/tests)
  const [match, params] = useRoute("/admin/:tab");
  const [_, setLocation] = useLocation();
  const activeTab = (match && params?.tab && ["experts", "education", "tests", "appointments", "lenders", "cibil-enquiries"].includes(params.tab))
    ? (params.tab as "experts" | "education" | "tests" | "appointments" | "lenders" | "cibil-enquiries")
    : "experts";

  const setActiveTab = (newTab: "experts" | "education" | "tests" | "appointments" | "lenders" | "cibil-enquiries") => {
    setLocation(`/admin/${newTab}`);
  };

  // State Management
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [educationContent, setEducationContent] = useState<ContentItem[]>([]);
  const [testCatalog, setTestCatalog] = useState<TestCard[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  // Lenders Catalog States
  const [lenderList, setLenderList] = useState<LenderProduct[]>([]);
  const [lendersLoading, setLendersLoading] = useState(false);
  const [lenderModalOpen, setLenderModalOpen] = useState(false);
  const [editingLender, setEditingLender] = useState<LenderProduct | null>(null);
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
  });

  // Loading and Error States
  const [statsLoading, setStatsLoading] = useState(false);
  const [savingExpert, setSavingExpert] = useState(false);

  // Edit / Add Modal States
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Advisor | null>(null);

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
    testRating: 5
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
    accent: "from-[#3344e6] to-[#7c8cff]"
  });

  // Next Slot state for specific Advisor Workspace
  const [expertNextSlot, setExpertNextSlot] = useState("");
  const [slotDate, setSlotDate] = useState("");
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

  const formatSlotValue = (dateStr: string, timeStr: string): string => {
    if (!dateStr || !timeStr) return "";
    const dateObj = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[dateObj.getDay()];
    return `${month} ${day} (${dayName}), ${timeStr}`;
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

  const currentExpertId = getExpertIdFromEmail(userEmail);

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

  // CIBIL Enquiries State and Fetcher
  const [cibilEnquiries, setCibilEnquiries] = useState<any[]>([]);
  const [cibilLoading, setCibilLoading] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [cibilPage, setCibilPage] = useState<number>(1);
  const cibilPageSize = 15;

  // Reset page when filterDate or filterRole changes
  useEffect(() => {
    setCibilPage(1);
  }, [filterDate, filterRole]);

  const filteredEnquiries = cibilEnquiries.filter((enq) => {
    // 0. Filter by Manager ownership (if logged-in user is not Super Admin)
    if (!isAdmin) {
      const cleanUserEmail = (userEmail || "").toLowerCase().trim();
      const cleanEnqEmail = (enq.email || "").toLowerCase().trim();
      const cleanExpertId = (currentExpertId || "").toLowerCase().trim();
      const cleanEnqUserId = (enq.user_id || "").toLowerCase().trim();

      const isFetchedByMe = 
        (cleanUserEmail && cleanEnqEmail === cleanUserEmail) ||
        (cleanExpertId && cleanEnqUserId === cleanExpertId) ||
        (cleanExpertId && cleanEnqEmail.startsWith(cleanExpertId + "@"));
      
      if (!isFetchedByMe) return false;
    }

    // 1. Filter by Date
    if (filterDate) {
      if (!enq.fetched_at) return false;
      const utcStr = enq.fetched_at.endsWith("Z") || enq.fetched_at.includes("+") ? enq.fetched_at : `${enq.fetched_at}Z`;
      const localDate = new Date(utcStr);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      if (localDateStr !== filterDate) return false;
    }

    // 2. Filter by Role
    if (filterRole !== "all") {
      const role = classifyEnquiryRole(enq.email, enq.name, advisors);
      if (role !== filterRole) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredEnquiries.length / cibilPageSize) || 1;
  const safeCibilPage = Math.min(cibilPage, totalPages);
  const paginatedEnquiries = filteredEnquiries.slice(
    (safeCibilPage - 1) * cibilPageSize,
    safeCibilPage * cibilPageSize
  );

  const handleExportCSV = () => {
    if (filteredEnquiries.length === 0) return;

    // Header row
    const headers = ["Name", "Phone", "Email", "CIBIL Score", "Bureau", "Existing Open Accounts", "Date Fetched"];

    // Map rows
    const rows = filteredEnquiries.map(enq => {
      // 1. Get only active (open) accounts
      const activeAccountsList = (enq.accounts || []).filter((acc: any) => acc.is_active === true || acc.is_active === "true" || acc.is_active === 1);

      // 2. Format active accounts list
      const formattedAccounts = activeAccountsList.length > 0
        ? activeAccountsList.map((acc: any) => {
          const bal = acc.outstanding_balance !== undefined ? acc.outstanding_balance : 0;
          return `${acc.lender} (${acc.type}) - Bal: Rs.${bal}`;
        }).join("; ")
        : "No open accounts";

      // 3. Date formatting
      const dateFormatted = enq.fetched_at
        ? new Date(enq.fetched_at.endsWith("Z") || enq.fetched_at.includes("+") ? enq.fetched_at : `${enq.fetched_at}Z`).toLocaleString("en-IN")
        : "-";

      return [
        enq.name || "Guest",
        enq.phone || "-",
        enq.email || "-",
        enq.score || "-",
        enq.bureau || "CIBIL",
        formattedAccounts,
        dateFormatted
      ];
    });

    // Convert to CSV string, escaping quotes
    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(val => {
          const strVal = String(val);
          // Escape double quotes by doubling them
          const escaped = strVal.replace(/"/g, '""');
          // If it contains commas, quotes, or newlines, wrap in quotes
          if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n") || escaped.includes(";")) {
            return `"${escaped}"`;
          }
          return escaped;
        }).join(",")
      )
    ].join("\n");

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const roleName = filterRole === "all" ? "All" : filterRole === "User" ? "Leads" : filterRole;
    const dateStr = filterDate ? `_${filterDate}` : "";
    link.setAttribute("href", url);
    link.setAttribute("download", `FinHeal_CIBIL_${roleName}_Enquiries${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateCAM = async (userId: string, name: string) => {
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
      const res = await fetch(`${apiBase}/cibil/enquiries`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCibilEnquiries(data);
      }
    } catch (err) {
      console.error("Error loading CIBIL enquiries:", err);
    } finally {
      setCibilLoading(false);
    }
  };

  useEffect(() => {
    if ((isAdmin && (activeTab === "cibil-enquiries")) || currentExpertId) {
      fetchCibilEnquiries();
    }
  }, [isAdmin, activeTab, currentExpertId]);

  // Lenders CRUD Handlers
  const handleOpenAddLender = () => {
    setEditingLender(null);
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
    });
    setLenderModalOpen(true);
  };

  const handleOpenEditLender = (l: LenderProduct) => {
    setEditingLender(l);
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

  const handleDeleteLender = async (id: string) => {
    if (confirm("Are you sure you want to delete this lender product?")) {
      const updatedList = lenderList.filter(l => l.id !== id);
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
        } else {
          alert("Failed to delete lender product.");
        }
      } catch (err) {
        console.error("Error deleting lender:", err);
      }
    }
  };

  const loadAdvisors = async () => {
    try {
      const list = await fetchAdvisors();
      setAdvisors(list);
      localStorage.setItem("finheal_advisors_list", JSON.stringify(list));
      dispatchUpdateEvent("finheal:advisors_update");
    } catch (err) {
      console.error("Error loading advisors from backend:", err);
      const stored = localStorage.getItem("finheal_advisors_list");
      if (stored) {
        try { setAdvisors(JSON.parse(stored)); } catch { setAdvisors([]); }
      } else {
        localStorage.setItem("finheal_advisors_list", JSON.stringify([]));
        setAdvisors([]);
      }
    }
  };

  // Load local storage states (static content with zero network cost)
  useEffect(() => {
    // 1. Educational content
    const storedContent = localStorage.getItem("finheal_education_content");
    if (storedContent) {
      setEducationContent(JSON.parse(storedContent));
    } else {
      localStorage.setItem("finheal_education_content", JSON.stringify(CONTENT));
      setEducationContent(CONTENT);
    }

    // 2. Tests List
    const storedTests = localStorage.getItem("finheal_health_tests_list");
    if (storedTests) {
      setTestCatalog(JSON.parse(storedTests));
    } else {
      localStorage.setItem("finheal_health_tests_list", JSON.stringify(testCards));
      setTestCatalog(testCards);
    }
  }, []);

  // Lazy load and poll advisors only when needed
  useEffect(() => {
    const shouldLoadAdvisors = !isAdmin || activeTab === "experts" || activeTab === "cibil-enquiries";
    
    if (shouldLoadAdvisors) {
      loadAdvisors();
      const intervalId = setInterval(loadAdvisors, 15000); // Less aggressive polling (every 15s instead of 8s)

      const handleAdvisorsUpdate = () => {
        const stored = localStorage.getItem("finheal_advisors_list");
        if (stored) {
          try { setAdvisors(JSON.parse(stored)); } catch { }
        }
      };

      window.addEventListener("finheal:advisors_update", handleAdvisorsUpdate);
      window.addEventListener("storage", handleAdvisorsUpdate);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener("finheal:advisors_update", handleAdvisorsUpdate);
        window.removeEventListener("storage", handleAdvisorsUpdate);
      };
    }
    return;
  }, [isAdmin, activeTab]);

  // Lazy load appointments based on tab or advisor workspace
  useEffect(() => {
    const shouldLoadAppointments = (!isAdmin && currentExpertId) || (isAdmin && activeTab === "appointments");
    
    if (shouldLoadAppointments) {
      loadGlobalAppointments();
      const intervalId = setInterval(loadGlobalAppointments, 30000); // 30s interval for appointments (low impact)

      const handleAppointmentsUpdate = () => {
        loadGlobalAppointments();
      };

      window.addEventListener("storage", handleAppointmentsUpdate);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener("storage", handleAppointmentsUpdate);
      };
    }
    return;
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

  const loadGlobalAppointments = async () => {
    try {
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
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
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
      testRating: 5
    });
    setExpertModalOpen(true);
  };

  const handleOpenEditExpert = (adv: Advisor) => {
    setEditingExpert(adv);
    const isCustomCategory = !["wealth", "tax", "debt", "property", "insurance"].includes(adv.category);
    setExpertForm({
      f2FintechId: adv.f2FintechId || adv.id,
      name: adv.name,
      designation: adv.designation,
      avatarUrl: adv.avatarUrl,
      availability: adv.availability,
      expertise: adv.expertise.join(", "),
      strength: adv.strength,
      bio: adv.bio,
      category: isCustomCategory ? "manual" : adv.category,
      customCategory: isCustomCategory ? adv.category : "",
      rating: adv.rating,
      reviewsCount: adv.reviewsCount,
      nextSlot: adv.nextSlot,
      fee: adv.fee || 899,
      testComment: "",
      testRating: 5
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

    const resolvedCategory = expertForm.category === "manual" ? expertForm.customCategory.trim() : expertForm.category;
    if (!resolvedCategory) {
      alert("Category is required!");
      return;
    }

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
      avatarUrl: expertForm.avatarUrl.trim() || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
      availability: expertForm.availability,
      expertise: resolvedExpertise,
      strength: expertForm.strength.trim() || "Financial planning",
      bio: expertForm.bio.trim() || "Certified Financial Advisor",
      category: resolvedCategory,
      rating: expertForm.rating,
      reviewsCount: expertForm.reviewsCount,
      nextSlot: expertForm.nextSlot.trim() || "Tomorrow, 10:00 AM",
      fee: Number(expertForm.fee) || 899,
      testComment: expertForm.testComment?.trim() || "",
      testRating: expertForm.testRating || 5
    };

    if (savingExpert) return;
    setSavingExpert(true);
    try {
      await saveAdvisor(item);
      await loadAdvisors();
      setExpertModalOpen(false);
    } catch (err) {
      console.error("Error saving advisor to backend:", err);
      alert("Failed to save expert to the database.");
    } finally {
      setSavingExpert(false);
    }
  };

  const handleDeleteExpert = async (id: string) => {
    if (confirm("Are you sure you want to retire this expert's profile?")) {
      try {
        await deleteAdvisor(id);
        await loadAdvisors();
      } catch (err) {
        console.error("Error deleting advisor:", err);
        alert("Failed to delete expert from database.");
      }
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
    if (confirm("Are you sure you want to delete this educational content?")) {
      const updatedList = educationContent.filter(c => c.id !== id);
      setEducationContent(updatedList);
      localStorage.setItem("finheal_education_content", JSON.stringify(updatedList));
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
      accent: "from-[#3344e6] to-[#7c8cff]"
    });
    setTestModalOpen(true);
  };

  const handleOpenEditTest = (test: TestCard) => {
    setEditingTest(test);
    setTestForm({
      title: test.title,
      description: test.description,
      duration: test.duration,
      focus: test.focus,
      result: test.result,
      accent: test.accent
    });
    setTestModalOpen(true);
  };

  const handleSaveTest = () => {
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
      accent: testForm.accent.trim()
    };

    let updatedList;
    if (editingTest) {
      updatedList = testCatalog.map(t => t.id === editingTest.id ? item : t);
    } else {
      updatedList = [...testCatalog, item];
    }

    setTestCatalog(updatedList);
    localStorage.setItem("finheal_health_tests_list", JSON.stringify(updatedList));
    dispatchUpdateEvent("finheal:tests_update");
    setTestModalOpen(false);
  };

  const handleDeleteTest = (id: string) => {
    if (confirm("Are you sure you want to retire this health test?")) {
      const updatedList = testCatalog.filter(t => t.id !== id);
      setTestCatalog(updatedList);
      localStorage.setItem("finheal_health_tests_list", JSON.stringify(updatedList));
      dispatchUpdateEvent("finheal:tests_update");
    }
  };

  // ==================== Expert Workspace Actions ====================
  const handleSetExpertAvailability = async (nextAvail: string) => {
    if (!currentExpertId) return;
    try {
      await updateAdvisorAvailability(currentExpertId, nextAvail);
      await loadAdvisors();
      dispatchUpdateEvent("finheal:advisors_update");
    } catch (err) {
      console.error("Error setting availability:", err);
    }
  };

  const handleAddTimeRange = () => {
    if (!slotFromTime || !slotToTime) {
      alert("Please select both From and To times.");
      return;
    }
    const range = `${slotFromTime} - ${slotToTime}`;
    if (addedSlots.includes(range)) {
      alert("This time range has already been added.");
      return;
    }
    setAddedSlots(prev => [...prev, range]);
  };

  const handleRemoveTimeRange = (index: number) => {
    setAddedSlots(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateExpertNextSlot = async () => {
    if (!currentExpertId || !slotDate) {
      alert("Please select a date.");
      return;
    }

    let slotsToSave = [...addedSlots];
    if (slotsToSave.length === 0) {
      if (slotFromTime && slotToTime) {
        slotsToSave.push(`${slotFromTime} - ${slotToTime}`);
      } else {
        alert("Please add at least one time range.");
        return;
      }
    }

    const combinedTime = slotsToSave.join(" & ");
    const formattedSlot = formatSlotValue(slotDate, combinedTime);
    try {
      await updateAdvisorNextSlot(currentExpertId, formattedSlot);
      await updateAdvisorAvailability(currentExpertId, slotsToSave[0]);
      await loadAdvisors();
      dispatchUpdateEvent("finheal:advisors_update");
      alert("Next slot has been updated successfully!");
    } catch (err) {
      console.error("Error updating next slot:", err);
      alert("Failed to update next slot.");
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
      avatarUrl: selfEditForm.avatarUrl.trim() || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
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

  const activeExpert = currentExpertId ? advisors.find(a => a.id === currentExpertId) : null;
  const activeExpertAppointments = allAppointments.filter(a => a.advisorId === currentExpertId);
  const expertUpcomingAppointments = activeExpertAppointments.filter(a => !a.completed && !a.cancelled && !hasSessionEnded(a.date, a.time));
  const expertPastAppointments = activeExpertAppointments.filter(a => a.completed || a.cancelled || hasSessionEnded(a.date, a.time));

  // ==================== RENDERING WORKSPACE ====================
  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">

      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
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

        <button
          type="button"
          onClick={onToggleInsights}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0"
          aria-label="Toggle insights panel"
        >
          ☰
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px] scrollbar-thin">

        {/* ========================================================================= */}
        {/* ===================== SUPER ADMIN VIEW RENDER =========================== */}
        {/* ========================================================================= */}
        {isAdmin ? (
          <div className="space-y-[24px]">

            {/* TABS MENU */}
            <div style={{ display: "flex", gap: "4px", borderBottom: "1.5px solid #e5e7eb" }}>
              {[
                { id: "experts", label: "🧑‍💼 Manage Experts" },
                { id: "education", label: "📚 Manage Education" },
                { id: "tests", label: "🧭 Manage Tests" },
                { id: "appointments", label: "📅 Scheduled Calls" },
                { id: "lenders", label: "🏦 Lenders Catalog" },
                { id: "cibil-enquiries", label: "📋 CIBIL Enquiries" }
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



            {/* TAB: MANAGE EXPERTS */}
            {activeTab === "experts" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Advisors ({advisors.length})</h3>
                  <button
                    onClick={handleOpenAddExpert}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add New Expert
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Expert info</th>
                        <th className="p-[12px]">Designation</th>
                        <th className="p-[12px]">Category</th>
                        <th className="p-[12px]">Hourly Fee</th>
                        <th className="p-[12px]">Availability</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advisors.map((adv) => (
                        <tr key={adv.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[12px] flex items-center gap-[10px]">
                            <img src={adv.avatarUrl} alt={adv.name} className="w-[32px] h-[32px] rounded-full object-cover border" />
                            <div>
                              <strong className="text-gray-900">{adv.name}</strong>
                              <div className="text-[10px] text-amber-500">⭐ {adv.rating} ({adv.reviewsCount} reviews)</div>
                            </div>
                          </td>
                          <td className="p-[12px] text-gray-600 font-medium">{adv.designation}</td>
                          <td className="p-[12px] uppercase font-bold text-[10.5px] text-gray-400">{adv.category}</td>
                          <td className="p-[12px] font-bold text-gray-950">₹{adv.fee || 899}</td>
                          <td className="p-[12px]">
                            {(() => {
                              const effectiveAvail = getEffectiveAvailability(adv.availability, adv.nextSlot);
                              return effectiveAvail === "available" ? (
                                <span className="bg-emerald-50 text-emerald-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-emerald-100">Available</span>
                              ) : effectiveAvail === "in meeting" ? (
                                <span className="bg-indigo-50 text-indigo-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-indigo-100">In Meeting</span>
                              ) : (
                                <span className="bg-rose-50 text-rose-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-rose-100">Not Available</span>
                              );
                            })()}
                          </td>
                          <td className="p-[12px] text-right space-x-[6px]">
                            <button
                              onClick={() => handleOpenEditExpert(adv)}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpert(adv.id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: MANAGE EDUCATION */}
            {activeTab === "education" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Education Content ({educationContent.length})</h3>
                  <button
                    onClick={handleOpenAddEdu}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add Content
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Title</th>
                        <th className="p-[12px]">Type</th>
                        <th className="p-[12px]">Category</th>
                        <th className="p-[12px]">Level</th>
                        <th className="p-[12px]">Source</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {educationContent.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[12px] max-w-[240px]">
                            <div className="flex items-center gap-[8px]">
                              <span className="text-[16px]">{item.emoji}</span>
                              <div className="min-w-0">
                                <strong className="text-gray-900 block truncate">{item.title}</strong>
                                <span className="text-[10px] text-gray-400 block truncate">{item.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-[12px]">
                            {item.type === "article" ? (
                              <span className="bg-blue-50 text-blue-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-blue-100">📄 Article</span>
                            ) : (
                              <span className="bg-purple-50 text-purple-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-purple-100">🎥 Video</span>
                            )}
                          </td>
                          <td className="p-[12px] text-gray-600 font-medium">{item.category}</td>
                          <td className="p-[12px] text-gray-500">{item.level}</td>
                          <td className="p-[12px] text-gray-400 font-medium">{item.source}</td>
                          <td className="p-[12px] text-right space-x-[6px]">
                            <button
                              onClick={() => handleOpenEditEdu(item)}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEdu(item.id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: MANAGE TESTS */}
            {activeTab === "tests" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Health Tests ({testCatalog.length})</h3>
                  <button
                    onClick={handleOpenAddTest}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add New Test
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Test Title</th>
                        <th className="p-[12px]">Duration</th>
                        <th className="p-[12px]">Primary Focus</th>
                        <th className="p-[12px]">Score output</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testCatalog.map((test) => (
                        <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[12px] max-w-[200px]">
                            <strong className="text-gray-900 block truncate">{test.title}</strong>
                            <span className="text-[10px] text-gray-400 block truncate">{test.description}</span>
                          </td>
                          <td className="p-[12px] font-semibold text-gray-600">{test.duration}</td>
                          <td className="p-[12px] text-gray-500">{test.focus}</td>
                          <td className="p-[12px] text-gray-400">{test.result}</td>
                          <td className="p-[12px] text-right space-x-[6px]">
                            <button
                              onClick={() => handleOpenEditTest(test)}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTest(test.id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SCHEDULED CALLS FEED */}
            {activeTab === "appointments" && (
              <div className="space-y-[16px] animate-fade-in">
                <h3 className="text-[14px] font-bold text-gray-900">Platform Scheduled Consultations Feed ({allAppointments.length})</h3>

                {allAppointments.length === 0 ? (
                  <div className="text-center py-[36px] bg-gray-50 border border-dashed rounded-[16px]">
                    <div className="text-[32px]">📅</div>
                    <div className="text-[12px] text-gray-400 mt-[6px]">No scheduled calls have been booked on the platform yet.</div>
                  </div>
                ) : (
                  <div className="space-y-[10px]">
                    {allAppointments.map((appt, idx) => (
                      <div key={idx} className="border border-gray-200 bg-white p-[16px] rounded-[16px] flex flex-col justify-between sm:flex-row sm:items-center">
                        <div className="space-y-[4px]">
                          <div className="flex items-center gap-[8px] flex-wrap">
                            <strong className="text-[14px] text-gray-900">{appt.advisorName}</strong>
                            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-[8px] py-[2px] rounded-full uppercase">Advisor ID: {appt.advisorId}</span>
                            {appt.cancelled ? (
                              <span className="text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">🚫 Cancelled</span>
                            ) : appt.completed && appt.rating ? (
                              <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">✓ Completed & Rated</span>
                            ) : (hasSessionEnded(appt.date, appt.time) || appt.completed) ? (
                              <span className="text-[9.5px] font-bold bg-[#ecfdf5] text-emerald-800 border border-emerald-200 px-[8px] py-[2px] rounded-full uppercase tracking-wide">✓ Completed</span>
                            ) : (
                              <span className="text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">🕒 Active Schedule</span>
                            )}
                          </div>
                          <div className="text-[12px] text-gray-600">
                            {appt.clientName && <span><strong>Client name:</strong> {appt.clientName} &nbsp;|&nbsp; </span>}
                            <strong>Client email:</strong> {appt.clientEmail}
                          </div>
                          {appt.meetUrl && (
                            <div className="text-[11.5px] text-gray-600 mt-[4px] flex items-center gap-[6px] flex-wrap">
                              <span>🌐 <strong>Meet URL Room:</strong></span>
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
                          {appt.completed && appt.rating && (
                            <div className="flex items-center gap-[6px] text-[11px] font-bold text-amber-500 bg-amber-50/20 border border-amber-100/30 px-[10px] py-[6px] rounded-[10px] w-fit mt-[4px]">
                              <span>{"★".repeat(appt.rating || 0)}</span>
                              <span className="text-gray-500">({appt.rating}/5 stars)</span>
                            </div>
                          )}
                          {appt.cancelled ? (
                            appt.feedback && (
                              <div className="text-[11px] italic text-rose-700 bg-rose-50/40 border border-rose-100/60 p-[10px] rounded-[12px] max-w-[480px] mt-[6px] flex flex-col gap-[3px] text-left">
                                <span className="text-[9.5px] font-extrabold text-rose-800 uppercase tracking-wider block">🚫 Cancellation Reason</span>
                                <span>&quot;{appt.feedback}&quot;</span>
                              </div>
                            )
                          ) : appt.completed ? (
                            appt.feedback && (
                              <div className="text-[11px] italic text-gray-700 bg-emerald-50/40 border border-emerald-100/60 p-[10px] rounded-[12px] max-w-[480px] mt-[6px] flex flex-col gap-[3px] text-left">
                                <span className="text-[9.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">💬 Client Feedback Review</span>
                                <span>&quot;{appt.feedback}&quot;</span>
                              </div>
                            )
                          ) : (
                            appt.notes && (
                              <div className="text-[11px] italic text-gray-500 bg-gray-50 border border-gray-100 p-[10px] rounded-[12px] max-w-[480px] mt-[6px] flex flex-col gap-[3px] text-left">
                                <span className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-wider block">📝 Session Notes</span>
                                <span>&quot;{appt.notes}&quot;</span>
                              </div>
                            )
                          )}
                        </div>

                        <div className="text-right shrink-0 mt-[12px] pt-[12px] border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0">
                          <div className="text-[13px] font-bold text-primary">{appt.date}</div>
                          <div className="text-[12px] font-bold text-gray-700 mt-[2px]">{appt.time} (IST)</div>
                          <div className="text-[10px] text-gray-400 mt-[4px]">Booked: {new Date(appt.bookedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MANAGE LENDERS */}
            {activeTab === "lenders" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Lenders Catalog ({lenderList.length})</h3>
                  <button
                    onClick={handleOpenAddLender}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add Lender Product
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Lender / Product</th>
                        <th className="p-[12px]">Lender Type</th>
                        <th className="p-[12px]">Category</th>
                        <th className="p-[12px]">Rate (ROI)</th>
                        <th className="p-[12px]">Limit Range</th>
                        <th className="p-[12px]">Min CIBIL / Income</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lendersLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center p-6 text-gray-400">Loading catalog...</td>
                        </tr>
                      ) : lenderList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-6 text-gray-400">No lenders listed. Click "+ Add Lender Product" to seed catalog.</td>
                        </tr>
                      ) : (
                        lenderList.map((l) => (
                          <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-[12px] max-w-[200px]">
                              <strong className="text-gray-900 block">{l.name}</strong>
                              <span className="text-[10px] text-gray-400 block">{l.productType}</span>
                              <span className="text-[9px] text-primary/70 font-semibold uppercase">{l.id}</span>
                            </td>
                            <td className="p-[12px] font-semibold text-gray-600">{l.lenderType}</td>
                            <td className="p-[12px] font-semibold text-gray-500 uppercase">{l.category}</td>
                            <td className="p-[12px] font-bold text-emerald-600">{l.minRate}% - {l.maxRate}%</td>
                            <td className="p-[12px] font-semibold text-gray-800">
                              ₹{l.minAmount >= 10000000 ? `${(l.minAmount / 10000000).toFixed(1)}Cr` : l.minAmount >= 100000 ? `${(l.minAmount / 100000).toFixed(0)}L` : l.minAmount} -
                              ₹{l.maxAmount >= 10000000 ? `${(l.maxAmount / 10000000).toFixed(0)}Cr` : l.maxAmount >= 100000 ? `${(l.maxAmount / 100000).toFixed(0)}L` : l.maxAmount}
                            </td>
                            <td className="p-[12px] text-gray-500">
                              <span>CIBIL: ≥{l.minCibil}</span>
                              <span className="block text-[10px] text-gray-400">Min Income: ₹{l.minMonthlyIncome}</span>
                            </td>
                            <td className="p-[12px] text-right space-x-[6px]">
                              <button
                                onClick={() => handleOpenEditLender(l)}
                                className="text-primary hover:underline font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLender(l.id)}
                                className="text-rose-500 hover:underline font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* TAB: CIBIL ENQUIRIES */}
            {activeTab === "cibil-enquiries" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="border-b border-gray-100 pb-3 space-y-3">
                  {/* Row 1: Title & Pagination */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">
                        CIBIL Credit Score Enquiries ({filteredEnquiries.length})
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-[2px]">
                        {filterDate
                          ? `Showing records fetched on ${new Date(filterDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : "Showing all credit score fetches across the platform."}
                      </p>
                    </div>

                    {/* Compact Pagination Controls */}
                    {filteredEnquiries.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          disabled={safeCibilPage === 1}
                          onClick={() => setCibilPage(prev => Math.max(prev - 1, 1))}
                          className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
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
                          className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
                          title="Next Page"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Filters & Export */}
                  <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 pt-1">
                    {/* Role Filter Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 font-semibold">Enquiry Made By:</span>
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                      >
                        <option value="all">All Enquirers</option>
                        <option value="User">Regular Users (Leads)</option>
                        <option value="Admin">Admins</option>
                        <option value="Manager">Managers</option>
                        <option value="Senior Leadership">Senior Leadership</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 font-semibold">Filter by Date:</span>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                      />
                      {(filterDate || filterRole !== "all") && (
                        <button
                          onClick={() => { setFilterDate(""); setFilterRole("all"); }}
                          className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-600 cursor-pointer transition"
                        >
                          Reset Filters
                        </button>
                      )}
                      {filteredEnquiries.length > 0 && (
                        <button
                          onClick={handleExportCSV}
                          className="h-[32px] px-[12px] rounded-[10px] bg-primary text-white hover:bg-opacity-95 text-[11px] font-bold shadow-xs cursor-pointer transition flex items-center gap-1"
                          title="Export leads to Excel/CSV sheet"
                        >
                          📥 Export Leads
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">User Identity</th>
                        <th className="p-[12px]">Bureau</th>
                        <th className="p-[12px]">PAN Card</th>
                        <th className="p-[12px]">Credit Score</th>
                        <th className="p-[12px]">Date & Time</th>
                        <th className="p-[12px] text-right">PDF Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cibilLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center p-6 text-gray-400">Loading CIBIL enquiries...</td>
                        </tr>
                      ) : filteredEnquiries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-6 text-gray-400">
                            {filterDate
                              ? "No CIBIL inquiries found for this particular day."
                              : "No CIBIL inquiries found on the platform."}
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
                            <tr key={enq.id} className="border-b border-gray-100 hover:bg-gray-50/50">
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
                                <span className="text-[10px] text-gray-400 block font-medium">
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
                                {enq.pdf_url ? (
                                  <a
                                    href={enq.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-bold text-[11px] block"
                                  >
                                    View Report ↗
                                  </a>
                                ) : (
                                  <span className="text-gray-400 block">-</span>
                                )}
                                <button
                                  onClick={() => handleGenerateCAM(enq.user_id, enq.name)}
                                  className="text-emerald-600 hover:underline font-bold text-[10px] block mt-1 ml-auto cursor-pointer border-none bg-transparent"
                                >
                                  Generate CAM 📊
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                    <img
                      src={activeExpert.avatarUrl}
                      alt={activeExpert.name}
                      className="w-[84px] h-[84px] rounded-2xl object-cover shadow-md border-2 border-white"
                    />
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
                    <Card className="border-gray-200 shadow-xs">
                      <CardHeader className="p-[16px] pb-[4px]">
                        <CardTitle className="text-[14px] font-bold">Update Next Slot</CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">Set the next available booking slot users will see on your card.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-[16px] space-y-[12px]">
                        <div className="space-y-[10px]">
                          <div>
                            <label className="text-[10.5px] font-bold text-gray-400 uppercase block mb-[2px]">Select Date</label>
                            <input
                              type="date"
                              value={slotDate}
                              onChange={(e) => setSlotDate(e.target.value)}
                              className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                            />
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
                                  {appt.notes && (
                                    <div className="text-[11px] italic text-gray-500 bg-gray-50 border border-gray-100 p-[10px] rounded-[12px] max-w-[440px] mt-[6px] flex flex-col gap-[3px] text-left">
                                      <span className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-wider block">📝 Session Notes</span>
                                      <span>&quot;{appt.notes}&quot;</span>
                                    </div>
                                  )}
                                </div>

                                <div className="text-right shrink-0 mt-[10px] pt-[10px] border-t border-gray-50 sm:border-t-0 sm:mt-0 sm:pt-0">
                                  <div className="text-[13px] font-bold text-primary">{appt.date}</div>
                                  <div className="text-[12px] font-bold text-gray-700 mt-[2px]">{appt.time} (IST)</div>
                                  <div className="mt-[8px] flex items-center justify-end gap-[8px]">
                                    {appt.meetUrl ? (
                                      <a
                                        href={appt.meetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block bg-primary hover:opacity-90 text-white text-[11px] font-bold px-[12px] py-[6px] rounded-[8px] transition cursor-pointer text-center"
                                      >
                                        Join Call Room
                                      </a>
                                    ) : (
                                      <button
                                        onClick={() => alert("We've sent the Google Calendar invite link to you and your client. Press OK to copy link.")}
                                        className="bg-[#ecfdf5] hover:bg-[#d1fae5] text-emerald-800 text-[10px] font-bold px-[8px] py-[3px] rounded-[6px] border border-emerald-100 transition"
                                      >
                                        Accept session
                                      </button>
                                    )}
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
                                  </div>
                                </div>
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

                              {/* Reschedule inline form */}
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

                  <div className="border border-white/50 rounded-[16px] overflow-hidden bg-white/60 shadow-inner">
                    <table className="w-full text-left text-[12px] border-collapse">
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
                <div className="border border-gray-200 rounded-[20px] p-[20px] bg-white shadow-sm space-y-[16px] text-left animate-fade-in mt-[20px]">
                  <div className="border-b border-gray-100 pb-3 space-y-3">
                    {/* Row 1: Title & Pagination */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-[6px]">
                          📋 CIBIL Credit Score Enquiries ({filteredEnquiries.length})
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-[2px]">
                          {filterDate
                            ? `Showing records fetched on ${new Date(filterDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : "Showing all credit score fetches across the platform."}
                        </p>
                      </div>

                      {/* Compact Pagination Controls */}
                      {filteredEnquiries.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            disabled={safeCibilPage === 1}
                            onClick={() => setCibilPage(prev => Math.max(prev - 1, 1))}
                            className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
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
                            className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
                            title="Next Page"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Filters & Export */}
                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500 font-semibold">Filter by Date:</span>
                        <input
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                        />
                        {(filterDate || filterRole !== "all") && (
                          <button
                            onClick={() => { setFilterDate(""); setFilterRole("all"); }}
                            className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-650 cursor-pointer transition"
                          >
                            Reset Filters
                          </button>
                        )}
                        {filteredEnquiries.length > 0 && (
                          <button
                            onClick={handleExportCSV}
                            className="h-[32px] px-[12px] rounded-[10px] bg-primary text-white hover:bg-opacity-95 text-[11px] font-bold shadow-xs cursor-pointer transition flex items-center gap-1"
                            title="Export leads to Excel/CSV sheet"
                          >
                            📥 Export Leads
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-[12px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                          <th className="p-[12px]">User Identity</th>
                          <th className="p-[12px]">Bureau</th>
                          <th className="p-[12px]">PAN Card</th>
                          <th className="p-[12px]">Credit Score</th>
                          <th className="p-[12px]">Date & Time</th>
                          <th className="p-[12px] text-right">PDF Report</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cibilLoading ? (
                          <tr>
                            <td colSpan={6} className="text-center p-6 text-gray-400">Loading CIBIL enquiries...</td>
                          </tr>
                        ) : filteredEnquiries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-6 text-gray-400">
                              {filterDate
                                ? "No CIBIL inquiries found for this particular day."
                                : "No CIBIL inquiries found on the platform."}
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
                              <tr key={enq.id} className="border-b border-gray-100 hover:bg-gray-50/50">
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
                                  {enq.pdf_url ? (
                                    <a
                                      href={enq.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline font-bold text-[11px] block"
                                    >
                                      View Report ↗
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 block">-</span>
                                  )}
                                  <button
                                    onClick={() => handleGenerateCAM(enq.user_id, enq.name)}
                                    className="text-emerald-600 hover:underline font-bold text-[10px] block mt-1 ml-auto cursor-pointer border-none bg-transparent"
                                  >
                                    Generate CAM 📊
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                    onChange={(e) => setExpertForm({ ...expertForm, designation: e.target.value })}
                    placeholder="e.g. CFP / Portfolio Manager"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
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
                    <option value="manual">Manual Type (Write own category)</option>
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

              <div className="grid grid-cols-2 gap-[10px]">
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
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Next Slot</label>
                  <input
                    type="text"
                    value={expertForm.nextSlot}
                    onChange={(e) => setExpertForm({ ...expertForm, nextSlot: e.target.value })}
                    placeholder="e.g. Tomorrow, 10:00 AM"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Rating (0.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={expertForm.rating}
                    onChange={(e) => setExpertForm({ ...expertForm, rating: Number(e.target.value) })}
                    placeholder="e.g. 4.8"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Reviews Count</label>
                  <input
                    type="number"
                    min="0"
                    value={expertForm.reviewsCount}
                    onChange={(e) => setExpertForm({ ...expertForm, reviewsCount: Number(e.target.value) })}
                    placeholder="e.g. 15"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Expertise Tags (Comma-separated)</label>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">

            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingTest ? `Edit Test Catalog Card` : "Add New Financial Health Test Card"}
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[60vh] scrollbar-thin">
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
                  <select
                    value={testForm.accent}
                    onChange={(e) => setTestForm({ ...testForm, accent: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="from-[#3344e6] to-[#7c8cff]">Royal Blue to Purple</option>
                    <option value="from-[#10b981] to-[#34d399]">emerald Green</option>
                    <option value="from-[#f59e0b] to-[#fbbf24]">amber Orange</option>
                    <option value="from-[#06b6d4] to-[#22d3ee]">cyan Blue</option>
                    <option value="from-[#8b5cf6] to-[#a78bfa]">lavender Violet</option>
                  </select>
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
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Card Description Summary</label>
                <textarea
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  placeholder="Describe what the health test assesses..."
                  rows={3}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary"
                />
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
                  <input
                    type="text"
                    value={lenderForm.name || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, name: e.target.value })}
                    placeholder="e.g. SBI"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Product Type</label>
                  <input
                    type="text"
                    value={lenderForm.productType || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, productType: e.target.value })}
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
                    onChange={(e) => setLenderForm({ ...lenderForm, category: e.target.value as any })}
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
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lenderForm.maxRate || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxRate: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Tenure (Y)</label>
                  <input
                    type="number"
                    value={lenderForm.minTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minTenureYears: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Tenure (Y)</label>
                  <input
                    type="number"
                    value={lenderForm.maxTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxTenureYears: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
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
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max FOIR (%)</label>
                  <input
                    type="number"
                    value={lenderForm.maxFoirPct || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxFoirPct: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Monthly Income</label>
                  <input
                    type="number"
                    value={lenderForm.minMonthlyIncome || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minMonthlyIncome: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Loan Amount</label>
                  <input
                    type="number"
                    value={lenderForm.minAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minAmount: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Loan Amount</label>
                  <input
                    type="number"
                    value={lenderForm.maxAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxAmount: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
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
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Processing Fee</label>
                  <input
                    type="text"
                    value={lenderForm.processingFee || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, processingFee: e.target.value })}
                    placeholder="e.g. 2.0% + GST"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Pros (comma-separated)</label>
                <input
                  type="text"
                  value={lenderForm.pros || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, pros: e.target.value })}
                  placeholder="Fast approvals, Digital KYC"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Cons (comma-separated)</label>
                <input
                  type="text"
                  value={lenderForm.cons || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, cons: e.target.value })}
                  placeholder="Higher ROI band, Documentation heavy"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Required Documents (comma-separated)</label>
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
    </main>
  );
}
