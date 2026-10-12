import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreateEpic } from '../hooks/useProjectQueries.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../shared/components/ui/dialog.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Label } from '../../../shared/components/ui/label.jsx';
import { Textarea } from '../../../shared/components/ui/textarea.jsx';
import { FormError } from '../../auth/components/FormError.jsx';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6',
];

const today = new Date().toISOString().split('T')[0];

const schema = z
  .object({
    title: z.string().trim().min(1, 'Title required').max(150),
    description: z.string().max(1000).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
      .default('#6366f1'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate) return true;
      return data.startDate >= today;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['startDate'],
    },
  )
  .refine(
    (data) => {
      if (!data.endDate) return true;
      const minEnd = data.startDate || today;
      return data.endDate >= minEnd;
    },
    {
      message: 'End date cannot be before start date',
      path: ['endDate'],
    },
  );

export function CreateEpicModal({ workspaceId, projectId, open, onClose }) {
  const { mutate: create, isPending } = useCreateEpic();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      color: '#6366f1',
      startDate: '',
      endDate: '',
    },
  });

  const selectedColor = watch('color');
  const startDateValue = watch('startDate');
  const endDateValue = watch('endDate');

  // End date cannot be before start date or today
  const minEndDate = startDateValue && startDateValue > today ? startDateValue : today;

  function onSubmit(data) {
    const formattedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    };
    create(
      { workspaceId, projectId, data: formattedData },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create epic</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    selectedColor === color
                      ? 'scale-125 ring-2 ring-offset-1 ring-primary'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="epic-title">Title</Label>
            <Input
              id="epic-title"
              placeholder="e.g. User authentication"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            <FormError message={errors.title?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="epic-desc">Description</Label>
            <Textarea
              id="epic-desc"
              rows={2}
              placeholder="What does this epic cover?"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Start date</Label>
              <Input
                id="start"
                type="date"
                min={today}
                {...register('startDate', {
                  onChange: (e) => {
                    const newStart = e.target.value;
                    // If end date is earlier than new start date, reset end date
                    if (endDateValue && newStart && endDateValue < newStart) {
                      setValue('endDate', '');
                    }
                  },
                })}
              />
              <FormError message={errors.startDate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End date</Label>
              <Input
                id="end"
                type="date"
                min={minEndDate}
                {...register('endDate')}
              />
              <FormError message={errors.endDate?.message} />
            </div>
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
                'Create epic'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
