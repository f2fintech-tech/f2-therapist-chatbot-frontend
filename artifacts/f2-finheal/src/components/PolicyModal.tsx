import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  BookOpen, 
  Database, 
  Search, 
  X, 
  ChevronRight, 
  ArrowUp, 
  Mail, 
  Phone, 
  MapPin, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "credit-consent" | "terms-of-use" | "privacy-policy" | "dpdp-notice" | "data-retention";
  showAcceptCheckbox?: boolean;
  agreed?: boolean;
  onAgreeChange?: (agreed: boolean) => void;
  allowedTabs?: ("credit-consent" | "terms-of-use" | "privacy-policy" | "dpdp-notice" | "data-retention")[];
}

const POLICY_TABS = [
  {
    id: "credit-consent",
    title: "Credit Consent",
    subtitle: "Bureau Authorization",
    desc: "How we fetch and process your credit history from CIBIL & Experian.",
    icon: ShieldCheck,
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50/50",
    textColor: "text-blue-700"
  },
  {
    id: "terms-of-use",
    title: "Terms of Use",
    subtitle: "User Agreement",
    desc: "The binding legal contract governing your access to the FinHeal platform.",
    icon: FileText,
    color: "from-purple-500 to-indigo-600",
    bgLight: "bg-purple-50/50",
    textColor: "text-purple-700"
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    subtitle: "Data Protection Rules",
    desc: "Our commitments regarding how we collect, store, and share your personal data.",
    icon: Lock,
    color: "from-pink-500 to-rose-600",
    bgLight: "bg-rose-50/50",
    textColor: "text-rose-700"
  },
  {
    id: "dpdp-notice",
    title: "DPDP Notice",
    subtitle: "Compliance & Rights",
    desc: "Your statutory rights and our duties under the Indian DPDP Act, 2023.",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50/50",
    textColor: "text-emerald-700"
  },
  {
    id: "data-retention",
    title: "Retention Policy",
    subtitle: "Storage & Deletion",
    desc: "Our protocols for purging or archiving credit reports after 45 days.",
    icon: Database,
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50/50",
    textColor: "text-amber-700"
  }
] as const;

