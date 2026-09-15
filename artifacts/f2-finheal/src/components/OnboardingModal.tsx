import { useState, type FormEvent } from "react";
import { Sparkles, User, Phone, Calendar, Compass, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, Heart, Award, Rocket } from "lucide-react";
import { saveUserProfile } from "@/lib/backendAuth";
import type { AuthSession } from "@/utils/authSession";

interface OnboardingModalProps {
  isOpen: boolean;
  session: AuthSession;
  onComplete: () => void;
}

const REFERRAL_CARDS = [
  { id: "📱 Instagram / Social Media", label: "Instagram / Social", icon: "📱", desc: "Reels, posts & ads" },
  { id: "🤝 Friend or Colleague", label: "Friend / Colleague", icon: "🤝", desc: "Word of mouth" },
  { id: "🔍 Google Search", label: "Google Search", icon: "🔍", desc: "Web & articles" },
  { id: "💼 LinkedIn", label: "LinkedIn", icon: "💼", desc: "Professional network" },
  { id: "📰 News / Article", label: "News / Media", icon: "📰", desc: "Press & blogs" },
  { id: "🎯 Other", label: "Other Source", icon: "🎯", desc: "Something else" },
];

export default function OnboardingModal({ isOpen, session, onComplete }: OnboardingModalProps) {
  if (!isOpen) return null;

  // Split pre-filled displayName from Google
  const nameParts = (session.displayName || "").trim().split(" ");
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [referralSource, setReferralSource] = useState(REFERRAL_CARDS[0].id);
  const [customSource, setCustomSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Age Presets
  const handleAgePreset = (presetValue: string) => {
    setAge(presetValue);
    setError(null);
  };

  // Step Nav Validation
  const handleNextFromStep1 = () => {
    setError(null);
    if (!firstName.trim()) {
      setError("Please enter your first name so we know what to call you!");
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setError(null);
    const cleanAge = age.trim();
    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (!cleanAge || isNaN(Number(cleanAge)) || Number(cleanAge) < 18 || Number(cleanAge) > 100) {
      setError("Please enter a valid age (18 to 100).");
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setStep(3);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const fName = firstName.trim();
    const lName = lastName.trim();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    const cleanAge = age.trim();
    const selectedSource = referralSource === "🎯 Other" ? (customSource.trim() || "Other") : referralSource;
    const fullName = [fName, lName].filter(Boolean).join(" ");

    setIsSubmitting(true);
    try {
      await saveUserProfile(session.userId, {
        name: fullName,
        phone: cleanPhone,
        dateOfBirth: cleanAge,
        bio: `Referral Source: ${selectedSource}`,
      });
      onComplete();
    } catch (err) {
      console.error("Failed to update onboarding profile:", err);
      setError(err instanceof Error ? err.message : "Unable to save details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Progress Percentage
  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(51, 68, 230, 0.35)",
          border: "1px solid rgba(229, 231, 235, 0.8)",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Top Animated Progress Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #3344e6 100%)",
            padding: "24px 24px 18px 24px",
            color: "#ffffff",
            position: "relative",
          }}
        >
          {/* Background Decorative Glow */}
          <div
            style={{
              position: "absolute",
              top: "-30px",
              right: "-30px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(56,189,248,0.25) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={16} style={{ color: "#fbbf24" }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.9)" }}>
                Personalize Your Setup
              </span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#60a5fa", background: "rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: "20px" }}>
              Step {step} of 3
            </span>
          </div>

          {/* Dynamic Catchy Title */}
          <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {step === 1 && "👋 Welcome! What should we call you?"}
            {step === 2 && "🎯 Let's build your financial baseline"}
            {step === 3 && "🚀 One quick question before we launch!"}
          </h2>
          <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", margin: "4px 0 14px 0" }}>
            {step === 1 && "Help us personalize your AI companion & dashboard greetings."}
            {step === 2 && "Used to calculate age-based benchmarks & secure your account."}
            {step === 3 && "Tell us how you found FinHeal so we can keep improving!"}
          </p>

          {/* Visual Step Progress Bar */}
          <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.15)", borderRadius: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, #38bdf8 0%, #34d399 100%)",
                borderRadius: "10px",
                transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </div>

          {/* Step Badges */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            {[
              { label: "Identity", num: 1 },
              { label: "Details", num: 2 },
              { label: "Discovery", num: 3 },
            ].map((s) => (
              <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: step >= s.num ? "#38bdf8" : "rgba(255,255,255,0.4)", fontWeight: step === s.num ? 700 : 500 }}>
                {step > s.num ? <CheckCircle2 size={12} style={{ color: "#34d399" }} /> : <span>{s.num}.</span>}
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: "22px 24px", minHeight: "280px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", fontSize: "12px", color: "#b91c1c", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span> <span>{error}</span>
            </div>
          )}

          {/* STEP 1: NAME */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3730a3" }}>
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>Your Google Account</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{session.email}</div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  First Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Gunjan"
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "inherit",
                    background: "#ffffff",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3344e6")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Dhiman"
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "inherit",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3344e6")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>
          )}

          {/* STEP 2: AGE & MOBILE */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Age & Quick Presets */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                    Your Age <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Pick or type</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "8px" }}>
                  {["21", "25", "30", "35"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleAgePreset(p)}
                      style={{
                        height: "32px",
                        borderRadius: "8px",
                        border: age === p ? "2px solid #3344e6" : "1px solid #e2e8f0",
                        background: age === p ? "#eef2ff" : "#f8fafc",
                        color: age === p ? "#3344e6" : "#475569",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {p} yrs
                    </button>
                  ))}
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Or enter exact age (e.g. 26)"
                    style={{
                      width: "100%",
                      height: "42px",
                      padding: "0 14px 0 36px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "12px",
                      fontSize: "14px",
                      outline: "none",
                      fontFamily: "inherit",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3344e6")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                  <Calendar size={16} style={{ position: "absolute", left: "12px", top: "13px", color: "#94a3b8" }} />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Mobile Number <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", left: "12px", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600, color: "#475569", borderRight: "1px solid #cbd5e1", paddingRight: "8px", height: "24px" }}>
                    <span>🇮🇳</span> <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    style={{
                      width: "100%",
                      height: "42px",
                      padding: "0 14px 0 85px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      outline: "none",
                      fontFamily: "inherit",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3344e6")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REFERRAL CARDS */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                How did you hear about FinHeal?
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {REFERRAL_CARDS.map((card) => {
                  const isSelected = referralSource === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setReferralSource(card.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: isSelected ? "2px solid #3344e6" : "1px solid #e2e8f0",
                        background: isSelected ? "#eef2ff" : "#f8fafc",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{card.icon}</span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "#3344e6" : "#1e293b" }}>
                          {card.label}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{card.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {referralSource === "🎯 Other" && (
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Please specify (e.g. YouTube, College, Event)"
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "12px",
                    outline: "none",
                    fontFamily: "inherit",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>
          )}

          {/* Navigation Control Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "20px" }}>

            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setError(null); setStep((s) => (s - 1) as any); }}
                style={{
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {step === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                style={{
                  flex: 1,
                  height: "42px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #3344e6 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(51, 68, 230, 0.35)",
                  fontFamily: "inherit",
                }}
              >
                Next Step <ArrowRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                style={{
                  flex: 1,
                  height: "42px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #3344e6 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(51, 68, 230, 0.35)",
                  fontFamily: "inherit",
                }}
              >
                Next Step <ArrowRight size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  height: "42px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                  fontFamily: "inherit",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Finishing..." : "Launch FinHeal 🚀"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "12px" }}>
            <ShieldCheck size={13} style={{ color: "#10b981" }} />
            <span style={{ fontSize: "11px", color: "#64748b" }}>100% Secure & Bank-grade Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
