import { useEffect, useRef, useState } from "react";
import type { BackendRequestError, ChatMessage, MoodDimensions } from "@/lib/backendChat";
import type { UserProfile } from "@/utils/user";

interface ChatAreaProps {
  conversationId: string | null;
  conversationCount: number;
  error: BackendRequestError | null;
  isHealthy: boolean | null;
  isLoading: boolean;
  messages: ChatMessage[];
  userProfile: UserProfile;
  onClearChat: () => void;
  onMoodUpdate: (dims: MoodDimensions) => void;
  onSendMessage: (text: string) => Promise<void>;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
}

export default function ChatArea({
  conversationId,
  conversationCount,
  error,
  isHealthy,
  isLoading,
  messages,
  userProfile,
  onClearChat,
  onMoodUpdate,
  onSendMessage,
  onToggleSidebar,
  onToggleInsights,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const latestBotMessage = [...messages].reverse().find((message) => message.role === "bot" && message.mood);
    if (!latestBotMessage?.mood) {
      return;
    }

    const dimensions = latestBotMessage.mood.dimensions;
    if (dimensions && Object.keys(dimensions).length > 0) {
      onMoodUpdate(dimensions);
    }
  }, [messages, onMoodUpdate]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setInputValue("");

    try {
      await onSendMessage(text.trim());
    } catch {
      // The hook already normalizes and stores the error state.
    }
  };

  const statusLabel = isHealthy === null ? "Checking backend..." : isHealthy ? "Backend connected" : "Backend unavailable";
  const latestConversation = conversationId ? `Conversation ${conversationId.slice(0, 8)}` : "New conversation";

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(inputValue);
    }
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100 lg:min-h-0">
      <div className="flex flex-col gap-[10px] border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
        <div className="flex items-start gap-[10px] sm:items-center">
          <button
            onClick={onToggleSidebar}
            className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 lg:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Financial Wellness Chat</div>
            <div className="text-[10px] text-gray-400 flex flex-wrap items-center gap-x-[5px] gap-y-[2px] mt-[1px] sm:text-[11px]">
              <span
                className={`w-[6px] h-[6px] rounded-full shadow-[0_0_0_2px_#ecfdf5] ${isHealthy === false ? "bg-[#ef4444]" : isLoading ? "bg-[#f59e0b]" : "bg-[#10b981]"}`}
              />
              FinHeal AI · {statusLabel} · {latestConversation} · {conversationCount} chats
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-[6px] sm:justify-end">
          <button onClick={onClearChat} className="h-[30px] px-[12px] rounded-[6px] border-[1.5px] border-gray-200 bg-white text-gray-600 font-sans text-[11px] font-semibold flex items-center gap-[5px] transition-all hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:text-primary sm:text-[11.5px]">
            🗑 Clear
          </button>
          <button className="h-[30px] px-[12px] rounded-[6px] border-[1.5px] border-gray-200 bg-white text-gray-600 font-sans text-[11px] font-semibold flex items-center gap-[5px] transition-all hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:text-primary sm:text-[11.5px] sm:hidden">
            📋 Notes
          </button>
          <button className="h-[30px] px-[12px] rounded-[6px] border-[1.5px] border-primary bg-primary text-white shadow-[0_4px_16px_rgba(50,68,230,0.1)] font-sans text-[11px] font-semibold flex items-center gap-[5px] transition-all hover:bg-[#1e2db8] hover:shadow-[0_8px_24px_rgba(50,68,230,0.22)] sm:text-[11.5px]">
            💳 View Loan Options
          </button>
        </div>
      </div>

      <button
        onClick={onToggleInsights}
        className="fixed right-[12px] top-[12px] h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 lg:hidden shrink-0 z-50 shadow-sm"
        aria-label="Toggle insights panel"
      >
        ☰
      </button>

      {error && (
        <div className="mx-[16px] mt-[14px] rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-[14px] py-[10px] text-[12px] text-[#b91c1c] sm:mx-[20px]">
          {error.message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-[16px] py-[20px] scroll-smooth sm:px-[20px] sm:py-[24px]" ref={scrollRef}>
        {messages.length === 0 ? (
          <>
            <div className="text-center px-[10px] py-[16px] pb-[24px] animate-fade-up sm:px-[32px] sm:pb-[28px]">
              <div className="w-[56px] h-[56px] rounded-full bg-[#eef0fd] border-[2px] border-[#d4d8fa] flex items-center justify-center text-[24px] mx-auto mb-[14px] animate-pulse-ring sm:w-[64px] sm:h-[64px] sm:text-[28px]">🌟</div>
              <div className="font-serif text-[22px] text-gray-900 mb-[8px] sm:text-[26px]">Good morning, <span className="text-primary italic">{userProfile.firstName || userProfile.displayName}</span></div>
              <div className="text-[13px] text-gray-500 leading-relaxed max-w-[420px] mx-auto sm:text-[13.5px]">I'm here to help you navigate your financial journey — without judgment, with full support.</div>
            </div>
            
            <div className="flex flex-wrap gap-[8px] justify-center px-[4px] pb-[24px] animate-fade-up delay-100 sm:px-[16px]">
              {["😰 Stressed about my EMI", "📉 My credit score dropped", "💸 Help me budget better", "🤔 Am I eligible for a loan?", "📅 Plan my debt repayment", "🧠 Financial health test"].map(text => (
                <button
                  key={text}
                  onClick={() => setInputValue(text)}
                  className="px-[12px] py-[8px] rounded-[20px] border-[1.5px] border-gray-200 bg-white text-gray-600 text-[11.5px] font-medium transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-primary hover:text-primary hover:bg-[#f6f7fe] hover:-translate-y-[2px] hover:shadow-[0_4px_16px_rgba(50,68,230,0.1)] whitespace-nowrap sm:px-[14px] sm:text-[12px]"
                >
                  {text}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center my-[8px] mb-[16px] relative before:content-[''] before:absolute before:top-1/2 before:left-0 before:right-0 before:h-[1px] before:bg-gray-100">
            <span className="bg-white relative z-10 text-[11px] text-gray-400 px-[12px] font-medium">Today · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-[10px] mb-[14px] max-w-[800px] w-full mx-auto animate-fade-up-fast ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'bot' ? (
              <div className="w-[30px] h-[30px] rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-[18px] shadow-[0_2px_8px_rgba(50,68,230,0.3)]">F2</div>
            ) : (
              <div className="w-[30px] h-[30px] rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[11px] font-bold shrink-0 mt-[18px]">{userProfile.initials}</div>
            )}
            <div className="max-w-[82%] flex flex-col sm:max-w-[68%]">
              {m.role === 'bot' && m.mood && m.mood.primary_emotion && (
                <div className={`inline-flex items-center gap-[4px] text-[10px] font-semibold px-[9px] py-[3px] rounded-[20px] mb-[5px] tracking-[0.3px] self-start ${
                  m.mood.primary_emotion === 'calm' ? 'bg-[#ecfdf5] text-[#10b981]' : 
                  m.mood.primary_emotion === 'anxious' ? 'bg-[#fffbeb] text-[#f59e0b]' : 
                  'bg-[#fef2f2] text-[#ef4444]'
                }`}>
                  {m.mood.label || m.mood.primary_emotion}
                </div>
              )}
              <div className={`px-[14px] py-[12px] text-[13px] leading-relaxed sm:px-[16px] sm:py-[13px] sm:text-[13.5px] ${
                m.role === 'bot' 
                  ? 'bg-white border-[1.5px] border-gray-100 text-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] rounded-[4px_14px_14px_14px]'
                  : 'bg-primary text-white shadow-[0_4px_16px_rgba(50,68,230,0.1)] rounded-[14px_4px_14px_14px]'
              }`}>
                {m.content}
              </div>
              <div className={`text-[10px] text-gray-400 mt-[4px] px-[4px] ${m.role === 'user' ? 'text-right' : ''}`}>{m.time}</div>
            </div>
          </div>
        ))}
        
        {messages.length > 0 && messages[messages.length-1].role === 'bot' && messages[messages.length-1].suggestions && (
          <div className="flex flex-wrap gap-[6px] px-[40px] py-[4px] max-w-[800px] mx-auto animate-fade-up delay-100">
            {messages[messages.length-1].suggestions?.map(s => (
              <button 
                key={s} 
                onClick={() => setInputValue(s)}
                className="px-[12px] py-[6px] rounded-[20px] border-[1.5px] border-[#d4d8fa] bg-[#f6f7fe] text-primary text-[11.5px] font-medium cursor-pointer transition-all hover:bg-primary hover:text-white hover:border-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex gap-[10px] mb-[14px] max-w-[800px] w-full mx-auto pb-[14px]">
            <div className="w-[30px] h-[30px] rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-[0_2px_8px_rgba(50,68,230,0.3)]">F2</div>
            <div className="bg-white border-[1.5px] border-gray-100 rounded-[4px_14px_14px_14px] p-[14px_18px] flex gap-[5px] items-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="w-[6px] h-[6px] rounded-full bg-primary opacity-40 animate-bounce-dot" />
              <div className="w-[6px] h-[6px] rounded-full bg-primary opacity-40 animate-bounce-dot delay-150" />
              <div className="w-[6px] h-[6px] rounded-full bg-primary opacity-40 animate-bounce-dot delay-300" />
            </div>
          </div>
        )}
      </div>

      <div className="p-[12px_16px_14px] bg-white border-t border-gray-100 rounded-b-[20px] shrink-0 sm:px-[20px]">
        <div className="max-w-[800px] mx-auto bg-gray-50 border-[1.5px] border-gray-200 rounded-[28px] flex flex-col items-stretch p-[10px] gap-[8px] transition-all focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(50,68,230,0.08)] sm:flex-row sm:items-end sm:p-[10px_10px_10px_18px]">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 text-[13.5px] resize-none min-h-[22px] max-h-[100px] leading-[1.55] py-[3px] placeholder:text-gray-400"
            rows={1}
            style={{ height: "auto" }}
          />
          <div className="flex flex-wrap gap-[5px] items-center justify-end pb-[1px] sm:flex-nowrap">
            <button className="w-[32px] h-[32px] rounded-full text-gray-400 text-[15px] flex items-center justify-center transition-all hover:bg-gray-100 hover:text-gray-600">📎</button>
            <button className="w-[32px] h-[32px] rounded-full text-gray-400 text-[15px] flex items-center justify-center transition-all hover:bg-gray-100 hover:text-gray-600">🎙</button>
            <button 
              onClick={() => void handleSend(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="w-[36px] h-[36px] rounded-full bg-primary text-white text-[15px] flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(50,68,230,0.35)] shrink-0 hover:bg-[#1e2db8] hover:scale-105 hover:shadow-[0_8px_24px_rgba(50,68,230,0.22)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="max-w-[800px] mx-auto mt-[7px] text-[10.5px] text-gray-400 text-center">
          FinHeal AI is an empathetic companion but does not provide certified legal or tax advice.
        </div>
      </div>
    </main>
  );
}
