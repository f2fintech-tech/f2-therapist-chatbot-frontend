import { useState, useEffect, useRef, type FormEvent } from "react";
import { signInUser, signUpUser, signInGuest } from "@/lib/backendAuth";
import { migrateConversationsFromUserId } from "@/utils/localConversations";

const loginDefaults = { username: "", password: "" };

interface AuthScreenProps {
  currentSession: any;
  onAuthSuccess: (session: any) => void;
}

const CARD_MESSAGES = [
  "Your smarter financial journey starts here.",
  "We're setting up your profile...",
  "You're making great progress!",
  "Your AI companion is getting ready.",
  "Almost there — one last step.",
  "Welcome to smarter financial wellness.",
];

const BAR_HEIGHTS = [
  [40, 65, 50, 80, 70, 90, 75],
  [55, 45, 70, 60, 85, 65, 80],
  [30, 75, 55, 90, 45, 70, 85],
  [60, 50, 80, 40, 75, 55, 90],
];

function getPasswordStrength(pw: string): { width: number; color: string; label: string } {
  if (!pw) return { width: 0, color: "#e5e7eb", label: "" };
  let str = 0;
  if (pw.length >= 6) str++;
  if (pw.length >= 10) str++;
  if (/[A-Z]/.test(pw)) str++;
  if (/[0-9]/.test(pw)) str++;
  if (/[^a-zA-Z0-9]/.test(pw)) str++;
  const colors = ["#ef4444", "#f59e0b", "#f59e0b", "#14b8a6", "#10b981"];
  const labels = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
  return { width: str * 20, color: colors[Math.max(0, str - 1)], label: labels[Math.max(0, str - 1)] };
}

const features = [
  { icon: "🧠", color: "rgba(51,68,230,0.06)", title: "AI Therapy", desc: "Understands your money stress dynamically." },
  { icon: "🎯", color: "rgba(20,184,166,0.06)", title: "Goal Tracking", desc: "Set goals and get proactive nudges." },
  { icon: "🔒", color: "rgba(245,158,11,0.06)", title: "Safe & Private", desc: "Encrypted chats that are never shared." },
];

