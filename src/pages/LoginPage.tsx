import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Common/Button';
import { Input } from '../components/Common/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Common/Card';
import { validateEmail, validatePassword } from '../utils/validators';

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address';
    if (!validatePassword(formData.password)) errors.password = 'Password must be at least 8 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await login(formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-therapy-50 to-calm-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">F2</span>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your Financial Therapist account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={formErrors.email}
              autoComplete="email"
              fullWidth
              required
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              error={formErrors.password}
              autoComplete="current-password"
              fullWidth
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              leftIcon={!isLoading ? <LogIn className="h-4 w-4" /> : undefined}
            >
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
