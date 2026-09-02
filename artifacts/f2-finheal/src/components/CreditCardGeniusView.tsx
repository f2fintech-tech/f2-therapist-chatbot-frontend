import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { getStoredAuthSession, clearStoredAuthSession } from "@/utils/authSession";
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

// Helper to extract numeric annual fee value for filtering
function parseNumericFee(feeValue: any): number {
  if (feeValue === undefined || feeValue === null || feeValue === "") return 0;
  const str = String(feeValue).toLowerCase().trim();
  if (str === "0" || str.includes("free") || str.includes("nil") || str.includes("lifetime")) {
    return 0;
  }
  const digits = str.replace(/[^0-9.]/g, "");
  return digits ? parseFloat(digits) : 0;
}

// Robust Helper to extract Bank Name from Card Object or Title
function extractBankName(card: any): string {
  const directBank = card?.bank_name || card?.bank || card?.bank_details?.name || card?.bank_details?.title || card?.issuer;
  if (directBank && typeof directBank === "string" && directBank.trim().length > 0) {
    return directBank.trim();
  }

  const title = (card?.title || card?.name || "").toUpperCase();
  if (title.includes("HDFC")) return "HDFC Bank";
  if (title.includes("SBI")) return "SBI Card";
  if (title.includes("ICICI")) return "ICICI Bank";
  if (title.includes("AXIS")) return "Axis Bank";
  if (title.includes("IDFC")) return "IDFC FIRST Bank";
  if (title.includes("KOTAK")) return "Kotak Mahindra Bank";
  if (title.includes("AU ") || title.includes("ZENITH")) return "AU Small Finance Bank";
  if (title.includes("HSBC")) return "HSBC Bank";
  if (title.includes("INDUSIND")) return "IndusInd Bank";
  if (title.includes("YES")) return "YES Bank";
  if (title.includes("RBL")) return "RBL Bank";
  if (title.includes("FEDERAL") || title.includes("SCAPIA")) return "Federal Bank";
  if (title.includes("BOB") || title.includes("BARODA")) return "Bank of Baroda";
  if (title.includes("STANDARD CHARTERED") || title.includes("STANCHAR")) return "Standard Chartered";
  if (title.includes("AMEX") || title.includes("AMERICAN EXPRESS")) return "American Express";
  if (title.includes("PNB")) return "Punjab National Bank";
  if (title.includes("CANARA")) return "Canara Bank";
  if (title.includes("UNION")) return "Union Bank of India";

  return "Partner Bank";
}