export default function AuthScreen({ currentSession, onAuthSuccess }: AuthScreenProps) {
  const [loginUsername, setLoginUsername] = useState(loginDefaults.username);
  const [loginDisplayName, setLoginDisplayName] = useState("");
  const [loginLastName, setLoginLastName] = useState("");
  const [loginAge, setLoginAge] = useState("");
  const [loginPassword, setLoginPassword] = useState(loginDefaults.password);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0, active: false });
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [barTick, setBarTick] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBarTick(p => (p + 1) % BAR_HEIGHTS.length), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fields = authMode === "signup"
      ? [loginDisplayName, loginUsername, loginPassword]
      : [loginUsername, loginPassword];
    const filled = fields.filter(f => f.trim().length > 0).length;
    const newProgress = Math.round((filled / fields.length) * 100);
    setProgress(newProgress);
    const idx = Math.min(CARD_MESSAGES.length - 1, Math.floor(newProgress / (100 / (CARD_MESSAGES.length - 1))));
    if (idx !== msgIndex) {
      setMsgVisible(false);
      setTimeout(() => { setMsgIndex(idx); setMsgVisible(true); }, 200);
    }
  }, [loginDisplayName, loginUsername, loginPassword, authMode]);

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / 16;
    const y = -(e.clientY - r.top - r.height / 2) / 16;
    setCardTilt({ x, y, active: true });
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);
    try {
      const guestUserId = currentSession?.isGuest ? currentSession.userId : null;
      const payload = authMode === "signup"
        ? await signUpUser(loginUsername.trim(), loginPassword, guestUserId ?? undefined, [loginDisplayName.trim(), loginLastName.trim()].filter(Boolean).join(" ") || loginUsername.trim())
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
      if (message.includes("Invalid email or password")) message = "Incorrect email or password. Please try again.";
      else if (message.includes("{")) {
        try { const p = JSON.parse(message); message = p.detail || p.error || message; } catch {}
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
      setLoginError(error instanceof Error ? error.message : "Unable to sign in as guest.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pwStrength = getPasswordStrength(loginPassword);

  return (
    <div className="auth-screen-shell" style={{ position: "relative", width: "100%", minHeight: "100dvh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg,#F9FAFB 0%,#EFF6FF 40%,#FAF5FF 100%)", overflow: "hidden" }}>
      <div className="auth-screen-grid-overlay" style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", zIndex: 0, WebkitMaskImage: "linear-gradient(to right,transparent 10%,black 45%)", maskImage: "linear-gradient(to right,transparent 10%,black 45%)", pointerEvents: "none" }} />

      <div className="auth-screen-grid" style={{ 
        width: "100%", 
        maxWidth: "1140px", 
        display: "grid", 
        gridTemplateColumns: "minmax(0,1.05fr) minmax(360px,0.95fr)", 
        gap: "clamp(24px, 4vw, 64px)", 
        alignItems: "center", 
        alignContent: "center",
        height: "100dvh",
        boxSizing: "border-box",
        padding: "clamp(16px, 3vw, 40px) clamp(16px, 4vw, 48px)", 
        position: "relative", 
        zIndex: 1 
      }}>
        <style>{`
          @media (max-width: 1100px) {
            .auth-screen-shell {
              position: fixed !important;
              inset: 0 !important;
              align-items: flex-start !important;
              justify-content: flex-start !important;
              height: 100dvh !important;
              overflow-y: auto !important;
              overscroll-behavior: contain !important;
              padding: 18px 18px 28px !important;
            }

            .auth-screen-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
              width: 100% !important;
              height: auto !important;
              align-content: flex-start !important;
              padding-top: 10px !important;
              padding-bottom: 10px !important;
            }

            .auth-screen-left {
              height: auto !important;
              justify-content: flex-start !important;
              gap: 12px !important;
            }

            .auth-screen-credit-card {
              max-width: 100% !important;
              border-radius: 16px !important;
              padding: 14px 16px !important;
              gap: 10px !important;
            }

            .auth-screen-features {
              max-width: 100% !important;
            }

            .auth-screen-form-card {
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }

            .auth-screen-grid-overlay {
              WebkitMaskImage: none !important;
              mask-image: none !important;
            }
          }

          @media (max-width: 640px) {
            .auth-screen-shell {
              position: fixed !important;
              inset: 0 !important;
              align-items: flex-start !important;
              justify-content: flex-start !important;
              height: 100dvh !important;
              overflow-y: auto !important;
              overscroll-behavior: contain !important;
              padding: 12px 12px 28px !important;
            }

            .auth-screen-grid {
              gap: 16px !important;
              height: auto !important;
              align-content: flex-start !important;
              padding-top: 6px !important;
              padding-bottom: 12px !important;
            }

            .auth-screen-left {
              height: auto !important;
              justify-content: flex-start !important;
              gap: 10px !important;
            }

            .auth-screen-credit-card {
              border-radius: 14px !important;
              padding: 12px 12px !important;
              gap: 8px !important;
            }

            .auth-screen-features {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              max-width: 100% !important;
            }

            .auth-screen-form-card {
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              padding: 20px 16px !important;
              gap: 14px !important;
            }

            .auth-screen-form {
              gap: 12px !important;
            }
          }
        `}</style>
        
        {/* LEFT PANEL */}
        <div className="auth-screen-left" style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "16px", 
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          justifyContent: "center",
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0px)" : "translateY(12px)",
          transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", background: "#3344e6", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>💙</div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e1b4b" }}>F2 FinHeal</span>
          </div>

          <div>
            <div className="auth-screen-hero" style={{ fontSize: "clamp(30px, 4.4vw, 40px)", fontWeight: 800, lineHeight: 1.08, color: "#1e1b4b", letterSpacing: "-1.5px", maxWidth: "14ch" }}>Your financial <br /> wellness <span style={{ color: "#3344e6" }}>companion</span></div>
            <p className="auth-screen-secondary-copy" style={{ marginTop: "2px", fontSize: "14px", lineHeight: 1.5, color: "#6b7280", maxWidth: "460px" }}>Navigate money stress with empathy - first guidance - no judgment, just real support.</p>
          </div>

          {/* CREDIT CARD CONTAINER - SIZE IS STRICTLY UNCHANGED */}
          <div
            ref={cardRef}
            className="auth-screen-credit-card"
            onMouseMove={handleTilt}
            onMouseLeave={() => setCardTilt({ x: 0, y: 0, active: false })}
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "linear-gradient(135deg, #1a1f3d 0%, #0f1729 50%, #1a2744 100%)",
              borderRadius: "20px",
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              transform: `perspective(900px) rotateY(${cardTilt.x}deg) rotateX(${cardTilt.y}deg) scale(${cardTilt.active ? 1.02 : 1})`,
              boxShadow: cardTilt.active ? "0 30px 60px rgba(51,68,230,0.25), 0 0 0 1px rgba(255,255,255,0.08)" : "0 20px 40px rgba(15,23,42,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
              cursor: "default",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(99,102,241,0.04) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(99,102,241,0.10)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-40px", left: "-30px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(20,184,166,0.07)", pointerEvents: "none" }} />

            {/* Card Header Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", lineHeight: "1" }}>
                <div style={{ width: "24px", height: "24px", background: "#3344e6", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>💙</div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px", letterSpacing: "0.3px" }}>F2 FinHeal</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", lineHeight: "1" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" style={{ display: "block" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span style={{ color: "#14b8a6", fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px" }}>SECURE</span>
              </div>
            </div>

            {/* Dynamic message */}
            <div style={{ color: "#e0e7ff", fontSize: "12.5px", lineHeight: 1.4, opacity: msgVisible ? 1 : 0, transition: "opacity 0.3s", fontStyle: "italic" }}>
              "{CARD_MESSAGES[msgIndex]}"
            </div>

            {/* Setup progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ color: "#94a3b8", fontSize: "9px", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>Setup progress</span>
                <span style={{ color: "#818cf8", fontSize: "9px", fontWeight: 700 }}>{progress}%</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#3344e6,#14b8a6)", borderRadius: "999px", transition: "width 0.5s ease" }} />
              </div>
            </div>

            {/* Grid Features */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { icon: "🧠", label: "AI Ready" },
                { icon: "📈", label: "Analytics" },
                { icon: "🔒", label: "Encrypted" },
              ].map((f, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px 4px", textAlign: "center", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "13px", display: "block", marginBottom: "2px" }}>{f.icon}</span>
                  <span style={{ color: "#94a3b8", fontSize: "9px", letterSpacing: "0.3px", fontWeight: 500 }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Score Chart */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px 12px", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <span style={{ color: "#94a3b8", fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>Wellness score</span>
                <span style={{ color: "#14b8a6", fontSize: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>● LIVE</span>
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "18px" }}>
                {BAR_HEIGHTS[barTick].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: i < 3 ? "#3344e6" : i < 6 ? "#14b8a6" : "#818cf8", borderRadius: "1.5px", height: `${h}%`, transition: "height 0.8s ease" }} />
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "2px" }}>
              <div>
                <div style={{ color: "#475569", fontSize: "8px", marginBottom: "2px", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>Member since</div>
                <div style={{ color: "#e0e7ff", fontSize: "11px", fontWeight: 600 }}>{today}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#3344e6", opacity: 0.9 }} />
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#14b8a6", marginLeft: "-10px", opacity: 0.8 }} />
              </div>
            </div>
          </div>

          {/* ADJUSTMENT: FEATURE BLOCKS ALIGNED HORIZONTALLY */}
            <div className="auth-screen-features" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", maxWidth: "460px", marginTop: "2px" }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="auth-screen-feature-item"
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "6px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  background: hoveredFeature === i ? "#ffffff" : "rgba(255,255,255,0.45)",
                  border: hoveredFeature === i ? "1px solid rgba(51,68,230,0.12)" : "1px solid rgba(229,231,235,0.15)",
                  boxShadow: hoveredFeature === i ? "0 8px 16px rgba(51,68,230,0.04)" : "none",
                  transform: hoveredFeature === i ? "translateY(-2px)" : "none",
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
              >
                <div style={{ width: "28px", height: "28px", background: f.color, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e1b4b" }}>{f.title}</div>
                  <div style={{ fontSize: "10px", color: "#6b7280", lineHeight: 1.3, marginTop: "2px" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ADJUSTMENT: FOOTER LINK MOVED UP CLOSER */}
          <a className="auth-screen-footer-link" href="https://f2fintech.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#9ca3af", textDecoration: "none", marginTop: "-4px", maxWidth: "100%", overflowWrap: "anywhere" }}>
            F2 Fintech · f2fintech.com · Instant loans with fast approval
          </a>
        </div>

        {/* RIGHT PANEL FORM */}
        <div style={{ 
          width: "100%", 
          display: "flex", 
          justifyContent: "center",
          minWidth: 0,
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0px)" : "translateY(24px)",
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s"
        }}>
          <div className="auth-screen-form-card" style={{ background: "linear-gradient(135deg,#ffffff 0%,#f5f3ff 100%)", borderRadius: "16px", padding: "clamp(18px, 3vw, 32px) clamp(14px, 3vw, 32px)", width: "100%", maxWidth: "380px", height: "560px", boxSizing: "border-box", overflowY: "auto", boxShadow: "0 18px 56px rgba(15,23,42,0.08)", border: "1px solid rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", gap: "clamp(10px, 1.8vw, 14px)" }}>
            <div style={{ display: "flex", overflow: "hidden", borderRadius: "10px", border: "1px solid #e5e7eb", width: "fit-content", maxWidth: "100%" }}>
              <button type="button" onClick={() => setAuthMode("login")} style={{ padding: "8px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", background: authMode === "login" ? "#3344e6" : "#fff", color: authMode === "login" ? "#fff" : "#6b7280", transition: "all 0.15s" }}>Sign in</button>
              <button type="button" onClick={() => setAuthMode("signup")} style={{ padding: "8px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", background: authMode === "signup" ? "#3344e6" : "#fff", color: authMode === "signup" ? "#fff" : "#6b7280", transition: "all 0.15s" }}>Create account</button>
            </div>
            <div>
              <div style={{ fontSize: authMode === "signup" ? "22px" : "26px", fontWeight: 700, color: "#111827", lineHeight: 1.05 }}>{authMode === "signup" ? "Create your account" : "Welcome back"}</div>
              <div style={{ marginTop: authMode === "signup" ? "2px" : "4px", fontSize: authMode === "signup" ? "12px" : "14px", lineHeight: 1.3, color: "#6b7280" }}>{authMode === "signup" ? "Join FinHeal and start your financial wellness journey" : "Sign in to continue your financial wellness journey"}</div>
            </div>
            <form className="auth-screen-form" onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: authMode === "signup" ? "9px" : "16px", minWidth: 0 }}>
              {authMode === "signup" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "#374151" }}>First name <span style={{ color: "#ef4444" }}>*</span></span>
                    <input value={loginDisplayName} onChange={e => setLoginDisplayName(e.target.value)} placeholder="John" autoComplete="given-name" required style={{ height: "40px", padding: "0 10px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px", outline: "none", fontFamily: "inherit", background: "#f9fafb", width: "100%", minWidth: 0, boxSizing: "border-box" as const }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "#374151" }}>Last name</span>
                    <input value={loginLastName} onChange={e => setLoginLastName(e.target.value)} placeholder="Smith" autoComplete="family-name" style={{ height: "40px", padding: "0 10px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px", outline: "none", fontFamily: "inherit", background: "#f9fafb", width: "100%", minWidth: 0, boxSizing: "border-box" as const }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "3px", gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151" }}>Age <span style={{ color: "#ef4444" }}>*</span></span>
                    <input value={loginAge} onChange={e => setLoginAge(e.target.value)} placeholder="e.g. 28" type="number" min="18" max="100" style={{ height: "40px", padding: "0 10px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px", outline: "none", fontFamily: "inherit", background: "#f9fafb", width: "100%", minWidth: 0, boxSizing: "border-box" as const }} />
                  </label>
                </div>
              )}
              <label style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#374151" }}>Email</span>
                <input value={loginUsername} onChange={e => setLoginUsername(e.target.value)} placeholder="you@example.com" autoComplete="username" style={{ height: "40px", padding: "0 10px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px", outline: "none", fontFamily: "inherit", background: "#f9fafb", width: "100%", minWidth: 0, boxSizing: "border-box" as const }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#374151" }}>Password</span>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Enter your password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} style={{ height: "40px", padding: "0 40px 0 10px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px", outline: "none", fontFamily: "inherit", width: "100%", minWidth: 0, background: "#f9fafb" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "18px", height: "18px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "18px", height: "18px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    )}
                  </button>
                </div>
                {authMode === "signup" && loginPassword.length > 0 && (
                  <div>
                    <div style={{ height: "3px", background: "#f3f4f6", borderRadius: "999px", overflow: "hidden", marginTop: "3px" }}>
                      <div style={{ height: "100%", width: `${pwStrength.width}%`, background: pwStrength.color, borderRadius: "999px", transition: "all 0.3s" }} />
                    </div>
                    <div style={{ fontSize: "8px", color: pwStrength.color, marginTop: "2px" }}>{pwStrength.label}</div>
                  </div>
                )}
              </label>
              {loginError && <div style={{ padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "11px", color: "#b91c1c" }}>{loginError}</div>}
              <button type="submit" disabled={isSubmitting} style={{ height: "38px", background: "linear-gradient(135deg,#3344e6 0%,#4f46e5 100%)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: isSubmitting ? 0.7 : 1, marginTop: "1px", boxShadow: "0 3px 10px rgba(51,68,230,0.25)", transition: "all 0.2s" }}
                onMouseOver={e => { if (!isSubmitting) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(51,68,230,0.4)"; } }}
                onMouseOut={e => { if (!isSubmitting) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(51,68,230,0.3)"; } }}>
                {isSubmitting ? "Processing..." : authMode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
            <div style={{ display: "flex", flexDirection: "column", gap: authMode === "signup" ? "8px" : "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, height: "1px", background: "#f3f4f6" }} />
                <span style={{ fontSize: "10px", color: "#d1d5db" }}>or</span>
                <div style={{ flex: 1, height: "1px", background: "#f3f4f6" }} />
              </div>
              <button type="button" onClick={handleGuestLogin} disabled={isSubmitting} style={{ height: "36px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px", fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
                Continue as guest
              </button>
              <div style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af" }}>
                {authMode === "signup" ? "Already have an account? " : "No account yet? "}
                <button type="button" onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} style={{ background: "none", border: "none", color: "#3344e6", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>
                  {authMode === "signup" ? "Sign in" : "Create account"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              {[
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, label: "Bank-grade security" },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3344e6" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: "30 sec setup" },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>, label: "Free to start" },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>{b.icon}<span style={{ fontSize: "10px", color: "#9ca3af" }}>{b.label}</span></div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
