import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { TestCard } from "@/components/FinancialHealthTestCatalog";
import type { AdminTestResult } from "@/lib/backendAuth";

// Mapping from test_type keys to readable names (mirrors AdminPortal's TEST_NAMES)
const TEST_NAMES: Record<string, string> = {
  financial_literacy: "Financial Literacy",
  emergency_fund: "Emergency Fund Check",
  loan_fit: "Loan Fit Test",
  debt_balance: "Debt Balance Review",
  credit_readiness: "Credit Readiness Review",
};

interface TestsTabProps {
  // Sub-tab state
  testSubTab: string;
  setTestSubTab: (val: string) => void;

  // Templates sub-tab
  filteredTests: TestCard[];
  testCatalog: TestCard[];
  filterTestName: string;
  setFilterTestName: (val: string) => void;
  testsLoading: boolean;
  handleOpenAddTest: () => void;
  handleOpenEditTest: (test: TestCard) => void;
  handleDeleteTest: (id: string) => void;

  // Logs sub-tab
  testSubmissions: AdminTestResult[];
  filteredSubmissions: AdminTestResult[];
  paginatedSubmissions: AdminTestResult[];
  submissionsLoading: boolean;
  submissionsSearch: string;
  setSubmissionsSearch: (val: string) => void;
  setSubmissionsPage: React.Dispatch<React.SetStateAction<number>>;
  safeSubPage: number;
  totalSubPages: number;
  testAttemptCounts: { name: string; count: number }[];
  handleDeleteTestLog: (id: string) => void;
}

