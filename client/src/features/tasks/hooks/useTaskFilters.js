import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    status: searchParams.get('status') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
    assignee: searchParams.get('assignee') ?? undefined,
    epicId: searchParams.get('epicId') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined),
  );

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const hasFilters = Object.keys(activeFilters).length > 0;

  return { filters: activeFilters, setFilter, clearFilters, hasFilters };
}
