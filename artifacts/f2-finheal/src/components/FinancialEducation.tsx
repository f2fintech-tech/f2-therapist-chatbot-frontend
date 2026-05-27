import { useState, useEffect } from "react";

interface ContentItem {
  id: string;
  type: "video" | "article";
  title: string;
  source: string;
  duration?: string;
  readTime?: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  emoji: string;
  bgColor: string;
  youtubeId?: string;
  articleUrl?: string;
  views?: string;
  date?: string;
  description: string;
}

const CONTENT: ContentItem[] = [
  {
    id: "v1", type: "video", title: "How to build an emergency fund from scratch 🏦",
    source: "F2 Fintech", duration: "5:42", level: "Beginner", category: "Savings",
    emoji: "🛡️", bgColor: "#1e2db8", youtubeId: "dQw4w9WgXcQ",
    views: "12K", date: "2 weeks ago",
    description: "Learn the exact steps to build your financial safety net — even on a tight budget."
  },
  {
    id: "v2", type: "video", title: "Understanding CIBIL score and how to improve it 📊",
    source: "F2 Fintech", duration: "8:15", level: "Intermediate", category: "Credit",
    emoji: "⭐", bgColor: "#0f6e56", youtubeId: "dQw4w9WgXcQ",
    views: "8.4K", date: "1 month ago",
    description: "Your CIBIL score can make or break your loan application. Here is how to fix it fast."
  },
  {
    id: "v3", type: "video", title: "SIP vs lump sum — which is better for you? 💰",
    source: "F2 Fintech", duration: "11:30", level: "Advanced", category: "Investing",
    emoji: "📈", bgColor: "#633806", youtubeId: "dQw4w9WgXcQ",
    views: "21K", date: "3 weeks ago",
    description: "A simple breakdown of both strategies so you can make the right choice for your goals."
  },
  {
    id: "v4", type: "video", title: "How to get a personal loan with low income 💼",
    source: "F2 Fintech", duration: "7:20", level: "Beginner", category: "Loans",
    emoji: "🤝", bgColor: "#3b0025", youtubeId: "dQw4w9WgXcQ",
    views: "15K", date: "1 week ago",
    description: "Yes, you can get approved even with a modest income. Here is exactly how to do it."
  },
  {
    id: "a1", type: "article", title: "7 habits of people who never get into debt 🧠",
    source: "f2fintech.com", readTime: "5 min read", level: "Beginner", category: "Debt",
    emoji: "💡", bgColor: "#EEEDFE", articleUrl: "https://f2fintech.com",
    date: "3 days ago",
    description: "Small daily habits that keep your finances clean — no willpower required."
  },
  {
    id: "a2", type: "article", title: "What is EMI moratorium and should you use it? 📅",
    source: "f2fintech.com", readTime: "8 min read", level: "Intermediate", category: "Loans",
    emoji: "🔍", bgColor: "#FAEEDA", articleUrl: "https://f2fintech.com",
    date: "1 week ago",
    description: "The moratorium can be a lifesaver — but it comes with hidden costs. Know before you decide."
  },
  {
    id: "a3", type: "article", title: "How to pay off ₹5 lakh debt in 2 years 🎯",
    source: "f2fintech.com", readTime: "4 min read", level: "Intermediate", category: "Debt",
    emoji: "🚀", bgColor: "#EAF3DE", articleUrl: "https://f2fintech.com",
    date: "2 weeks ago",
    description: "A real plan used by F2 clients to become debt-free faster than they thought possible."
  },
  {
    id: "a4", type: "article", title: "Personal loan vs credit card — which costs less? 💳",
    source: "f2fintech.com", readTime: "6 min read", level: "Beginner", category: "Credit",
    emoji: "⚖️", bgColor: "#FAECE7", articleUrl: "https://f2fintech.com",
    date: "3 weeks ago",
    description: "We ran the numbers so you don't have to. The answer might surprise you."
  },
];

const QUIZ_QUESTIONS = [
  { q: "🤔 What is your biggest financial challenge right now?", opts: ["💳 Managing debt / EMIs", "💸 Not enough savings", "📉 Low credit score", "😰 Living pay-to-pay"] },
  { q: "📚 How would you describe your financial knowledge?", opts: ["🌱 Complete beginner", "📖 I know the basics", "💪 Fairly confident", "🎓 Very knowledgeable"] },
  { q: "🎯 What is your primary financial goal?", opts: ["🔓 Clear my debt", "🏦 Build an emergency fund", "⭐ Improve credit score", "📈 Start investing"] },
  { q: "⏰ How much time can you spend learning each week?", opts: ["⚡ Less than 15 min", "🕐 15–30 minutes", "🕑 30–60 minutes", "🕓 More than an hour"] },
];

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: "#EAF3DE", color: "#27500A" },
  Intermediate: { bg: "#FAEEDA", color: "#633806" },
  Advanced: { bg: "#EEEDFE", color: "#3C3489" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  Savings: "🏦", Credit: "⭐", Investing: "📈", Loans: "💼", Debt: "💡", All: "✨",
};

