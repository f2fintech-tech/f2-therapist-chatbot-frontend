import type { Advisor } from "@/components/AdvisorPanel";

// Minimal local types for trash items (mirroring AdminPortal's internal shapes)
interface CibilTrashItem {
  id: string;
  name?: string;
  pan?: string;
  bureau?: string;
  score?: number | string;
  deleted_at?: string;
}

interface AdvisorTrashItem extends Partial<Advisor> {
  id: string;
  f2FintechId?: string;
  name: string;
  designation?: string;
  department?: string;
  deleted_at?: string;
}

interface AppointmentTrashItem {
  id?: string;
  clientName?: string;
  clientEmail?: string;
  advisorName?: string;
  advisorId?: string;
  date?: string;
  time?: string;
  cancelled?: boolean;
  completed?: boolean;
  deletedAt?: string;
}

interface EduTrashItem {
  id: string;
  emoji?: string;
  title?: string;
  type?: string;
  category?: string;
  deletedAt?: string;
}

interface LenderTrashItem {
  id: string;
  name: string;
  productType?: string;
  category?: string;
  deleted_at?: string;
}

interface TrashTabProps {
  trashLoading: boolean;
  cibilTrash: CibilTrashItem[];
  advisorsTrash: AdvisorTrashItem[];
  appointmentsTrash: AppointmentTrashItem[];
  educationTrash: EduTrashItem[];
  lendersTrash: LenderTrashItem[];
  handleRestoreCibil: (id: string) => void;
  handleRestoreAdvisor: (id: string) => void;
  handleRestoreAppointment: (id: string) => void;
  handleRestoreEdu: (id: string) => void;
  handleRestoreLender: (id: string) => void;
  handlePermanentDeleteEdu: (id: string) => void;
}

