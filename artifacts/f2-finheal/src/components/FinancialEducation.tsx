import React, { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

export interface ContentItem {
  id: string;
  type: "video" | "article";
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  emoji: string;
  bgColor: string;
  youtubeId?: string;
  articleUrl?: string;
  date?: string;
  description: string;
  source: string;
  readTime?: string;
  duration?: string;
  views?: string;
}

export const CONTENT: ContentItem[] = [
  { id: "a1", type: "article", title: "How to Get a Business Loan in India", source: "f2fintech.com", readTime: "6 min read", level: "Intermediate", category: "Loans", emoji: "💼", bgColor: "#E6F1FB", articleUrl: "https://f2fintech.com/blogs/blogs-businessloan", date: "Recent", description: "A complete guide to getting a business loan in India - eligibility, documents, and tips to get approved faster." },
  { id: "a2", type: "article", title: "GST 2.0 and Its Impact on Your Loans", source: "f2fintech.com", readTime: "5 min read", level: "Intermediate", category: "Loans", emoji: "📋", bgColor: "#EAF3DE", articleUrl: "https://f2fintech.com/blogs/loans-gst2.0", date: "Recent", description: "GST 2.0 changes are here - find out how they affect your loan applications and what you need to do now." },
  { id: "a3", type: "article", title: "What is an Overdraft (OD) Facility?", source: "f2fintech.com", readTime: "4 min read", level: "Beginner", category: "Credit", emoji: "🏦", bgColor: "#FAEEDA", articleUrl: "https://f2fintech.com/blogs/blog-OD", date: "Recent", description: "An overdraft facility gives you instant access to funds when you need them - without a separate loan application." },
  { id: "a4", type: "article", title: "Personal Loan for Chartered Accountants", source: "f2fintech.com", readTime: "5 min read", level: "Intermediate", category: "Loans", emoji: "📊", bgColor: "#E6F1FB", articleUrl: "https://f2fintech.com/blogs/Personal-Loan-for-Chartered-Accountants-Instant-Approval-Low-Interest-Rates-2026-Rates%20from-Up-to-Rs-75-Lakh", date: "Recent", description: "Instant approval personal loans for CAs with low interest rates and up to Rs 75 Lakh limit in 2026." },
  { id: "a5", type: "article", title: "How to Get Instant Approval on Personal Loan for CAs", source: "f2fintech.com", readTime: "4 min read", level: "Beginner", category: "Loans", emoji: "⚡", bgColor: "#EAF3DE", articleUrl: "https://f2fintech.com/blogs/How-to-Get-Instant-Approval-on-Personal-Loan-for-Chartered-Accountants", date: "Recent", description: "Step by step guide for Chartered Accountants to get instant personal loan approval with minimal documents." },
  { id: "a6", type: "article", title: "Festive Season Loans - Best Offers & Tips", source: "f2fintech.com", readTime: "4 min read", level: "Beginner", category: "Loans", emoji: "🎉", bgColor: "#FAEEDA", articleUrl: "https://f2fintech.com/blogs/loans-festiveseasonloans", date: "Recent", description: "Make the most of festive season loan offers with lower interest rates and special repayment terms." },
  { id: "a7", type: "article", title: "Doctor Loan in India - Complete Guide", source: "f2fintech.com", readTime: "6 min read", level: "Intermediate", category: "Business", emoji: "👨‍⚕️", bgColor: "#EAF3DE", articleUrl: "https://f2fintech.com/blogs/doctor-loan-in-india", date: "Recent", description: "Everything doctors need to know about getting a professional loan in India - eligibility, rates and process." },
  { id: "a8", type: "article", title: "Personal Loan - Everything You Need to Know", source: "f2fintech.com", readTime: "5 min read", level: "Beginner", category: "Loans", emoji: "💰", bgColor: "#EEEDFE", articleUrl: "https://f2fintech.com/blogs/personalloan-loans", date: "Recent", description: "A complete guide to personal loans in India - who qualifies, how to apply and what to watch out for." },
  { id: "v1", type: "video", title: "F2 Fintech - Financial Tips", source: "F2 Fintech", duration: "5 min", level: "Beginner", category: "Loans", emoji: "🎥", bgColor: "#1e2db8", youtubeId: "kolvz4Iu_Yo", views: "", date: "Recent", description: "Expert financial tips and advice from F2 Fintech to help you make smarter money decisions." },
  { id: "v2", type: "video", title: "F2 Fintech - Loan Guide", source: "F2 Fintech", duration: "5 min", level: "Intermediate", category: "Loans", emoji: "💼", bgColor: "#0f6e56", youtubeId: "xcsIh2fA7w0", views: "", date: "Recent", description: "Complete guide to getting the right loan for your needs with F2 Fintech." },
  { id: "v3", type: "video", title: "F2 Fintech - Credit Score Tips", source: "F2 Fintech", duration: "5 min", level: "Beginner", category: "Credit", emoji: "⭐", bgColor: "#633806", youtubeId: "_efmpZ5k9S8", views: "", date: "Recent", description: "Learn how to improve your credit score and get better loan terms from F2 Fintech experts." },
  { id: "v4", type: "video", title: "F2 Fintech - Business Finance", source: "F2 Fintech", duration: "5 min", level: "Intermediate", category: "Business", emoji: "🏢", bgColor: "#3b0764", youtubeId: "cRRmxll1tGE", views: "", date: "Recent", description: "Business finance strategies and funding options explained by F2 Fintech professionals." },
];

interface ShortItem {
  id: string;
  title: string;
  platform: "youtube" | "instagram";
  reelUrl?: string;
  thumbnailUrl?: string;
}

const SHORTS: ShortItem[] = [
  { id: "Rlyw_vt7748", title: "Quick Finance Tip #1", platform: "youtube" },
  { id: "2XnoYTeA1bA", title: "Quick Finance Tip #2", platform: "youtube" },
  { id: "o8TrS5Hu3tE", title: "Quick Finance Tip #3", platform: "youtube" },
  { id: "et_R-v_qwVM", title: "Quick Finance Tip #4", platform: "youtube" },
  { 
    id: "DZ7TcesyLIV", 
    title: "Understanding Personal Loans & Credit", 
    platform: "instagram", 
    reelUrl: "https://www.instagram.com/reel/DZ7TcesyLIV/?igsh=MW5teHhnYXo5bWl6bw%3D%3D"
  }
];


const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: "#EAF3DE", color: "#27500A" },
  Intermediate: { bg: "#FAEEDA", color: "#633806" },
  Advanced: { bg: "#EEEDFE", color: "#3C3489" },
};

