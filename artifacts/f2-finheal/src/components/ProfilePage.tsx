import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/utils/user";
import { fetchUserProfile, saveUserProfile, changeUserPassword, type BackendUserProfile } from "@/lib/backendAuth";
import {
  User, Mail, Phone, MapPin, Briefcase, Calendar,
  Target, AlertTriangle, TrendingUp, Wallet, Sparkles,
  ShieldCheck, Heart, Check, Save, RotateCcw, Lock, ArrowLeft,
  Info, Activity, CircleDot
} from "lucide-react";

interface ProfilePageProps {
  userId: string;
  userProfile: UserProfile;
  email?: string;
  isAdvisor?: boolean;
  onBackToChat: () => void;
  onSaveProfile: (profile: { fullName: string; email?: string | null; avatarUrl?: string | null }) => void;
}

interface ProfileFormState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  occupation: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  bio: string;
  financialGoal: string;
  financialStress: string;
  riskTolerance: string;
  monthlyIncome: string;
  therapyStyle: string;
}

function toFormState(
  profile: BackendUserProfile | null | undefined,
  fallbackName: string,
  fallbackEmail?: string,
  userId?: string
): ProfileFormState {
  let localData: any = {};
  if (userId && typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(`finheal_profile_extra_${userId}`);
      if (stored) localData = JSON.parse(stored);
    } catch { }
  }

  return {
    fullName: profile?.name || fallbackName,
    email: profile?.email || fallbackEmail || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    occupation: profile?.occupation || "",
    dateOfBirth: profile?.dateOfBirth || "",
    gender: profile?.gender || "",
    maritalStatus: profile?.maritalStatus || "",
    bio: profile?.bio || "",
    financialGoal: profile?.financial_goal || localData.financialGoal || "",
    financialStress: profile?.financial_stress || localData.financialStress || "",
    riskTolerance: profile?.risk_tolerance || localData.riskTolerance || "",
    monthlyIncome: profile?.monthly_income || localData.monthlyIncome || "",
    therapyStyle: profile?.therapy_style || localData.therapyStyle || "",
  };
}

function getGoalLabel(val: string): string {
  const map: Record<string, string> = {
    "debt-payoff": "Debt Payoff",
    "saving-emergency": "Saving / Emergency Fund",
    "investing-wealth": "Investing & Wealth Building",
    "budgeting-control": "Budgeting & Expense Control",
    "retirement-planning": "Retirement Planning",
    "buying-home": "Buying a Home",
    "reduce-stress": "Reducing Financial Stress",
  };
  return map[val] || val;
}

function getStressLabel(val: string): string {
  const map: Record<string, string> = {
    low: "Low",
    moderate: "Moderate",
    high: "High",
    severe: "Severe",
  };
  return map[val] || val;
}

function getRiskLabel(val: string): string {
  const map: Record<string, string> = {
    conservative: "Conservative",
    moderate: "Moderate",
    aggressive: "Aggressive",
  };
  return map[val] || val;
}

function getIncomeLabel(val: string): string {
  const map: Record<string, string> = {
    "under-25000": "Under ₹25,000",
    "25000-50000": "₹25,000 - ₹50,000",
    "50000-100000": "₹50,000 - ₹1,00,000",
    "above-100000": "₹1,00,000+",
    "prefer-not-to-say": "Prefer not to say",
  };
  return map[val] || val;
}

function getStyleLabel(val: string): string {
  const map: Record<string, string> = {
    "action-oriented": "Direct & Action-Oriented",
    empathetic: "Empathetic & Listening",
    educational: "Educational & Instructive",
    collaborative: "Collaborative",
  };
  return map[val] || val;
}

