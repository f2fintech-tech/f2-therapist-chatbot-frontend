import { useEffect, useState } from "react";
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
  onSaveProfile: (profile: { fullName: string; email?: string | null }) => void;
}

interface ProfileFormState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  occupation: string;
  bio: string;
}

function toFormState(profile: BackendUserProfile | null | undefined, fallbackName: string, fallbackEmail?: string): ProfileFormState {
  return {
    fullName: profile?.name || fallbackName,
    email: profile?.email || fallbackEmail || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    occupation: profile?.occupation || "",
    bio: profile?.bio || "",
  };
}

export default function ProfilePage({ userId, userProfile, email, onBackToChat, onSaveProfile }: ProfilePageProps) {
  const [formData, setFormData] = useState<ProfileFormState>(() => toFormState(null, userProfile.displayName, email));
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await fetchUserProfile(userId);
        if (!mounted) return;
        setFormData(toFormState(profile, userProfile.displayName, email));
        setIsSaved(false);
      } catch {
        if (!mounted) return;
        setFormData(toFormState(null, userProfile.displayName, email));
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

  const handleSave = async () => {
    const nextProfile = {
      name: formData.fullName.trim() || userProfile.displayName,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      location: formData.location.trim() || null,
      occupation: formData.occupation.trim() || null,
      bio: formData.bio.trim() || null,
    };

    const saved = await saveUserProfile(userId, nextProfile);
    const nextState = toFormState(saved, userProfile.displayName, email);
    setFormData(nextState);
    onSaveProfile({ fullName: saved.name, email: saved.email });
    setIsSaved(true);
  };

  const handleReset = () => {
    setFormData(toFormState(null, userProfile.displayName, email));
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
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#4a5cf0] text-[24px] font-bold text-white shadow-[0_12px_30px_rgba(50,68,230,0.22)]">
                {userProfile.initials}
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