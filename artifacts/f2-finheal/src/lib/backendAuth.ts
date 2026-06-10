import { getApiBaseUrl } from "@/lib/backendChat";
import type { AuthSession } from "@/utils/authSession";

interface AuthResponse {
  user_id: string;
  token?: string;
  email?: string;
  name?: string;
  hearts?: number;
  is_guest?: boolean;
}

export interface BackendUserProfile {
  user_id: string;
  email?: string | null;
  name: string;
  phone?: string | null;
  location?: string | null;
  occupation?: string | null;
  bio?: string | null;
  hearts?: number;
  is_guest?: boolean;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  financial_goal?: string | null;
  financial_stress?: string | null;
  risk_tolerance?: string | null;
  monthly_income?: string | null;
  therapy_style?: string | null;
  goals?: any[] | null;
}

export interface BackendUserProfileUpdate {
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  occupation?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  financial_goal?: string | null;
  financial_stress?: string | null;
  risk_tolerance?: string | null;
  monthly_income?: string | null;
  therapy_style?: string | null;
}

const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function buildUrl(path: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw) {
    throw new Error("Unexpected empty response from auth service");
  }
  return JSON.parse(raw) as T;
}

async function authRequest<T>(path: string, init: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(configuredApiKey ? { Authorization: `Bearer ${configuredApiKey}`, "X-API-Key": configuredApiKey } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const message = body || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return parseJsonResponse<T>(response);
}

export async function signInGuest(existingUserId?: string): Promise<AuthSession> {
  const userId = existingUserId || createUuid();
  const result = await authRequest<AuthResponse>("auth/guest", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });

  return {
    userId: result.user_id,
    token: "",
    displayName: "Guest",
    hearts: result.hearts ?? 50,
    isGuest: true,
    authenticatedAt: new Date().toISOString(),
  };
}

export async function signInUser(email: string, password: string): Promise<AuthSession> {
  const result = await authRequest<AuthResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return {
    userId: result.user_id,
    token: result.token ?? "",
    email: result.email,
    displayName: result.name || email,
    hearts: result.hearts ?? null,
    isGuest: false,
    authenticatedAt: new Date().toISOString(),
  };
}

export async function signUpUser(email: string, password: string, guestUserId?: string, name?: string): Promise<AuthSession> {
  const result = await authRequest<AuthResponse>("auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name: name || email, guest_user_id: guestUserId }),
  });

  return {
    userId: result.user_id,
    token: result.token ?? "",
    email: result.email,
    displayName: result.name || email,
    hearts: result.hearts ?? null,
    isGuest: false,
    authenticatedAt: new Date().toISOString(),
  };
}

export async function fetchHearts(userId: string): Promise<number> {
  const response = await authRequest<{ hearts: number }>(`auth/hearts/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
  return response.hearts;
}

export interface TestResultPayload {
  user_id: string;
  test_type: string;
  score?: number;
  percentage_score?: number;
  risk_level?: string;
  category?: string;
  result_data?: Record<string, unknown>;
}

export async function saveTestResult(payload: TestResultPayload): Promise<void> {
  await authRequest<unknown>("test-results/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchTestResults(userId: string): Promise<{
  id: string;
  test_type: string;
  score: number | null;
  percentage_score: number | null;
  risk_level: string | null;
  category: string | null;
  completed_at: string;
}[]> {
  return authRequest(`test-results/${encodeURIComponent(userId)}`, { method: "GET" });
}

export async function fetchUserProfile(userId: string): Promise<BackendUserProfile> {
  return authRequest(`auth/profile/${encodeURIComponent(userId)}`, { method: "GET" });
}

export async function saveUserProfile(userId: string, payload: BackendUserProfileUpdate): Promise<BackendUserProfile> {
  return authRequest(`auth/profile/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export interface BackendStats {
  total_users: number;
  registered_users: number;
  guest_users: number;
  total_conversations: number;
}

export async function fetchAdminStats(): Promise<BackendStats> {
  return authRequest<BackendStats>("auth/admin/stats", { method: "GET" });
}

export interface CalculatorActivityPayload {
  user_id: string;
  calculator_type: string;
  loan_type: string | null;
  inputs: Record<string, any>;
}

export async function logCalculatorActivity(payload: CalculatorActivityPayload): Promise<void> {
  await authRequest<unknown>("calculator/activity", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function migrateCalculatorActivities(fromUserId: string, toUserId: string): Promise<void> {
  await authRequest<unknown>("calculator/migrate", {
    method: "POST",
    body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId }),
  });
}

// ==================== Advisors API Endpoints ====================

export interface BackendAdvisor {
  f2_fintech_id: string;
  name: string;
  designation: string;
  avatar_url?: string;
  availability: "available" | "unavailable";
  expertise?: string[];
  strength?: string;
  bio?: string;
  rating: number;
  reviews_count: number;
  next_slot?: string;
  category: string;
  fee: number;
}

export function mapBackendAdvisorToFrontend(a: BackendAdvisor): any {
  return {
    id: a.f2_fintech_id,
    f2FintechId: a.f2_fintech_id,
    name: a.name,
    designation: a.designation,
    avatarUrl: a.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
    availability: a.availability,
    expertise: a.expertise || [],
    strength: a.strength || "",
    bio: a.bio || "",
    rating: a.rating,
    reviewsCount: a.reviews_count,
    nextSlot: a.next_slot || "Tomorrow, 10:00 AM",
    category: a.category,
    fee: a.fee
  };
}

export function mapFrontendAdvisorToBackend(a: any): BackendAdvisor {
  return {
    f2_fintech_id: a.f2FintechId || a.id,
    name: a.name,
    designation: a.designation,
    avatar_url: a.avatarUrl,
    availability: a.availability,
    expertise: a.expertise || [],
    strength: a.strength || "",
    bio: a.bio || "",
    rating: a.rating || 4.8,
    reviews_count: a.reviewsCount || 15,
    next_slot: a.nextSlot,
    category: a.category,
    fee: a.fee || 899
  };
}

export async function fetchAdvisors(): Promise<any[]> {
  const list = await authRequest<BackendAdvisor[]>("advisors", { method: "GET" });
  return list.map(mapBackendAdvisorToFrontend);
}

export async function saveAdvisor(advisor: any): Promise<any> {
  const payload = mapFrontendAdvisorToBackend(advisor);
  const result = await authRequest<BackendAdvisor>("advisors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapBackendAdvisorToFrontend(result);
}

export async function deleteAdvisor(f2FintechId: string): Promise<void> {
  await authRequest<unknown>(`advisors/${encodeURIComponent(f2FintechId)}`, {
    method: "DELETE",
  });
}

export async function updateAdvisorAvailability(f2FintechId: string, availability: string): Promise<any> {
  const result = await authRequest<BackendAdvisor>(`advisors/${encodeURIComponent(f2FintechId)}/availability`, {
    method: "PUT",
    body: JSON.stringify({ availability }),
  });
  return mapBackendAdvisorToFrontend(result);
}

export async function updateAdvisorNextSlot(f2FintechId: string, nextSlot: string): Promise<any> {
  const result = await authRequest<BackendAdvisor>(`advisors/${encodeURIComponent(f2FintechId)}/next-slot`, {
    method: "PUT",
    body: JSON.stringify({ next_slot: nextSlot }),
  });
  return mapBackendAdvisorToFrontend(result);
}

export async function saveUserGoals(userId: string, goals: any[]): Promise<any> {
  return authRequest(`auth/profile/${encodeURIComponent(userId)}/goals`, {
    method: "PUT",
    body: JSON.stringify(goals),
  });
}


