import React from "react";

interface FactorCardProps {
  label: string;
  value: string;
  subtext: string;
  status: "Excellent" | "Good" | "Poor";
}

export default function FactorCard({ label, value, subtext, status }: FactorCardProps) {
  return (
    <div className="rounded-[16px] border border-gray-100 bg-gray-55/35 p-[14px] flex flex-col justify-between text-left transition-all hover:-translate-y-[1px] hover:shadow-sm">
      <div>
        <span className="text-[11px] font-semibold text-gray-400 block tracking-[0.5px]">{label}</span>
        <div className="text-[20px] font-extrabold text-gray-800 mt-[4px]">{value}</div>
      </div>
      <div className="mt-[8px]">
        <p className="text-[10px] text-gray-400 leading-none">{subtext}</p>
        <span className={`text-[10px] font-bold inline-block mt-[4px] px-[8px] py-[2px] rounded-[10px] ${
          status === "Excellent" ? "bg-emerald-50 text-emerald-700" :
          status === "Good" ? "bg-blue-50 text-blue-700" :
          "bg-rose-50 text-rose-700"
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}
