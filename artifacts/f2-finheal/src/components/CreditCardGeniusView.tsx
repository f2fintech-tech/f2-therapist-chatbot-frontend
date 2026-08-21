import React, { useState, useEffect, useMemo } from "react";
import {
  fetchCardsCatalog,
  fetchPopularCards,
  checkCardEligibility,
  calculateCardSavings,
  submitCardLead,
  EligibilityPayload,
  SpendCalculatePayload,
  CardLeadPayload,
} from "@/lib/creditCardApi";

// Helper function to extract and format fees cleanly
function formatFee(feeValue: any, defaultText: string = "Free") {
  if (feeValue === undefined || feeValue === null || feeValue === "") return defaultText;
  const str = String(feeValue).trim();
  if (!str || str.toUpperCase() === "N/A") return defaultText;

  const lower = str.toLowerCase();
  if (lower === "0" || lower.includes("free") || lower.includes("nil") || lower.includes("lifetime")) {
    return lower.includes("lifetime") ? "Lifetime Free" : "Free (₹0)";
  }

  if (str.startsWith("₹") || lower.includes("rs") || lower.includes("rupees")) {
    return str;
  }

  if (!isNaN(Number(str))) {
    return `₹${Number(str).toLocaleString("en-IN")}`;
  }

  return str;
}

// Helper to extract perks / highlights from BankKaro JSON
function extractPerks(card: any): string[] {
  const perks: string[] = [];

  if (Array.isArray(card?.product_usps) && card.product_usps.length > 0) {
    card.product_usps.forEach((u: any) => {
      const txt = typeof u === "string" ? u : u?.title || u?.usp || u?.description;
      if (txt) perks.push(txt);
    });
  }

  if (card?.welcome_text) perks.push(`Welcome Benefit: ${card.welcome_text}`);
  if (card?.lounge_text) perks.push(`Lounge Access: ${card.lounge_text}`);

  if (Array.isArray(card?.perks)) {
    card.perks.forEach((p: any) => {
      const txt = typeof p === "string" ? p : p?.title || p?.name;
      if (txt) perks.push(txt);
    });
  }

  if (Array.isArray(card?.highlights)) {
    card.highlights.forEach((h: any) => {
      const txt = typeof h === "string" ? h : h?.title || h?.name;
      if (txt) perks.push(txt);
    });
  }

  if (Array.isArray(card?.tags) && card.tags.length > 0) {
    card.tags.forEach((t: any) => {
      const txt = typeof t === "string" ? t : t?.name || t?.tag;
      if (txt) perks.push(txt);
    });
  }

  return Array.from(new Set(perks)).filter(Boolean);
}

// Helper to extract and style credit card payment network (Visa, RuPay, Mastercard, Amex)
function extractCardNetwork(card: any, titleStr: string = ""): { label: string; badgeClass: string } {
  const parts: string[] = [];

  const addPart = (val: any) => {
    if (!val) return;
    if (typeof val === "string" || typeof val === "number") {
      parts.push(String(val).toLowerCase());
    } else if (Array.isArray(val)) {
      val.forEach((item) => addPart(item));
    } else if (typeof val === "object") {
      Object.values(val).forEach((item) => {
        if (typeof item === "string" || typeof item === "number") {
          parts.push(String(item).toLowerCase());
        }
      });
    }
  };

  addPart(card?.network);
  addPart(card?.networks);
  addPart(card?.card_network);
  addPart(card?.card_networks);
  addPart(card?.payment_network);
  addPart(card?.network_name);
  addPart(card?.network_type);
  addPart(card?.network_title);
  addPart(card?.network_logo);
  addPart(card?.network_icon);
  addPart(card?.card_alias);
  addPart(card?.seo_card_alias);
  addPart(card?.tags);
  addPart(card?.product_usps);
  addPart(card?.highlights);
  addPart(card?.title || card?.name || card?.card_name || titleStr);

  const combined = parts.join(" ");

  // 1. RuPay / UPI cards
  if (combined.includes("rupay") || combined.includes("upi") || combined.includes("kiwi")) {
    return {
      label: "RuPay",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/80",
    };
  }

  // 2. Mastercard
  if (combined.includes("mastercard") || combined.includes("master card")) {
    return {
      label: "Mastercard",
      badgeClass: "bg-red-50 text-red-700 border border-red-200/80",
    };
  }

  // 3. Amex
  if (combined.includes("amex") || combined.includes("american express")) {
    return {
      label: "Amex",
      badgeClass: "bg-sky-50 text-sky-700 border border-sky-200/80",
    };
  }

  // 4. Diners Club
  if (combined.includes("diners")) {
    return {
      label: "Diners Club",
      badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200/80",
    };
  }

  // 5. Default/Standard Credit Cards: VISA
  return {
    label: "VISA",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200/80",
  };
}

