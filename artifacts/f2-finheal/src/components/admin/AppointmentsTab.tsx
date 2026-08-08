import type { Advisor } from "@/components/AdvisorPanel";

interface Appointment {
  id?: string;
  advisorId: string;
  advisorName: string;
  date: string;
  time: string;
  notes?: string;
  clientEmail?: string;
  clientName?: string;
  bookedAt: string;
  completed?: boolean;
  cancelled?: boolean;
  rating?: number;
  feedback?: string;
  meetUrl?: string;
  joined?: boolean;
  agenda?: string[] | null;
  deletedAt?: string;
}

interface AppointmentsTabProps {
  filteredAppointments: Appointment[];
  advisors: Advisor[];
  filterAdvisor: string;
  setFilterAdvisor: (val: string) => void;
  filterApptStatus: string;
  setFilterApptStatus: (val: string) => void;
  filterApptStartDate: string;
  setFilterApptStartDate: (val: string) => void;
  filterApptEndDate: string;
  setFilterApptEndDate: (val: string) => void;
  appointmentsLoading: boolean;
  handleDeleteAppointment: (id: string) => void;
  hasSessionEnded: (date: string, time: string) => boolean;
  renderApptNotes: (notes?: string, agenda?: string[] | null) => React.ReactNode;
}

export default function AppointmentsTab({
  filteredAppointments,
  advisors,
  filterAdvisor,
  setFilterAdvisor,
  filterApptStatus,
  setFilterApptStatus,
  filterApptStartDate,
  setFilterApptStartDate,
  filterApptEndDate,
  setFilterApptEndDate,
  appointmentsLoading,
  handleDeleteAppointment,
  hasSessionEnded,
  renderApptNotes,
}: AppointmentsTabProps) {
  const hasActiveFilters = filterAdvisor !== "all" || filterApptStatus !== "all" || filterApptStartDate !== "" || filterApptEndDate !== "";

  return (
    <div className="space-y-[16px] animate-fade-in">
      <div className="border-b border-gray-100 pb-3 space-y-3">
        {/* Row 1: Title */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-gray-900">Platform Scheduled Consultations Feed ({filteredAppointments.length})</h3>
            <p className="text-[10px] text-gray-400 mt-[2px]">Exclusively managing advisors scheduled consultations feed.</p>
          </div>
        </div>

        {/* Row 2: Filters Grid/Flex */}
        <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
          {/* Advisor Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-semibold">Advisor:</span>
            <select
              value={filterAdvisor}
              onChange={(e) => setFilterAdvisor(e.target.value)}
              className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
            >
              <option value="all">All Advisors</option>
              {advisors.map((adv) => (
                <option key={adv.id} value={adv.f2FintechId || adv.id}>
                  {adv.name} ({adv.f2FintechId || adv.id})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-semibold">Status:</span>
            <select
              value={filterApptStatus}
              onChange={(e) => setFilterApptStatus(e.target.value)}
              className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Active / Booked</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-semibold">From:</span>
            <input
              type="date"
              value={filterApptStartDate}
              onChange={(e) => setFilterApptStartDate(e.target.value)}
              className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-semibold">To:</span>
            <input
              type="date"
              value={filterApptEndDate}
              onChange={(e) => setFilterApptEndDate(e.target.value)}
              className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterAdvisor("all");
                setFilterApptStatus("all");
                setFilterApptStartDate("");
                setFilterApptEndDate("");
              }}
              className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-650 cursor-pointer transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {appointmentsLoading ? (
        <div className="space-y-[10px]">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border border-gray-200 bg-white p-[16px] rounded-[16px] flex flex-col justify-between sm:flex-row sm:items-center animate-pulse min-h-[100px]">
              <div className="space-y-[8px] w-full max-w-md">
                <div className="flex items-center gap-[8px]">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded-full w-20"></div>
                  <div className="h-3 bg-gray-100 rounded-full w-24"></div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
              <div className="text-right shrink-0 mt-[12px] pt-[12px] border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0 flex flex-col items-end gap-[6px]">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-100 rounded w-16"></div>
                <div className="h-2.5 bg-gray-100 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-[36px] bg-gray-50 border border-dashed rounded-[16px]">
          <div className="text-[32px]">📅</div>
          <div className="text-[12px] text-gray-400 mt-[6px]">
            {hasActiveFilters
              ? "No scheduled calls match the selected filter criteria."
              : "No scheduled calls have been booked on the platform yet."}
          </div>
        </div>
      ) : (
        <div className="space-y-[10px]">
          {filteredAppointments.map((appt, idx) => (
            <div key={idx} className="border border-gray-200 bg-white p-[16px] rounded-[16px] flex flex-col justify-between sm:flex-row sm:items-center">
              <div className="space-y-[4px]">
                <div className="flex items-center gap-[8px] flex-wrap">
                  <strong className="text-[14px] text-gray-900">{appt.advisorName}</strong>
                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-[8px] py-[2px] rounded-full uppercase">Advisor ID: {appt.advisorId}</span>
                  {appt.cancelled ? (
                    <span className="text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">🚫 Cancelled</span>
                  ) : appt.completed && appt.rating ? (
                    <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">✓ Completed & Rated</span>
                  ) : (hasSessionEnded(appt.date, appt.time) || appt.completed) ? (
                    <span className="text-[9.5px] font-bold bg-[#ecfdf5] text-emerald-800 border border-emerald-200 px-[8px] py-[2px] rounded-full uppercase tracking-wide">✓ Completed</span>
                  ) : (
                    <span className="text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-[8px] py-[2px] rounded-full uppercase tracking-wide">🕒 Active Schedule</span>
                  )}
                </div>
                <div className="text-[12px] text-gray-600">
                  {appt.clientName && <span><strong>Client name:</strong> {appt.clientName} &nbsp;|&nbsp; </span>}
                  <strong>Client email:</strong> {appt.clientEmail}
                </div>
                {appt.meetUrl && (
                  <div className="text-[11.5px] text-gray-600 mt-[4px] flex items-center gap-[6px] flex-wrap">
                    <span>🌐 <strong>Meet URL Room:</strong></span>
                    <a href={appt.meetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                      {appt.meetUrl}
                    </a>
                  </div>
                )}
                {appt.completed && appt.rating && (
                  <div className="flex items-center gap-[6px] text-[11px] font-bold text-amber-500 bg-amber-50/20 border border-amber-100/30 px-[10px] py-[6px] rounded-[10px] w-fit mt-[4px]">
                    <span>{"★".repeat(appt.rating || 0)}</span>
                    <span className="text-gray-500">({appt.rating}/5 stars)</span>
                  </div>
                )}
                {appt.cancelled ? (
                  appt.feedback && (
                    <div className="text-[11px] italic text-rose-700 bg-rose-50/40 border border-rose-100/60 p-[10px] rounded-[12px] max-w-[480px] mt-[6px] flex flex-col gap-[3px] text-left">
                      <span className="text-[9.5px] font-extrabold text-rose-800 uppercase tracking-wider block">🚫 Cancellation Reason</span>
                      <span>&quot;{appt.feedback}&quot;</span>
                    </div>
                  )
                ) : appt.completed ? (
                  appt.feedback && (
                    <div className="text-[11px] italic text-gray-700 bg-emerald-50/40 border border-emerald-100/60 p-[10px] rounded-[12px] max-w-[480px] mt-[6px] flex flex-col gap-[3px] text-left">
                      <span className="text-[9.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">💬 Client Feedback Review</span>
                      <span>&quot;{appt.feedback}&quot;</span>
                    </div>
                  )
                ) : (
                  renderApptNotes(appt.notes, appt.agenda)
                )}
              </div>

              <div className="text-right shrink-0 mt-[12px] pt-[12px] border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0 flex flex-col items-end">
                <div className="text-[13px] font-bold text-primary">{appt.date}</div>
                <div className="text-[12px] font-bold text-gray-700 mt-[2px]">{appt.time} (IST)</div>
                <div className="text-[10px] text-gray-400 mt-[4px]">Booked: {new Date(appt.bookedAt).toLocaleDateString()}</div>
                <button
                  onClick={() => appt.id && handleDeleteAppointment(appt.id)}
                  className="mt-2.5 text-rose-650 hover:text-rose-800 font-bold text-[10px] bg-rose-50/50 hover:bg-rose-100/50 px-2 py-1 rounded-[6px] border border-rose-100/70 transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  Delete Call 🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
