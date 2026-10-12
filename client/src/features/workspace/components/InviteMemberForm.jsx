import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus } from 'lucide-react';
import { useInviteMember } from '../hooks/useWorkspaceQueries.js';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Input } from '../../../shared/components/ui/input.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select.jsx';
import { FormError } from '../../auth/components/FormError.jsx';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
});

export function InviteMemberForm({ workspaceId }) {
  const { mutate: invite, isPending } = useInviteMember();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'member' },
  });

  function onSubmit(data) {
    invite({ workspaceId, data }, { onSuccess: () => reset() });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex gap-2 items-start"
    >
      <div className="flex-1 space-y-1">
        <Input
          type="email"
          placeholder="colleague@company.com"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        <FormError message={errors.email?.message} />
      </div>

      <Select
        value={watch('role')}
        onValueChange={(v) => setValue('role', v)}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </>
        )}
      </Button>
    </form>
  );
}
