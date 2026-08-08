import type { LenderProduct } from "@/components/LoanCalculatorView";

interface LendersTabProps {
  filteredLenders: LenderProduct[];
  filterLenderSearch: string;
  setFilterLenderSearch: (val: string) => void;
  lendersLoading: boolean;
  handleOpenAddLender: () => void;
  handleOpenEditLender: (l: LenderProduct) => void;
  handleDeleteLender: (l: LenderProduct) => void;
}

export default function LendersTab({
  filteredLenders,
  filterLenderSearch,
  setFilterLenderSearch,
  lendersLoading,
  handleOpenAddLender,
  handleOpenEditLender,
  handleDeleteLender,
}: LendersTabProps) {
  return (
    <div className="space-y-[16px] animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-[14px] font-bold text-gray-900">Manage Lenders Catalog ({filteredLenders.length})</h3>
          <p className="text-[10px] text-gray-400 mt-[2px]">Administer and customize bank loan products catalog list.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Lender Search Input */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-semibold">Search:</span>
            <input
              type="text"
              placeholder="Search Bank/Product..."
              value={filterLenderSearch}
              onChange={(e) => setFilterLenderSearch(e.target.value)}
              className="h-[32px] px-[12px] w-[180px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <button
            onClick={handleOpenAddLender}
            className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
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
                  <td className="p-[12px] text-right space-x-[6px]">
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
    </div>
  );
}
