import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import InsightsPanel from "@/components/InsightsPanel";
import { useBackendChat } from "@/hooks/useBackendChat";
import type { MoodDimensions } from "@/lib/backendChat";

const USER_ID = "user_aditya";

export default function FinHealChat() {
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const chat = useBackendChat(USER_ID);

  const handleMoodUpdate = (dims: MoodDimensions) => {
    setCurrentMoodDims(dims);
  };

  return (
    <div className="flex h-[100dvh] w-[100vw] overflow-hidden bg-[#f3f4f6] gap-[6px] p-[6px]">
      <Sidebar userId={USER_ID} sessionId={chat.conversationId ?? "new-conversation"} />
      <ChatArea
        conversationId={chat.conversationId}
        conversationCount={chat.conversationCount}
        error={chat.error}
        isHealthy={chat.isHealthy}
        isLoading={chat.isLoading}
        messages={chat.messages}
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
