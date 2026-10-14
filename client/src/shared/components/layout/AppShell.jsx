import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useUiStore } from '../../../core/store/uiStore.js';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { useWorkspaceSocket } from '../../../core/hooks/useWorkspaceSocket.js';
import { useWorkspaces } from '../../../features/workspace/hooks/useWorkspaceQueries.js';

export function AppShell() {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useUiStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { data: workspaces } = useWorkspaces();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!currentWorkspace && workspaces?.length > 0) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [currentWorkspace, workspaces, setCurrentWorkspace]);

  useWorkspaceSocket(currentWorkspace?.id ?? currentWorkspace?._id);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        closeSidebar();
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [closeSidebar]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isMobile={isMobile} />

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 transition-opacity"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
