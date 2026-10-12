import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckSquare } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../../../shared/components/ui/command.jsx';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { useProjects } from '../../projects/hooks/useProjectQueries.js';
import { useDebounce } from '../../../shared/hooks/useDebounce.js';
import { useSearchTasks } from '../hooks/useSearch.js';

export function CommandSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?.id ?? currentWorkspace?._id;

  const debouncedQuery = useDebounce(query, 300);
  const { data: projects } = useProjects(workspaceId);
  const { data: tasks } = useSearchTasks(workspaceId, debouncedQuery);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  function handleSelect(href) {
    navigate(href);
    onClose();
    setQuery('');
  }

  const filteredProjects = projects?.filter((p) =>
    p.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
  ) ?? [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <CommandInput
        placeholder="Search projects, tasks..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {debouncedQuery
            ? 'No results found.'
            : 'Start typing to search...'}
        </CommandEmpty>

        {!debouncedQuery && (
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleSelect('/dashboard')}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Dashboard
            </CommandItem>
            {workspaceId && (
              <CommandItem
                onSelect={() =>
                  handleSelect(`/workspace/${workspaceId}/projects`)
                }
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Go to Projects
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {filteredProjects.length > 0 && (
          <>
            {!debouncedQuery && <CommandSeparator />}
            <CommandGroup heading="Projects">
              {filteredProjects.slice(0, 5).map((project) => (
                <CommandItem
                  key={project._id}
                  onSelect={() =>
                    handleSelect(
                      `/workspace/${workspaceId}/board/${project._id}`,
                    )
                  }
                >
                  <span className="mr-2 text-base">{project.emoji}</span>
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tasks?.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.slice(0, 8).map((task) => {
                const projectId =
                  task.projectId?._id ?? task.projectId;
                return (
                  <CommandItem
                    key={task._id}
                    onSelect={() =>
                      handleSelect(
                        `/workspace/${workspaceId}/board/${projectId}?task=${task._id}`,
                      )
                    }
                  >
                    <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{task.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
