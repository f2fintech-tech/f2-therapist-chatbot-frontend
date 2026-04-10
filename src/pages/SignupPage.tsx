import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Common/Button';
import { Input } from '../components/Common/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Common/Card';
import { validateEmail, validatePassword, validateName } from '../utils/validators';

const SignupPage: React.FC = () => {
  const { signup, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) clearError();
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!validateName(formData.name)) errors.name = 'Name must be at least 2 characters';
    if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address';
    if (!validatePassword(formData.password))
      errors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await signup(formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-therapy-50 to-calm-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">F2</span>
          </div>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Start your financial wellness journey today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Input
              label="Full name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              error={formErrors.name}
              autoComplete="name"
              fullWidth
              required
            />
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
              hint="At least 8 characters"
              autoComplete="new-password"
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
            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              error={formErrors.confirmPassword}
              autoComplete="new-password"
              fullWidth
              required
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              leftIcon={!isLoading ? <UserPlus className="h-4 w-4" /> : undefined}
            >
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
