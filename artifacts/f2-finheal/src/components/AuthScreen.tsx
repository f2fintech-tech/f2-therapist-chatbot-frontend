import { useState, type FormEvent } from "react";
import { signInUser, signUpUser, signInGuest } from "@/lib/backendAuth";
import { migrateConversationsFromUserId } from "@/utils/localConversations";

const loginDefaults = {
  username: "",
  password: "",
};

interface AuthScreenProps {
  currentSession: any;
  onAuthSuccess: (session: any) => void;
}

export default function AuthScreen({ currentSession, onAuthSuccess }: AuthScreenProps) {
  const [loginUsername, setLoginUsername] = useState(loginDefaults.username);
  const [loginDisplayName, setLoginDisplayName] = useState("");
  const [loginLastName, setLoginLastName] = useState("");
  const [loginPassword, setLoginPassword] = useState(loginDefaults.password);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const guestUserId = currentSession?.isGuest ? currentSession.userId : null;
      const payload = authMode === "signup"
        ? await signUpUser(loginUsername.trim(), loginPassword, guestUserId ?? undefined, [loginDisplayName.trim(), loginLastName.trim()].filter(Boolean).join(' ') || loginUsername.trim())
        : await signInUser(loginUsername.trim(), loginPassword);

      if (guestUserId && payload.userId && guestUserId !== payload.userId) {
        migrateConversationsFromUserId(guestUserId, payload.userId);
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api/v1"}/test-results/migrate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from_user_id: guestUserId, to_user_id: payload.userId }),
          });
        } catch {}
      }

      onAuthSuccess(payload);
    } catch (error) {
      let message = error instanceof Error ? error.message : "Unable to authenticate. Please try again.";
      if (message.includes("Invalid email or password")) {
        message = "Incorrect password or email. Please check and try again.";
      } else if (message.includes("{")) {
        try {
          const parsed = JSON.parse(message);
          message = parsed.detail || parsed.error || message;
        } catch (e) {}
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
      const session = await signInGuest(currentSession?.isGuest ? currentSession.userId : undefined);
      onAuthSuccess(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in as guest.";
      setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{minHeight:"100dvh",width:"100%",position:"relative",display:"grid",gridTemplateColumns:"1fr 1fr",background:"linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 40%, #FAF5FF 100%)"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.06) 1px,transparent 1px)",backgroundSize:"22px 22px",zIndex:0,WebkitMaskImage:"linear-gradient(to right, transparent 10%, black 45%)",maskImage:"linear-gradient(to right, transparent 10%, black 45%)"}} />
      
      <div style={{position:"relative",zIndex:1,padding:"60px 32px 60px 80px",display:"flex",flexDirection:"column",justifyContent:"center",gap:"40px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"42px",height:"42px",background:"#3344e6",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>💙</div>
          <span style={{fontSize:"19px",fontWeight:700,color:"#1e1b4b"}}>F2 FinHeal</span>
        </div>
        <div>
          <div style={{fontSize:"62px",fontWeight:800,lineHeight:1.05,color:"#1e1b4b",letterSpacing:"-2px"}}>Your financial<br/>wellness <span style={{color:"#3344e6"}}>companion</span></div>
          <p style={{marginTop:"18px",fontSize:"19px",lineHeight:1.7,color:"#6b7280",maxWidth:"480px"}}>Navigate money stress with empathy-first guidance — no judgment, just real support and practical steps.</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          {[
            {icon:"🧠",title:"AI-powered financial therapy",desc:"Understands your stress and adapts to your situation"},
            {icon:"🎯",title:"Goal tracking that works",desc:"Set goals, track progress, and get nudges that keep you on track"},
            {icon:"🔒",title:"Safe and private",desc:"Your conversations are encrypted and never shared"},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"14px",padding:"12px 16px",borderRadius:"16px",marginLeft:"-16px",width:"calc(100% + 32px)",transition:"transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",cursor:"pointer"}} onMouseOver={(e)=>{e.currentTarget.style.transform="scale(1.03)"}} onMouseOut={(e)=>{e.currentTarget.style.transform="scale(1)"}}>
              <div style={{width:"46px",height:"46px",background:"rgba(51,68,230,0.08)",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"22px"}}>{f.icon}</div>
              <div>
                <div style={{fontSize:"17px",fontWeight:700,color:"#1e1b4b",marginBottom:"4px"}}>{f.title}</div>
                <div style={{fontSize:"14px",color:"#626468ff"}}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <a href="https://f2fintech.com/" target="_blank" rel="noopener noreferrer" style={{fontSize:"14px",color:"#626468ff",textDecoration:"none",display:"inline-block",transition:"color 0.2s"}} onMouseOver={(e)=>e.currentTarget.style.color="#3344e6"} onMouseOut={(e)=>e.currentTarget.style.color="#626468ff"}>F2 Fintech · f2fintech.com · Instant loans with fast approval</a>
      </div>

      <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 48px"}}>
        <div style={{background:"linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",borderRadius:"24px",padding:"44px 48px",width:"100%",maxWidth:"480px",boxShadow:"0 24px 80px rgba(15,23,42,0.15)",border:"1px solid rgba(255,255,255,0.8)",display:"flex",flexDirection:"column",gap:"24px"}}>
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
            {loginError && <div style={{padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"10px",fontSize:"13px",color:"#b91c1c"}}>{loginError}</div>}
            <button type="submit" disabled={isSubmitting} style={{height:"50px",background:"linear-gradient(135deg, #3344e6 0%, #4f46e5 100%)",border:"none",borderRadius:"12px",color:"#fff",fontSize:"15px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:isSubmitting?0.7:1,marginTop:"4px",boxShadow:"0 4px 14px rgba(51,68,230,0.3)",transition:"all 0.2s"}} onMouseOver={(e)=>{if(!isSubmitting){e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(51,68,230,0.4)"}}} onMouseOut={(e)=>{if(!isSubmitting){e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 4px 14px rgba(51,68,230,0.3)"}}}>
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