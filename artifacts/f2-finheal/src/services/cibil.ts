import { getStoredAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const API_KEY = import.meta.env.VITE_API_KEY || "";

function getHeaders(userId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }
  const session = getStoredAuthSession();
  const activeUserId = userId || session?.userId;
  if (activeUserId) {
    headers["X-Requester-ID"] = activeUserId;
  }
  return headers;
}

export function getBureauPdfDownloadUrl(pdfUrl?: string, fileName?: string): string {
  if (!pdfUrl) return "#";
  const encodedUrl = encodeURIComponent(pdfUrl);
  const encodedFileName = encodeURIComponent(fileName || "credit_report.pdf");
  return `${API_BASE_URL}/cibil/proxy-pdf?url=${encodedUrl}&filename=${encodedFileName}`;
}

export async function downloadBureauPdf(pdfUrl?: string, fileName?: string, e?: any): Promise<void> {
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }
  if (!pdfUrl) return;
  const proxyUrl = getBureauPdfDownloadUrl(pdfUrl, fileName || "credit_report.pdf");
  try {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) {
      window.open(proxyUrl, "_blank");
      return;
    }
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || "credit_report.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    window.open(proxyUrl, "_blank");
  }
}

export interface CibilReportMetric {
  payment_on_time_pct: number;
  credit_utilization_pct: number;
  credit_history_age_years: number;
  enquiries_l6m: number;
  enquiries_l3m: number;
  secured_loans_count: number;
  unsecured_loans_count: number;
  write_offs: number;
  defaults: number;
}

export interface CibilAccount {
  lender: string;
  type: string;
  sanctioned_amount: number;
  outstanding_balance: number;
  payment_status: string;
  open_date: string;
  is_active: boolean;
}

export interface CibilReport {
  id?: string;
  score: number;
  band: string;
  pan: string;
  name: string;
  phone: string;
  metrics: CibilReportMetric;
  accounts: CibilAccount[];
  tips: string[];
  pdf_url?: string;
  fetched_at: string;
  bsa_analysis?: any;
  bureau?: string;
}

export async function fetchCibilReport(
  userId: string,
  name: string,
  phone: string,
  pan?: string,
  bureau: "cibil" | "experian" | "company_cibil" | "company_experian" = "cibil",
  reportType: "individual" | "company" = "individual",
  fetchedForEmployeeId?: string
): Promise<CibilReport> {
  const response = await fetch(`${API_BASE_URL}/cibil/fetch`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({
      user_id: userId,
      name,
      phone,
      pan: pan || "",
      bureau,
      report_type: reportType,
      fetched_for_employee_id: fetchedForEmployeeId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errMsg = "Failed to fetch CIBIL report";
    if (errorData.detail) {
      if (typeof errorData.detail === "object" && errorData.detail !== null) {
        errMsg = errorData.detail.message || JSON.stringify(errorData.detail);
      } else {
        errMsg = errorData.detail;
      }
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<CibilReport>;
}

export async function getStoredCibilReport(userId: string): Promise<CibilReport> {
  const response = await fetch(`${API_BASE_URL}/cibil/report/${userId}`, {
    method: "GET",
    headers: getHeaders(userId),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errMsg = "No stored CIBIL report found";
    if (errorData.detail) {
      if (typeof errorData.detail === "object" && errorData.detail !== null) {
        errMsg = errorData.detail.message || JSON.stringify(errorData.detail);
      } else {
        errMsg = errorData.detail;
      }
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<CibilReport>;
}

