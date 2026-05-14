import { useCallback, useEffect, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import FinancialHealthTestCatalog from "@/components/FinancialHealthTestCatalog";
import FinancialLiteracyTestView from "@/components/FinancialLiteracyTestView";
import InsightsPanel from "@/components/InsightsPanel";
import { useBackendChat } from "@/hooks/useBackendChat";
import type { MoodDimensions } from "@/lib/backendChat";
import { deleteLocalConversation } from "@/utils/localConversations";
import { deleteConversation as apiDeleteConversation } from "@/lib/backendChat";
import { createUserProfile } from "@/utils/user";
import { getStoredAuthSession, setStoredAuthSession, clearStoredAuthSession } from "@/utils/authSession";
import { signInUser, signUpUser, signInGuest, fetchHearts } from "@/lib/backendAuth";

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

    if (view === "tests") {
      return "tests" as const;
    }

    return "chat" as const;
  };

  const [authSession, setAuthSession] = useState(() => getStoredAuthSession());
  const [loginUsername, setLoginUsername] = useState(loginDefaults.username);
  const [loginPassword, setLoginPassword] = useState(loginDefaults.password);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [mainView, setMainView] = useState<"chat" | "tests" | "financial-literacy">(getInitialMainView);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const userId = authSession?.userId || "";
  const userProfile = authSession ? createUserProfile(userId, authSession.displayName) : null;
  const chat = useBackendChat(userId);

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
      const payload = authMode === "signup"
        ? await signUpUser(loginUsername.trim(), loginPassword, authSession?.isGuest ? authSession.userId : undefined)
        : await signInUser(loginUsername.trim(), loginPassword);

      persistSession(payload);
      setCurrentMoodDims(null);
      setMainView("chat");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate. Please try again.";
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
    clearStoredAuthSession();
    setAuthSession(null);
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
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Enter your password"
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
              />
            </label>

            {loginError && (
              <div className="rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-[14px] bg-primary text-white font-semibold shadow-[0_12px_24px_rgba(50,68,230,0.2)] transition hover:bg-[#1e2db8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authMode === "signup" ? "Create account" : "Sign in"}
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
    <div className="flex h-[100dvh] w-full flex-col gap-[6px] overflow-hidden bg-[#f3f4f6] p-[6px] xl:flex-row">
      <Sidebar 
        userId={userId} 
        userProfile={userProfile}
        sessionId={chat.conversationId ?? "new-conversation"}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onOpenChat={openChatView}
        onOpenFinancialHealthTests={openTestCatalog}
      />
      {mainView === "chat" ? (
        <ChatArea
          conversationId={chat.conversationId}
          conversationCount={chat.conversationCount}
          error={chat.error}
          isHealthy={chat.isHealthy}
          isLoading={chat.isLoading}
          messages={chat.messages}
          userProfile={userProfile}
          remainingHearts={authSession?.hearts ?? null}
          onClearChat={chat.clearMessages}
          onMoodUpdate={handleMoodUpdate}
          onSendMessage={handleSendMessage}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onLogout={handleLogout}
        />
      ) : mainView === "tests" ? (
        <FinancialHealthTestCatalog
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onOpenFinancialLiteracyTest={openFinancialLiteracyInNewTab}
        />
      ) : (
        <FinancialLiteracyTestView
          userId={userId}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onBackToCatalog={openTestCatalog}
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
  );
}
