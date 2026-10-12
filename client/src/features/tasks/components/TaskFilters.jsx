import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useWorkspace } from '../../workspace/hooks/useWorkspaceQueries.js';
import { useDebounce } from '../../../shared/hooks/useDebounce.js';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select.jsx';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../shared/components/ui/avatar.jsx';
import { PRIORITIES } from '../constants/taskConstants.js';

export function TaskFilters({
  workspaceId,
  filters,
  onChange,
  onClear,
  hasFilters,
}) {
  const { data: workspace } = useWorkspace(workspaceId);
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  // Debounce search query by 300ms so typing doesn't re-render/refetch Kanban on every keystroke
  const debouncedSearch = useDebounce(searchInput.trim(), 300);

  // Sync debounced search to parent filter
  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? '')) {
      onChange('search', debouncedSearch || undefined);
    }
  }, [debouncedSearch, onChange, filters.search]);

  // Sync external clear
  useEffect(() => {
    if (!filters.search && searchInput) {
      setSearchInput('');
    }
  }, [filters.search]);

  function handleClearAll() {
    setSearchInput('');
    onClear();
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Debounced Task Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter tasks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-7 text-xs w-44 pl-7 pr-6"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Priority Filter */}
      <Select
        value={filters.priority ?? 'all'}
        onValueChange={(v) =>
          onChange('priority', v === 'all' ? undefined : v)
        }
      >
        <SelectTrigger className="h-7 text-xs w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p} className="text-xs capitalize">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignee Filter */}
      <Select
        value={filters.assignee ?? 'all'}
        onValueChange={(v) =>
          onChange('assignee', v === 'all' ? undefined : v)
        }
      >
        <SelectTrigger className="h-7 text-xs w-36">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {workspace?.members?.map((m) => {
            const u = m.userId;
            const uId = u?._id ?? u?.id ?? u;
            return (
              <SelectItem
                key={uId}
                value={String(uId)}
                className="text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={u?.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {u?.name?.[0] ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  {u?.name}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={handleClearAll}
        >
          <X className="h-3 w-3 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
