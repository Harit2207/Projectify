import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { useUiStore } from '../../../core/store/uiStore.js';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { useProjects } from '../../../features/projects/hooks/useProjectQueries.js';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { WorkspaceSwitcher } from '../../../features/workspace/components/WorkspaceSwitcher.jsx';
import { Button } from '../ui/button.jsx';
import { Skeleton } from '../ui/skeleton.jsx';
import { cn } from '../../utils/cn.js';

export function Sidebar({ isMobile }) {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { hasMinRole } = usePermission();
  const location = useLocation();

  const workspaceId =
    currentWorkspace?.id ?? currentWorkspace?._id;

  const { data: projects, isLoading: loadingProjects } =
    useProjects(workspaceId);

  // Close mobile sidebar ONLY on route navigation
  useEffect(() => {
    if (isMobile) {
      useUiStore.getState().closeSidebar();
    }
  }, [location.pathname, isMobile]);

  function isActive(href) {
    if (href === location.pathname) return true;
    return location.pathname.startsWith(href) && href !== '/dashboard';
  }

  const topNavItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Workspaces',
      icon: Building2,
      href: '/workspaces',
    },
    {
      label: 'Search',
      icon: Search,
      href: workspaceId
        ? `/workspace/${workspaceId}/search`
        : '/dashboard',
    },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col bg-background border-r transition-all duration-200 z-30',
        'h-screen flex-shrink-0',
        isMobile ? 'fixed inset-y-0 left-0' : 'relative',
        isSidebarOpen ? (isMobile ? 'w-64' : 'w-60') : 'w-14',
        isMobile && !isSidebarOpen && '-translate-x-full',
        isMobile && isSidebarOpen && 'translate-x-0 shadow-xl',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between h-14 px-3 border-b flex-shrink-0">
        {isSidebarOpen && (
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-semibold text-sm"
          >
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <FolderKanban className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span>Projectify</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Workspace switcher */}
      {isSidebarOpen && (
        <div className="px-2 py-2 border-b">
          <WorkspaceSwitcher />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {topNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Projects section */}
        {isSidebarOpen && workspaceId && (
          <div className="pt-3">
            <div className="flex items-center justify-between px-2.5 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projects
              </span>
              <Link to={`/workspace/${workspaceId}/projects`}>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {loadingProjects ? (
              <div className="space-y-1 px-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-7 w-full rounded-md" />
                ))}
              </div>
            ) : !projects?.length ? (
              <p className="text-xs text-muted-foreground px-2.5 py-1">
                No projects yet
              </p>
            ) : (
              <>
                {projects.slice(0, 8).map((project) => {
                  const href = `/workspace/${workspaceId}/board/${project._id}`;
                  const active = isActive(href);
                  return (
                    <Link
                      key={project._id}
                      to={href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        active
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground',
                      )}
                    >
                      <span className="text-base leading-none flex-shrink-0">
                        {project.emoji}
                      </span>
                      <span className="truncate text-xs">
                        {project.name}
                      </span>
                    </Link>
                  );
                })}
                {projects.length > 8 && (
                  <Link
                    to={`/workspace/${workspaceId}/projects`}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all projects
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {/* Workspace management */}
        {isSidebarOpen && workspaceId && (
          <div className="pt-3">
            <div className="px-2.5 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Workspace
              </span>
            </div>

            {[
              {
                label: 'Members',
                icon: Users,
                href: `/workspace/${workspaceId}/members`,
                visible: true,
              },
              {
                label: 'Settings',
                icon: Settings,
                href: `/workspace/${workspaceId}/settings`,
                visible: hasMinRole('admin'),
              },
            ]
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      active
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </div>
        )}
      </nav>
    </aside>
  );
}
