import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import { useWorkspaces } from '../hooks/useWorkspaceQueries.js';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../shared/components/ui/popover.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Separator } from '../../../shared/components/ui/separator.jsx';
import { CreateWorkspaceModal } from './CreateWorkspaceModal.jsx';

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data: workspaces } = useWorkspaces();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  function handleSelect(workspace) {
    setCurrentWorkspace(workspace);
    setOpen(false);
    navigate(`/workspace/${workspace._id}/projects`);
  }

  const currentId =
    currentWorkspace?.id ?? currentWorkspace?._id;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between px-2 font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="h-5 w-5 rounded bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {currentWorkspace?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="truncate text-sm">
                {currentWorkspace?.name ?? 'Select workspace'}
              </span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-56 p-1" align="start">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Workspaces
          </p>

          {workspaces?.map((ws) => (
            <button
              key={ws._id}
              onClick={() => handleSelect(ws)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
            >
              <span className="h-5 w-5 rounded bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {ws.name[0].toUpperCase()}
              </span>
              <span className="flex-1 truncate">{ws.name}</span>
              {currentId === ws._id && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          ))}

          <Separator className="my-1" />

          <button
            onClick={() => {
              setOpen(false);
              setShowCreate(true);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            Create workspace
          </button>
        </PopoverContent>
      </Popover>

      <CreateWorkspaceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}
