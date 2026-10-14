import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { useProject } from '../../../features/projects/hooks/useProjectQueries.js';

export function Breadcrumbs() {
  const location = useLocation();
  const { workspaceId, projectId } = useParams();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: project } = useProject(workspaceId, projectId);

  const crumbs = buildCrumbs(location.pathname, {
    workspace: currentWorkspace,
    project,
    workspaceId,
    projectId,
  });

  if (crumbs.length === 0) return null;

  const currentCrumb = crumbs[crumbs.length - 1];

  return (
    <nav aria-label="breadcrumb" className="min-w-0 overflow-hidden">
      {/* Mobile view: Show ONLY current active page title to avoid crowding topbar */}
      <div className="flex items-center md:hidden min-w-0">
        <span className="font-semibold text-sm text-foreground truncate max-w-[160px] sm:max-w-[220px]">
          {currentCrumb.label}
        </span>
      </div>

      {/* Desktop view (md+): Show complete hierarchy */}
      <ol className="hidden md:flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href || i} className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              {isLast ? (
                <span className="font-medium text-foreground truncate max-w-[160px] lg:max-w-[220px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px] lg:max-w-[160px]"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function buildCrumbs(
  pathname,
  { workspace, project, workspaceId, projectId },
) {
  const crumbs = [];

  if (pathname.startsWith('/dashboard')) {
    crumbs.push({ label: 'Dashboard', href: '/dashboard' });
  }

  if (pathname.startsWith('/workspaces')) {
    crumbs.push({ label: 'Workspaces', href: '/workspaces' });
  }

  if (workspaceId && workspace) {
    crumbs.push({
      label: workspace.name,
      href: `/workspace/${workspaceId}/projects`,
    });
  }

  if (pathname.includes('/projects') && !projectId) {
    crumbs.push({
      label: 'Projects',
      href: `/workspace/${workspaceId}/projects`,
    });
  }

  if (projectId && project) {
    crumbs.push({
      label: 'Projects',
      href: `/workspace/${workspaceId}/projects`,
    });
    crumbs.push({
      label: `${project.emoji ? project.emoji + ' ' : ''}${project.name}`,
      href: `/workspace/${workspaceId}/board/${projectId}`,
    });
  }

  if (pathname.includes('/members')) {
    crumbs.push({
      label: 'Members',
      href: `/workspace/${workspaceId}/members`,
    });
  }

  if (pathname.includes('/settings')) {
    crumbs.push({
      label: 'Settings',
      href: `/workspace/${workspaceId}/settings`,
    });
  }

  if (pathname.includes('/search')) {
    crumbs.push({
      label: 'Search',
      href: `/workspace/${workspaceId}/search`,
    });
  }

  return crumbs;
}