const CARD_THEMES = [
  {
    theme: "blue",
    badge: "bg-blue-50/90 text-blue-600 border border-blue-100",
    joiningText: "text-blue-600",
    annualText: "text-emerald-600",
    check: "text-blue-500",
    button: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25",
  },
  {
    theme: "purple",
    badge: "bg-purple-50/90 text-purple-600 border border-purple-100",
    joiningText: "text-purple-600",
    annualText: "text-emerald-600",
    check: "text-purple-500",
    button: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25",
  },
  {
    theme: "emerald",
    badge: "bg-emerald-50/90 text-emerald-600 border border-emerald-100",
    joiningText: "text-blue-600",
    annualText: "text-emerald-600",
    check: "text-emerald-500",
    button: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25",
  },
  {
    theme: "indigo",
    badge: "bg-indigo-50/90 text-indigo-600 border border-indigo-100",
    joiningText: "text-indigo-600",
    annualText: "text-emerald-600",
    check: "text-indigo-500",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25",
  },
];

function CardThumbnailImage({
  src,
  title,
  className = "w-full aspect-[1.58/1]",
}: {
  src?: string;
  title?: string;
  className?: string;
}) {
  const [isVertical, setIsVertical] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`${className} rounded-2xl bg-gradient-to-tr from-slate-800 via-indigo-950 to-slate-900 flex flex-col items-center justify-center text-white p-4 shadow-md shrink-0 border border-slate-700/50`}
      >
        <span className="text-2xl">💳</span>
        {title && (
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300 mt-1 line-clamp-1">
            {title}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${className} relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-950/10 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]`}
    >
      <img
        src={src}
        alt={title || "Credit Card"}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalHeight > img.naturalWidth * 1.1) {
            setIsVertical(true);
          }
        }}
        onError={() => setHasError(true)}
        className={`w-full h-full transition-transform duration-300 ${
          isVertical
            ? "-rotate-90 scale-[1.55] object-cover"
            : "object-cover"
        }`}
      />
    </div>
  );
}

interface GlassmorphismCardProps {
  card?: any;
  idx: number;
  bankName?: string;
  cardTitle: string;
  joiningFee: string;
  annualFee: string;
  image?: string;
  perks?: string[];
  rankText?: string;
  netSavingsText?: string;
  badgeEligible?: boolean;
  onApply: () => void;
}

function GlassmorphismCard({
  card,
  idx,
  bankName = "PARTNER BANK",
  cardTitle,
  joiningFee,
  annualFee,
  image,
  perks = [],
  rankText,
  netSavingsText,
  badgeEligible,
  onApply,
}: GlassmorphismCardProps) {
  const themeObj = useMemo(() => {
    const bankLower = (bankName || "").toLowerCase();
    const titleLower = (cardTitle || "").toLowerCase();

    if (titleLower.includes("axis") || bankLower.includes("axis")) {
      return CARD_THEMES[1];
    }
    if (
      titleLower.includes("kiwi") ||
      titleLower.includes("free") ||
      joiningFee.toLowerCase().includes("free")
    ) {
      return CARD_THEMES[2];
    }
    if (titleLower.includes("hdfc") || bankLower.includes("hdfc")) {
      return CARD_THEMES[3];
    }
    return CARD_THEMES[idx % CARD_THEMES.length];
  }, [bankName, cardTitle, joiningFee, idx]);

  const networkObj = useMemo(() => extractCardNetwork(card, cardTitle), [card, cardTitle]);

  return (
    <div className="group relative flex flex-col justify-between bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.09)] rounded-[26px] p-6 transition-all duration-300 hover:-translate-y-1">
      <div className="space-y-4">
        {/* Full-width Credit Card Image Section */}
        <div className="relative">
          <CardThumbnailImage src={image} title={cardTitle} className="w-full aspect-[1.58/1]" />

          {/* Floating Overlay Badges for Status */}
          {(badgeEligible || rankText) && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              {badgeEligible && (
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md backdrop-blur-sm">
                  Eligible ✓
                </span>
              )}
              {rankText && (
                <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md backdrop-blur-sm">
                  {rankText}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Title & Compact Network Badge */}
        <div className="flex items-start justify-between gap-2 pt-0.5">
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {cardTitle}
          </h3>
          {networkObj && (
            <span
              className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mt-0.5 ${networkObj.badgeClass}`}
            >
              {networkObj.label}
            </span>
          )}
        </div>

        {/* Net Savings Badge if calculator tab */}
        {netSavingsText && (
          <div className="inline-block px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
            Save ₹{netSavingsText}/yr
          </div>
        )}

        {/* Side-by-Side Dual Fee Rectangles */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Joining Fee Box */}
          <div className="bg-slate-50/90 border border-slate-200/60 rounded-2xl p-3 flex flex-col justify-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
              JOINING FEE
            </span>
            <span className={`text-xs md:text-sm font-extrabold ${themeObj.joiningText}`}>
              {joiningFee}
            </span>
          </div>

          {/* Annual Fee Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 flex flex-col justify-center">
            <span className="text-[10px] font-extrabold text-emerald-600/70 uppercase tracking-wider mb-0.5">
              ANNUAL FEE
            </span>
            <span className={`text-xs md:text-sm font-extrabold ${themeObj.annualText}`}>
              {annualFee}
            </span>
          </div>
        </div>

        {/* Highlights list with checkmark icons */}
        {perks.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
              {perks.slice(0, 3).map((p: string, pIdx: number) => (
                <li key={pIdx} className="flex items-start gap-2">
                  <span className={`${themeObj.check} font-bold text-sm leading-none mt-0.5`}>✓</span>
                  <span className="line-clamp-2">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Full-width solid pill button */}
      <div className="pt-4 mt-4 border-t border-slate-100">
        <button
          onClick={onApply}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs md:text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${themeObj.button} hover:scale-[1.02] active:scale-[0.98]`}
        >
          <span>Apply Now</span>
          <span className="text-base leading-none">➔</span>
        </button>
      </div>
    </div>
  );
}

export default function CreditCardGeniusView() {
  const [activeTab, setActiveTab] = useState<"catalog" | "eligibility" | "calculator">("catalog");

  // Catalog State
  const [cards, setCards] = useState<any[]>([]);
  const [popularCards, setPopularCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Apply Modal State
  const [selectedCardForApply, setSelectedCardForApply] = useState<any | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false);
  const [applyForm, setApplyForm] = useState<CardLeadPayload>({
    fullName: "",
    mobileNumber: "",
    email: "",
    city: "",
    pincode: "110001",
  });
  const [submittingLead, setSubmittingLead] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Eligibility Form State
  const [eligibilityForm, setEligibilityForm] = useState<EligibilityPayload>({
    pincode: "110001",
    inhandIncome: "50000",
    empStatus: "salaried",
  });
  const [eligibilityLoading, setEligibilityLoading] = useState<boolean>(false);
  const [eligibilityResults, setEligibilityResults] = useState<any | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // Calculator Form State (Generic User-Friendly Spend Form)
  const [spendForm, setSpendForm] = useState<SpendCalculatePayload>({
    amazon_spends: 15000,
    flipkart_spends: 5000,
    fuel: 4000,
    electricity_bills: 3000,
    online_food_ordering: 4000,
    dining_or_going_out: 3000,
    grocery_spends_online: 5000,
    flights_annual: 40000,
    hotels_annual: 20000,
    domestic_lounge_usage_quarterly: 1,
  });
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [calcResults, setCalcResults] = useState<any | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Load cards catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      setLoadingCards(true);
      setCatalogError(null);
      try {
        const [catalogRes, popularRes] = await Promise.allSettled([
          fetchCardsCatalog(),
          fetchPopularCards(),
        ]);

        if (catalogRes.status === "fulfilled") {
          const raw = catalogRes.value;
          const cardList = Array.isArray(raw) ? raw : (raw?.data || raw?.cards || []);
          setCards(cardList);
        }

        if (popularRes.status === "fulfilled") {
          const rawP = popularRes.value;
          const popList = Array.isArray(rawP) ? rawP : (rawP?.data || rawP?.cards || []);
          setPopularCards(popList);
        }

        if (catalogRes.status === "rejected" && popularRes.status === "rejected") {
          setCatalogError("Unable to load live credit cards. Please try again later.");
        }
      } catch (err: any) {
        setCatalogError("Failed to fetch credit cards catalog.");
      } finally {
        setLoadingCards(false);
      }
    }

    loadCatalog();
  }, []);

  // Filter categories definition
  const categories = [
    { id: "all", label: "All Cards", icon: "💳" },
    { id: "popular", label: "Popular Cards", icon: "⭐" },
    { id: "lifetime_free", label: "Lifetime Free", icon: "🆓" },
    { id: "shopping", label: "Shopping & Cashback", icon: "🛍️" },
    { id: "fuel", label: "Fuel Cards", icon: "⛽" },
    { id: "travel", label: "Travel & Lounge", icon: "✈️" },
  ];

  // Filtered catalog
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const name = (card?.name || card?.title || "").toLowerCase();
      const bank = (card?.bank_name || card?.bank || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || bank.includes(q);

      if (!matchesSearch) return false;

      if (selectedCategory === "all") return true;
      if (selectedCategory === "popular") return card?.is_popular || popularCards.some(p => p?.id === card?.id);
      
      const fee = String(card?.annual_fee_text || card?.annualFees || card?.annual_fee || "").toLowerCase();
      if (selectedCategory === "lifetime_free") {
        return fee.includes("free") || fee === "0" || fee.includes("nil") || fee.includes("lifetime");
      }

      if (selectedCategory === "shopping") {
        return name.includes("amazon") || name.includes("flipkart") || name.includes("cashback") || name.includes("rewards");
      }

      if (selectedCategory === "fuel") {
        return name.includes("fuel") || name.includes("bpcl") || name.includes("hpcl") || name.includes("iocl");
      }

      if (selectedCategory === "travel") {
        return name.includes("travel") || name.includes("lounge") || name.includes("indigo") || name.includes("air");
      }

      return true;
    });
  }, [cards, popularCards, searchQuery, selectedCategory]);

  // Map card_alias to full card object from catalog
  const findCardByAlias = (alias: string) => {
    if (!alias) return null;
    const cleanAlias = alias.toLowerCase().trim();
    return cards.find((c) => {
      const cAlias = (c?.card_alias || c?.alias || c?.seo_card_alias || "").toLowerCase();
      const cName = (c?.name || c?.title || "").toLowerCase().replace(/[^a-z0-0]/g, "-");
      return cAlias === cleanAlias || cName.includes(cleanAlias) || cleanAlias.includes(cAlias);
    });
  };

  // Parsed Eligible Cards List
  const eligibleCardsList = useMemo(() => {
    if (!eligibilityResults) return [];
    const rawData = Array.isArray(eligibilityResults)
      ? eligibilityResults
      : eligibilityResults?.data || eligibilityResults?.cards || [];

    if (!Array.isArray(rawData)) return [];

    return rawData
      .filter((item: any) => item?.eligible !== false)
      .map((item: any) => {
        const alias = item?.card_alias || item?.seo_card_alias || item?.alias;
        const matched = findCardByAlias(alias);
        return {
          alias,
          matched,
          rawItem: item,
        };
      });
  }, [eligibilityResults, cards]);

  // Parsed Calculated Savings List
  const calculatedSavingsList = useMemo(() => {
    if (!calcResults) return [];
    const rawSavings = calcResults?.data?.savings || calcResults?.savings || calcResults?.data || [];
    if (!Array.isArray(rawSavings)) return [];

    return rawSavings.map((item: any) => {
      const alias = item?.seo_card_alias || item?.card_alias || item?.alias;
      const matched = findCardByAlias(alias);
      return {
        alias,
        matched,
        rawItem: item,
      };
    });
  }, [calcResults, cards]);

  // Open Lead Apply Modal
  const openApplyModal = (card: any) => {
    setSelectedCardForApply(card);
    setApplyError(null);
    setApplyForm((prev) => ({
      ...prev,
      pincode: eligibilityForm.pincode || prev.pincode || "110001",
    }));
    setApplyModalOpen(true);
  };

  // Submit Lead & Redirect
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.fullName || !applyForm.mobileNumber) {
      setApplyError("Please enter your Full Name and Mobile Number.");
      return;
    }

    setSubmittingLead(true);
    setApplyError(null);

    try {
      const name = selectedCardForApply?.title || selectedCardForApply?.name || selectedCardForApply?.card_name || "Credit Card";
      const alias = selectedCardForApply?.card_alias || selectedCardForApply?.alias || selectedCardForApply?.seo_card_alias || "";
      const netUrl = selectedCardForApply?.network_url || selectedCardForApply?.cg_network_url || selectedCardForApply?.api_redirection_url || selectedCardForApply?.apply_url;

      const payload: CardLeadPayload = {
        ...applyForm,
        cardName: name,
        cardAlias: alias,
        networkUrl: netUrl,
      };

      const res = await submitCardLead(payload);
      const redir = res?.redirectionUrl || netUrl || "https://track.techtrack.in/click?campaign_id=79&pub_id=1372";

      // Launch application link in new tab
      window.open(redir, "_blank", "noopener,noreferrer");

      // Close modal
      setApplyModalOpen(false);
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit application lead.");
    } finally {
      setSubmittingLead(false);
    }
  };

  // Handle Eligibility Submit
  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setEligibilityLoading(true);
    setEligibilityError(null);
    setEligibilityResults(null);

    try {
      const res = await checkCardEligibility(eligibilityForm);
      setEligibilityResults(res);
    } catch (err: any) {
      setEligibilityError(err.message || "Failed to verify eligibility.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  // Handle Spend Calculator Submit
  const handleCalculateSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcLoading(true);
    setCalcError(null);
    setCalcResults(null);

    try {
      const res = await calculateCardSavings(spendForm);
      setCalcResults(res);
    } catch (err: any) {
      setCalcError(err.message || "Failed to calculate rewards.");
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 overflow-y-auto bg-slate-50/80 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-blue-50/50 text-slate-900 p-4 md:p-6 space-y-6">
      {/* Top Banner Header (Blue Gradient Theme) */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 p-6 md:p-8 shadow-lg text-white">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold uppercase tracking-wider">
            <span>💳 CARDGENIUS PARTNER INTEGRATION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Credit Cards & Spend Rewards
          </h1>
          <p className="text-blue-100 max-w-2xl text-xs md:text-sm leading-relaxed">
            Explore top credit cards, calculate your exact annual cashback & reward savings, and check instant eligibility powered by BankKaro.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all ${
            activeTab === "catalog"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600"
              : "bg-white text-gray-600 hover:text-blue-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>🏆 Cards Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab("eligibility")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all ${
            activeTab === "eligibility"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600"
              : "bg-white text-gray-600 hover:text-blue-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>⚡ Instant Eligibility Check</span>
        </button>

        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all ${
            activeTab === "calculator"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600"
              : "bg-white text-gray-600 hover:text-blue-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>📊 Spend & Reward Calculator</span>
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === "catalog" && (
        <div className="space-y-6 pb-12">
          {/* Controls Bar & Category Pills */}
          <div className="flex flex-col gap-4 bg-white p-4 rounded-[16px] border border-gray-200 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search card by name or bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white shadow-sm border border-blue-600"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:text-blue-600"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {loadingCards ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <div className="inline-block animate-spin text-3xl text-blue-600">⏳</div>
              <p className="text-sm font-medium">Fetching live credit cards from BankKaro...</p>
            </div>
          ) : catalogError ? (
            <div className="p-5 bg-red-50 border border-red-200 rounded-[14px] text-red-600 text-sm">
              {catalogError}
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-[16px] border border-gray-200 shadow-sm">
              No credit cards found matching your search or category filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card, idx) => {
                const name = card?.title || card?.name || "Credit Card";
                const bank = card?.bank_name || card?.bank || "PARTNER BANK";
                const joiningFee = formatFee(card?.joining_fee_text || card?.joiningFees || card?.joining_fee, "Free");
                const annualFee = formatFee(card?.annual_fee_text || card?.annualFees || card?.annual_fee, "Nil");
                const image = card?.card_image || card?.image || card?.logo;
                const perks = extractPerks(card);

                return (
                  <GlassmorphismCard
                    key={card?.id || card?.alias || idx}
                    card={card}
                    idx={idx}
                    bankName={bank}
                    cardTitle={name}
                    joiningFee={joiningFee}
                    annualFee={annualFee}
                    image={image}
                    perks={perks}
                    onApply={() => openApplyModal(card)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ELIGIBILITY CHECKER */}
      {activeTab === "eligibility" && (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          <div className="bg-white border border-gray-200 rounded-[20px] p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Instant Credit Card Eligibility Check</h2>
              <p className="text-gray-500 text-xs mt-1">
                Enter your income and pincode to verify pre-approved credit cards matched by BankKaro.
              </p>
            </div>

            <form onSubmit={handleCheckEligibility} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Monthly In-hand Income (₹)
                </label>
                <input
                  type="number"
                  value={eligibilityForm.inhandIncome}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, inhandIncome: e.target.value })
                  }
                  required
                  placeholder="e.g. 50000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Residing Pincode
                </label>
                <input
                  type="text"
                  value={eligibilityForm.pincode}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, pincode: e.target.value })
                  }
                  required
                  placeholder="e.g. 110001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Employment Status
                </label>
                <select
                  value={eligibilityForm.empStatus}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, empStatus: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="salaried">Salaried Employee</option>
                  <option value="self-employed">Self-Employed / Business</option>
                </select>
              </div>

              <div className="md:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={eligibilityLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {eligibilityLoading ? "Checking Eligibility..." : "Check Eligible Cards"}
                </button>
              </div>
            </form>

            {eligibilityError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                {eligibilityError}
              </div>
            )}
          </div>

          {/* Formatted Eligibility UI Grid Results */}
          {eligibilityResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-[16px] p-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">✓</span>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">Pre-Approved Cards Matched</h3>
                    <p className="text-xs text-emerald-700">Found {eligibleCardsList.length} pre-approved credit cards based on your profile.</p>
                  </div>
                </div>
              </div>

              {eligibleCardsList.length === 0 ? (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-[18px] text-gray-500 text-sm">
                  No specific pre-approved cards returned for these profile parameters. Try adjusting income or pincode.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibleCardsList.map((item, idx) => {
                const card = item.matched;
                const alias = item.alias || `Card ${idx + 1}`;
                const cardName = card?.title || card?.name || alias.replace(/-/g, " ").toUpperCase();
                const bank = card?.bank_name || card?.bank || "PARTNER BANK";
                const joiningFee = formatFee(card?.joining_fee_text || card?.joiningFees || card?.joining_fee, "Free");
                const annualFee = formatFee(card?.annual_fee_text || card?.annualFees || card?.annual_fee, "Nil");
                const image = card?.card_image || card?.image || card?.logo;
                const perks = extractPerks(card);

                return (
                  <GlassmorphismCard
                    key={idx}
                    card={card || item.rawItem}
                    idx={idx}
                    bankName={bank}
                    cardTitle={cardName}
                    joiningFee={joiningFee}
                    annualFee={annualFee}
                    image={image}
                    perks={perks}
                    badgeEligible={true}
                    onApply={() => openApplyModal(card || { name: cardName, card_alias: alias })}
                  />
                );
              })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SPEND & REWARD CALCULATOR (Generic User-Friendly Labels) */}
      {activeTab === "calculator" && (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          <div className="bg-white border border-gray-200 rounded-[20px] p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Spend & Cashback Reward Calculator</h2>
              <p className="text-gray-500 text-xs mt-1">
                Enter your monthly and annual spends across standard categories to calculate expected cashback & reward savings.
              </p>
            </div>

            <form onSubmit={handleCalculateSavings} className="space-y-6">
              {/* Category 1: Monthly Everyday Spends */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛍️</span> Monthly Everyday Spends
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>🛍️</span> Online Shopping & Retail (Monthly ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.amazon_spends || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, amazon_spends: Number(e.target.value) })
                      }
                      placeholder="e.g. 15000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>🛒</span> Electronics & Store Shopping (Monthly ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.flipkart_spends || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, flipkart_spends: Number(e.target.value) })
                      }
                      placeholder="e.g. 5000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>⛽</span> Fuel & Vehicle Expenses (Monthly ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.fuel || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, fuel: Number(e.target.value) })
                      }
                      placeholder="e.g. 4000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>📱</span> Utility Bills & Mobile Recharge (Monthly ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.electricity_bills || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, electricity_bills: Number(e.target.value) })
                      }
                      placeholder="e.g. 3000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>🍽️</span> Dining & Food Delivery (Monthly ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.online_food_ordering || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, online_food_ordering: Number(e.target.value) })
                      }
                      placeholder="e.g. 4000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>🍏</span> Groceries & Supermarket (Monthly ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.grocery_spends_online || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, grocery_spends_online: Number(e.target.value) })
                      }
                      placeholder="e.g. 5000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Category 2: Annual Travel & Stay Expenses */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✈️</span> Annual Travel Expenses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>✈️</span> Flights & Air Travel (Annual ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.flights_annual || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, flights_annual: Number(e.target.value) })
                      }
                      placeholder="e.g. 40000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <span>🏨</span> Hotel & Vacation Stay (Annual ₹)
                    </label>
                    <input
                      type="number"
                      value={spendForm.hotels_annual || 0}
                      onChange={(e) =>
                        setSpendForm({ ...spendForm, hotels_annual: Number(e.target.value) })
                      }
                      placeholder="e.g. 20000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={calcLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                >
                  {calcLoading ? "Calculating Rewards..." : "Calculate Net Annual Savings"}
                </button>
              </div>
            </form>

            {calcError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                {calcError}
              </div>
            )}
          </div>

          {/* Formatted Calculator Savings Leaderboard Grid */}
          {calcResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-[16px] p-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">📊</span>
                  <div>
                    <h3 className="text-sm font-bold text-blue-900">Ranked Reward Savings Summary</h3>
                    <p className="text-xs text-blue-700">Top credit cards ranked by net annual savings for your spending profile.</p>
                  </div>
                </div>
              </div>

              {calculatedSavingsList.length === 0 ? (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-[18px] text-gray-500 text-sm">
                  Calculated successfully. Check spending values to view ranked card rewards.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {calculatedSavingsList.map((item, idx) => {
                    const raw = item.rawItem;
                    const matchedCard = item.matched;
                    const cardName = raw?.card_name || matchedCard?.title || matchedCard?.name || "Credit Card";
                    const bank = matchedCard?.bank_name || matchedCard?.bank || "PARTNER BANK";
                    const joiningFee = formatFee(raw?.joining_fees || matchedCard?.joining_fee_text || matchedCard?.joining_fee, "Free");
                    const annualFee = formatFee(matchedCard?.annual_fee_text || matchedCard?.annual_fee || matchedCard?.annualFees, "Nil");
                    const netSavings = raw?.net_annual_savings || raw?.annual_cashback || raw?.ck_rewards || raw?.commission;
                    const image = matchedCard?.card_image || matchedCard?.image || raw?.image;
                    const perks = extractPerks(matchedCard || raw);

                    return (
                      <GlassmorphismCard
                        key={idx}
                        card={matchedCard || raw}
                        idx={idx}
                        bankName={bank}
                        cardTitle={cardName}
                        joiningFee={joiningFee}
                        annualFee={annualFee}
                        image={image}
                        perks={perks}
                        rankText={`Rank #${idx + 1}`}
                        netSavingsText={netSavings ? Number(netSavings).toLocaleString("en-IN") : undefined}
                        onApply={() =>
                          openApplyModal(
                            matchedCard || {
                              name: cardName,
                              card_alias: item.alias,
                              network_url: raw?.cg_network_url,
                            }
                          )
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* APPLY LEAD MODAL OVERLAY */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                <h3 className="text-base font-bold text-gray-900">
                  Apply for {selectedCardForApply?.title || selectedCardForApply?.name || selectedCardForApply?.card_name || "Credit Card"}
                </h3>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200/60 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Card Mini Banner */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <CardThumbnailImage
                  src={selectedCardForApply?.card_image || selectedCardForApply?.image || selectedCardForApply?.logo}
                  title={selectedCardForApply?.title || selectedCardForApply?.name}
                  className="w-16 md:w-20 aspect-[1.58/1]"
                />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {selectedCardForApply?.title || selectedCardForApply?.name || selectedCardForApply?.card_name || "Credit Card"}
                  </h4>
                  <p className="text-xs text-blue-700 font-medium">
                    • Joining Fee: {formatFee(selectedCardForApply?.joining_fee_text || selectedCardForApply?.joiningFees || selectedCardForApply?.joining_fees || selectedCardForApply?.joining_fee, "Free")}
                  </p>
                </div>
              </div>

              {/* Lead Capture Form */}
              <form onSubmit={handleLeadSubmit} id="apply-lead-form" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name (as per PAN Card) *
                  </label>
                  <input
                    type="text"
                    value={applyForm.fullName}
                    onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                    required
                    placeholder="Enter full legal name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={applyForm.mobileNumber}
                    onChange={(e) => setApplyForm({ ...applyForm, mobileNumber: e.target.value })}
                    required
                    placeholder="10-digit mobile number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={applyForm.email || ""}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={applyForm.city || ""}
                      onChange={(e) => setApplyForm({ ...applyForm, city: e.target.value })}
                      placeholder="e.g. Noida"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={applyForm.pincode || ""}
                      onChange={(e) => setApplyForm({ ...applyForm, pincode: e.target.value })}
                      placeholder="e.g. 110001"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
                  <span>🔒</span>
                  <span>256-bit SSL encrypted. Directly submitted to issuing bank.</span>
                </div>

                {applyError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                    {applyError}
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="apply-lead-form"
                disabled={submittingLead}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                <span>{submittingLead ? "Processing Lead..." : "Continue to Bank Application"}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
