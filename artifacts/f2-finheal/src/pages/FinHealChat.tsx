import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FinancialHealthTestCatalog from "@/components/FinancialHealthTestCatalog";
import FinancialLiteracyTestView from "@/components/FinancialLiteracyTestView";
import EmergencyFundCheckView from "@/components/EmergencyFundCheckView";
import LoanFitTestView from "@/components/LoanFitTestView";
import DebtBalanceReviewView from "@/components/DebtBalanceReviewView";
import CreditReadinessReviewView from "@/components/CreditReadinessReviewView";
import InsightsPanel from "@/components/InsightsPanel";
import AuthScreen from "@/components/AuthScreen";
import ProfilePage from "@/components/ProfilePage";
import { useBackendChat } from "@/hooks/useBackendChat";
import type { MoodDimensions } from "@/lib/backendChat";
import { deleteConversation as apiDeleteConversation } from "@/lib/backendChat";
import { createUserProfile } from "@/utils/user";
import { getStoredAuthSession, setStoredAuthSession, clearStoredAuthSession } from "@/utils/authSession";
import { fetchHearts, fetchUserProfile, authRequest } from "@/lib/backendAuth";
import { syncGoalsFromBackend } from "@/utils/localGoals";
import QuizPopup from "@/components/QuizPopup/QuizPopup";
import WelcomeSplash from "@/components/WelcomeSplash";
import FinancialEducation from "@/components/FinancialEducation";
import AdvisorPanel from "@/components/AdvisorPanel";
import AdminPortal from "@/components/AdminPortal"; // Dynamic admin/expert workspace portal
import LoanCalculatorView from "@/components/LoanCalculatorView";
import CibilAnalyzerView from "@/components/CibilAnalyzerView";
import EligibilityCibilView from "@/components/EligibilityCibilView";
import Dashboard from "@/components/Dashboard";
import RemindersView from "@/components/RemindersView";


