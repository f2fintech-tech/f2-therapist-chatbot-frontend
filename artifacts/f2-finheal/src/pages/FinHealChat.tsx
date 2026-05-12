import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import InsightsPanel from "@/components/InsightsPanel";
import { useBackendChat } from "@/hooks/useBackendChat";
import type { MoodDimensions } from "@/lib/backendChat";
import { getOrCreateUserProfile } from "@/utils/user";
import type { UserProfile } from "@/utils/user";

const USER_ID_STORAGE_KEY = "finheal-user-id";

function resolveUserId(): string {
  const envUserId = import.meta.env.VITE_USER_ID?.trim();
  if (envUserId) {
    return envUserId;
  }

  if (typeof window === "undefined") {
    return "123e4567-e89b-12d3-a456-426614174000";
  }

  const existing = window.sessionStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = window.crypto?.randomUUID?.() ?? "123e4567-e89b-12d3-a456-426614174000";
  window.sessionStorage.setItem(USER_ID_STORAGE_KEY, generated);
  return generated;
}

const USER_ID = resolveUserId();
const USER_PROFILE = getOrCreateUserProfile(USER_ID);

export default function FinHealChat() {
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const chat = useBackendChat(USER_ID);

  const handleMoodUpdate = (dims: MoodDimensions) => {
    setCurrentMoodDims(dims);
  };

  const closeSidebar = () => setSidebarOpen(false);
  const closeInsights = () => setInsightsOpen(false);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col gap-[6px] overflow-y-auto bg-[#f3f4f6] p-[6px] lg:h-[100dvh] lg:flex-row lg:overflow-hidden">
      <Sidebar 
        userId={USER_ID} 
        userProfile={USER_PROFILE}
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
        userProfile={USER_PROFILE}
        onClearChat={chat.clearMessages}
        onMoodUpdate={handleMoodUpdate}
        onSendMessage={chat.sendMessage}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onToggleInsights={() => setInsightsOpen((open) => !open)}
      />
      <InsightsPanel
        conversationId={chat.conversationId}
        conversations={chat.conversations}
        conversationCount={chat.conversationCount}
        moodDimensions={currentMoodDims}
        onConversationSelect={chat.loadConversation}
        sessionId={chat.conversationId ?? "new-conversation"}
        userId={USER_ID}
        isOpen={insightsOpen}
        onClose={closeInsights}
      />
    </div>
  );
}
