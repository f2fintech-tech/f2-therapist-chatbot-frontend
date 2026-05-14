import { useGetWellnessScore } from "@workspace/api-client-react";
import type { ConversationSummary, MoodDimensions } from "@/lib/backendChat";
import { formatConversationDateLabel } from "@/lib/backendChat";
import { listUserGoals, updateGoalProgress, deleteGoal } from "@/utils/localGoals";
import tips from "@/data/insights.json";
import { useState, useEffect, useCallback } from "react";
import type { Goal } from "@/utils/localGoals";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

interface InsightsPanelProps {
  userId: string;
  sessionId: string;
  moodDimensions: MoodDimensions | null;
  conversationId: string | null;
  conversationCount: number;
  conversations: ConversationSummary[];
  onConversationSelect: (conversationId: string) => Promise<void>;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
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
  isOpen,
  onClose,
}: InsightsPanelProps) {
  const { data: wellness } = useGetWellnessScore(userId);
  const [goalsList, setGoalsList] = useState<Goal[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  // Goal Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);

  // Chat Delete State
  const [isChatDeleteDialogOpen, setIsChatDeleteDialogOpen] = useState(false);
  const [chatIdToDelete, setChatIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    const goals = listUserGoals(userId);
    setGoalsList(goals);
  }, [userId]);

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
      {/* Session Stats */}
      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">This Session</div>
        <div className="grid grid-cols-1 gap-[6px] sm:grid-cols-3 lg:grid-cols-3">
          <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
            <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{conversationCount || 0}</div>
            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Chats</div>
          </div>
          <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
            <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{goalsList.length}</div>
            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Goals</div>
          </div>
          <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
            <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{wellness?.active_days || 21}</div>
            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Days</div>
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

      {/* Active Goals */}
      <div className="mb-[18px]">
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
                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-[13px] text-gray-400 hover:text-red-500 transition-colors shrink-0">✕</button>
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
      </div>

      {/* Today's Insight */}
      <div className="mb-[18px]">
        <div className="text-[14px] font-bold text-blue-500 uppercase tracking-[1px] mb-[10px]">Today's Insight</div>
        <div className="bg-[#f6f7fe] border-[1.5px] border-[#d4d8fa] rounded-[10px] p-[12px]">
        <div className="text-[13px] text-gray-600 italic leading-[1.6]">{getTodaysTip(tips as string[])}</div>
        </div>
      </div>

      {/* Past Conversations with Delete Button */}
      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Past Conversations</div>
        <div>
          {sessionsList.map(s => (
            <div key={s.id} className="group relative">
              <button
                type="button"
                onClick={() => void onConversationSelect(s.id)}
                className={`flex w-full items-center gap-[8px] p-[7px_8px] rounded-[6px] transition-colors mb-[1px] hover:bg-gray-50 ${s.id === conversationId ? "bg-[#eef0fd]" : ""}`}
              >
                <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: s.moodColor || 'var(--color-primary)' }} />
                <div className="text-[11.5px] text-gray-600 flex-1 truncate text-left pr-6">{s.title}</div>
                <div className="text-[10px] text-gray-400 shrink-0">{formatConversationDateLabel(s.createdAt)}</div>
              </button>

              <button
                type="button"
                onClick={(e) => handleDeleteChatClick(e, s.id)}
                aria-label="Delete conversation"
                title="Delete conversation"
                disabled={isChatDeleteDialogOpen}
                className={`absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 transition-all transform px-2 ${isChatDeleteDialogOpen ? 'cursor-not-allowed opacity-50' : 'hover:text-red-500 hover:scale-110'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 3v1H4v2h16V4h-5V3H9zm1 6v8h2V9H10zm4 0v8h2V9h-2z" />
                </svg>
              </button>
            </div>
          ))}
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