export default function FinHealChat() {

  // Replaced getInitialMainView with wouter useLocation

  const [authSession, setAuthSession] = useState(() => getStoredAuthSession());
  const [showWelcome, setShowWelcome] = useState(false);
  const [prevGuestSession, setPrevGuestSession] = useState<typeof authSession>(null);
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/") {
      const query = window.location.search;
      if (query.includes("ref=") || query.includes("referral_code=")) {
        setLocation(`/signup${query}`, { replace: true });
      } else {
        setLocation(`/chat${query}`, { replace: true });
      }
    }
  }, [location, setLocation]);

  useEffect(() => {
    if (authSession && !authSession.isGuest && (location === "/login" || location === "/signup")) {
      setLocation("/chat", { replace: true });
    }
  }, [authSession, location, setLocation]);

  useEffect(() => {
    if (!authSession) {
      if (location !== "/login" && location !== "/signup") {
        const query = window.location.search;
        if (query.includes("ref=") || query.includes("referral_code=")) {
          setLocation(`/signup${query}`, { replace: true });
        } else {
          setLocation(`/login${query}`, { replace: true });
        }
      }
    }
  }, [authSession, location, setLocation]);

  const mainView = useMemo(() => {
    if (location === "/profile") return "profile";
    if (location === "/advisor") return "advisor";
    if (location === "/admin" || location.startsWith("/admin/")) return "admin";
    if (location === "/dashboard") return "dashboard";
    if (location === "/education") return "education";
    if (location === "/loan-calculator" || location.startsWith("/loan-calculator/")) return "loan-calculator";
    if (location === "/cibil-analyzer") return "cibil-analyzer";
    if (location === "/eligibility-cibil") return "eligibility-cibil";
    if (location === "/tests") return "tests";
    if (location === "/goals") return "goals";
    if (location === "/reminders") return "reminders";
    if (location === "/tests/financial-literacy" || location === "/financial-literacy") return "financial-literacy";
    if (location === "/tests/emergency-fund" || location === "/emergency-fund") return "emergency-fund";
    if (location === "/tests/loan-fit" || location === "/loan-fit") return "loan-fit";
    if (location === "/tests/credit-readiness" || location === "/credit-readiness") return "credit-readiness";
    if (location === "/tests/debt-balance" || location === "/debt-balance") return "debt-balance";
    return "chat";
  }, [location]) as any;

  const setMainView = (view: string) => {
    if (view === "chat") setLocation("/chat");
    else if (view === "financial-literacy") setLocation("/tests/financial-literacy");
    else if (view === "emergency-fund") setLocation("/tests/emergency-fund");
    else if (view === "loan-fit") setLocation("/tests/loan-fit");
    else if (view === "credit-readiness") setLocation("/tests/credit-readiness");
    else if (view === "debt-balance") setLocation("/tests/debt-balance");
    else setLocation(`/${view}`);
  };
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState("");
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState<{text: string; card: string} | null>(null);
  const mainViewRef = useRef(mainView);
  const userId = authSession?.userId || "";
  const userProfile = authSession ? { ...createUserProfile(userId, authSession.displayName, authSession.avatarUrl), email: authSession.email } : null;
  const chat = useBackendChat(userId);

  // Platform Usage Time Tracker
  useEffect(() => {
    if (!userId) return;

    let activeSeconds = 0;
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        activeSeconds += 10;
        if (activeSeconds >= 60) {
          activeSeconds = 0;
          const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
          const storageKey = `finheal_platform_usage_${userId}`;
          let usageData: Record<string, number> = {};
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) usageData = JSON.parse(raw);
          } catch (e) {
            console.warn("Failed to parse local platform usage data:", e);
          }
          const currentMins = usageData[dateKey] || 0;
          usageData[dateKey] = currentMins + 1;
          localStorage.setItem(storageKey, JSON.stringify(usageData));

          authRequest<any>(`profile/track/usage/${encodeURIComponent(userId)}`, {
            method: "POST",
            body: JSON.stringify({ date: dateKey, minutes: 1 })
          }).catch((err) => {
            console.warn("Failed to sync platform usage to backend:", err);
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);


  // Reminders notifications state
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Helper to parse time string like "09:00 AM" to minutes from midnight
    const parseTimeToMinutes = (timeStr: string): number => {
      const parts = timeStr.trim().split(/\s+/);
      if (parts.length === 0) return 0;
      const timePart = parts[0];
      const meridiem = parts[1] || "";
      let [hoursStr, minutesStr] = timePart.split(":");
      let hours = parseInt(hoursStr, 10) || 0;
      const minutes = parseInt(minutesStr, 10) || 0;

      if (meridiem.toUpperCase() === "PM" && hours !== 12) {
        hours += 12;
      } else if (meridiem.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    };

    const checkAlerts = () => {
      try {
        const now = new Date();
        const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const todayDateStr = `${monthsShort[now.getMonth()]} ${now.getDate()} (${daysShort[now.getDay()]})`;
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentMinutesFromMidnight = currentHours * 60 + currentMinutes;

        // 1. Check Scheduled Calls / Appointments first (higher priority)
        const apptsKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
        const rawAppts = localStorage.getItem(apptsKey);
        if (rawAppts) {
          const appts = JSON.parse(rawAppts);
          if (Array.isArray(appts)) {
            const dueAppt = appts.find((a: any) => {
              if (a.completed || a.cancelled || a.joined) return false;
              
              const uniqueId = a.id || `appt-${a.advisorId}-${a.date}-${a.time}`;
              if (notifiedIdsRef.current.has(uniqueId)) return false;

              // Check if date matches today
              if (a.date === todayDateStr) {
                const apptMinutes = parseTimeToMinutes(a.time);
                // Trigger if current time is past or equal to scheduled time
                return currentMinutesFromMidnight >= apptMinutes;
              }
              return false;
            });

            if (dueAppt) {
              const uniqueId = dueAppt.id || `appt-${dueAppt.advisorId}-${dueAppt.date}-${dueAppt.time}`;
              setActiveNotification({
                ...dueAppt,
                id: uniqueId,
                isAppointment: true,
                category: "Consultation",
                title: `Call with Advisor ${dueAppt.advisorName || "Expert"}`,
                notes: dueAppt.notes
              });
              notifiedIdsRef.current.add(uniqueId);
              return; // Show appointment notification first and skip reminders
            }
          }
        }

        // 2. Check Reminders (if no due appointments)
        const remindersKey = `finheal_reminders:${userId}`;
        const rawReminders = localStorage.getItem(remindersKey);
        if (rawReminders) {
          const reminders = JSON.parse(rawReminders);
          if (Array.isArray(reminders)) {
            const currentDateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            
            const dueReminder = reminders.find((r: any) => {
              if (r.completed) return false;
              if (notifiedIdsRef.current.has(r.id)) return false;

              // If date matches today
              if (r.dueDate === currentDateStr) {
                if (r.dueTime) {
                  const [h, m] = r.dueTime.split(':').map(Number);
                  return (currentHours > h) || (currentHours === h && currentMinutes >= m);
                } else {
                  return true;
                }
              }
              
              // Trigger if overdue
              if (r.dueDate < currentDateStr) {
                return true;
              }

              return false;
            });

            if (dueReminder) {
              setActiveNotification(dueReminder);
              notifiedIdsRef.current.add(dueReminder.id);
            }
          }
        }
      } catch (e) {
        console.error("Error checking alerts for notification:", e);
      }
    };

    // Check immediately and periodically
    checkAlerts();
    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  // Show signup modal automatically when hearts run out
  useEffect(() => {
    if (chat.heartsExhausted && authSession?.isGuest) {
      setPrevGuestSession(authSession);
      setAuthSession(null);
    }
  }, [chat.heartsExhausted, authSession]);

  const [showQuizPopup, setShowQuizPopup] = useState(false);

  useEffect(() => {
    mainViewRef.current = mainView;
  }, [mainView]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const completed = window.localStorage.getItem("finheal_quiz_completed");
      const dismissedTime = window.localStorage.getItem("finheal_quiz_dismissed_time");
      const isCooldownActive = dismissedTime && (Date.now() - Number(dismissedTime) < 24 * 60 * 60 * 1000);

      if (mainViewRef.current === "chat" && !completed && !isCooldownActive) {
        setShowQuizPopup(true);
      }
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (mainView !== "chat") {
      setShowQuizPopup(false);
    }
  }, [mainView]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const desktopBreakpoint = window.matchMedia("(min-width: 1024px)");
    const handleViewportChange = () => {
      if (!desktopBreakpoint.matches) {
        setSidebarOpen(false);
        setInsightsOpen(false);
      }
    };
    handleViewportChange();
    desktopBreakpoint.addEventListener("change", handleViewportChange);
    return () => desktopBreakpoint.removeEventListener("change", handleViewportChange);
  }, []);

  const handleQuizComplete = (tierName: string, score: number) => {
    window.localStorage.setItem("finheal_quiz_completed", "true");
    window.localStorage.setItem("finheal_user_tier", tierName);
    window.localStorage.setItem("finheal_quiz_score", String(score));
    setShowQuizPopup(false);
  };

  const handleQuizDismiss = () => {
    window.localStorage.setItem("finheal_quiz_dismissed_time", String(Date.now()));
    setShowQuizPopup(false);
  };

  const persistSession = (session: typeof authSession) => {
    if (session) {
      const nextSession = session.isGuest ? session : { ...session, hearts: null };
      setStoredAuthSession(nextSession);
      setAuthSession(nextSession);
      setCurrentMoodDims(null);
      setMainView("chat");
      setShowWelcome(true);
      window.localStorage.removeItem("finheal_quiz_dismissed_time");
    }
  };

  const refreshHearts = useCallback(async () => {
    if (!authSession?.userId || !authSession.isGuest) return;
    try {
      const hearts = await fetchHearts(authSession.userId);
      const nextSession = { ...authSession, hearts };
      setStoredAuthSession(nextSession);
      setAuthSession(nextSession);
    } catch {}
  }, [authSession]);

  useEffect(() => {
    if (authSession?.userId && authSession.isGuest && authSession.hearts == null) {
      void refreshHearts();
    }
  }, [authSession, refreshHearts]);

  // Sync goals from backend on session load, on tab focus, and periodically
  useEffect(() => {
    if (!userId) return;

    const syncBackendGoals = async () => {
      try {
        const profile = await fetchUserProfile(userId);
        if (profile && Array.isArray(profile.goals)) {
          syncGoalsFromBackend(userId, profile.goals);
        }
      } catch (err) {
        console.error("Failed to sync goals from backend:", err);
      }
    };

    // Initial sync on load
    void syncBackendGoals();

    // Re-sync when the tab becomes visible (covers cross-machine scenario)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncBackendGoals();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic fallback: re-sync every 60s if tab stays open
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncBackendGoals();
      }
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [userId]);

  // Redirect staff users away from goals page
  useEffect(() => {
    if (authSession) {
      const email = authSession.email;
      const isStaff = authSession.isAdvisor || (email && ["admin@finheal.com", "admin@f2finheal.com"].includes(email.toLowerCase())) || isUserAdvisor(email);
      if (isStaff && mainView === "goals") {
        setLocation("/chat", { replace: true });
      }
    }
  }, [authSession, mainView, setLocation]);

  const handleLogout = () => {
    clearStoredAuthSession();
    setAuthSession(null);
    window.localStorage.removeItem("finheal_quiz_completed");
    window.localStorage.removeItem("finheal_user_tier");
    window.localStorage.removeItem("finheal_quiz_score");
    window.localStorage.removeItem("finheal_quiz_dismissed_time");
    setCurrentMoodDims(null);
    setSidebarOpen(false);
    setInsightsOpen(false);
    setMainView("chat");
  };

  const handleSendMessage = useCallback(async (text: string) => {
    await chat.sendMessage(text);
    if (authSession?.isGuest) {
      await refreshHearts();
    }
  }, [authSession?.isGuest, chat, refreshHearts]);

  const handleMoodUpdate = useCallback((dims: MoodDimensions | null) => {
    setCurrentMoodDims((prev) => {
      if (prev === dims) return prev;
      if (prev && dims) {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(dims);
        if (prevKeys.length === nextKeys.length && prevKeys.every((key) => prev[key] === dims[key])) {
          return prev;
        }
      }
      return dims;
    });
  }, []);

  const handleConversationSelect = useCallback(async (conversationId: string) => {
    setMainView("chat");
    await chat.loadConversation(conversationId);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1535px)").matches) {
      setInsightsOpen(false);
    }
  }, [chat]);

  const handleConversationDelete = async (conversationId: string) => {
    if (!conversationId) return;
    if (isDeletingConversation) return;
    setIsDeletingConversation(true);
    try {
      await apiDeleteConversation(conversationId, userId);
    } catch (e) {
      console.error("Failed to delete conversation from backend:", e);
    } finally {
      try {
        await chat.refreshConversations();
      } catch {}
      if (chat.conversationId === conversationId) {
        chat.clearMessages();
      }
      setInsightsOpen(false);
      setIsDeletingConversation(false);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);
  const closeInsights = () => setInsightsOpen(false);
  const openChatView = () => setMainView("chat");
  const openTestCatalog = () => setMainView("tests");
  const openEducation = () => setMainView("education");
  const openProfilePage = () => setMainView("profile");
  const openAdvisor = () => setMainView("advisor");
  const openAdmin = () => setMainView("admin");
  const openLoanCalculator = () => setMainView("loan-calculator");
  const openCibilAnalyzer = () => setMainView("cibil-analyzer");
  const openEligibilityCibil = () => setMainView("eligibility-cibil");
  const openDashboard = () => setMainView("dashboard");
  const openReminders = () => setMainView("reminders");


  const handleApplyLoan = useCallback((loanType: string, amount: number, rate: number, tenure: number) => {
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

    const messageText = `I would like to apply for a ${loanType} of ${formattedAmount} at an interest rate of ${rate}% for a tenure of ${tenure} years. Could you please guide me on the next steps, eligibility criteria, and documents required?`;

    setMainView("chat");
    setPrefillMessage({ text: messageText, card: "" });

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      closeSidebar();
    }
  }, []);

  const openTestInNewTab = (view: string) => {
    if (typeof window === "undefined") return;
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = `/tests/${view}`;
    nextUrl.search = "";
    window.open(nextUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const openEmergencyFundCheck = () => openTestInNewTab("emergency-fund");
  const openLoanFitTest = () => openTestInNewTab("loan-fit");
  const openDebtBalanceReview = () => openTestInNewTab("debt-balance");
  const openCreditReadiness = () => openTestInNewTab("credit-readiness");
  
  const openFreshChat = () => {
    setMainView("chat");
    chat.clearConversation();
  };
  const viewPastResultInCurrentTab = useCallback((testId: string) => {
    const map: Record<string, string> = {
      financial_literacy: "financial-literacy",
      emergency_fund: "emergency-fund",
      loan_fit: "loan-fit",
      debt_balance: "debt-balance",
      credit_readiness: "credit-readiness",
    };
    const view = map[testId] ?? testId;
    setMainView(view as any);
  }, []);

  const isUserAdvisor = (email?: string) => {
    if (email && ["admin@finheal.com", "admin@f2finheal.com"].includes(email.toLowerCase())) return false;
    if (authSession?.isAdvisor) return true;
    try {
      const storedSession = localStorage.getItem("finheal-auth-session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed?.isAdvisor) return true;
      }
    } catch (e) {}

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
          ) && a.isAdvisor === true
        );
      } catch (e) {}
    }
    return false;
  };

  const activeSidebarNav = mainView === "chat"
    ? "Talk to FinHeal"
    : mainView === "goals"
      ? "Financial Goals"
      : mainView === "profile"
      ? "Settings"
      : mainView === "advisor"
        ? "Talk to an Advisor"
        : mainView === "admin"
          ? (isUserAdvisor(authSession?.email)
              ? "Advisor Workspace"
              : "Admin Portal")
          : mainView === "education"
            ? "Financial Education"
            : mainView === "loan-calculator"
              ? "Loan Calculator"
              : mainView === "cibil-analyzer"
                ? "CIBIL Analyzer"
                : mainView === "eligibility-cibil"
                  ? "Eligibility & CIBIL Checker"
                  : mainView === "dashboard"
                    ? "My Dashboard"
                    : mainView === "reminders"
                      ? "Reminders"
                      : "Financial Health Test";
  const openFinancialLiteracyInNewTab = () => {
    if (typeof window === "undefined") return;
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = "/tests/financial-literacy";
    nextUrl.search = "";
    window.open(nextUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const handleProfileSave = (profile: { fullName: string; email?: string | null; avatarUrl?: string | null }) => {
    if (!authSession) return;

    const nextDisplayName = profile.fullName.trim() || authSession.displayName;
    const nextSession = {
      ...authSession,
      displayName: nextDisplayName,
      email: profile.email?.trim() || authSession.email,
      avatarUrl: profile.avatarUrl ?? authSession.avatarUrl ?? null,
    };

    setStoredAuthSession(nextSession);
    setAuthSession(nextSession);
  };

  const handleSelectMood = useCallback((emoji: string, title: string) => {
    setMainView("chat");
    const moodMessages: Record<string, string> = {
      "😰": "😰 I am feeling very stressed and overwhelmed today.",
      "😟": "😟 I am feeling anxious and worried today.",
      "😐": "😐 I am feeling neutral today.",
      "🙂": "🙂 I am feeling okay and calm today.",
      "😄": "😄 I am feeling great and energetic today.",
    };
    const messageText = moodMessages[emoji] || `${emoji} I am feeling ${title.toLowerCase()} today.`;
    void chat.startNewChatWithMessage(messageText);

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      closeSidebar();
    }
  }, [chat]);

  if (!authSession || !userProfile) {
    return <AuthScreen currentSession={prevGuestSession || authSession} onAuthSuccess={persistSession} />;
  }

  if (showWelcome) {
    return (
      <WelcomeSplash
        userName={authSession?.displayName?.split(" ")[0]}
        onComplete={() => setShowWelcome(false)}
      />
    );
  }
  return (
    <>
      <QuizPopup
        visible={showQuizPopup && mainView === "chat"}
        onDismiss={handleQuizDismiss}
        onComplete={handleQuizComplete}
      />
      {activeNotification && mainView === "chat" && (
        <>
          <style>{`
            @keyframes slideUpNotification {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-slide-up-notification {
              animation: slideUpNotification 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="fixed bottom-6 right-6 z-[100] max-w-[360px] w-[calc(100%-32px)] bg-white border border-gray-100 dark:bg-slate-900 dark:border-slate-800 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] p-4 flex gap-3 animate-slide-up-notification">
            <div className="text-[24px] shrink-0 mt-0.5">
              {activeNotification.isAppointment ? "📅" :
               activeNotification.category === "EMI" ? "🏦" :
               activeNotification.category === "Savings" ? "🐷" :
               activeNotification.category === "Bill" ? "⚡" :
               activeNotification.category === "Tax" ? "📄" : "🔔"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-primary dark:text-indigo-400 uppercase tracking-wide">
                  {activeNotification.isAppointment ? "Consultation Alert" : "Reminder Alert"}
                </span>
                <button
                  onClick={() => setActiveNotification(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer text-[14px] leading-none"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-slate-100 mt-1">
                {activeNotification.title}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                {activeNotification.isAppointment 
                  ? `Your appointment is starting now (${activeNotification.time})`
                  : activeNotification.dueTime ? `Scheduled for today at ${activeNotification.dueTime}` : "Due today"}
                {!activeNotification.isAppointment && activeNotification.amount && ` · Amount: ₹${activeNotification.amount.toLocaleString("en-IN")}`}
              </p>
              {activeNotification.notes && (
                <p className="text-[10px] bg-gray-50 dark:bg-slate-950 p-2 rounded-[8px] mt-2 text-gray-500 dark:text-slate-400 italic leading-snug">
                  {activeNotification.notes}
                </p>
              )}
              <div className="flex gap-2 mt-3 justify-end">
                {activeNotification.isAppointment ? (
                  <button
                    onClick={() => {
                      if (activeNotification.meetUrl) {
                        window.open(activeNotification.meetUrl, "_blank");
                      }
                      // Mark as joined in localStorage
                      try {
                        const apptsKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
                        const raw = localStorage.getItem(apptsKey);
                        if (raw) {
                          const appts = JSON.parse(raw);
                          const updated = appts.map((a: any) => {
                            const matchId = activeNotification.id === (a.id || `appt-${a.advisorId}-${a.date}-${a.time}`);
                            return matchId ? { ...a, joined: true } : a;
                          });
                          localStorage.setItem(apptsKey, JSON.stringify(updated));
                          window.dispatchEvent(new Event("storage"));
                          window.dispatchEvent(new CustomEvent("finheal:advisors_update"));
                        }
                      } catch (e) {
                        console.error("Failed to mark appointment joined from notification:", e);
                      }
                      setActiveNotification(null);
                    }}
                    className="px-3 py-1.5 bg-primary text-white text-[11px] font-semibold rounded-[8px] hover:bg-[#1e2db8] transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    🚀 Join Call
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Mark as completed in localStorage
                      try {
                        const storageKey = `finheal_reminders:${userId}`;
                        const raw = localStorage.getItem(storageKey);
                        if (raw) {
                          const reminders = JSON.parse(raw);
                          const updated = reminders.map((r: any) =>
                            r.id === activeNotification.id ? { ...r, completed: true } : r
                          );
                          localStorage.setItem(storageKey, JSON.stringify(updated));
                          
                          // Fire a storage event to keep views updated
                          window.dispatchEvent(new Event("storage"));
                        }
                      } catch (e) {
                        console.error("Failed to mark reminder completed from notification:", e);
                      }
                      setActiveNotification(null);
                    }}
                    className="px-3 py-1.5 bg-primary text-white text-[11px] font-semibold rounded-[8px] hover:bg-[#1e2db8] transition-colors cursor-pointer shadow-sm"
                  >
                    ✓ Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.2)] animate-scale-in">
            <div className="text-[32px] text-center mb-[12px]">🔒</div>
            <div className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign in required</div>
            <div className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
              Please sign in or create an account to {authPromptReason}.
            </div>
            <div className="flex flex-col gap-[10px]">
              <button
                onClick={() => {
                  setShowAuthPrompt(false);
                  handleLogout();
                }}
                className="h-[48px] w-full rounded-[14px] bg-primary text-white font-semibold text-[14px] hover:bg-[#1e2db8] transition cursor-pointer"
              >
                Sign in / Create account
              </button>
              <button
                onClick={() => {
                  setShowAuthPrompt(false);
                }}
                className="h-[48px] w-full rounded-[14px] border border-gray-200 text-gray-600 font-semibold text-[14px] hover:bg-gray-50 transition cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid h-[100dvh] w-full min-w-0 grid-cols-1 gap-[6px] overflow-hidden bg-[#f3f4f6] p-[6px] lg:grid-cols-[clamp(240px,18vw,280px)_minmax(0,1fr)] 2xl:grid-cols-[clamp(240px,18vw,280px)_minmax(0,1fr)_clamp(250px,18vw,300px)]">
        <Sidebar 
          userId={userId} 
          userProfile={userProfile}
          userEmail={authSession.email}
          sessionId={chat.conversationId ?? "new-conversation"}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          onOpenChat={openChatView}
          onStartNewChat={openFreshChat}
          onOpenFinancialHealthTests={openTestCatalog}
          onOpenProfile={openProfilePage}
          onOpenEducation={openEducation}
          onOpenAdvisor={openAdvisor}
          onOpenAdmin={openAdmin}
          onLogout={handleLogout}
          initialActiveNav={activeSidebarNav}
          onSelectMood={handleSelectMood}
          onOpenLoanCalculator={openLoanCalculator}
          onOpenEligibilityCibil={openEligibilityCibil}
          onOpenDashboard={openDashboard}
          onOpenReminders={openReminders}
        />
        <div className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {mainView === "chat" || mainView === "goals" ? (
            <ChatArea
            conversationId={chat.conversationId}
            conversationCount={chat.conversationCount}
            error={chat.error}
            isHealthy={chat.isHealthy}
            isLoading={chat.isLoading}
            isSendingMessage={chat.isSendingMessage}
            messages={chat.messages}
            userProfile={userProfile}
            remainingHearts={authSession?.isGuest ? authSession.hearts ?? null : null}
            onClearChat={chat.clearMessages}
            onMoodUpdate={handleMoodUpdate}
            onSendMessage={handleSendMessage}
            onEditMessage={chat.editMessage}
            onStopSendingMessage={chat.stopSendingMessage}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            isSidebarOpen={sidebarOpen}
            isInsightsOpen={insightsOpen}
            prefillMessage={prefillMessage ?? undefined}
            onClearPrefill={() => setPrefillMessage(null)}
            onSignupPrompt={() => {
              clearStoredAuthSession();
              setAuthSession(null);
            }}
            onOpenEligibilityCibil={openEligibilityCibil}
            onOpenProfile={openProfilePage}
            onLogout={handleLogout}
          />
        ) : mainView === "tests" ? (
          <FinancialHealthTestCatalog
            userId={userId}
            isGuest={authSession?.isGuest ?? true}
            onLoginRequired={() => { clearStoredAuthSession(); setAuthSession(null); }}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onOpenFinancialLiteracyTest={openFinancialLiteracyInNewTab}
            onOpenEmergencyFundCheck={openEmergencyFundCheck}
            onOpenLoanFitTest={openLoanFitTest}
            onOpenDebtBalanceReview={openDebtBalanceReview}
            onOpenCreditReadiness={openCreditReadiness}
          />
        ) : mainView === "emergency-fund" ? (
          <EmergencyFundCheckView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onBackToCatalog={openTestCatalog}
            onOpenFinancialWellnessAssistant={openChatView}
          />
        ) : mainView === "education" ? (
          <FinancialEducation
              userId={userId}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onAskAboutContent={(payload) => {
                setMainView("chat");
                const context = payload.type === "article"
                  ? "Article: \"" + payload.title + "\" (" + payload.url + ") — " + payload.description
                  : "Video: \"" + payload.title + "\" — " + payload.description;
                setTimeout(() => {
                  setPrefillMessage({ text: "", card: context });
                }, 200);
              }}
            />
        ) : mainView === "financial-literacy" ? (
          <FinancialLiteracyTestView
            userId={userId}
            isGuest={authSession?.isGuest ?? true}
            onLoginRequired={handleLogout}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onBackToCatalog={openTestCatalog}
          />
        ) : mainView === "loan-fit" ? (
          <LoanFitTestView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onBackToCatalog={openTestCatalog}
            onOpenFinancialWellnessAssistant={openChatView}
          />
        ) : mainView === "credit-readiness" ? (
          <CreditReadinessReviewView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onBackToCatalog={openTestCatalog}
            onOpenFinancialWellnessAssistant={openChatView}
          />
        ) : mainView === "profile" ? (
          <ProfilePage
            userId={userId}
            userProfile={userProfile}
            email={authSession.email}
            isAdvisor={isUserAdvisor(authSession.email)}
            onBackToChat={openChatView}
            onSaveProfile={handleProfileSave}
          />
        ) : mainView === "advisor" ? (
          <AdvisorPanel
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            isGuest={authSession?.isGuest ?? true}
            onLoginRequired={handleLogout}
          />
        ) : mainView === "admin" ? (
          <AdminPortal
            userId={userId}
            userEmail={authSession.email || ""}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
          />
        ) : mainView === "loan-calculator" ? (
          <LoanCalculatorView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onApplyNow={handleApplyLoan}
            onTalkToAdvisor={() => setMainView("advisor")}
            isGuest={authSession?.isGuest ?? true}
            onLoginRequired={handleLogout}
          />
        ) : mainView === "dashboard" ? (
          <Dashboard
            userId={userId}
            userProfile={userProfile}
            isSidebarOpen={sidebarOpen}
            isInsightsOpen={insightsOpen}
            onNavigate={(page, conversationId) => {
              if (page === "Talk to FinHeal") {
                if (conversationId) {
                  handleConversationSelect(conversationId);
                } else {
                  openFreshChat();
                }
              } else if (page === "Financial Goals") {
                const email = authSession?.email;
                const isStaff = authSession?.isAdvisor || (email && ["admin@finheal.com", "admin@f2finheal.com"].includes(email.toLowerCase())) || isUserAdvisor(email);
                if (!isStaff) {
                  setMainView("goals");
                }
              } else if (page === "Financial Health Test") {
                setMainView("tests");
              } else if (page === "Talk to an Advisor") {
                setMainView("advisor");
              } else if (page === "Financial Education") {
                setMainView("education");
              } else if (page === "Eligibility & CIBIL Checker") {
                setMainView("eligibility-cibil");
              }
            }}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
          />
        ) : mainView === "eligibility-cibil" ? (
          <EligibilityCibilView
            userId={userId}
            userEmail={authSession.email || ""}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onApplyNow={handleApplyLoan}
            onTalkToAdvisor={() => setMainView("advisor")}
          />
        ) : mainView === "cibil-analyzer" ? (
          <CibilAnalyzerView
            userId={userId}
            userEmail={authSession.email || ""}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onApplyNow={handleApplyLoan}
            onTalkToAdvisor={() => setMainView("advisor")}
          />
        ) : mainView === "reminders" ? (
          <RemindersView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onOpenFinancialWellnessAssistant={openChatView}
          />
        ) : (
          <DebtBalanceReviewView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onBackToCatalog={openTestCatalog}
            onOpenFinancialWellnessAssistant={openChatView}
          />
        )}

        {/* Global Pinned Profile Dropdown */}
        {userProfile && (
          <div className="global-profile-dropdown absolute right-[12px] z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="global-profile-avatar relative flex items-center justify-center w-10 h-10 rounded-full cursor-pointer focus:outline-none transition-all duration-300 hover:scale-105 hover:rotate-3 select-none bg-gradient-to-tr from-primary via-indigo-600 to-violet-500 text-white shadow-md border-2 border-white/90 dark:border-slate-800">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-[14px] tracking-wide drop-shadow-sm select-none">
                      {userProfile.initials}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 px-1 py-1.5">
                    <div className="relative flex w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm items-center justify-center shrink-0">
                      {userProfile.avatarUrl ? (
                        <img
                          src={userProfile.avatarUrl}
                          alt={userProfile.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{userProfile.initials}</span>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {userProfile.displayName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {userProfile.email?.toLowerCase().endsWith("@f2fintech.com") ? "Employee" : "Standard"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openProfilePage}
                  className="cursor-pointer text-gray-700 dark:text-slate-200 focus:bg-gray-50 dark:focus:bg-slate-800 focus:text-gray-900 dark:focus:text-slate-100 flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/30 focus:text-rose-700 dark:focus:text-rose-300 flex items-center gap-2 px-3 py-2 rounded-md transition-colors font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-rose-500">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        </div>
        <InsightsPanel
          conversationId={chat.conversationId}
          conversations={chat.conversations}
          conversationCount={chat.conversationCount}
          moodDimensions={currentMoodDims}
          onConversationSelect={handleConversationSelect}
          onDeleteConversation={handleConversationDelete}
          onRenameConversation={chat.renameConversation}
          sessionId={chat.conversationId ?? "new-conversation"}
          userId={userId}
          isOpen={insightsOpen}
          onClose={closeInsights}
          isAdvisor={isUserAdvisor(authSession?.email)}
          isAdmin={authSession?.email === "admin@finheal.com" || authSession?.email === "admin@f2finheal.com"}
        />
      </div>
    </>
  );
}


