import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTask } from '../hooks/useTaskQueries.js';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';

export function CreateTaskInline({ workspaceId, projectId, status, onDone }) {
  const inputRef = useRef(null);
  const { mutate: create, isPending } = useCreateTask(
    workspaceId,
    projectId,
  );

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function onSubmit({ title }) {
    if (!title?.trim()) {
      onDone();
      return;
    }
    create(
      { workspaceId, projectId, data: { title: title.trim(), status } },
      {
        onSuccess: () => {
          reset();
          onDone();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-background border rounded-lg p-2 space-y-2"
    >
      <Input
        {...register('title')}
        ref={(e) => {
          register('title').ref(e);
          inputRef.current = e;
        }}
        placeholder="Task title..."
        className="h-8 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onDone();
        }}
      />
      <div className="flex gap-1.5">
        <Button
          type="submit"
          size="sm"
          className="h-7 text-xs"
          disabled={isPending}
        >
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onDone}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
