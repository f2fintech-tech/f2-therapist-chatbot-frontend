import { useState, useEffect, useMemo } from "react";
import { fetchAdvisorAppointments } from "@/lib/backendAuth";
import { 
  Bell, 
  Calendar, 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Plus, 
  Filter, 
  Check, 
  AlertCircle, 
  X, 
  Search, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  category: "EMI" | "Savings" | "Bill" | "Tax" | "General" | "Consultation" | "Preparation" | "FollowUp" | "Admin";
  amount?: number;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: "high" | "medium" | "low";
  frequency: "one-time" | "weekly" | "monthly" | "yearly";
  notes?: string;
  completed: boolean;
  isAppointment?: boolean;
  meetUrl?: string;
}

interface RemindersViewProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  onOpenFinancialWellnessAssistant?: () => void;
}

const STORAGE_KEY_PREFIX = "finheal_reminders";

const CATEGORY_COLORS = {
  EMI: "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
  Savings: "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
  Bill: "bg-cyan-50 border-cyan-100 text-cyan-700 dark:bg-cyan-950/20 dark:border-cyan-900/30 dark:text-cyan-400",
  Tax: "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
  General: "bg-gray-50 border-gray-100 text-gray-700 dark:bg-gray-800/40 dark:border-gray-700/30 dark:text-gray-400",
  Consultation: "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
  Preparation: "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
  FollowUp: "bg-cyan-50 border-cyan-100 text-cyan-700 dark:bg-cyan-950/20 dark:border-cyan-900/30 dark:text-cyan-400",
  Admin: "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
};

const CATEGORY_ICONS = {
  EMI: "🏦",
  Savings: "🐷",
  Bill: "⚡",
  Tax: "📄",
  General: "🎯",
  Consultation: "📅",
  Preparation: "📝",
  FollowUp: "🔄",
  Admin: "📄"
};

