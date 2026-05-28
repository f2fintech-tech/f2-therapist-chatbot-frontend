import { useState, useEffect } from "react";

interface ContentItem {
  id: string;
  type: "video" | "article";
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  emoji: string;
  bgColor: string;
  articleUrl?: string;
  date?: string;
  description: string;
  source: string;
  readTime?: string;
}

const CONTENT: ContentItem[] = [
  {
    id: "a1", type: "article", title: "How to Get a Business Loan in India",
    source: "f2fintech.com", readTime: "6 min read", level: "Intermediate", category: "Loans",
    emoji: "💼", bgColor: "#E6F1FB", articleUrl: "https://f2fintech.com/blogs/blogs-businessloan",
    date: "Recent",
    description: "A complete guide to getting a business loan in India - eligibility, documents, and tips to get approved faster."
  },
  {
    id: "a2", type: "article", title: "GST 2.0 and Its Impact on Your Loans",
    source: "f2fintech.com", readTime: "5 min read", level: "Intermediate", category: "Loans",
    emoji: "📋", bgColor: "#EAF3DE", articleUrl: "https://f2fintech.com/blogs/loans-gst2.0",
    date: "Recent",
    description: "GST 2.0 changes are here - find out how they affect your loan applications and what you need to do now."
  },
  {
    id: "a3", type: "article", title: "What is an Overdraft (OD) Facility?",
    source: "f2fintech.com", readTime: "4 min read", level: "Beginner", category: "Credit",
    emoji: "🏦", bgColor: "#FAEEDA", articleUrl: "https://f2fintech.com/blogs/blog-OD",
    date: "Recent",
    description: "An overdraft facility gives you instant access to funds when you need them - without a separate loan application."
  },
];

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: "#EAF3DE", color: "#27500A" },
  Intermediate: { bg: "#FAEEDA", color: "#633806" },
  Advanced: { bg: "#EEEDFE", color: "#3C3489" },
};

const QUIZ_QUESTIONS = [
  { q: "What is your biggest financial challenge right now?", opts: ["Managing debt / EMIs", "Not enough savings", "Low credit score", "Living pay-to-pay"] },
  { q: "How would you describe your financial knowledge?", opts: ["Complete beginner", "I know the basics", "Fairly confident", "Very knowledgeable"] },
  { q: "What is your primary financial goal?", opts: ["Clear my debt", "Build an emergency fund", "Improve credit score", "Start investing"] },
  { q: "How much time can you spend learning each week?", opts: ["Less than 15 min", "15-30 minutes", "30-60 minutes", "More than an hour"] },
];

const STORAGE_KEY_ARTICLES = "finheal_edu_read";

interface Props {
  userId?: string;
  onToggleSidebar?: () => void;
}

