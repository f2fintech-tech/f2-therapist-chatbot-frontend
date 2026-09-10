import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface VersionRecord {
  id: string;
  lender_id: string;
  lender_name: string | null;
  version: number;
  action: string;
  edited_by: {
    employee_id: string;
    name: string;
    designation: string;
  };
  change_reason: string | null;
  changes_diff: Record<string, { old: any; new: any }> | null;
  snapshot: Record<string, any>;
  created_at: string;
}

interface LenderVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lenderId: string | null;
  lenderName: string | null;
}

export default function LenderVersionHistoryModal({
  isOpen,
  onClose,
  lenderId,
  lenderName,
}: LenderVersionHistoryModalProps) {
  const [history, setHistory] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmployee, setSearchEmployee] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, lenderId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const url = lenderId
        ? `${apiBase}/lenders/${lenderId}/history`
        : `${apiBase}/lenders/history`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch version history");
      }
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      console.error("Error fetching version history:", err);
      setError(err.message || "Failed to load version history.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (searchEmployee) {
      const searchLower = searchEmployee.toLowerCase();
      const matchesEmp =
        item.edited_by.employee_id.toLowerCase().includes(searchLower) ||
        item.edited_by.name.toLowerCase().includes(searchLower) ||
        item.edited_by.designation.toLowerCase().includes(searchLower) ||
        (item.lender_id && item.lender_id.toLowerCase().includes(searchLower));
      if (!matchesEmp) return false;
    }

    if (filterDate) {
      if (!item.created_at) return false;
      const utcStr = item.created_at.endsWith("Z") || item.created_at.includes("+")
        ? item.created_at
        : item.created_at + "Z";
      const itemLocalDate = new Date(utcStr).toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
      const itemUtcDate = item.created_at.split("T")[0];
      if (itemLocalDate !== filterDate && itemUtcDate !== filterDate) {
        return false;
      }
    }

    return true;
  });

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                Audit Trail
              </span>
              <h2 className="text-[16px] font-bold text-gray-900">
                {lenderId ? `Version History: ${lenderName || lenderId}` : "Global Catalog Policy History"}
              </h2>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {lenderId
                ? `Track all employee edits and criteria changes for Product ID: ${lenderId}`
                : "Full audit log of policy updates across all lender products."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-200/60 transition text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
            {/* Filter Employee */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500">Filter Employee:</span>
              <input
                type="text"
                placeholder="Search by Employee ID / Name / Designation..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="h-[34px] px-[12px] w-[210px] sm:w-[230px] rounded-[10px] border border-gray-200 text-[11px] text-gray-700 bg-gray-50/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>

            {/* Filter Date */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500">Filter Date:</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="h-[34px] px-[10px] rounded-[10px] border border-gray-200 text-[11px] text-gray-700 bg-gray-50/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition cursor-pointer"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer transition"
                    title="Clear Date Filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {(searchEmployee || filterDate) && (
              <button
                onClick={() => {
                  setSearchEmployee("");
                  setFilterDate("");
                }}
                className="text-[11px] text-gray-500 hover:text-gray-900 underline font-semibold cursor-pointer ml-1"
              >
                Reset Filters
              </button>
            )}
          </div>

          <span className="text-[11px] font-medium text-gray-400">
            Total Records: {filteredHistory.length}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
              <p className="text-[12px] font-semibold text-gray-500">Fetching catalog version logs...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[12px] text-[12px]">
              {error}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-[12px]">
              No version history records found matching criteria.
            </div>
          ) : (
            filteredHistory.map((item) => {
              const actionColors: Record<string, string> = {
                CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
                SOFT_DELETE: "bg-red-50 text-red-700 border-red-200",
                RESTORE: "bg-purple-50 text-purple-700 border-purple-200",
                ROLLBACK: "bg-amber-50 text-amber-700 border-amber-200",
              };

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[14px] border border-gray-200/80 p-4 shadow-xs hover:border-gray-300 transition space-y-3"
                >
                  {/* Top info line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-gray-900 text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                        V{item.version}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          actionColors[item.action] || "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {item.action}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-800">
                        Product ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-primary">{item.lender_id}</code>
                      </span>
                      {item.lender_name && (
                        <span className="text-[11px] text-gray-500 font-medium">
                          ({item.lender_name})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.created_at
                          ? new Date(item.created_at.endsWith("Z") || item.created_at.includes("+") ? item.created_at : item.created_at + "Z").toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Employee Audit Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/80 px-3 py-2 rounded-[10px] text-[11px]">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-gray-400 font-medium">Employee Code:</span>{" "}
                        <span className="font-bold text-gray-900 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                          {item.edited_by.employee_id}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Name:</span>{" "}
                        <span className="font-bold text-gray-800">{item.edited_by.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium">Designation:</span>{" "}
                        <span className="font-semibold text-primary">{item.edited_by.designation}</span>
                      </div>
                    </div>

                    {item.change_reason && (
                      <div className="text-[10px] italic text-gray-600">
                        "{item.change_reason}"
                      </div>
                    )}
                  </div>

                  {/* Field Diffs */}
                  {item.changes_diff && Object.keys(item.changes_diff).length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Policy Criteria Changes (Diff):
                      </p>
                      <div className="bg-gray-50/50 rounded-[10px] border border-gray-150 overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="bg-gray-100/70 text-gray-500 font-semibold border-b border-gray-200">
                              <th className="py-1.5 px-3">Field Name</th>
                              <th className="py-1.5 px-3">Previous Value (Old)</th>
                              <th className="py-1.5 px-3">Updated Value (New)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(item.changes_diff).map(([field, vals]) => (
                              <tr key={field} className="border-b border-gray-100 last:border-0 hover:bg-white">
                                <td className="py-1.5 px-3 font-mono text-gray-700 font-semibold">{field}</td>
                                <td className="py-1.5 px-3 text-red-600 font-mono bg-red-50/30">
                                  {vals.old === null || vals.old === undefined ? "—" : JSON.stringify(vals.old)}
                                </td>
                                <td className="py-1.5 px-3 text-emerald-700 font-mono font-bold bg-emerald-50/30">
                                  {vals.new === null || vals.new === undefined ? "—" : JSON.stringify(vals.new)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 text-[12px] font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