const QUIZ_QUESTIONS = [
  { q: "🎂 What is your age group?", opts: ["Below 18 - Just Started", "18-25 - Students", "25-35 - Early Career", "35-50 - Mid Career", "50-60 - Near Retirement", "60+ - Retired"] },
  { q: "💼 What is your profession?", opts: ["Salaried Employee", "Business Owner / Self-Employed", "Doctor / Medical Professional", "Chartered Accountant (CA)", "Freelancer / Consultant", "Student / Not Working Yet"] },
  { q: "💸 What is your biggest financial challenge?", opts: ["Managing EMIs / Debt", "Not Enough Savings", "Low Credit Score", "Tax Planning", "No Clear Financial Plan"] },
  { q: "🎯 What is your primary financial goal?", opts: ["Get a Loan / Business Funding", "Build Emergency Fund", "Improve Credit Score", "Save for Future / Retirement", "Tax Planning", "Other - I will describe my goal"] },
];

const STORAGE_KEY_ARTICLES = "finheal_edu_read";

interface Props {
  userId?: string;
  onToggleSidebar?: () => void;
  onAskAboutContent?: (payload: { title: string; description: string; url?: string; type: string; category: string }) => void;
}

export default function FinancialEducation({ userId, onToggleSidebar, onAskAboutContent }: Props) {
  const [tab, setTab] = useState<"all" | "articles" | "videos" | "quiz">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [read, setRead] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizHistory, setQuizHistory] = useState<number[]>([]);
  const [otherGoal, setOtherGoal] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));
  const previousProgressRef = useRef(0);
  
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("finheal_education_content");
    if (stored) {
      try {
        setContentItems(JSON.parse(stored));
      } catch (e) {
        setContentItems(CONTENT);
      }
    } else {
      localStorage.setItem("finheal_education_content", JSON.stringify(CONTENT));
      setContentItems(CONTENT);
    }

    const handleUpdate = () => {
      const nextStored = localStorage.getItem("finheal_education_content");
      if (nextStored) {
        try { setContentItems(JSON.parse(nextStored)); } catch {}
      }
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("finheal:education_update", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("finheal:education_update", handleUpdate);
    };
  }, []);

  const key = userId || "guest";

  useEffect(() => {
    const r = localStorage.getItem(STORAGE_KEY_ARTICLES + ":" + key);
    if (r) setRead(JSON.parse(r));
    const w = localStorage.getItem("finheal_watched:" + key);
    if (w) setWatchedVideos(JSON.parse(w));
  }, [key]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const markRead = (id: string) => {
    if (read.includes(id)) return;
    const updated = [...read, id];
    setRead(updated);
    localStorage.setItem(STORAGE_KEY_ARTICLES + ":" + key, JSON.stringify(updated));
  };

  const markWatched = (id: string) => {
    if (watchedVideos.includes(id)) return;
    const updated = [...watchedVideos, id];
    setWatchedVideos(updated);
    localStorage.setItem("finheal_watched:" + key, JSON.stringify(updated));
  };

  const videos = contentItems.filter(c => c.type === "video");
  const articles = contentItems.filter(c => c.type === "article");
  const categories = ["All", "Financial Tips", "Loans", "Credit", "Savings", "Debt", "Tax", "Business"];
  const filteredVideos = (categoryFilter === "All" ? videos : videos.filter(v => v.category === categoryFilter)).filter(v => searchQuery === "" || v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredArticles = (categoryFilter === "All" ? articles : articles.filter(a => a.category === categoryFilter)).filter(a => searchQuery === "" || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const readItems = contentItems.filter(c => c.type === "article" && read.includes(c.id));
  const totalItems = articles.length + videos.length;
  const progressPct = totalItems > 0 ? Math.round(((read.length + watchedVideos.length) / totalItems) * 100) : 0;

  useEffect(() => {
    const wasBelowComplete = previousProgressRef.current < 100;
    previousProgressRef.current = progressPct;

    if (!wasBelowComplete || progressPct !== 100) return;

    setShowConfetti(true);
    const timer = window.setTimeout(() => setShowConfetti(false), 7000);

    return () => window.clearTimeout(timer);
  }, [progressPct]);

  const askAboutContent = (item: ContentItem) => {
    const payload = {
      title: item.title,
      description: item.description,
      url: item.articleUrl || ("https://www.youtube.com/watch?v=" + item.youtubeId),
      type: item.type,
      category: item.category,
    };
    if (onAskAboutContent) {
      onAskAboutContent(payload);
    } else {
      const msg = item.type === "article"
        ? "Can you summarize this article for me? Title: " + item.title + ". Description: " + item.description + ". URL: " + item.articleUrl
        : "Can you explain the key financial concepts from this video? Title: " + item.title + ". Description: " + item.description;
      window.dispatchEvent(new CustomEvent("finheal:ask", { detail: { message: msg, contentItem: payload } }));
    }
  };

  const levelBadge = (level: string) => {
    const s = LEVEL_STYLE[level] || { bg: "#f3f4f6", color: "#374151" };
    return <span style={{ background: s.bg, color: s.color, borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>{level}</span>;
  };

  const FinancialTipsColumn = () => {
    const [playingShort, setPlayingShort] = React.useState<string | null>(null);
    const touchStartY = React.useRef<number>(0);
    const wheelTimeout = React.useRef<any>(null);
    const currentIdx = SHORTS.findIndex(s => s.id === playingShort);
    const currentShort = currentIdx !== -1 ? SHORTS[currentIdx] : null;
    const isYoutube = !currentShort || currentShort.platform === "youtube";

    const goNext = () => setPlayingShort(SHORTS[currentIdx < SHORTS.length - 1 ? currentIdx + 1 : 0].id);
    const goPrev = () => setPlayingShort(SHORTS[currentIdx > 0 ? currentIdx - 1 : SHORTS.length - 1].id);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e: React.TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    };
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      if (wheelTimeout.current) return;
      if (e.deltaY > 30) goNext();
      else if (e.deltaY < -30) goPrev();
      wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null; }, 800);
    };

    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ background: "linear-gradient(135deg,#1e1b4b,#3344e6)", borderRadius: "12px 12px 0 0", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>💡</span>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Financial Tips</div>
          <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "2px 8px" }}>
            <span style={{ fontSize: "10px", color: "white", fontWeight: 600 }}>{SHORTS.length} Videos</span>
          </div>
        </div>
        <div style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: "0 0 12px 12px", padding: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {playingShort && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <button onClick={goPrev}
                  style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#1e1b4b", border: "none", color: "white", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>◀</button>
                <span style={{ fontSize: "9px", color: "#9ca3af", fontWeight: 500 }}>Prev</span>
              </div>
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                style={{ borderRadius: "10px", overflow: "hidden", position: "relative", width: "300px", flexShrink: 0 }}>
                <button onClick={() => setPlayingShort(null)}
                  style={{ position: "absolute", top: "6px", right: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "white", cursor: "pointer", fontSize: "10px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                <div style={{ position: "relative", paddingTop: "177%", background: "#000", overflow: "hidden" }}>
                  {isYoutube ? (
                    <iframe key={playingShort}
                      src={"https://www.youtube.com/embed/" + playingShort + "?autoplay=1&loop=1&playlist=" + playingShort + "&modestbranding=1&rel=0&controls=0&showinfo=0"}
                      title="Financial Short"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: "absolute", top: "-8%", left: 0, width: "100%", height: "116%", border: "none" }} />
                  ) : (
                    <iframe key={playingShort}
                      src={"https://www.instagram.com/reel/" + playingShort + "/embed/"}
                      title="Financial Instagram Reel"
                      allowFullScreen
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                  )}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "14%", background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 100%)", pointerEvents: "none", zIndex: 5 }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "10%", background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 100%)", pointerEvents: "none", zIndex: 5 }} />
                  {isYoutube ? (
                    <a href={"https://www.youtube.com/shorts/" + playingShort} target="_blank" rel="noopener noreferrer"
                      style={{ position: "absolute", bottom: "8px", right: "8px", display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,0,0,0.92)", borderRadius: "6px", padding: "4px 8px", zIndex: 10, textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                      <svg width="14" height="10" viewBox="0 0 24 17" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.5 2.5C23.2 1.4 22.3 0.5 21.2 0.2 19.4 0 12 0 12 0S4.6 0 2.8.2C1.7.5.8 1.4.5 2.5 0 4.3 0 8.5 0 8.5s0 4.2.5 6c.3 1.1 1.2 2 2.3 2.3C4.6 17 12 17 12 17s7.4 0 9.2-.2c1.1-.3 2-1.2 2.3-2.3.5-1.8.5-6 .5-6s0-4.2-.5-6z" />
                        <path d="M9.5 12l6.5-3.5L9.5 5v7z" fill="#ff0000" />
                      </svg>
                      <span style={{ fontSize: "10px", color: "white", fontWeight: 700 }}>YouTube</span>
                    </a>
                  ) : (
                    <a href={currentShort?.reelUrl || ("https://www.instagram.com/reel/" + playingShort + "/")} target="_blank" rel="noopener noreferrer"
                      style={{ position: "absolute", bottom: "8px", right: "8px", display: "flex", alignItems: "center", gap: "4.5px", background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", borderRadius: "6px", padding: "4px 8px", zIndex: 10, textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                      <span style={{ fontSize: "11px", color: "white" }}>📸</span>
                      <span style={{ fontSize: "10px", color: "white", fontWeight: 700 }}>Instagram</span>
                    </a>
                  )}
                </div>
                <div style={{ textAlign: "center", padding: "6px 8px", background: "#f9fafb", fontSize: "11px", color: "#1e1b4b", fontWeight: 700 }}>{currentIdx + 1} / {SHORTS.length} · {currentShort?.title}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <button onClick={goNext}
                  style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#3344e6", border: "none", color: "white", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(51,68,230,0.3)" }}>▶</button>
                <span style={{ fontSize: "9px", color: "#9ca3af", fontWeight: 500 }}>Next</span>
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {SHORTS.map((s) => (
              <div key={s.id} onClick={() => setPlayingShort(playingShort === s.id ? null : s.id)}
                style={{ borderRadius: "8px", overflow: "hidden", border: playingShort === s.id ? "2px solid #3344e6" : "1px solid #e5e7eb", cursor: "pointer", background: "white", transition: "all 0.2s" }}>
                <div style={{ position: "relative" }}>
                  {s.platform === "instagram" ? (
                    s.thumbnailUrl ? (
                      <img src={s.thumbnailUrl} alt={s.title}
                        style={{ width: "100%", height: "72px", objectFit: "cover", display: "block", opacity: playingShort === s.id ? 0.75 : 1 }} />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "72px",
                        background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "9px",
                        fontWeight: "bold",
                        position: "relative"
                      }}>
                        <span style={{ fontSize: "16px", marginBottom: "2px" }}>📸</span>
                        <span style={{ letterSpacing: "0.5px" }}>INSTAGRAM REEL</span>
                      </div>
                    )
                  ) : (
                    <img src={"https://img.youtube.com/vi/" + s.id + "/mqdefault.jpg"} alt={s.title}
                      style={{ width: "100%", height: "72px", objectFit: "cover", display: "block", opacity: playingShort === s.id ? 0.75 : 1 }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "26px", height: "26px", background: playingShort === s.id ? "rgba(51,68,230,0.9)" : (s.platform === "instagram" ? "rgba(188,24,136,0.95)" : "rgba(255,0,0,0.85)"), borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {playingShort === s.id
                        ? <div style={{ width: "7px", height: "7px", background: "white", borderRadius: "1px" }} />
                        : <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "9px solid white", marginLeft: "2px" }} />}
                    </div>
                  </div>
                  <span style={{ position: "absolute", top: "4px", right: "4px", background: playingShort === s.id ? "#3344e6" : (s.platform === "instagram" ? "#c13584" : "rgba(0,0,0,0.65)"), color: "white", fontSize: "7px", padding: "1px 4px", borderRadius: "3px", fontWeight: 600 }}>{playingShort === s.id ? "▶ NOW" : (s.platform === "instagram" ? "REEL" : "SHORT")}</span>
                </div>
                <div style={{ padding: "5px 7px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: playingShort === s.id ? "#3344e6" : "#1e1b4b", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", marginTop: "2px" }}>F2 Fintech</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const VideoCard = ({ item, delay = 0 }: { item: ContentItem; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      transition={{ type: "spring", stiffness: 80, damping: 12, delay }}
      style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: "16px", overflow: "hidden", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      {playingVideoId === item.id && item.youtubeId ? (
        <div style={{ width: "100%", aspectRatio: "16/9" }}>
          <iframe width="100%" height="100%" src={"https://www.youtube.com/embed/" + item.youtubeId + "?autoplay=1"}
            title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen style={{ border: "none", display: "block", width: "100%", height: "100%" }} />
        </div>
      ) : (
        <div onClick={() => { setPlayingVideoId(item.id); markWatched(item.id); }} style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
          <img src={"https://img.youtube.com/vi/" + item.youtubeId + "/hqdefault.jpg"} alt={item.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "relative", width: "56px", height: "56px", background: "rgba(255,0,0,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <div style={{ width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid white", marginLeft: "4px" }} />
          </div>
          {item.duration && <span style={{ position: "absolute", bottom: "8px", right: "10px", background: "rgba(0,0,0,0.75)", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "4px", zIndex: 1 }}>{item.duration}</span>}
        </div>
      )}
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          <span style={{ background: "#E6F1FB", color: "#0C447C", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>🎥 Video</span>
          {levelBadge(item.level)}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1b4b", marginBottom: "4px" }}>{item.title}</div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>{item.description}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.source} · {item.date}</div>
          <a href={"https://www.youtube.com/watch?v=" + item.youtubeId} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "11px", color: "#ff0000", fontWeight: 600, textDecoration: "none" }}>Watch on YouTube ↗</a>
        </div>
        <button
          onClick={() => askAboutContent(item)}
          style={{ marginTop: "10px", width: "100%", padding: "8px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#3344e6,#7c3aed)", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          🤖 Ask Chatbot About This
        </button>
      </div>
    </motion.div>
  );

  const ArticleCard = ({ item, delay = 0 }: { item: ContentItem; delay?: number }) => (
    <motion.a
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      transition={{ type: "spring", stiffness: 80, damping: 12, delay }}
      href={item.articleUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }} onClick={() => markRead(item.id)}>
      <div style={{ background: "white", border: "1.5px solid " + (read.includes(item.id) ? "#10b981" : "#e5e7eb"), borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", gap: "14px", alignItems: "flex-start" }}>
        <div style={{ width: "52px", height: "52px", background: item.bgColor, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{item.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ background: "#EEEDFE", color: "#3C3489", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>Article</span>
            {levelBadge(item.level)}
            {read.includes(item.id) && <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: "20px", padding: "2px 8px", fontSize: "11px" }}>✓ Read</span>}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1b4b", marginBottom: "4px", lineHeight: 1.4 }}>{item.title}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>{item.description}</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.source} · {item.readTime} · {item.date}</div>
            <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: "20px" }}>{item.readTime}</span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); askAboutContent(item); }}
            style={{ marginTop: "10px", width: "100%", padding: "8px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#3344e6,#7c3aed)", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            🤖 Ask Chatbot About This
          </button>
        </div>
      </div>
    </motion.a>
  );

  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-gray-900 sm:text-[20px]">📚 Financial Education</div>
          <div className="text-[10px] text-gray-400 sm:text-[15px]">✨ Your journey to smarter money decisions starts here.......</div>
        </div>

        {onToggleSidebar && (
          <div className="flex items-center gap-[8px]">
            <div className="flex items-center bg-gray-100 rounded-[20px] px-[14px] py-[6px] border border-gray-200 gap-[6px]">
              <span className="text-[13px] text-gray-400">🔍</span>
              <input
                placeholder="Search articles & videos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border-none bg-transparent outline-none text-[12px] text-gray-700 w-[160px]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px] scrollbar-thin">
        {showConfetti && viewport.width > 0 && viewport.height > 0 && (
          <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
            <Confetti
              width={viewport.width}
              height={viewport.height}
              recycle={false}
              numberOfPieces={420}
              gravity={0.18}
              tweenDuration={7000}
              colors={["#3344e6", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"]}
            />
          </div>
        )}

        {/* BANNER PROMO */}
        <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px] mb-[20px]">
          <div className="absolute right-[-24px] top-[-24px] h-[120px] w-[120px] rounded-full bg-gradient-to-br from-primary to-[#7c8cff] opacity-10" />
          <div className="relative z-10 max-w-[640px]">
            <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)]">
              Learning Hub
            </div>
            <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px]">
              Master your money with structured learning.
            </h1>
            <p className="mt-[10px] max-w-[560px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px]">
              Explore expert-curated articles, video guides, and interactive quizzes to build your financial intelligence.
            </p>
            <div className="mt-[14px] flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600">
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">📖 Articles & Guides</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">🎥 Expert Videos</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">🧠 Interactive Quizzes</span>
            </div>
          </div>
        </section>

        {/* PROGRESS BAR */}
        <div style={{ margin: "0 0 16px", background: "white", border: "1.5px solid #e5e7eb", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e1b4b" }}>📊 Your learning progress</span>
            <span style={{ fontSize: "12px", fontWeight: 800, color: progressPct === 100 ? "#10b981" : "#3344e6" }}>{progressPct}%</span>
          </div>
          <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: progressPct + "%", background: progressPct === 100 ? "#10b981" : "linear-gradient(90deg,#3344e6,#7c3aed)", borderRadius: "999px", transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
            <span style={{ fontSize: "10px", color: "#9ca3af" }}>{read.length} articles · {watchedVideos.length} videos watched</span>
            <span style={{ fontSize: "10px", color: progressPct === 100 ? "#10b981" : "#9ca3af" }}>{progressPct === 100 ? "All done!" : (totalItems - read.length - watchedVideos.length) + " remaining"}</span>
          </div>
        </div>

        {/* ARTICLES READ HISTORY */}
        <div onClick={() => setHistoryOpen(!historyOpen)}
          style={{ background: historyOpen ? "linear-gradient(135deg,#f5f3ff,#ede9fe)" : "linear-gradient(135deg,#f9fafb,#f3f4f6)", border: "2px solid " + (historyOpen ? "#7c3aed" : "#e5e7eb"), borderRadius: "16px", padding: "14px 18px", cursor: "pointer", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>📄 Articles read</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{read.length} <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: 400 }}>/ {articles.length}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af" }}>tap for history</div>
          </div>
        </div>
        <AnimatePresence>
          {historyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "16px", overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e1b4b" }}>Articles read & Videos watched</span>
                <button onClick={() => setHistoryOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "12px" }}>✕ Close</button>
              </div>
              {readItems.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>Nothing here yet - start reading!</div>
              ) : readItems.map(item => (
                <div key={item.id} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderBottom: "1px solid #f9fafb", alignItems: "center" }}>
                  <div style={{ width: "36px", height: "36px", background: item.bgColor, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{item.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.readTime}</div>
                  </div>
                  <a href={item.articleUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#3344e6", flexShrink: 0, fontWeight: 600, textDecoration: "none", background: "#eef0fd", padding: "4px 10px", borderRadius: "20px" }}>↗ Re-read</a>
                </div>
              ))}
              {watchedVideos.length > 0 && (
                <div style={{ padding: "8px 14px", background: "#f9fafb", borderTop: "1px solid #f3f4f6" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e1b4b", marginBottom: "6px" }}>🎥 Videos Watched</div>
                  {videos.filter(v => watchedVideos.includes(v.id)).map(item => (
                    <div key={item.id} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
                      <div style={{ width: "36px", height: "36px", background: item.bgColor, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{item.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.duration}</div>
                      </div>
                      <a href={"https://www.youtube.com/watch?v=" + item.youtubeId} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#ff0000", flexShrink: 0, fontWeight: 600, textDecoration: "none", background: "#fff0f0", padding: "4px 10px", borderRadius: "20px" }}>▶ Watch</a>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABS MENU */}
        <div style={{ display: "flex", gap: "4px", borderBottom: "1.5px solid #e5e7eb", marginBottom: "16px" }}>
          {(["all", "articles", "videos", "quiz"]).map(t => (
            <motion.button
              whileHover={{ backgroundColor: tab === t ? "#3344e6" : "#f3f4f6" }}
              whileTap={{ scale: 0.95 }}
              key={t} onClick={() => setTab(t as "all" | "articles" | "videos" | "quiz")}
              style={{ padding: "8px 16px", borderRadius: "12px 12px 0 0", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: tab === t ? "#3344e6" : "transparent", color: tab === t ? "white" : "#6b7280" }}>
              {t === "all" ? "✨ All" : t === "articles" ? "📄 Articles" : t === "videos" ? "🎥 Videos" : "🧠 Quiz"}
            </motion.button>
          ))}
        </div>

        <div style={{ paddingTop: "14px" }}>
          {(tab === "all" || tab === "articles" || tab === "videos") && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)}
                  style={{ padding: "5px 14px", borderRadius: "20px", border: "1px solid", fontSize: "12px", cursor: "pointer", borderColor: categoryFilter === c ? "#3344e6" : "#e5e7eb", background: categoryFilter === c ? "#3344e6" : "white", color: categoryFilter === c ? "white" : "#374151" }}>
                  {c === "All" ? "✨ All" : c === "Financial Tips" ? "💡 Financial Tips" : c === "Loans" ? "💼 Loans" : c === "Credit" ? "💳 Credit" : c === "Savings" ? "🏦 Savings" : c === "Debt" ? "📉 Debt" : c === "Tax" ? "🧾 Tax" : c === "Business" ? "🏢 Business" : c}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              {tab === "all" && (
                <>
                  <div style={{ background: "linear-gradient(135deg,#eef0fd,#f5f3ff)", border: "1px solid #d4d8fa", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e1b4b", marginBottom: "4px" }}>🎯 Get personalised content</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Take our 2-min quiz and get content matched to your financial situation.</div>
                    <button onClick={() => setTab("quiz")} style={{ padding: "8px 20px", borderRadius: "20px", background: "#3344e6", color: "white", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>🚀 Take quiz</button>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", margin: "0 0 10px" }}>📰 Latest articles</div>
                  {filteredArticles.map((a, idx) => <ArticleCard key={a.id} item={a} delay={Math.min(idx * 0.05, 0.3)} />)}
                </>
              )}

              {tab === "articles" && filteredArticles.map((a, idx) => <ArticleCard key={a.id} item={a} delay={Math.min(idx * 0.05, 0.3)} />)}

              {tab === "videos" && (
                <>
                  {categoryFilter === "Financial Tips" ? (
                    <FinancialTipsColumn />
                  ) : (
                    <>
                      {categoryFilter === "All" && <FinancialTipsColumn />}
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "10px" }}>🎥 Full Videos</div>
                      {filteredVideos.map((v, idx) => <VideoCard key={v.id} item={v} delay={Math.min(idx * 0.05, 0.3)} />)}
                    </>
                  )}
                </>
              )}

              {tab === "quiz" && (
                <>
                  {!quizStarted && !quizDone && (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🧠</div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#1e1b4b", marginBottom: "8px" }}>2-minute financial quiz</div>
                      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>Answer 4 quick questions and get articles matched to your exact financial situation.</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "16px 0", flexWrap: "wrap" }}>
                        <span style={{ background: "#eef0fd", color: "#3344e6", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", fontWeight: 500 }}>⚡ 2 minutes</span>
                        <span style={{ background: "#EAF3DE", color: "#27500A", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", fontWeight: 500 }}>🎯 Personalised</span>
                        <span style={{ background: "#FAEEDA", color: "#633806", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", fontWeight: 500 }}>🆓 Free</span>
                      </div>
                      <button onClick={() => setQuizStarted(true)} style={{ padding: "12px 32px", borderRadius: "20px", background: "#3344e6", color: "white", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>🚀 Start quiz</button>
                    </div>
                  )}
                  {quizStarted && !quizDone && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>Question {qIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                        <span style={{ fontSize: "12px", color: "#3344e6", fontWeight: 600 }}>{Math.round(((qIdx + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                      </div>
                      <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "999px", marginBottom: "20px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: (((qIdx + 1) / QUIZ_QUESTIONS.length) * 100) + "%", background: "linear-gradient(90deg,#3344e6,#7c3aed)", borderRadius: "999px", transition: "width 0.4s" }} />
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e1b4b", marginBottom: "16px" }}>{QUIZ_QUESTIONS[qIdx].q}</div>
                      {QUIZ_QUESTIONS[qIdx].opts.map(opt => (
                        <button key={opt} onClick={() => setSelected(opt)}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: "12px", border: "2px solid " + (selected === opt ? "#3344e6" : "#e5e7eb"), background: selected === opt ? "#eef0fd" : "white", fontSize: "13px", cursor: "pointer", color: "#374151", marginBottom: "10px", fontWeight: selected === opt ? 600 : 400 }}>
                          {opt}
                        </button>
                      ))}
                      {qIdx + 1 === QUIZ_QUESTIONS.length && selected === "Other - I will describe my goal" && (
                        <textarea
                          placeholder="Describe your financial goal or requirement..."
                          value={otherGoal}
                          onChange={e => setOtherGoal(e.target.value)}
                          style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #3344e6", fontSize: "13px", color: "#374151", marginBottom: "10px", minHeight: "80px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                        />
                      )}
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        {quizHistory.length > 0 && (
                          <button onClick={() => { const prev = quizHistory[quizHistory.length - 1]; setQuizHistory(h => h.slice(0, -1)); setQIdx(prev); setSelected(null); setOtherGoal(""); }}
                            style={{ padding: "12px 20px", borderRadius: "20px", background: "white", color: "#374151", border: "1.5px solid #e5e7eb", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                            Back
                          </button>
                        )}
                        <button onClick={() => { if (!selected) return; if (qIdx + 1 >= QUIZ_QUESTIONS.length) setQuizDone(true); else { setQuizHistory(h => [...h, qIdx]); setQIdx(qIdx + 1); setSelected(null); setOtherGoal(""); } }} disabled={!selected}
                          style={{ flex: 1, padding: "12px", borderRadius: "20px", background: selected ? "#3344e6" : "#e5e7eb", color: "white", border: "none", fontSize: "14px", fontWeight: 700, cursor: selected ? "pointer" : "not-allowed" }}>
                          {qIdx + 1 === QUIZ_QUESTIONS.length ? "See my results" : "Next"}
                        </button>
                      </div>
                    </div>
                  )}
                  {quizDone && (
                    <div>
                      <div style={{ textAlign: "center", background: "linear-gradient(135deg,#eef0fd,#f5f3ff)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎉</div>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e1b4b" }}>Your picks are ready!</div>
                      </div>
                      {articles.slice(0, 2).map((a, idx) => <ArticleCard key={a.id} item={a} delay={0.1 + idx * 0.18} />)}
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", margin: "12px 0 10px" }}>🎥 Recommended Videos</div>
                      {videos.slice(0, 2).map((v, idx) => <VideoCard key={v.id} item={v} delay={0.46 + idx * 0.18} />)}
                      <button onClick={() => { setQuizStarted(false); setQuizDone(false); setQIdx(0); setSelected(null); setQuizHistory([]); setOtherGoal(""); }}
                        style={{ width: "100%", padding: "10px", borderRadius: "20px", border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
                        Retake quiz
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

