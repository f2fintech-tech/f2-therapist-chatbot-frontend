import React, { useState } from "react";

function getLenderLogoUrl(name: string): string | null {
  const clean = name.toLowerCase();
  if (clean.includes("icici")) return "/icici_bank.png";
  if (clean.includes("axis")) return "/axis_bank.png";
  if (clean.includes("bajaj")) return "/bajaj_finance.png";
  if (clean.includes("aditya birla")) return "/aditya_birla_capital.png";
  if (clean.includes("hdfc")) return "https://logo.clearbit.com/hdfcbank.com";
  if (clean.includes("state bank") || clean.includes("sbi")) return "https://logo.clearbit.com/sbi.co.in";
  if (clean.includes("kotak")) return "https://logo.clearbit.com/kotak.com";
  if (clean.includes("tata capital")) return "https://logo.clearbit.com/tatacapital.com";
  if (clean.includes("idfc")) return "https://logo.clearbit.com/idfcfirstbank.com";
  if (clean.includes("federal")) return "https://logo.clearbit.com/federalbank.co.in";
  return null;
}

export function LenderLogo({ name, className = "w-8 h-8" }: { name: string; className?: string }) {
  const logoUrl = getLenderLogoUrl(name);
  const [error, setError] = useState(false);

  const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const getFallbackStyle = (lenderName: string) => {
    const clean = lenderName.toLowerCase();
    if (clean.includes("hdfc")) return { bg: "bg-blue-600", text: "text-white" };
    if (clean.includes("icici")) return { bg: "bg-orange-500", text: "text-white" };
    if (clean.includes("axis")) return { bg: "bg-[#800020]", text: "text-white" };
    if (clean.includes("sbi") || clean.includes("state bank")) return { bg: "bg-cyan-600", text: "text-white" };
    if (clean.includes("kotak")) return { bg: "bg-red-600", text: "text-white" };
    return { bg: "bg-primary/10", text: "text-primary" };
  };

  const style = getFallbackStyle(name);

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt={`${name} Logo`}
        className={`${className} rounded-md object-contain p-0.5 bg-white border border-gray-150 shrink-0`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${className} rounded-md flex items-center justify-center font-bold text-[11px] uppercase shrink-0 ${style.bg} ${style.text} border border-gray-150`}>
      {initials}
    </div>
  );
}
