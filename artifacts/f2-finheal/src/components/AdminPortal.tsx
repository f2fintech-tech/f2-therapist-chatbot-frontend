import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAdminStats, type BackendStats } from "@/lib/backendAuth";
import { advisorsData, type Advisor } from "@/components/AdvisorPanel";
import { CONTENT, type ContentItem } from "@/components/FinancialEducation";
import { testCards, type TestCard } from "@/components/FinancialHealthTestCatalog";
import { type LenderProduct } from "./LoanCalculatorView";
interface AdminPortalProps {
  userId: string;
  userEmail: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
}

interface Appointment {
  advisorId: string;
  advisorName: string;
  date: string;
  time: string;
  notes?: string;
  clientEmail?: string;
  bookedAt: string;
  completed?: boolean;
  rating?: number;
  feedback?: string;
  meetUrl?: string;
  joined?: boolean;
}

export default function AdminPortal({ userId, userEmail, onToggleSidebar, onToggleInsights }: AdminPortalProps) {
  const isAdmin = userEmail === "admin@finheal.com" || userEmail === "admin@f2finheal.com";
  


  // Active Admin Tabs: stats, experts, education, tests, appointments, lenders
  const [activeTab, setActiveTab] = useState<"stats" | "experts" | "education" | "tests" | "appointments" | "lenders">("stats");

  // State Management
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [educationContent, setEducationContent] = useState<ContentItem[]>([]);
  const [testCatalog, setTestCatalog] = useState<TestCard[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  // Lenders Catalog States
  const [lenderList, setLenderList] = useState<LenderProduct[]>([]);
  const [lendersLoading, setLendersLoading] = useState(false);
  const [lenderModalOpen, setLenderModalOpen] = useState(false);
  const [editingLender, setEditingLender] = useState<LenderProduct | null>(null);
  const [lenderForm, setLenderForm] = useState({
    id: "",
    name: "",
    lenderType: "NBFC",
    productType: "Home Loan",
    category: "home",
    minRate: 8.5,
    maxRate: 12.0,
    minTenureYears: 5,
    maxTenureYears: 20,
    minMonthlyIncome: 30000,
    minCibil: 700,
    maxFoirPct: 60,
    minAmount: 100000,
    maxAmount: 5000000,
    disbursalTime: "2-5 days",
    pros: "",
    cons: "",
    docsRequired: "",
    processingFee: "As per offer at login",
    emiPerLakhMin: "",
  });
  
  // Loading and Error States
  const [statsLoading, setStatsLoading] = useState(false);

  // Edit / Add Modal States
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Advisor | null>(null);
  
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestCard | null>(null);

  // Expert form state
  const [expertForm, setExpertForm] = useState({
    name: "",
    designation: "",
    avatarUrl: "",
    availability: "available" as "available" | "unavailable",
    expertise: "",
    strength: "",
    bio: "",
    category: "wealth" as any,
    rating: 4.8,
    reviewsCount: 45,
    nextSlot: "Tomorrow, 10:00 AM",
    fee: 899
  });

  // Education form state
  const [eduForm, setEduForm] = useState({
    type: "article" as "article" | "video",
    title: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    category: "Loans",
    emoji: "📚",
    bgColor: "#E6F1FB",
    youtubeId: "",
    articleUrl: "",
    description: "",
    source: "f2fintech.com",
    readTime: "5 min read",
    duration: "5 min"
  });

  // Test form state
  const [testForm, setTestForm] = useState({
    title: "",
    description: "",
    duration: "5 min",
    focus: "",
    result: "",
    accent: "from-[#3344e6] to-[#7c8cff]"
  });

  // Next Slot state for specific Advisor Workspace
  const [expertNextSlot, setExpertNextSlot] = useState("");

  // Dynamically map logged-in email prefix to advisor ID based on name slug
  const getExpertIdFromEmail = (email: string) => {
    if (!email) return null;
    const prefix = email.split("@")[0].toLowerCase().replace(".", "-");
    const found = advisors.find(a => {
      const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return slug.startsWith(prefix) || slug.includes(prefix) || prefix.includes(slug);
    });
    return found ? found.id : null;
  };
  
  const currentExpertId = getExpertIdFromEmail(userEmail);

  // Load backend stats
  useEffect(() => {
    if (isAdmin) {
      setStatsLoading(true);
      fetchAdminStats()
        .then(stats => setBackendStats(stats))
        .catch(err => console.error("Error loading stats", err))
        .finally(() => setStatsLoading(false));
    }
  }, [isAdmin]);

  // Fetch Lenders Catalog from backend JSON database
  const fetchLenders = async () => {
    try {
      setLendersLoading(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/lenders`);
      if (res.ok) {
        const data = await res.json();
        setLenderList(data);
      }
    } catch (err) {
      console.error("Error loading lenders list:", err);
    } finally {
      setLendersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLenders();
    }
  }, [isAdmin]);

  // Lenders CRUD Handlers
  const handleOpenAddLender = () => {
    setEditingLender(null);
    setLenderForm({
      id: "",
      name: "",
      lenderType: "NBFC",
      productType: "Home Loan",
      category: "home",
      minRate: 8.5,
      maxRate: 12.0,
      minTenureYears: 5,
      maxTenureYears: 20,
      minMonthlyIncome: 30000,
      minCibil: 700,
      maxFoirPct: 60,
      minAmount: 100000,
      maxAmount: 5000000,
      disbursalTime: "2-5 days",
      pros: "Fast approvals, Digital KYC",
      cons: "Documentation heavy",
      docsRequired: "PAN & Aadhaar, 3 months salary slips, 6 months bank statements",
      processingFee: "Up to 2% + GST",
      emiPerLakhMin: "",
    });
    setLenderModalOpen(true);
  };

  const handleOpenEditLender = (l: LenderProduct) => {
    setEditingLender(l);
    setLenderForm({
      id: l.id,
      name: l.name,
      lenderType: l.lenderType,
      productType: l.productType,
      category: l.category,
      minRate: l.minRate,
      maxRate: l.maxRate,
      minTenureYears: l.minTenureYears,
      maxTenureYears: l.maxTenureYears,
      minMonthlyIncome: l.minMonthlyIncome,
      minCibil: l.minCibil,
      maxFoirPct: l.maxFoirPct,
      minAmount: l.minAmount,
      maxAmount: l.maxAmount,
      disbursalTime: l.disbursalTime,
      pros: l.pros.join(", "),
      cons: l.cons.join(", "),
      docsRequired: l.docsRequired.join(", "),
      processingFee: l.processingFee || "",
      emiPerLakhMin: l.emiPerLakhMin || "",
    });
    setLenderModalOpen(true);
  };

  const handleSaveLender = async () => {
    if (!lenderForm.name?.trim() || !lenderForm.productType?.trim()) {
      alert("Lender Name and Product Type are required!");
      return;
    }

    const generatedId = lenderForm.id?.trim() || `${lenderForm.category}-${lenderForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`;
    
    const item: LenderProduct = {
      id: generatedId,
      name: lenderForm.name.trim(),
      lenderType: lenderForm.lenderType,
      productType: lenderForm.productType.trim(),
      category: lenderForm.category,
      minRate: Number(lenderForm.minRate) || 8.5,
      maxRate: Number(lenderForm.maxRate) || Number(lenderForm.minRate) || 8.5,
      minTenureYears: Number(lenderForm.minTenureYears) || 1,
      maxTenureYears: Number(lenderForm.maxTenureYears) || 30,
      minMonthlyIncome: Number(lenderForm.minMonthlyIncome) || 25000,
      minCibil: Number(lenderForm.minCibil) || 700,
      maxFoirPct: Number(lenderForm.maxFoirPct) || 60,
      minAmount: Number(lenderForm.minAmount) || 100000,
      maxAmount: Number(lenderForm.maxAmount) || 10000000,
      disbursalTime: lenderForm.disbursalTime?.trim() || "2-5 days",
      pros: (lenderForm.pros || "").split(",").map(p => p.trim()).filter(Boolean),
      cons: (lenderForm.cons || "").split(",").map(c => c.trim()).filter(Boolean),
      docsRequired: (lenderForm.docsRequired || "").split(",").map(d => d.trim()).filter(Boolean),
      processingFee: lenderForm.processingFee?.trim() || "As per offer at login",
      emiPerLakhMin: lenderForm.emiPerLakhMin?.trim() || "",
    };

    let updatedList: LenderProduct[];
    if (editingLender) {
      updatedList = lenderList.map(l => l.id === editingLender.id ? item : l);
    } else {
      updatedList = [...lenderList, item];
    }

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${apiBase}/lenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedList),
      });
      if (res.ok) {
        setLenderList(updatedList);
        setLenderModalOpen(false);
        // Sync with active LoanCalculatorView matching engine
        window.dispatchEvent(new CustomEvent("finheal:lenders_update"));
      } else {
        const errData = await res.json();
        alert("Failed to save: " + JSON.stringify(errData));
      }
    } catch (err) {
      console.error("Error saving lender:", err);
      alert("Network error connecting to backend API.");
    }
  };

  const handleDeleteLender = async (id: string) => {
    if (confirm("Are you sure you want to delete this lender product?")) {
      const updatedList = lenderList.filter(l => l.id !== id);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const res = await fetch(`${apiBase}/lenders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedList),
        });
        if (res.ok) {
          setLenderList(updatedList);
          window.dispatchEvent(new CustomEvent("finheal:lenders_update"));
        } else {
          alert("Failed to delete lender product.");
        }
      } catch (err) {
        console.error("Error deleting lender:", err);
      }
    }
  };

  // Load local storage states
  useEffect(() => {
    // 1. Advisors List & One-time dynamic ID self-healing migration
    const storedAdvisors = localStorage.getItem("finheal_advisors_list");
    if (storedAdvisors) {
      try {
        const parsedAdvisors = JSON.parse(storedAdvisors) as Advisor[];
        let advisorsModified = false;
        
        const migratedAdvisors = parsedAdvisors.map(adv => {
          const expectedId = adv.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
          if (adv.id !== expectedId) {
            advisorsModified = true;
            const oldId = adv.id;
            
            // Migrate all existing appointments mapped to the old ID across all users
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("finheal_advisor_appointments:")) {
                try {
                  const appts = JSON.parse(localStorage.getItem(key) || "[]");
                  let apptsModified = false;
                  const updatedAppts = appts.map((appt: any) => {
                    if (appt.advisorId === oldId) {
                      apptsModified = true;
                      return { ...appt, advisorId: expectedId, advisorName: adv.name };
                    }
                    return appt;
                  });
                  if (apptsModified) {
                    localStorage.setItem(key, JSON.stringify(updatedAppts));
                  }
                } catch (e) {}
              }
            }
            return { ...adv, id: expectedId };
          }
          return adv;
        });

        if (advisorsModified) {
          localStorage.setItem("finheal_advisors_list", JSON.stringify(migratedAdvisors));
          setAdvisors(migratedAdvisors);
          dispatchUpdateEvent("finheal:advisors_update");
        } else {
          setAdvisors(parsedAdvisors);
        }
      } catch (e) {
        setAdvisors(advisorsData);
      }
    } else {
      localStorage.setItem("finheal_advisors_list", JSON.stringify(advisorsData));
      setAdvisors(advisorsData);
    }

    // 2. Educational content
    const storedContent = localStorage.getItem("finheal_education_content");
    if (storedContent) {
      setEducationContent(JSON.parse(storedContent));
    } else {
      localStorage.setItem("finheal_education_content", JSON.stringify(CONTENT));
      setEducationContent(CONTENT);
    }

    // 3. Tests List
    const storedTests = localStorage.getItem("finheal_health_tests_list");
    if (storedTests) {
      setTestCatalog(JSON.parse(storedTests));
    } else {
      localStorage.setItem("finheal_health_tests_list", JSON.stringify(testCards));
      setTestCatalog(testCards);
    }

    // 4. Appointments across all users
    loadGlobalAppointments();

    const handleUpdate = () => {
      const stored = localStorage.getItem("finheal_advisors_list");
      if (stored) {
        try { setAdvisors(JSON.parse(stored)); } catch {}
      }
      loadGlobalAppointments();
    };
    window.addEventListener("finheal:advisors_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("finheal:advisors_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Sync specific Advisor next slot
  useEffect(() => {
    if (currentExpertId && advisors.length > 0) {
      const current = advisors.find(a => a.id === currentExpertId);
      if (current) {
        setExpertNextSlot(current.nextSlot);
      }
    }
  }, [currentExpertId, advisors]);

  const loadGlobalAppointments = () => {
    const list: Appointment[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("finheal_advisor_appointments:")) {
        try {
          const userAppts = JSON.parse(localStorage.getItem(key) || "[]");
          const clientEmailStr = key.replace("finheal_advisor_appointments:", "");
          userAppts.forEach((appt: any) => {
            list.push({
              ...appt,
              clientEmail: clientEmailStr === "anonymous" ? "Guest User" : clientEmailStr
            });
          });
        } catch (e) {}
      }
    }
    // Sort by date / bookedAt descending
    list.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
    setAllAppointments(list);
  };

  const dispatchUpdateEvent = (eventName: string) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  // ==================== Expert CRUD Actions ====================
  const handleOpenAddExpert = () => {
    setEditingExpert(null);
    setExpertForm({
      name: "",
      designation: "",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
      availability: "available",
      expertise: "",
      strength: "",
      bio: "",
      category: "wealth",
      rating: 4.8,
      reviewsCount: 15,
      nextSlot: "Tomorrow, 10:00 AM",
      fee: 899
    });
    setExpertModalOpen(true);
  };

  const handleOpenEditExpert = (adv: Advisor) => {
    setEditingExpert(adv);
    setExpertForm({
      name: adv.name,
      designation: adv.designation,
      avatarUrl: adv.avatarUrl,
      availability: adv.availability,
      expertise: adv.expertise.join(", "),
      strength: adv.strength,
      bio: adv.bio,
      category: adv.category,
      rating: adv.rating,
      reviewsCount: adv.reviewsCount,
      nextSlot: adv.nextSlot,
      fee: adv.fee || 899
    });
    setExpertModalOpen(true);
  };

  const handleSaveExpert = () => {
    if (!expertForm.name.trim() || !expertForm.designation.trim()) {
      alert("Name and designation are required!");
      return;
    }

    const newId = expertForm.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const item: Advisor = {
      id: newId,
      name: expertForm.name.trim(),
      designation: expertForm.designation.trim(),
      avatarUrl: expertForm.avatarUrl.trim() || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
      availability: expertForm.availability,
      expertise: expertForm.expertise.split(",").map(e => e.trim()).filter(Boolean),
      strength: expertForm.strength.trim() || "Financial planning",
      bio: expertForm.bio.trim() || "Certified Financial Advisor",
      category: expertForm.category,
      rating: expertForm.rating,
      reviewsCount: expertForm.reviewsCount,
      nextSlot: expertForm.nextSlot.trim() || "Tomorrow, 10:00 AM",
      fee: Number(expertForm.fee) || 899
    };

    // Scan all appointments in localStorage and dynamically update old advisor ID to the new ID and name
    if (editingExpert && editingExpert.id !== item.id) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("finheal_advisor_appointments:")) {
          try {
            const appts = JSON.parse(localStorage.getItem(key) || "[]");
            let modified = false;
            const updatedAppts = appts.map((appt: any) => {
              if (appt.advisorId === editingExpert.id) {
                modified = true;
                return {
                  ...appt,
                  advisorId: item.id,
                  advisorName: item.name
                };
              }
              return appt;
            });
            if (modified) {
              localStorage.setItem(key, JSON.stringify(updatedAppts));
            }
          } catch (e) {}
        }
      }
    }

    let updatedList;
    if (editingExpert) {
      updatedList = advisors.map(a => a.id === editingExpert.id ? item : a);
    } else {
      updatedList = [...advisors, item];
    }

    setAdvisors(updatedList);
    localStorage.setItem("finheal_advisors_list", JSON.stringify(updatedList));
    dispatchUpdateEvent("finheal:advisors_update");
    setExpertModalOpen(false);
  };

  const handleDeleteExpert = (id: string) => {
    if (confirm("Are you sure you want to retire this expert's profile?")) {
      const updatedList = advisors.filter(a => a.id !== id);
      setAdvisors(updatedList);
      localStorage.setItem("finheal_advisors_list", JSON.stringify(updatedList));
      dispatchUpdateEvent("finheal:advisors_update");
    }
  };

  // ==================== Education CRUD Actions ====================
  const handleOpenAddEdu = () => {
    setEditingContent(null);
    setEduForm({
      type: "article",
      title: "",
      level: "Beginner",
      category: "Loans",
      emoji: "📚",
      bgColor: "#E6F1FB",
      youtubeId: "",
      articleUrl: "",
      description: "",
      source: "f2fintech.com",
      readTime: "5 min read",
      duration: "5 min"
    });
    setEducationModalOpen(true);
  };

  const handleOpenEditEdu = (item: ContentItem) => {
    setEditingContent(item);
    setEduForm({
      type: item.type,
      title: item.title,
      level: item.level,
      category: item.category,
      emoji: item.emoji,
      bgColor: item.bgColor,
      youtubeId: item.youtubeId || "",
      articleUrl: item.articleUrl || "",
      description: item.description,
      source: item.source,
      readTime: item.readTime || "5 min read",
      duration: item.duration || "5 min"
    });
    setEducationModalOpen(true);
  };

  const handleSaveEdu = () => {
    if (!eduForm.title.trim() || !eduForm.description.trim()) {
      alert("Title and description are required!");
      return;
    }

    const item: ContentItem = {
      id: editingContent ? editingContent.id : `content-${Date.now()}`,
      type: eduForm.type,
      title: eduForm.title.trim(),
      level: eduForm.level,
      category: eduForm.category,
      emoji: eduForm.emoji.trim(),
      bgColor: eduForm.bgColor.trim(),
      youtubeId: eduForm.type === "video" ? eduForm.youtubeId.trim() : undefined,
      articleUrl: eduForm.type === "article" ? eduForm.articleUrl.trim() : undefined,
      description: eduForm.description.trim(),
      source: eduForm.source.trim() || "f2fintech.com",
      readTime: eduForm.type === "article" ? eduForm.readTime : undefined,
      duration: eduForm.type === "video" ? eduForm.duration : undefined
    };

    let updatedList;
    if (editingContent) {
      updatedList = educationContent.map(c => c.id === editingContent.id ? item : c);
    } else {
      updatedList = [...educationContent, item];
    }

    setEducationContent(updatedList);
    localStorage.setItem("finheal_education_content", JSON.stringify(updatedList));
    dispatchUpdateEvent("finheal:education_update");
    setEducationModalOpen(false);
  };

  const handleDeleteEdu = (id: string) => {
    if (confirm("Are you sure you want to delete this educational content?")) {
      const updatedList = educationContent.filter(c => c.id !== id);
      setEducationContent(updatedList);
      localStorage.setItem("finheal_education_content", JSON.stringify(updatedList));
      dispatchUpdateEvent("finheal:education_update");
    }
  };

  // ==================== Tests CRUD Actions ====================
  const handleOpenAddTest = () => {
    setEditingTest(null);
    setTestForm({
      title: "",
      description: "",
      duration: "5 min",
      focus: "",
      result: "",
      accent: "from-[#3344e6] to-[#7c8cff]"
    });
    setTestModalOpen(true);
  };

  const handleOpenEditTest = (test: TestCard) => {
    setEditingTest(test);
    setTestForm({
      title: test.title,
      description: test.description,
      duration: test.duration,
      focus: test.focus,
      result: test.result,
      accent: test.accent
    });
    setTestModalOpen(true);
  };

  const handleSaveTest = () => {
    if (!testForm.title.trim() || !testForm.description.trim()) {
      alert("Title and description are required!");
      return;
    }

    const item: TestCard = {
      id: editingTest ? editingTest.id : `test-${Date.now()}`,
      title: testForm.title.trim(),
      description: testForm.description.trim(),
      duration: testForm.duration.trim() || "5 min",
      focus: testForm.focus.trim() || "Affordability analysis",
      result: testForm.result.trim() || "Instant diagnostic score",
      accent: testForm.accent.trim()
    };

    let updatedList;
    if (editingTest) {
      updatedList = testCatalog.map(t => t.id === editingTest.id ? item : t);
    } else {
      updatedList = [...testCatalog, item];
    }

    setTestCatalog(updatedList);
    localStorage.setItem("finheal_health_tests_list", JSON.stringify(updatedList));
    dispatchUpdateEvent("finheal:tests_update");
    setTestModalOpen(false);
  };

  const handleDeleteTest = (id: string) => {
    if (confirm("Are you sure you want to retire this health test?")) {
      const updatedList = testCatalog.filter(t => t.id !== id);
      setTestCatalog(updatedList);
      localStorage.setItem("finheal_health_tests_list", JSON.stringify(updatedList));
      dispatchUpdateEvent("finheal:tests_update");
    }
  };

  // ==================== Expert Workspace Actions ====================
  const handleToggleExpertAvailability = () => {
    if (!currentExpertId) return;

    const updatedList = advisors.map(a => {
      if (a.id === currentExpertId) {
        const nextAvail = a.availability === "available" ? "unavailable" as const : "available" as const;
        return { ...a, availability: nextAvail };
      }
      return a;
    });

    setAdvisors(updatedList);
    localStorage.setItem("finheal_advisors_list", JSON.stringify(updatedList));
    dispatchUpdateEvent("finheal:advisors_update");
  };

  const handleUpdateExpertNextSlot = () => {
    if (!currentExpertId || !expertNextSlot.trim()) return;

    const updatedList = advisors.map(a => {
      if (a.id === currentExpertId) {
        return { ...a, nextSlot: expertNextSlot.trim() };
      }
      return a;
    });

    setAdvisors(updatedList);
    localStorage.setItem("finheal_advisors_list", JSON.stringify(updatedList));
    dispatchUpdateEvent("finheal:advisors_update");
    alert("Next slot has been updated successfully!");
  };

  const activeExpert = currentExpertId ? advisors.find(a => a.id === currentExpertId) : null;
  const activeExpertAppointments = allAppointments.filter(a => a.advisorId === currentExpertId);

  // ==================== RENDERING WORKSPACE ====================
  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">
            {isAdmin ? "Super Admin Portal" : "Advisor Workspace"}
          </div>
          <div className="text-[10px] text-gray-400 sm:text-[11px]">
            {isAdmin 
              ? "Exclusively managing advisors, educational logs, test catalogs, and platform stats." 
              : `Managing professional logs and live availability for ${activeExpert?.name || "Expert"}.`}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleInsights}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0"
          aria-label="Toggle insights panel"
        >
          ☰
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px] scrollbar-thin">
        
        {/* ========================================================================= */}
        {/* ===================== SUPER ADMIN VIEW RENDER =========================== */}
        {/* ========================================================================= */}
        {isAdmin ? (
          <div className="space-y-[24px]">
            
            {/* TABS MENU */}
            <div style={{ display: "flex", gap: "4px", borderBottom: "1.5px solid #e5e7eb" }}>
              {[
                { id: "stats", label: "📊 Analytics stats" },
                { id: "experts", label: "🧑‍💼 Manage Experts" },
                { id: "education", label: "📚 Manage Education" },
                { id: "tests", label: "🧭 Manage Tests" },
                { id: "appointments", label: "📅 Scheduled Calls" },
                { id: "lenders", label: "🏦 Lenders Catalog" }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTab(t.id as any)}
                  className={`padding px-[16px] py-[8px] rounded-t-[12px] border-none text-[12px] font-bold cursor-pointer transition ${
                    activeTab === t.id ? "bg-primary text-white" : "background-transparent text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: STATS & ANALYTICS */}
            {activeTab === "stats" && (
              <div className="space-y-[20px] animate-fade-in">
                
                {/* Metrics Cards Grid */}
                <div className="grid gap-[12px] grid-cols-2 lg:grid-cols-4">
                  
                  <Card className="border-gray-200 shadow-xs">
                    <CardHeader className="p-[14px] pb-[4px]">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Platform Users</CardDescription>
                    </CardHeader>
                    <CardContent className="p-[14px] pt-0">
                      <div className="text-[32px] font-serif font-bold text-gray-900">
                        {statsLoading ? "..." : backendStats?.total_users ?? 0}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-[2px]">Real-time database records</div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-xs">
                    <CardHeader className="p-[14px] pb-[4px]">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Registered Members</CardDescription>
                    </CardHeader>
                    <CardContent className="p-[14px] pt-0">
                      <div className="text-[32px] font-serif font-bold text-primary">
                        {statsLoading ? "..." : backendStats?.registered_users ?? 0}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-[2px]">Signed-up user accounts</div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-xs">
                    <CardHeader className="p-[14px] pb-[4px]">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Conversion Rate</CardDescription>
                    </CardHeader>
                    <CardContent className="p-[14px] pt-0">
                      <div className="text-[32px] font-serif font-bold text-emerald-600">
                        {statsLoading || !backendStats?.total_users 
                          ? "0%" 
                          : `${Math.round((backendStats.registered_users / backendStats.total_users) * 100)}%`}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-[2px]">Guests who became members</div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-xs">
                    <CardHeader className="p-[14px] pb-[4px]">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Conversations</CardDescription>
                    </CardHeader>
                    <CardContent className="p-[14px] pt-0">
                      <div className="text-[32px] font-serif font-bold text-indigo-600">
                        {statsLoading ? "..." : backendStats?.total_conversations ?? 0}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-[2px]">Total AI therapy chats started</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Admin Visual Panel */}
                <div className="grid gap-[18px] md:grid-cols-2">
                  
                  {/* Platform Wellness Summary Card */}
                  <div className="border border-[#d4d8fa] bg-gradient-to-br from-[#f8f9ff] to-[#f0f2ff] rounded-[20px] p-[20px] shadow-xs">
                    <h3 className="text-[14px] font-bold text-gray-900 mb-[4px] flex items-center gap-[6px]">
                      🏆 Platform Wellness Average
                    </h3>
                    <p className="text-[12px] text-gray-500 mb-[16px]">Current aggregated score based on all registered user tests.</p>
                    
                    <div className="flex items-end gap-[10px] mb-[12px]">
                      <div className="text-[54px] font-serif font-bold text-primary leading-none">68</div>
                      <div className="text-[16px] text-gray-400 pb-[6px]">/ 100</div>
                      <span className="mb-[6px] ml-[8px] bg-emerald-100 text-emerald-800 text-[10px] font-bold px-[8px] py-[3px] rounded-full uppercase tracking-wider">
                        Good Health
                      </span>
                    </div>

                    <div className="h-[6px] bg-gray-200 rounded-[6px] overflow-hidden mb-[16px]">
                      <div className="h-full bg-primary" style={{ width: "68%" }} />
                    </div>

                    <div className="grid grid-cols-3 gap-[10px] text-[11px] text-gray-600 text-center">
                      <div className="bg-white border border-gray-100 rounded-[10px] p-[8px]">
                        <div className="text-gray-400 font-medium">Tests Done</div>
                        <div className="text-gray-800 font-bold mt-[2px]">34 active</div>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-[10px] p-[8px]">
                        <div className="text-gray-400 font-medium">Top Category</div>
                        <div className="text-gray-800 font-bold mt-[2px]">Money IQ</div>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-[10px] p-[8px]">
                        <div className="text-gray-400 font-medium">Risk Mix</div>
                        <div className="text-gray-800 font-bold mt-[2px]">Low (12%)</div>
                      </div>
                    </div>
                  </div>

                  {/* Catalog Distribution summary */}
                  <div className="border border-gray-200 bg-white rounded-[20px] p-[20px] shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900 mb-[4px]">
                        📚 Catalog Content Distribution
                      </h3>
                      <p className="text-[12px] text-gray-500 mb-[16px]">Summary breakdown of all dynamic libraries managed by Admin.</p>
                      
                      <div className="space-y-[10px]">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-gray-600 font-medium flex items-center gap-[6px]">🧑‍💼 Expert Advisors</span>
                          <strong className="text-gray-900">{advisors.length} active</strong>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-gray-600 font-medium flex items-center gap-[6px]">📄 Educational Articles</span>
                          <strong className="text-gray-900">{educationContent.filter(c => c.type === "article").length} active</strong>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-gray-600 font-medium flex items-center gap-[6px]">🎥 Educational Videos</span>
                          <strong className="text-gray-900">{educationContent.filter(c => c.type === "video").length} active</strong>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-gray-600 font-medium flex items-center gap-[6px]">🧭 Financial Health Tests</span>
                          <strong className="text-gray-900">{testCatalog.length} active</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-[14px] border-t border-gray-100 flex justify-between text-[11px] text-gray-400">
                      <span>Last dynamic sync: Just now</span>
                      <span>Seeded: Yes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MANAGE EXPERTS */}
            {activeTab === "experts" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Advisors ({advisors.length})</h3>
                  <button 
                    onClick={handleOpenAddExpert}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add New Expert
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Expert info</th>
                        <th className="p-[12px]">Designation</th>
                        <th className="p-[12px]">Category</th>
                        <th className="p-[12px]">Hourly Fee</th>
                        <th className="p-[12px]">Availability</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advisors.map((adv) => (
                        <tr key={adv.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[12px] flex items-center gap-[10px]">
                            <img src={adv.avatarUrl} alt={adv.name} className="w-[32px] h-[32px] rounded-full object-cover border" />
                            <div>
                              <strong className="text-gray-900">{adv.name}</strong>
                              <div className="text-[10px] text-amber-500">⭐ {adv.rating} ({adv.reviewsCount} reviews)</div>
                            </div>
                          </td>
                          <td className="p-[12px] text-gray-600 font-medium">{adv.designation}</td>
                          <td className="p-[12px] uppercase font-bold text-[10.5px] text-gray-400">{adv.category}</td>
                          <td className="p-[12px] font-bold text-gray-950">₹{adv.fee || 899}</td>
                          <td className="p-[12px]">
                            {adv.availability === "available" ? (
                              <span className="bg-emerald-50 text-emerald-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-emerald-100">Available</span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-rose-100">Busy</span>
                            )}
                          </td>
                          <td className="p-[12px] text-right space-x-[6px]">
                            <button 
                              onClick={() => handleOpenEditExpert(adv)}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteExpert(adv.id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: MANAGE EDUCATION */}
            {activeTab === "education" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Education Content ({educationContent.length})</h3>
                  <button 
                    onClick={handleOpenAddEdu}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add Content
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Title</th>
                        <th className="p-[12px]">Type</th>
                        <th className="p-[12px]">Category</th>
                        <th className="p-[12px]">Level</th>
                        <th className="p-[12px]">Source</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {educationContent.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[12px] max-w-[240px]">
                            <div className="flex items-center gap-[8px]">
                              <span className="text-[16px]">{item.emoji}</span>
                              <div className="min-w-0">
                                <strong className="text-gray-900 block truncate">{item.title}</strong>
                                <span className="text-[10px] text-gray-400 block truncate">{item.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-[12px]">
                            {item.type === "article" ? (
                              <span className="bg-blue-50 text-blue-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-blue-100">📄 Article</span>
                            ) : (
                              <span className="bg-purple-50 text-purple-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-purple-100">🎥 Video</span>
                            )}
                          </td>
                          <td className="p-[12px] text-gray-600 font-medium">{item.category}</td>
                          <td className="p-[12px] text-gray-500">{item.level}</td>
                          <td className="p-[12px] text-gray-400 font-medium">{item.source}</td>
                          <td className="p-[12px] text-right space-x-[6px]">
                            <button 
                              onClick={() => handleOpenEditEdu(item)}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteEdu(item.id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: MANAGE TESTS */}
            {activeTab === "tests" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Health Tests ({testCatalog.length})</h3>
                  <button 
                    onClick={handleOpenAddTest}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add New Test
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Test Title</th>
                        <th className="p-[12px]">Duration</th>
                        <th className="p-[12px]">Primary Focus</th>
                        <th className="p-[12px]">Score output</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testCatalog.map((test) => (
                        <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[12px] max-w-[200px]">
                            <strong className="text-gray-900 block truncate">{test.title}</strong>
                            <span className="text-[10px] text-gray-400 block truncate">{test.description}</span>
                          </td>
                          <td className="p-[12px] font-semibold text-gray-600">{test.duration}</td>
                          <td className="p-[12px] text-gray-500">{test.focus}</td>
                          <td className="p-[12px] text-gray-400">{test.result}</td>
                          <td className="p-[12px] text-right space-x-[6px]">
                            <button 
                              onClick={() => handleOpenEditTest(test)}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteTest(test.id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SCHEDULED CALLS FEED */}
            {activeTab === "appointments" && (
              <div className="space-y-[16px] animate-fade-in">
                <h3 className="text-[14px] font-bold text-gray-900">Platform Scheduled Consultations Feed ({allAppointments.length})</h3>
                
                {allAppointments.length === 0 ? (
                  <div className="text-center py-[36px] bg-gray-50 border border-dashed rounded-[16px]">
                    <div className="text-[32px]">📅</div>
                    <div className="text-[12px] text-gray-400 mt-[6px]">No scheduled calls have been booked on the platform yet.</div>
                  </div>
                ) : (
                  <div className="space-y-[10px]">
                    {allAppointments.map((appt, idx) => (
                      <div key={idx} className="border border-gray-200 bg-white p-[16px] rounded-[16px] flex flex-col justify-between sm:flex-row sm:items-center">
                        <div className="space-y-[4px]">
                          <div className="flex items-center gap-[8px] flex-wrap">
                            <strong className="text-[14px] text-gray-900">{appt.advisorName}</strong>
                            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-[8px] py-[2px] rounded-full uppercase">Advisor ID: {appt.advisorId}</span>
                            {appt.completed ? (
                              <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">✓ Completed & Rated</span>
                            ) : (
                              <span className="text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">🕒 Active Schedule</span>
                            )}
                          </div>
                          <div className="text-[12px] text-gray-600">
                            <strong>Client email:</strong> {appt.clientEmail}
                          </div>
                          {appt.meetUrl && (
                            <div className="text-[11.5px] text-gray-600 mt-[4px] flex items-center gap-[6px] flex-wrap">
                              <span>🌐 <strong>Meet URL Room:</strong></span>
                              <a
                                href={appt.meetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-bold"
                              >
                                {appt.meetUrl}
                              </a>
                            </div>
                          )}
                          {appt.completed && (
                            <div className="flex items-center gap-[6px] text-[11px] font-bold text-amber-500 bg-amber-50/20 border border-amber-100/30 px-[10px] py-[6px] rounded-[10px] w-fit mt-[4px]">
                              <span>{"★".repeat(appt.rating || 0)}</span>
                              <span className="text-gray-500">({appt.rating}/5 stars)</span>
                              {appt.feedback && (
                                <span className="text-gray-400 font-normal italic">&quot;{appt.feedback}&quot;</span>
                              )}
                            </div>
                          )}
                          {appt.notes && (
                            <div className="text-[11px] italic text-gray-500 bg-gray-50 border border-gray-100 p-[8px] rounded-[8px] max-w-[480px] mt-[4px]">
                              &quot;{appt.notes}&quot;
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0 mt-[12px] pt-[12px] border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0">
                          <div className="text-[13px] font-bold text-primary">{appt.date}</div>
                          <div className="text-[12px] font-bold text-gray-700 mt-[2px]">{appt.time} (IST)</div>
                          <div className="text-[10px] text-gray-400 mt-[4px]">Booked: {new Date(appt.bookedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MANAGE LENDERS */}
            {activeTab === "lenders" && (
              <div className="space-y-[16px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Manage Lenders Catalog ({lenderList.length})</h3>
                  <button 
                    onClick={handleOpenAddLender}
                    className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
                  >
                    + Add Lender Product
                  </button>
                </div>

                <div className="border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-[12px]">Lender / Product</th>
                        <th className="p-[12px]">Lender Type</th>
                        <th className="p-[12px]">Category</th>
                        <th className="p-[12px]">Rate (ROI)</th>
                        <th className="p-[12px]">Limit Range</th>
                        <th className="p-[12px]">Min CIBIL / Income</th>
                        <th className="p-[12px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lendersLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center p-6 text-gray-400">Loading catalog...</td>
                        </tr>
                      ) : lenderList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-6 text-gray-400">No lenders listed. Click "+ Add Lender Product" to seed catalog.</td>
                        </tr>
                      ) : (
                        lenderList.map((l) => (
                          <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-[12px] max-w-[200px]">
                              <strong className="text-gray-900 block">{l.name}</strong>
                              <span className="text-[10px] text-gray-400 block">{l.productType}</span>
                              <span className="text-[9px] text-primary/70 font-semibold uppercase">{l.id}</span>
                            </td>
                            <td className="p-[12px] font-semibold text-gray-600">{l.lenderType}</td>
                            <td className="p-[12px] font-semibold text-gray-500 uppercase">{l.category}</td>
                            <td className="p-[12px] font-bold text-emerald-600">{l.minRate}% - {l.maxRate}%</td>
                            <td className="p-[12px] font-semibold text-gray-800">
                              ₹{l.minAmount >= 10000000 ? `${(l.minAmount/10000000).toFixed(1)}Cr` : l.minAmount >= 100000 ? `${(l.minAmount/100000).toFixed(0)}L` : l.minAmount} - 
                              ₹{l.maxAmount >= 10000000 ? `${(l.maxAmount/10000000).toFixed(0)}Cr` : l.maxAmount >= 100000 ? `${(l.maxAmount/100000).toFixed(0)}L` : l.maxAmount}
                            </td>
                            <td className="p-[12px] text-gray-500">
                              <span>CIBIL: ≥{l.minCibil}</span>
                              <span className="block text-[10px] text-gray-400">Min Income: ₹{l.minMonthlyIncome}</span>
                            </td>
                            <td className="p-[12px] text-right space-x-[6px]">
                              <button 
                                onClick={() => handleOpenEditLender(l)}
                                className="text-primary hover:underline font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteLender(l.id)}
                                className="text-rose-500 hover:underline font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* ==================== ADVISOR WORKSPACE VIEW RENDER ====================== */
          /* ========================================================================= */
          <div className="space-y-[24px] animate-fade-in">
            {activeExpert ? (
              <>
                {/* Advisor Workspace Welcome Banner */}
                <div className="border border-primary/20 bg-gradient-to-br from-[#f8f9ff] to-[#f0f2ff] rounded-[20px] p-[20px] flex flex-col sm:flex-row gap-[18px] items-center">
                  <img src={activeExpert.avatarUrl} alt={activeExpert.name} className="w-[84px] h-[84px] rounded-2xl object-cover shadow-md border-2 border-white" />
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <h2 className="text-[20px] font-serif font-bold text-gray-900">Welcome Back, {activeExpert.name}!</h2>
                    <p className="text-[12px] text-gray-500 mt-[2px]">{activeExpert.designation}</p>
                    
                    <div className="flex flex-wrap gap-[6px] mt-[8px] justify-center sm:justify-start">
                      {activeExpert.expertise.map((exp, idx) => (
                        <span key={idx} className="bg-white border border-[#d4d8fa] text-primary text-[10px] font-bold px-[8px] py-[2px] rounded-full">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Glowing Status Toggle */}
                  <div className="shrink-0 flex flex-col items-center gap-[8px] p-[10px] bg-white border border-gray-100 rounded-[16px] shadow-inner">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Availability Status</span>
                    
                    <button
                      onClick={handleToggleExpertAvailability}
                      className={`flex items-center gap-[8px] px-[16px] py-[8px] rounded-full text-[12px] font-bold transition cursor-pointer ${
                        activeExpert.availability === "available"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}
                    >
                      <span className={`relative flex h-3 w-3 ${activeExpert.availability === "available" ? "animate-pulse-ring" : ""}`}>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${activeExpert.availability === "available" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      </span>
                      {activeExpert.availability === "available" ? "Live Available" : "Offline / Busy"}
                    </button>
                    <span className="text-[9px] text-gray-400">Click button to toggle status</span>
                  </div>
                </div>

                {/* Slot editor and appointments list */}
                <div className="grid gap-[20px] md:grid-cols-3">
                  
                  {/* Left Column: Next Slot Editor */}
                  <Card className="border-gray-200 shadow-xs md:col-span-1 h-fit">
                    <CardHeader className="p-[16px] pb-[4px]">
                      <CardTitle className="text-[14px] font-bold">Update Next Slot</CardTitle>
                      <CardDescription className="text-[11px] text-gray-400">Set the next available booking slot users will see on your card.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-[16px] space-y-[12px]">
                      <input
                        type="text"
                        value={expertNextSlot}
                        onChange={(e) => setExpertNextSlot(e.target.value)}
                        placeholder="e.g. Tomorrow, 10:00 AM"
                        className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                      />
                      <button
                        onClick={handleUpdateExpertNextSlot}
                        className="w-full bg-primary hover:opacity-90 text-white font-bold py-[9px] rounded-[10px] text-[12px] transition cursor-pointer shadow-md shadow-primary/10"
                      >
                        Save Next Slot
                      </button>
                    </CardContent>
                  </Card>

                  {/* Right Column: Booked consultations list */}
                  <div className="md:col-span-2 space-y-[12px]">
                    <h3 className="text-[13px] font-bold text-gray-900 flex items-center gap-[6px]">
                      📅 Booked Consultations with Clients ({activeExpertAppointments.length})
                    </h3>
                    
                    {activeExpertAppointments.length === 0 ? (
                      <div className="text-center py-[48px] bg-gray-50 border border-dashed rounded-[16px]">
                        <div className="text-[36px]">📅</div>
                        <div className="text-[12px] text-gray-400 mt-[6px]">No appointments scheduled with you yet.</div>
                      </div>
                    ) : (
                      <div className="space-y-[10px]">
                        {activeExpertAppointments.map((appt, idx) => (
                          <div key={idx} className="border border-gray-200 bg-white p-[16px] rounded-[16px] flex flex-col justify-between sm:flex-row sm:items-center">
                            <div className="space-y-[4px]">
                              <div className="text-[13px] font-bold text-gray-900 flex items-center gap-[6px]">
                                Client Email: <span className="text-primary font-bold">{appt.clientEmail}</span>
                              </div>
                              {appt.meetUrl && (
                                <div className="text-[11.5px] text-gray-600 mt-[4px] flex items-center gap-[6px]">
                                  <span>🌐 <strong>Room Link:</strong></span>
                                  <a
                                    href={appt.meetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-bold"
                                  >
                                    {appt.meetUrl}
                                  </a>
                                </div>
                              )}
                              {appt.notes && (
                                <div className="text-[11px] italic text-gray-500 bg-gray-50 border border-gray-100 p-[8px] rounded-[8px] max-w-[440px] mt-[4px]">
                                  &quot;{appt.notes}&quot;
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0 mt-[10px] pt-[10px] border-t border-gray-50 sm:border-t-0 sm:mt-0 sm:pt-0">
                              <div className="text-[13px] font-bold text-primary">{appt.date}</div>
                              <div className="text-[12px] font-bold text-gray-700 mt-[2px]">{appt.time} (IST)</div>
                              {appt.meetUrl ? (
                                <a
                                  href={appt.meetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-[8px] inline-block bg-primary hover:opacity-90 text-white text-[11px] font-bold px-[12px] py-[6px] rounded-[8px] transition cursor-pointer text-center"
                                >
                                  Join Call Room
                                </a>
                              ) : (
                                <button
                                  onClick={() => alert("We've sent the Google Calendar invite link to you and your client. Press OK to copy link.")}
                                  className="mt-[8px] bg-[#ecfdf5] hover:bg-[#d1fae5] text-emerald-800 text-[10px] font-bold px-[8px] py-[3px] rounded-[6px] border border-emerald-100 transition"
                                >
                                  Accept session
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-[48px]">
                <div className="text-[32px]">⚠️</div>
                <div className="text-[14px] font-bold text-gray-800 mt-[8px]">Expert Profile Match Failed</div>
                <div className="text-[11px] text-gray-400 mt-[4px]">We couldn&apos;t load advisor credentials mapped to this email. Please check configuration.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ===================== EXPERT ADD/EDIT POPUP MODAL ======================= */}
      {/* ========================================================================= */}
      {expertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingExpert ? `Edit Profile: ${editingExpert.name}` : "Add New Advisor Profile"}
              </h3>
              <button onClick={() => setExpertModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[60vh] scrollbar-thin">
              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Full Name</label>
                  <input
                    type="text"
                    value={expertForm.name}
                    onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
                    placeholder="e.g. Sneha Reddy"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Designation</label>
                  <input
                    type="text"
                    value={expertForm.designation}
                    onChange={(e) => setExpertForm({ ...expertForm, designation: e.target.value })}
                    placeholder="e.g. CFP / Portfolio Manager"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Avatar URL</label>
                <input
                  type="text"
                  value={expertForm.avatarUrl}
                  onChange={(e) => setExpertForm({ ...expertForm, avatarUrl: e.target.value })}
                  placeholder="Unsplash image link"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Category</label>
                  <select
                    value={expertForm.category}
                    onChange={(e) => setExpertForm({ ...expertForm, category: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="wealth">Wealth & Investing</option>
                    <option value="tax">Tax & Retirement</option>
                    <option value="debt">Debt & Credit</option>
                    <option value="property">Real Estate</option>
                    <option value="insurance">Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Initial Availability</label>
                  <select
                    value={expertForm.availability}
                    onChange={(e) => setExpertForm({ ...expertForm, availability: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="available">Available (Green dot)</option>
                    <option value="unavailable">Busy / Offline (Red dot)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Consultation Fee / Hr (INR)</label>
                  <input
                    type="number"
                    value={expertForm.fee}
                    onChange={(e) => setExpertForm({ ...expertForm, fee: Number(e.target.value) })}
                    placeholder="e.g. 899"
                    min={0}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Next Slot</label>
                  <input
                    type="text"
                    value={expertForm.nextSlot}
                    onChange={(e) => setExpertForm({ ...expertForm, nextSlot: e.target.value })}
                    placeholder="e.g. Tomorrow, 10:00 AM"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Expertise Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={expertForm.expertise}
                  onChange={(e) => setExpertForm({ ...expertForm, expertise: e.target.value })}
                  placeholder="e.g. Stock Markets, Tax, Debt repair"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Core Strength</label>
                <input
                  type="text"
                  value={expertForm.strength}
                  onChange={(e) => setExpertForm({ ...expertForm, strength: e.target.value })}
                  placeholder="e.g. Dynamic Asset allocation"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Advisor Bio</label>
                <textarea
                  value={expertForm.bio}
                  onChange={(e) => setExpertForm({ ...expertForm, bio: e.target.value })}
                  placeholder="A short profile paragraph explaining their professional focus..."
                  rows={3}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button onClick={() => setExpertModalOpen(false)} className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveExpert} className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md">
                Save Expert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* =================== EDUCATION ADD/EDIT POPUP MODAL ====================== */}
      {/* ========================================================================= */}
      {educationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingContent ? `Edit Dynamic Content` : "Add Educational Article or Video"}
              </h3>
              <button onClick={() => setEducationModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[60vh] scrollbar-thin">
              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Resource Type</label>
                  <select
                    value={eduForm.type}
                    onChange={(e) => setEduForm({ ...eduForm, type: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="article">📄 Article</option>
                    <option value="video">🎥 YouTube Video</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Difficulty Level</label>
                  <select
                    value={eduForm.level}
                    onChange={(e) => setEduForm({ ...eduForm, level: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Resource Title</label>
                <input
                  type="text"
                  value={eduForm.title}
                  onChange={(e) => setEduForm({ ...eduForm, title: e.target.value })}
                  placeholder="e.g. 5 Strategies to cut your tax"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Category Topic</label>
                  <select
                    value={eduForm.category}
                    onChange={(e) => setEduForm({ ...eduForm, category: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Loans">Loans</option>
                    <option value="Credit">Credit</option>
                    <option value="Savings">Savings</option>
                    <option value="Debt">Debt</option>
                    <option value="Tax">Tax</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Icon Emoji</label>
                  <input
                    type="text"
                    value={eduForm.emoji}
                    onChange={(e) => setEduForm({ ...eduForm, emoji: e.target.value })}
                    placeholder="e.g. 📚"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {eduForm.type === "article" ? (
                <div className="grid grid-cols-2 gap-[10px]">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Article URL Link</label>
                    <input
                      type="text"
                      value={eduForm.articleUrl}
                      onChange={(e) => setEduForm({ ...eduForm, articleUrl: e.target.value })}
                      placeholder="https://f2fintech.com/blogs/..."
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Estimated Read Time</label>
                    <input
                      type="text"
                      value={eduForm.readTime}
                      onChange={(e) => setEduForm({ ...eduForm, readTime: e.target.value })}
                      placeholder="e.g. 5 min read"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-[10px]">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">YouTube Video ID</label>
                    <input
                      type="text"
                      value={eduForm.youtubeId}
                      onChange={(e) => setEduForm({ ...eduForm, youtubeId: e.target.value })}
                      placeholder="YouTube ID (e.g., _efmpZ5k9S8)"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Video Duration</label>
                    <input
                      type="text"
                      value={eduForm.duration}
                      onChange={(e) => setEduForm({ ...eduForm, duration: e.target.value })}
                      placeholder="e.g. 5 min"
                      className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Short Description Summary</label>
                <textarea
                  value={eduForm.description}
                  onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                  placeholder="Describe what the user will learn from this educational content card..."
                  rows={3}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button onClick={() => setEducationModalOpen(false)} className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveEdu} className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md">
                Save Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===================== TESTS ADD/EDIT POPUP MODAL ======================== */}
      {/* ========================================================================= */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingTest ? `Edit Test Catalog Card` : "Add New Financial Health Test Card"}
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[60vh] scrollbar-thin">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Test Card Title</label>
                <input
                  type="text"
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="e.g. Budget Affordability Review"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Test Duration</label>
                  <input
                    type="text"
                    value={testForm.duration}
                    onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })}
                    placeholder="e.g. 5 min"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Card Gradient Accent</label>
                  <select
                    value={testForm.accent}
                    onChange={(e) => setTestForm({ ...testForm, accent: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="from-[#3344e6] to-[#7c8cff]">Royal Blue to Purple</option>
                    <option value="from-[#10b981] to-[#34d399]">emerald Green</option>
                    <option value="from-[#f59e0b] to-[#fbbf24]">amber Orange</option>
                    <option value="from-[#06b6d4] to-[#22d3ee]">cyan Blue</option>
                    <option value="from-[#8b5cf6] to-[#a78bfa]">lavender Violet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Core Focus Area</label>
                <input
                  type="text"
                  value={testForm.focus}
                  onChange={(e) => setTestForm({ ...testForm, focus: e.target.value })}
                  placeholder="e.g. Monthly cashflows and emergency buffers"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Result Output Style</label>
                <input
                  type="text"
                  value={testForm.result}
                  onChange={(e) => setTestForm({ ...testForm, result: e.target.value })}
                  placeholder="e.g. Diagnostic Safety score + buffer tips"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[4px]">Card Description Summary</label>
                <textarea
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  placeholder="Describe what the health test assesses..."
                  rows={3}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button onClick={() => setTestModalOpen(false)} className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveTest} className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md">
                Save Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===================== LENDERS ADD/EDIT POPUP MODAL ======================= */}
      {/* ========================================================================= */}
      {lenderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[550px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <h3 className="text-[14px] font-bold text-gray-900">
                {editingLender ? `Edit Lender: ${editingLender.name}` : "Add New Lender Product"}
              </h3>
              <button onClick={() => setLenderModalOpen(false)} className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-[20px] space-y-[12px] overflow-y-auto max-h-[70vh] scrollbar-thin">
              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Lender Name</label>
                  <input
                    type="text"
                    value={lenderForm.name || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, name: e.target.value })}
                    placeholder="e.g. SBI"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Product Type</label>
                  <input
                    type="text"
                    value={lenderForm.productType || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, productType: e.target.value })}
                    placeholder="e.g. Home Loan"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Category</label>
                  <select
                    value={lenderForm.category || "home"}
                    onChange={(e) => setLenderForm({ ...lenderForm, category: e.target.value as any })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white animate-fade-in"
                  >
                    <option value="home">Home Loan</option>
                    <option value="personal">Personal Loan</option>
                    <option value="professional">Professional Loan</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Lender Type</label>
                  <select
                    value={lenderForm.lenderType || "NBFC"}
                    onChange={(e) => setLenderForm({ ...lenderForm, lenderType: e.target.value })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary bg-white animate-fade-in"
                  >
                    <option value="PSU">PSU Bank</option>
                    <option value="Private Bank">Private Bank</option>
                    <option value="NBFC">NBFC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Product ID</label>
                  <input
                    type="text"
                    value={lenderForm.id || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, id: e.target.value })}
                    placeholder="e.g. HL-SBI"
                    disabled={!!editingLender}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] focus:outline-none focus:border-primary disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lenderForm.minRate || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minRate: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lenderForm.maxRate || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxRate: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Tenure (Y)</label>
                  <input
                    type="number"
                    value={lenderForm.minTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minTenureYears: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Tenure (Y)</label>
                  <input
                    type="number"
                    value={lenderForm.maxTenureYears || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxTenureYears: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min CIBIL</label>
                  <input
                    type="number"
                    value={lenderForm.minCibil || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minCibil: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max FOIR (%)</label>
                  <input
                    type="number"
                    value={lenderForm.maxFoirPct || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxFoirPct: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Monthly Income</label>
                  <input
                    type="number"
                    value={lenderForm.minMonthlyIncome || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minMonthlyIncome: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Min Loan Amount</label>
                  <input
                    type="number"
                    value={lenderForm.minAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, minAmount: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Max Loan Amount</label>
                  <input
                    type="number"
                    value={lenderForm.maxAmount || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, maxAmount: Number(e.target.value) })}
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Disbursal TAT</label>
                  <input
                    type="text"
                    value={lenderForm.disbursalTime || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, disbursalTime: e.target.value })}
                    placeholder="e.g. 2-5 working days"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Processing Fee</label>
                  <input
                    type="text"
                    value={lenderForm.processingFee || ""}
                    onChange={(e) => setLenderForm({ ...lenderForm, processingFee: e.target.value })}
                    placeholder="e.g. 2.0% + GST"
                    className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Pros (comma-separated)</label>
                <input
                  type="text"
                  value={lenderForm.pros || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, pros: e.target.value })}
                  placeholder="Fast approvals, Digital KYC"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Cons (comma-separated)</label>
                <input
                  type="text"
                  value={lenderForm.cons || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, cons: e.target.value })}
                  placeholder="Higher ROI band, Documentation heavy"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-[4px]">Required Documents (comma-separated)</label>
                <textarea
                  value={lenderForm.docsRequired || ""}
                  onChange={(e) => setLenderForm({ ...lenderForm, docsRequired: e.target.value })}
                  placeholder="PAN & Aadhaar KYC, Medical/CA degree, 6 months banking statements"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[10px] text-[12px] h-[55px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-[10px] border-t border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
              <button onClick={() => setLenderModalOpen(false)} className="px-[16px] py-[8px] bg-white border border-gray-300 rounded-[10px] text-[12px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveLender} className="px-[16px] py-[8px] bg-primary text-white hover:opacity-90 rounded-[10px] text-[12px] font-bold cursor-pointer animate-pulse-ring">
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
