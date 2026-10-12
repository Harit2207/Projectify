import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { forgotPasswordSchema } from '../schemas/authSchemas.js';
import { useForgotPassword } from '../hooks/useAuthMutations.js';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Label } from '../../../shared/components/ui/label.jsx';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { FormError } from '../components/FormError.jsx';

export default function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending, isSuccess } =
    useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  if (isSuccess) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent a password reset link"
      >
        <p className="text-sm text-muted-foreground text-center">
          If an account exists for that email, you&apos;ll receive a reset
          link shortly.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email to receive a reset link"
    >
      <form
        onSubmit={handleSubmit((data) => forgotPassword(data))}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          <FormError message={errors.email?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      <Link to="/login">
        <Button variant="ghost" className="w-full mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>
      </Link>
    </AuthLayout>
  );
}
