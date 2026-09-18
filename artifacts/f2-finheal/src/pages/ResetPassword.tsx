import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Lock, Eye, EyeOff, Check } from "lucide-react";

import { getApiBaseUrl } from "@/lib/backendChat";

export function checkPasswordRequirements(pw: string) {
  const minLength = pw.length >= 8;
  const hasUppercase = /[A-Z]/.test(pw);
  const hasLowercase = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const isAllValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  return { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, isAllValid };
}

export default function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [statusMessage, setStatusMessage] = useState("Validating password reset link...");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (!urlToken) {
      setStatus("invalid");
      setStatusMessage("No reset token was provided in the link.");
      return;
    }

    setToken(urlToken);

    const verifyToken = async () => {
      try {
        const cleanBaseUrl = getApiBaseUrl().replace(/\/+$/, "");
        const response = await fetch(`${cleanBaseUrl}/auth/verify-reset-token?token=${encodeURIComponent(urlToken)}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setStatus("valid");
          setUserEmail(data.email || "");
        } else {
          setStatus("invalid");
          setStatusMessage(data.detail || "Invalid or expired password reset link.");
        }
      } catch (err) {
        setStatus("invalid");
        setStatusMessage("Unable to connect to the authentication server. Please check your connection.");
      }
    };

    verifyToken();
  }, []);

  const reqs = checkPasswordRequirements(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!reqs.isAllValid) {
      setResetError("Please satisfy all password complexity requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match. Please try again.");
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    try {
      const cleanBaseUrl = getApiBaseUrl().replace(/\/+$/, "");
      const response = await fetch(`${cleanBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          window.location.href = "/?action=login";
        }, 3500);
      } else {
        setResetError(data.detail || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setResetError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-teal-800 to-teal-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mb-3">
            <Lock className="w-8 h-8 text-teal-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">F2 Therapist</h1>
          <p className="text-teal-100 text-sm mt-1">Set Your New Password</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {status === "loading" && (
            <div className="py-6 flex flex-col items-center text-center">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
              <h2 className="text-lg font-semibold text-slate-800">Validating Link...</h2>
              <p className="text-slate-500 text-sm mt-1">{statusMessage}</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="py-4 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Link Invalid or Expired</h2>
              <p className="text-slate-600 text-sm mt-2">{statusMessage}</p>

              <a
                href="/?action=login"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition shadow-md"
              >
                Back to Login <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {status === "valid" && (
            <>
              {resetSuccess ? (
                <div className="py-4 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Password Reset Complete!</h2>
                  <p className="text-slate-600 text-sm mt-2">
                    Your password has been successfully updated. You can now log in with your new credentials.
                  </p>

                  <a
                    href="/?action=login"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-teal-600/20"
                  >
                    Proceed to Login <ArrowRight className="w-4 h-4" />
                  </a>
                  <p className="text-xs text-slate-400 mt-3">Redirecting automatically in 3 seconds...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {userEmail && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      Resetting password for: <strong className="text-slate-800">{userEmail}</strong>
                    </div>
                  )}

                  <label className="flex flex-col gap-1 text-left">
                    <span className="text-xs font-semibold text-slate-700">New Password *</span>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </label>

                  {/* Password requirements checklist */}
                  {newPassword && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-2 gap-2 text-left">
                      <span className={reqs.minLength ? "text-emerald-600 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                        <Check className="w-3 h-3" /> 8+ characters
                      </span>
                      <span className={reqs.hasUppercase ? "text-emerald-600 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                        <Check className="w-3 h-3" /> Uppercase (A-Z)
                      </span>
                      <span className={reqs.hasLowercase ? "text-emerald-600 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                        <Check className="w-3 h-3" /> Lowercase (a-z)
                      </span>
                      <span className={reqs.hasNumber ? "text-emerald-600 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                        <Check className="w-3 h-3" /> Number (0-9)
                      </span>
                      <span className={`col-span-2 ${reqs.hasSpecial ? "text-emerald-600 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}`}>
                        <Check className="w-3 h-3" /> Special character (!@#$%...)
                      </span>
                    </div>
                  )}

                  <label className="flex flex-col gap-1 text-left">
                    <span className="text-xs font-semibold text-slate-700">Confirm New Password *</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </label>

                  {resetError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium text-left">
                      {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !reqs.isAllValid}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl transition shadow-md disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
