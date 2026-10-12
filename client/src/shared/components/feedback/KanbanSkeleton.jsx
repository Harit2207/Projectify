import { Skeleton } from '../ui/skeleton.jsx';

export function KanbanSkeleton() {
  return (
    <div className="flex gap-3 p-4 overflow-x-auto h-full">
      {[1, 2, 3, 4, 5].map((col) => (
        <div key={col} className="w-72 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2 px-1 mb-3">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded" />
          </div>
          <div className="bg-muted/30 rounded-lg p-2 space-y-2 min-h-[200px]">
            {Array.from({
              length: col === 2 ? 4 : col === 3 ? 3 : 2,
            }).map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-lg p-3 space-y-2 border"
              >
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex justify-between items-center pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