export default function TrashTab({
  trashLoading,
  cibilTrash,
  advisorsTrash,
  appointmentsTrash,
  educationTrash,
  lendersTrash,
  handleRestoreCibil,
  handleRestoreAdvisor,
  handleRestoreAppointment,
  handleRestoreEdu,
  handleRestoreLender,
  handlePermanentDeleteEdu,
}: TrashTabProps) {
  return (
    <div className="space-y-[24px] animate-fade-in">
      <div>
        <h3 className="text-[14px] font-bold text-gray-900">
          🗑️ Trash Manager
        </h3>
        <p className="text-[12px] text-gray-500 mt-[4px]">
          Inspect and restore items moved to Trash. Trashed records are permanently purged after 3 days.
        </p>
      </div>

      {trashLoading ? (
        <div className="grid grid-cols-1 gap-[24px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 bg-white p-[20px] rounded-[20px] shadow-xs space-y-[12px] animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 max-w-[250px]"></div>
              <div className="border border-gray-150 rounded-[12px] overflow-hidden bg-white">
                <table className="w-full text-left text-[11.5px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150">
                      <th className="p-[10px]"><div className="h-3 bg-gray-200 rounded w-20"></div></th>
                      <th className="p-[10px]"><div className="h-3 bg-gray-200 rounded w-24"></div></th>
                      <th className="p-[10px]"><div className="h-3 bg-gray-200 rounded w-16"></div></th>
                      <th className="p-[10px]"><div className="h-3 bg-gray-200 rounded w-20"></div></th>
                      <th className="p-[10px] flex justify-end"><div className="h-3 bg-gray-200 rounded w-16"></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 2 }).map((_, j) => (
                      <tr key={j} className="border-b border-gray-100">
                        <td className="p-[10px]"><div className="h-3 bg-gray-100 rounded w-32"></div></td>
                        <td className="p-[10px]"><div className="h-3 bg-gray-100 rounded w-24"></div></td>
                        <td className="p-[10px]"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                        <td className="p-[10px]"><div className="h-3 bg-gray-100 rounded w-28"></div></td>
                        <td className="p-[10px] flex justify-end"><div className="h-3 bg-gray-200 rounded w-16"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[24px]">
          {/* Bins: CIBIL Enquiries */}
          <div className="border border-gray-200 bg-white p-[20px] rounded-[20px] shadow-xs space-y-[12px]">
            <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-[6px]">
              📋 Deleted CIBIL Enquiries ({cibilTrash.length})
            </h4>
            <div className="border border-gray-150 rounded-[12px] overflow-hidden bg-white">
              <table className="w-full text-left text-[11.5px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                    <th className="p-[10px]">Subject Name</th>
                    <th className="p-[10px]">PAN / Bureau</th>
                    <th className="p-[10px]">Score</th>
                    <th className="p-[10px]">Deleted At</th>
                    <th className="p-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cibilTrash.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-[24px] text-gray-450 italic">
                        No deleted CIBIL enquiries in Trash.
                      </td>
                    </tr>
                  ) : (
                    cibilTrash.map((enq) => {
                      const utcStr = enq.deleted_at ? (enq.deleted_at.endsWith("Z") || enq.deleted_at.includes("+") ? enq.deleted_at : `${enq.deleted_at}Z`) : "";
                      const delDate = utcStr ? new Date(utcStr).toLocaleString("en-IN") : "-";
                      const isBsa = enq.bureau?.toLowerCase() === "bsa_standalone";
                      return (
                        <tr key={enq.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[10px] font-semibold text-gray-850">{enq.name || "Guest"}</td>
                          <td className="p-[10px] text-gray-500">{enq.pan || "-"} ({isBsa ? "BSA" : (enq.bureau || "CIBIL")})</td>
                          <td className="p-[10px]">
                            <span className="font-bold text-gray-700">
                              {isBsa ? "N/A" : enq.score}
                            </span>
                          </td>
                          <td className="p-[10px] text-gray-450">{delDate}</td>
                          <td className="p-[10px] text-right">
                            <button
                              onClick={() => handleRestoreCibil(enq.id)}
                              className="text-primary hover:underline font-bold text-[10.5px] cursor-pointer bg-transparent border-none"
                            >
                              Restore ↺
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bins: Employees & Advisors */}
          <div className="border border-gray-200 bg-white p-[20px] rounded-[20px] shadow-xs space-y-[12px]">
            <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-[6px]">
              👥 Deleted Employees & Advisors ({advisorsTrash.length})
            </h4>
            <div className="border border-gray-150 rounded-[12px] overflow-hidden bg-white">
              <table className="w-full text-left text-[11.5px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                    <th className="p-[10px]">Employee Name</th>
                    <th className="p-[10px]">Fintech ID</th>
                    <th className="p-[10px]">Designation / Dept</th>
                    <th className="p-[10px]">Deleted At</th>
                    <th className="p-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advisorsTrash.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-[24px] text-gray-450 italic">
                        No deleted employees/advisors in Trash.
                      </td>
                    </tr>
                  ) : (
                    advisorsTrash.map((adv) => {
                      const utcStr = adv.deleted_at ? (adv.deleted_at.endsWith("Z") || adv.deleted_at.includes("+") ? adv.deleted_at : `${adv.deleted_at}Z`) : "";
                      const delDate = utcStr ? new Date(utcStr).toLocaleString("en-IN") : "-";
                      return (
                        <tr key={adv.f2FintechId || adv.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[10px] font-semibold text-gray-850">{adv.name}</td>
                          <td className="p-[10px] text-gray-500">{adv.f2FintechId || adv.id}</td>
                          <td className="p-[10px] text-gray-650">{adv.designation} ({adv.department || "General"})</td>
                          <td className="p-[10px] text-gray-450">{delDate}</td>
                          <td className="p-[10px] text-right">
                            <button
                              onClick={() => handleRestoreAdvisor(adv.f2FintechId || adv.id)}
                              className="text-primary hover:underline font-bold text-[10.5px] cursor-pointer bg-transparent border-none"
                            >
                              Restore ↺
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bins: Scheduled Consultations */}
          <div className="border border-gray-200 bg-white p-[20px] rounded-[20px] shadow-xs space-y-[12px]">
            <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-[6px]">
              📅 Deleted Scheduled Consultations ({appointmentsTrash.length})
            </h4>
            <div className="border border-gray-150 rounded-[12px] overflow-hidden bg-white">
              <table className="w-full text-left text-[11.5px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                    <th className="p-[10px]">Client / Advisor</th>
                    <th className="p-[10px]">Date & Time</th>
                    <th className="p-[10px]">Status</th>
                    <th className="p-[10px]">Deleted At</th>
                    <th className="p-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsTrash.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-[24px] text-gray-450 italic">
                        No deleted scheduled consultations in Trash.
                      </td>
                    </tr>
                  ) : (
                    appointmentsTrash.map((appt) => {
                      const utcStr = appt.deletedAt ? (appt.deletedAt.endsWith("Z") || appt.deletedAt.includes("+") ? appt.deletedAt : `${appt.deletedAt}Z`) : "";
                      const delDate = utcStr ? new Date(utcStr).toLocaleString("en-IN") : "-";
                      return (
                        <tr key={appt.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[10px] font-semibold text-gray-850">
                            <span className="block font-bold text-gray-900">{appt.clientName || appt.clientEmail || "Guest Client"}</span>
                            <span className="text-[10px] text-gray-400 block">Advisor: {appt.advisorName} ({appt.advisorId})</span>
                          </td>
                          <td className="p-[10px] text-gray-550">
                            <div className="font-semibold text-gray-700">{appt.date}</div>
                            <div className="text-[10px] text-gray-450">{appt.time} (IST)</div>
                          </td>
                          <td className="p-[10px]">
                            {appt.cancelled ? (
                              <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-[6px] py-[1.5px] rounded-full uppercase">Cancelled</span>
                            ) : appt.completed ? (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-[6px] py-[1.5px] rounded-full uppercase">Completed</span>
                            ) : (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-[6px] py-[1.5px] rounded-full uppercase">Active</span>
                            )}
                          </td>
                          <td className="p-[10px] text-gray-450">{delDate}</td>
                          <td className="p-[10px] text-right">
                            <button
                              onClick={() => appt.id && handleRestoreAppointment(appt.id)}
                              className="text-primary hover:underline font-bold text-[10.5px] cursor-pointer bg-transparent border-none"
                            >
                              Restore ↺
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bins: Educational Content */}
          <div className="border border-gray-200 bg-white p-[20px] rounded-[20px] shadow-xs space-y-[12px]">
            <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-[6px]">
              📚 Deleted Educational Content ({educationTrash.length})
            </h4>
            <div className="border border-gray-150 rounded-[12px] overflow-hidden bg-white">
              <table className="w-full text-left text-[11.5px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                    <th className="p-[10px]">Title</th>
                    <th className="p-[10px]">Type</th>
                    <th className="p-[10px]">Category</th>
                    <th className="p-[10px]">Deleted At</th>
                    <th className="p-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {educationTrash.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-[24px] text-gray-450 italic">
                        No deleted educational content in Trash.
                      </td>
                    </tr>
                  ) : (
                    educationTrash.map((item) => {
                      const utcStr = item.deletedAt ? (item.deletedAt.endsWith("Z") || item.deletedAt.includes("+") ? item.deletedAt : `${item.deletedAt}Z`) : "";
                      const delDateStr = utcStr ? new Date(utcStr).toLocaleString("en-IN") : "-";

                      // Calculate remaining time before auto-purging (3 days)
                      let remainingStr = "";
                      if (item.deletedAt) {
                        const delTime = new Date(item.deletedAt).getTime();
                        const expiry = delTime + 3 * 24 * 60 * 60 * 1000;
                        const diff = expiry - Date.now();
                        if (diff > 0) {
                          const hoursTotal = Math.floor(diff / (1000 * 60 * 60));
                          const days = Math.floor(hoursTotal / 24);
                          const hours = hoursTotal % 24;
                          remainingStr = ` (${days}d ${hours}h left)`;
                        } else {
                          remainingStr = " (Expiring)";
                        }
                      }

                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[10px] font-semibold text-gray-850">
                            <span className="mr-1.5 text-[14px]">{item.emoji}</span>
                            {item.title}
                          </td>
                          <td className="p-[10px] text-gray-500">
                            {item.type === "article" ? "📄 Article" : "🎥 Video"}
                          </td>
                          <td className="p-[10px] text-gray-650">{item.category}</td>
                          <td className="p-[10px] text-gray-450">
                            {delDateStr}
                            <span className="text-[10px] text-rose-500 font-bold block mt-[2px]">{remainingStr}</span>
                          </td>
                          <td className="p-[10px] text-right space-x-[8px]">
                            <button
                              onClick={() => handleRestoreEdu(item.id)}
                              className="text-primary hover:underline font-bold text-[10.5px] cursor-pointer bg-transparent border-none"
                            >
                              Restore ↺
                            </button>
                            <button
                              onClick={() => handlePermanentDeleteEdu(item.id)}
                              className="text-rose-500 hover:underline font-bold text-[10.5px] cursor-pointer bg-transparent border-none"
                            >
                              Delete Forever ❌
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bins: Lenders Catalog */}
          <div className="border border-gray-200 bg-white p-[20px] rounded-[20px] shadow-xs space-y-[12px]">
            <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-[6px]">
              🏦 Deleted Lenders Catalog ({lendersTrash.length})
            </h4>
            <div className="border border-gray-150 rounded-[12px] overflow-hidden bg-white">
              <table className="w-full text-left text-[11.5px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-600 font-semibold">
                    <th className="p-[10px] w-2/5">Lender / Product</th>
                    <th className="p-[10px]">Product Type</th>
                    <th className="p-[10px]">Category</th>
                    <th className="p-[10px]">Deleted Date</th>
                    <th className="p-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lendersTrash.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-[20px] text-center text-gray-400 font-medium">
                        No deleted lender products in Trash.
                      </td>
                    </tr>
                  ) : (
                    lendersTrash.map((item) => {
                      let delDateStr = "N/A";
                      let remainingStr = "";
                      if (item.deleted_at) {
                        const delDate = new Date(item.deleted_at);
                        delDateStr = delDate.toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                        
                        // Calculate remaining time
                        const diff = (delDate.getTime() + 3 * 24 * 60 * 60 * 1000) - Date.now();
                        if (diff > 0) {
                          const hoursTotal = Math.floor(diff / (1000 * 60 * 60));
                          const days = Math.floor(hoursTotal / 24);
                          const hours = hoursTotal % 24;
                          remainingStr = ` (${days}d ${hours}h left)`;
                        } else {
                          remainingStr = " (Expiring)";
                        }
                      }
                      
                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-[10px] font-semibold text-gray-850">
                            {item.name}
                          </td>
                          <td className="p-[10px] text-gray-500">
                            {item.productType || "N/A"}
                          </td>
                          <td className="p-[10px] text-gray-650">{item.category || "N/A"}</td>
                          <td className="p-[10px] text-gray-450">
                            {delDateStr}
                            <span className="text-[10px] text-rose-500 font-bold block mt-[2px]">{remainingStr}</span>
                          </td>
                          <td className="p-[10px] text-right">
                            <button
                              onClick={() => handleRestoreLender(item.id)}
                              className="text-primary hover:underline font-bold text-[10.5px] cursor-pointer bg-transparent border-none"
                            >
                              Restore ↺
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
