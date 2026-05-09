import { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import InsightsPanel from "@/components/InsightsPanel";
import type { MoodDimensions } from "@workspace/api-client-react/src/generated/api.schemas";

const USER_ID = "user_aditya";

export default function FinHealChat() {
  const [sessionId, setSessionId] = useState("session_1");
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);

  const handleMoodUpdate = (dims: MoodDimensions) => {
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
