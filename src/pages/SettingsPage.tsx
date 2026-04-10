import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Layout/Navbar';
import { Button } from '../components/Common/Button';
import { Input } from '../components/Common/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Common/Card';
import { Avatar } from '../components/Common/Avatar';
import { Loader } from '../components/Common/Loader';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../hooks/useTheme';
import { Save, Upload } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { profile, isLoading, isUpdating, fetchProfile, updateProfile, updatePreferences, uploadAvatar } =
    useUserStore();
  const { theme, setTheme } = useTheme();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [profile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error handled in store
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (profile) {
      await updatePreferences({
        preferences: { theme: newTheme },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader size="lg" label="Loading settings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>

          {saveSuccess && (
            <div className="rounded-md bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              Settings saved successfully!
            </div>
          )}

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Avatar upload */}
              <div className="mb-6 flex items-center gap-4">
                <Avatar size="xl" src={profile?.avatarUrl} name={profile?.name} />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUpdating}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="h-4 w-4" />}
                    disabled={isUpdating}
                    type="button"
                  >
                    Change photo
                  </Button>
                </label>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Full name"
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                  fullWidth
                />
                <Input
                  label="Bio"
                  type="text"
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us a bit about yourself"
                  fullWidth
                />
                <Input
                  label="Phone number"
                  type="tel"
                  name="phoneNumber"
                  value={profileForm.phoneNumber}
                  onChange={handleProfileChange}
                  placeholder="+1 (555) 000-0000"
                  fullWidth
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isUpdating}
                    leftIcon={!isUpdating ? <Save className="h-4 w-4" /> : undefined}
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Appearance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Theme</p>
                <div className="flex gap-3">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        theme === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Email address</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Member since</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div className="pt-2">
                <Button variant="destructive" size="sm">
                  Delete account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
