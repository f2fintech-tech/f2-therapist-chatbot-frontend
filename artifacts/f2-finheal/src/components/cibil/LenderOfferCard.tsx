import React, { useState } from "react";
import { Check, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { LenderLogo } from "./LenderLogo";
import type { LenderProduct } from "./types";

export default function LenderOfferCard({
  lender,
  eligibleLimit,
  emi,
  resultingFoir,
  likelihood,
  reasons,
  currency,
  formatCurrency,
  formatCompact,
  onApplyNow,
  eligIncome,
  eligEmi,
  eligTenure,
  isSelected = false,
  onToggleSelect
}: {
  lender: LenderProduct;
  eligibleLimit: number;
  emi: number;
  resultingFoir: number;
  likelihood: "high" | "medium" | "low" | "ineligible";
  reasons: string[];
  currency: any;
  formatCurrency: (val: number) => string;
  formatCompact: (val: number) => string;
  onApplyNow: any;
  eligIncome: string;
  eligEmi: string;
  eligTenure: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isNotApproved = likelihood === "ineligible";

  // Likelihood Badge Config
  const badgeConfig = {
    high: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "High Match" },
    medium: { bg: "bg-amber-50 text-amber-700 border-amber-250", label: "Medium Match" },
    low: { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Low Match" },
    ineligible: { bg: "bg-gray-100 text-gray-600 border-gray-200", label: "Not Approved" }
  }[likelihood];

  const handleApplyClick = () => {
    const rateStr = lender.minRate === lender.maxRate ? `${lender.minRate}%` : `${lender.minRate}% – ${lender.maxRate}%`;
    let details = `Applied for ${lender.name} ${lender.productType} via matching suggestions. ` +
      `Eligible Limit: ${formatCurrency(eligibleLimit)}, ROI: ${rateStr}, Tenure: ${eligTenure} years. ` +
      `Lender constraints: Max FOIR: ${lender.maxFoirPct}%, processing fee: ${lender.processingFee || "N/A"}.`;
    onApplyNow(
      `${lender.name} ${lender.productType}`,
      eligibleLimit,
      lender.minRate,
      Number(eligTenure) || 5,
      details
    );
  };

  return (
    <div className={`border rounded-[16px] p-4 bg-white shadow-sm transition-all duration-300 ${
      isNotApproved ? "opacity-75 border-gray-200" : "border-gray-200 hover:shadow-md hover:border-primary/30"
    }`}>
      {/* Top row */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2.5">
          {!isNotApproved && onToggleSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className={`flex items-center justify-center h-[18px] w-[18px] rounded-[5px] border transition-all shrink-0 cursor-pointer mt-2 ${
                isSelected 
                  ? "bg-primary border-primary text-white shadow-sm shadow-primary/25" 
                  : "border-gray-300 hover:border-primary/50 bg-white"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
            </button>
          )}
          <LenderLogo name={lender.name} className="w-8 h-8 mt-0.5" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-bold text-gray-900">{lender.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border uppercase tracking-wider ${badgeConfig.bg}`}>
                {badgeConfig.label}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-gray-400 mt-0.5">{lender.productType}</span>
          </div>
        </div>
        {!isNotApproved && (
          <button
            onClick={handleApplyClick}
            className="px-3.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-[8px] hover:opacity-90 transition-all cursor-pointer"
          >
            Apply Now
          </button>
        )}
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-3 my-3 text-center">
        <div className="flex flex-col border-r border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Eligible Limit</span>
          <span className="text-[14px] font-bold text-gray-900 mt-0.5">
            {isNotApproved ? "₹0" : formatCompact(eligibleLimit)}
          </span>
        </div>
        <div className="flex flex-col border-r border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Interest Rate</span>
          <span className="text-[13px] font-bold text-gray-900 mt-0.5">
            {lender.minRate === lender.maxRate ? `${lender.minRate}%` : `${lender.minRate}% – ${lender.maxRate}%`}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Est. Monthly EMI</span>
          <span className="text-[14px] font-bold text-gray-900 mt-0.5">
            {isNotApproved ? "—" : formatCompact(emi)}
          </span>
        </div>
      </div>

      {/* Bottom Collapsible Info */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <span>{expanded ? "Hide Details" : "View Checklist & Details"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="mt-2 text-[11.5px] text-gray-600 flex flex-col gap-3 animate-fade-up">
            {/* Why Matched / Why Not */}
            <div className="p-2.5 rounded-[10px] bg-gray-50/50 border border-gray-100">
              <span className="font-bold text-gray-700 block mb-1">
                {isNotApproved ? "Reason for Not Approved:" : "Why Matched:"}
              </span>
              {isNotApproved ? (
                <div className="flex flex-col gap-1 text-rose-700 font-semibold">
                  {reasons.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span>{r.split(": ")[1] || r}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Profile meets CIBIL (≥{lender.minCibil}), Income & FOIR requirements.</span>
                </div>
              )}
            </div>

            {/* Pros and Cons */}
            {!isNotApproved && (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Pros</span>
                  <ul className="list-disc pl-3 text-emerald-700 space-y-0.5">
                    {lender.pros.map((p, idx) => <li key={idx}>{p}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Cons</span>
                  <ul className="list-disc pl-3 text-amber-700 space-y-0.5">
                    {lender.cons.map((c, idx) => <li key={idx}>{c}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Document Checklist */}
            <div className="border-t border-gray-100 pt-2">
              <span className="font-bold text-gray-700 block mb-1.5">Required Documents Checklist:</span>
              <div className="grid gap-1.5">
                {lender.docsRequired.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-[8px] px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary block shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
