import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import FinancialHealthTestCatalog from "@/components/FinancialHealthTestCatalog";
import FinancialLiteracyTestView from "@/components/FinancialLiteracyTestView";
import EmergencyFundCheckView from "@/components/EmergencyFundCheckView";
import LoanFitTestView from "@/components/LoanFitTestView";
import DebtBalanceReviewView from "@/components/DebtBalanceReviewView";
import CreditReadinessReviewView from "@/components/CreditReadinessReviewView";
import InsightsPanel from "@/components/InsightsPanel";
import { useBackendChat } from "@/hooks/useBackendChat";
import type { MoodDimensions } from "@/lib/backendChat";
import { deleteLocalConversation, migrateConversationsFromUserId } from "@/utils/localConversations";
import { deleteConversation as apiDeleteConversation } from "@/lib/backendChat";
import { createUserProfile } from "@/utils/user";
import { getStoredAuthSession, setStoredAuthSession, clearStoredAuthSession } from "@/utils/authSession";
import { signInUser, signUpUser, signInGuest, fetchHearts } from "@/lib/backendAuth";
import QuizPopup from "@/components/QuizPopup/QuizPopup";

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

    if (view === "emergency-fund") {
      return "emergency-fund" as const;
    }

    if (view === "tests") {
      return "tests" as const;
    }

    if (view === "loan-fit") {
      return "loan-fit" as const;
    }

    if (view === "credit-readiness") {
      return "credit-readiness" as const;
    }

    if (view === "debt-balance") {
      return "debt-balance" as const;
    }

    

    return "chat" as const;
  };

  const [authSession, setAuthSession] = useState(() => getStoredAuthSession());
  const [loginUsername, setLoginUsername] = useState(loginDefaults.username);
  const [loginDisplayName, setLoginDisplayName] = useState("");
  const [loginLastName, setLoginLastName] = useState("");
  const [loginPassword, setLoginPassword] = useState(loginDefaults.password);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMoodDims, setCurrentMoodDims] = useState<MoodDimensions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [mainView, setMainView] = useState<"chat" | "tests" | "financial-literacy" | "emergency-fund" | "loan-fit" | "debt-balance" | "credit-readiness">(getInitialMainView);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const mainViewRef = useRef(mainView);
  const userId = authSession?.userId || "";
  const userProfile = authSession ? createUserProfile(userId, authSession.displayName) : null;
  const chat = useBackendChat(userId);

  // Show signup modal automatically when hearts run out
  useEffect(() => {
    if (chat.heartsExhausted && authSession?.isGuest) {
      setAuthMode("signup");
      clearStoredAuthSession();
      setAuthSession(null);
    }
  }, [chat.heartsExhausted, authSession]);

  const [showQuizPopup, setShowQuizPopup] = useState(false);

  useEffect(() => {
    mainViewRef.current = mainView;
  }, [mainView]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (mainViewRef.current === "chat" && !window.localStorage.getItem("finheal_quiz_completed")) {
        setShowQuizPopup(true);
      }
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (mainView !== "chat") {
      setShowQuizPopup(false);
    }
  }, [mainView]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const desktopBreakpoint = window.matchMedia("(min-width: 1024px)");

    const handleViewportChange = () => {
      if (!desktopBreakpoint.matches) {
        setSidebarOpen(false);
        setInsightsOpen(false);
      }
    };

    handleViewportChange();
    desktopBreakpoint.addEventListener("change", handleViewportChange);

    return () => desktopBreakpoint.removeEventListener("change", handleViewportChange);
  }, []);

  const handleQuizComplete = (tierName: string, score: number) => {
    window.localStorage.setItem("finheal_quiz_completed", "true");
    window.localStorage.setItem("finheal_user_tier", tierName);
    window.localStorage.setItem("finheal_quiz_score", String(score));
    setShowQuizPopup(false);
  };

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
      const guestUserId = authSession?.isGuest ? authSession.userId : null;
      const payload = authMode === "signup"
        ? await signUpUser(loginUsername.trim(), loginPassword, guestUserId ?? undefined, [loginDisplayName.trim(), loginLastName.trim()].filter(Boolean).join(' ') || loginUsername.trim())
        : await signInUser(loginUsername.trim(), loginPassword);

      // Migrate any local guest conversations to the real user ID
      if (guestUserId && payload.userId && guestUserId !== payload.userId) {
        migrateConversationsFromUserId(guestUserId, payload.userId);
        // Also migrate test results in backend
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api/v1"}/test-results/migrate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from_user_id: guestUserId, to_user_id: payload.userId }),
          });
        } catch {}
      }

      persistSession(payload);
      setCurrentMoodDims(null);
      setMainView("chat");
    } catch (error) {
      let message = error instanceof Error ? error.message : "Unable to authenticate. Please try again.";
      
      // Check for our specific error or try to parse the JSON
      if (message.includes("Invalid email or password")) {
        message = "Incorrect password or email. Please check and try again.";
      } else if (message.includes("{")) {
        try {
          const parsed = JSON.parse(message);
          message = parsed.detail || parsed.error || message;
        } catch (e) {
          // If it fails to parse, just keep the original message
        }
      }
      
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
    const wasGuest = authSession?.isGuest ?? false;
    clearStoredAuthSession();
    setAuthSession(null);
    if (wasGuest) {
      window.localStorage.removeItem("finheal_quiz_completed");
      window.localStorage.removeItem("finheal_user_tier");
      window.localStorage.removeItem("finheal_quiz_score");
    }
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
    setMainView("chat");
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
  const openTestInNewTab = (view: string) => {
    if (typeof window === "undefined") return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("view", view);
    window.open(nextUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const openEmergencyFundCheck = () => openTestInNewTab("emergency-fund");
  const openLoanFitTest = () => openTestInNewTab("loan-fit");
  const openDebtBalanceReview = () => openTestInNewTab("debt-balance");
  const openCreditReadiness = () => openTestInNewTab("credit-readiness");
  
  const openFreshChat = () => {
    setMainView("chat");
    chat.clearConversation();
  };
  const activeSidebarNav = mainView === "chat"
    ? "Talk to FinHeal"
    : "Financial Health Test";
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
      <div style={{minHeight:"100dvh",width:"100%",position:"relative",display:"grid",gridTemplateColumns:"1fr 1fr",background:"#f0f2ff"}}>

        {/* Full page grid background */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.08) 1px,transparent 1px)",backgroundSize:"32px 32px",zIndex:0}} />

        {/* Left content */}
        <div style={{position:"relative",zIndex:1,padding:"60px 64px",display:"flex",flexDirection:"column",justifyContent:"center",gap:"48px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"42px",height:"42px",background:"#3344e6",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>💙</div>
            <span style={{fontSize:"17px",fontWeight:700,color:"#1e1b4b"}}>F2 FinHeal</span>
          </div>
          <div>
            <div style={{fontSize:"52px",fontWeight:800,lineHeight:1.1,color:"#1e1b4b",letterSpacing:"-1px"}}>Your financial<br/>wellness <span style={{color:"#3344e6"}}>companion</span></div>
            <p style={{marginTop:"18px",fontSize:"17px",lineHeight:1.7,color:"#6b7280",maxWidth:"440px"}}>Navigate money stress with empathy-first guidance — no judgment, just real support and practical steps.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
            {[
              {icon:"🧠",title:"AI-powered financial therapy",desc:"Understands your stress and adapts to your situation"},
              {icon:"🎯",title:"Goal tracking that works",desc:"Set goals, track progress, and get nudges that keep you on track"},
              {icon:"🔒",title:"Safe and private",desc:"Your conversations are encrypted and never shared"},
            ].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"14px"}}>
                <div style={{width:"40px",height:"40px",background:"rgba(51,68,230,0.08)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"18px"}}>{f.icon}</div>
                <div>
                  <div style={{fontSize:"15px",fontWeight:600,color:"#1e1b4b",marginBottom:"3px"}}>{f.title}</div>
                  <div style={{fontSize:"13px",color:"#9ca3af"}}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{fontSize:"12px",color:"#9ca3af"}}>F2 Fintech · f2fintech.com · Instant loans with fast approval</div>
        </div>

        {/* Right form card */}
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 48px"}}>
          <div style={{background:"#fff",borderRadius:"24px",padding:"44px 48px",width:"100%",maxWidth:"480px",boxShadow:"0 24px 80px rgba(15,23,42,0.10)",border:"1px solid rgba(99,102,241,0.1)",display:"flex",flexDirection:"column",gap:"24px"}}>

            <div style={{display:"flex",overflow:"hidden",borderRadius:"10px",border:"1px solid #e5e7eb",width:"fit-content"}}>
              <button type="button" onClick={()=>setAuthMode("login")} style={{padding:"9px 22px",fontSize:"14px",fontWeight:600,cursor:"pointer",border:"none",background:authMode==="login"?"#3344e6":"#fff",color:authMode==="login"?"#fff":"#6b7280",transition:"all 0.15s"}}>Sign in</button>
              <button type="button" onClick={()=>setAuthMode("signup")} style={{padding:"9px 22px",fontSize:"14px",fontWeight:600,cursor:"pointer",border:"none",background:authMode==="signup"?"#3344e6":"#fff",color:authMode==="signup"?"#fff":"#6b7280",transition:"all 0.15s"}}>Create account</button>
            </div>

            <div>
              <div style={{fontSize:"26px",fontWeight:700,color:"#111827"}}>{authMode==="signup"?"Create your account":"Welcome back"}</div>
              <div style={{marginTop:"5px",fontSize:"14px",color:"#6b7280"}}>{authMode==="signup"?"Join FinHeal and start your financial wellness journey":"Sign in to continue your financial wellness journey"}</div>
            </div>

            <form onSubmit={handleAuthSubmit} style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {authMode==="signup" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <label style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                    <span style={{fontSize:"13px",fontWeight:500,color:"#374151"}}>First name <span style={{color:"#ef4444"}}>*</span></span>
                    <input value={loginDisplayName} onChange={(e)=>setLoginDisplayName(e.target.value)} placeholder="Priya" autoComplete="given-name" required style={{height:"46px",padding:"0 14px",border:"1px solid #e5e7eb",borderRadius:"10px",fontSize:"14px",outline:"none",fontFamily:"inherit",background:"#f9fafb"}} />
                  </label>
                  <label style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                    <span style={{fontSize:"13px",fontWeight:500,color:"#374151"}}>Last name</span>
                    <input value={loginLastName} onChange={(e)=>setLoginLastName(e.target.value)} placeholder="Sharma" autoComplete="family-name" style={{height:"46px",padding:"0 14px",border:"1px solid #e5e7eb",borderRadius:"10px",fontSize:"14px",outline:"none",fontFamily:"inherit",background:"#f9fafb"}} />
                  </label>
                </div>
              )}
              <label style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <span style={{fontSize:"13px",fontWeight:500,color:"#374151"}}>Email</span>
                <input value={loginUsername} onChange={(e)=>setLoginUsername(e.target.value)} placeholder="you@example.com" autoComplete="username" style={{height:"46px",padding:"0 14px",border:"1px solid #e5e7eb",borderRadius:"10px",fontSize:"14px",outline:"none",fontFamily:"inherit",background:"#f9fafb"}} />
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <span style={{fontSize:"13px",fontWeight:500,color:"#374151"}}>Password</span>
                <div style={{position:"relative"}}>
                  <input type={showPassword?"text":"password"} value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} placeholder="Enter your password" autoComplete={authMode==="signup"?"new-password":"current-password"} style={{height:"46px",padding:"0 44px 0 14px",border:"1px solid #e5e7eb",borderRadius:"10px",fontSize:"14px",outline:"none",fontFamily:"inherit",width:"100%",background:"#f9fafb"}} />
                  <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:0}}>
                    {showPassword?(
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:"18px",height:"18px"}}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    ):(
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:"18px",height:"18px"}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    )}
                  </button>
                </div>
              </label>
              {loginError && (
                <div style={{padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"10px",fontSize:"13px",color:"#b91c1c"}}>{loginError}</div>
              )}
              <button type="submit" disabled={isSubmitting} style={{height:"50px",background:"#3344e6",border:"none",borderRadius:"12px",color:"#fff",fontSize:"15px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:isSubmitting?0.7:1,marginTop:"4px"}}>
                {isSubmitting?"Processing...":(authMode==="signup"?"Create account":"Sign in")}
              </button>
            </form>

            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{flex:1,height:"1px",background:"#f3f4f6"}} />
                <span style={{fontSize:"12px",color:"#d1d5db"}}>or</span>
                <div style={{flex:1,height:"1px",background:"#f3f4f6"}} />
              </div>
              <button type="button" onClick={handleGuestLogin} disabled={isSubmitting} style={{height:"50px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"12px",fontSize:"14px",fontWeight:600,color:"#374151",cursor:"pointer",fontFamily:"inherit"}}>
                Continue as guest
              </button>
              <div style={{textAlign:"center",fontSize:"13px",color:"#9ca3af"}}>
                {authMode==="signup"?"Already have an account? ":"No account yet? "}
                <button type="button" onClick={()=>setAuthMode(authMode==="signup"?"login":"signup")} style={{background:"none",border:"none",color:"#3344e6",fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:"13px"}}>
                  {authMode==="signup"?"Sign in":"Create account"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <QuizPopup
        visible={showQuizPopup && mainView === "chat"}
        onDismiss={() => setShowQuizPopup(false)}
        onComplete={handleQuizComplete}
      />
    <div className="grid h-[100dvh] w-full min-w-0 grid-cols-1 gap-[6px] overflow-hidden bg-[#f3f4f6] p-[6px] lg:grid-cols-[clamp(240px,18vw,280px)_minmax(0,1fr)] 2xl:grid-cols-[clamp(240px,18vw,280px)_minmax(0,1fr)_clamp(250px,18vw,300px)]">
      <Sidebar 
        userId={userId} 
        userProfile={userProfile}
        sessionId={chat.conversationId ?? "new-conversation"}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onOpenChat={openChatView}
        onStartNewChat={openFreshChat}
        onOpenFinancialHealthTests={openTestCatalog}
        initialActiveNav={activeSidebarNav}
      />
      {mainView === "chat" ? (
        <ChatArea
          conversationId={chat.conversationId}
          conversationCount={chat.conversationCount}
          error={chat.error}
          isHealthy={chat.isHealthy}
          isLoading={chat.isLoading}
          isSendingMessage={chat.isSendingMessage}
          messages={chat.messages}
          userProfile={userProfile}
          remainingHearts={authSession?.hearts ?? null}
          onClearChat={chat.clearMessages}
          onMoodUpdate={handleMoodUpdate}
          onSendMessage={handleSendMessage}
          onStopSendingMessage={chat.stopSendingMessage}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onLogout={handleLogout}
          onSignupPrompt={() => {
            setAuthMode("signup");
            clearStoredAuthSession();
            setAuthSession(null);
          }}
        />
      ) : mainView === "tests" ? (
        <FinancialHealthTestCatalog
          userId={userId}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onOpenFinancialLiteracyTest={openFinancialLiteracyInNewTab}
          onOpenEmergencyFundCheck={openEmergencyFundCheck}
          onOpenLoanFitTest={openLoanFitTest}
          onOpenDebtBalanceReview={openDebtBalanceReview}
          onOpenCreditReadiness={openCreditReadiness}
          
        />
      ) : mainView === "emergency-fund" ? (
        <EmergencyFundCheckView
          userId={userId}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onBackToCatalog={openTestCatalog}
          onOpenFinancialWellnessAssistant={openChatView}
        />
      ) : mainView === "financial-literacy" ? (
        <FinancialLiteracyTestView
          userId={userId}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onBackToCatalog={openTestCatalog}
        />
      ) : mainView === "loan-fit" ? (
        <LoanFitTestView
          userId={userId}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onBackToCatalog={openTestCatalog}
          onOpenFinancialWellnessAssistant={openChatView}
        />
      ) : mainView === "credit-readiness" ? (
        <CreditReadinessReviewView
          userId={userId}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onBackToCatalog={openTestCatalog}
          onOpenFinancialWellnessAssistant={openChatView}
        />
      ) : (
        <DebtBalanceReviewView
          userId={userId}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInsights={() => setInsightsOpen((open) => !open)}
          onBackToCatalog={openTestCatalog}
          onOpenFinancialWellnessAssistant={openChatView}
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
    </>
  );
}
