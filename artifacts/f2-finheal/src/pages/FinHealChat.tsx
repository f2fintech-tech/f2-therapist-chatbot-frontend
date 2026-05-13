import { useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import InsightsPanel from "@/components/InsightsPanel";
import { useBackendChat } from "@/hooks/useBackendChat";
import type { MoodDimensions } from "@/lib/backendChat";
import { getDemoLoginCredentials, getStoredDemoSession, signInDemoAccount, signOutDemoAccount } from "@/utils/demoAuth";
import { createUserProfile } from "@/utils/user";

const loginDefaults = getDemoLoginCredentials();

export default function FinHealChat() {
  const [authSession, setAuthSession] = useState(() => getStoredDemoSession());
  const [loginUsername, setLoginUsername] = useState(loginDefaults.username);
  const [loginPassword, setLoginPassword] = useState(loginDefaults.password);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const userId = authSession?.userId || "";
  const userProfile = authSession ? createUserProfile(userId, authSession.displayName) : null;
  const chat = useBackendChat(userId);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = signInDemoAccount(loginUsername, loginPassword);
    if (!session) {
      setLoginError("Invalid demo credentials. Use the sample username and password shown on the card.");
      return;
    }

    setAuthSession(session);
    setLoginError(null);
    setCurrentMoodDims(null);
  };

  const handleLogout = () => {
    signOutDemoAccount();
    setAuthSession(null);
    setLoginError(null);
    setCurrentMoodDims(null);
    setSidebarOpen(false);
    setInsightsOpen(false);
  };

  const handleMoodUpdate = (dims: MoodDimensions) => {
    setCurrentMoodDims(dims);
  };

  const closeSidebar = () => setSidebarOpen(false);
  const closeInsights = () => setInsightsOpen(false);

  if (!authSession || !userProfile) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[radial-gradient(circle_at_top,_#eef0fd_0%,_#f8fafc_42%,_#ffffff_100%)] p-4">
        <div className="w-full max-w-[460px] rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-2xl text-white shadow-[0_10px_24px_rgba(50,68,230,0.22)]">
              💙
            </div>
            <div>
              <div className="text-[22px] font-bold text-gray-900">F2 FinHeal</div>
              <div className="text-sm text-gray-500">Demo login for chats and goals</div>
            </div>
          </div>

          <div className="mb-5 rounded-[18px] border border-[#d4d8fa] bg-[#f6f7fe] p-4 text-sm text-gray-600">
            Use the sample demo profile below. The login is stored in your browser so the same chats and goals reopen after refresh or restart.
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Demo Username</span>
              <input
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                className="w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder={loginDefaults.username}
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Demo Password</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="FinHeal@123"
                autoComplete="current-password"
              />
            </label>

            {loginError && (
              <div className="rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="h-12 w-full rounded-[14px] bg-primary text-white font-semibold shadow-[0_12px_24px_rgba(50,68,230,0.2)] transition hover:bg-[#1e2db8]"
            >
              Sign in to demo profile
            </button>
          </form>

          <div className="mt-5 rounded-[18px] border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <div className="mb-2 font-semibold text-gray-800">Sample credentials</div>
            <div>Username: {loginDefaults.username}</div>
            <div>Password: {loginDefaults.password}</div>
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
      />
      <ChatArea
        conversationId={chat.conversationId}
        conversationCount={chat.conversationCount}
        error={chat.error}
        isHealthy={chat.isHealthy}
        isLoading={chat.isLoading}
        messages={chat.messages}
        userProfile={userProfile}
        onClearChat={chat.clearMessages}
        onMoodUpdate={handleMoodUpdate}
        onSendMessage={chat.sendMessage}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onToggleInsights={() => setInsightsOpen((open) => !open)}
        onLogout={handleLogout}
      />
      <InsightsPanel
        conversationId={chat.conversationId}
        conversations={chat.conversations}
        conversationCount={chat.conversationCount}
        moodDimensions={currentMoodDims}
        onConversationSelect={chat.loadConversation}
        sessionId={chat.conversationId ?? "new-conversation"}
        userId={userId}
        isOpen={insightsOpen}
        onClose={closeInsights}
      />
    </div>
  );
}
