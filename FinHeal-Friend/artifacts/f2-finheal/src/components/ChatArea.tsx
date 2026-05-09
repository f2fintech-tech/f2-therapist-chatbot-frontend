import { useState, useRef, useEffect } from "react";
import { useSendMessage, useGetChatSessions } from "@workspace/api-client-react";
import type { MoodDimensions } from "@workspace/api-client-react/src/generated/api.schemas";

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  mood?: { primary_emotion?: string; label?: string };
  time: string;
  suggestions?: string[];
}

export default function ChatArea({ userId, sessionId, onMoodUpdate }: { userId: string; sessionId: string; onMoodUpdate: (dims: MoodDimensions) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessageMut = useSendMessage();
  const { data: sessions } = useGetChatSessions(userId);

  const sessionCount = sessions?.length || 14;

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessageMut.isPending]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    sendMessageMut.mutate({
      data: { message: text.trim(), session_id: sessionId, user_id: userId }
    }, {
      onSuccess: (data) => {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content: data.message,
          mood: data.mood,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: data.suggestions
        };
        setMessages(prev => [...prev, botMsg]);
        if (data.mood?.dimensions) {
          onMoodUpdate(data.mood.dimensions);
        }
      }
    });
  };

  const clearChat = () => setMessages([]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      <div className="h-[60px] border-b border-gray-100 flex items-center px-[20px] gap-[12px] shrink-0 bg-white rounded-t-[20px]">
        <div className="flex-1">
          <div className="text-[14px] font-bold text-gray-900">Financial Wellness Chat</div>
          <div className="text-[11px] text-gray-400 flex items-center gap-[5px] mt-[1px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#10b981] shadow-[0_0_0_2px_#ecfdf5]" />
            FinHeal AI · Always available · Session #{sessionCount}
          </div>
        </div>
        <div className="flex gap-[6px]">
          <button onClick={clearChat} className="h-[30px] px-[12px] rounded-[6px] border-[1.5px] border-gray-200 bg-white text-gray-600 font-sans text-[11.5px] font-semibold flex items-center gap-[5px] transition-all hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:text-primary">
            🗑 Clear
          </button>
          <button className="h-[30px] px-[12px] rounded-[6px] border-[1.5px] border-gray-200 bg-white text-gray-600 font-sans text-[11.5px] font-semibold flex items-center gap-[5px] transition-all hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:text-primary">
            📋 Notes
          </button>
          <button className="h-[30px] px-[12px] rounded-[6px] border-[1.5px] border-primary bg-primary text-white shadow-[0_4px_16px_rgba(50,68,230,0.1)] font-sans text-[11.5px] font-semibold flex items-center gap-[5px] transition-all hover:bg-[#1e2db8] hover:shadow-[0_8px_24px_rgba(50,68,230,0.22)]">
            💳 View Loan Options
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[20px] py-[24px] scroll-smooth" ref={scrollRef}>
        {messages.length === 0 ? (
          <>
            <div className="text-center px-[32px] py-[16px] pb-[28px] animate-fade-up">
              <div className="w-[64px] h-[64px] rounded-full bg-[#eef0fd] border-[2px] border-[#d4d8fa] flex items-center justify-center text-[28px] mx-auto mb-[14px] animate-pulse-ring">🌟</div>
              <div className="font-serif text-[26px] text-gray-900 mb-[8px]">Good morning, <span className="text-primary italic">Aditya</span></div>
              <div className="text-[13.5px] text-gray-500 leading-relaxed max-w-[420px] mx-auto">I'm here to help you navigate your financial journey — without judgment, with full support.</div>
            </div>
            
            <div className="flex flex-wrap gap-[8px] justify-center px-[16px] pb-[24px] animate-fade-up delay-100">
              {["😰 Stressed about my EMI", "📉 My credit score dropped", "💸 Help me budget better", "🤔 Am I eligible for a loan?", "📅 Plan my debt repayment", "🧠 Financial health test"].map(text => (
                <button
                  key={text}
                  onClick={() => setInputValue(text)}
                  className="px-[14px] py-[8px] rounded-[20px] border-[1.5px] border-gray-200 bg-white text-gray-600 text-[12px] font-medium transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-primary hover:text-primary hover:bg-[#f6f7fe] hover:-translate-y-[2px] hover:shadow-[0_4px_16px_rgba(50,68,230,0.1)] whitespace-nowrap"
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
              <div className="w-[30px] h-[30px] rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[11px] font-bold shrink-0 mt-[18px]">AR</div>
            )}
            <div className="max-w-[68%] flex flex-col">
              {m.role === 'bot' && m.mood && m.mood.primary_emotion && (
                <div className={`inline-flex items-center gap-[4px] text-[10px] font-semibold px-[9px] py-[3px] rounded-[20px] mb-[5px] tracking-[0.3px] self-start ${
                  m.mood.primary_emotion === 'calm' ? 'bg-[#ecfdf5] text-[#10b981]' : 
                  m.mood.primary_emotion === 'anxious' ? 'bg-[#fffbeb] text-[#f59e0b]' : 
                  'bg-[#fef2f2] text-[#ef4444]'
                }`}>
                  {m.mood.label || m.mood.primary_emotion}
                </div>
              )}
              <div className={`px-[16px] py-[13px] text-[13.5px] leading-relaxed ${
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

        {sendMessageMut.isPending && (
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

      <div className="p-[12px_20px_14px] bg-white border-t border-gray-100 rounded-b-[20px] shrink-0">
        <div className="max-w-[800px] mx-auto bg-gray-50 border-[1.5px] border-gray-200 rounded-[28px] flex items-end p-[10px_10px_10px_18px] gap-[8px] transition-all focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(50,68,230,0.08)]">
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
          <div className="flex gap-[5px] items-center pb-[1px]">
            <button className="w-[32px] h-[32px] rounded-full text-gray-400 text-[15px] flex items-center justify-center transition-all hover:bg-gray-100 hover:text-gray-600">📎</button>
            <button className="w-[32px] h-[32px] rounded-full text-gray-400 text-[15px] flex items-center justify-center transition-all hover:bg-gray-100 hover:text-gray-600">🎙</button>
            <button 
              onClick={() => handleSend(inputValue)}
              disabled={sendMessageMut.isPending || !inputValue.trim()}
              className="w-[36px] h-[36px] rounded-full bg-primary text-white text-[15px] flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(50,68,230,0.35)] shrink-0 hover:bg-[#1e2db8] hover:scale-105 hover:shadow-[0_8px_24px_rgba(50,68,230,0.22)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
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
