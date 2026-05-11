import { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import InsightsPanel from "@/components/InsightsPanel";
import type { BackendMoodDimensions } from "@/services/backend-chat";

const USER_ID = import.meta.env.VITE_USER_ID || "550e8400-e29b-41d4-a716-446655440000";

export default function FinHealChat() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentMoodDims, setCurrentMoodDims] = useState<BackendMoodDimensions | null>(null);

  const handleMoodUpdate = (dims: BackendMoodDimensions) => {
    setCurrentMoodDims(dims);
  };

  return (
    <div className="flex h-[100dvh] w-[100vw] overflow-hidden bg-[#f3f4f6] gap-[6px] p-[6px]">
      <Sidebar userId={USER_ID} sessionId={sessionId} />
      <ChatArea 
        userId={USER_ID} 
        sessionId={sessionId} 
        onMoodUpdate={handleMoodUpdate}
      />
      <InsightsPanel 
        userId={USER_ID} 
        sessionId={sessionId} 
        moodDimensions={currentMoodDims} 
      />
    </div>
  );
}