export default function TestsTab({
  testSubTab,
  setTestSubTab,
  filteredTests,
  testCatalog,
  filterTestName,
  setFilterTestName,
  testsLoading,
  handleOpenAddTest,
  handleOpenEditTest,
  handleDeleteTest,
  testSubmissions,
  filteredSubmissions,
  paginatedSubmissions,
  submissionsLoading,
  submissionsSearch,
  setSubmissionsSearch,
  setSubmissionsPage,
  safeSubPage,
  totalSubPages,
  testAttemptCounts,
  handleDeleteTestLog,
}: TestsTabProps) {
  return (
    <div className="space-y-[16px] animate-fade-in">
      {/* Secondary Sub-Tabs Toggle */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setTestSubTab("templates")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition border-none cursor-pointer ${
            testSubTab === "templates"
              ? "bg-primary/10 text-primary"
              : "bg-transparent text-gray-400 hover:text-gray-650"
          }`}
        >
          📋 Test Templates
        </button>
        <button
          onClick={() => setTestSubTab("logs")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition border-none cursor-pointer ${
            testSubTab === "logs"
              ? "bg-primary/10 text-primary"
              : "bg-transparent text-gray-400 hover:text-gray-650"
          }`}
        >
          📝 User Submissions Log
        </button>
      </div>

      {testSubTab === "templates" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">Manage Health Tests ({filteredTests.length})</h3>
              <p className="text-[10px] text-gray-400 mt-[2px]">Administer and customize financial therapy platform health tests.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Test Title Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">Filter by Title:</span>
                <select
                  value={filterTestName}
                  onChange={(e) => setFilterTestName(e.target.value)}
                  className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                >
                  <option value="all">All Tests</option>
                  {testCatalog.map((test) => (
                    <option key={test.id} value={test.title}>
                      {test.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenAddTest}
                className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
              >
                + Add New Test
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-[16px] overflow-x-auto bg-white shadow-xs">
            <table className="w-full min-w-[700px] text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                  <th className="p-[12px]">Test Title</th>
                  <th className="p-[12px]">Duration</th>
                  <th className="p-[12px]">Primary Focus</th>
                  <th className="p-[12px]">Score output</th>
                  <th className="p-[12px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 animate-pulse">
                      <td className="p-[12px] max-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2.5 bg-gray-100 rounded w-full"></div>
                        </div>
                      </td>
                      <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-16"></div></td>
                      <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-24"></div></td>
                      <td className="p-[12px]"><div className="h-3 bg-gray-100 rounded w-20"></div></td>
                      <td className="p-[12px] text-right space-x-[6px]">
                        <div className="inline-block h-3 bg-gray-200 rounded w-8 mr-2"></div>
                        <div className="inline-block h-3 bg-gray-200 rounded w-10"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-gray-400">
                      No health tests match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => (
                    <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-[12px] max-w-[200px]">
                        <strong className="text-gray-900 block truncate">{test.title}</strong>
                        <span className="text-[10px] text-gray-400 block truncate">{test.description}</span>
                      </td>
                      <td className="p-[12px] font-semibold text-gray-600">{test.duration}</td>
                      <td className="p-[12px] text-gray-500">{test.focus}</td>
                      <td className="p-[12px] text-gray-400">{test.result}</td>
                      <td className="p-[12px] text-right space-x-[6px]">
                        <button
                          onClick={() => handleOpenEditTest(test)}
                          className="text-primary hover:underline font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test.id)}
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
        </>
      )}

      {testSubTab === "logs" && (
        <>
          <div className="border-b border-gray-100 pb-3 space-y-3">
            {/* Row 1: Title and pagination */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-gray-900">User Submissions Log ({filteredSubmissions.length})</h3>
                <p className="text-[10px] text-gray-400 mt-[2px]">View and search scores for financial wellness tests taken by platform users.</p>
              </div>

              {/* Compact Pagination Controls in top right corner */}
              {filteredSubmissions.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={safeSubPage === 1}
                    onClick={() => setSubmissionsPage(prev => Math.max(prev - 1, 1))}
                    className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-650 transition flex items-center justify-center cursor-pointer"
                    title="Previous Page"
                  >
                    ←
                  </button>
                  <span className="text-[11px] font-semibold text-gray-500 px-1 min-w-[36px] text-center">
                    {safeSubPage} / {totalSubPages}
                  </span>
                  <button
                    disabled={safeSubPage === totalSubPages}
                    onClick={() => setSubmissionsPage(prev => Math.min(prev + 1, totalSubPages))}
                    className="h-[32px] w-[32px] rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-gray-655 transition flex items-center justify-center cursor-pointer"
                    title="Next Page"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            {/* Submissions Analytics Chart Dashboard */}
            {testSubmissions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-[16px] border border-gray-150/70 mt-2">
                {/* Column 1 & 2: Bar Chart showing Demand */}
                <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-205 shadow-xs flex flex-col gap-3">
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-805">Test Demand Analytics</h4>
                    <p className="text-[10px] text-gray-400 mt-[2px]">Real-time count of quiz attempts by test template to measure platform demand.</p>
                  </div>
                  <div className="h-[230px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={testAttemptCounts}
                        layout="vertical"
                        margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={9.5} tickLine={false} axisLine={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#4b5563"
                          fontSize={10.5}
                          tickLine={false}
                          axisLine={false}
                          width={115}
                          interval={0}
                          tickFormatter={(val) => val.length > 20 ? `${val.substring(0, 17)}...` : val}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                          contentStyle={{
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            fontSize: '11px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            padding: '8px 12px',
                            fontFamily: 'inherit'
                          }}
                          itemStyle={{ color: '#1f2937', fontWeight: '600' }}
                          labelStyle={{ color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                          {testAttemptCounts.map((entry, index) => {
                            const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Column 3: Summary Cards */}
                <div className="flex flex-col gap-3">
                  {/* Card 1: Total attempts */}
                  <div className="bg-white p-4 rounded-xl border border-gray-205 shadow-xs flex-1 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Attempts</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[24px] font-extrabold text-gray-900">{testSubmissions.length}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Total completed</span>
                    </div>
                  </div>

                  {/* Card 2: Highest demand */}
                  <div className="bg-white p-4 rounded-xl border border-gray-205 shadow-xs flex-1 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Most Popular Test</span>
                    <div className="mt-1">
                      <div className="text-[13px] font-extrabold text-gray-800 truncate">
                        {testAttemptCounts[0]?.count > 0 ? testAttemptCounts[0]?.name : "No attempts yet"}
                      </div>
                      <div className="text-[10.5px] text-gray-400 mt-0.5">
                        {testAttemptCounts[0]?.count > 0
                          ? `${testAttemptCounts[0]?.count} attempts (${Math.round((testAttemptCounts[0]?.count / testSubmissions.length) * 100)}%)`
                          : "Start taking tests to see trends"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Row 2: Filters */}
            <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
              {/* Search Input */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">Search:</span>
                <input
                  type="text"
                  placeholder="Search Name or Email..."
                  value={submissionsSearch}
                  onChange={(e) => {
                    setSubmissionsSearch(e.target.value);
                    setSubmissionsPage(1);
                  }}
                  className="h-[32px] px-[12px] w-[180px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>

              {/* Test Title Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold">Test Taken:</span>
                <select
                  value={filterTestName}
                  onChange={(e) => {
                    setFilterTestName(e.target.value);
                    setSubmissionsPage(1);
                  }}
                  className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
                >
                  <option value="all">All Tests</option>
                  {testCatalog.map((test) => (
                    <option key={test.id} value={test.title}>
                      {test.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              {(submissionsSearch !== "" || filterTestName !== "all") && (
                <button
                  onClick={() => {
                    setSubmissionsSearch("");
                    setFilterTestName("all");
                    setSubmissionsPage(1);
                  }}
                  className="h-[32px] px-[10px] rounded-[10px] border border-gray-200 bg-gray-50 hover:bg-gray-150 text-[11px] font-bold text-gray-650 cursor-pointer transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-[16px] overflow-x-auto bg-white shadow-xs">
            <table className="w-full min-w-[750px] text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                  <th className="p-[12px]">User Identity</th>
                  <th className="p-[12px]">Test Title</th>
                  <th className="p-[12px]">Calculated Score</th>
                  <th className="p-[12px]">Assessment Outcome</th>
                  <th className="p-[12px]">Date Completed</th>
                  <th className="p-[12px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissionsLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-gray-400">Loading user submissions...</td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-gray-400">No submissions found matching filter criteria.</td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((sub) => {
                    let riskColor = "text-gray-600 bg-gray-50 border-gray-200";
                    if (sub.risk_level) {
                      const r = sub.risk_level.toLowerCase();
                      if (r.includes("high") || r.includes("severe")) {
                        riskColor = "text-rose-700 bg-rose-50 border-rose-200";
                      } else if (r.includes("mod") || r.includes("medium")) {
                        riskColor = "text-amber-700 bg-amber-50 border-amber-250";
                      } else if (r.includes("low") || r.includes("minimal")) {
                        riskColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                      }
                    }

                    return (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="p-[12px]">
                          <strong className="text-gray-900 block">{sub.user_name || "Guest User"}</strong>
                          {sub.user_email && <span className="text-[10px] text-gray-400 block">{sub.user_email}</span>}
                          <span className="text-[9px] text-gray-400 block font-mono">UID: {sub.user_id}</span>
                        </td>
                        <td className="p-[12px] font-semibold text-gray-700 capitalize">
                          {sub.test_type ? (TEST_NAMES[sub.test_type] || sub.test_type.replace(/_|-/g, " ")) : "-"}
                        </td>
                        <td className="p-[12px]">
                          {sub.score !== null ? (
                            <div className="space-y-[2px]">
                              <span className="text-[13px] font-extrabold text-gray-900">{sub.score} points</span>
                              {sub.percentage_score !== null && (
                                <span className="text-[10px] text-gray-400 block">Percentage: {sub.percentage_score}%</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-[12px]">
                          <div className="space-y-[4px]">
                            {sub.category && (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150 uppercase">
                                {sub.category}
                              </span>
                            )}
                            {sub.risk_level && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase border ml-1 ${riskColor}`}>
                                {sub.risk_level}
                              </span>
                            )}
                            {!sub.category && !sub.risk_level && <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="p-[12px] text-gray-500">
                          {new Date(sub.completed_at && !sub.completed_at.endsWith("Z") && !sub.completed_at.includes("+") ? `${sub.completed_at}Z` : sub.completed_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </td>
                        <td className="p-[12px] text-right">
                          <button
                            onClick={() => handleDeleteTestLog(sub.id)}
                            className="text-rose-600 hover:text-white font-medium bg-rose-50 hover:bg-rose-500 px-[12px] py-[6px] rounded-[6px] transition-all border border-rose-200 hover:border-rose-500 text-[11px]"
                            title="Delete Log"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
