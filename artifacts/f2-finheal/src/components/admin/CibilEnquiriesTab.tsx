import React, { useEffect, useState, useMemo } from "react";
import { getStoredAuthSession } from "../../utils/authSession";
import { checkAdvisorCibilLimit } from "../../services/cibil";

interface CibilEnquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bureau: string;
  pan?: string;
  score: number;
  fetched_at: string;
  fetched_by?: string;
  user_id: string;
  report_data?: any;
  pdf_url?: string;
}

interface CibilEnquiriesTabProps {
  cibilTotal: number;
  getDateFilterDescription: () => string;
  isAdmin: boolean;
  setActiveTab: (tab: any) => void;
  safeCibilPage: number;
  setCibilPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  filterSearch: string;
  setFilterSearch: (val: string) => void;
  filterBureau: string;
  setFilterBureau: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  filterEmployee: string;
  setFilterEmployee: (val: string) => void;
  allDepartments: string[];
  filterLoanType: string;
  setFilterLoanType: (val: string) => void;
  filterDate: string;
  setFilterDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  todayStr: string;
  handleExportExcel: () => void;
  cibilLoading: boolean;
  cibilEnquiries: CibilEnquiry[];
  paginatedEnquiries: CibilEnquiry[];
  advisors: any[];
  employees: any[];
  animatingCibilRows: string[];
  setViewingCibilReport: (data: any) => void;
  setViewingCibilReportId: (id: string) => void;
  setViewingCibilReportUserId: (id: string) => void;
  handleGenerateCAM: (userId: string, name: string, enqId?: string) => void;
  handleDeleteEnquiry: (id: string) => void;
  classifyEnquiryRole: (email: string, name: string, advisors?: any[]) => "Admin" | "Manager" | "Senior Leadership" | "User";
}