// Helper to detect Card Network Badge (VISA, RuPay, Mastercard, AMEX)
function extractCardNetwork(card: any): { label: string; colorClass: string } {
  const str = `${card?.title || ""} ${card?.name || ""} ${card?.network || ""} ${card?.card_type || ""}`.toUpperCase();
  if (str.includes("RUPAY")) {
    return { label: "RUPAY", colorClass: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (str.includes("MASTERCARD") || str.includes("MASTER")) {
    return { label: "MASTERCARD", colorClass: "bg-red-50 text-red-700 border-red-200" };
  }
  if (str.includes("AMEX") || str.includes("AMERICAN EXPRESS")) {
    return { label: "AMEX", colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  }
  return { label: "VISA", colorClass: "bg-blue-50 text-blue-700 border-blue-200" };
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

// Helper to extract eligibility requirements from BankKaro card JSON
function extractEligibilityCriteria(card: any): {
  minIncome?: string;
  minAge?: string;
  minCibil?: string;
  empType?: string;
  details?: string[];
} {
  const reqs: {
    minIncome?: string;
    minAge?: string;
    minCibil?: string;
    empType?: string;
    details?: string[];
  } = {};

  const detailsList: string[] = [];

  // Income
  const rawIncome =
    card?.min_monthly_income ||
    card?.minimum_monthly_income ||
    card?.min_income ||
    card?.salaried_income ||
    card?.income_criteria ||
    card?.required_income ||
    card?.inhand_income ||
    card?.income;

  if (rawIncome) {
    if (typeof rawIncome === "number") {
      reqs.minIncome = `₹${rawIncome.toLocaleString("en-IN")}/mo`;
    } else {
      const strInc = String(rawIncome).trim();
      reqs.minIncome = strInc.startsWith("₹") ? strInc : `₹${strInc}/mo`;
    }
  }

  // Age
  const minAge = card?.min_age || card?.minimum_age;
  const maxAge = card?.max_age || card?.maximum_age;
  if (minAge && maxAge) {
    reqs.minAge = `${minAge} - ${maxAge} Yrs`;
  } else if (minAge) {
    reqs.minAge = `Min ${minAge} Yrs`;
  } else if (card?.age_criteria || card?.age_req || card?.age) {
    reqs.minAge = String(card.age_criteria || card.age_req || card.age);
  }

  // CIBIL / Credit Score
  const rawCibil = card?.min_cibil || card?.min_credit_score || card?.cibil_score || card?.cibil_req || card?.cibil;
  if (rawCibil) {
    const strCib = String(rawCibil).trim();
    reqs.minCibil = strCib.includes("+") ? strCib : `${strCib}+`;
  }

  // Employment Type
  const rawEmp = card?.emp_type || card?.employment_type || card?.eligible_employment || card?.emp_status;
  if (rawEmp) {
    reqs.empType = String(rawEmp);
  }

  // Text list criteria
  const rawElig = card?.eligibility_criteria || card?.eligibility || card?.eligibility_text || card?.requirements;
  if (Array.isArray(rawElig)) {
    rawElig.forEach((item: any) => {
      const txt = typeof item === "string" ? item : item?.text || item?.title || item?.criterion;
      if (txt) detailsList.push(txt);
    });
  } else if (typeof rawElig === "string" && rawElig.trim()) {
    detailsList.push(rawElig);
  }

  reqs.details = detailsList;
  return reqs;
}

// Pre-curated list of major Indian Credit Card issuing banks
const DEFAULT_INDIAN_BANKS = [
  "HDFC Bank",
  "SBI Card",
  "ICICI Bank",
  "Axis Bank",
  "IDFC FIRST Bank",
  "Kotak Mahindra Bank",
  "AU Small Finance Bank",
  "HSBC Bank",
  "IndusInd Bank",
  "YES Bank",
  "RBL Bank",
  "Federal Bank",
  "Bank of Baroda",
  "Standard Chartered",
  "American Express",
];

export default function CreditCardGeniusView() {
  const [activeTab, setActiveTab] = useState<"catalog" | "eligibility" | "calculator">("catalog");

  // Catalog State
  const [cards, setCards] = useState<any[]>([]);
  const [popularCards, setPopularCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Multi-Facet Horizontal Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFeeRange, setSelectedFeeRange] = useState<string>("all");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [selectedBank, setSelectedBank] = useState<string>("all");

  // Clear all filters
  const handleClearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedFeeRange("all");
    setSelectedNetwork("all");
    setSelectedBank("all");
    setSearchQuery("");
  };

  const [, setLocation] = useLocation();

  // Apply Modal State
  const [selectedCardForApply, setSelectedCardForApply] = useState<any | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false);
  const [loginPromptModalOpen, setLoginPromptModalOpen] = useState<boolean>(false);
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
    pincode: "",
    inhandIncome: "",
    empStatus: "salaried",
  });
  const [eligibilityLoading, setEligibilityLoading] = useState<boolean>(false);
  const [eligibilityResults, setEligibilityResults] = useState<any | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // Calculator Form State
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

  // Compare Feature State (Max 3 cards)
  const [compareList, setCompareList] = useState<any[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [compareWarning, setCompareWarning] = useState<string | null>(null);

  // Single Card Eligibility & Highlights Modal States
  const [eligibilityModalCard, setEligibilityModalCard] = useState<any | null>(null);
  const [highlightsModalCard, setHighlightsModalCard] = useState<any | null>(null);

  const getCardId = (card: any) =>
    card?.id || card?.alias || card?.card_alias || card?.seo_card_alias || card?.title || card?.name;

  const isCardInCompare = (card: any) => {
    const targetId = getCardId(card);
    return compareList.some((c) => getCardId(c) === targetId);
  };

  const toggleCompareCard = (card: any) => {
    if (!card) return;
    const targetId = getCardId(card);
    setCompareWarning(null);

    setCompareList((prev) => {
      const exists = prev.some((c) => getCardId(c) === targetId);
      if (exists) {
        return prev.filter((c) => getCardId(c) !== targetId);
      }

      if (prev.length >= 3) {
        setCompareWarning("You can compare up to 3 credit cards at a time.");
        setTimeout(() => setCompareWarning(null), 3500);
        return prev;
      }

      return [...prev, card];
    });
  };

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

  // Filter Categories Options
  const categoryOptions = [
    { id: "all", label: "All Cards", icon: "💳" },
    { id: "popular", label: "Popular Cards", icon: "⭐" },
    { id: "lifetime_free", label: "Lifetime Free", icon: "🆓" },
    { id: "shopping", label: "Shopping & Cashback", icon: "🛍️" },
    { id: "fuel", label: "Fuel Cards", icon: "⛽" },
    { id: "travel", label: "Travel & Lounge", icon: "✈️" },
  ];

  // Annual Fee Range Options
  const feeRangeOptions = [
    { id: "all", label: "All Fees" },
    { id: "free", label: "Lifetime Free (₹0)" },
    { id: "1-1000", label: "₹1 - ₹1,000" },
    { id: "1001-2000", label: "₹1,001 - ₹2,000" },
    { id: "2001-5000", label: "₹2,001 - ₹5,000" },
    { id: "5001+", label: "₹5,001+" },
  ];

  // Card Networks
  const cardNetworks = [
    { id: "all", label: "All Networks" },
    { id: "visa", label: "VISA" },
    { id: "mastercard", label: "Mastercard" },
    { id: "rupay", label: "RuPay" },
    { id: "amex", label: "American Express" },
  ];

  // Dynamic Bank Options merged with Default Indian Banks
  const bankOptions = useMemo(() => {
    const bankSet = new Set<string>(DEFAULT_INDIAN_BANKS);
    cards.forEach((c) => {
      const b = extractBankName(c);
      if (b && b !== "Partner Bank") bankSet.add(b);
    });
    return Array.from(bankSet).sort();
  }, [cards]);

  // Filtered Cards Logic
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const name = (card?.name || card?.title || "").toLowerCase();
      const bankName = extractBankName(card).toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      // 1. Search Query Filter
      if (q && !name.includes(q) && !bankName.includes(q)) return false;

      // 2. Category Filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "popular") {
          const isPop = card?.is_popular || popularCards.some((p) => p?.id === card?.id);
          if (!isPop) return false;
        } else if (selectedCategory === "lifetime_free") {
          const feeVal = parseNumericFee(card?.annual_fee_text || card?.annualFees || card?.annual_fee);
          const feeStr = String(card?.annual_fee_text || "").toLowerCase();
          if (feeVal > 0 && !feeStr.includes("free") && !feeStr.includes("lifetime")) return false;
        } else if (selectedCategory === "fuel") {
          if (!name.includes("fuel") && !name.includes("bpcl") && !name.includes("hpcl") && !name.includes("iocl")) return false;
        } else if (selectedCategory === "shopping") {
          if (!name.includes("amazon") && !name.includes("flipkart") && !name.includes("shopping") && !name.includes("cashback") && !name.includes("rewards")) return false;
        } else if (selectedCategory === "travel") {
          if (!name.includes("travel") && !name.includes("lounge") && !name.includes("indigo") && !name.includes("air") && !name.includes("club")) return false;
        }
      }

      // 3. Fee Range Filter
      if (selectedFeeRange !== "all") {
        const feeVal = parseNumericFee(card?.annual_fee_text || card?.annualFees || card?.annual_fee);
        if (selectedFeeRange === "free" && feeVal > 0) return false;
        if (selectedFeeRange === "1-1000" && (feeVal < 1 || feeVal > 1000)) return false;
        if (selectedFeeRange === "1001-2000" && (feeVal < 1001 || feeVal > 2000)) return false;
        if (selectedFeeRange === "2001-5000" && (feeVal < 2001 || feeVal > 5000)) return false;
        if (selectedFeeRange === "5001+" && feeVal <= 5000) return false;
      }

      // 4. Card Network Filter
      if (selectedNetwork !== "all") {
        const cardStr = `${name} ${card?.card_type || ""} ${card?.network || ""}`.toLowerCase();
        if (selectedNetwork === "visa" && !cardStr.includes("visa")) return false;
        if (selectedNetwork === "mastercard" && !cardStr.includes("mastercard") && !cardStr.includes("master")) return false;
        if (selectedNetwork === "rupay" && !cardStr.includes("rupay")) return false;
        if (selectedNetwork === "amex" && !cardStr.includes("american express") && !cardStr.includes("amex")) return false;
      }

      // 5. Bank Filter
      if (selectedBank !== "all") {
        const selLower = selectedBank.toLowerCase();
        const shortKey = selLower.split(" ")[0];
        if (!bankName.includes(shortKey) && !name.includes(shortKey)) return false;
      }

      return true;
    });
  }, [cards, popularCards, searchQuery, selectedCategory, selectedFeeRange, selectedNetwork, selectedBank]);

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

  // Open Lead Apply Modal (Only for Logged-In Users)
  const openApplyModal = (card: any) => {
    const session = getStoredAuthSession();
    if (!session || session.isGuest) {
      setSelectedCardForApply(card);
      setLoginPromptModalOpen(true);
      return;
    }

    setSelectedCardForApply(card);
    setApplyError(null);
    setApplyForm((prev) => ({
      ...prev,
      fullName: prev.fullName || session.displayName || "",
      email: prev.email || session.email || "",
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
    const pin = String(eligibilityForm.pincode || "").trim();
    const incStr = String(eligibilityForm.inhandIncome || "").trim();
    const inc = Number(incStr);

    if (!incStr || isNaN(inc) || inc <= 0) {
      setEligibilityError("Please enter a valid positive monthly in-hand income.");
      return;
    }

    if (!pin || !/^\d{6}$/.test(pin)) {
      setEligibilityError("Please enter a valid 6-digit Indian area pincode (e.g. 201301 or 110001).");
      return;
    }

    setEligibilityLoading(true);
    setEligibilityError(null);
    setEligibilityResults(null);

    try {
      const res = await checkCardEligibility(eligibilityForm);
      setEligibilityResults(res);
    } catch (err: any) {
      const msg = err?.message || err?.detail || "";
      if (msg.includes("400") || msg.includes("Pincode") || msg.includes("Income")) {
        setEligibilityError("Please verify that your monthly income and 6-digit pincode are valid.");
      } else {
        setEligibilityError("Unable to verify eligibility right now. Please check your internet connection and try again.");
      }
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

  // Check if any filter is active
  const isAnyFilterActive =
    selectedCategory !== "all" ||
    selectedFeeRange !== "all" ||
    selectedNetwork !== "all" ||
    selectedBank !== "all" ||
    searchQuery.trim().length > 0;

  return (
    <div className="w-full h-full min-h-0 flex-1 overflow-y-auto bg-gray-50 text-gray-900 p-4 md:p-6 space-y-6">
      {/* Top Banner Header (Blue Gradient Theme) */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 p-6 md:p-8 shadow-lg text-white">
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Credit Cards & Spend Rewards
          </h1>
          <p className="text-blue-100 max-w-2xl text-xs md:text-sm leading-relaxed">
            Explore top credit cards, calculate your exact annual cashback & reward savings, and check instant eligibility.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all ${activeTab === "catalog"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600"
              : "bg-white text-gray-600 hover:text-blue-600 hover:bg-gray-100 border border-gray-200"
            }`}
        >
          <span>🏆 Cards Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab("eligibility")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all ${activeTab === "eligibility"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600"
              : "bg-white text-gray-600 hover:text-blue-600 hover:bg-gray-100 border border-gray-200"
            }`}
        >
          <span>⚡ Instant Eligibility Check</span>
        </button>

        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all ${activeTab === "calculator"
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
          {/* HORIZONTAL MULTI-FACET FILTER CONTROL BAR */}
          <div className="bg-white p-5 rounded-[24px] border border-gray-200 shadow-sm space-y-4">
            {/* Top Row: Pill Search Bar */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search card by name or bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50/70 border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {isAnyFilterActive && (
                <button
                  onClick={handleClearAllFilters}
                  className="px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-full border border-blue-200 transition-all shrink-0"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Row 2: Horizontal Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-gray-100 pt-3">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:text-blue-600"
                    }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Row 3: Horizontal Refined Dropdown Filters (Fee, Network, Bank) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-gray-100 pt-3">
              {/* Annual Fee Range Dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <span>🏷️</span>
                  <span>Annual Fee Range</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedFeeRange}
                    onChange={(e) => setSelectedFeeRange(e.target.value)}
                    className={`w-full appearance-none bg-white hover:bg-slate-50/90 border ${selectedFeeRange !== "all" ? "border-blue-500 bg-blue-50/30 text-blue-700 font-extrabold" : "border-slate-200/90 text-slate-800 font-bold"} rounded-full px-4 py-2.5 pr-9 text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer`}
                  >
                    {feeRangeOptions.map((f) => (
                      <option key={f.id} value={f.id} className="text-slate-900 font-medium py-1">
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card Network Dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <span>💳</span>
                  <span>Card Network</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    className={`w-full appearance-none bg-white hover:bg-slate-50/90 border ${selectedNetwork !== "all" ? "border-blue-500 bg-blue-50/30 text-blue-700 font-extrabold" : "border-slate-200/90 text-slate-800 font-bold"} rounded-full px-4 py-2.5 pr-9 text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer`}
                  >
                    {cardNetworks.map((n) => (
                      <option key={n.id} value={n.id} className="text-slate-900 font-medium py-1">
                        {n.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bank Filter Dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <span>🏦</span>
                  <span>Issuing Bank</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className={`w-full appearance-none bg-white hover:bg-slate-50/90 border ${selectedBank !== "all" ? "border-blue-500 bg-blue-50/30 text-blue-700 font-extrabold" : "border-slate-200/90 text-slate-800 font-bold"} rounded-full px-4 py-2.5 pr-9 text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer`}
                  >
                    <option value="all" className="text-slate-900 font-medium py-1">All Issuing Banks</option>
                    {bankOptions.map((bName) => (
                      <option key={bName} value={bName} className="text-slate-900 font-medium py-1">
                        {bName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Cards Grid (3 Columns) */}
          <div className="space-y-4">
            {/* Active Filter Chips Summary */}
            {isAnyFilterActive && (
              <div className="flex flex-wrap items-center gap-2 bg-blue-50/60 p-3 rounded-2xl border border-blue-100 text-xs">
                <span className="font-bold text-blue-800">Active Filters:</span>
                {selectedCategory !== "all" && (
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold flex items-center gap-1">
                    <span>Category: {categoryOptions.find((c) => c.id === selectedCategory)?.label}</span>
                    <button onClick={() => setSelectedCategory("all")}>✕</button>
                  </span>
                )}
                {selectedFeeRange !== "all" && (
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold flex items-center gap-1">
                    <span>Fee: {feeRangeOptions.find((f) => f.id === selectedFeeRange)?.label}</span>
                    <button onClick={() => setSelectedFeeRange("all")}>✕</button>
                  </span>
                )}
                {selectedNetwork !== "all" && (
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold flex items-center gap-1">
                    <span>Network: {cardNetworks.find((n) => n.id === selectedNetwork)?.label}</span>
                    <button onClick={() => setSelectedNetwork("all")}>✕</button>
                  </span>
                )}
                {selectedBank !== "all" && (
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold flex items-center gap-1">
                    <span>Bank: {selectedBank}</span>
                    <button onClick={() => setSelectedBank("all")}>✕</button>
                  </span>
                )}
              </div>
            )}

            {loadingCards ? (
              <div className="py-16 text-center text-gray-500 space-y-3">
                <div className="inline-block animate-spin text-3xl text-blue-600">⏳</div>
                <p className="text-sm font-medium">Fetching live credit cards from BankKaro...</p>
              </div>
            ) : catalogError ? (
              <div className="p-5 bg-red-50 border border-red-200 rounded-[20px] text-red-600 text-sm">
                {catalogError}
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm bg-white rounded-[24px] border border-gray-200 shadow-sm space-y-3">
                <div className="text-3xl">🔍</div>
                <p className="font-semibold text-gray-800">No credit cards match your filter criteria.</p>
                <button
                  onClick={handleClearAllFilters}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map((card, idx) => {
                  const name = card?.title || card?.name || "Credit Card";
                  const bank = extractBankName(card);
                  const joiningFee = formatFee(card?.joining_fee_text || card?.joiningFees || card?.joining_fee, "Free");
                  const annualFee = formatFee(card?.annual_fee_text || card?.annualFees || card?.annual_fee, "Nil");
                  const image = card?.card_image || card?.image || card?.logo;
                  const perks = extractPerks(card);
                  const networkBadge = extractCardNetwork(card);

                  return (
                    <div
                      key={card?.id || card?.alias || idx}
                      className="relative flex flex-col justify-between bg-white border border-gray-200 hover:border-blue-400 rounded-[28px] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                    >
                      {/* Plus / Compare Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareCard(card);
                        }}
                        title={isCardInCompare(card) ? "Remove from Compare" : "Add to Compare (Up to 3)"}
                        className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-md ${
                          isCardInCompare(card)
                            ? "bg-blue-600 text-white border-2 border-white shadow-blue-500/40 scale-105"
                            : "bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/90"
                        }`}
                      >
                        {isCardInCompare(card) ? "✓" : "+"}
                      </button>

                      <div className="space-y-4">
                        {/* Prominent Card Image Header */}
                        {image && (
                          <div className="w-full relative aspect-[1.58/1] flex items-center justify-center overflow-hidden my-1">
                            <img
                              src={image}
                              alt={name}
                              className="w-full h-full object-contain rounded-2xl drop-shadow-md"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Title Row + Network Badge */}
                        <div className="flex items-start justify-between gap-3 pt-1">
                          <div className="space-y-1 flex-1">
                            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                              {bank}
                            </span>
                            <h3 className="text-base font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                              {name}
                            </h3>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200 shrink-0 ${networkBadge.colorClass}`}>
                            {networkBadge.label}
                          </span>
                        </div>

                        {/* Fee Badges Bar (Joining Fee & Annual Fee Pill Boxes) */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
                            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">JOINING FEE</span>
                            <span className="text-sm font-extrabold text-blue-600">{joiningFee}</span>
                          </div>
                          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">ANNUAL FEE</span>
                            <span className="text-sm font-extrabold text-emerald-600">{annualFee}</span>
                          </div>
                        </div>

                        {/* Key Highlights with Green Checkmarks */}
                        {perks.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">KEY HIGHLIGHTS:</span>
                            <ul className="space-y-1.5 text-xs text-gray-600 leading-snug">
                              {perks.slice(0, 3).map((p: string, pIdx: number) => (
                                <li key={pIdx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                  <span className="line-clamp-2">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Apply Now & View Eligibility Buttons */}
                      <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                        <button
                          type="button"
                          onClick={() => openApplyModal(card)}
                          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-full transition-all shadow-md shadow-blue-600/25"
                        >
                          <span>Apply Now</span>
                          <span>➔</span>
                        </button>

                        {/* Secondary Actions Row: View More & View Eligibility */}
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightsModalCard(card);
                            }}
                            className="w-full text-center text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-2 transition-colors flex items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 rounded-xl"
                          >
                            <span>View More</span>
                            <span className="text-[11px]">📜</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEligibilityModalCard(card);
                            }}
                            className="w-full text-center text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-2 transition-colors flex items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 rounded-xl"
                          >
                            <span>View Eligibility</span>
                            <span className="text-[11px]">ℹ️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ELIGIBILITY CHECKER */}
      {activeTab === "eligibility" && (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          <div className="bg-white border border-gray-200 rounded-[24px] p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Instant Credit Card Eligibility Check</h2>
              <p className="text-gray-500 text-xs mt-1">
                Enter your monthly income and pincode below to check which credit cards match your profile.
              </p>
            </div>

            <form onSubmit={handleCheckEligibility} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Monthly In-hand Income (₹) *
                </label>
                <input
                  type="number"
                  value={eligibilityForm.inhandIncome}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, inhandIncome: e.target.value })
                  }
                  required
                  placeholder="e.g. 50000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Residing Pincode *
                </label>
                <input
                  type="text"
                  value={eligibilityForm.pincode}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, pincode: e.target.value })
                  }
                  required
                  placeholder="e.g. 110001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="salaried">Salaried Employee</option>
                  <option value="self_employed">Self-Employed / Business</option>
                </select>
              </div>

              <div className="md:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={eligibilityLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {eligibilityLoading ? "Checking Eligibility..." : "Check Eligible Cards"}
                </button>
              </div>
            </form>

            {eligibilityError && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs md:text-sm font-medium shadow-sm">
                <span className="text-lg shrink-0">⚠️</span>
                <span>{eligibilityError}</span>
              </div>
            )}
          </div>

          {/* Formatted Eligibility UI Grid Results */}
          {eligibilityResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-[20px] p-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">✓</span>
                  <div>
                    <h3 className="text-sm font-bold text-blue-900">Eligible Cards Matched</h3>
                    <p className="text-xs text-blue-700">Found {eligibleCardsList.length} credit cards matching your income & location profile.</p>
                  </div>
                </div>
              </div>

              {eligibleCardsList.length === 0 ? (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-[24px] text-gray-500 text-sm">
                  No specific pre-approved cards returned for these profile parameters. Try adjusting income or pincode.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eligibleCardsList.map((item, idx) => {
                    const card = item.matched;
                    const alias = item.alias || `Card ${idx + 1}`;
                    const cardName = card?.title || card?.name || alias.replace(/-/g, " ").toUpperCase();
                    const bank = extractBankName(card);
                    const joiningFee = formatFee(card?.joining_fee_text || card?.joiningFees || card?.joining_fee, "Free");
                    const annualFee = formatFee(card?.annual_fee_text || card?.annualFees || card?.annual_fee, "Nil");
                    const image = card?.card_image || card?.image || card?.logo;
                    const perks = extractPerks(card);
                    const networkBadge = extractCardNetwork(card);

                    return (
                      <div
                        key={idx}
                        className="relative flex flex-col justify-between bg-white border-2 border-blue-300 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                      >
                        {/* Plus / Compare Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompareCard(card || item.rawItem);
                          }}
                          title={isCardInCompare(card || item.rawItem) ? "Remove from Compare" : "Add to Compare (Up to 3)"}
                          className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-md ${
                            isCardInCompare(card || item.rawItem)
                              ? "bg-blue-600 text-white border-2 border-white shadow-blue-500/40 scale-105"
                              : "bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/90"
                          }`}
                        >
                          {isCardInCompare(card || item.rawItem) ? "✓" : "+"}
                        </button>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                              MATCHED ✓
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200 ${networkBadge.colorClass}`}>
                              {networkBadge.label}
                            </span>
                          </div>

                          {image && (
                            <div className="w-full relative aspect-[1.58/1] flex items-center justify-center overflow-hidden my-1">
                              <img
                                src={image}
                                alt={cardName}
                                className="w-full h-full object-contain rounded-2xl drop-shadow-md"
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-blue-600 uppercase">
                              {bank}
                            </span>
                            <h4 className="text-base font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {cardName}
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                            <div className="bg-blue-50/70 p-2.5 rounded-2xl border border-blue-100">
                              <span className="block text-[9px] text-gray-400 font-bold uppercase">JOINING FEE</span>
                              <span className="text-xs font-bold text-blue-600">{joiningFee}</span>
                            </div>
                            <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-100">
                              <span className="block text-[9px] text-gray-400 font-bold uppercase">ANNUAL FEE</span>
                              <span className="text-xs font-bold text-emerald-600">{annualFee}</span>
                            </div>
                          </div>

                          {perks.length > 0 && (
                            <ul className="space-y-1 text-xs text-gray-600 pt-1">
                              {perks.slice(0, 2).map((p: string, pIdx: number) => (
                                <li key={pIdx} className="flex items-start gap-1">
                                  <span className="text-emerald-500 font-bold">✓</span>
                                  <span className="line-clamp-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Apply Now & View Eligibility Buttons */}
                        <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                          <button
                            type="button"
                            onClick={() => openApplyModal(card || { name: cardName, card_alias: alias })}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-blue-600/20"
                          >
                            <span>Apply Now</span>
                            <span>➔</span>
                          </button>

                          {/* Secondary Actions Row: View More & View Eligibility */}
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHighlightsModalCard(card || item.rawItem);
                              }}
                              className="w-full text-center text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-2 transition-colors flex items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 rounded-xl"
                            >
                              <span>View More</span>
                              <span className="text-[11px]">📜</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEligibilityModalCard(card || item.rawItem);
                              }}
                              className="w-full text-center text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-2 transition-colors flex items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 rounded-xl"
                            >
                              <span>View Eligibility</span>
                              <span className="text-[11px]">ℹ️</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SPEND & REWARD CALCULATOR */}
      {activeTab === "calculator" && (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          <div className="bg-white border border-gray-200 rounded-[24px] p-6 md:p-8 space-y-6 shadow-sm">
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={calcLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-blue-600/20"
                >
                  {calcLoading ? "Calculating Rewards..." : "Calculate Net Annual Savings"}
                </button>
              </div>
            </form>

            {calcError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs">
                {calcError}
              </div>
            )}
          </div>

          {/* Formatted Calculator Savings Leaderboard Grid */}
          {calcResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-[20px] p-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">📊</span>
                  <div>
                    <h3 className="text-sm font-bold text-blue-900">Ranked Reward Savings Summary</h3>
                    <p className="text-xs text-blue-700">Top credit cards ranked by net annual savings for your spending profile.</p>
                  </div>
                </div>
              </div>

              {calculatedSavingsList.length === 0 ? (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-[24px] text-gray-500 text-sm">
                  Calculated successfully. Check spending values to view ranked card rewards.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {calculatedSavingsList.map((item, idx) => {
                    const raw = item.rawItem;
                    const matchedCard = item.matched;
                    const cardName = raw?.card_name || matchedCard?.title || matchedCard?.name || "Credit Card";
                    const joiningFee = formatFee(raw?.joining_fees || matchedCard?.joining_fee_text, "Free");
                    const netSavings = raw?.net_annual_savings || raw?.annual_cashback || raw?.ck_rewards || raw?.commission;
                    const image = matchedCard?.card_image || matchedCard?.image || raw?.image;
                    const networkBadge = extractCardNetwork(matchedCard || { name: cardName });

                    return (
                      <div
                        key={idx}
                        className="relative flex flex-col justify-between bg-white border border-blue-200 hover:border-blue-400 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                      >
                        {/* Plus / Compare Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompareCard(matchedCard || raw);
                          }}
                          title={isCardInCompare(matchedCard || raw) ? "Remove from Compare" : "Add to Compare (Up to 3)"}
                          className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-md ${
                            isCardInCompare(matchedCard || raw)
                              ? "bg-blue-600 text-white border-2 border-white shadow-blue-500/40 scale-105"
                              : "bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/90"
                          }`}
                        >
                          {isCardInCompare(matchedCard || raw) ? "✓" : "+"}
                        </button>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                              Rank #{idx + 1}
                            </span>
                            {netSavings && (
                              <span className="text-xs font-black text-emerald-600">
                                Save ₹{Number(netSavings).toLocaleString('en-IN')}/yr
                              </span>
                            )}
                          </div>

                          {image && (
                            <div className="w-full relative aspect-[1.58/1] flex items-center justify-center overflow-hidden my-1">
                              <img
                                src={image}
                                alt={cardName}
                                className="w-full h-full object-contain rounded-2xl drop-shadow-md"
                              />
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-base font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {cardName}
                            </h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${networkBadge.colorClass}`}>
                              {networkBadge.label}
                            </span>
                          </div>

                          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                            <span className="block text-[10px] text-gray-400 font-bold uppercase">JOINING FEE</span>
                            <span className="text-xs font-bold text-blue-600">{joiningFee}</span>
                          </div>

                        </div>

                        {/* Apply Now & View Eligibility Buttons */}
                        <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                          <button
                            type="button"
                            onClick={() => openApplyModal(matchedCard || { name: cardName, card_alias: item.alias, network_url: raw?.cg_network_url })}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-blue-600/20"
                          >
                            <span>Apply Now</span>
                            <span>➔</span>
                          </button>

                          {/* Secondary Actions Row: View More & View Eligibility */}
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHighlightsModalCard(matchedCard || raw);
                              }}
                              className="w-full text-center text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-2 transition-colors flex items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 rounded-xl"
                            >
                              <span>View More</span>
                              <span className="text-[11px]">📜</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEligibilityModalCard(matchedCard || raw);
                              }}
                              className="w-full text-center text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-2 transition-colors flex items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 rounded-xl"
                            >
                              <span>View Eligibility</span>
                              <span className="text-[11px]">ℹ️</span>
                            </button>
                          </div>
                        </div>
                      </div>
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
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
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
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                {(selectedCardForApply?.card_image || selectedCardForApply?.image || selectedCardForApply?.logo) && (
                  <img
                    src={selectedCardForApply?.card_image || selectedCardForApply?.image || selectedCardForApply?.logo}
                    alt="Card"
                    className="w-20 h-12 object-contain rounded-xl bg-white p-1 border border-gray-200 shrink-0 drop-shadow-sm"
                  />
                )}
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>


                {applyError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs">
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
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-full transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="apply-lead-form"
                disabled={submittingLead}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                <span>{submittingLead ? "Processing Lead..." : "Continue to Bank Application"}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN PROMPT MODAL FOR GUEST USERS */}
      {loginPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl mx-auto shadow-sm">
              🔒
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-gray-900">
                Log In to Apply
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                Credit card applications are reserved for registered FinHeal members. Please log in or sign up to continue.
              </p>
            </div>

            {selectedCardForApply && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-left flex items-center gap-3">
                {(selectedCardForApply?.card_image || selectedCardForApply?.image) && (
                  <img
                    src={selectedCardForApply?.card_image || selectedCardForApply?.image}
                    alt="Card"
                    className="w-12 h-8 object-contain rounded-lg bg-white p-0.5 border border-gray-200"
                  />
                )}
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">SELECTED CARD</span>
                  <span className="text-xs font-bold text-gray-900 line-clamp-1">
                    {selectedCardForApply?.title || selectedCardForApply?.name || selectedCardForApply?.card_name || "Credit Card"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLoginPromptModalOpen(false)}
                className="w-1/2 py-2.5 px-4 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-full border border-gray-200 transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginPromptModalOpen(false);
                  setLocation("/login");
                }}
                className="w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
              >
                <span>Log In Now</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Warning if user tries > 3 cards */}
      {compareWarning && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-900 text-amber-400 border border-amber-500/40 text-xs font-bold rounded-full shadow-2xl animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>{compareWarning}</span>
        </div>
      )}

      {/* Sticky Bottom Comparison Floating Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 max-w-[95vw] overflow-hidden">
          <div className="flex items-center gap-2 pl-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 whitespace-nowrap">
              Compare ({compareList.length}/3)
            </span>
          </div>

          {/* Selected Card Thumbnails */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-[260px] md:max-w-[340px]">
            {compareList.map((c, cIdx) => {
              const cName = c?.title || c?.name || c?.card_name || "Card";
              const cImg = c?.card_image || c?.image || c?.logo;
              return (
                <div
                  key={cIdx}
                  className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-full px-2.5 py-1 text-xs text-slate-200 shrink-0"
                >
                  {cImg && (
                    <img src={cImg} alt={cName} className="w-5 h-3.5 object-contain rounded shrink-0" />
                  )}
                  <span className="max-w-[75px] truncate font-semibold text-[10px]">{cName}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompareCard(c)}
                    className="ml-0.5 text-slate-400 hover:text-red-400 font-bold transition-colors text-xs"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-full shadow-md transition-all active:scale-95 whitespace-nowrap"
            >
              <span>Compare Cards</span>
              <span>➔</span>
            </button>

            <button
              type="button"
              onClick={() => setCompareList([])}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-full transition-all whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-white rounded-[28px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[88vh] my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/90 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-bold shadow-md">
                  📊
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-none">Side-by-Side Card Comparison</h3>
                  <p className="text-xs text-gray-500 mt-1">Comparing {compareList.length} selected credit cards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all font-extrabold text-base shadow-sm"
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            {/* Comparison Matrix Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className={`grid grid-cols-1 ${compareList.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                {compareList.map((card, idx) => {
                  const name = card?.title || card?.name || "Credit Card";
                  const bank = extractBankName(card);
                  const joiningFee = formatFee(card?.joining_fee_text || card?.joiningFees || card?.joining_fee, "Free");
                  const annualFee = formatFee(card?.annual_fee_text || card?.annualFees || card?.annual_fee, "Nil");
                  const image = card?.card_image || card?.image || card?.logo;
                  const perks = extractPerks(card);
                  const networkBadge = extractCardNetwork(card);

                  return (
                    <div
                      key={idx}
                      className="flex flex-col justify-between bg-slate-50/80 border border-slate-200 rounded-[24px] p-5 space-y-4 shadow-sm relative"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCompareCard(card)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-500 font-bold text-sm bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                        title="Remove from comparison"
                      >
                        ×
                      </button>

                      {/* Card Preview Header */}
                      <div className="space-y-3">
                        {/* 1. Card Preview & Title Header (Flexible Aligned Header) */}
                        <div className="space-y-2 pt-1 min-h-[225px] flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-2 pr-6">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{bank}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${networkBadge.colorClass}`}>
                              {networkBadge.label}
                            </span>
                          </div>

                          {image && (
                            <div className="w-full aspect-[1.58/1] max-h-[130px] flex items-center justify-center overflow-hidden my-1">
                              <img src={image} alt={name} className="w-full h-full object-contain rounded-2xl drop-shadow-md" />
                            </div>
                          )}

                          <h4 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug pt-1">{name}</h4>
                        </div>

                        {/* 2. Fee & Perks Matrix (Aligned Heights) */}
                        <div className="space-y-3 pt-3 border-t border-slate-200/80">
                          {/* Joining Fee Box */}
                          <div className="bg-white p-3 rounded-2xl border border-slate-200/70 h-[56px] flex flex-col justify-center">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">JOINING FEE</span>
                            <span className="text-sm font-extrabold text-blue-600">{joiningFee}</span>
                          </div>

                          {/* Annual Fee Box */}
                          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 h-[56px] flex flex-col justify-center">
                            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">ANNUAL FEE</span>
                            <span className="text-sm font-extrabold text-emerald-700">{annualFee}</span>
                          </div>

                          {/* Eligibility Requirements Matrix Box */}
                          <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/80 space-y-1.5 h-[96px] flex flex-col justify-center">
                            <span className="block text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">ELIGIBILITY REQUIREMENTS</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="block text-[9px] text-slate-400 font-bold uppercase">Min Income</span>
                                <span className="font-extrabold text-blue-700">{extractEligibilityCriteria(card).minIncome || "₹25,000/mo"}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 font-bold uppercase">Min CIBIL</span>
                                <span className="font-extrabold text-blue-700">{extractEligibilityCriteria(card).minCibil || "750+"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Key Highlights Box (Full Text Display from API) */}
                          <div className="space-y-1.5 pt-1 min-h-[120px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KEY HIGHLIGHTS:</span>
                            {perks.length > 0 ? (
                              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                                {perks.map((p: string, pIdx: number) => (
                                  <li key={pIdx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                                    <span className="break-words">{p}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Standard cashback & reward perks apply.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3. Action Button (Pinned at Bottom) */}
                      <div className="pt-3 border-t border-slate-200 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCompareModalOpen(false);
                            openApplyModal(card);
                          }}
                          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <span>Apply Now</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => {
                  setCompareList([]);
                  setCompareModalOpen(false);
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700"
              >
                Clear All Selection
              </button>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Card Eligibility Criteria Modal */}
      {eligibilityModalCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  📋
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 leading-snug">Eligibility Requirements</h3>
                  <p className="text-xs text-blue-600 font-semibold line-clamp-1">{eligibilityModalCard?.title || eligibilityModalCard?.name || "Credit Card"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEligibilityModalCard(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all font-extrabold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Card Header Info */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                {(eligibilityModalCard?.card_image || eligibilityModalCard?.image) && (
                  <img
                    src={eligibilityModalCard?.card_image || eligibilityModalCard?.image}
                    alt="Card"
                    className="w-20 aspect-[1.58/1] object-contain rounded-lg drop-shadow-sm shrink-0"
                  />
                )}
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{extractBankName(eligibilityModalCard)}</span>
                  <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1">{eligibilityModalCard?.title || eligibilityModalCard?.name}</h4>
                </div>
              </div>

              {/* Eligibility Parameters Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">KEY PARAMETERS</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100/80">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">MIN MONTHLY INCOME</span>
                    <span className="text-base font-black text-blue-700">{extractEligibilityCriteria(eligibilityModalCard).minIncome || "₹25,000/mo"}</span>
                  </div>

                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100/80">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">MIN CIBIL SCORE</span>
                    <span className="text-base font-black text-emerald-700">{extractEligibilityCriteria(eligibilityModalCard).minCibil || "750+"}</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">AGE LIMIT</span>
                    <span className="text-sm font-extrabold text-slate-800">{extractEligibilityCriteria(eligibilityModalCard).minAge || "21 - 65 Yrs"}</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">EMPLOYMENT TYPE</span>
                    <span className="text-sm font-extrabold text-slate-800 truncate block">{extractEligibilityCriteria(eligibilityModalCard).empType || "Salaried / Business"}</span>
                  </div>
                </div>
              </div>

              {/* Text Criteria if available */}
              {extractEligibilityCriteria(eligibilityModalCard).details?.length ? (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">ADDITIONAL CRITERIA</span>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {extractEligibilityCriteria(eligibilityModalCard).details?.map((d, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-blue-500 font-bold">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => setEligibilityModalCard(null)}
                className="w-1/2 py-2.5 px-4 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-full border border-gray-200 transition-all"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const cardToApply = eligibilityModalCard;
                  setEligibilityModalCard(null);
                  openApplyModal(cardToApply);
                }}
                className="w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
              >
                <span>Apply Now</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Card Detailed Highlights & Perks Modal */}
      {highlightsModalCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  ✨
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 leading-snug">Detailed Card Highlights</h3>
                  <p className="text-xs text-blue-600 font-semibold line-clamp-1">{highlightsModalCard?.title || highlightsModalCard?.name || "Credit Card"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHighlightsModalCard(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all font-extrabold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Card Header Info */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                {(highlightsModalCard?.card_image || highlightsModalCard?.image) && (
                  <img
                    src={highlightsModalCard?.card_image || highlightsModalCard?.image}
                    alt="Card"
                    className="w-20 aspect-[1.58/1] object-contain rounded-lg drop-shadow-sm shrink-0"
                  />
                )}
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{extractBankName(highlightsModalCard)}</span>
                  <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1">{highlightsModalCard?.title || highlightsModalCard?.name}</h4>
                </div>
              </div>

              {/* Fees Summary Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100/80">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">JOINING FEE</span>
                  <span className="text-sm font-extrabold text-blue-700">{formatFee(highlightsModalCard?.joining_fee_text || highlightsModalCard?.joiningFees || highlightsModalCard?.joining_fee, "Free")}</span>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100/80">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">ANNUAL FEE</span>
                  <span className="text-sm font-extrabold text-emerald-700">{formatFee(highlightsModalCard?.annual_fee_text || highlightsModalCard?.annualFees || highlightsModalCard?.annual_fee, "Nil")}</span>
                </div>
              </div>

              {/* Complete Features & Perks List */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">ALL HIGHLIGHTS & PERKS</span>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  {extractPerks(highlightsModalCard).map((perk: string, pIdx: number) => (
                    <li key={pIdx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/70 leading-relaxed">
                      <span className="text-emerald-500 font-bold text-sm shrink-0 mt-0.5">✓</span>
                      <span className="break-words font-medium">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fee Waiver Condition if present */}
              {highlightsModalCard?.fee_waiver_condition && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-1">
                  <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">ANNUAL FEE WAIVER CONDITION</span>
                  <p className="text-amber-900 font-medium">{highlightsModalCard.fee_waiver_condition}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => setHighlightsModalCard(null)}
                className="w-1/2 py-2.5 px-4 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-full border border-gray-200 transition-all"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const cardToApply = highlightsModalCard;
                  setHighlightsModalCard(null);
                  openApplyModal(cardToApply);
                }}
                className="w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
              >
                <span>Apply Now</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
