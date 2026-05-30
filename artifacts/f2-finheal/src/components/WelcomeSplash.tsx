import { useEffect, useState, useRef } from "react";

interface WelcomeSplashProps {
  userName?: string;
  onComplete: () => void;
}

export default function WelcomeSplash({ userName, onComplete }: WelcomeSplashProps) {
  const [introFade, setIntroFade] = useState(false);
  const [outroFade, setOutroFade] = useState(false);
  const [showText, setShowText] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Fade in from black
    const t1 = setTimeout(() => setIntroFade(true), 50);
    // Show text after fade in
    const t2 = setTimeout(() => setShowText(true), 900);
    // Fallback
    const fallback = setTimeout(() => {
      setOutroFade(true);
      setTimeout(onComplete, 900);
    }, 12000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(fallback); };
  }, [onComplete]);

  useEffect(() => {
    // Speed up video to 1.3x
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.3;
    }
  }, []);

  const handleVideoEnd = () => {
    setShowText(false);
    setOutroFade(true);
    setTimeout(onComplete, 400);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <style>{`
        @keyframes textFadeUp {
          from { opacity:0; transform:translateY(30px); filter:blur(8px); }
          to { opacity:1; transform:translateY(0); filter:blur(0); }
        }
        @keyframes logoFade {
          from { opacity:0; transform:scale(0.85); }
          to { opacity:1; transform:scale(1); }
        }
      `}</style>

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onEnded={handleVideoEnd}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <source src="/welcome.mp4" type="video/mp4" />
      </video>

      {/* INTRO — black overlay fades out */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "#000",
        zIndex: 4,
        pointerEvents: "none",
        opacity: introFade ? 0 : 1,
        transition: "opacity 0.8s ease-in-out",
      }} />

      {/* OUTRO — black overlay fades in */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "#000",
        zIndex: 4,
        pointerEvents: "none",
        opacity: outroFade ? 1 : 0,
        transition: "opacity 0.4s ease-in-out",
      }} />

      {/* Vignette */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Bottom gradient */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "35%",
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Top gradient */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "20%",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Logo top left */}
      {showText && (
        <div style={{
          position: "absolute",
          top: "28px", left: "36px",
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "logoFade 0.8s ease-out forwards",
        }}>
          <div style={{
            width: "38px", height: "38px",
            background: "#3344e6",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 4px 16px rgba(51,68,230,0.5)",
          }}><img src="/finheal-logo.gif" alt="F2 FinHeal" style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} /></div>
          <span style={{
            fontSize: "18px", fontWeight: 700, color: "white",
            textShadow: "0 1px 8px rgba(0,0,0,0.4)",
          }}>F2 FinHeal</span>
        </div>
      )}

      {/* Welcome text bottom left */}
      {showText && (
        <div style={{
          position: "absolute",
          bottom: "80px", left: "48px",
          zIndex: 3,
          animation: "textFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
        }}>
          {userName && (
            <>
              <div style={{
                fontSize: "clamp(13px,1.5vw,16px)",
                color: "rgba(255,255,255,0.65)",
                fontWeight: 400,
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}>Welcome</div>
              <div style={{
                fontSize: "clamp(28px,4vw,52px)",
                fontWeight: 800, color: "white",
                lineHeight: 1.1,
                textShadow: "0 2px 30px rgba(0,0,0,0.5)",
              }}>{userName} 👋</div>
            </>
          )}
          <div style={{
            marginTop: "10px",
            fontSize: "clamp(13px,1.5vw,16px)",
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
          }}>Your financial wellness journey begins now</div>
          <div style={{
            marginTop: "14px", width: "48px", height: "3px",
            background: "linear-gradient(90deg,#3344e6,#14b8a6)",
            borderRadius: "2px",
          }} />
        </div>
      )}
    </div>
  );
}
