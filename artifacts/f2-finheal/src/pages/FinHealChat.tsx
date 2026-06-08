import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
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
import { deleteLocalConversation } from "@/utils/localConversations";
import { deleteConversation as apiDeleteConversation } from "@/lib/backendChat";
import { createUserProfile } from "@/utils/user";
import { getStoredAuthSession, setStoredAuthSession, clearStoredAuthSession } from "@/utils/authSession";
import { fetchHearts } from "@/lib/backendAuth";
import QuizPopup from "@/components/QuizPopup/QuizPopup";
import WelcomeSplash from "@/components/WelcomeSplash";
import FinancialEducation from "@/components/FinancialEducation";
import AdvisorPanel from "@/components/AdvisorPanel";
import AdminPortal from "@/components/AdminPortal"; // Dynamic admin/expert workspace portal
import LoanCalculatorView from "@/components/LoanCalculatorView";
import CibilAnalyzerView from "@/components/CibilAnalyzerView";
import EligibilityCibilView from "@/components/EligibilityCibilView";

export default function FinHealChat() {

  const getInitialMainView = () => {
    if (typeof window === "undefined") return "chat" as const;
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "financial-literacy") return "financial-literacy" as const;
    if (view === "emergency-fund") return "emergency-fund" as const;
    if (view === "tests") return "tests" as const;
    if (view === "loan-fit") return "loan-fit" as const;
    if (view === "credit-readiness") return "credit-readiness" as const;
    if (view === "debt-balance") return "debt-balance" as const;
    if (view === "profile") return "profile" as const;
    if (view === "advisor") return "advisor" as const;
    if (view === "admin") return "admin" as const;
    if (view === "loan-calculator") return "loan-calculator" as const;
    if (view === "cibil-analyzer") return "cibil-analyzer" as const;
    if (view === "eligibility-cibil") return "eligibility-cibil" as const;
    return "chat" as const;
  };

  const [authSession, setAuthSession] = useState(() => getStoredAuthSession());
  const [showWelcome, setShowWelcome] = useState(false);
  const [prevGuestSession, setPrevGuestSession] = useState<typeof authSession>(null);
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [mainView, setMainView] = useState<"chat" | "tests" | "financial-literacy" | "education" | "emergency-fund" | "loan-fit" | "debt-balance" | "credit-readiness" | "profile" | "advisor" | "admin" | "loan-calculator" | "cibil-analyzer" | "eligibility-cibil">(getInitialMainView);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState("");


  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState<{text: string; card: string} | null>(null);
  const mainViewRef = useRef(mainView);
  const userId = authSession?.userId || "";
  const userProfile = authSession ? createUserProfile(userId, authSession.displayName, authSession.avatarUrl) : null;
  const chat = useBackendChat(userId);

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
      try { deleteLocalConversation(conversationId, userId); } catch {}
    } finally {
      try {
        try { deleteLocalConversation(conversationId, userId); } catch {}
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
    nextUrl.searchParams.set("view", view);
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

  const activeSidebarNav = mainView === "chat"
    ? "Talk to FinHeal"
    : mainView === "profile"
      ? "Settings"
      : mainView === "advisor"
        ? "Talk to an Advisor"
        : mainView === "admin"
          ? (authSession && authSession.email && ["sneha@finheal.com", "aradhya@finheal.com", "vikram@finheal.com", "rohan@finheal.com", "priya@finheal.com"].includes(authSession.email)
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
                  : "Financial Health Test";
  const openFinancialLiteracyInNewTab = () => {
    if (typeof window === "undefined") return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("view", "financial-literacy");
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
        />
        {mainView === "chat" ? (
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
            onStopSendingMessage={chat.stopSendingMessage}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            prefillMessage={prefillMessage ?? undefined}
            onClearPrefill={() => setPrefillMessage(null)}
            onSignupPrompt={() => {
              clearStoredAuthSession();
              setAuthSession(null);
            }}
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
        ) : mainView === "eligibility-cibil" ? (
          <EligibilityCibilView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onApplyNow={handleApplyLoan}
            onTalkToAdvisor={() => setMainView("advisor")}
          />
        ) : mainView === "cibil-analyzer" ? (
          <CibilAnalyzerView
            userId={userId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
            onApplyNow={handleApplyLoan}
            onTalkToAdvisor={() => setMainView("advisor")}
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
        <InsightsPanel
          conversationId={chat.conversationId}
          conversations={chat.conversations}
          conversationCount={chat.conversationCount}
          moodDimensions={currentMoodDims}
          onConversationSelect={handleConversationSelect}
          onDeleteConversation={handleConversationDelete}
          sessionId={chat.conversationId ?? "new-conversation"}
          userId={userId}
          isOpen={insightsOpen}
          onClose={closeInsights}
        />
      </div>
    </>
  );
}


