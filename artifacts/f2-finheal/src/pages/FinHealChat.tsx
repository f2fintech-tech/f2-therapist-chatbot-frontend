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
  const chat = useBackendChat(USER_ID);

  const handleMoodUpdate = (dims: MoodDimensions) => {
    setCurrentMoodDims(dims);
  };

  return (
    <div className="flex h-[100dvh] w-[100vw] overflow-hidden bg-[#f3f4f6] gap-[6px] p-[6px]">
      <Sidebar 
        userId={USER_ID} 
        userProfile={USER_PROFILE}
        sessionId={chat.conversationId ?? "new-conversation"} 
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
      />
      <InsightsPanel
        conversationId={chat.conversationId}
        conversations={chat.conversations}
        conversationCount={chat.conversationCount}
        moodDimensions={currentMoodDims}
        onConversationSelect={chat.loadConversation}
        sessionId={chat.conversationId ?? "new-conversation"}
        userId={USER_ID}
      />
    </div>
  );
}