export default function CibilEnquiriesTab({
  cibilTotal,
  getDateFilterDescription,
  isAdmin,
  setActiveTab,
  safeCibilPage,
  setCibilPage,
  totalPages,
  filterSearch,
  setFilterSearch,
  filterBureau,
  setFilterBureau,
  filterRole,
  setFilterRole,
  filterEmployee,
  setFilterEmployee,
  allDepartments,
  filterLoanType,
  setFilterLoanType,
  filterDate,
  setFilterDate,
  filterEndDate,
  setFilterEndDate,
  todayStr,
  handleExportExcel,
  cibilLoading,
  cibilEnquiries,
  paginatedEnquiries,
  advisors,
  employees,
  animatingCibilRows,
  setViewingCibilReport,
  setViewingCibilReportId,
  setViewingCibilReportUserId,
  handleGenerateCAM,
  handleDeleteEnquiry,
  classifyEnquiryRole,
}: CibilEnquiriesTabProps) {
  const hasActiveFilters = filterDate || filterEndDate || filterRole !== "all" || filterEmployee !== "all" || filterLoanType !== "all" || filterSearch !== "" || filterBureau !== "all";

  const departmentEmployees = useMemo(() => {
    if (!filterRole || filterRole === "all" || filterRole === "Client") return [];
    return (employees || []).filter(
      (emp) => (emp.department || "").trim().toLowerCase() === filterRole.trim().toLowerCase()
    );
  }, [employees, filterRole]);

  const [quotaStats, setQuotaStats] = useState<{
    monthly_count: number;
    effective_limit: number;
    limit_reached: boolean;
    is_unlimited: boolean;
    remaining: number | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadQuota = async () => {
      try {
        const session = getStoredAuthSession();
        const activeId = session?.userId || session?.email || "current";
        const stats = await checkAdvisorCibilLimit(activeId);
        if (isMounted && stats) {
          setQuotaStats({
            monthly_count: stats.monthly_count ?? 0,
            effective_limit: stats.effective_limit ?? 50,
            limit_reached: Boolean(stats.limit_reached),
            is_unlimited: Boolean(stats.is_unlimited),
            remaining: stats.remaining ?? null
          });
        }
      } catch (err) {
        console.warn("Failed to load quota stats in CibilEnquiriesTab", err);
      }
    };
    void loadQuota();
    window.addEventListener("finheal:cibil_update", loadQuota);
    return () => {
      isMounted = false;
      window.removeEventListener("finheal:cibil_update", loadQuota);
    };
  }, []);

  return (
    <div className="space-y-[16px] animate-fade-in">
      <div className="border-b border-gray-100 pb-3 space-y-3">
        {/* Row 1: Title & Pagination */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">
                CIBIL Credit Score Enquiries ({cibilTotal})
              </h3>
              <p className="text-[10px] text-gray-400 mt-[2px]">
                {getDateFilterDescription()}
              </p>
            </div>
            {quotaStats && !isAdmin && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-primary/10 border border-primary/20 text-primary text-[11.5px] font-semibold">
                <span>
                  📊 Monthly Quota: <strong>{quotaStats.monthly_count}</strong> / <strong>{quotaStats.is_unlimited ? "Unlimited" : quotaStats.effective_limit}</strong>
                  {!quotaStats.is_unlimited && quotaStats.remaining !== null && (
                    <span className="text-gray-500 font-medium ml-1">({quotaStats.remaining} remaining)</span>
                  )}
                </span>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("trash")}
                className="h-[24px] px-[8px] rounded-[6px] bg-rose-50 hover:bg-rose-100 text-rose-800 text-[9px] font-bold border border-rose-200 transition cursor-pointer flex items-center gap-1 shrink-0"
                title="View soft-deleted enquiries in Trash"
              >
                🗑️ View Trash
              </button>
            )}
          </div>

          {/* Compact Pagination Controls */}
          {cibilTotal > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                disabled={safeCibilPage === 1}
                onClick={() => setCibilPage(prev => Math.max(prev - 1, 1))}
                className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
                title="Previous Page"
              >
                ←
              </button>
              <span className="text-[11px] font-semibold text-gray-500 px-1 min-w-[36px] text-center">
                {safeCibilPage} / {totalPages}
              </span>
              <button
                disabled={safeCibilPage === totalPages}
                onClick={() => setCibilPage(prev => Math.min(prev + 1, totalPages))}
                className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
                title="Next Page"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Row 2 & 3: Filters & Export */}
        <div className="flex flex-col gap-3 pt-1 w-full pb-1">
          {/* Top Filters Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Input */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">Search:</span>
                <input
                  type="text"
                  placeholder="Search Name, Email, PAN..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="h-[32px] px-[12px] w-[150px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>

              {/* Bureau Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">Bureau:</span>
                <select
                  value={filterBureau}
                  onChange={(e) => setFilterBureau(e.target.value)}
                  className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                >
                  <option value="all">All Bureaus</option>
                  <option value="cibil">CIBIL</option>
                  <option value="experian">Experian</option>
                  <option value="bsa_standalone">BSA</option>
                </select>
              </div>

              {/* Department Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">Enquirer:</span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                >
                  <option value="all">All Enquirers</option>
                  <option value="Client">Users (Leads)</option>
                  {allDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Employee Filter Selector (Appears when a specific department is chosen in Enquirer) */}
              {filterRole !== "all" && filterRole !== "Client" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-semibold">Employee:</span>
                  <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                  >
                    <option value="all">All Employees</option>
                    {departmentEmployees.map((emp) => {
                      const empId = emp.f2FintechId || emp.id;
                      return (
                        <option key={empId} value={empId}>
                          {emp.name} ({empId})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Filters Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Active Loan Type Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">Active Loan Type:</span>
                <select
                  value={filterLoanType}
                  onChange={(e) => setFilterLoanType(e.target.value)}
                  className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                >
                  <option value="all">All Loan Types</option>
                  <option value="home">Home Loan</option>
                  <option value="personal">Personal Loan</option>
                  <option value="professional">Professional Loan</option>
                  <option value="creditcard">Credit Card</option>
                  <option value="auto">Auto / Vehicle Loan</option>
                  <option value="business">Business Loan</option>
                  <option value="gold">Gold Loan</option>
                  <option value="education">Education Loan</option>
                  <option value="property">Loan Against Property (LAP)</option>
                  <option value="other">Other Loans</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">From:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  max={todayStr}
                  className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">To:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  max={todayStr}
                  className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterDate(""); setFilterEndDate(""); setFilterRole("all"); setFilterEmployee("all"); setFilterLoanType("all"); setFilterSearch(""); setFilterBureau("all"); }}
                  className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-650 cursor-pointer transition"
                >
                  Reset Filters
                </button>
              )}

              {cibilTotal > 0 && (
                <button
                  onClick={handleExportExcel}
                  className="h-[32px] px-[12px] rounded-[10px] bg-primary text-white hover:bg-opacity-95 text-[11px] font-bold shadow-xs cursor-pointer transition flex items-center gap-1"
                  title="Export leads to Excel workbook (.xlsx)"
                >
                  📥 Export Leads
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-[16px] overflow-x-auto bg-white shadow-xs">
        <table className="w-full min-w-[800px] text-left text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
              <th className="p-[12px]">User Identity</th>
              <th className="p-[12px]">Bureau</th>
              <th className="p-[12px]">PAN Card</th>
              <th className="p-[12px]">Credit Score</th>
              <th className="p-[12px]">Date & Time</th>
              <th className="p-[12px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cibilLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  <td className="p-[12px]">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded-full w-20"></div>
                  </td>
                  <td className="p-[12px]">
                    <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                  </td>
                  <td className="p-[12px]">
                    <div className="h-3.5 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="p-[12px]">
                    <div className="h-4 bg-gray-200 rounded w-10 mb-1"></div>
                    <div className="h-2.5 bg-gray-100 rounded w-12"></div>
                  </td>
                  <td className="p-[12px]">
                    <div className="h-3.5 bg-gray-200 rounded w-28"></div>
                  </td>
                  <td className="p-[12px] flex flex-col items-end justify-center gap-1.5 mt-1">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </td>
                </tr>
              ))
            ) : cibilEnquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-400">
                  {filterDate
                    ? `No ${filterBureau === "experian" ? "Experian" : filterBureau === "cibil" ? "CIBIL" : ""} inquiries found for this particular day.`
                    : `No ${filterBureau === "experian" ? "Experian" : filterBureau === "cibil" ? "CIBIL" : ""} inquiries found on the platform.`}
                </td>
              </tr>
            ) : (
              paginatedEnquiries.map((enq) => {
                let scoreColorClass = "text-red-500";
                let bandText = "Poor";
                const isBsa = enq.bureau?.toLowerCase() === "bsa_standalone";
                if (isBsa) {
                  scoreColorClass = "text-gray-400";
                  bandText = "N/A";
                } else if (enq.score >= 750) {
                  scoreColorClass = "text-emerald-600";
                  bandText = "Excellent";
                } else if (enq.score >= 700) {
                  scoreColorClass = "text-green-500";
                  bandText = "Good";
                } else if (enq.score >= 630) {
                  scoreColorClass = "text-amber-500";
                  bandText = "Fair";
                }

                const role = classifyEnquiryRole(enq.email, enq.name, advisors);
                
                let displayRole: string = role;
                if (role === "User") {
                  const fb = enq.fetched_by || "";
                  const fbLower = fb.toLowerCase().trim();
                  
                  if (!fb || fbLower === "client" || fbLower === "user lead") {
                    displayRole = "User (Lead)";
                  } else if (fbLower === "admin") {
                    displayRole = "System Admin";
                  } else if (fb.includes("(") && fb.includes(")")) {
                    displayRole = fb.split(" (")[0];
                  } else {
                    const emp = employees.find((a: any) => 
                      (a.id || "").toLowerCase() === fbLower || 
                      (a.f2FintechId || "").toLowerCase() === fbLower
                    );
                    if (emp) {
                      displayRole = emp.name;
                    } else if (fbLower === enq.user_id.toLowerCase()) {
                      displayRole = "User (Lead)";
                    } else {
                      displayRole = "System Admin";
                    }
                  }
                }

                let roleColorClass = "bg-emerald-50 text-emerald-700 border-emerald-250";
                if (displayRole === "Admin" || displayRole === "System Admin") {
                  roleColorClass = "bg-rose-50 text-rose-700 border-rose-200";
                } else if (displayRole === "Senior Leadership") {
                  roleColorClass = "bg-amber-50 text-amber-800 border-amber-200";
                } else if (displayRole === "Manager") {
                  roleColorClass = "bg-blue-50 text-blue-700 border-blue-200";
                } else if (displayRole !== "User (Lead)") {
                  roleColorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                }

                return (
                  <tr key={enq.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-500 ease-in-out ${animatingCibilRows.includes(enq.id) ? "opacity-0 -translate-x-full scale-95" : ""}`}>
                    <td className="p-[12px] max-w-[220px] break-words">
                      <strong className="text-gray-900 block">{enq.name}</strong>
                      {enq.email && <span className="text-[10px] text-gray-400 block">{enq.email}</span>}
                      {enq.phone && <span className="text-[10px] text-gray-400 block">📞 {enq.phone}</span>}
                      <div className="mt-[4px]">
                        <span className={`inline-flex items-center px-[6px] py-[1.5px] rounded-full text-[8.5px] font-extrabold uppercase border ${roleColorClass}`}>
                          {displayRole}
                        </span>
                      </div>
                    </td>
                    <td className="p-[12px]">
                      <span className={`inline-flex px-[8px] py-[2px] rounded-full text-[9px] font-bold uppercase ${enq.bureau.toLowerCase() === "experian"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : enq.bureau.toLowerCase() === "cibil"
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-250"
                        }`}>
                        {enq.bureau.toLowerCase() === "bsa_standalone" ? "BSA" : enq.bureau}
                      </span>
                    </td>
                    <td className="p-[12px] font-mono font-semibold text-gray-700 uppercase">
                      {enq.pan || "-"}
                    </td>
                    <td className="p-[12px]">
                      <span className={`text-[15px] font-extrabold ${scoreColorClass}`}>
                        {isBsa ? "N/A" : enq.score}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-medium">
                        {isBsa ? "N/A" : bandText}
                      </span>
                    </td>
                    <td className="p-[12px] text-gray-500">
                      {new Date(enq.fetched_at && !enq.fetched_at.endsWith("Z") && !enq.fetched_at.includes("+") ? `${enq.fetched_at}Z` : enq.fetched_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="p-[12px] text-right">
                      {enq.report_data ? (
                        <button
                          onClick={() => {
                            setViewingCibilReport({
                              ...(enq.report_data || {}),
                              name: enq.name,
                              phone: enq.phone,
                              email: enq.email,
                              bureau: enq.bureau || "CIBIL"
                            });
                            setViewingCibilReportId(enq.id);
                            setViewingCibilReportUserId(enq.user_id);
                          }}
                          className="text-primary hover:underline font-bold text-[11px] block ml-auto cursor-pointer border-none bg-transparent"
                        >
                          View Report ↗
                        </button>
                      ) : enq.pdf_url ? (
                        <a
                          href={enq.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-bold text-[11px] block"
                        >
                          View PDF ↗
                        </a>
                      ) : (
                        <span className="text-gray-400 block">-</span>
                      )}
                      {((enq as any).bsa_excel_url || enq.report_data?.bsa_analysis?.excel_report_url) && (
                        <a
                          href={(enq as any).bsa_excel_url || enq.report_data?.bsa_analysis?.excel_report_url}
                          download
                          className="text-emerald-600 hover:underline font-bold text-[10px] block mt-1 ml-auto"
                        >
                          Download BSA 📥
                        </a>
                      )}
                      {!isBsa && (
                        <button
                          onClick={() => handleGenerateCAM(enq.user_id, enq.name, enq.id)}
                          className="text-emerald-600 hover:underline font-bold text-[10px] block mt-1 ml-auto cursor-pointer border-none bg-transparent"
                        >
                          Generate CAM 📊
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteEnquiry(enq.id)}
                          className="text-rose-600 hover:underline font-bold text-[10px] block mt-1 ml-auto cursor-pointer border-none bg-transparent"
                        >
                          Delete Inquiry 🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Bottom Pagination Controls */}
      {cibilTotal > 0 && (
        <div className="flex items-center justify-end gap-1.5 pt-2">
          <button
            disabled={safeCibilPage === 1}
            onClick={() => setCibilPage(prev => Math.max(prev - 1, 1))}
            className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
            title="Previous Page"
          >
            ←
          </button>
          <span className="text-[11px] font-semibold text-gray-500 px-1 min-w-[36px] text-center">
            {safeCibilPage} / {totalPages}
          </span>
          <button
            disabled={safeCibilPage === totalPages}
            onClick={() => setCibilPage(prev => Math.min(prev + 1, totalPages))}
            className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-600 transition flex items-center justify-center cursor-pointer"
            title="Next Page"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
