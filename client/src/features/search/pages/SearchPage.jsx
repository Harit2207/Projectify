import { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { usePaginatedSearch } from '../hooks/useSearch.js';
import { useDebounce } from '../../../shared/hooks/useDebounce.js';
import { Input } from '../../../shared/components/ui/input.jsx';
import { PageShell } from '../../../shared/components/layout/PageShell.jsx';
import { SearchResultCard } from '../components/SearchResultCard.jsx';
import { EmptyState } from '../../../shared/components/feedback/EmptyState.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?.id ?? currentWorkspace?._id;

  // Debounce search query by 300ms: fast response without spamming backend
  const debouncedQuery = useDebounce(query.trim(), 300);

  const { data, isLoading, isFetching } = usePaginatedSearch(
    workspaceId,
    debouncedQuery,
    page,
  );

  const tasks = data?.data ?? [];
  const pagination = data?.pagination;

  function handleQueryChange(e) {
    setQuery(e.target.value);
    setPage(1);
  }

  function handleQuickSuggestion(term) {
    setQuery(term);
    setPage(1);
  }

  return (
    <PageShell title="Search">
      <div className="max-w-2xl space-y-5">
        {/* Search Bar Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search tasks, epics, or descriptions..."
            value={query}
            onChange={handleQueryChange}
            className="pl-10 pr-10 h-11 text-base shadow-sm rounded-lg"
          />
          {isFetching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Empty state when user hasn't typed anything yet */}
        {!debouncedQuery ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Quick Suggestions</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Start typing any keyword, or click a shortcut below to quickly find relevant tasks across your workspace.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['Bug', 'Feature', 'Frontend', 'Backend', 'Design', 'Auth'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickSuggestion(tag)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-background border border-border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                >
                  <Search className="h-3 w-3 text-muted-foreground" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : !tasks.length ? (
          <EmptyState
            title="No results found"
            description={`No tasks matched "${debouncedQuery}" in this workspace.`}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {pagination?.total ?? tasks.length} result
              {(pagination?.total ?? tasks.length) !== 1 ? 's' : ''} for &quot;
              {debouncedQuery}&quot;
            </p>

            <div className="space-y-2">
              {tasks.map((task) => (
                <SearchResultCard
                  key={task._id}
                  task={task}
                  workspaceId={workspaceId}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!pagination.hasPrevPage || isFetching}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage || isFetching}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
