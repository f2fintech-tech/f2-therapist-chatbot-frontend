import { useState, useEffect } from "react";
import { useGetWellnessScore, useGetUserGoals } from "@workspace/api-client-react";
import type { UserProfile } from "@/utils/user";
import { listUserGoals, createGoal, deleteGoal, updateGoal } from "@/utils/localGoals";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Goal } from "@/utils/localGoals";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SidebarProps {
  userId: string;
  userProfile: UserProfile;
  userEmail?: string;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
  onStartNewChat: () => void;
  onOpenFinancialHealthTests: () => void;
  onOpenProfile: () => void;
  onOpenEducation?: () => void;
  onOpenAdvisor?: () => void;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  initialActiveNav: string;
  onSelectMood?: (moodEmoji: string, moodTitle: string) => void;
  onOpenLoanCalculator?: () => void;
  onOpenEligibilityCibil?: () => void;
  onOpenDashboard?: () => void;
  onOpenReminders?: () => void;
}

export default function Sidebar({ userId, userProfile, userEmail, sessionId, isOpen, onClose, onOpenChat, onStartNewChat, onOpenFinancialHealthTests, onOpenProfile, onOpenEducation, onOpenAdvisor, onOpenAdmin, onLogout, initialActiveNav, onSelectMood, onOpenLoanCalculator, onOpenEligibilityCibil, onOpenDashboard, onOpenReminders }: SidebarProps) {
  const [activeMood, setActiveMood] = useState("😐");
  const [activeNav, setActiveNav] = useState(initialActiveNav);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currency: "₹",
    icon: "🎯",
    color: "#3344e6",
  });

  const { data: wellnessData } = useGetWellnessScore(userId);
  const changePoints = wellnessData?.change_pts ?? 0;

  // Load goals from localStorage and re-read whenever they change (e.g. backend sync)
  useEffect(() => {
    const userGoals = listUserGoals(userId);
    setGoals(userGoals);

    const handleGoalsUpdated = () => {
      setGoals(listUserGoals(userId));
    };
    window.addEventListener("finheal:goals-updated", handleGoalsUpdated);
    return () => window.removeEventListener("finheal:goals-updated", handleGoalsUpdated);
  }, [userId]);

  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem("finheal-auth-session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        setUserPermissions(parsed?.permissions || []);
      } else {
        setUserPermissions([]);
      }
    } catch (e) {
      setUserPermissions([]);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    const staff = (typeof isUserAdvisor === 'function' ? isUserAdvisor(userEmail) : false) || (userEmail && ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase()));
    if (staff && initialActiveNav === "Financial Goals") {
      setActiveNav("Talk to FinHeal");
    } else {
      setActiveNav(initialActiveNav);
    }
  }, [initialActiveNav, userEmail]);

  // Typewriter subtitle for "Financial Wellness AI" — continuous loop (type → pause → delete → pause)
  const fullSubtitle = "Financial Wellness AI";
  const [typedSubtitle, setTypedSubtitle] = useState("");
  useEffect(() => {
    let mounted = true;
    let index = 0;
    let forward = true;
    const typeDelay = 45; // ms per character when typing
    const deleteDelay = 30; // ms per character when deleting
    const pauseAfterFull = 900; // pause once full string typed
    const pauseAfterEmpty = 400; // pause once fully deleted
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const step = () => {
      if (!mounted) return;
      if (forward) {
        if (index <= fullSubtitle.length - 1) {
          setTypedSubtitle(fullSubtitle.slice(0, index + 1));
          index += 1;
          timeoutId = setTimeout(step, typeDelay);
        } else {
          forward = false;
          timeoutId = setTimeout(step, pauseAfterFull);
        }
      } else {
        if (index > 0) {
          setTypedSubtitle(fullSubtitle.slice(0, index - 1));
          index -= 1;
          timeoutId = setTimeout(step, deleteDelay);
        } else {
          forward = true;
          timeoutId = setTimeout(step, pauseAfterEmpty);
        }
      }
    };

    // kick off after a short initial delay
    timeoutId = setTimeout(step, 200);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  // run once on mount
  }, []);

  const handleCreateGoal = () => {
    if (!formData.name.trim() || !formData.targetAmount.trim()) {
      alert("Please fill in goal name and target amount");
      return;
    }
    const goal = createGoal(userId, formData.name, parseFloat(formData.targetAmount), formData.currency, formData.color, formData.icon);
    setGoals([...goals, goal]);
    setFormData({ name: "", targetAmount: "", currency: "$", icon: "🎯", color: "#3344e6" });
    setShowGoalForm(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    // open confirmation dialog instead of immediate delete
    setGoalIdToDelete(goalId);
    setIsDeleteDialogOpen(true);
  };

  // confirmation dialog state for goal deletion
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);

  // edit goal state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    targetAmount: "",
  });

  const handleConfirmDelete = () => {
    if (!goalIdToDelete) return;
    deleteGoal(goalIdToDelete);
    setGoals(goals.filter(g => g.id !== goalIdToDelete));
    setIsDeleteDialogOpen(false);
    setGoalIdToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setGoalIdToDelete(null);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditFormData({
      targetAmount: goal.targetAmount.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEditGoal = () => {
    if (!editingGoalId) return;
    if (!editFormData.targetAmount.trim()) {
      alert("Please enter a target amount");
      return;
    }
    
    const targetAmount = parseFloat(editFormData.targetAmount);
    
    if (isNaN(targetAmount)) {
      alert("Please enter a valid number");
      return;
    }
    
    if (targetAmount <= 0) {
      alert("Target amount must be greater than 0");
      return;
    }
    
    updateGoal(editingGoalId, { targetAmount });
    const updatedGoals = goals.map(g => 
      g.id === editingGoalId 
        ? { ...g, targetAmount }
        : g
    );
    setGoals(updatedGoals);
    setIsEditDialogOpen(false);
    setEditingGoalId(null);
    setEditFormData({ targetAmount: "" });
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingGoalId(null);
    setEditFormData({ targetAmount: "" });
  };

  const handleOpenTalkToFinHeal = () => {
    setActiveNav("Talk to FinHeal");
    onStartNewChat();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const handleOpenFinancialHealthTests = () => {
    setActiveNav("Financial Health Test");
    onOpenFinancialHealthTests();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const handleOpenAdvisor = () => {
    setActiveNav("Talk to an Advisor");
    onOpenAdvisor?.();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const isUserAdvisor = (email?: string) => {
    if (email && ["admin@finheal.com", "admin@f2finheal.com"].includes(email.toLowerCase())) return false;
    try {
      const storedSession = localStorage.getItem("finheal-auth-session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed?.isAdvisor) return true;
      }
    } catch (e) {}

    if (!email) return false;
    const defaultEmails = ["sneha@finheal.com", "aradhya@finheal.com", "vikram@finheal.com", "rohan@finheal.com", "priya@finheal.com"];
    if (defaultEmails.includes(email.toLowerCase())) return true;

    const stored = localStorage.getItem("finheal_advisors_list");
    if (stored) {
      try {
        const list = JSON.parse(stored);
        return list.some((a: any) => 
          a.f2FintechId && (
            email.toLowerCase() === a.f2FintechId.toLowerCase() || 
            email.split("@")[0].toLowerCase() === a.f2FintechId.toLowerCase()
          ) && a.isAdvisor === true
        );
      } catch (e) {}
    }
    return false;
  };

  const isStaff = isUserAdvisor(userEmail) || (userEmail && ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase()));
  const isSuperAdmin = userEmail ? ["admin@finheal.com", "admin@f2finheal.com"].includes(userEmail.toLowerCase()) : false;

  const hasPermission = (perm: string) => {
    if (isSuperAdmin) return true;
    if (!isStaff) return true;
    try {
      const storedSession = localStorage.getItem("finheal-auth-session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed && !("permissions" in parsed)) {
          return true;
        }
      }
    } catch (e) {}
    return userPermissions.includes(perm);
  };

  const handleOpenAdmin = () => {
    setActiveNav(isUserAdvisor(userEmail) ? "Advisor Workspace" : "Admin Portal");
    onOpenAdmin?.();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const handleOpenLoanCalculator = () => {
    setActiveNav("Loan Calculator");
    onOpenLoanCalculator?.();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const handleOpenEligibilityCibil = () => {
    setActiveNav("Eligibility & CIBIL Checker");
    onOpenEligibilityCibil?.();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const handleOpenDashboard = () => {
    setActiveNav("My Dashboard");
    onOpenDashboard?.();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const handleOpenReminders = () => {
    setActiveNav("Reminders");
    onOpenReminders?.();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };

  const handleOpenEducation = () => {
    setActiveNav("Financial Education");
    onOpenEducation?.();

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      onClose();
    }
  };




  const moods = [
    { emoji: "😰", title: "Very Stressed", hoverText: "Stressed" },
    { emoji: "😟", title: "Anxious", hoverText: "Worried" },
    { emoji: "😐", title: "Neutral", hoverText: "Neutral" },
    { emoji: "🙂", title: "Okay", hoverText: "Calm & Happy" },
    { emoji: "😄", title: "Great", hoverText: "Energetic" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Mobile Drawer */}
      <aside className={`fixed left-0 top-0 bottom-0 w-[clamp(260px,85vw,268px)] bg-white rounded-[0_20px_20px_0] flex flex-col overflow-hidden shadow-lg border-r border-gray-200 z-40 transition-transform duration-300 lg:static lg:rounded-[20px] lg:w-[clamp(240px,18vw,280px)] lg:min-w-[240px] lg:max-w-[280px] lg:h-full lg:min-h-0 lg:shadow-sm lg:border lg:border-gray-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <button
        type="button"
        onClick={handleOpenTalkToFinHeal}
        className="w-full px-[16px] py-[18px] pb-[14px] flex items-center gap-[11px] border-b border-gray-100 text-left transition-colors hover:bg-gray-50 sm:px-[18px] sm:py-[20px] sm:pb-[16px]"
        aria-label="Start a new chat"
      >
        <div className="w-[38px] h-[38px] bg-primary rounded-[10px] flex items-center justify-center cursor-pointer text-[20px] shadow-[0_8px_24px_rgba(50,68,230,0.22)] shrink-0 relative overflow-hidden">
          <img src="/finheal-logo.gif" alt="F2 FinHeal" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }} />
          <div className="absolute -top-[10px] -right-[10px] w-[30px] h-[30px] bg-white/15 rounded-full" />
        </div>
        <div className="flex flex-col gap-[1px]">
          <div className="text-[15px] font-bold tracking-tight animated-gradient-text">F2 FinHeal</div>
          <div className="text-[10px] font-medium text-primary tracking-wide uppercase subtitle-container">
            <span className="subtitle-pulse">{typedSubtitle}</span>
          </div>
        </div>
      </button>

      {/* Wellness Score Card */}
      <div className="mx-[12px] my-[14px] bg-primary rounded-[14px] p-[16px] relative overflow-hidden cursor-pointer transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(50,68,230,0.22)] sm:p-[18px]">
        <div className="absolute -right-[20px] -bottom-[20px] w-[90px] h-[90px] rounded-full bg-white/10" />
        <div className="absolute right-[20px] bottom-[20px] w-[40px] h-[40px] rounded-full bg-white/5" />
        
        <div className="text-[9px] font-semibold text-white/65 tracking-[1.2px] uppercase mb-[6px]">Your Wellness Score</div>
        <div className="flex items-end gap-[6px] mb-[10px]">
          <div className="font-sans text-[42px] text-white leading-none font-bold tracking-tight">{wellnessData?.score || 0}</div>
          <div className="text-[14px] text-white/55 mb-[5px]">/ 100</div>
        </div>
        <div className="h-[3px] bg-white/20 rounded-[3px]">
          <div className="h-[3px] bg-white/90 rounded-[3px] transition-all duration-1000" style={{ width: `${wellnessData?.score || 0}%` }} />
        </div>
        <div className="flex flex-col gap-[6px] mt-[8px] sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] text-white/80">
            {wellnessData?.trend} <strong className="text-white">{changePoints > 0 ? '+' : ''}{changePoints} pts</strong> this week
          </div>
          <div className="text-[9px] font-semibold bg-white/20 text-white px-[8px] py-[3px] rounded-[20px] tracking-[0.5px] uppercase">{wellnessData?.label || "..."}</div>
        </div>
      </div>

      {/* Mood */}
      <div className="px-[12px] py-[12px] pb-[8px] sm:pb-[10px]">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.8px] mb-[8px]">How are you feeling today?</div>
        <TooltipProvider delayDuration={0}>
          <div className="flex justify-between gap-[4px]">
            {moods.map((m) => (
              <Tooltip key={m.emoji}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={m.title}
                    onClick={() => {
                      setActiveMood(m.emoji);
                      onSelectMood?.(m.emoji, m.title);
                    }}
                    className={`flex-1 h-[36px] rounded-[10px] border-[1.5px] text-[17px] flex items-center justify-center transition-all ${activeMood === m.emoji ? 'border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(50,68,230,0.1)]' : 'border-gray-200 bg-white hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:scale-105'}`}
                  >
                    {m.emoji}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={10}
                  className="rounded-[12px] border border-gray-200 bg-white px-[10px] py-[6px] text-[11px] font-medium text-gray-700 shadow-[0_12px_30px_rgba(17,24,39,0.12)]"
                >
                  {m.hoverText}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-[8px] pt-[8px] scrollbar-none xl:min-h-0">
        {activeNav === "Financial Goals" && !isStaff ? (
          // Goal Management View
          <div>
            <button
              onClick={() => setActiveNav("Talk to FinHeal")}
              className="text-[12px] text-primary font-semibold mb-[12px] hover:underline cursor-pointer"
            >
              ← Back
            </button>
            <div className="mb-[12px]">
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="w-full bg-primary text-white font-semibold py-[10px] rounded-[10px] hover:opacity-90 transition-opacity text-[13px] cursor-pointer"
              >
                {showGoalForm ? "Cancel" : "+ Add New Goal"}
              </button>
            </div>

            {showGoalForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-[12px] mb-[12px]">
                <div className="mb-[10px]">
                  <label className="text-[11px] font-semibold text-gray-700 block mb-[4px]">Goal Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Save for vacation"
                    className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[6px] text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-[8px] mb-[10px]">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-[4px]">Target Amount</label>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[6px] text-[12px] focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-[4px]">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[6px] text-[12px] focus:outline-none focus:border-primary"
                    >
                      <option>₹</option>
                      <option>$</option>
                      <option>€</option>
                      <option>£</option>
                      <option>¥</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-[8px] mb-[10px]">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-[4px]">Icon</label>
                    <select
                      value={formData.icon}
                      onChange={e => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-[8px] py-[6px] border border-gray-300 rounded-[6px] text-[12px] focus:outline-none focus:border-primary"
                    >
                      <option>🎯</option>
                      <option>🏠</option>
                      <option>✈️</option>
                      <option>🚗</option>
                      <option>🎓</option>
                      <option>💍</option>
                      <option>🏥</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-[4px]">Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-[32px] border border-gray-300 rounded-[6px] cursor-pointer"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateGoal}
                  className="w-full bg-primary text-white font-semibold py-[8px] rounded-[6px] hover:opacity-90 transition-opacity text-[12px]"
                >
                  Create Goal
                </button>
              </div>
            )}

            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.8px] mb-[8px]">Your Goals ({goals.length})</div>
            {goals.length === 0 ? (
              <div className="text-center py-[16px]">
                <div className="text-[11px] text-gray-400">No goals yet. Create your first goal!</div>
              </div>
            ) : (
              <div className="space-y-[8px]">
                {goals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="bg-gray-50 border border-gray-200 rounded-[8px] p-[10px]">
                      <div className="flex items-center justify-between mb-[6px]">
                        <div className="flex items-center gap-[6px]">
                          <span className="text-[16px]">{goal.icon}</span>
                          <span className="text-[12px] font-semibold text-gray-700 truncate">{goal.name}</span>
                        </div>
                        <div className="flex items-center gap-[6px]">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleEditGoal(goal)}
                                    className="text-[11px] text-gray-400 hover:text-primary font-semibold transition-colors cursor-pointer"
                                    aria-label={`Edit goal ${goal.name}`}
                                  >
                                    ✏️
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  sideOffset={8}
                                  className="rounded-[10px] border border-gray-200 bg-white px-[8px] py-[4px] text-[10px] cursor-pointer font-medium text-gray-700 shadow-[0_10px_24px_rgba(17,24,39,0.12)]"
                                >
                                  Edit goal
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="text-[11px] text-gray-400 hover:text-red-500 font-semibold transition-colors cursor-pointer"
                                    aria-label={`Delete goal ${goal.name}`}
                                  >
                                    ✕
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  sideOffset={8}
                                  className="rounded-[10px] border border-gray-200 bg-white px-[8px] py-[4px] text-[10px] font-medium text-gray-700 shadow-[0_10px_24px_rgba(17,24,39,0.12)]"
                                >
                                  Delete goal
                                </TooltipContent>
                              </Tooltip>
                        </div>
                      </div>
                      <div className="h-[3px] bg-gray-200 rounded-[3px] mb-[6px] overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-600">
                        <span>{Math.round(progress)}%</span>
                        <span>{goal.currency}{goal.currentAmount} / {goal.currency}{goal.targetAmount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Regular Navigation View
          <>
            <div className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-[0.9px] px-[8px] py-[4px] pb-[6px]">Main</div>
            
            <NavBtn icon="📊" label="My Dashboard" active={activeNav === "My Dashboard"} onClick={handleOpenDashboard} />
            <button
              type="button"
              onClick={handleOpenTalkToFinHeal}
              className={`flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] cursor-pointer transition-all mb-[1px] text-[13px] w-full ${activeNav === "Talk to FinHeal" ? 'bg-[#eef0fd] text-primary font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <div className={`w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[14px] shrink-0 transition-all ${activeNav === "Talk to FinHeal" ? 'bg-primary shadow-[0_8px_24px_rgba(50,68,230,0.22)]' : 'bg-gray-100'}`}>
                💬
              </div>
              <span>Talk to FinHeal</span>
            </button>
            {!isUserAdvisor(userEmail) && (
              <NavBtn icon="🧑‍💼" label="Talk to an Advisor" active={activeNav === "Talk to an Advisor"} onClick={handleOpenAdvisor} />
            )}
            <NavBtn icon="🧭" label="Financial Health Test" active={activeNav === "Financial Health Test"} badge="New" badgeType="soft" onClick={handleOpenFinancialHealthTests} />
            {!isStaff && (
              <NavBtn icon="🎯" label="Financial Goals" active={activeNav === "Financial Goals"} badge={goals.length.toString()} badgeType="hard" onClick={() => setActiveNav("Financial Goals")} />
            )}

            <div className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-[0.9px] px-[8px] py-[4px] pb-[6px] mt-[10px]">Learn & Grow</div>
            <NavBtn icon="📚" label="Financial Education" active={activeNav === "Financial Education"} onClick={handleOpenEducation} />
            <NavBtn icon="💡" label="Tips & Insights" active={activeNav === "Tips & Insights"} onClick={() => setActiveNav("Tips & Insights")} />
            <NavBtn icon="🏦" label="Loan Calculator" active={activeNav === "Loan Calculator"} onClick={handleOpenLoanCalculator} />
            {hasPermission("cibil_fetch") && (
              <NavBtn icon="🛡️" label="Eligibility & CIBIL Checker" active={activeNav === "Eligibility & CIBIL Checker"} onClick={handleOpenEligibilityCibil} />
            )}
            <NavBtn icon="🔔" label="Reminders" active={activeNav === "Reminders"} onClick={handleOpenReminders} />

            
            {/* If Admin */}
            {(userEmail === "admin@finheal.com" || userEmail === "admin@f2finheal.com") && (
              <NavBtn icon="🔑" label="Admin Portal" active={activeNav === "Admin Portal"} onClick={handleOpenAdmin} />
            )}

            {/* If Expert/Advisor */}
            {isUserAdvisor(userEmail) && (
              <NavBtn icon="💼" label="Advisor Workspace" active={activeNav === "Advisor Workspace"} onClick={handleOpenAdmin} />
            )}


          </>
        )}
      </div>


      {/* Confirm delete dialog for goals */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Goal"
        description="Do you want to delete this goal? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      
      {/* Edit goal modal */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] p-[24px] max-w-[400px] w-full shadow-lg">
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[16px] font-bold text-gray-900">Edit Goal Target Amount</h2>
              <button
                onClick={handleCancelEdit}
                className="text-[20px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-[12px]">
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-[6px]">Target Amount</label>
                <input
                  type="number"
                  value={editFormData.targetAmount}
                  onChange={e => setEditFormData({ ...editFormData, targetAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-[10px] py-[8px] border border-gray-300 rounded-[8px] text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex gap-[10px] mt-[20px]">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-[10px] px-[16px] border border-gray-300 rounded-[8px] text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditGoal}
                className="flex-1 py-[10px] px-[16px] bg-primary text-white rounded-[8px] text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                Update Goal
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}

function NavBtn({ icon, label, active, badge, badgeType, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] cursor-pointer transition-all mb-[1px] text-[13px] ${active ? 'bg-[#eef0fd] text-primary font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <div className={`w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[14px] shrink-0 transition-all ${active ? 'bg-primary shadow-[0_8px_24px_rgba(50,68,230,0.22)]' : 'bg-gray-100'}`}>
        {icon}
      </div>
      {label}
      {badge && (
        <span className={`ml-auto text-[10px] font-bold px-[7px] py-[2px] rounded-[20px] ${badgeType === 'soft' ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-primary text-white'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
