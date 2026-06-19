﻿﻿﻿﻿import { useEffect, useMemo, useRef, useState } from "react";
import type { BackendRequestError, ChatMessage, MoodDimensions } from "@/lib/backendChat";
import { extractMoodDimensions, formatConversationDateLabel, formatMessageTimestamp } from "@/lib/backendChat";

import StreamingMessage from "./StreamingMessage";

interface ChatAreaProps {
  conversationId: string | null;
  conversationCount: number;
  error: BackendRequestError | null;
  isHealthy: boolean | null;
  isLoading: boolean;
  isSendingMessage: boolean;
  messages: ChatMessage[];
  userProfile: UserProfile;
  remainingHearts?: number | null;
  onClearChat: () => void;
  onMoodUpdate: (dims: MoodDimensions | null) => void;
  onSendMessage: (text: string) => Promise<void>;
  onStopSendingMessage: () => void;
  onLogout?: () => void;
  onSignupPrompt?: () => void;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  isSidebarOpen?: boolean;
  isInsightsOpen?: boolean;
  prefillMessage?: { text: string; card: string };
  onClearPrefill?: () => void;
  onOpenEligibilityCibil?: () => void;
  streamingMessageId?: string | null;
}


export default function ChatArea({
  conversationId,
  conversationCount,
  error,
  isHealthy,
  isLoading,
  isSendingMessage,
  messages,
  userProfile,
  remainingHearts,
  onClearChat,
  onMoodUpdate,
  onSendMessage,
  onStopSendingMessage,
  onLogout,
  onSignupPrompt,
  onToggleSidebar,
  onToggleInsights,
  isSidebarOpen = false,
  isInsightsOpen = false,
  prefillMessage,
  onClearPrefill,
  onOpenEligibilityCibil,
  streamingMessageId,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showAd, setShowAd] = useState(true);
  useEffect(() => {
    if (prefillMessage?.text) {
      setInputValue(prefillMessage.text);
      onClearPrefill?.();
    }
  }, [prefillMessage, onClearPrefill]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      // Use setTimeout to ensure DOM has updated before scrolling
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSendingMessage]);

  // Alternative: scroll last message into view as fallback
  useEffect(() => {
    const lastMessage = document.querySelector('[data-message-id]:last-of-type');
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  // Memoize aggregated mood to prevent recreating it on every render.
  // This memo only recomputes when messages actually change.
  const aggregatedMood = useMemo(() => {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const msg of messages) {
      if (msg.role !== "bot" || !msg.mood) continue;
      const dimsRaw = extractMoodDimensions(msg.mood as any);
      if (!dimsRaw) continue;
      const dims = dimsRaw as Record<string, number>;
      for (const [k, v] of Object.entries(dims)) {
        if (typeof v !== "number") continue;
        sums[k] = (sums[k] || 0) + v;
        counts[k] = (counts[k] || 0) + 1;
      }
    }

    const aggregated: Record<string, number> = {};
    for (const k of Object.keys(sums)) {
      const avg = sums[k] / (counts[k] || 1);
      aggregated[k] = Math.round(avg);
    }

    return Object.keys(aggregated).length > 0 ? (aggregated as MoodDimensions) : null;
  }, [messages]);

  // Track previous mood to only notify on actual changes (prevents cascading re-renders).
  // Use ref to avoid creating effect dependencies on the callback.
  const prevMoodRef = useRef<MoodDimensions | null>(null);

  // Only notify parent if mood actually changed, not on every render or callback change.
  useEffect(() => {
    const hasMoodChanged =
      prevMoodRef.current !== aggregatedMood &&
      JSON.stringify(prevMoodRef.current) !== JSON.stringify(aggregatedMood);

    if (hasMoodChanged) {
      prevMoodRef.current = aggregatedMood;
      onMoodUpdate(aggregatedMood);
    }
  }, [aggregatedMood, onMoodUpdate]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || isSendingMessage) return;

    setInputValue("");
    try {

      await onSendMessage(prefillMessage?.card ? prefillMessage.card + "\n\nUser question: " + text.trim() : text.trim());

    } catch {
      // The hook already normalizes and stores the error state.
    }
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file || isLoading || isSendingMessage) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string | ArrayBuffer | null;
      if (!result) return;
      try {
        await onSendMessage(JSON.stringify({ type: 'file', name: file.name, mime: file.type, data: result }));
      } catch {
        // ignore send errors
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearDraft = () => {
    if (isLoading || isSendingMessage) return;

    setInputValue("");
    inputRef.current?.focus();
  };

  const startRecording = async () => {
    if (isRecording || isLoading || isSendingMessage) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) recordedChunksRef.current.push(ev.data); };
      mr.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type });
        await handleFileSelected(file);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      // permission or media error
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const statusLabel = isHealthy === null ? "Checking backend..." : isHealthy ? "Backend connected" : "Backend unavailable";
  const latestConversation = conversationId ? `Conversation ${conversationId.slice(0, 8)}` : "New conversation";

  const conversationStartDate = messages.find((message) => message.timestamp)?.timestamp;
  const lastMessage = messages[messages.length - 1];
  const isStreamingStarted = lastMessage && lastMessage.role === 'bot' && lastMessage.content !== "";
  const isMessageStreaming = (msgId: string) =>
    isSendingMessage && msgId === lastMessage?.id && lastMessage?.role === 'bot';


  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading && !isSendingMessage) {
      e.preventDefault();
      void handleSend(inputValue);
    }
  };

  // Auto-resize textarea to fit content (up to max height)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    // Reset height to allow shrinking when text is removed
    el.style.height = "auto";

    const maxHeight = 100; // px (matches CSS max-h-[100px])
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [inputValue]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <main className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      <style>{`
        .auth-screen-nav-toggle {
          display: none;
        }

        @media (max-width: 1100px) {
          .auth-screen-nav-toggle {
            display: flex !important;
          }
        }
      `}</style>
      <div className="flex flex-col gap-[10px] border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px] pl-[72px] sm:pl-[84px] lg:pl-0 pt-[12px] lg:pt-0">
        <div className="flex items-start gap-[10px] sm:items-center">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="auth-screen-nav-toggle fixed left-[12px] top-[12px] hidden h-[32px] w-[32px] cursor-pointer rounded-[6px] bg-gray-100 text-gray-600 items-center justify-center text-[18px] transition-all hover:bg-gray-200 shrink-0 z-50 shadow-sm"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          )}
          <div className="flex-1 min-w-3 lg:pl-5">
            <div className="text-[18px] font-bold text-gray-900 pt-[8px] sm:text-[14px]">Financial Wellness Chat</div>
            <div className="text-[10px] text-gray-400 flex flex-wrap items-center gap-x-[5px] gap-y-[2px] mt-[1px] sm:text-[11px]">
              <span
                className={`w-[6px] h-[6px] rounded-full shadow-[0_0_0_2px_#ecfdf5] ${isHealthy === false ? "bg-[#ef4444]" : isLoading ? "bg-[#f59e0b]" : "bg-[#10b981]"}`}
              />
              FinHeal AI · {latestConversation} · {conversationCount} {conversationCount === 1 ? "chat" : "chats"}
            </div>

            {typeof remainingHearts === "number" && (
              <div className="mt-[10px] w-full rounded-[18px] border border-primary/10 bg-white/80 p-[14px] shadow-[0_20px_80px_rgba(71,85,105,0.06)] sm:px-[18px] lg:w-[calc(100%-32px)] lg:mx-auto">
                <div className="flex flex-col gap-[10px] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">Hearts remaining</div>
                    <div className="mt-[6px] text-[12px] text-slate-500">Each chat uses 10 hearts. Sign up for more access.</div>
                  </div>
                  <div className="inline-flex items-center gap-[10px] rounded-full bg-slate-100 px-[12px] py-[8px] text-[12px] font-semibold text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
                    <span className="heart-pump" aria-hidden="true">❤️</span>
                    <span>{remainingHearts} / 50</span>
                  </div>
                </div>

                <div className="mt-[12px] h-[14px] overflow-hidden rounded-full bg-slate-200 shadow-inner">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-primary via-cyan-500 to-emerald-500 transition-all duration-500 ease-out ${
                      remainingHearts <= 10 ? "shadow-[0_0_0_8px_rgba(254,226,226,0.16)]" : ""
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, Math.round((remainingHearts / 50) * 100)))}%` }}
                  />
                </div>

                <div className="mt-[10px] flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {remainingHearts <= 0 ? (
                      <button
                        onClick={onSignupPrompt}
                        className="font-semibold text-primary underline hover:text-[#1e2db8]"
                      >
                        Hearts exhausted — click here to sign up and continue chatting free
                      </button>
                    ) : "Progress toward sign up — every chat reduces your hearts."}
                  </span>
                  <span className="font-semibold text-slate-700">{Math.max(0, Math.min(100, Math.round((remainingHearts / 50) * 100)))}%</span>
                </div>
              </div>
            )}
          </div>
          {showAd && (
            <div 
              onClick={onOpenEligibilityCibil}
              className="hidden sm:flex items-center gap-[8px] h-[30px] px-[12px] rounded-full border border-cyan-500/20 bg-cyan-50/10 backdrop-blur-md text-[11px] font-semibold cursor-pointer transition-all duration-300 hover:border-cyan-500/40 hover:bg-cyan-50/20 ad-header-glow mr-[100px] sm:mr-[120px] lg:mr-[140px] shrink-0 text-left relative"
            >
              <style>{`
                @keyframes neonGlow {
                  0%, 100% { 
                    box-shadow: 0 0 4px rgba(6, 182, 212, 0.1), inset 0 0 2px rgba(6, 182, 212, 0.05);
                    border-color: rgba(6, 182, 212, 0.2);
                  }
                  50% { 
                    box-shadow: 0 0 8px rgba(99, 102, 241, 0.25), inset 0 0 3px rgba(99, 102, 241, 0.08);
                    border-color: rgba(99, 102, 241, 0.35);
                  }
                }
                .ad-header-glow {
                  animation: neonGlow 2.5s infinite ease-in-out;
                }
              `}</style>
              
              {/* Glowing Pulse Dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              
              <span className="text-slate-600 tracking-wide font-sans font-medium hover:text-slate-900 transition-colors">
                Check CIBIL & Loan Eligibility
              </span>
                          
              <button 
                onClick={(e) => { e.stopPropagation(); setShowAd(false); }} 
                className="text-slate-400 hover:text-slate-600 font-sans text-[11px] p-0.5 ml-1 transition cursor-pointer select-none leading-none focus:outline-none"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {onLogout && (
          <div className="flex w-full flex-wrap gap-[6px] justify-end">
            <button onClick={onLogout} className="h-[30px] px-[12px] rounded-[6px] border-[1.5px] border-gray-200 bg-white text-gray-600 font-sans text-[11px] font-semibold flex items-center gap-[5px] transition-all hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:text-primary sm:text-[11.5px] cursor-pointer">
              🚪 Sign out
            </button>
          </div>
        )}
      </div>

      {!isInsightsOpen && (
        <div className="fixed right-[12px] top-[12px] flex items-center gap-[6px] z-50">
          <button onClick={handleClearDraft} className="h-[32px] px-[10px] rounded-[6px] border-[1.5px] border-gray-200 bg-white text-gray-600 font-sans text-[11px] font-semibold flex items-center gap-[5px] transition-all hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:text-primary cursor-pointer shadow-sm" title="Clear draft text">
            🗑 Clear
          </button>
          <button
            onClick={onToggleInsights}
            className="h-[32px] w-[32px] cursor-pointer rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 shrink-0 shadow-sm 2xl:hidden"
            aria-label="Toggle insights panel"
          >
            ☰
          </button>
        </div>
      )}

      {error && (
        <div className="mx-[16px] mt-[14px] rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-[14px] py-[10px] text-[12px] text-[#b91c1c] sm:mx-[20px]">
          {error.message}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[20px] scroll-smooth sm:px-[20px] sm:py-[24px]" ref={scrollRef}>
        {messages.length === 0 ? (
          <>
            <div className="text-center px-[10px] py-[16px] pb-[24px] animate-fade-up sm:px-[32px] sm:pb-[28px]">
              <style>{`
                @keyframes finFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                @keyframes bubblePop{from{opacity:0;transform:translateY(6px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
                .fin-float{animation:finFloat 3.2s ease-in-out infinite}
              `}</style>
              <img src="/owl-avatar.gif" alt="FinHeal" className="fin-float mx-auto mb-[4px]" style={{width:"130px",height:"auto",objectFit:"contain",mixBlendMode:"multiply"}} />
              <div style={{background:"white",borderRadius:"16px",padding:"10px 18px",boxShadow:"0 4px 20px rgba(51,68,230,0.10)",border:"1.5px solid rgba(51,68,230,0.08)",display:"inline-block",marginBottom:"12px",animation:"bubblePop 0.5s ease-out forwards",position:"relative"}}>
                <div style={{fontSize:"13px",fontWeight:700,color:"#1e1b4b"}}>Hey! I'm FinHeal 👋</div>
                <div style={{fontSize:"11px",color:"#6b7280",marginTop:"3px",lineHeight:1.5}}>Share what's on your mind — I'll help you find a way forward.</div>
                <div style={{position:"absolute",bottom:"-8px",left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"8px solid white"}} />
              </div>
              <div className="font-serif text-[22px] text-gray-900 mb-[8px] sm:text-[26px]">{greeting}, <span className="text-primary italic">{userProfile.firstName || userProfile.displayName}</span></div>
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
            <span className="bg-white relative z-10 text-[11px] text-gray-400 px-[12px] font-medium">
              Conversation started · {formatConversationDateLabel(conversationStartDate)}
            </span>
          </div>
        )}

        {messages.map((m) => {
          if (m.role === 'bot' && !m.content && !isMessageStreaming(m.id)) return null;
          return (
            <div key={m.key || m.id} data-message-id={m.id} className={`flex gap-[10px] mb-[14px] max-w-[800px] w-full mx-auto animate-fade-up-fast ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'bot' ? (
                <div className="w-[36px] h-[36px] rounded-full shrink-0 mt-[18px] shadow-[0_2px_8px_rgba(50,68,230,0.3)] overflow-hidden border-2 border-primary/20 bg-white">
                  <img src="/owl-avatar.gif" alt="FinHeal" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",transform:"scale(1.4)",marginTop:"4px"}} />
                </div>
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
                }`}>{m.role === 'bot' ? (<StreamingMessage content={m.content} isStreaming={isMessageStreaming(m.id)} />) : (m.content)}
                </div>
                <div className={`text-[10px] text-gray-400 mt-[4px] px-[4px] ${m.role === 'user' ? 'text-right' : ''}`}>
                  {m.timestamp ? formatMessageTimestamp(m.timestamp) : m.time}
                </div>
              </div>
            </div>
          );
        })}
        
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
      </div>
        <div className="p-[12px_16px_14px] bg-white border-t border-gray-100 rounded-b-[20px] shrink-0 sm:px-[20px]">
        {prefillMessage?.card && (<div style={{ background: "#eef0fd", border: "1.5px solid #d4d8fa", borderRadius: "12px", padding: "10px 14px", marginBottom: "8px", maxWidth: "800px", margin: "0 auto 8px", display: "flex", alignItems: "flex-start", gap: "10px" }}><span style={{ fontSize: "18px" }}>📎</span><div style={{ flex: 1 }}><div style={{ fontSize: "11px", fontWeight: 700, color: "#3344e6", marginBottom: "2px" }}>ATTACHED CONTENT</div><div style={{ fontSize: "12px", color: "#374151", lineHeight: 1.4 }}>{prefillMessage.card}</div></div><button onClick={() => onClearPrefill?.()} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", lineHeight: 1, padding: "0 0 0 8px", flexShrink: 0 }}>✕</button></div>)}
        <div className="max-w-[800px] mx-auto bg-gray-50 border-[1.5px] border-gray-200 rounded-[28px] flex flex-col items-stretch p-[10px] gap-[8px] transition-all focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(50,68,230,0.08)] sm:flex-row sm:items-end sm:p-[10px_10px_10px_18px]">

          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 text-[16px] resize-none min-h-[22px] max-h-[100px] leading-[1.55] py-[6px] placeholder:text-gray-400"
            rows={1}
            style={{ height: "auto" }}
          />
          <div className="flex flex-wrap gap-[5px] items-center justify-center pb-[1px] sm:flex-nowrap">
              <div className="relative group">
                <label
                  className={`w-[32px] h-[32px] rounded-full text-gray-400 text-[15px] flex items-center justify-center transition-all hover:bg-gray-100 hover:text-gray-600 cursor-pointer ${isLoading || isSendingMessage ? "pointer-events-none opacity-40" : ""}`}
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-8.48 8.48a2 2 0 0 1-2.83-2.83l7.78-7.78" />
                  </svg>
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => void handleFileSelected(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                </label>

                <div className="pointer-events-none absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition duration-150">
                  <div className="bg-white text-[12px] text-gray-700 px-3 py-1 rounded-[8px] shadow-md">Attach file</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-2 h-2 bg-white rotate-45 shadow-md" />
                </div>
              </div>
            <div className="relative group">
              <button
                type="button"
                onClick={() => (isRecording ? stopRecording() : void startRecording())}
                disabled={isLoading || isSendingMessage}
                className={`w-[32px] h-[32px] cursor-pointer rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'} ${isLoading || isSendingMessage ? "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-400" : ""}`}
                aria-pressed={isRecording}
                aria-label={isRecording ? "Stop recording" : "Record audio"}
                title={isRecording ? "Stop recording" : "Record audio"}
              >
                {isRecording ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 1v11" />
                    <path d="M8 5a4 4 0 0 0 8 0" />
                    <path d="M19 11v1a7 7 0 0 1-14 0v-1" />
                  </svg>
                )}
              </button>

              <div className="cursor-pointer-events-none absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition duration-150">
                <div className="bg-white text-[12px] text-gray-700 px-3 py-1 rounded-[8px] shadow-md">{isRecording ? 'Stop recording' : 'Record audio'}</div>
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-2 h-2 bg-white rotate-45 shadow-md" />
              </div>
            </div>
            {isSendingMessage ? (
              <button
                type="button"
                onClick={onStopSendingMessage}
                className="w-[36px] h-[36px] rounded-full bg-red-500 text-white text-[15px] flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(239,68,68,0.28)] shrink-0 hover:bg-red-600 hover:scale-105 active:scale-95"
                aria-label="Stop generating response"
                title="Stop generating response"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => void handleSend(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="w-[36px] h-[36px] cursor-pointer rounded-full bg-primary text-white text-[15px] flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(50,68,230,0.35)] shrink-0 hover:bg-[#1e2db8] hover:scale-105 hover:shadow-[0_8px_24px_rgba(50,68,230,0.22)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="max-w-[800px] mx-auto mt-[7px] text-[10.5px] text-gray-400 text-center">
          FinHeal AI is an empathetic companion but does not provide certified legal or tax advice.
        </div>
      </div>
    </main>
  );
}

