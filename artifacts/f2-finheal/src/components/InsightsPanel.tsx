import { useGetWellnessScore, useGetUserGoals } from "@workspace/api-client-react";
import type { ConversationSummary, MoodDimensions } from "@/lib/backendChat";
import { listUserGoals, updateGoalProgress, deleteGoal } from "@/utils/localGoals";
import { useState, useEffect } from "react";
import type { Goal } from "@/utils/localGoals";

interface InsightsPanelProps {
  userId: string;
  sessionId: string;
  moodDimensions: MoodDimensions | null;
  conversationId: string | null;
  conversationCount: number;
  conversations: ConversationSummary[];
  onConversationSelect: (conversationId: string) => Promise<void>;
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
  isOpen,
  onClose,
}: InsightsPanelProps) {
  const { data: wellness } = useGetWellnessScore(userId);
  const [goalsList, setGoalsList] = useState<Goal[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  // Load goals from localStorage on component mount and when userId changes
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

  const handleDeleteGoal = (goalId: string) => {
    const shouldDelete = window.confirm("Do you want to delete this goal?");
    if (!shouldDelete) {
      return;
    }

    deleteGoal(goalId);
    const updated = listUserGoals(userId);
    setGoalsList(updated);
  };

  const sessionsList = conversations;

  const currentDims = moodDimensions;
  const renderPercent = (value?: number) => (typeof value === "number" ? `${Math.round(value)}%` : "—");
  const stressValue = currentDims?.stress;

  const panelContent = (
    <>
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

      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Mood Analysis</div>
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

      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Active Goals</div>
        <div>
          {goalsList.length === 0 ? (
            <div className="py-[12px] text-center">
              <div className="text-[11px] text-gray-400">No goals yet. Create one to get started!</div>
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
                      <div className="text-[11.5px] font-semibold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{goal.name}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-[11px] text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      title="Delete goal"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="h-[3px] bg-gray-200 rounded-[3px] overflow-hidden mb-[6px]">
                    <div
                      className="h-full rounded-[3px] transition-all"
                      style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color || 'var(--color-primary)' }}
                    />
                  </div>
                  <div className="flex justify-between items-center gap-[6px]">
                    <div className="text-[10px] text-gray-400">{Math.round(progress)}%</div>
                    {isEditing ? (
                      <div className="flex gap-[4px] flex-1 justify-end">
                        <div className="text-[10px] text-gray-500">{goal.currency}</div>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-[45px] text-[10px] px-[4px] py-[4px] border-[1.5px] border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="0"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateProgress(goal.id, parseFloat(editAmount) || 0)}
                          className="text-[10px] bg-primary text-white px-[8px] py-[4px] rounded hover:opacity-90 transition-opacity font-medium"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => setEditingGoalId(null)}
                          className="text-[10px] bg-gray-200 text-gray-700 px-[8px] py-[4px] rounded hover:opacity-80 transition-opacity"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-[6px]">
                        <div
                          className="text-[10px] font-medium px-[6px] py-[2px] rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-primary transition-all"
                          style={{ color: goal.color || 'var(--color-primary)' }}
                          title="Click to edit current amount"
                        >
                          {goal.currency}{goal.currentAmount}
                        </div>
                        <button
                          onClick={() => {
                            setEditingGoalId(goal.id);
                            setEditAmount(goal.currentAmount.toString());
                          }}
                          className="text-[10px] text-gray-400 hover:text-primary transition-colors px-[4px]"
                          title="Edit goal progress"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Today's Insight</div>
        <div className="bg-[#f6f7fe] border-[1.5px] border-[#d4d8fa] rounded-[10px] p-[12px]">
          <div className="text-[9px] font-bold text-primary uppercase tracking-[0.8px] mb-[5px]">Tip</div>
          <div className="text-[11.5px] text-gray-600 leading-[1.6]">Breaking your high-interest debt into smaller weekly payments can reduce overall interest.</div>
        </div>
      </div>

      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Past Conversations</div>
        <div>
          {sessionsList.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => void onConversationSelect(s.id)}
              className={`flex w-full items-center gap-[8px] p-[7px_8px] rounded-[6px] cursor-pointer transition-colors mb-[1px] hover:bg-gray-50 ${s.id === conversationId ? "bg-[#eef0fd]" : ""}`}
            >
              <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: s.moodColor || 'var(--color-primary)' }} />
              <div className="text-[11.5px] text-gray-600 flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-left">{s.title}</div>
              <div className="text-[10px] text-gray-400">{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 2xl:hidden"
          onClick={onClose}
        />
      )}
      {/* Insights Drawer - Narrow screens */}
      <aside className={`fixed right-0 top-0 bottom-0 w-[280px] bg-white rounded-[20px_0_0_20px] flex flex-col overflow-y-auto shadow-lg border-l border-gray-200 z-40 transition-transform duration-300 px-[12px] py-[16px] gap-0 scrollbar-none 2xl:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button
          onClick={onClose}
          aria-label="Close insights"
          className="absolute top-3 right-3 h-6 w-6 rounded-md bg-white/90 flex items-center justify-center text-red-400 hover:bg-white z-50 shadow-sm"
        >
          ✕
        </button>
        {panelContent}
      </aside>
      {/* Insights Sidebar - Desktop */}
      <aside className="hidden bg-white rounded-[20px] shadow-sm border border-gray-200 flex-col overflow-y-auto px-[12px] py-[16px] gap-0 animate-[slideInR_0.4s_0.08s_ease_both] scrollbar-none 2xl:flex 2xl:w-[clamp(250px,18vw,300px)] 2xl:min-w-[250px] 2xl:max-w-[300px] 2xl:h-full 2xl:min-h-0">
        {panelContent}
      </aside>
    </>
  );
}

function DimRow({ label, val, color }: { label: string; val?: number; color: string }) {
  const valueLabel = typeof val === "number" ? `${Math.round(val)}%` : "—";
  const width = typeof val === "number" ? val : 0;

  return (
    <div className="flex items-center gap-[7px] mb-[7px] last:mb-0">
      <div className="text-[11px] text-gray-500 w-[66px] shrink-0 font-medium">{label}</div>
      <div className="flex-1 h-[4px] bg-gray-200 rounded-[4px] overflow-hidden">
        <div className={`h-full rounded-[4px] transition-all duration-1000 ${color}`} style={{ width: `${width}%` }} />
      </div>
      <div className="text-[10px] text-gray-400 w-[22px] text-right">{valueLabel}</div>
    </div>
  );
}