export default function FinancialEducation({ userId, onToggleSidebar }: Props) {
  const [tab, setTab] = useState<"all" | "articles" | "videos" | "quiz">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [read, setRead] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const key = userId || "guest";

  useEffect(() => {
    const r = localStorage.getItem(`${STORAGE_KEY_ARTICLES}:${key}`);
    if (r) setRead(JSON.parse(r));
  }, [key]);

  const markRead = (id: string) => {
    if (read.includes(id)) return;
    const updated = [...read, id];
    setRead(updated);
    localStorage.setItem(`${STORAGE_KEY_ARTICLES}:${key}`, JSON.stringify(updated));
  };

  const articles = CONTENT.filter(c => c.type === "article");
  const categories = ["All", "Loans", "Credit", "Savings", "Debt", "Tax", "Business"];
  const filteredArticles = categoryFilter === "All" ? articles : articles.filter(a => a.category === categoryFilter);
  const readItems = CONTENT.filter(c => c.type === "article" && read.includes(c.id));
  const progressPct = articles.length > 0 ? Math.round((read.length / articles.length) * 100) : 0;

  const levelBadge = (level: string) => {
    const s = LEVEL_STYLE[level] || { bg: "#f3f4f6", color: "#374151" };
    return <span style={{ background: s.bg, color: s.color, borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>{level}</span>;
  };

  const ArticleCard = ({ item }: { item: ContentItem }) => (
    <a href={item.articleUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={() => markRead(item.id)}>
      <div style={{ background: "white", border: `1.5px solid ${read.includes(item.id) ? "#10b981" : "#e5e7eb"}`, borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "transform 0.2s", cursor: "pointer", display: "flex", gap: "14px", alignItems: "flex-start" }}
        onMouseOver={e => (e.currentTarget.style.transform = "translateY(-2px)")} onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}>
        <div style={{ width: "52px", height: "52px", background: item.bgColor, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#1e1b4b", flexShrink: 0 }}>{item.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ background: "#EEEDFE", color: "#3C3489", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 500 }}>Article</span>
            {levelBadge(item.level)}
            {read.includes(item.id) && <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: "20px", padding: "2px 8px", fontSize: "11px" }}>Read</span>}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1b4b", marginBottom: "4px", lineHeight: 1.4 }}>{item.title}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>{item.description}</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.source} · {item.readTime} · {item.date}</div>
            <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: "20px" }}>{item.readTime}</span>
          </div>
        </div>
      </div>
    </a>
  );

  return (
    <main style={{ flex: 1, overflowY: "auto", background: "#f9fafb", borderRadius: "20px", border: "1px solid #e5e7eb" }}>
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #f3f4f6", background: "white", borderRadius: "20px 20px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e1b4b" }}>📚 Financial Education</div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>✨ Your journey to smarter money decisions starts here</div>
          </div>
          {onToggleSidebar && <button onClick={onToggleSidebar} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>☰</button>}
        </div>

        <div style={{ margin: "14px 0 10px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e1b4b" }}>📊 Your learning progress</span>
            <span style={{ fontSize: "12px", fontWeight: 800, color: progressPct === 100 ? "#10b981" : "#3344e6" }}>{progressPct}%</span>
          </div>
          <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: progressPct === 100 ? "#10b981" : "linear-gradient(90deg,#3344e6,#7c3aed)", borderRadius: "999px", transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
            <span style={{ fontSize: "10px", color: "#9ca3af" }}>{read.length} of {articles.length} articles read</span>
            <span style={{ fontSize: "10px", color: progressPct === 100 ? "#10b981" : "#9ca3af" }}>{progressPct === 100 ? "All done!" : `${articles.length - read.length} remaining`}</span>
          </div>
        </div>

        
        <div onClick={() => setHistoryOpen(!historyOpen)}
          style={{ background: historyOpen ? "linear-gradient(135deg,#f5f3ff,#ede9fe)" : "linear-gradient(135deg,#f9fafb,#f3f4f6)", border: `2px solid ${historyOpen ? "#7c3aed" : "#e5e7eb"}`, borderRadius: "16px", padding: "14px 18px", cursor: "pointer", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: historyOpen ? "0 4px 16px rgba(124,58,237,0.12)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>📄 Articles read</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{read.length} <span style={{fontSize:"14px",color:"#9ca3af",fontWeight:400}}>/ {articles.length}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#9ca3af" }}>tap for history</div>
            <div style={{ height: "3px", width: "60px", background: "#e5e7eb", borderRadius: "999px", marginTop: "4px" }}>
              <div style={{ height: "100%", width: `${Math.min((read.length / articles.length) * 100, 100)}%`, background: "#7c3aed", borderRadius: "999px" }} />
            </div>
          </div>
        </div>

        {historyOpen && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "12px", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e1b4b" }}>Articles you read</span>
              <button onClick={() => setHistoryOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "12px" }}>✕ Close</button>
            </div>
            {readItems.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>Nothing here yet - start reading!</div>
            ) : readItems.map(item => (
              <div key={item.id} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderBottom: "1px solid #f9fafb", alignItems: "center" }}>
                <div style={{ width: "36px", height: "36px", background: item.bgColor, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#1e1b4b", flexShrink: 0 }}>{item.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.readTime}</div>
                </div>
                <span style={{ fontSize: "11px", color: "#374151", flexShrink: 0 }}>↗ Re-read</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "4px" }}>
          {(["all", "articles", "videos", "quiz"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 16px", borderRadius: "12px 12px 0 0", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: tab === t ? "#3344e6" : "transparent", color: tab === t ? "white" : "#6b7280" }}>
              {t === "all" ? "✨ All" : t === "articles" ? "📄 Articles" : t === "videos" ? "🎥 Videos" : "🧠 Quiz"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {(tab === "all" || tab === "articles" || tab === "videos") && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                style={{ padding: "5px 14px", borderRadius: "20px", border: "1px solid", fontSize: "12px", cursor: "pointer", borderColor: categoryFilter === c ? "#3344e6" : "#e5e7eb", background: categoryFilter === c ? "#3344e6" : "white", color: categoryFilter === c ? "white" : "#374151" }}>
                {c === 'All' ? '✨ All' : c === 'Loans' ? '💼 Loans' : c === 'Credit' ? '💳 Credit' : c === 'Savings' ? '🏦 Savings' : c === 'Debt' ? '📉 Debt' : c === 'Tax' ? '🧾 Tax' : c === 'Business' ? '🏢 Business' : c}
              </button>
            ))}
          </div>
        )}

        {tab === "all" && (
          <>
            <div style={{ background: "linear-gradient(135deg,#eef0fd,#f5f3ff)", border: "1px solid #d4d8fa", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e1b4b", marginBottom: "4px" }}>🎯 Get personalised content</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Take our 2-min quiz and get content matched to your financial situation.</div>
              <button onClick={() => setTab("quiz")} style={{ padding: "8px 20px", borderRadius: "20px", background: "#3344e6", color: "white", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>🚀 Take quiz</button>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", margin: "0 0 10px" }}>📰 Latest articles</div>
            {filteredArticles.map(a => <ArticleCard key={a.id} item={a} />)}
          </>
        )}

        {tab === "articles" && filteredArticles.map(a => <ArticleCard key={a.id} item={a} />)}

        {tab === "videos" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎥</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e1b4b", marginBottom: "8px" }}>Videos coming soon!</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", maxWidth: "280px", margin: "0 auto 20px" }}>We are working on bringing you great financial videos from F2 Fintech YouTube channel.</div>
            <a href="https://www.youtube.com/@f2fintech" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", padding: "10px 24px", borderRadius: "20px", background: "#ff0000", color: "white", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              📺 Visit F2 Fintech on YouTube
            </a>
          </div>
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
                  <div style={{ height: "100%", width: `${((qIdx + 1) / QUIZ_QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg,#3344e6,#7c3aed)", borderRadius: "999px", transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e1b4b", marginBottom: "16px" }}>{QUIZ_QUESTIONS[qIdx].q}</div>
                {QUIZ_QUESTIONS[qIdx].opts.map(opt => (
                  <button key={opt} onClick={() => setSelected(opt)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: "12px", border: `2px solid ${selected === opt ? "#3344e6" : "#e5e7eb"}`, background: selected === opt ? "#eef0fd" : "white", fontSize: "13px", cursor: "pointer", color: "#374151", marginBottom: "10px", fontWeight: selected === opt ? 600 : 400 }}>
                    {opt}
                  </button>
                ))}
                <button onClick={() => { if (!selected) return; if (qIdx + 1 >= QUIZ_QUESTIONS.length) setQuizDone(true); else { setQIdx(qIdx + 1); setSelected(null); } }} disabled={!selected}
                  style={{ width: "100%", padding: "12px", borderRadius: "20px", background: selected ? "#3344e6" : "#e5e7eb", color: "white", border: "none", fontSize: "14px", fontWeight: 700, cursor: selected ? "pointer" : "not-allowed" }}>
                  {qIdx + 1 === QUIZ_QUESTIONS.length ? "See my results" : "Next"}
                </button>
              </div>
            )}
            {quizDone && (
              <div>
                <div style={{ textAlign: "center", background: "linear-gradient(135deg,#eef0fd,#f5f3ff)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>Done!</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e1b4b", marginBottom: "4px" }}>🎉 Your picks are ready!</div>
                </div>
                {articles.slice(0, 2).map(a => <ArticleCard key={a.id} item={a} />)}
                <button onClick={() => { setQuizStarted(false); setQuizDone(false); setQIdx(0); setSelected(null); }}
                  style={{ width: "100%", padding: "10px", borderRadius: "20px", border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
                  Retake quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
