import { useState } from "react";
import { useGetWellnessScore, useGetUserGoals } from "@workspace/api-client-react";

export default function Sidebar({ userId, sessionId }: { userId: string; sessionId: string }) {
  const [activeMood, setActiveMood] = useState("😐");
  const [activeNav, setActiveNav] = useState("Talk to FinHeal");

  const { data: wellnessData } = useGetWellnessScore(userId);
  const { data: goalsData } = useGetUserGoals(userId);
  const changePoints = wellnessData?.change_pts ?? 0;

  const moods = [
    { emoji: "😰", title: "Very Stressed" },
    { emoji: "😟", title: "Anxious" },
    { emoji: "😐", title: "Neutral" },
    { emoji: "🙂", title: "Okay" },
    { emoji: "😄", title: "Great" },
  ];

  return (
    <aside className="w-[268px] min-w-[268px] bg-white rounded-[20px] flex flex-col overflow-hidden shadow-sm border border-gray-200">
      <div className="px-[18px] py-[20px] pb-[16px] flex items-center gap-[11px] border-b border-gray-100">
        <div className="w-[38px] h-[38px] bg-primary rounded-[10px] flex items-center justify-center text-[20px] shadow-[0_8px_24px_rgba(50,68,230,0.22)] shrink-0 relative overflow-hidden">
          💙
          <div className="absolute -top-[10px] -right-[10px] w-[30px] h-[30px] bg-white/15 rounded-full" />
        </div>
        <div className="flex flex-col gap-[1px]">
          <div className="text-[15px] font-bold text-gray-900 tracking-tight">F2 FinHeal</div>
          <div className="text-[10px] font-medium text-primary tracking-wide uppercase">Financial Wellness AI</div>
        </div>
      </div>

      {/* Wellness Score Card */}
      <div className="mx-[12px] my-[14px] bg-primary rounded-[14px] p-[16px] relative overflow-hidden cursor-pointer transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(50,68,230,0.22)]">
        <div className="absolute -right-[20px] -bottom-[20px] w-[90px] h-[90px] rounded-full bg-white/10" />
        <div className="absolute right-[20px] bottom-[20px] w-[40px] h-[40px] rounded-full bg-white/5" />
        
        <div className="text-[9px] font-semibold text-white/65 tracking-[1.2px] uppercase mb-[6px]">Your Wellness Score</div>
        <div className="flex items-end gap-[6px] mb-[10px]">
          <div className="font-serif text-[42px] text-white leading-none font-bold">{wellnessData?.score || 0}</div>
          <div className="text-[14px] text-white/55 mb-[5px]">/ 100</div>
        </div>
        <div className="h-[3px] bg-white/20 rounded-[3px]">
          <div className="h-[3px] bg-white/90 rounded-[3px] transition-all duration-1000" style={{ width: `${wellnessData?.score || 0}%` }} />
        </div>
        <div className="flex justify-between items-center mt-[8px]">
          <div className="text-[11px] text-white/80">
            {wellnessData?.trend} <strong className="text-white">{changePoints > 0 ? '+' : ''}{changePoints} pts</strong> this week
          </div>
          <div className="text-[9px] font-semibold bg-white/20 text-white px-[8px] py-[3px] rounded-[20px] tracking-[0.5px] uppercase">{wellnessData?.label || "..."}</div>
        </div>
      </div>

      {/* Mood */}
      <div className="px-[12px] py-[12px] pb-[8px]">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.8px] mb-[8px]">How are you feeling today?</div>
        <div className="flex justify-between gap-[4px]">
          {moods.map((m) => (
            <button
              key={m.emoji}
              title={m.title}
              onClick={() => setActiveMood(m.emoji)}
              className={`flex-1 h-[36px] rounded-[10px] border-[1.5px] text-[17px] flex items-center justify-center transition-all ${activeMood === m.emoji ? 'border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(50,68,230,0.1)]' : 'border-gray-200 bg-white hover:border-[#d4d8fa] hover:bg-[#f6f7fe] hover:scale-105'}`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-[8px] pt-[8px] scrollbar-none">
        <div className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-[0.9px] px-[8px] py-[4px] pb-[6px]">Main</div>
        
        <NavBtn icon="💬" label="Talk to FinHeal" active={activeNav === "Talk to FinHeal"} onClick={() => setActiveNav("Talk to FinHeal")} />
        <NavBtn icon="🧭" label="Financial Health Test" active={activeNav === "Financial Health Test"} badge="New" badgeType="soft" onClick={() => setActiveNav("Financial Health Test")} />
        <NavBtn icon="📊" label="My Dashboard" active={activeNav === "My Dashboard"} onClick={() => setActiveNav("My Dashboard")} />
        <NavBtn icon="🎯" label="Financial Goals" active={activeNav === "Financial Goals"} badge={goalsData?.length.toString() || "0"} badgeType="hard" onClick={() => setActiveNav("Financial Goals")} />

        <div className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-[0.9px] px-[8px] py-[4px] pb-[6px] mt-[10px]">Learn & Grow</div>
        <NavBtn icon="📚" label="Financial Education" active={activeNav === "Financial Education"} onClick={() => setActiveNav("Financial Education")} />
        <NavBtn icon="💡" label="Tips & Insights" active={activeNav === "Tips & Insights"} onClick={() => setActiveNav("Tips & Insights")} />
        <NavBtn icon="🏦" label="Loan Calculator" active={activeNav === "Loan Calculator"} onClick={() => setActiveNav("Loan Calculator")} />
        <NavBtn icon="🔔" label="Reminders" active={activeNav === "Reminders"} onClick={() => setActiveNav("Reminders")} />

        <div className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-[0.9px] px-[8px] py-[4px] pb-[6px] mt-[10px]">Support</div>
        <NavBtn icon="🧑‍💼" label="Talk to an Advisor" active={activeNav === "Talk to an Advisor"} onClick={() => setActiveNav("Talk to an Advisor")} />
        <NavBtn icon="⚙️" label="Settings" active={activeNav === "Settings"} onClick={() => setActiveNav("Settings")} />
      </div>

      <div className="p-[12px] border-t border-gray-100 flex items-center gap-[10px] cursor-pointer hover:bg-gray-50 transition-colors group">
        <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-primary to-[#4a5cf0] flex items-center justify-center text-[12px] font-bold text-white shrink-0">AR</div>
        <div>
          <div className="text-[13px] font-semibold text-gray-800">Aditya Rawal</div>
          <div className="text-[11px] text-gray-400">Premium Member</div>
        </div>
        <div className="ml-auto text-[15px] text-gray-300 transition-transform duration-300 group-hover:rotate-60">⚙️</div>
      </div>
    </aside>
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