export default function RemindersView({ userId, onToggleSidebar, onToggleInsights, onOpenFinancialWellnessAssistant }: RemindersViewProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}:${userId || "anonymous"}`;
  
  const checkIsAdvisor = () => {
    try {
      const storedSession = localStorage.getItem("finheal-auth-session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed?.isAdvisor) return true;
        if (parsed?.email) {
          const email = parsed.email.toLowerCase();
          const defaultEmails = ["sneha@finheal.com", "aradhya@finheal.com", "vikram@finheal.com", "rohan@finheal.com", "priya@finheal.com"];
          if (defaultEmails.includes(email)) return true;
        }
      }
    } catch (e) {}
    return false;
  };
  const isAdvisor = checkIsAdvisor();

  const [advisorAppointments, setAdvisorAppointments] = useState<any[]>([]);
  useEffect(() => {
    if (!isAdvisor) return;
    async function loadAdvisorAppts() {
      try {
        const storedSession = localStorage.getItem("finheal-auth-session");
        const parsed = storedSession ? JSON.parse(storedSession) : null;
        const advId = parsed?.f2FintechId || parsed?.userId || userId;
        if (advId) {
          const appts = await fetchAdvisorAppointments(advId);
          setAdvisorAppointments(appts || []);
        }
      } catch (e) {
        console.error("Failed to load appointments in RemindersView", e);
      }
    }
    loadAdvisorAppts();
  }, [userId, isAdvisor]);

  // State for reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  // State for client appointments
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (isAdvisor) return;
    const apptsKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
    const loadAppts = () => {
      try {
        const stored = localStorage.getItem(apptsKey);
        if (stored) {
          setClientAppointments(JSON.parse(stored));
        } else {
          setClientAppointments([]);
        }
      } catch (e) {
        console.error("Failed to load client appointments in RemindersView", e);
      }
    };
    loadAppts();
    window.addEventListener("storage", loadAppts);
    window.addEventListener("finheal:advisors_update" as any, loadAppts);
    return () => {
      window.removeEventListener("storage", loadAppts);
      window.removeEventListener("finheal:advisors_update" as any, loadAppts);
    };
  }, [userId, isAdvisor]);

  const combinedReminders = useMemo(() => {
    const list = [...reminders];
    
    if (!isAdvisor) {
      clientAppointments.forEach(appt => {
        const parseApptDateToISO = (dateStr: string): string => {
          if (!dateStr) return "";
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          
          try {
            const parts = dateStr.trim().split(/\s+/);
            if (parts.length >= 2) {
              const monthName = parts[0];
              const dayNum = parseInt(parts[1], 10);
              
              const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const monthIdx = monthsShort.indexOf(monthName);
              if (monthIdx !== -1 && !isNaN(dayNum)) {
                const year = new Date().getFullYear();
                return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              }
            }
          } catch (e) {}
          return dateStr;
        };

        const isoDate = parseApptDateToISO(appt.date);
        
        list.push({
          id: appt.id || `appt-${appt.advisorId}-${appt.date}-${appt.time}`,
          title: `Consultation with Advisor ${appt.advisorName}`,
          category: "Consultation",
          dueDate: isoDate,
          dueTime: appt.time,
          priority: "high",
          frequency: "one-time",
          notes: appt.notes || `Google Meet link: ${appt.meetUrl || "Pending"}`,
          completed: appt.completed || false,
          isAppointment: true,
          meetUrl: appt.meetUrl
        } as any);
      });
    }
    
    return list;
  }, [reminders, clientAppointments, isAdvisor]);

  const upcomingCalls = useMemo(() => {
    if (isAdvisor) {
      return advisorAppointments.filter(a => !a.completed && !a.cancelled);
    } else {
      return clientAppointments.filter(a => !a.completed && !a.cancelled);
    }
  }, [isAdvisor, advisorAppointments, clientAppointments]);
  
  // State for UI filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // State for Add/Edit Form Panel
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<"EMI" | "Savings" | "Bill" | "Tax" | "General" | "Consultation" | "Preparation" | "FollowUp" | "Admin">("General");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("");
  const [formPriority, setFormPriority] = useState<"high" | "medium" | "low">("medium");
  const [formFrequency, setFormFrequency] = useState<"one-time" | "weekly" | "monthly" | "yearly">("one-time");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Load reminders on mount / userId change
  useEffect(() => {
    const loadReminders = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        let parsed = raw ? JSON.parse(raw) : null;
        
        // Re-seed if user is advisor but only client reminders exist
        if (parsed && isAdvisor && parsed.some((r: any) => r.id && r.id.startsWith("default-"))) {
          parsed = null;
        }
        // Re-seed if user is client but only advisor reminders exist
        if (parsed && !isAdvisor && parsed.some((r: any) => r.id && r.id.startsWith("advisor-default-"))) {
          parsed = null;
        }

        if (parsed) {
          setReminders(parsed);
        } else {
          // Pre-populate with beautiful default reminders
          const today = new Date();
          const formatDate = (daysOffset: number) => {
            const d = new Date();
            d.setDate(today.getDate() + daysOffset);
            return d.toISOString().split("T")[0];
          };
          
          const defaults: Reminder[] = isAdvisor ? [
            {
              id: "advisor-default-1",
              title: "Prepare notes for client consultation",
              category: "Preparation",
              dueDate: formatDate(0), // Today
              priority: "high",
              frequency: "one-time",
              notes: "Review client's CIBIL score and financial goals before joining the call.",
              completed: false
            },
            {
              id: "advisor-default-2",
              title: "Follow up with client on debt action plan",
              category: "FollowUp",
              dueDate: formatDate(3),
              priority: "medium",
              frequency: "weekly",
              notes: "Send the updated debt repayment schedule to client.",
              completed: false
            },
            {
              id: "advisor-default-3",
              title: "Attend weekly performance review",
              category: "Consultation",
              dueDate: formatDate(5),
              priority: "high",
              frequency: "weekly",
              notes: "Sync with the manager on recent consultation ratings and reviews.",
              completed: false
            },
            {
              id: "advisor-default-4",
              title: "Configure next week slots availability",
              category: "Admin",
              dueDate: formatDate(10),
              priority: "low",
              frequency: "weekly",
              notes: "Open slots for the next calendar block in the portal.",
              completed: true
            }
          ] : [
            {
              id: "default-1",
              title: "Pay Personal Loan EMI",
              category: "EMI",
              amount: 15400,
              dueDate: formatDate(0), // Today
              priority: "high",
              frequency: "monthly",
              notes: "EMI auto-debit from primary savings account. Check balance.",
              completed: false
            },
            {
              id: "default-2",
              title: "Check credit score update on CIBIL Checker",
              category: "General",
              dueDate: formatDate(3),
              priority: "medium",
              frequency: "monthly",
              notes: "Keep score above 750 to guarantee best lending rates.",
              completed: false
            },
            {
              id: "default-3",
              title: "Deposit monthly mutual fund SIP",
              category: "Savings",
              amount: 5000,
              dueDate: formatDate(5),
              priority: "high",
              frequency: "monthly",
              notes: "Investing regularly creates long-term financial security.",
              completed: false
            },
            {
              id: "default-4",
              title: "Review monthly therapy budget allocation",
              category: "General",
              dueDate: formatDate(10),
              priority: "low",
              frequency: "monthly",
              notes: "Balanced budget ensures emotional and economic ease.",
              completed: true
            }
          ];
          setReminders(defaults);
          localStorage.setItem(storageKey, JSON.stringify(defaults));
        }
      } catch (e) {
        console.error("Failed to load reminders", e);
      }
    };

    loadReminders();
    
    window.addEventListener("storage", loadReminders);
    return () => {
      window.removeEventListener("storage", loadReminders);
    };
  }, [userId, storageKey, isAdvisor]);

  // Save reminders to localStorage
  const saveToStorage = (updatedReminders: Reminder[]) => {
    setReminders(updatedReminders);
    localStorage.setItem(storageKey, JSON.stringify(updatedReminders));
  };

  // Helper: date relative label
  const getDateLabel = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0,0,0,0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, status: "overdue" };
    } else if (diffDays === 0) {
      return { text: "Due Today", status: "today" };
    } else if (diffDays === 1) {
      return { text: "Due Tomorrow", status: "tomorrow" };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, status: "soon" };
    } else {
      return { text: dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), status: "future" };
    }
  };

  // Toggle completed status
  const handleToggleComplete = (id: string) => {
    const appt = clientAppointments.find(a => (a.id || `appt-${a.advisorId}-${a.date}-${a.time}`) === id);
    if (appt) {
      const updated = clientAppointments.map(a => {
        const matchId = (a.id || `appt-${a.advisorId}-${a.date}-${a.time}`) === id;
        return matchId ? { ...a, completed: !a.completed } : a;
      });
      setClientAppointments(updated);
      localStorage.setItem(`finheal_advisor_appointments:${userId || "anonymous"}`, JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("finheal:advisors_update"));
      return;
    }

    const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    saveToStorage(updated);
  };

  // Delete reminder
  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    saveToStorage(updated);
    if (editingReminder?.id === id) {
      handleCloseForm();
    }
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingReminder(null);
    setFormTitle("");
    setFormCategory("General");
    setFormAmount("");
    setFormDueDate(new Date().toISOString().split("T")[0]);
    setFormDueTime("");
    setFormPriority("medium");
    setFormFrequency("one-time");
    setFormNotes("");
    setFormError("");
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormTitle(reminder.title);
    setFormCategory(reminder.category);
    setFormAmount(reminder.amount?.toString() || "");
    setFormDueDate(reminder.dueDate);
    setFormDueTime(reminder.dueTime || "");
    setFormPriority(reminder.priority);
    setFormFrequency(reminder.frequency);
    setFormNotes(reminder.notes || "");
    setFormError("");
    setIsFormOpen(true);
  };

  // Close Form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReminder(null);
    setFormError("");
  };

  // Save / Update Form Submission
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formDueDate) {
      setFormError("Due date is required.");
      return;
    }

    const numericAmount = formAmount.trim() ? parseFloat(formAmount) : undefined;
    if (numericAmount !== undefined && (isNaN(numericAmount) || numericAmount < 0)) {
      setFormError("Amount must be a valid positive number.");
      return;
    }

    if (editingReminder) {
      // Edit
      const updated = reminders.map(r => 
        r.id === editingReminder.id 
          ? {
              ...r,
              title: formTitle.trim(),
              category: formCategory,
              amount: numericAmount,
              dueDate: formDueDate,
              dueTime: formDueTime.trim() || undefined,
              priority: formPriority,
              frequency: formFrequency,
              notes: formNotes.trim() || undefined
            }
          : r
      );
      saveToStorage(updated);
    } else {
      // Add
      const newReminder: Reminder = {
        id: `reminder-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        amount: numericAmount,
        dueDate: formDueDate,
        dueTime: formDueTime.trim() || undefined,
        priority: formPriority,
        frequency: formFrequency,
        notes: formNotes.trim() || undefined,
        completed: false
      };
      saveToStorage([...reminders, newReminder]);
    }
    handleCloseForm();
  };

  // Quick-Add templates click handler
  const handleQuickAdd = (title: string, category: Reminder["category"], amount?: number, daysOffset = 3) => {
    const today = new Date();
    today.setDate(today.getDate() + daysOffset);
    const dueDate = today.toISOString().split("T")[0];

    const newReminder: Reminder = {
      id: `reminder-${Date.now()}`,
      title,
      category,
      amount,
      dueDate,
      priority: "medium",
      frequency: isAdvisor ? "one-time" : "monthly",
      completed: false
    };
    saveToStorage([...reminders, newReminder]);
  };

  // Memoized lists & counts
  const filteredReminders = useMemo(() => {
    return combinedReminders.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" ? true :
                            statusFilter === "completed" ? r.completed :
                            !r.completed;
      
      const matchesCategory = categoryFilter === "all" ? true :
                              r.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
      // Sort by status first (uncompleted first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Then sort by due date ascending
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [combinedReminders, searchQuery, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = combinedReminders.length;
    const completed = combinedReminders.filter(r => r.completed).length;
    const active = total - completed;
    
    // Count overdue
    const todayStr = new Date().toISOString().split("T")[0];
    const overdue = combinedReminders.filter(r => !r.completed && r.dueDate < todayStr).length;
    
    // Count due today
    const dueToday = combinedReminders.filter(r => !r.completed && r.dueDate === todayStr).length;
    
    // Calculate total due amount for active reminders
    const activeRemindersWithAmount = combinedReminders.filter(r => !r.completed && r.amount !== undefined);
    const totalDueAmount = activeRemindersWithAmount.reduce((sum, r) => sum + (r.amount || 0), 0);
    const dueCount = activeRemindersWithAmount.length;

    return { total, active, completed, overdue, dueToday, totalDueAmount, dueCount };
  }, [combinedReminders]);

  const nextConsultation = useMemo(() => {
    if (!isAdvisor || advisorAppointments.length === 0) return null;
    const upcoming = advisorAppointments
      .filter(a => !a.completed && !a.cancelled)
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [isAdvisor, advisorAppointments]);

  return (
    <main className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-gray-50 rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100 dark:bg-slate-900 dark:border-slate-800">
      
      {/* View Header */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/95 shrink-0">
        <div className="flex items-center gap-3 px-[16px] py-[14px] sm:px-[20px] sm:py-[12px]">
          <button 
            type="button" 
            onClick={onToggleSidebar} 
            className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" 
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-gray-900 sm:text-[15px] dark:text-slate-100 flex items-center gap-2">
              <span className="text-[17px]">🔔</span> Reminders & Alerts
            </div>
            <div className="text-[10px] text-gray-400 sm:text-[11px] dark:text-slate-400 truncate">
              {isAdvisor ? "Set and track consultation tasks, client follow-ups, and advisory preparation schedules." : "Set and track recurring payments, savings allocations, and wellness diagnostics."}
            </div>
          </div>
          
          <button 
            onClick={handleOpenAdd}
            className="h-[32px] px-[12px] bg-primary text-white text-[12px] font-semibold rounded-[8px] flex items-center gap-[6px] cursor-pointer shadow-sm hover:bg-[#1e2db8] transition-colors shrink-0"
          >
            <Plus size={14} /> Add Reminder
          </button>

          <button 
            type="button" 
            onClick={onToggleInsights} 
            className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0 dark:bg-slate-800 dark:text-slate-200" 
            aria-label="Toggle insights panel"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Main Scrollable Dashboard */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[16px] space-y-[18px] sm:px-[20px] sm:py-[20px]">
        
        {/* KPI Stats cards */}
        <div className="grid grid-cols-2 gap-[10px] md:grid-cols-3 xl:grid-cols-5">
          <div className="bg-white rounded-[16px] border border-gray-100 p-[12px_14px] flex items-center gap-[12px] shadow-[0_4px_16px_rgba(15,23,42,0.03)] dark:bg-slate-950 dark:border-slate-800">
            <div className="w-[36px] h-[36px] bg-blue-50 text-blue-600 rounded-[10px] flex items-center justify-center dark:bg-blue-950/20 dark:text-blue-400 shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Active</div>
              <div className="text-[20px] font-bold text-gray-800 dark:text-slate-200 leading-none mt-[2px]">{stats.active}</div>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("pending")}
            className="bg-white rounded-[16px] border border-gray-100 p-[12px_14px] flex items-center gap-[12px] shadow-[0_4px_16px_rgba(15,23,42,0.03)] cursor-pointer hover:border-rose-200 transition-colors dark:bg-slate-950 dark:border-slate-800"
          >
            <div className="w-[36px] h-[36px] bg-rose-50 text-rose-600 rounded-[10px] flex items-center justify-center dark:bg-rose-950/20 dark:text-rose-400 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Overdue</div>
              <div className={`text-[20px] font-bold leading-none mt-[2px] ${stats.overdue > 0 ? "text-rose-600" : "text-gray-800 dark:text-slate-200"}`}>{stats.overdue}</div>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("pending")}
            className="bg-white rounded-[16px] border border-gray-100 p-[12px_14px] flex items-center gap-[12px] shadow-[0_4px_16px_rgba(15,23,42,0.03)] cursor-pointer hover:border-amber-200 transition-colors dark:bg-slate-950 dark:border-slate-800"
          >
            <div className="w-[36px] h-[36px] bg-amber-50 text-amber-600 rounded-[10px] flex items-center justify-center dark:bg-amber-950/20 dark:text-amber-400 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Due Today</div>
              <div className={`text-[20px] font-bold leading-none mt-[2px] ${stats.dueToday > 0 ? "text-amber-600" : "text-gray-800 dark:text-slate-200"}`}>{stats.dueToday}</div>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-gray-100 p-[12px_14px] flex items-center gap-[12px] shadow-[0_4px_16px_rgba(15,23,42,0.03)] dark:bg-slate-950 dark:border-slate-800">
            <div className="w-[36px] h-[36px] bg-indigo-50 text-indigo-600 rounded-[10px] flex items-center justify-center dark:bg-indigo-950/20 dark:text-indigo-400 shrink-0">
              {isAdvisor ? <Calendar size={18} /> : <IndianRupee size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider truncate">
                {isAdvisor ? "Next Client Call" : "Total Amount Due"}
              </div>
              <div className="text-[13px] font-bold text-gray-800 dark:text-slate-200 leading-tight truncate mt-[2px]">
                {isAdvisor 
                  ? (nextConsultation ? `${nextConsultation.date} ${nextConsultation.time}` : "No upcoming call") 
                  : (stats.totalDueAmount > 0 ? `₹${stats.totalDueAmount.toLocaleString("en-IN")}` : "—")
                }
              </div>
              {isAdvisor 
                ? (nextConsultation && (
                  <div className="text-[9px] text-primary truncate mt-[1px]">
                    Client: {nextConsultation.clientName ? `${nextConsultation.clientName} (${nextConsultation.clientEmail})` : (nextConsultation.clientEmail || nextConsultation.userId)}
                  </div>
                ))
                : (
                  <div className="text-[8px] text-gray-400 dark:text-slate-500 truncate mt-[1px]">
                    {stats.dueCount > 0 ? `Across ${stats.dueCount} active reminder${stats.dueCount > 1 ? "s" : ""}` : "No pending payments"}
                  </div>
                )
              }
            </div>
          </div>

          {/* 5th Card: Scheduled Calls */}
          <div className="bg-white rounded-[16px] border border-gray-100 p-[12px_14px] flex items-center gap-[12px] shadow-[0_4px_16px_rgba(15,23,42,0.03)] dark:bg-slate-950 dark:border-slate-800">
            <div className="w-[36px] h-[36px] bg-[#eef0fd] text-primary rounded-[10px] flex items-center justify-center dark:bg-indigo-950/20 dark:text-indigo-400 shrink-0">
              <Calendar size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider truncate">Scheduled Calls</div>
              <div className="text-[20px] font-bold text-gray-800 dark:text-slate-200 leading-none mt-[2px]">{upcomingCalls.length}</div>
              {upcomingCalls.length > 0 && (
                <div className="text-[9px] text-primary truncate mt-[1.5px] font-medium">
                  {upcomingCalls[0].time} ({upcomingCalls[0].date.split(" ")[0]})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic reminder layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[18px]">
          
          {/* Left panel: Filters and Reminders List (2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-[12px]">
            
            {/* Search and Filters box */}
            <div className="bg-white rounded-[16px] border border-gray-100 p-[12px_14px] shadow-[0_4px_16px_rgba(15,23,42,0.02)] space-y-[10px] dark:bg-slate-950 dark:border-slate-800">
              
              <div className="flex flex-col sm:flex-row gap-[8px]">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-[12px] top-[11px] text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reminders..."
                    className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-[10px] pl-[34px] pr-[12px] py-[7px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                  />
                </div>
                
                {/* Category Select */}
                <div className="relative shrink-0">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full sm:w-[130px] bg-gray-50 text-gray-700 border border-gray-200 rounded-[10px] px-[10px] py-[7px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:focus:bg-slate-950"
                  >
                    <option value="all">All Categories</option>
                    {isAdvisor ? (
                      <>
                        <option value="Preparation">Preparation</option>
                        <option value="FollowUp">FollowUp</option>
                        <option value="Consultation">Consultation</option>
                        <option value="Admin">Admin</option>
                        <option value="General">General</option>
                      </>
                    ) : (
                      <>
                        <option value="EMI">EMI</option>
                        <option value="Savings">Savings</option>
                        <option value="Bill">Bill</option>
                        <option value="Tax">Tax</option>
                        <option value="General">General</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Status Filter tabs */}
              <div className="flex border-b border-gray-100 dark:border-slate-800">
                {(["all", "pending", "completed"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`pb-[6px] px-[12px] text-[12px] font-semibold border-b-[2px] transition-all capitalize -mb-[1px] cursor-pointer ${
                      statusFilter === tab 
                        ? "border-primary text-primary" 
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List block */}
            <div className="space-y-[10px]">
              {filteredReminders.length === 0 ? (
                <div className="bg-white rounded-[16px] border border-gray-100 p-[32px] text-center shadow-[0_4px_16px_rgba(15,23,42,0.02)] dark:bg-slate-950 dark:border-slate-800">
                  <div className="text-[28px] mb-[10px]">📭</div>
                  <div className="text-[13px] font-bold text-gray-700 dark:text-slate-300">No reminders found</div>
                  <div className="text-[11px] text-gray-400 mt-[2px] max-w-[280px] mx-auto leading-relaxed">
                    Try adjusting your filters, searching for something else, or create a new reminder.
                  </div>
                </div>
              ) : (
                filteredReminders.map(rem => {
                  const dateInfo = getDateLabel(rem.dueDate);
                  
                  return (
                    <div 
                      key={rem.id}
                      className={`bg-white rounded-[16px] border border-gray-100 p-[12px_14px] flex gap-[12px] items-start shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all hover:shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:bg-slate-950 dark:border-slate-800 ${
                        rem.completed ? "opacity-60" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(rem.id)}
                        className={`w-[20px] h-[20px] rounded-full border-[1.5px] mt-[3px] flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          rem.completed 
                            ? "bg-primary border-primary text-white" 
                            : "border-gray-300 hover:border-primary hover:bg-[#f6f7fe]"
                        }`}
                        aria-label={rem.completed ? "Mark pending" : "Mark completed"}
                      >
                        {rem.completed && <Check size={12} strokeWidth={3} />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-[4px]">
                        <div className="flex items-center gap-[6px] flex-wrap">
                          {/* Title */}
                          <span 
                            onClick={() => handleOpenEdit(rem)}
                            className={`text-[13.5px] font-semibold text-gray-800 dark:text-slate-200 cursor-pointer hover:text-primary hover:underline truncate ${
                              rem.completed ? "line-through text-gray-400 dark:text-slate-500" : ""
                            }`}
                          >
                            {rem.title}
                          </span>

                          {/* Priority Badge */}
                          {!rem.completed && (
                            <span className={`text-[8.5px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded-[4px] leading-none shrink-0 ${
                              rem.priority === "high" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400" :
                              rem.priority === "medium" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" :
                              "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            }`}>
                              {rem.priority}
                            </span>
                          )}
                        </div>

                        {/* Detail parameters row */}
                        <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[4px] text-[11px] text-gray-400 dark:text-slate-500">
                          {/* Category */}
                          <span className={`inline-flex items-center gap-[3px] px-[8px] py-[2px] rounded-full text-[10px] border leading-none font-medium ${CATEGORY_COLORS[rem.category]}`}>
                            <span>{CATEGORY_ICONS[rem.category]}</span>
                            <span>{rem.category}</span>
                          </span>

                          {/* Due Date Indicator */}
                          <span className={`flex items-center gap-[3px] font-medium leading-none ${
                            rem.completed ? "text-gray-400 dark:text-slate-500" :
                            dateInfo.status === "overdue" ? "text-rose-600 font-semibold" :
                            dateInfo.status === "today" ? "text-amber-600 font-semibold animate-pulse" :
                            dateInfo.status === "tomorrow" ? "text-amber-600" :
                            "text-gray-500 dark:text-slate-400"
                          }`}>
                            <Calendar size={11} /> {dateInfo.text} {rem.dueTime && `at ${rem.dueTime}`}
                          </span>

                          {/* Amount */}
                          {rem.amount !== undefined && (
                            <span className="font-semibold text-gray-600 dark:text-slate-400 leading-none">
                              ₹{rem.amount.toLocaleString("en-IN")}
                            </span>
                          )}

                          {/* Frequency */}
                          {rem.frequency !== "one-time" && (
                            <span className="italic text-[10.5px] leading-none">
                              ({rem.frequency})
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {rem.notes && (
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed pt-[2px] border-l-[2px] border-gray-100 pl-[6px] dark:border-slate-800">
                            {rem.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-[4px] shrink-0 self-center">
                        {rem.isAppointment ? (
                          rem.meetUrl && !rem.completed && (
                            <a
                              href={rem.meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold bg-primary text-white px-2.5 py-1.5 rounded-[8px] hover:bg-[#1e2db8] transition-colors shrink-0 whitespace-nowrap cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              🚀 Join Call
                            </a>
                          )
                        ) : (
                          <button
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="h-[28px] w-[28px] hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-[6px] flex items-center justify-center transition-all cursor-pointer dark:hover:bg-rose-950/20"
                            title="Delete reminder"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right panel: Templates & Educational/Motivational Banner */}
          <div className="space-y-[18px] lg:col-span-1">
            
            {/* Quick Add Templates */}
            <div className="bg-white rounded-[16px] border border-gray-100 p-[14px] shadow-[0_4px_16px_rgba(15,23,42,0.02)] space-y-[10px] dark:bg-slate-950 dark:border-slate-800">
              <div className="text-[11.5px] font-bold text-gray-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-[4px]">
                ⚡ Quick Templates
              </div>
              <p className="text-[10.5px] text-gray-400 leading-relaxed dark:text-slate-500">
                Click to add default tasks directly to your active list:
              </p>
              
              <div className="grid gap-[8px]">
                {isAdvisor ? (
                  <>
                    <button
                      onClick={() => handleQuickAdd("Review upcoming client profile and notes", "Preparation", undefined, 0)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>📝 Review Client Profile</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => handleQuickAdd("Handle client reschedule request details", "FollowUp", undefined, 2)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>🔄 Reschedule Request</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => handleQuickAdd("Weekly consultation sync with manager", "Consultation", undefined, 5)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>📅 Weekly Performance Sync</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => handleQuickAdd("Verify calendar availability work slots", "Admin", undefined, 7)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>📄 Configure Work Slots</span>
                      <ArrowRight size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleQuickAdd("Check credit report on CIBIL Checker", "General", undefined, 3)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>🔍 Check Credit Score</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => handleQuickAdd("Pay credit card monthly balance", "Bill", 4500, 2)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>💳 Credit Card Balance</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => handleQuickAdd("Deposit monthly savings / SIP", "Savings", 2000, 5)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>🐷 Monthly Mutual Fund SIP</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => handleQuickAdd("Submit Income Tax documents", "Tax", undefined, 14)}
                      className="w-full text-left p-[8px_10px] bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-[10px] text-[11.5px] font-medium text-gray-600 hover:text-primary transition-all cursor-pointer flex justify-between items-center dark:bg-slate-900 dark:text-slate-300"
                    >
                      <span>📄 Tax Document Filing</span>
                      <ArrowRight size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Motivational/Empathy Owl Advice Card */}
            <div className="bg-gradient-to-br from-primary to-[#4a5cf0] text-white rounded-[16px] p-[16px] relative overflow-hidden shadow-[0_8px_24px_rgba(50,68,230,0.22)]">
              <div className="absolute -right-[20px] -bottom-[20px] w-[80px] h-[80px] rounded-full bg-white/10" />
              <div className="relative z-10 flex gap-[12px] items-start">
                <div className="w-[38px] h-[38px] bg-white rounded-full flex items-center justify-center shrink-0 shadow-md">
                  <span className="text-[20px]">🦉</span>
                </div>
                <div className="space-y-[4px]">
                  <div className="text-[10px] font-semibold text-white/70 tracking-wider uppercase">
                    {isAdvisor ? "Advisor Wisdom" : "FinHeal Wisdom"}
                  </div>
                  <div className="text-[12.5px] font-bold flex items-center gap-[4px]">
                    {isAdvisor ? "Empathy & Guidance" : "Discipline = Freedom"} <Sparkles size={13} className="text-amber-300" />
                  </div>
                  <p className="text-[11px] text-white/80 leading-relaxed pt-[2px]">
                    {isAdvisor 
                      ? '"A great advisory session starts with active listening. Take 5 minutes to review client notes and goals before joining a call to deliver highly personalized support."'
                      : '"Paying your debts on time keeps your credit score steady and minimizes money anxiety. Use these reminders to create a calm, organized rhythm for your wallet."'
                    }
                  </p>
                  {!isAdvisor && onOpenFinancialWellnessAssistant && (
                    <button 
                      onClick={onOpenFinancialWellnessAssistant}
                      className="mt-[6px] inline-flex items-center gap-[4px] text-[10.5px] font-semibold bg-white/20 hover:bg-white/35 px-[8px] py-[4px] rounded-[6px] transition-all cursor-pointer"
                    >
                      Talk budget with FinHeal →
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Add / Edit Slide-Over Panel Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          {/* Click outside to close */}
          <div className="flex-1" onClick={handleCloseForm} />
          
          {/* Panel */}
          <div className="bg-white w-full max-w-[420px] h-full shadow-[0_24px_80px_rgba(15,23,42,0.2)] flex flex-col p-[24px] animate-slide-left dark:bg-slate-950 dark:border-l dark:border-slate-800">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-[16px] border-b border-gray-100 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-slate-100">
                  {editingReminder ? "Edit Reminder" : "New Reminder"}
                </h2>
                <p className="text-[10px] text-gray-400 mt-[1px]">
                  {editingReminder ? "Modify existing task details." : "Create a new custom alert."}
                </p>
              </div>
              <button 
                onClick={handleCloseForm}
                className="h-[28px] w-[28px] hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-all cursor-pointer dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mt-[12px] bg-rose-50 border border-rose-100 rounded-[10px] p-[10px] text-[11.5px] text-rose-600 font-semibold flex items-center gap-[6px]">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSaveReminder} className="flex-1 overflow-y-auto py-[16px] space-y-[14px]">
              {/* Title */}
              <div>
                <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Reminder Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Pay credit card bill"
                  className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                  required
                />
              </div>

              {/* Grid: Category, Due Date, and Due Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px]">
                {/* Category */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                  >
                    {isAdvisor ? (
                      <>
                        <option value="Preparation">📝 Prep</option>
                        <option value="FollowUp">🔄 Follow-Up</option>
                        <option value="Consultation">📅 Call</option>
                        <option value="Admin">📄 Admin</option>
                        <option value="General">🎯 General</option>
                      </>
                    ) : (
                      <>
                        <option value="EMI">🏦 EMI</option>
                        <option value="Savings">🐷 Savings</option>
                        <option value="Bill">⚡ Bill</option>
                        <option value="Tax">📄 Tax</option>
                        <option value="General">🎯 General</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Due Date *</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                    required
                  />
                </div>

                {/* Due Time */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Due Time</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                  />
                </div>
              </div>

              {/* Grid: Amount and Priority */}
              <div className="grid grid-cols-2 gap-[10px]">
                {/* Amount (Optional) */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Amount (optional)</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="₹ 0.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Frequency</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                >
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-[4px]">Additional Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Details, account numbers, or advice notes..."
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-[10px] py-[8px] text-[12.5px] outline-none focus:border-primary focus:bg-white transition-all resize-y dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:bg-slate-950"
                />
              </div>
            </form>

            {/* Footer actions */}
            <div className="pt-[16px] border-t border-gray-100 flex gap-[10px] shrink-0 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex-1 py-[10px] border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-[10px] cursor-pointer hover:bg-gray-50 transition-all dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReminder}
                className="flex-1 py-[10px] bg-primary text-white text-[13px] font-semibold rounded-[10px] cursor-pointer hover:bg-[#1e2db8] transition-all"
              >
                {editingReminder ? "Save Changes" : "Create Reminder"}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
