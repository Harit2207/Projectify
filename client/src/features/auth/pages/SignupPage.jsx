import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signupSchema } from '../schemas/authSchemas.js';
import { useSignup } from '../hooks/useAuthMutations.js';
import { useAuthStore } from '../../../core/store/authStore.js';
import { useDebouncedCallback } from '../../../shared/hooks/useDebounce.js';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Label } from '../../../shared/components/ui/label.jsx';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { GoogleButton } from '../components/GoogleButton.jsx';
import { FormError } from '../components/FormError.jsx';

export default function SignupPage() {
  const { isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: signup, isPending, error: signupError } = useSignup();

  const {
    register,
    handleSubmit,
    trigger,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Debounced validator: 600ms pause ke baad hi confirm password validate hoga
  const debouncedValidateConfirm = useDebouncedCallback(() => {
    trigger('confirmPassword');
  }, 600);

  function onSubmit({ confirmPassword: _confirm, ...data }) {
    signup(data);
  }

  const serverErrorMessage = signupError?.response?.data?.message;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing projects with your team"
    >
      {serverErrorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{serverErrorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Sarah Connor"
            autoComplete="name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          <FormError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          <FormError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pr-10"
              {...register('password', {
                onChange: () => {
                  if (watch('confirmPassword')) {
                    debouncedValidateConfirm();
                  }
                },
              })}
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pr-10"
              {...register('confirmPassword', {
                onChange: () => {
                  clearErrors('confirmPassword');
                  debouncedValidateConfirm();
                },
              })}
              aria-invalid={!!errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FormError message={errors.confirmPassword?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
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
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
