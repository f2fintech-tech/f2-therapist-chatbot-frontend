type QuestionNavigatorProps = {
  title?: string;
  totalQuestions: number;
  activeIndex: number;
  answeredCount: number;
  timeLeftLabel: string;
  onSelectQuestion: (index: number) => void;
  isAnswered: (index: number) => boolean;
  showTime?: boolean;
  showSummary?: boolean;
};

export default function QuestionNavigator({
  title = "PROGRESS",
  totalQuestions,
  activeIndex,
  answeredCount,
  timeLeftLabel,
  onSelectQuestion,
  isAnswered,
  showTime = true,
  showSummary = true,
}: QuestionNavigatorProps) {
  const safeTotal = Math.max(0, totalQuestions);
  const safeActiveIndex = safeTotal > 0 ? Math.max(0, Math.min(activeIndex, safeTotal - 1)) : 0;
  const progressPercent = safeTotal > 0 ? Math.round(((safeActiveIndex + 1) / safeTotal) * 100) : 0;
  const remainingCount = Math.max(0, safeTotal - answeredCount);

  return (
    <section className="rounded-[20px] border border-[#d7dcfb] bg-white p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)]">
      <div className="flex items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          {showSummary && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.9px] text-gray-400">{title}</div>
              <div className="mt-[6px] font-serif text-[24px] leading-[1.1] text-gray-900">Question {safeActiveIndex + 1} of {safeTotal}</div>
              <div className="mt-[4px] text-[12px] text-gray-500">{answeredCount} answered · {remainingCount} remaining</div>
            </>
          )}
        </div>

        {showTime && (
          <div className="rounded-[18px] border border-gray-200 bg-gray-50 px-[16px] py-[12px] text-right shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.8px] text-gray-400">TIME LEFT</div>
            <div className="mt-[2px] font-serif text-[28px] leading-none text-gray-900">{timeLeftLabel}</div>
          </div>
        )}
      </div>

      <div className="mt-[16px] h-[8px] overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#3344e6] via-[#4f6cf7] to-[#7c8cff] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="mt-[16px] flex flex-wrap gap-[8px]">
        {Array.from({ length: safeTotal }, (_, index) => {
          const selected = index === safeActiveIndex;
          const completed = isAnswered(index);

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectQuestion(index)}
              aria-current={selected ? "step" : undefined}
              className={`flex h-[42px] min-w-[42px] items-center justify-center rounded-full border text-[14px] font-semibold transition-all ${
                selected
                  ? "border-[#3344e6] bg-[#3344e6] text-white shadow-[0_8px_20px_rgba(50,68,230,0.18)]"
                  : completed
                    ? "border-[#cfd6ff] bg-[#eef0fd] text-[#3344e6] hover:border-[#3344e6]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[#cfd6ff] hover:bg-[#f8f9ff]"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}