const STORAGE_KEY_VIDEOS = "finheal_edu_watched";
const STORAGE_KEY_ARTICLES = "finheal_edu_read";

interface Props {
  userId?: string;
  onToggleSidebar?: () => void;
}

export default function FinancialEducation({ userId, onToggleSidebar }: Props) {
  const [tab, setTab] = useState<"all" | "videos" | "articles" | "quiz">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [watched, setWatched] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState<"videos" | "articles" | null>("videos");
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    const w = localStorage.getItem(`${STORAGE_KEY_VIDEOS}:${userId || "guest"}`);
    const r = localStorage.getItem(`${STORAGE_KEY_ARTICLES}:${userId || "guest"}`);
    if (w) setWatched(JSON.parse(w));
    if (r) setRead(JSON.parse(r));
  }, [userId]);

  const markWatched = (id: string) => {
    const updated = watched.includes(id) ? watched : [...watched, id];
    setWatched(updated);
    localStorage.setItem(`${STORAGE_KEY_VIDEOS}:${userId || "guest"}`, JSON.stringify(updated));
  };

  const markRead = (id: string) => {
    const updated = read.includes(id) ? read : [...read, id];
    setRead(updated);
    localStorage.setItem(`${STORAGE_KEY_ARTICLES}:${userId || "guest"}`, JSON.stringify(updated));
  };

  const videos = CONTENT.filter(c => c.type === "video");
  const articles = CONTENT.filter(c => c.type === "article");
  const categories = ["All", ...Array.from(new Set(CONTENT.map(c => c.category)))];

  const filteredVideos = categoryFilter === "All" ? videos : videos.filter(v => v.category === categoryFilter);
  const filteredArticles = categoryFilter === "All" ? articles : articles.filter(a => a.category === categoryFilter);

  const watchedItems = CONTENT.filter(c => c.type === "video" && watched.includes(c.id));
  const readItems = CONTENT.filter(c => c.type === "article" && read.includes(c.id));

  const nextQ = () => {
    if (!selected) return;
    if (qIdx + 1 >= QUIZ_QUESTIONS.length) {
      setQuizDone(true);
    } else {
      setQIdx(qIdx + 1);
      setSelected(null);
    }
  };

  const levelBadge = (level: string) => {
    const s = LEVEL_STYLE[level] || { bg: "#f3f4f6", color: "#374151" };
    return (
      <span style={{ background: s.bg, color: s.color, borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>
        {level}
      </span>
    );
  };

  const VideoCard = ({ item }: { item: ContentItem }) => (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", overflow: "hidden", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "transform 0.2s", cursor: "pointer" }}
      onMouseOver={e => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}
      onClick={() => { markWatched(item.id); setPlayingVideo(item.id); }}>
      {playingVideo === item.id && item.youtubeId ? (
        <div style={{ width: "100%", aspectRatio: "16/9" }}>
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
            title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen style={{ border: "none" }} />
        </div>
      ) : (
        <div style={{ background: item.bgColor, height: "130px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ fontSize: "40px", marginRight: "12px" }}>{item.emoji}</div>
          <div style={{ width: "52px", height: "52px", background: "rgba(255,255,255,0.25)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid white", marginLeft: "4px" }} />
          </div>
          <span style={{ position: "absolute", bottom: "8px", right: "10px", background: "rgba(0,0,0,0.65)", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "4px" }}>{item.duration}</span>
          {watched.includes(item.id) && (
            <span style={{ position: "absolute", top: "8px", left: "10px", background: "#10b981", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "20px" }}>✅ Watched</span>
          )}
        </div>
      )}
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
          <span style={{ background: "#E6F1FB", color: "#0C447C", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>🎬 Video</span>
          {levelBadge(item.level)}
          <span style={{ background: "#f3f4f6", color: "#374151", borderRadius: "20px", padding: "2px 10px", fontSize: "11px" }}>{CATEGORY_EMOJI[item.category]} {item.category}</span>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1b4b", marginBottom: "4px", lineHeight: 1.4 }}>{item.title}</div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", lineHeight: 1.5 }}>{item.description}</div>
        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.source} · {item.views} views · {item.date}</div>
      </div>
    </div>
  );

  const ArticleCard = ({ item }: { item: ContentItem }) => (
    <a href={item.articleUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}
      onClick={() => markRead(item.id)}>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "transform 0.2s", cursor: "pointer", display: "flex", gap: "14px", alignItems: "flex-start" }}
        onMouseOver={e => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}>
        <div style={{ width: "52px", height: "52px", background: item.bgColor, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
          {item.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ background: "#EEEDFE", color: "#3C3489", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>📄 Article</span>
            {levelBadge(item.level)}
            {read.includes(item.id) && <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: "20px", padding: "2px 8px", fontSize: "11px" }}>✅ Read</span>}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1b4b", marginBottom: "4px", lineHeight: 1.4 }}>{item.title}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>{item.description}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.source} · {item.readTime} · {item.date}</div>
        </div>
      </div>
    </a>
  );

  return (
    <main style={{ flex: 1, overflowY: "auto", background: "#f9fafb", borderRadius: "20px", border: "1px solid #e5e7eb" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #f3f4f6", background: "white", borderRadius: "20px 20px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e1b4b" }}>📚 Financial Education</div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Learn finance your way — videos, articles, and personalised picks</div>
          </div>
          {onToggleSidebar && (
            <button onClick={onToggleSidebar} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>☰</button>
          )}
        </div>

        {/* Progress tracker */}
        <div style={{ display: "flex", gap: "10px", margin: "16px 0" }}>
          <div onClick={() => setHistoryOpen(historyOpen === "videos" ? null : "videos")}
            style={{ flex: 1, background: historyOpen === "videos" ? "#EFF6FF" : "#f9fafb", border: `1.5px solid ${historyOpen === "videos" ? "#3344e6" : "#e5e7eb"}`, borderRadius: "14px", padding: "12px", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px" }}>🎬</span>
              <span style={{ fontSize: "11px", color: "#6b7280" }}>Videos watched</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#1e1b4b" }}>{watched.length}</div>
            <div style={{ height: "3px", background: "#e5e7eb", borderRadius: "999px", marginTop: "6px" }}>
              <div style={{ height: "100%", width: `${Math.min((watched.length / 5) * 100, 100)}%`, background: "#3344e6", borderRadius: "999px", transition: "width 0.4s" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px" }}>{watched.length} of 5 goal · tap for history</div>
          </div>

          <div onClick={() => setHistoryOpen(historyOpen === "articles" ? null : "articles")}
            style={{ flex: 1, background: historyOpen === "articles" ? "#F5F3FF" : "#f9fafb", border: `1.5px solid ${historyOpen === "articles" ? "#7c3aed" : "#e5e7eb"}`, borderRadius: "14px", padding: "12px", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px" }}>📄</span>
              <span style={{ fontSize: "11px", color: "#6b7280" }}>Articles read</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#1e1b4b" }}>{read.length}</div>
            <div style={{ height: "3px", background: "#e5e7eb", borderRadius: "999px", marginTop: "6px" }}>
              <div style={{ height: "100%", width: `${Math.min((read.length / 5) * 100, 100)}%`, background: "#7c3aed", borderRadius: "999px", transition: "width 0.4s" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px" }}>{read.length} of 5 goal · tap for history</div>
          </div>
        </div>

        {/* History dropdown */}
        {historyOpen && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "14px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b" }}>
                {historyOpen === "videos" ? "🎬 Videos you watched" : "📄 Articles you read"}
              </span>
              <button onClick={() => setHistoryOpen(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "12px" }}>✕ Close</button>
            </div>
            {(historyOpen === "videos" ? watchedItems : readItems).length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                {historyOpen === "videos" ? "🎬 No videos watched yet" : "📄 No articles read yet"}
              </div>
            ) : (
              (historyOpen === "videos" ? watchedItems : readItems).map(item => (
                <div key={item.id} style={{ display: "flex", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #f9fafb", alignItems: "center" }}>
                  <div style={{ width: "44px", height: "36px", background: item.bgColor, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{item.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.type === "video" ? `${item.duration}` : item.readTime}</div>
                  </div>
                  <button onClick={() => { setTab(item.type === "video" ? "videos" : "articles"); setHistoryOpen(null); }}
                    style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer", color: "#374151", flexShrink: 0 }}>
                    {item.type === "video" ? "▶ Rewatch" : "↗ Re-read"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", paddingBottom: "0" }}>
          {(["all", "videos", "articles", "quiz"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 16px", borderRadius: "12px 12px 0 0", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: tab === t ? "#3344e6" : "transparent", color: tab === t ? "white" : "#6b7280", transition: "all 0.15s" }}>
              {t === "all" ? "✨ All" : t === "videos" ? "🎬 Videos" : t === "articles" ? "📄 Articles" : "🧠 Quick quiz"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Category filter */}
        {(tab === "all" || tab === "videos" || tab === "articles") && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                style={{ padding: "5px 14px", borderRadius: "20px", border: "1px solid", fontSize: "12px", cursor: "pointer", transition: "all 0.15s", borderColor: categoryFilter === c ? "#3344e6" : "#e5e7eb", background: categoryFilter === c ? "#3344e6" : "white", color: categoryFilter === c ? "white" : "#374151" }}>
                {CATEGORY_EMOJI[c] || "📌"} {c}
              </button>
            ))}
          </div>
        )}

        {/* ALL TAB */}
        {tab === "all" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #eef0fd, #f5f3ff)", border: "1px solid #d4d8fa", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e1b4b", marginBottom: "4px" }}>🎯 Get personalised content</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Take our 2-min quiz and we'll recommend the perfect videos and articles for your financial situation.</div>
              <button onClick={() => setTab("quiz")} style={{ padding: "8px 20px", borderRadius: "20px", background: "#3344e6", color: "white", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                🚀 Take quiz →
              </button>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "10px" }}>🔥 Trending videos</div>
            {filteredVideos.slice(0, 2).map(v => <VideoCard key={v.id} item={v} />)}
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", margin: "16px 0 10px" }}>📰 Latest articles</div>
            {filteredArticles.slice(0, 2).map(a => <ArticleCard key={a.id} item={a} />)}
            <button onClick={() => setTab("videos")} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px dashed #d4d8fa", background: "transparent", color: "#3344e6", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
              🎬 See all videos →
            </button>
          </>
        )}

        {/* VIDEOS TAB */}
        {tab === "videos" && filteredVideos.map(v => <VideoCard key={v.id} item={v} />)}

        {/* ARTICLES TAB */}
        {tab === "articles" && filteredArticles.map(a => <ArticleCard key={a.id} item={a} />)}

        {/* QUIZ TAB */}
        {tab === "quiz" && (
          <>
            {!quizStarted && !quizDone && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🧠</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#1e1b4b", marginBottom: "8px" }}>2-minute financial quiz</div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", maxWidth: "320px", margin: "0 auto 20px" }}>Answer 4 quick questions and get videos & articles matched to your exact financial situation.</div>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", margin: "16px 0" }}>
                  {["⚡ 2 minutes", "🎯 Personalised", "🆓 Free"].map(f => (
                    <div key={f} style={{ background: "#f3f4f6", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", color: "#374151" }}>{f}</div>
                  ))}
                </div>
                <button onClick={() => setQuizStarted(true)} style={{ padding: "12px 32px", borderRadius: "20px", background: "#3344e6", color: "white", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  🚀 Start quiz
                </button>
              </div>
            )}

            {quizStarted && !quizDone && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>Question {qIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                  <span style={{ fontSize: "12px", color: "#3344e6", fontWeight: 600 }}>{Math.round(((qIdx + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                </div>
                <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "999px", marginBottom: "20px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((qIdx + 1) / QUIZ_QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg, #3344e6, #7c3aed)", borderRadius: "999px", transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e1b4b", marginBottom: "16px", lineHeight: 1.4 }}>{QUIZ_QUESTIONS[qIdx].q}</div>
                {QUIZ_QUESTIONS[qIdx].opts.map(opt => (
                  <button key={opt} onClick={() => setSelected(opt)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: "12px", border: `2px solid ${selected === opt ? "#3344e6" : "#e5e7eb"}`, background: selected === opt ? "#eef0fd" : "white", fontSize: "13px", cursor: "pointer", color: selected === opt ? "#1e1b4b" : "#374151", marginBottom: "10px", fontWeight: selected === opt ? 600 : 400, transition: "all 0.15s" }}>
                    {opt}
                  </button>
                ))}
                <button onClick={nextQ} disabled={!selected}
                  style={{ width: "100%", padding: "12px", borderRadius: "20px", background: selected ? "#3344e6" : "#e5e7eb", color: "white", border: "none", fontSize: "14px", fontWeight: 700, cursor: selected ? "pointer" : "not-allowed", marginTop: "4px" }}>
                  {qIdx + 1 === QUIZ_QUESTIONS.length ? "🎯 See my results" : "Next →"}
                </button>
              </div>
            )}

            {quizDone && (
              <div>
                <div style={{ textAlign: "center", background: "linear-gradient(135deg, #eef0fd, #f5f3ff)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎉</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e1b4b", marginBottom: "4px" }}>Your picks are ready!</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>Based on your answers, here is what we recommend for you:</div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "10px" }}>⭐ Recommended for you</div>
                {videos.slice(0, 2).map(v => <VideoCard key={v.id} item={v} />)}
                {articles.slice(0, 1).map(a => <ArticleCard key={a.id} item={a} />)}
                <button onClick={() => { setQuizStarted(false); setQuizDone(false); setQIdx(0); setSelected(null); }}
                  style={{ width: "100%", padding: "12px", borderRadius: "20px", border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
                  🔄 Retake quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