export default function ProfilePage({ userId, userProfile, email, isAdvisor = false, onBackToChat, onSaveProfile }: ProfilePageProps) {
  const [formData, setFormData] = useState<ProfileFormState>(() => toFormState(null, userProfile.displayName, email, userId));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile.avatarUrl ?? null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialAvatarUrlRef = useRef<string | null>(userProfile.avatarUrl ?? null);

  // Change Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const isGuest = !email;

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Unable to read image file."));
        }
      };
      reader.onerror = () => reject(new Error("Unable to read image file."));
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await fetchUserProfile(userId);
        if (!mounted) return;
        setFormData(toFormState(profile, userProfile.displayName, email, userId));
        setAvatarUrl(userProfile.avatarUrl ?? null);
        initialAvatarUrlRef.current = userProfile.avatarUrl ?? null;
        setIsSaved(false);
      } catch {
        if (!mounted) return;
        setFormData(toFormState(null, userProfile.displayName, email, userId));
        setAvatarUrl(userProfile.avatarUrl ?? null);
        initialAvatarUrlRef.current = userProfile.avatarUrl ?? null;
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId, userProfile.displayName, email]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setIsSaved(false);
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
      setIsSaved(false);
    } catch {
      // Ignore unreadable files and keep the current avatar.
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    const nextProfile = {
      name: formData.fullName.trim() || userProfile.displayName,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      location: formData.location.trim() || null,
      occupation: formData.occupation.trim() || null,
      dateOfBirth: formData.dateOfBirth.trim() || null,
      gender: formData.gender.trim() || null,
      maritalStatus: formData.maritalStatus.trim() || null,
      bio: formData.bio.trim() || null,
      financial_goal: formData.financialGoal || null,
      financial_stress: formData.financialStress || null,
      risk_tolerance: formData.riskTolerance || null,
      monthly_income: formData.monthlyIncome || null,
      therapy_style: formData.therapyStyle || null,
    };

    if (userId && typeof window !== "undefined") {
      try {
        const extraData = {
          financialGoal: formData.financialGoal,
          financialStress: formData.financialStress,
          riskTolerance: formData.riskTolerance,
          monthlyIncome: formData.monthlyIncome,
          therapyStyle: formData.therapyStyle,
        };
        window.localStorage.setItem(`finheal_profile_extra_${userId}`, JSON.stringify(extraData));
      } catch (err) {
        console.error("Failed to save profile extra data to localStorage", err);
      }
    }

    const saved = await saveUserProfile(userId, nextProfile);
    const nextState = toFormState(saved, userProfile.displayName, email, userId);
    setFormData(nextState);
    onSaveProfile({ fullName: saved.name, email: saved.email, avatarUrl });
    setIsSaved(true);
  };

  const handleReset = () => {
    setFormData(toFormState(null, userProfile.displayName, email, userId));
    setAvatarUrl(initialAvatarUrlRef.current);
    setIsSaved(false);
  };

  const saveButtonLabel = isSaved ? "Saved" : "Save profile";
  const saveButtonClassName = isSaved
    ? "rounded-full px-5 bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.22)] hover:bg-emerald-600"
    : "rounded-full px-5 bg-primary text-white shadow-[0_8px_24px_rgba(50,68,230,0.18)]";

  return (
    <main className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-tr from-slate-50 via-indigo-50/20 to-slate-50 rounded-[20px] shadow-md border border-gray-200 animate-fade-up delay-100">
      {/* Header Banner */}
      <div className="relative flex flex-col gap-[10px] border-b border-gray-150 px-[16px] py-[16px] shrink-0 bg-white rounded-t-[20px] sm:px-[24px] sm:py-[20px] overflow-hidden">
        {/* Colorful top ambient glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

        <div className="flex items-center justify-between gap-[12px] relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-gray-900 sm:text-[24px] tracking-tight flex items-center gap-2">
                User Profile Settings
              </div>
              <div className="text-[12px] text-gray-500 sm:text-[13.5px] font-medium">Configure details and customize your AI wellness companion.</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onBackToChat} className="rounded-full px-4 py-1.5 hover:bg-slate-50 border-gray-250 font-semibold text-[13px] text-gray-700 flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to chat</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[16px] sm:p-[24px]">
        <div className="mx-auto grid max-w-[1020px] gap-[20px] lg:grid-cols-[300px_minmax(0,1fr)]">

          {/* LEFT SUMMARY SIDEBAR CARD */}
          <Card className="border-gray-200/90 shadow-[0_12px_40px_rgba(71,85,105,0.05)] bg-white overflow-hidden flex flex-col h-fit">
            {/* Header mesh gradient banner */}
            <div className="h-[60px] bg-gradient-to-br from-primary/10 via-indigo-100/40 to-teal-50/20 relative flex justify-center items-end">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3344e6_1px,transparent_1px)] [background-size:12px_12px]" />
            </div>

            <CardHeader className="items-center text-center pt-0 pb-4 relative z-10 -mt-[46px]">
              <div className="relative group">
                {/* Gradient ring */}
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary via-indigo-500 to-[#14b8a6] shadow-[0_8px_20px_rgba(99,102,241,0.22)] transition-all duration-300 group-hover:scale-105">
                  <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-white p-0.5">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-[#4a5cf0] text-[28px] font-bold text-white">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={formData.fullName || userProfile.displayName} className="h-full w-full object-cover" />
                      ) : (
                        userProfile.initials
                      )}
                    </div>
                  </div>
                </div>
                <label className="absolute -bottom-1 -right-1 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border border-gray-250 bg-white text-[14px] text-gray-600 shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-all hover:bg-gray-50 hover:text-primary hover:scale-110" title="Edit profile picture" aria-label="Edit profile picture">
                  ✎
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                    className="hidden"
                    onChange={(event) => void handleAvatarChange(event.target.files ? event.target.files[0] : null)}
                  />
                </label>
              </div>
              <CardTitle className="text-[18px] text-gray-900 font-extrabold mt-3 tracking-tight">{formData.fullName || userProfile.displayName}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-[12px] text-left text-[13px] text-gray-600 p-4 border-t border-slate-50 bg-slate-50/20 flex-1">
              <div className="flex items-center gap-3 rounded-[12px] border-l-4 border-l-primary bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {isAdvisor ? <Briefcase className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {isAdvisor ? "F2 Fintech ID" : "Email"}
                  </div>
                  <div className="mt-0.5 break-all text-[12.5px] font-semibold text-gray-800">
                    {isLoading ? "Loading..." : (isAdvisor ? (((formData.email || "").split("@")[0] || "").toUpperCase() || "Not set") : formData.email || "Not set")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[12px] border-l-4 border-l-amber-500 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</div>
                  <div className="mt-0.5 text-[12.5px] font-semibold text-gray-800">{formData.location || "Not set"}</div>
                </div>
              </div>

              {/* PERSONALIZATION BADGES */}
              {formData.financialGoal && (
                <div className="flex items-center gap-3 rounded-[12px] border-l-4 border-l-emerald-500 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md animate-fade-up">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Primary Goal</div>
                    <div className="mt-0.5 text-[12.5px] font-semibold text-gray-800 truncate">{getGoalLabel(formData.financialGoal)}</div>
                  </div>
                </div>
              )}

              {formData.financialStress && (
                <div className="flex items-center gap-3 rounded-[12px] border-l-4 border-l-rose-500 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md animate-fade-up">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stress Level</div>
                    <div className="mt-0.5 text-[12.5px] font-semibold text-gray-800">{getStressLabel(formData.financialStress)}</div>
                  </div>
                </div>
              )}

              {formData.riskTolerance && (
                <div className="flex items-center gap-3 rounded-[12px] border-l-4 border-l-blue-500 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md animate-fade-up">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Risk Profile</div>
                    <div className="mt-0.5 text-[12.5px] font-semibold text-gray-800">{getRiskLabel(formData.riskTolerance)}</div>
                  </div>
                </div>
              )}

              {formData.monthlyIncome && (
                <div className="flex items-center gap-3 rounded-[12px] border-l-4 border-l-teal-500 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md animate-fade-up">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 shrink-0">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Monthly Income</div>
                    <div className="mt-0.5 text-[12.5px] font-semibold text-gray-800">{getIncomeLabel(formData.monthlyIncome)}</div>
                  </div>
                </div>
              )}

              {formData.therapyStyle && (
                <div className="flex items-center gap-3 rounded-[12px] border-l-4 border-l-purple-500 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md animate-fade-up">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Therapy Tone</div>
                    <div className="mt-0.5 text-[12.5px] font-semibold text-gray-800 truncate">{getStyleLabel(formData.therapyStyle)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT FORM CARD */}
          <Card className="border-gray-200/90 shadow-[0_12px_40px_rgba(71,85,105,0.05)] bg-white">
            <CardContent className="p-5 sm:p-7 space-y-6">

              {/* SECTION 1: Personal Identification */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <User className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span className="text-[14.5px] font-extrabold text-gray-900 tracking-tight">Personal Details</span>
                </div>
                <div className="grid gap-[14px] sm:grid-cols-2">
                  <div className="space-y-[6px]">
                    <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Full name</label>
                    <Input value={formData.fullName} onChange={(event) => handleChange("fullName", event.target.value)} placeholder="Your full name" className="h-11 rounded-[12px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all" disabled={isLoading} />
                  </div>
                  {!isAdvisor && (
                    <div className="space-y-[6px]">
                      <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Email Address</label>
                      <Input type="email" value={formData.email} onChange={(event) => handleChange("email", event.target.value)} placeholder="you@example.com" className="h-11 rounded-[12px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all" disabled={isLoading} />
                    </div>
                  )}
                  <div className="space-y-[6px]">
                    <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Phone Number</label>
                    <Input value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="Phone number" className="h-11 rounded-[12px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all" disabled={isLoading} />
                  </div>
                  <div className="space-y-[6px]">
                    <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Location</label>
                    <Input value={formData.location} onChange={(event) => handleChange("location", event.target.value)} placeholder="City, country" className="h-11 rounded-[12px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all" disabled={isLoading} />
                  </div>
                  <div className="space-y-[6px] sm:col-span-2">
                    <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Occupation</label>
                    <Input value={formData.occupation} onChange={(event) => handleChange("occupation", event.target.value)} placeholder="Job title or role" className="h-11 rounded-[12px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all" disabled={isLoading} />
                  </div>
                </div>
              </div>

              {/* SECTION 2: About You / Biography */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Briefcase className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span className="text-[14.5px] font-extrabold text-gray-900 tracking-tight">Biography & Stats</span>
                </div>
                <div className="space-y-[12px]">
                  <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-3">
                    <div>
                      <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Date of birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(event) => handleChange("dateOfBirth", event.target.value)}
                        className="mt-[6px] w-full h-[40px] px-[12px] border border-input rounded-[10px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(event) => handleChange("gender", event.target.value)}
                        className="mt-[6px] w-full h-[40px] px-[12px] border border-input rounded-[10px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                        disabled={isLoading}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Marital status</label>
                      <select
                        value={formData.maritalStatus}
                        onChange={(event) => handleChange("maritalStatus", event.target.value)}
                        className="mt-[6px] w-full h-[40px] px-[12px] border border-input rounded-[10px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                        disabled={isLoading}
                      >
                        <option value="">Select status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-[6px]">
                    <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Personal Bio</label>
                    <Textarea
                      value={formData.bio}
                      onChange={(event) => handleChange("bio", event.target.value)}
                      placeholder="Tell FinHeal a little about your financial habits, emotional goals, or lifestyle."
                      className="min-h-[100px] rounded-[12px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: AI THERAPIST ENGINE PERSONALIZATION */}
              <div className="bg-gradient-to-br from-indigo-50/30 via-[#fcfcff] to-teal-50/15 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-2 border-b border-indigo-50 pb-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 animate-pulse">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[14.5px] font-extrabold text-indigo-950 tracking-tight">AI Personalization Engine</span>
                    <p className="text-[10px] text-gray-450 font-semibold">Fine-tune the cognitive focus and support styles of FinHeal.</p>
                  </div>
                </div>

                <div className="grid gap-[14px] sm:grid-cols-2">
                  <div className="space-y-[4px]">
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                      <span>Primary Financial Goal</span>
                    </label>
                    <select
                      value={formData.financialGoal}
                      onChange={(event) => handleChange("financialGoal", event.target.value)}
                      className="w-full h-[42px] px-[12px] border border-indigo-150 rounded-[12px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-all"
                      disabled={isLoading}
                    >
                      <option value="">Select a goal</option>
                      <option value="debt-payoff">🎯 Debt Payoff</option>
                      <option value="saving-emergency">🛡️ Saving / Emergency Fund</option>
                      <option value="investing-wealth">📈 Investing & Wealth Building</option>
                      <option value="budgeting-control">📊 Budgeting & Expense Control</option>
                      <option value="retirement-planning">👴 Retirement Planning</option>
                      <option value="buying-home">🏡 Buying a Home</option>
                      <option value="reduce-stress">🧘 Reducing Financial Stress / Anxiety</option>
                    </select>
                  </div>

                  <div className="space-y-[4px]">
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Financial Stress Level</label>
                    <select
                      value={formData.financialStress}
                      onChange={(event) => handleChange("financialStress", event.target.value)}
                      className="w-full h-[42px] px-[12px] border border-indigo-150 rounded-[12px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-all"
                      disabled={isLoading}
                    >
                      <option value="">Select stress level</option>
                      <option value="low">🟢 Low (Rarely worry about money)</option>
                      <option value="moderate">🟡 Moderate (Occasional stress/anxiety)</option>
                      <option value="high">🟠 High (Constantly stressing about finances)</option>
                      <option value="severe">🔴 Severe (Overwhelmingly stressed, affecting daily life)</option>
                    </select>
                  </div>

                  <div className="space-y-[4px]">
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Risk Tolerance</label>
                    <select
                      value={formData.riskTolerance}
                      onChange={(event) => handleChange("riskTolerance", event.target.value)}
                      className="w-full h-[42px] px-[12px] border border-indigo-150 rounded-[12px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-all"
                      disabled={isLoading}
                    >
                      <option value="">Select risk tolerance</option>
                      <option value="conservative">🛡️ Conservative (Prefer safety, low risk)</option>
                      <option value="moderate">⚖️ Moderate (Balanced risk & return)</option>
                      <option value="aggressive">🚀 Aggressive (High growth, comfortable with volatility)</option>
                    </select>
                  </div>

                  <div className="space-y-[4px]">
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Monthly Income Range</label>
                    <select
                      value={formData.monthlyIncome}
                      onChange={(event) => handleChange("monthlyIncome", event.target.value)}
                      className="w-full h-[42px] px-[12px] border border-indigo-150 rounded-[12px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-all"
                      disabled={isLoading}
                    >
                      <option value="">Select income range</option>
                      <option value="under-25000">💵 Under ₹25,000</option>
                      <option value="25000-50000">💴 ₹25,000 - ₹50,000</option>
                      <option value="50000-100000">💶 ₹50,000 - ₹1,00,000</option>
                      <option value="above-100000">💷 ₹1,00,000+</option>
                      <option value="prefer-not-to-say">👤 Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-[4px] sm:col-span-2">
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Preferred Therapy / Support Style</label>
                    <select
                      value={formData.therapyStyle}
                      onChange={(event) => handleChange("therapyStyle", event.target.value)}
                      className="w-full h-[42px] px-[12px] border border-indigo-150 rounded-[12px] text-[13px] bg-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-all"
                      disabled={isLoading}
                    >
                      <option value="">Select therapy style</option>
                      <option value="action-oriented">⚡ Direct & Action-Oriented (Concrete tasks, clear logic)</option>
                      <option value="empathetic">🤝 Empathetic & Listening (Validation, emotional support)</option>
                      <option value="educational">📚 Educational & Instructive (Guides, tips, explanations)</option>
                      <option value="collaborative">👥 Collaborative (Exploratory, partner-like brainstorming)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: CHANGE PASSWORD */}
              {!isGuest && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection((prev) => !prev);
                      setPasswordError("");
                      setPasswordSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-[14px] font-extrabold text-gray-900 tracking-tight">Change Password</div>
                        <div className="text-[11px] text-gray-500 font-medium">Update your account security credentials</div>
                      </div>
                    </div>
                    <span className={`text-gray-400 text-[16px] transition-transform duration-200 ${showPasswordSection ? "rotate-180" : ""}`}>▾</span>
                  </button>

                  {showPasswordSection && (
                    <div className="px-5 py-5 space-y-4 border-t border-gray-100 bg-white animate-fade-up">
                      {passwordError && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-[12px] font-semibold px-4 py-2.5 rounded-[10px] animate-fade-up">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{passwordError}</span>
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-semibold px-4 py-2.5 rounded-[10px] animate-fade-up">
                          <ShieldCheck className="h-4 w-4 shrink-0" />
                          <span>{passwordSuccess}</span>
                        </div>
                      )}

                      <div className="space-y-[6px]">
                        <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Current Password</label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                            placeholder="Enter your current password"
                            className="h-11 rounded-[12px] pr-10 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                            disabled={isChangingPassword}
                          />
                          <button type="button" onClick={() => setShowCurrentPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[12px] cursor-pointer">
                            {showCurrentPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-[14px] sm:grid-cols-2">
                        <div className="space-y-[6px]">
                          <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">New Password</label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                              placeholder="Min 6 characters"
                              className="h-11 rounded-[12px] pr-10 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                              disabled={isChangingPassword}
                            />
                            <button type="button" onClick={() => setShowNewPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[12px] cursor-pointer">
                              {showNewPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-[6px]">
                          <label className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">Confirm New Password</label>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                            placeholder="Re-enter new password"
                            className={`h-11 rounded-[12px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all ${confirmPassword && confirmPassword !== newPassword ? "border-red-400 focus-visible:ring-red-200" : ""}`}
                            disabled={isChangingPassword}
                          />
                          {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-[10px] text-red-500 font-semibold mt-1">Passwords do not match</p>
                          )}
                        </div>
                      </div>

                      {/* Password strength indicator */}
                      {newPassword && (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => {
                              const strength = newPassword.length >= 12 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1;
                              const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
                              return (
                                <div
                                  key={level}
                                  className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${level <= strength ? colors[strength] : "bg-gray-200"}`}
                                />
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {newPassword.length < 6 ? "Too short" : newPassword.length < 8 ? "Fair" : newPassword.length < 12 ? "Good" : "Strong"}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={async () => {
                            setPasswordError("");
                            setPasswordSuccess("");

                            if (!currentPassword) { setPasswordError("Please enter your current password."); return; }
                            if (newPassword.length < 6) { setPasswordError("New password must be at least 6 characters."); return; }
                            if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
                            if (currentPassword === newPassword) { setPasswordError("New password must be different from the current password."); return; }

                            setIsChangingPassword(true);
                            try {
                              await changeUserPassword(userId, currentPassword, newPassword);
                              setPasswordSuccess("Password changed successfully!");
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                            } catch (err: any) {
                              const msg = err?.message || "Failed to change password";
                              try {
                                const parsed = JSON.parse(msg);
                                setPasswordError(parsed.detail || msg);
                              } catch {
                                setPasswordError(msg);
                              }
                            } finally {
                              setIsChangingPassword(false);
                            }
                          }}
                          disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                          className="rounded-full px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] flex items-center gap-1.5 shadow-[0_8px_24px_rgba(225,29,72,0.18)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>{isChangingPassword ? "Changing..." : "Update Password"}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SAVE / RESET ACTIONS */}
              <div className="flex flex-col-reverse gap-[10px] sm:flex-row sm:justify-end border-t border-gray-100 pt-4 mt-2">
                <Button variant="outline" onClick={handleReset} className="rounded-full px-5 py-2 hover:bg-slate-50 border-gray-250 font-semibold text-[13px] text-gray-700 flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.01]" disabled={isLoading}>
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
                <Button onClick={() => void handleSave()} className={`${saveButtonClassName} flex items-center gap-1.5 font-bold text-[13px] transition-all duration-300 hover:scale-[1.02]`} disabled={isLoading}>
                  {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  <span>{isLoading ? "Saving..." : saveButtonLabel}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </main>
  );
}
