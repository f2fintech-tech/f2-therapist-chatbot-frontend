import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/utils/user";
import { fetchUserProfile, saveUserProfile, type BackendUserProfile } from "@/lib/backendAuth";

interface ProfilePageProps {
  userId: string;
  userProfile: UserProfile;
  email?: string;
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
}

function toFormState(profile: BackendUserProfile | null | undefined, fallbackName: string, fallbackEmail?: string): ProfileFormState {
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
  };
}

export default function ProfilePage({ userId, userProfile, email, onBackToChat, onSaveProfile }: ProfilePageProps) {
  const [formData, setFormData] = useState<ProfileFormState>(() => toFormState(null, userProfile.displayName, email));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile.avatarUrl ?? null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialAvatarUrlRef = useRef<string | null>(userProfile.avatarUrl ?? null);

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
        setFormData(toFormState(profile, userProfile.displayName, email));
        setAvatarUrl(userProfile.avatarUrl ?? null);
        initialAvatarUrlRef.current = userProfile.avatarUrl ?? null;
        setIsSaved(false);
      } catch {
        if (!mounted) return;
        setFormData(toFormState(null, userProfile.displayName, email));
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
    };

    const saved = await saveUserProfile(userId, nextProfile);
    const nextState = toFormState(saved, userProfile.displayName, email);
    setFormData(nextState);
    onSaveProfile({ fullName: saved.name, email: saved.email, avatarUrl });
    setIsSaved(true);
  };

  const handleReset = () => {
    setFormData(toFormState(null, userProfile.displayName, email));
    setAvatarUrl(initialAvatarUrlRef.current);
    setIsSaved(false);
  };

  const saveButtonLabel = isSaved ? "Saved" : "Save profile";
  const saveButtonClassName = isSaved
    ? "rounded-full px-5 bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.22)] hover:bg-emerald-600"
    : "rounded-full px-5 bg-primary text-white shadow-[0_8px_24px_rgba(50,68,230,0.18)]";

  return (
    <main className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      <div className="flex flex-col gap-[10px] border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[16px]">
        <div className="flex items-center justify-between gap-[12px]">
          <div>
            <div className="text-[18px] font-bold text-gray-900 sm:text-[22px]">Profile</div>
            <div className="text-[12px] text-gray-500 sm:text-[13px]">Edit your personal details and keep FinHeal in sync.</div>
          </div>
          <Button variant="outline" size="sm" onClick={onBackToChat} className="rounded-full px-4">
            Back to chat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[16px] sm:p-[20px]">
        <div className="mx-auto grid max-w-[980px] gap-[16px] lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="border-gray-200 shadow-[0_20px_80px_rgba(71,85,105,0.06)]">
            <CardHeader className="items-center text-center">
              <div className="relative">
                <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-[#4a5cf0] text-[28px] font-bold text-white shadow-[0_12px_30px_rgba(50,68,230,0.22)]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={formData.fullName || userProfile.displayName} className="h-full w-full object-cover" />
                  ) : (
                    userProfile.initials
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-[14px] text-gray-600 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition-all hover:bg-gray-50 hover:text-primary" title="Edit profile picture" aria-label="Edit profile picture">
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
              <CardTitle className="text-[18px] text-gray-900">{formData.fullName || userProfile.displayName}</CardTitle>
              <CardDescription>{userProfile.userTier || "Standard"} Member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-[10px] text-left text-[13px] text-gray-600">
              <div className="rounded-[12px] bg-gray-50 p-[12px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Email</div>
                <div className="mt-[4px] break-all text-gray-800">{isLoading ? "Loading..." : formData.email || "Not set"}</div>
              </div>
              <div className="rounded-[12px] bg-gray-50 p-[12px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Location</div>
                <div className="mt-[4px] text-gray-800">{formData.location || "Not set"}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-[0_20px_80px_rgba(71,85,105,0.06)]">
            <CardHeader>
              <CardTitle className="text-[18px] text-gray-900">Your details</CardTitle>
              <CardDescription>Update the information FinHeal uses to personalize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-[14px]">
              <div className="grid gap-[14px] sm:grid-cols-2">
                <div className="space-y-[6px]">
                  <label className="text-[12px] font-semibold text-gray-700">Full name</label>
                  <Input value={formData.fullName} onChange={(event) => handleChange("fullName", event.target.value)} placeholder="Your full name" className="h-11 rounded-[12px]" disabled={isLoading} />
                </div>
                <div className="space-y-[6px]">
                  <label className="text-[12px] font-semibold text-gray-700">Email</label>
                  <Input type="email" value={formData.email} onChange={(event) => handleChange("email", event.target.value)} placeholder="you@example.com" className="h-11 rounded-[12px]" disabled={isLoading} />
                </div>
                <div className="space-y-[6px]">
                  <label className="text-[12px] font-semibold text-gray-700">Phone</label>
                  <Input value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="Phone number" className="h-11 rounded-[12px]" disabled={isLoading} />
                </div>
                <div className="space-y-[6px]">
                  <label className="text-[12px] font-semibold text-gray-700">Location</label>
                  <Input value={formData.location} onChange={(event) => handleChange("location", event.target.value)} placeholder="City, country" className="h-11 rounded-[12px]" disabled={isLoading} />
                </div>
                <div className="space-y-[6px] sm:col-span-2">
                  <label className="text-[12px] font-semibold text-gray-700">Occupation</label>
                  <Input value={formData.occupation} onChange={(event) => handleChange("occupation", event.target.value)} placeholder="Job title or role" className="h-11 rounded-[12px]" disabled={isLoading} />
                </div>
              </div>

              <div className="space-y-[6px]">
                <label className="text-[12px] font-semibold text-gray-700">About you</label>
                <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700">Date of birth</label>
                    <input 
                      type="date" 
                      value={formData.dateOfBirth} 
                      onChange={(event) => handleChange("dateOfBirth", event.target.value)} 
                      className="mt-[6px] w-full h-[40px] px-[12px] border border-input rounded-md text-[13px] bg-white outline-none" 
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700">Gender <span className="text-gray-400 font-normal">(optional)</span></label>
                    <select 
                      value={formData.gender} 
                      onChange={(event) => handleChange("gender", event.target.value)} 
                      className="mt-[6px] w-full h-[40px] px-[12px] border border-input rounded-md text-[13px] bg-white outline-none"
                      disabled={isLoading}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700">Marital status <span className="text-gray-400 font-normal">(optional)</span></label>
                    <select 
                      value={formData.maritalStatus} 
                      onChange={(event) => handleChange("maritalStatus", event.target.value)} 
                      className="mt-[6px] w-full h-[40px] px-[12px] border border-input rounded-md text-[13px] bg-white outline-none"
                      disabled={isLoading}
                    >
                      <option value="">Select status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                </div>
                <Textarea
                  value={formData.bio}
                  onChange={(event) => handleChange("bio", event.target.value)}
                  placeholder="Tell FinHeal a little about your goals, habits, or preferences."
                  className="min-h-[140px] rounded-[12px]"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col-reverse gap-[10px] sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleReset} className="rounded-full px-5" disabled={isLoading}>
                  Reset
                </Button>
                <Button onClick={() => void handleSave()} className={saveButtonClassName} disabled={isLoading}>
                  {isLoading ? "Loading..." : saveButtonLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
