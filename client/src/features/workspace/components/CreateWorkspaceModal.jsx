import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateWorkspace } from '../hooks/useWorkspaceQueries.js';
import { useUiStore } from '../../../core/store/uiStore.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../shared/components/ui/dialog.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Label } from '../../../shared/components/ui/label.jsx';
import { Textarea } from '../../../shared/components/ui/textarea.jsx';
import { FormError } from '../../auth/components/FormError.jsx';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50),
  description: z.string().max(200).optional(),
});

export function CreateWorkspaceModal({ open, onClose }) {
  const navigate = useNavigate();
  const { closeSidebar } = useUiStore();
  const { mutate: create, isPending } = useCreateWorkspace();
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
    }
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  function onSubmit(data) {
    create(data, {
      onSuccess: (newWorkspace) => {
        reset();
        onClose();
        closeSidebar();
        const wsId = newWorkspace?._id || newWorkspace?.id;
        if (wsId) {
          navigate(`/workspace/${wsId}/projects`);
        }
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          if (Date.now() - openedAtRef.current < 350) return;
          reset();
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (Date.now() - openedAtRef.current < 350) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (Date.now() - openedAtRef.current < 350) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            A workspace is a shared space for your team&apos;s projects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input
              id="ws-name"
              placeholder="Acme Engineering"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ws-desc">
              Description{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="ws-desc"
              placeholder="What does this workspace contain?"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create workspace'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
