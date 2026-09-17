import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Mail } from "lucide-react";

import { getApiBaseUrl } from "@/lib/backendChat";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided in the link.");
      return;
    }

    const verifyToken = async () => {
      try {
        const cleanBaseUrl = getApiBaseUrl().replace(/\/+$/, "");
        
        const response = await fetch(`${cleanBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully! You can now log in to F2 Therapist.");
          setTimeout(() => {
            window.location.href = "/?action=login";
          }, 3500);
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed. The token may be invalid or expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Unable to connect to the authentication server. Please check your connection.");
      }
    };

    verifyToken();
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setResendMessage("");

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
      const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

      const response = await fetch(`${cleanBaseUrl}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();
      setResendMessage(data.message || "Verification email sent if account exists.");
    } catch (err) {
      setResendMessage("Failed to request verification email. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-teal-800 to-teal-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mb-3">
            <Mail className="w-8 h-8 text-teal-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">F2 Therapist</h1>
          <p className="text-teal-100 text-sm mt-1">Financial Wellness & Therapy Companion</p>
        </div>

        {/* Content Body */}
        <div className="p-8 text-center">
          {status === "loading" && (
            <div className="py-6 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
              <h2 className="text-lg font-semibold text-slate-800">Verifying Email...</h2>
              <p className="text-slate-500 text-sm mt-1">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Email Verified!</h2>
              <p className="text-slate-600 text-sm mt-2">{message}</p>
              
              <a
                href="/?action=login"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-teal-600/20"
              >
                Proceed to Login <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-xs text-slate-400 mt-3">Redirecting automatically in 3 seconds...</p>
            </div>
          )}

          {status === "error" && (
            <div className="py-2 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
              <p className="text-slate-600 text-sm mt-2">{message}</p>

              <div className="w-full mt-6 pt-6 border-t border-slate-100 text-left">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Request New Verification Link</h3>
                <form onSubmit={handleResend} className="flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
                  >
                    {resending ? "Sending..." : "Resend Verification Email"}
                  </button>
                </form>
                {resendMessage && (
                  <p className="text-xs text-teal-700 mt-2 font-medium bg-teal-50 p-2.5 rounded-lg border border-teal-100">
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