export default function PolicyModal({
  isOpen,
  onClose,
  defaultTab = "credit-consent",
  showAcceptCheckbox = false,
  agreed = false,
  onAgreeChange,
  allowedTabs
}: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<typeof POLICY_TABS[number]["id"]>(defaultTab);
  const visibleTabs = allowedTabs 
    ? POLICY_TABS.filter(tab => allowedTabs.includes(tab.id))
    : POLICY_TABS;
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (allowedTabs && !allowedTabs.includes(defaultTab)) {
        setActiveTab(allowedTabs[0]);
      } else {
        setActiveTab(defaultTab);
      }
    }
  }, [isOpen, defaultTab, allowedTabs]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    setSearchQuery("");
    setReadProgress(0);
    
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    fetch(`/policies/${activeTab}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch policy content");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load document content. Please try again.");
        setLoading(false);
      });
  }, [activeTab, isOpen]);

  // Handle scroll tracking
  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const progress = scrollHeight - clientHeight > 0 
      ? (scrollTop / (scrollHeight - clientHeight)) * 100 
      : 0;
    setReadProgress(Math.min(progress, 100));
  };

  const handleScrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Basic search matching text parser
  const highlightQuery = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <span key={index} className="bg-yellow-100 text-yellow-950 font-bold px-0.5 rounded">{part}</span>
        : part
    );
  };

  // Parses markdown text to return a highly designed premium UI structure
  const renderInteractivePolicyContent = () => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    
    let bulletList: string[] = [];
    let bulletIndex = 0;

    const flushBullets = () => {
      if (bulletList.length > 0) {
        elements.push(
          <div key={`bullets-${bulletIndex++}`} className="grid grid-cols-1 gap-2.5 my-4">
            {bulletList.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-[12px] bg-slate-50 border border-slate-100 shadow-sm transition-all hover:bg-white hover:border-slate-200">
                <span className="h-4.5 w-4.5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0 mt-0.5 font-bold">
                  ✓
                </span>
                <p className="text-[12.5px] text-gray-650 leading-relaxed font-medium">
                  {parseFormatting(item)}
                </p>
              </div>
            ))}
          </div>
        );
        bulletList = [];
      }
    };

    const parseFormatting = (text: string) => {
      // Find and bold **text**
      const parts = text.split(/\*\*([^*]+)\*\*/g);
      return parts.map((part, idx) => {
        if (idx % 2 === 1) {
          return <strong key={idx} className="font-extrabold text-gray-900">{highlightQuery(part)}</strong>;
        }
        return highlightQuery(part);
      });
    };

    let inGrievanceCard = false;
    let grievanceLines: string[] = [];

    const flushGrievanceCard = () => {
      if (grievanceLines.length > 0) {
        const text = grievanceLines.join("\n");
        // Extract Grievance Officer details using regex or standard patterns
        const nameMatch = text.match(/(?:Grievance Officer:|Name:)\s*(.+)$/im);
        const emailMatch = text.match(/(?:Email:)\s*(.+)$/im);
        const phoneMatch = text.match(/(?:Phone:)\s*(.+)$/im);
        const addressMatch = text.match(/(?:Address:)\s*(.+)$/im);

        const name = nameMatch ? nameMatch[1].replace(/\*/g, "").trim() : "Grievance Redressal Officer";
        const email = emailMatch ? emailMatch[1].replace(/\*/g, "").trim() : "wecare@f2fintech.com";
        const phone = phoneMatch ? phoneMatch[1].replace(/\*/g, "").trim() : "+91 8810600135";
        const address = addressMatch ? addressMatch[1].replace(/\*/g, "").trim() : "12, Bajaj Complex, Prem Nagar, Bareilly, UP";

        elements.push(
          <div key="grievance-card" className="my-6 p-5 rounded-[18px] bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white border border-indigo-100 shadow-sm relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-black text-gray-800 tracking-tight">Official Redressal Officer</h4>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Statutory Grievance Desk</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12.5px]">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-gray-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>Name: {name}</span>
                </div>
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{email}</span>
                </a>
                <a href={`tel:${phone}`} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{phone}</span>
                </a>
              </div>
              <div className="flex items-start gap-2 bg-white/70 p-3 rounded-[12px] border border-gray-100 text-gray-600 text-[11.5px] leading-relaxed">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            </div>
          </div>
        );
        grievanceLines = [];
        inGrievanceCard = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith("### GRIEVANCE") || trimmed.startsWith("- GRIEVANCE")) {
        flushBullets();
        inGrievanceCard = true;
        return;
      }

      if (inGrievanceCard) {
        if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#") || trimmed.startsWith("===START") || trimmed.startsWith("===END")) {
          flushGrievanceCard();
        } else {
          if (trimmed) grievanceLines.push(trimmed);
          return;
        }
      }

      if (trimmed.startsWith("- ")) {
        bulletList.push(trimmed.substring(2));
      } else {
        flushBullets();

        if (!trimmed) return;

        if (trimmed.startsWith("# ")) {
          elements.push(
            <div key={idx} className="relative py-4 mb-5 overflow-hidden rounded-[16px] bg-gradient-to-r from-primary/5 via-primary/0 to-primary/0 border-l-4 border-primary px-4">
              <h2 className="text-[17px] font-black text-gray-850 tracking-tight uppercase">
                {highlightQuery(trimmed.substring(2))}
              </h2>
            </div>
          );
        } else if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
          const headerText = trimmed.startsWith("## ") ? trimmed.substring(3) : trimmed.substring(4);
          elements.push(
            <h3 key={idx} className="text-[13.5px] font-black text-gray-800 tracking-tight mt-6 mb-3 border-b border-gray-100 pb-2 uppercase flex items-center gap-1.5">
              <ChevronRight className="w-4 h-4 text-primary shrink-0" />
              <span>{highlightQuery(headerText)}</span>
            </h3>
          );
        } else if (trimmed.startsWith("#### ")) {
          elements.push(
            <h4 key={idx} className="text-[12px] font-bold text-gray-700 mt-4 mb-1.5 uppercase tracking-wider">
              {highlightQuery(trimmed.substring(5))}
            </h4>
          );
        } else if (trimmed.startsWith("Effective Date:") || trimmed.startsWith("**Effective Date:**")) {
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          const currentDateStr = `${day}/${month}/${year}`;
          const updatedLine = trimmed.replace(/\d{2}\/\d{2}\/\d{4}/, currentDateStr);

          elements.push(
            <div key={idx} className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{parseFormatting(updatedLine)}</span>
            </div>
          );
        } else if (trimmed.startsWith("WARNING:") || trimmed.startsWith("IMPORTANT:") || trimmed.startsWith("PLEASE READ")) {
          elements.push(
            <div key={idx} className="flex gap-2.5 bg-amber-50/80 border border-amber-100 p-4 rounded-[14px] text-[12px] text-amber-900 font-semibold mb-4 leading-normal">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>{parseFormatting(trimmed)}</span>
            </div>
          );
        } else {
          elements.push(
            <p key={idx} className="text-[12.5px] text-gray-600 leading-relaxed mb-3.5 text-justify">
              {parseFormatting(trimmed)}
            </p>
          );
        }
      }
    });

    flushBullets();
    flushGrievanceCard();

    return elements;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-white rounded-[24px] border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.25)] w-full max-w-[960px] overflow-hidden flex flex-col md:flex-row h-[85vh] relative z-10"
          >
            {/* Left Column: Vertical Navigation Tab Bar (Desktop) */}
            <div className="w-full md:w-[280px] bg-slate-50 border-r border-slate-150 shrink-0 flex flex-col justify-between p-4.5 max-md:hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2.5 py-1">
                  <ShieldCheck className="h-5.5 w-5.5 text-primary" />
                  <span className="font-extrabold text-[15px] text-gray-800 tracking-tight">FinHeal Policies</span>
                </div>
                
                <div className="space-y-1.5">
                  {visibleTabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-[14px] text-left transition-all duration-200 cursor-pointer border ${
                          isActive 
                            ? "bg-white border-slate-200 shadow-sm text-primary" 
                            : "bg-transparent border-transparent hover:bg-slate-100 hover:text-gray-800 text-gray-500"
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isActive 
                            ? `${tab.bgLight} ${tab.textColor}` 
                            : "bg-slate-100 text-gray-400 group-hover:bg-slate-200"
                        }`}>
                          <TabIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[12.5px] font-black block leading-snug ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                            {tab.title}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-semibold leading-normal truncate mt-0.5">
                            {tab.subtitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legal Note in Sidebar */}
              <div className="bg-slate-100 rounded-xl p-3.5 border border-slate-200 text-[10.5px] text-gray-500 leading-normal">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mb-1" />
                <span>All documents comply with the <strong>DPDP Act, 2023</strong> and Reserve Bank of India (RBI) fintech guidelines.</span>
              </div>
            </div>

            {/* Right Column: Reading Pane */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              
              {/* Reading Pane Header */}
              <div className="border-b border-gray-100 px-5.5 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Tab icon in mobile */}
                  <div className="md:hidden">
                    {(() => {
                      const activeInfo = visibleTabs.find(t => t.id === activeTab);
                      if (!activeInfo) return null;
                      const Icon = activeInfo.icon;
                      return (
                        <div className={`p-2 rounded-xl ${activeInfo.bgLight} ${activeInfo.textColor}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-gray-800 leading-none">
                      {visibleTabs.find(t => t.id === activeTab)?.title}
                    </h3>
                    <p className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 max-md:hidden">
                      {visibleTabs.find(t => t.id === activeTab)?.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search box (only if loading is done and no error) */}
                  {!loading && !error && (
                    <div className="relative shrink-0">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search document..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-2.5 py-1.5 border border-gray-250 rounded-[10px] text-[11px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-[140px] sm:w-[180px] bg-white"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full cursor-pointer transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Mobile tab bar slider */}
              <div className="md:hidden flex border-b border-gray-150 bg-slate-50 px-3 py-1.5 overflow-x-auto shrink-0 scrollbar-none gap-2">
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 text-[11px] font-extrabold rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-gray-500 border-gray-250"
                      }`}
                    >
                      {tab.title}
                    </button>
                  );
                })}
              </div>

              {/* Read progress bar indicator */}
              <div className="h-1 bg-slate-100 w-full shrink-0">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-150" 
                  style={{ width: `${readProgress}%` }}
                />
              </div>

              {/* Content area */}
              <div 
                ref={contentRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 py-5.5 min-h-0 bg-white relative"
              >
                <div ref={topRef} />
                
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-[12.5px] font-bold text-gray-400">Loading document content...</span>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-[14px] text-[12px] text-center my-8 max-w-[400px] mx-auto font-medium">
                    {error}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {renderInteractivePolicyContent()}
                  </div>
                )}

                {/* Back to top float button */}
                {readProgress > 20 && (
                  <button
                    onClick={handleScrollToTop}
                    className="fixed bottom-20 right-8 md:bottom-24 md:right-12 z-20 bg-primary/90 hover:bg-primary text-white p-2.5 rounded-full shadow-lg transition-all border border-primary/20 shrink-0 cursor-pointer animate-fade-in"
                  >
                    <ArrowUp className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-150 px-6 py-4.5 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                {showAcceptCheckbox && onAgreeChange ? (
                  <div className="flex items-start gap-2.5 text-left w-full sm:w-auto">
                    <input
                      type="checkbox"
                      id="policy-modal-agree"
                      checked={agreed}
                      onChange={(e) => onAgreeChange(e.target.checked)}
                      className="mt-1.5 h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                    />
                    <label htmlFor="policy-modal-agree" className="text-[11.5px] text-gray-500 font-bold select-none cursor-pointer leading-normal">
                      I have read, understood, and accept the active policy.
                    </label>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 font-semibold tracking-wide uppercase">
                    FinHeal Premium Legal Dashboard
                  </div>
                )}

                <div className="flex items-center gap-3.5 max-sm:w-full">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={showAcceptCheckbox && !agreed}
                    className={`font-extrabold px-6 py-2.5 rounded-[12px] text-[12.5px] transition-all max-sm:w-full text-center ${
                      showAcceptCheckbox && !agreed
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-primary hover:opacity-95 text-white cursor-pointer shadow-sm hover:shadow-md"
                    }`}
                  >
                    I Understand
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
