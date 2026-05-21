import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import FinancialHealthTestCatalog from "@/components/FinancialHealthTestCatalog";
import FinancialLiteracyTestView from "@/components/FinancialLiteracyTestView";
import EmergencyFundCheckView from "@/components/EmergencyFundCheckView";
import LoanFitTestView from "@/components/LoanFitTestView";
import DebtBalanceReviewView from "@/components/DebtBalanceReviewView";
import CreditReadinessReviewView from "@/components/CreditReadinessReviewView";
import InsightsPanel from "@/components/InsightsPanel";
import { useBackendChat } from "@/hooks/useBackendChat";
import type { MoodDimensions } from "@/lib/backendChat";
import { deleteLocalConversation, migrateConversationsFromUserId } from "@/utils/localConversations";
import { deleteConversation as apiDeleteConversation } from "@/lib/backendChat";
import { createUserProfile } from "@/utils/user";
import { getStoredAuthSession, setStoredAuthSession, clearStoredAuthSession } from "@/utils/authSession";
import { signInUser, signUpUser, signInGuest, fetchHearts } from "@/lib/backendAuth";
import QuizPopup from "@/components/QuizPopup/QuizPopup";

const loginDefaults = {
  username: "",
  password: "",
};

export default function FinHealChat() {
  const getInitialMainView = () => {
    if (typeof window === "undefined") {
      return "chat" as const;
    }

    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "financial-literacy") {
      return "financial-literacy" as const;
    }

    if (view === "emergency-fund") {
      return "emergency-fund" as const;
    }

    if (view === "tests") {
      return "tests" as const;
    }

    if (view === "loan-fit") {
      return "loan-fit" as const;
    }

    if (view === "credit-readiness") {
      return "credit-readiness" as const;
    }

    if (view === "debt-balance") {
      return "debt-balance" as const;
    }

    

    return "chat" as const;
  };

  const [authSession, setAuthSession] = useState(() => getStoredAuthSession());
  const [loginUsername, setLoginUsername] = useState(loginDefaults.username);
  const [loginDisplayName, setLoginDisplayName] = useState("");
  const [loginLastName, setLoginLastName] = useState("");
  const [loginPassword, setLoginPassword] = useState(loginDefaults.password);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [mainView, setMainView] = useState<"chat" | "tests" | "financial-literacy" | "emergency-fund" | "loan-fit" | "debt-balance" | "credit-readiness">(getInitialMainView);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const mainViewRef = useRef(mainView);
  const userId = authSession?.userId || "";
  const userProfile = authSession ? createUserProfile(userId, authSession.displayName) : null;
  const chat = useBackendChat(userId);

  // Show signup modal automatically when hearts run out
  useEffect(() => {
    if (chat.heartsExhausted && authSession?.isGuest) {
      setAuthMode("signup");
      clearStoredAuthSession();
      setAuthSession(null);
    }
  }, [chat.heartsExhausted, authSession]);

  const [showQuizPopup, setShowQuizPopup] = useState(false);

  useEffect(() => {
    mainViewRef.current = mainView;
  }, [mainView]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (mainViewRef.current === "chat" && !window.localStorage.getItem("finheal_quiz_completed")) {
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
    if (typeof window === "undefined") {
      return;
    }

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

  const persistSession = (session: typeof authSession) => {
    if (session) {
      setStoredAuthSession(session);
      setAuthSession(session);
    }
  };

  const refreshHearts = useCallback(async () => {
    if (!authSession?.userId) {
      return;
    }

    try {
      const hearts = await fetchHearts(authSession.userId);
      const nextSession = { ...authSession, hearts };
      setStoredAuthSession(nextSession);
      setAuthSession(nextSession);
    } catch {
      // Ignore refresh failures; hearts may still be available from the stored session.
    }
  }, [authSession]);

  useEffect(() => {
    if (authSession?.userId && authSession.hearts == null) {
      void refreshHearts();
    }
  }, [authSession, refreshHearts]);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const guestUserId = authSession?.isGuest ? authSession.userId : null;
      const payload = authMode === "signup"
        ? await signUpUser(loginUsername.trim(), loginPassword, guestUserId ?? undefined, [loginDisplayName.trim(), loginLastName.trim()].filter(Boolean).join(' ') || loginUsername.trim())
        : await signInUser(loginUsername.trim(), loginPassword);

      // Migrate any local guest conversations to the real user ID
      if (guestUserId && payload.userId && guestUserId !== payload.userId) {
        migrateConversationsFromUserId(guestUserId, payload.userId);
        // Also migrate test results in backend
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api/v1"}/test-results/migrate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from_user_id: guestUserId, to_user_id: payload.userId }),
          });
        } catch {}
      }

      persistSession(payload);
      setCurrentMoodDims(null);
      setMainView("chat");
    } catch (error) {
      let message = error instanceof Error ? error.message : "Unable to authenticate. Please try again.";
      
      // Check for our specific error or try to parse the JSON
      if (message.includes("Invalid email or password")) {
        message = "Incorrect password or email. Please check and try again.";
      } else if (message.includes("{")) {
        try {
          const parsed = JSON.parse(message);
          message = parsed.detail || parsed.error || message;
        } catch (e) {
          // If it fails to parse, just keep the original message
        }
      }
      
      setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const session = await signInGuest(authSession?.isGuest ? authSession.userId : undefined);
      persistSession(session);
      setCurrentMoodDims(null);
      setMainView("chat");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in as guest.";
      setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    const wasGuest = authSession?.isGuest ?? false;
    clearStoredAuthSession();
    setAuthSession(null);
    if (wasGuest) {
      window.localStorage.removeItem("finheal_quiz_completed");
      window.localStorage.removeItem("finheal_user_tier");
      window.localStorage.removeItem("finheal_quiz_score");
    }
    setLoginError(null);
    setCurrentMoodDims(null);
    setSidebarOpen(false);
    setInsightsOpen(false);
    setMainView("chat");
  };

  const handleSendMessage = useCallback(async (text: string) => {
    await chat.sendMessage(text);
    await refreshHearts();
  }, [chat, refreshHearts]);

  const handleMoodUpdate = useCallback((dims: MoodDimensions | null) => {
    setCurrentMoodDims((prev) => {
      if (prev === dims) {
        return prev;
      }

      if (prev && dims) {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(dims);
        if (
          prevKeys.length === nextKeys.length &&
          prevKeys.every((key) => prev[key] === dims[key])
        ) {
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
      try {
        deleteLocalConversation(conversationId, userId);
      } catch {}
    } finally {
      try {
        // Ensure local fallback is removed as well to avoid it reappearing
        try {
          deleteLocalConversation(conversationId, userId);
        } catch {}

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
  const activeSidebarNav = mainView === "chat"
    ? "Talk to FinHeal"
    : "Financial Health Test";
  const openFinancialLiteracyInNewTab = () => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("view", "financial-literacy");
    window.open(nextUrl.toString(), "_blank", "noopener,noreferrer");
  };

  if (!authSession || !userProfile) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[radial-gradient(circle_at_top,_#eef0fd_0%,_#f8fafc_42%,_#ffffff_100%)] p-4">
        <div className="w-full max-w-[520px] rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-2xl text-white shadow-[0_10px_24px_rgba(50,68,230,0.22)]">
              💙
            </div>
            <div>
              <div className="text-[22px] font-bold text-gray-900">Login or sign up</div>
              <div className="text-sm text-gray-500">Access the FinHeal chat with persistent account authentication.</div>
            </div>
          </div>

          <div className="mb-6 rounded-[18px] border border-[#d4d8fa] bg-[#f6f7fe] p-4 text-sm text-gray-600">
            Create a new account, sign in with existing credentials, or continue as a guest. Your session token is stored securely in browser storage.
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`rounded-[14px] px-4 py-3 text-[14px] font-semibold transition ${authMode === "login" ? "bg-primary text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`rounded-[14px] px-4 py-3 text-[14px] font-semibold transition ${authMode === "signup" ? "bg-primary text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div className="flex gap-3">
                <label className="block flex-1">
                  <span className="mb-2 block text-sm font-medium text-gray-700">First name <span className="text-red-500">*</span></span>
                  <input
                    value={loginDisplayName}
                    onChange={(event) => setLoginDisplayName(event.target.value)}
                    className="w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="e.g. John"
                    autoComplete="given-name"
                    required
                  />
                </label>
                <label className="block flex-1">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Last name</span>
                  <input
                    value={loginLastName}
                    onChange={(event) => setLoginLastName(event.target.value)}
                    className="w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="e.g. Smith"
                    autoComplete="family-name"
                  />
                </label>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
              <input
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                className="w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="you@example.com"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full rounded-[14px] border border-gray-200 bg-white py-3 pl-4 pr-12 text-[15px] text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Enter your password"
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {loginError && (
              <div className="rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative flex h-12 w-full items-center justify-center rounded-[14px] bg-primary font-semibold text-white shadow-[0_12px_24px_rgba(50,68,230,0.2)] transition hover:bg-[#1e2db8] disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                authMode === "signup" ? "Create account" : "Sign in"
              )}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
              className="h-12 w-full rounded-[14px] border border-gray-200 bg-white text-gray-700 font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto px-4"
            >
              Continue as guest
            </button>
            <div className="text-sm text-gray-500">
              {authMode === "signup"
                ? "Already have an account? "
                : "No account yet? "}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                className="text-primary font-semibold hover:underline"
              >
                {authMode === "signup" ? "Sign in" : "Create account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <QuizPopup
        visible={showQuizPopup && mainView === "chat"}
        onDismiss={() => setShowQuizPopup(false)}
        onComplete={handleQuizComplete}
      />
    <div className="grid h-[100dvh] w-full min-w-0 grid-cols-1 gap-[6px] overflow-hidden bg-[#f3f4f6] p-[6px] lg:grid-cols-[clamp(240px,18vw,280px)_minmax(0,1fr)] 2xl:grid-cols-[clamp(240px,18vw,280px)_minmax(0,1fr)_clamp(250px,18vw,300px)]">
      <Sidebar 
        userId={userId} 
        userProfile={userProfile}
        sessionId={chat.conversationId ?? "new-conversation"}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onOpenChat={openChatView}
        onStartNewChat={openFreshChat}
        onOpenFinancialHealthTests={openTestCatalog}
        initialActiveNav={activeSidebarNav}
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
          remainingHearts={authSession?.hearts ?? null}
          onClearChat={chat.clearMessages}
          onMoodUpdate={handleMoodUpdate}
          onSendMessage={handleSendMessage}
          onStopSendingMessage={chat.stopSendingMessage}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onLogout={handleLogout}
          onSignupPrompt={() => {
            setAuthMode("signup");
            clearStoredAuthSession();
            setAuthSession(null);
          }}
        />
      ) : mainView === "tests" ? (
        <FinancialHealthTestCatalog
          userId={userId}
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
      ) : mainView === "financial-literacy" ? (
        <FinancialLiteracyTestView
          userId={userId}
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
