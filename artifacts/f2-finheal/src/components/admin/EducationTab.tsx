import type { ContentItem } from "@/components/FinancialEducation";

interface EducationTabProps {
  filteredEducation: ContentItem[];
  filterEduType: string;
  setFilterEduType: (val: string) => void;
  educationLoading: boolean;
  handleOpenAddEdu: () => void;
  handleOpenEditEdu: (item: ContentItem) => void;
  handleDeleteEdu: (id: string) => void;
}

export default function EducationTab({
  filteredEducation,
  filterEduType,
  setFilterEduType,
  educationLoading,
  handleOpenAddEdu,
  handleOpenEditEdu,
  handleDeleteEdu,
}: EducationTabProps) {
  return (
    <div className="space-y-[16px] animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-[14px] font-bold text-gray-900">
            Manage Education Content ({filteredEducation.length})
          </h3>
          <p className="text-[10px] text-gray-400 mt-[2px]">Create and update platform educational guide cards.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-semibold">Filter Type:</span>
            <select
              value={filterEduType}
              onChange={(e) => setFilterEduType(e.target.value)}
              className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition"
            >
              <option value="all">All Content</option>
              <option value="article">Articles</option>
              <option value="video">Videos</option>
            </select>
          </div>
          <button
            onClick={handleOpenAddEdu}
            className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[12px] cursor-pointer"
          >
            + Add Content
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-[16px] overflow-x-auto bg-white shadow-xs">
        <table className="w-full min-w-[800px] text-left text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
              <th className="p-[12px]">Title</th>
              <th className="p-[12px]">Type</th>
              <th className="p-[12px]">Category</th>
              <th className="p-[12px]">Level</th>
              <th className="p-[12px]">Source</th>
              <th className="p-[12px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {educationLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  <td className="p-[12px] max-w-[240px]">
                    <div className="flex items-center gap-[8px]">
                      <div className="w-5 h-5 bg-gray-200 rounded-md"></div>
                      <div className="w-full space-y-1.5">
                        <div className="h-3.5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2.5 bg-gray-100 rounded w-full"></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-[12px]"><div className="h-4 bg-gray-200 rounded-full w-16"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                  <td className="p-[12px]"><div className="h-3 bg-gray-100 rounded w-24"></div></td>
                  <td className="p-[12px] text-right space-x-[6px]">
                    <div className="inline-block h-3 bg-gray-200 rounded w-8 mr-2"></div>
                    <div className="inline-block h-3 bg-gray-200 rounded w-10"></div>
                  </td>
                </tr>
              ))
            ) : filteredEducation.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-400">
                  No educational content items found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredEducation.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-[12px] max-w-[240px]">
                    <div className="flex items-center gap-[8px]">
                      <span className="text-[16px]">{item.emoji}</span>
                      <div className="min-w-0">
                        <strong className="text-gray-900 block truncate">{item.title}</strong>
                        <span className="text-[10px] text-gray-400 block truncate">{item.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-[12px]">
                    {item.type === "article" ? (
                      <span className="bg-blue-50 text-blue-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-blue-100">📄 Article</span>
                    ) : (
                      <span className="bg-purple-50 text-purple-700 px-[8px] py-[3px] rounded-full text-[10px] font-bold border border-purple-100">🎥 Video</span>
                    )}
                  </td>
                  <td className="p-[12px] text-gray-600 font-medium">{item.category}</td>
                  <td className="p-[12px] text-gray-500">{item.level}</td>
                  <td className="p-[12px] text-gray-400 font-medium">{item.source}</td>
                  <td className="p-[12px] text-right space-x-[6px]">
                    <button
                      onClick={() => handleOpenEditEdu(item)}
                      className="text-primary hover:underline font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEdu(item.id)}
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
