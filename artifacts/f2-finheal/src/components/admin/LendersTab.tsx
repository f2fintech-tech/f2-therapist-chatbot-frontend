import { useState } from "react";
import type { LenderProduct } from "@/components/LoanCalculatorView";
import LenderVersionHistoryModal from "./LenderVersionHistoryModal";

interface LendersTabProps {
  filteredLenders: LenderProduct[];
  filterLenderSearch: string;
  setFilterLenderSearch: (val: string) => void;
  lendersLoading: boolean;
  handleOpenAddLender: () => void;
  handleOpenEditLender: (l: LenderProduct) => void;
  handleDeleteLender: (l: LenderProduct) => void;
  onRefreshLenders?: () => void;
}

export default function LendersTab({
  filteredLenders,
  filterLenderSearch,
  setFilterLenderSearch,
  lendersLoading,
  handleOpenAddLender,
  handleOpenEditLender,
  handleDeleteLender,
  onRefreshLenders,
}: LendersTabProps) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
  const [selectedLenderName, setSelectedLenderName] = useState<string | null>(null);

  const handleOpenGlobalHistory = () => {
    setSelectedLenderId(null);
    setSelectedLenderName(null);
    setHistoryModalOpen(true);
  };

  const handleOpenLenderHistory = (l: LenderProduct) => {
    setSelectedLenderId(l.id);
    setSelectedLenderName(l.name);
    setHistoryModalOpen(true);
  };

  return (
    <div className="space-y-[16px] animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3.5 pt-1">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
            Manage Lenders Catalog
            <span className="bg-primary/10 text-primary text-[11px] font-extrabold px-2 py-0.5 rounded-full">
              {filteredLenders.length}
            </span>
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Administer bank loan products catalog & track policy version history.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Lender Search Input */}
          <div className="flex items-center gap-1.5 bg-gray-50/90 border border-gray-200 rounded-[10px] px-2.5 h-[34px] shrink-0">
            <span className="text-[11px] text-gray-400 font-semibold select-none">Search:</span>
            <input
              type="text"
              placeholder="Search Bank/Product..."
              value={filterLenderSearch}
              onChange={(e) => setFilterLenderSearch(e.target.value)}
              className="w-[125px] sm:w-[145px] text-[11px] font-medium text-gray-700 bg-transparent focus:outline-none placeholder:text-gray-400"
            />
          </div>

          <button
            onClick={handleOpenGlobalHistory}
            className="h-[34px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold px-[11px] rounded-[10px] text-[11px] cursor-pointer transition flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <span>📜</span> Audit Trail
          </button>

          <button
            onClick={handleOpenAddLender}
            className="h-[34px] bg-primary text-white hover:opacity-95 font-bold px-[13px] rounded-[10px] text-[11px] cursor-pointer transition shrink-0 whitespace-nowrap shadow-2xs"
          >
            + Add Lender Product
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-[16px] overflow-x-auto bg-white shadow-xs">
        <table className="w-full min-w-[900px] text-left text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
              <th className="p-[12px]">Lender / Product</th>
              <th className="p-[12px]">Lender Type</th>
              <th className="p-[12px]">Category</th>
              <th className="p-[12px]">Rate (ROI)</th>
              <th className="p-[12px]">Limit Range</th>
              <th className="p-[12px]">Min CIBIL / Income</th>
              <th className="p-[12px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lendersLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  <td className="p-[12px] max-w-[200px]">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/3"></div>
                  </td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-16"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-24"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-28"></div></td>
                  <td className="p-[12px]">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-2.5 bg-gray-100 rounded w-24"></div>
                  </td>
                  <td className="p-[12px] text-right">
                    <div className="inline-block h-3 bg-gray-200 rounded w-8 mr-2"></div>
                    <div className="inline-block h-3 bg-gray-200 rounded w-10"></div>
                  </td>
                </tr>
              ))
            ) : filteredLenders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-400">
                  {filterLenderSearch ? "No lenders match your search query." : "No lenders listed. Click '+ Add Lender Product' to seed catalog."}
                </td>
              </tr>
            ) : (
              filteredLenders.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-[12px] max-w-[200px]">
                    <strong className="text-gray-900 block">{l.name}</strong>
                    <span className="text-[10px] text-gray-400 block">{l.productType}</span>
                    <span className="text-[9px] text-primary/70 font-semibold uppercase">{l.id}</span>
                  </td>
                  <td className="p-[12px] font-semibold text-gray-600">{l.lenderType}</td>
                  <td className="p-[12px] font-semibold text-gray-500 uppercase">{l.category}</td>
                  <td className="p-[12px] font-bold text-emerald-600">{l.minRate}% - {l.maxRate}%</td>
                  <td className="p-[12px] font-semibold text-gray-800">
                    ₹{l.minAmount.toLocaleString("en-IN")} - ₹{l.maxAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-[12px] text-gray-500">
                    <span>CIBIL: ≥{l.minCibil}</span>
                    <span className="block text-[10px] text-gray-400">Min Income: ₹{l.minMonthlyIncome.toLocaleString("en-IN")}</span>
                  </td>
                  <td className="p-[12px] text-right space-x-[8px]">
                    <button
                      onClick={() => handleOpenLenderHistory(l)}
                      className="text-amber-600 hover:text-amber-700 hover:underline font-bold cursor-pointer text-[11px]"
                      title="View Version History & Field Diffs"
                    >
                      📜 History
                    </button>
                    <button
                      onClick={() => handleOpenEditLender(l)}
                      className="text-primary hover:underline font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLender(l)}
                      className="text-rose-500 hover:underline font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Version History Modal */}
      <LenderVersionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        lenderId={selectedLenderId}
        lenderName={selectedLenderName}
        onRollbackSuccess={() => {
          if (onRefreshLenders) onRefreshLenders();
        }}
      />
    </div>
  );
}
