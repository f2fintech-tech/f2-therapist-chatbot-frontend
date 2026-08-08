import type { Advisor } from "@/components/AdvisorPanel";

interface ExpertsTabProps {
  advisors: Advisor[];
  advisorsLoading: boolean;
  handleOpenAddExpert: () => void;
  handleToggleActive: (adv: Advisor) => Promise<void>;
  handleOpenEditExpert: (adv: Advisor) => void;
  handleDeleteExpert: (id: string) => void;
}

export default function ExpertsTab({
  advisors,
  advisorsLoading,
  handleOpenAddExpert,
  handleToggleActive,
  handleOpenEditExpert,
  handleDeleteExpert,
}: ExpertsTabProps) {
  return (
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

      <div className="border border-gray-200 rounded-[16px] overflow-x-auto bg-white shadow-xs">
        <table className="w-full min-w-[800px] text-left text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
              <th className="p-[12px]">Expert info</th>
              <th className="p-[12px]">Designation</th>
              <th className="p-[12px]">Category</th>
              <th className="p-[12px]">Hourly Fee</th>
              <th className="p-[12px]">Availability</th>
              <th className="p-[12px]">Status</th>
              <th className="p-[12px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {advisorsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  <td className="p-[12px] flex items-center gap-[10px]">
                    <div className="w-[32px] h-[32px] rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                      <div className="h-2 bg-gray-100 rounded w-16"></div>
                    </div>
                  </td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-28"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                  <td className="p-[12px]"><div className="h-4 bg-gray-200 rounded-full w-16"></div></td>
                  <td className="p-[12px]"><div className="h-4 bg-gray-200 rounded-full w-16"></div></td>
                  <td className="p-[12px] text-right space-x-[6px]">
                    <div className="inline-block h-3 bg-gray-200 rounded w-12 mr-2"></div>
                    <div className="inline-block h-3 bg-gray-200 rounded w-8 mr-2"></div>
                    <div className="inline-block h-3 bg-gray-200 rounded w-10"></div>
                  </td>
                </tr>
              ))
            ) : advisors.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-400">No experts found.</td>
              </tr>
            ) : advisors.map((adv) => (
              <tr key={adv.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-[12px] flex items-center gap-[10px]">
                  {adv.avatarUrl ? (
                    <img src={adv.avatarUrl} alt={adv.name} className="w-[32px] h-[32px] rounded-full object-cover border" />
                  ) : (
                    <div className="w-[32px] h-[32px] rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[11px] uppercase">
                      {adv.name ? adv.name.charAt(0) : "U"}
                    </div>
                  )}
                  <div>
                    <strong className="text-gray-900">{adv.name}</strong>
                    <div className="text-[10px] text-amber-500">⭐ {adv.rating} ({adv.reviewsCount} reviews)</div>
                  </div>
                </td>
                <td className="p-[12px] text-gray-600 font-medium">{adv.designation}</td>
                <td className="p-[12px] uppercase font-bold text-[10.5px] text-gray-400">{adv.category === "manual" ? "General" : adv.category}</td>
                <td className="p-[12px] font-bold text-gray-950">₹{adv.fee || 899}</td>
                <td className="p-[12px]">
                  {(() => {
                    const effectiveAvail = adv.availability;
                    return effectiveAvail === "available" ? (
                      <span className="bg-emerald-50 text-emerald-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-emerald-100">Available</span>
                    ) : effectiveAvail === "in meeting" ? (
                      <span className="bg-indigo-50 text-indigo-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-indigo-100">In Meeting</span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-rose-100">Not Available</span>
                    );
                  })()}
                </td>
                <td className="p-[12px]">
                  {adv.isActive !== false ? (
                    <span className="bg-emerald-50 text-emerald-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-emerald-100">Active</span>
                  ) : (
                    <div className="flex flex-col gap-[2px]">
                      <span className="bg-amber-50 text-amber-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-amber-100 w-max">Deactivated</span>
                      {adv.deactivationReason && (
                        <span className="text-[9.5px] text-amber-600 font-medium italic truncate max-w-[150px] block" title={adv.deactivationReason}>
                          Reason: {adv.deactivationReason}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-[12px] text-right space-x-[6px]">
                  <button
                    onClick={() => handleToggleActive(adv)}
                    className={`${adv.isActive !== false ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'} hover:underline font-bold cursor-pointer`}
                  >
                    {adv.isActive !== false ? "Deactivate" : "Activate"}
                  </button>
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
  );
}
