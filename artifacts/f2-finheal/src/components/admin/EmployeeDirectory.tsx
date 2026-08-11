import React, { useState, useMemo } from "react";
import type { Advisor } from "../AdvisorPanel";

interface EmployeeDirectoryProps {
  employees: Advisor[];
  employeesLoading: boolean;
  handleOpenAddExpert: () => void;
  handleToggleAdvisorRole: (f2FintechId: string, currentIsAdvisor: boolean) => Promise<void>;
  handleToggleActive: (adv: any) => Promise<void>;
  handleOpenEditExpert: (adv: Advisor) => void;
  handleDeleteExpert: (id: string) => void;
  onRenameDeptClick: (deptName: string) => void;
  onOpenTrash?: () => void;
}
   
export default function EmployeeDirectory({
  employees,
  employeesLoading,
  handleOpenAddExpert,
  handleToggleAdvisorRole,
  handleToggleActive,
  handleOpenEditExpert,
  handleDeleteExpert,
  onRenameDeptClick,
  onOpenTrash
}: EmployeeDirectoryProps) {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort() as string[];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.toLowerCase().trim();
    let list = employees;
    if (selectedDeptFilter !== "all") {
      list = list.filter(emp => emp.department === selectedDeptFilter);
    }
    if (!search) return list;
    return list.filter(emp => {
      return (
        (emp.name || "").toLowerCase().includes(search) ||
        (emp.designation || "").toLowerCase().includes(search) ||
        (emp.department || "").toLowerCase().includes(search) ||
        (emp.f2FintechId || emp.id || "").toLowerCase().includes(search)
      );
    });
  }, [employees, employeeSearch, selectedDeptFilter]);

  return (
    <div className="space-y-[16px] animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-gray-900">
              Employees Directory ({filteredEmployees.length})
            </h3>
            {onOpenTrash && (
              <button
                onClick={onOpenTrash}
                className="h-[24px] px-[8px] rounded-[6px] bg-rose-50 hover:bg-rose-100 text-rose-800 text-[9px] font-bold border border-rose-200 transition cursor-pointer flex items-center gap-1 shrink-0"
                title="View soft-deleted employees in Trash"
              >
                🗑️ View Trash
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-[2px]">
            Manage company employee records and toggle active client-facing advisors.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={employeeSearch}
            onChange={e => setEmployeeSearch(e.target.value)}
            placeholder="Search employees by name, ID, dept..."
            className="h-[32px] px-[12px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-[200px]"
          />
          
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="h-[32px] px-[8px] rounded-[10px] border border-gray-200 text-[11px] font-medium text-gray-700 bg-white shadow-inner focus:outline-none focus:border-primary cursor-pointer transition max-w-[150px]"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {selectedDeptFilter !== "all" && (
              <button
                onClick={() => onRenameDeptClick(selectedDeptFilter)}
                title="Rename Selected Department"
                className="h-[32px] w-[32px] flex items-center justify-center border border-gray-200 rounded-[10px] text-[12px] text-gray-500 hover:text-primary hover:border-primary cursor-pointer bg-white transition"
              >
                ✏️
              </button>
            )}
          </div>

          <button
            onClick={handleOpenAddExpert}
            className="bg-primary text-white hover:opacity-90 font-bold py-[8px] px-[16px] rounded-[10px] text-[11px] cursor-pointer shrink-0 transition"
          >
            + Add Employee
          </button>
        </div>
      </div>

      {employeesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[16px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-[16px] bg-white p-[16px] shadow-xs flex flex-col justify-between relative overflow-hidden animate-pulse min-h-[220px]">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gray-200"></div>
              <div className="flex items-start gap-[12px] mt-1">
                <div className="w-[48px] h-[48px] rounded-xl bg-gray-200 shrink-0"></div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-2.5"></div>
                  <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="mt-[14px] pt-[12px] border-t border-gray-100/80 space-y-[10px]">
                <div className="flex justify-between items-center">
                  <div className="h-2.5 bg-gray-100 rounded w-16"></div>
                  <div className="h-2.5 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-2.5 bg-gray-100 rounded w-12"></div>
                  <div className="h-2.5 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="mt-[16px] pt-[12px] border-t border-gray-100 flex items-center justify-between">
                <div className="h-[24px] bg-gray-200 rounded-[8px] w-[90px]"></div>
                <div className="flex items-center gap-2">
                  <div className="h-[26px] w-[26px] bg-gray-200 rounded-[6px]"></div>
                  <div className="h-[26px] w-[26px] bg-gray-200 rounded-[6px]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-[48px] bg-gray-50 border border-dashed rounded-[16px] text-gray-400">
          No employee profiles created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[16px]">
          {filteredEmployees.map((emp) => {
            const isAvailable = emp.availability === "available";
            
            return (
              <div key={emp.id} className="border border-gray-200 rounded-[16px] bg-white p-[16px] shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-[3px] transition-colors duration-300 ${emp.isAdvisor ? 'bg-primary' : 'bg-gray-200'}`}></div>
                
                <div className="flex items-start gap-[12px] mt-1">
                  <div className="relative shrink-0">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-[48px] h-[48px] rounded-xl object-cover border"
                      />
                    ) : (
                      <div className="w-[48px] h-[48px] rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[18px] uppercase">
                        {emp.name ? emp.name.charAt(0) : "U"}
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} title={isAvailable ? 'Available' : 'Unavailable'}></span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 truncate leading-snug">{emp.name}</h4>
                    <div className="text-[10px] text-gray-400 truncate mt-[1px]">{emp.designation}</div>
                    <div className="text-[9.5px] font-bold text-primary/80 uppercase mt-[4px] tracking-wider">{emp.department || "General"}</div>
                  </div>
                </div>

                <div className="mt-[14px] pt-[12px] border-t border-gray-100/80 space-y-[4px] text-[11px] text-gray-605">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Employee ID</span>
                    <span className="font-mono font-bold text-gray-700">{emp.f2FintechId || emp.id}</span>
                  </div>
                  {emp.isAdvisor && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating</span>
                      <span className="font-bold text-amber-500">⭐ {emp.rating}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-bold ${emp.isActive !== false ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {emp.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                  {emp.isActive === false && emp.deactivationReason && (
                     <div className="flex justify-between text-[10px]">
                       <span className="text-gray-400">Reason</span>
                       <span className="text-amber-600 font-medium italic max-w-[150px] truncate" title={emp.deactivationReason}>
                         {emp.deactivationReason}
                       </span>
                     </div>
                   )}
                </div>

                <div className="mt-[16px] pt-[12px] border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleAdvisorRole(emp.f2FintechId || emp.id, emp.isAdvisor || false)}
                    className={`flex items-center gap-[6px] px-[10px] py-[4px] rounded-[8px] text-[10px] font-bold border transition ${emp.isAdvisor 
                      ? 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100' 
                      : 'bg-primary/5 border-primary/10 text-primary hover:bg-primary/10'}`}
                  >
                    {emp.isAdvisor ? "Remove Advisor" : "Make Advisor"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(emp)}
                      className={`${emp.isActive !== false ? 'text-amber-600' : 'text-emerald-600'} hover:underline text-[11px] font-bold cursor-pointer transition`}
                    >
                      {emp.isActive !== false ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleOpenEditExpert(emp)}
                      className="text-primary hover:underline text-[11px] font-bold cursor-pointer transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExpert(emp.f2FintechId || emp.id)}
                      className="text-rose-500 hover:underline text-[11px] font-bold cursor-pointer transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

