import { getApiBaseUrl } from "@/lib/backendChat";
import type { AuthSession } from "@/utils/authSession";
import { isSlotPassed } from "../utils/availability";

interface AuthResponse {
  user_id: string;
  token?: string;
  email?: string;
  name?: string;
  hearts?: number;
  is_guest?: boolean;
  permissions?: string[];
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

export async function authRequest<T>(path: string, init: RequestInit): Promise<T> {
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

export async function signUpUser(email: string, password: string, guestUserId?: string, name?: string, referralCode?: string): Promise<AuthSession> {
  const result = await authRequest<AuthResponse>("auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name: name || email, guest_user_id: guestUserId, invite_token: referralCode }),
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

export interface AdvisorSignupPayload {
  f2_fintech_id: string;
  designation: string;
  password: string;
  confirm_password: string;
}

export interface AdvisorLoginPayload {
  f2_fintech_id: string;
  password: string;
}

export async function signUpAdvisor(payload: AdvisorSignupPayload): Promise<AuthSession> {
  const result = await authRequest<AuthResponse & { is_advisor?: boolean }>("auth/advisor/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    userId: result.user_id,
    token: result.token ?? "",
    email: result.email,
    displayName: result.name || payload.f2_fintech_id,
    hearts: result.hearts ?? null,
    isGuest: false,
    isAdvisor: true,
    permissions: result.permissions || [],
    authenticatedAt: new Date().toISOString(),
  };
}

export async function signInAdvisor(payload: AdvisorLoginPayload): Promise<AuthSession> {
  const result = await authRequest<AuthResponse & { is_advisor?: boolean }>("auth/advisor/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    userId: result.user_id,
    token: result.token ?? "",
    email: result.email,
    displayName: result.name || payload.f2_fintech_id,
    hearts: result.hearts ?? null,
    isGuest: false,
    isAdvisor: true,
    permissions: result.permissions || [],
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("finheal:wellness_update"));
  }
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
  avatar_url?: string | null;
  availability: string;
  expertise?: string[] | null;
  strength?: string | null;
  bio?: string | null;
  rating: number;
  reviews_count: number;
  next_slot?: string | null;
  category: string;
  fee: number;
  original_fee?: number | null;
  discount_expires_at?: string | null;
  test_comment?: string | null;
  test_rating?: number | null;
  department?: string | null;
  is_advisor?: boolean;
  is_active?: boolean;
  deactivation_reason?: string | null;
  permissions?: string[] | null;
}

export interface Advisor {
  id: string;
  f2FintechId?: string;
  name: string;
  designation: string;
  avatarUrl: string;
  availability: string;
  expertise: string[];
  strength: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  nextSlot: string;
  category: string;
  fee: number;
  originalFee?: number;
  discountExpiresAt?: string;
  testComment?: string;
  testRating?: number;
  department?: string;
  isAdvisor?: boolean;
  isActive?: boolean;
  deactivationReason?: string;
  permissions?: string[];
}

export function mapBackendAdvisorToFrontend(a: BackendAdvisor): any {
  return {
    id: a.f2_fintech_id,
    f2FintechId: a.f2_fintech_id,
    name: a.name,
    designation: a.designation,
    avatarUrl: a.avatar_url || "",
    availability: a.availability,
    expertise: a.expertise || [],
    strength: a.strength || "",
    bio: a.bio || "",
    rating: a.rating,
    reviewsCount: a.reviews_count,
    nextSlot: (!a.next_slot || a.next_slot.startsWith("Tomorrow") || isSlotPassed(a.next_slot)) ? "Not available" : a.next_slot,
    category: a.category,
    fee: a.fee,
    originalFee: a.original_fee || undefined,
    discountExpiresAt: a.discount_expires_at || undefined,
    testComment: a.test_comment || undefined,
    testRating: a.test_rating || undefined,
    department: (a.department && a.department !== "General") ? a.department : "Founder's Office",
    isAdvisor: a.is_advisor ?? false,
    isActive: a.is_active ?? true,
    deactivationReason: a.deactivation_reason || undefined,
    permissions: a.permissions || []
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
    rating: a.rating !== undefined && a.rating !== null ? a.rating : 0.0,
    reviews_count: a.reviewsCount !== undefined && a.reviewsCount !== null ? a.reviewsCount : 0,
    next_slot: a.nextSlot,
    category: a.category,
    fee: a.fee || 899,
    test_comment: a.testComment,
    test_rating: a.testRating,
    department: (a.department && a.department !== "General") ? a.department : "Founder's Office",
    is_advisor: a.isAdvisor ?? false,
    is_active: a.isActive ?? true,
    deactivation_reason: a.deactivationReason || undefined,
    permissions: a.permissions || []
  };
}

export async function fetchAdvisors(userId?: string, allEmployees: boolean = false): Promise<any[]> {
  const queryParams = [];
  if (userId) queryParams.push(`user_id=${encodeURIComponent(userId)}`);
  if (allEmployees) queryParams.push(`all_employees=true`);
  const url = queryParams.length > 0 ? `advisors?${queryParams.join("&")}` : "advisors";
  const list = await authRequest<BackendAdvisor[]>(url, { method: "GET" });
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

export async function updateAdvisorRole(f2FintechId: string, isAdvisor: boolean): Promise<any> {
  return authRequest(`advisors/${encodeURIComponent(f2FintechId)}/role`, {
    method: "PUT",
    body: JSON.stringify({ is_advisor: isAdvisor }),
  });
}

export async function updateAdvisorActiveStatus(f2FintechId: string, isActive: boolean, deactivationReason?: string): Promise<any> {
  return authRequest(`advisors/${encodeURIComponent(f2FintechId)}/active-status`, {
    method: "PUT",
    body: JSON.stringify({ 
      is_active: isActive,
      deactivation_reason: deactivationReason 
    }),
  });
}

export async function saveUserGoals(userId: string, goals: any[]): Promise<any> {
  return authRequest(`auth/profile/${encodeURIComponent(userId)}/goals`, {
    method: "PUT",
    body: JSON.stringify(goals),
  });
}

// ==================== Advisor Appointments APIs ====================

export interface Appointment {
  id?: string;
  advisorId: string;
  advisorName: string;
  date: string;
  time: string;
  notes?: string;
  bookedAt: string;
  completed?: boolean;
  cancelled?: boolean;
  rating?: number;
  feedback?: string;
  meetUrl?: string;
  joined?: boolean;
  clientEmail?: string;
  clientName?: string;
  userId?: string;
}

export interface BookAppointmentPayload {
  user_id: string;
  advisor_id: string;
  advisor_name: string;
  date: string;
  time: string;
  notes?: string;
  meet_url?: string;
}

export interface AppointmentStatusUpdatePayload {
  completed?: boolean;
  cancelled?: boolean;
  rating?: number;
  feedback?: string;
}

function mapBackendAppointmentToFrontend(a: any): Appointment {
  return {
    id: a.id,
    userId: a.user_id,
    advisorId: a.advisor_id,
    advisorName: a.advisor_name,
    date: a.date,
    time: a.time,
    notes: a.notes,
    bookedAt: a.booked_at,
    completed: a.completed,
    cancelled: a.cancelled,
    rating: a.rating,
    feedback: a.feedback,
    meetUrl: a.meet_url,
    joined: a.joined,
    clientEmail: a.client_email || a.clientEmail,
    clientName: a.client_name || a.clientName
  };
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  const result = await authRequest<any>("advisors/appointments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return mapBackendAppointmentToFrontend(result);
}

export async function fetchUserAppointments(userId: string): Promise<Appointment[]> {
  const list = await authRequest<any[]>(`advisors/appointments/user/${encodeURIComponent(userId)}`, {
    method: "GET"
  });
  return list.map(mapBackendAppointmentToFrontend);
}

export async function fetchAllAppointments(): Promise<Appointment[]> {
  const list = await authRequest<any[]>("advisors/appointments/all", {
    method: "GET"
  });
  return list.map(mapBackendAppointmentToFrontend);
}

export async function fetchAdvisorAppointments(advisorId: string): Promise<Appointment[]> {
  const list = await authRequest<any[]>(`advisors/appointments/advisor/${encodeURIComponent(advisorId)}`, {
    method: "GET"
  });
  return list.map(mapBackendAppointmentToFrontend);
}

export async function updateAppointmentStatus(apptId: string, payload: AppointmentStatusUpdatePayload): Promise<Appointment> {
  const result = await authRequest<any>(`advisors/appointments/${encodeURIComponent(apptId)}/status`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return mapBackendAppointmentToFrontend(result);
}

export async function joinAppointment(apptId: string): Promise<Appointment> {
  const result = await authRequest<any>(`advisors/appointments/${encodeURIComponent(apptId)}/join`, {
    method: "PUT"
  });
  return mapBackendAppointmentToFrontend(result);
}

export async function uploadAdvisorAvatar(f2FintechId: string, file: File): Promise<{ url: string }> {
  const url = buildUrl(`advisors/${encodeURIComponent(f2FintechId)}/upload-avatar`);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      ...(configuredApiKey ? { Authorization: `Bearer ${configuredApiKey}`, "X-API-Key": configuredApiKey } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const message = body || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const result = await parseJsonResponse<{ status: string; avatar_url: string }>(response);
  return { url: result.avatar_url };
}

export async function rescheduleAppointment(apptId: string, date: string, time: string): Promise<Appointment> {
  const result = await authRequest<any>(`advisors/appointments/${encodeURIComponent(apptId)}/reschedule`, {
    method: "PUT",
    body: JSON.stringify({ date, time })
  });
  return mapBackendAppointmentToFrontend(result);
}

export async function updateAdvisorPassword(f2FintechId: string, currentPassword: string, newPassword: string): Promise<{ status: string; message: string }> {
  return authRequest<{ status: string; message: string }>(`advisors/${encodeURIComponent(f2FintechId)}/password`, {
    method: "PUT",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<{ status: string; message: string }> {
  return authRequest<{ status: string; message: string }>("auth/change-password", {
    method: "PUT",
    body: JSON.stringify({ user_id: userId, current_password: currentPassword, new_password: newPassword }),
  });
}

export function isAdvisorSlotActive(availability: string): boolean {
  if (!availability) return false;
  if (availability === "available") return true;
  if (availability === "unavailable" || availability === "Not Available") return false;

  // Pattern check: "HH:MM AM/PM - HH:MM AM/PM"
  const match = availability.match(/^(\d{2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;

  const [_, startH, startM, startP, endH, endM, endP] = match;
  
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hourPart = parts.find(p => p.type === "hour");
    const minutePart = parts.find(p => p.type === "minute");
    if (hourPart && minutePart) {
      hours = parseInt(hourPart.value, 10);
      minutes = parseInt(minutePart.value, 10);
    }
  } catch (e) {
    console.error("Error formatting timezone for slot check:", e);
  }
  const currentMinutes = hours * 60 + minutes;

  let startHrs = parseInt(startH, 10);
  if (startP.toUpperCase() === "PM" && startHrs !== 12) startHrs += 12;
  if (startP.toUpperCase() === "AM" && startHrs === 12) startHrs = 0;
  const startMinutes = startHrs * 60 + parseInt(startM, 10);

  let endHrs = parseInt(endH, 10);
  if (endP.toUpperCase() === "PM" && endHrs !== 12) endHrs += 12;
  if (endP.toUpperCase() === "AM" && endHrs === 12) endHrs = 0;
  const endMinutes = endHrs * 60 + parseInt(endM, 10);

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// ==================== User Session Reports APIs ====================

export interface UserReport {
  id: string;
  userId: string;
  reportType: "daily" | "fortnightly" | "monthly" | "on_demand";
  startDate: string;
  endDate: string;
  summary: string;
  keyTakeaways: string[];
  moodTrend: {
    stress?: number;
    urgency?: number;
    openness?: number;
    willingness?: number;
    emotion?: number;
    [key: string]: any;
  };
  activitySummary: {
    msg_count?: number;
    cibil_checks?: number;
    calculator_runs?: number;
    tests_completed?: number;
    videos_watched?: number;
    [key: string]: any;
  };
  createdAt: string;
}

export async function fetchUserReports(userId: string): Promise<UserReport[]> {
  const list = await authRequest<any[]>(`chat/reports/${encodeURIComponent(userId)}`, {
    method: "GET"
  });
  return list.map(r => ({
    id: r.id,
    userId: r.user_id,
    reportType: r.report_type,
    startDate: r.start_date,
    endDate: r.end_date,
    summary: r.summary,
    keyTakeaways: r.key_takeaways || [],
    moodTrend: r.mood_trend || {},
    activitySummary: r.activity_summary || {},
    createdAt: r.created_at
  }));
}

export async function triggerReportGeneration(userId: string, reportType: string): Promise<UserReport | null> {
  const result = await authRequest<any>(`chat/reports/${encodeURIComponent(userId)}/trigger?report_type=${reportType}`, {
    method: "POST"
  });
  if (result.status === "skipped" || !result.report) return null;
  const r = result.report;
  return {
    id: r.id,
    userId: r.user_id,
    reportType: r.report_type,
    startDate: r.start_date,
    endDate: r.end_date,
    summary: r.summary,
    keyTakeaways: r.key_takeaways || [],
    moodTrend: r.mood_trend || {},
    activitySummary: r.activity_summary || {},
    createdAt: r.created_at
  };
}

export interface ReferralCode {
  id: string;
  code: string;
  advisor_id: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export async function generateReferral(advisorId: string): Promise<ReferralCode> {
  return authRequest<ReferralCode>(`advisors/${encodeURIComponent(advisorId)}/referrals`, {
    method: "POST"
  });
}

export async function listReferrals(advisorId: string): Promise<ReferralCode[]> {
  return authRequest<ReferralCode[]>(`advisors/${encodeURIComponent(advisorId)}/referrals`, {
    method: "GET"
  });
}

export async function generateOnDemandReport(userId: string): Promise<UserReport> {
  const result = await authRequest<any>(`chat/reports/${encodeURIComponent(userId)}/generate`, {
    method: "POST"
  });
  if (!result || result.status !== "success" || !result.report) {
    throw new Error(result?.message || "Failed to generate on-demand report.");
  }
  const r = result.report;
  return {
    id: r.id,
    userId: r.user_id,
    reportType: r.report_type,
    startDate: r.start_date,
    endDate: r.end_date,
    summary: r.summary,
    keyTakeaways: r.key_takeaways || [],
    moodTrend: r.mood_trend || {},
    activitySummary: r.activity_summary || {},
    createdAt: r.created_at
  };
}

export async function checkAdvisorCibilLimit(advisorId: string): Promise<{
  advisor_id: string;
  fetch_count: number;
  trigger_warning: boolean;
  message: string;
}> {
  return authRequest<any>(`cibil/advisor-limit-check/${encodeURIComponent(advisorId)}`, {
    method: "GET"
  });
}


