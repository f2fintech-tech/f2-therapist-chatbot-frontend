import { useGetWellnessScore } from "@workspace/api-client-react";
import type { ConversationSummary, MoodDimensions } from "@/lib/backendChat";
import { formatConversationDateLabel } from "@/lib/backendChat";
import { listUserGoals, updateGoalProgress, deleteGoal } from "@/utils/localGoals";
import tips from "@/data/insights.json";
import { useState, useEffect, useCallback } from "react";
import type { Goal } from "@/utils/localGoals";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { fetchAdvisorAppointments, fetchUserReports } from "@/lib/backendAuth";
import type { Appointment, UserReport } from "@/lib/backendAuth";

interface InsightsPanelProps {
  userId: string;
  sessionId: string;
  moodDimensions: MoodDimensions | null;
  conversationId: string | null;
  conversationCount: number;
  conversations: ConversationSummary[];
  onConversationSelect: (conversationId: string) => Promise<void>;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  onRenameConversation?: (conversationId: string, title: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  isAdvisor?: boolean;
}

export default function InsightsPanel({
  userId,
  sessionId,
  moodDimensions,
  conversationId,
  conversationCount,
  conversations,
  onConversationSelect,
  onDeleteConversation,
  onRenameConversation,
  isOpen,
  onClose,
  isAdvisor = false,
}: InsightsPanelProps) {
  const { data: wellness } = useGetWellnessScore(userId);
  const [goalsList, setGoalsList] = useState<Goal[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [advisorCalls, setAdvisorCalls] = useState<Appointment[]>([]);
  const [loadingCalls, setLoadingCalls] = useState<boolean>(false);
  const [reportsList, setReportsList] = useState<UserReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [activeReportSubTab, setActiveReportSubTab] = useState<"daily" | "fortnightly" | "monthly">("daily");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>("");

  const handleSaveRename = useCallback(async (chatId: string) => {
    const trimmedTitle = renameTitle.trim();
    if (!trimmedTitle) return;

    if (onRenameConversation) {
      await onRenameConversation(chatId, trimmedTitle);
    }
    setEditingChatId(null);
  }, [renameTitle, onRenameConversation]);

  // Live clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const displayHour = (hour % 12 || 12).toString().padStart(2, "0");
  const displayMin = currentTime.getMinutes().toString().padStart(2, "0");
  const displaySec = currentTime.getSeconds().toString().padStart(2, "0");
  const displayTime = `${displayHour}:${displayMin}:${displaySec}`;
  const ampmVal = hour >= 12 ? "PM" : "AM";

  // Goal Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);

  // Chat Delete State
  const [isChatDeleteDialogOpen, setIsChatDeleteDialogOpen] = useState(false);
  const [chatIdToDelete, setChatIdToDelete] = useState<string | null>(null);

  const getDaysLeftInMonth = useCallback(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(now)
      .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {} as Record<string, string>);

    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);
    const currentDate = new Date(year, month - 1, day);
    const nextMonthStart = new Date(year, month, 1);
    const millisPerDay = 24 * 60 * 60 * 1000;

    return Math.max(0, Math.ceil((nextMonthStart.getTime() - currentDate.getTime()) / millisPerDay));
  }, []);

  useEffect(() => {
    const goals = listUserGoals(userId);
    setGoalsList(goals);

    const handleGoalsUpdated = () => {
      setGoalsList(listUserGoals(userId));
    };
    window.addEventListener("finheal:goals-updated", handleGoalsUpdated);
    return () => window.removeEventListener("finheal:goals-updated", handleGoalsUpdated);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    async function loadReports() {
      setLoadingReports(true);
      try {
        const list = await fetchUserReports(userId);
        if (active) {
          setReportsList(list);
        }
      } catch (err) {
        console.error("Failed to load user reports in InsightsPanel:", err);
      } finally {
        if (active) {
          setLoadingReports(false);
        }
      }
    }
    loadReports();

    const handleWellnessUpdate = () => {
      loadReports();
    };
    window.addEventListener("finheal:wellness_update", handleWellnessUpdate);

    return () => {
      active = false;
      window.removeEventListener("finheal:wellness_update", handleWellnessUpdate);
    };
  }, [userId]);

  useEffect(() => {
    if (!isAdvisor) return;

    let active = true;
    const loadCalls = async () => {
      setLoadingCalls(true);
      try {
        const calls = await fetchAdvisorAppointments(userId);
        if (active) {
          const upcoming = calls.filter(c => !c.completed && !c.cancelled);
          setAdvisorCalls(upcoming);
        }
      } catch (err) {
        console.error("Failed to fetch advisor appointments:", err);
      } finally {
        if (active) {
          setLoadingCalls(false);
        }
      }
    };

    loadCalls();
    const interval = setInterval(loadCalls, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userId, isAdvisor]);

  const handleUpdateProgress = (goalId: string, newAmount: number) => {
    updateGoalProgress(goalId, newAmount);
    const updated = listUserGoals(userId);
    setGoalsList(updated);
    setEditingGoalId(null);
  };

  // Goal Delete Handlers
  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoalIdToDelete(goalId);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (goalIdToDelete) {
      deleteGoal(goalIdToDelete);
      const updated = listUserGoals(userId);
      setGoalsList(updated);
      setIsDeleteDialogOpen(false);
      setGoalIdToDelete(null);
    }
  }, [goalIdToDelete, userId]);

  // Chat Delete Handlers
  const handleDeleteChatClick = useCallback((e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevents chat selection when clicking delete
    setChatIdToDelete(chatId);
    setIsChatDeleteDialogOpen(true);
  }, []);

  const handleConfirmChatDelete = useCallback(async () => {
    if (chatIdToDelete) {
      if (onDeleteConversation) {
        await onDeleteConversation(chatIdToDelete);
      }
      setIsChatDeleteDialogOpen(false);
      setChatIdToDelete(null);
    }
  }, [chatIdToDelete, onDeleteConversation]);

  const sessionsList = conversations;
  const currentDims = moodDimensions;
  const renderPercent = (value?: number) => (typeof value === "number" ? `${Math.round(value)}%` : "—");
  const stressValue = currentDims?.stress;

  const getDayOfYear = (date: Date, timeZone = "Asia/Kolkata") => {
    // Use Intl.DateTimeFormat to get the date parts in the desired timezone
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(date)
      .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {} as Record<string, string>);

    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);

    // Compute day-of-year by using UTC timestamps for the local date parts
    const utcMidnight = Date.UTC(year, month - 1, day);
    const utcYearStart = Date.UTC(year, 0, 1);
    return Math.floor((utcMidnight - utcYearStart) / 86400000) + 1;
  };

  const getTodaysTip = (items: string[]) => {
    if (!items || items.length === 0) return "";
    const day = getDayOfYear(new Date(), "Asia/Kolkata");
    const idx = (day - 1) % items.length;
    return items[idx];
  };

  const panelContent = (
    <>
      {/* Live Digital Clock & Date */}
      <div className="mb-[18px] bg-white border border-gray-100 rounded-xl p-[14px] flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-1">
            Local Time
          </span>
          <div className="flex items-baseline font-sans text-gray-900 leading-none">
            <span className="text-2xl font-light tracking-tight">
              {displayHour}:{displayMin}
            </span>
            <span className="ml-0.5 text-xs font-light text-gray-400 select-none">
              :{displaySec}
            </span>
            <span className="ml-1.5 text-[10px] font-semibold text-indigo-600 uppercase tracking-wider select-none">
              {ampmVal}
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-1">
            Current Date
          </span>
          <span className="text-xs font-light text-gray-600">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric"
            })}
          </span>
        </div>
      </div>

      {/* Session Stats */}
      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">This Session</div>
        <div className="grid grid-cols-1 gap-[6px] sm:grid-cols-3 lg:grid-cols-3">
          <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
            <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{conversationCount || 0}</div>
            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Chats</div>
          </div>
          {isAdvisor ? (
            <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
              <div className="font-serif text-[22px] text-indigo-600 leading-[1.1]">{advisorCalls.length}</div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Calls</div>
            </div>
          ) : (
            <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
              <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{goalsList.length}</div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Goals</div>
            </div>
          )}
          <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
            <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{getDaysLeftInMonth()}</div>
            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Days until month end</div>
          </div>
        </div>
      </div>

      {/* Mood Analysis */}
      <div className="mb-[18px]">
        <div className="text-[12px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Mood Analysis</div>
        <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[12px]">
          <div className="flex justify-between items-baseline mb-[8px]">
            <span className="text-[12px] font-semibold text-gray-700">Stress Level</span>
            <span className="text-[13px] font-bold text-[#f59e0b]">{renderPercent(stressValue)}</span>
          </div>
          <div className="h-[5px] bg-gray-200 rounded-[5px] overflow-hidden mb-[12px]">
            <div className="h-full bg-gradient-to-r from-[#10b981] to-[#f59e0b] rounded-[5px] transition-all duration-1000" style={{ width: `${stressValue ?? 0}%` }} />
          </div>
          <DimRow label="Urgency" val={currentDims?.urgency} color="bg-primary" />
          <DimRow label="Openness" val={currentDims?.openness} color="bg-primary" />
          <DimRow label="Willingness" val={currentDims?.willingness} color="bg-primary" />
          <DimRow label="Emotion" val={currentDims?.emotion} color="bg-[#f59e0b]" />
        </div>
      </div>

      {/* Active Goals / Scheduled Calls */}
      <div className="mb-[18px]">
        {isAdvisor ? (
          <>
            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Scheduled Calls</div>
            <div>
              {loadingCalls && advisorCalls.length === 0 ? (
                <div className="py-[12px] text-center">
                  <div className="text-[11px] text-gray-400">Loading calls...</div>
                </div>
              ) : advisorCalls.length === 0 ? (
                <div className="py-[12px] text-center">
                  <div className="text-[11px] text-gray-400">No upcoming calls.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {advisorCalls.map(call => (
                    <div key={call.id} className="p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 rounded-xl transition-all duration-200">
                      <div className="flex justify-between items-start gap-1 mb-1">
                        <div className="text-[11px] font-bold text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          📞 Call
                        </div>
                        <div className="text-[10px] text-gray-400 text-right font-medium">
                          {call.date}
                        </div>
                      </div>
                      <div className="text-[12px] font-semibold text-gray-800 break-all mb-1">
                        {call.clientEmail || "No Email"}
                      </div>
                      <div className="text-[11px] font-medium text-indigo-600 mb-2">
                        🕒 {call.time}
                      </div>
                      {call.notes && (
                        <div className="text-[10px] text-gray-500 italic bg-white/60 p-1.5 rounded-lg border border-gray-100 mb-2.5 max-h-[50px] overflow-y-auto">
                          "{call.notes}"
                        </div>
                      )}
                      {call.meetUrl ? (
                        <a
                          href={call.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full text-center text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer"
                        >
                          🎥 Join Meeting
                        </a>
                      ) : (
                        <div className="text-[10px] text-center text-gray-400 bg-gray-100/80 py-1 rounded-lg">
                          No link configured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Active Goals</div>
            <div>
              {goalsList.length === 0 ? (
                <div className="py-[12px] text-center">
                  <div className="text-[11px] text-gray-400">No goals yet.</div>
                </div>
              ) : (
                goalsList.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isEditing = editingGoalId === goal.id;
                  return (
                    <div key={goal.id} className="py-[9px] border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-[9px] mb-[6px]">
                        <div className="w-[28px] h-[28px] rounded-[6px] bg-[#eef0fd] flex items-center justify-center text-[13px] shrink-0">{goal.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-gray-700 truncate">{goal.name}</div>
                        </div>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-[13px] cursor-pointer text-gray-400 hover:text-red-500 transition-colors shrink-0">✕</button>
                      </div>
                      <div className="h-[3px] bg-gray-200 rounded-[3px] overflow-hidden mb-[6px]">
                        <div className="h-full rounded-[3px] transition-all" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color || 'var(--color-primary)' }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-[12px] text-green-500">{Math.round(progress)}%</div>
                        {isEditing ? (
                          <div className="flex gap-[4px]">
                            <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-[85px] text-[12px] border rounded" autoFocus />
                            <button onClick={() => handleUpdateProgress(goal.id, parseFloat(editAmount) || 0)} className="text-[10px] bg-primary text-white px-2 py-1 rounded">Update</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => { setEditingGoalId(goal.id); setEditAmount(goal.currentAmount.toString()); }}>
                            <span className="text-[12px] font-medium" style={{ color: goal.color }}>{goal.currency}{goal.currentAmount}</span>
                            <span className="text-[12px]">✏️</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Wellness Reports */}
      {!isAdvisor && (
        <div className="mb-[18px]">
          <div className="flex items-center justify-between mb-[10px]">
            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-[1px]">Wellness Reports</div>
            <div className="flex bg-gray-100 rounded-lg p-0.5 scale-90 origin-right">
              {(["daily", "fortnightly", "monthly"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveReportSubTab(type)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                    activeReportSubTab === type
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {type === "daily" ? "Daily" : type === "fortnightly" ? "15-Day" : "30-Day"}
                </button>
              ))}
            </div>
          </div>

          {loadingReports && reportsList.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px]">
              <div className="text-[11px] text-gray-400 animate-pulse">Loading reports...</div>
            </div>
          ) : (() => {
            const activeReport = reportsList.find((r) => r.reportType === activeReportSubTab);
            if (!activeReport) {
              return (
                <div className="text-center py-6 bg-gray-50/50 border border-dashed border-gray-200 rounded-[10px] p-3">
                  <div className="text-[24px] mb-1">🎯</div>
                  <h4 className="text-[11.5px] font-bold text-gray-700">No {activeReportSubTab === "daily" ? "Daily" : activeReportSubTab === "fortnightly" ? "15-Day" : "30-Day"} Report Yet</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    Continue talking to your AI Therapist or use tools like CIBIL checker, tests, and calculators to unlock.
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[12px] flex flex-col gap-3">
                {/* Therapist Analysis */}
                <div className="bg-indigo-50/40 border border-indigo-100/30 rounded-lg p-2.5 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-1 text-[24px] font-serif opacity-10 select-none pointer-events-none">“</div>
                  <span className="text-[8px] font-extrabold text-indigo-700 bg-indigo-100/40 px-1.5 py-0.5 rounded uppercase tracking-wider mb-1.5 inline-block">
                    Therapist Analysis
                  </span>
                  <p className="text-[11px] italic text-gray-600 leading-normal font-medium relative z-10">
                    &quot;{activeReport.summary}&quot;
                  </p>
                </div>

                {/* Stress & Telemetry Trend */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8.5px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Telemetry Trend
                  </span>
                  <div className="space-y-1.5">
                    {[
                      { label: "Stress Level", val: activeReport.moodTrend?.stress, color: "bg-red-500" },
                      { label: "Urgency", val: activeReport.moodTrend?.urgency, color: "bg-orange-500" },
                      { label: "Openness", val: activeReport.moodTrend?.openness, color: "bg-emerald-500" },
                      { label: "Willingness", val: activeReport.moodTrend?.willingness, color: "bg-primary" },
                      { label: "Emotion", val: activeReport.moodTrend?.emotion, color: "bg-amber-500" }
                    ].map((dim) => {
                      const valLabel = typeof dim.val === "number" ? `${Math.round(dim.val)}%` : "—";
                      return (
                        <div key={dim.label} className="flex items-center gap-2">
                          <div className="text-[10px] text-gray-550 w-[60px] font-medium shrink-0">{dim.label}</div>
                          <div className="flex-1 h-[3px] bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${dim.color}`} style={{ width: `${dim.val ?? 0}%` }} />
                          </div>
                          <div className="text-[9px] text-gray-400 w-[20px] text-right shrink-0">{valLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Takeaways / Action Steps */}
                {activeReport.keyTakeaways && activeReport.keyTakeaways.length > 0 && (
                  <div className="border-t border-gray-200 pt-2 flex flex-col gap-1.5">
                    <span className="text-[8.5px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Recommended Action Steps
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {activeReport.keyTakeaways.map((takeaway, idx) => (
                        <div key={idx} className="bg-amber-50/20 border border-amber-100/30 rounded-lg p-2.5 flex gap-2 items-start">
                          <span className="text-amber-500 text-[11px] mt-0.5 shrink-0">⚡</span>
                          <span className="text-[10.5px] text-gray-600 leading-normal font-medium">
                            {takeaway}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Today's Insight */}
      <div className="mb-[18px]">
        <div className="text-[14px] font-bold text-blue-500 uppercase tracking-[1px] mb-[10px]">Today's Insight</div>
        <div className="bg-[#f6f7fe] border-[1.5px] border-[#d4d8fa] rounded-[10px] p-[12px]">
        <div className="text-[13px] text-gray-600 italic leading-[1.6]">{getTodaysTip(tips as string[])}</div>
        </div>
      </div>

      {/* Past Conversations with Delete & Rename Buttons */}
      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Past Conversations</div>
        <div className="flex flex-col gap-[3px]">
          {sessionsList.map(s => {
            const isEditing = editingChatId === s.id;
            return (
              <div key={s.id} className="group relative">
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSaveRename(s.id);
                    }}
                    className="flex w-full items-center gap-[6px] p-[5px_6px] bg-gray-50 border border-gray-200 rounded-[6px] shadow-inner"
                  >
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      className="flex-1 text-[11.5px] text-gray-800 bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500"
                      autoFocus
                      maxLength={100}
                    />
                    <button
                      type="submit"
                      className="text-[12px] text-green-600 hover:text-green-800 cursor-pointer font-bold px-1"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingChatId(null)}
                      className="text-[12px] text-red-500 hover:text-red-700 cursor-pointer font-bold px-1"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void onConversationSelect(s.id)}
                      className={`flex w-full items-center gap-[8px] p-[7px_8px] rounded-[6px] transition-colors mb-[1px] hover:bg-gray-50 ${s.id === conversationId ? "bg-[#eef0fd]" : ""}`}
                    >
                      <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: s.moodColor || 'var(--color-primary)' }} />
                      <div className="text-[11.5px] text-gray-600 flex-1 truncate text-left pr-12">{s.title}</div>
                      <div className="text-[10px] text-gray-400 shrink-0">{formatConversationDateLabel(s.createdAt)}</div>
                    </button>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-[4px] opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm rounded px-1 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChatId(s.id);
                          setRenameTitle(s.title);
                        }}
                        aria-label="Rename conversation"
                        title="Rename conversation"
                        className="text-gray-450 hover:text-primary transition-all p-1 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteChatClick(e, s.id)}
                        aria-label="Delete conversation"
                        title="Delete conversation"
                        disabled={isChatDeleteDialogOpen}
                        className={`text-gray-450 transition-all p-1 ${isChatDeleteDialogOpen ? 'cursor-not-allowed opacity-50' : 'hover:text-red-500 hover:scale-110 cursor-pointer'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Shared Dialog Theme for Goals and Chats */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Goal"
        description="Do you want to delete this goal? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      <ConfirmDeleteDialog
        isOpen={isChatDeleteDialogOpen}
        title="Delete Conversation"
        description="Do you want to delete this conversation? This history will be permanently removed."
        onConfirm={handleConfirmChatDelete}
        onCancel={() => setIsChatDeleteDialogOpen(false)}
      />

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-30 2xl:hidden" onClick={onClose} />}

      {/* Sidebar - Mobile */}
      <aside className={`fixed right-0 top-0 bottom-0 w-[280px] bg-white rounded-[20px_0_0_20px] flex flex-col overflow-y-auto shadow-lg border-l border-gray-200 z-40 transition-transform duration-300 px-[12px] py-[16px] 2xl:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={onClose} className="absolute top-3 right-3 h-6 w-6 rounded-md flex items-center justify-center text-red-400 z-50">✕</button>
        {panelContent}
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden bg-white rounded-[20px] shadow-sm border border-gray-200 flex-col overflow-y-auto px-[12px] py-[16px] 2xl:flex 2xl:w-[clamp(250px,18vw,300px)] 2xl:h-full scrollbar-none">
        {panelContent}
      </aside>
    </>
  );
}

function DimRow({ label, val, color }: { label: string; val?: number; color: string }) {
  const valueLabel = typeof val === "number" ? `${Math.round(val)}%` : "—";
  return (
    <div className="flex items-center gap-[7px] mb-[7px] last:mb-0">
      <div className="text-[11px] text-gray-500 w-[66px] shrink-0 font-medium">{label}</div>
      <div className="flex-1 h-[4px] bg-gray-200 rounded-[4px] overflow-hidden">
        <div className={`h-full rounded-[4px] transition-all duration-1000 ${color}`} style={{ width: `${val ?? 0}%` }} />
      </div>
      <div className="text-[10px] text-gray-400 w-[22px] text-right">{valueLabel}</div>
    </div>
  );
}