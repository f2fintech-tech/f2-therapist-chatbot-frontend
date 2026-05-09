import { useGetWellnessScore, useGetUserGoals, useGetChatSessions } from "@workspace/api-client-react";
import type { MoodDimensions } from "@workspace/api-client-react/src/generated/api.schemas";

export default function InsightsPanel({ userId, sessionId, moodDimensions }: { userId: string; sessionId: string; moodDimensions: MoodDimensions | null }) {
  const { data: wellness } = useGetWellnessScore(userId);
  const { data: goals } = useGetUserGoals(userId);
  const { data: sessions } = useGetChatSessions(userId);
  const goalsList = Array.isArray(goals) ? goals : [];
  const sessionsList = Array.isArray(sessions) ? sessions : [];

  const defaultDims = { stress: 62, urgency: 40, openness: 85, willingness: 70, emotion: 55 };
  const currentDims = moodDimensions || defaultDims;

  return (
    <aside className="w-[252px] min-w-[252px] bg-white rounded-[20px] shadow-sm border border-gray-200 flex flex-col overflow-y-auto px-[12px] py-[16px] gap-0 animate-[slideInR_0.4s_0.08s_ease_both] scrollbar-none">
      
      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">This Session</div>
        <div className="grid grid-cols-3 gap-[6px]">
          <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
            <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{wellness?.session_count || 14}</div>
            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.6px] mt-[2px]">Chats</div>
          </div>
          <div className="bg-gray-50 border-[1.5px] border-gray-100 rounded-[10px] p-[9px_6px] text-center">
            <div className="font-serif text-[22px] text-gray-900 leading-[1.1]">{wellness?.goals_count || 3}</div>
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
            <span className="text-[13px] font-bold text-[#f59e0b]">{currentDims.stress}%</span>
          </div>
          <div className="h-[5px] bg-gray-200 rounded-[5px] overflow-hidden mb-[12px]">
            <div className="h-full bg-gradient-to-r from-[#10b981] to-[#f59e0b] rounded-[5px] transition-all duration-1000" style={{ width: `${currentDims.stress}%` }} />
          </div>

          <DimRow label="Urgency" val={currentDims.urgency || 40} color="bg-primary" />
          <DimRow label="Openness" val={currentDims.openness || 85} color="bg-primary" />
          <DimRow label="Willingness" val={currentDims.willingness || 70} color="bg-primary" />
          <DimRow label="Emotion" val={currentDims.emotion || 55} color="bg-[#f59e0b]" />
        </div>
      </div>

      <div className="mb-[18px]">
        <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-[10px]">Active Goals</div>
        <div>
          {goalsList.map(g => (
            <div key={g.id} className="flex items-center gap-[9px] py-[9px] border-b border-gray-100 last:border-0 last:pb-0">
              <div className="w-[28px] h-[28px] rounded-[6px] bg-[#eef0fd] flex items-center justify-center text-[13px] shrink-0">{g.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] font-semibold text-gray-700 mb-[4px] whitespace-nowrap overflow-hidden text-ellipsis">{g.name}</div>
                <div className="h-[3px] bg-gray-200 rounded-[3px] overflow-hidden">
                  <div className="h-full rounded-[3px] transition-all" style={{ width: `${(g.current / g.target) * 100}%`, backgroundColor: g.color || 'var(--color-primary)' }} />
                </div>
                <div className="flex justify-between mt-[3px]">
                  <div className="text-[10px] text-gray-400">{Math.round((g.current / g.target) * 100)}%</div>
                  <div className="text-[10px] font-medium" style={{ color: g.color || 'var(--color-primary)' }}>${g.current}{g.unit}</div>
                </div>
              </div>
            </div>
          ))}
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
            <div key={s.id} className="flex items-center gap-[8px] p-[7px_8px] rounded-[6px] cursor-pointer transition-colors mb-[1px] hover:bg-gray-50">
              <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: s.mood_color || 'var(--color-primary)' }} />
              <div className="text-[11.5px] text-gray-600 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{s.title}</div>
              <div className="text-[10px] text-gray-400">{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DimRow({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-[7px] mb-[7px] last:mb-0">
      <div className="text-[11px] text-gray-500 w-[66px] shrink-0 font-medium">{label}</div>
      <div className="flex-1 h-[4px] bg-gray-200 rounded-[4px] overflow-hidden">
        <div className={`h-full rounded-[4px] transition-all duration-1000 ${color}`} style={{ width: `${val}%` }} />
      </div>
      <div className="text-[10px] text-gray-400 w-[22px] text-right">{val}%</div>
    </div>
  );
}
