const envBackend = import.meta.env.VITE_BACKEND_URL?.trim();
const envApiBase = import.meta.env.VITE_API_BASE_URL?.trim()?.replace(/\/api\/v1\/?$/, "");
const API_BASE = (envBackend || envApiBase || "http://localhost:8000").replace(/\/$/, "");

export interface CreditCardItem {
  id?: string;
  name?: string;
  title?: string;
  bank_name?: string;
  bank?: string;
  bank_logo?: string;
  card_image?: string;
  image?: string;
  logo?: string;
  annual_fee?: string | number;
  annualFees?: string | number;
  joining_fee?: string | number;
  joiningFees?: string | number;
  fee_waiver_condition?: string;
  rewards_summary?: string;
  perks?: any[];
  highlights?: any[];
  features?: any[];
  apply_url?: string;
  applyLink?: string;
  network_url?: string;
  api_redirection_url?: string;
  alias?: string;
  card_alias?: string;
  rating?: number;
  is_popular?: boolean;
  category?: string;
  [key: string]: any;
}

export interface EligibilityPayload {
  pincode: string;
  inhandIncome: string;
  empStatus: string; // 'salaried' | 'self-employed'
}

export interface CardLeadPayload {
  fullName: string;
  mobileNumber: string;
  email?: string;
  city?: string;
  pincode?: string;
  cardAlias?: string;
  cardName?: string;
  networkUrl?: string;
  applyUrl?: string;
}

export interface SpendCalculatePayload {
  amazon_spends?: number;
  flipkart_spends?: number;
  other_online_spends?: number;
  other_offline_spends?: number;
  grocery_spends_online?: number;
  mobile_phone_bills?: number;
  electricity_bills?: number;
  water_bills?: number;
  fuel?: number;
  insurance_health_annual?: number;
  insurance_car_or_bike_annual?: number;
  school_fees?: number;
  rent?: number;
  flights_annual?: number;
  hotels_annual?: number;
  domestic_lounge_usage_quarterly?: number;
  international_lounge_usage_quarterly?: number;
  dining_or_going_out?: number;
  online_food_ordering?: number;
  life_insurance?: number;
  offline_grocery?: number;
  [key: string]: any;
}

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function fetchCardsCatalog(): Promise<any> {
  return requestApi<any>("/api/v1/credit-cards/cards");
}

export async function fetchPopularCards(): Promise<any> {
  return requestApi<any>("/api/v1/credit-cards/popular");
}

export async function checkCardEligibility(payload: EligibilityPayload): Promise<any> {
  return requestApi<any>("/api/v1/credit-cards/eligibility", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function calculateCardSavings(payload: SpendCalculatePayload): Promise<any> {
  return requestApi<any>("/api/v1/credit-cards/calculate-savings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitCardLead(payload: CardLeadPayload): Promise<any> {
  return requestApi<any>("/api/v1/credit-cards/apply-lead", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
