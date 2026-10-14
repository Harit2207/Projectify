import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginSchema } from '../schemas/authSchemas.js';
import { useLogin } from '../hooks/useAuthMutations.js';
import { useAuthStore } from '../../../core/store/authStore.js';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Label } from '../../../shared/components/ui/label.jsx';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { GoogleButton } from '../components/GoogleButton.jsx';
import { FormError } from '../components/FormError.jsx';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const errorParam = searchParams.get('error');

  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error: loginError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const urlErrorMessage =
    errorParam === 'google_failed'
      ? 'Google sign-in was cancelled or failed. Please try again or use your email and password.'
      : errorParam === 'session_expired'
      ? 'Your session has expired. Please sign in again.'
      : null;

  const serverErrorMessage = loginError?.response?.data?.message;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      {urlErrorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{urlErrorMessage}</span>
        </div>
      )}

      {serverErrorMessage && !urlErrorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{serverErrorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          <FormError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FormError message={errors.password?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-muted-foreground mt-4">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="text-primary font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
