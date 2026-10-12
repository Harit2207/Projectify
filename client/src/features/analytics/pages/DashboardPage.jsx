import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { useWorkspaceStats } from '../hooks/useAnalyticsQueries.js';
import { PageShell } from '../../../shared/components/layout/PageShell.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { CompletionTrendChart } from '../components/CompletionTrendChart.jsx';
import { TaskStatusChart } from '../components/TaskStatusChart.jsx';
import { TaskPriorityChart } from '../components/TaskPriorityChart.jsx';
import { DashboardSkeleton } from '../components/DashboardSkeleton.jsx';
import { EmptyState } from '../../../shared/components/feedback/EmptyState.jsx';
import {
  CheckSquare,
  FolderKanban,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?.id ?? currentWorkspace?._id;

  const { data: stats, isLoading } = useWorkspaceStats(workspaceId);

  if (!workspaceId) {
    return (
      <PageShell title="Dashboard">
        <EmptyState
          title="No workspace selected"
          description="Select or create a workspace to see your dashboard"
        />
      </PageShell>
    );
  }

  if (isLoading) return <DashboardSkeleton />;

  return (
    <PageShell
      title="Dashboard"
      description={`Overview for ${currentWorkspace?.name}`}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total tasks"
          value={stats?.totals.tasks ?? 0}
          icon={CheckSquare}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          label="Projects"
          value={stats?.totals.projects ?? 0}
          icon={FolderKanban}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />
        <StatCard
          label="Overdue"
          value={stats?.totals.overdue ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          highlight={(stats?.totals.overdue ?? 0) > 0}
        />
        <StatCard
          label="Done this week"
          value={stats?.totals.completedThisWeek ?? 0}
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBg="bg-green-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <CompletionTrendChart data={stats?.completionTrend ?? []} />
        </div>
        <div>
          <TaskStatusChart data={stats?.tasksByStatus ?? {}} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TaskPriorityChart data={stats?.tasksByPriority ?? {}} />
      </div>
    </PageShell>
  );
}
