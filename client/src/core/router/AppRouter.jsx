import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './guards/ProtectedRoute.jsx';
import { RoleGuard } from './guards/RoleGuard.jsx';
import { AppShell } from '../../shared/components/layout/AppShell.jsx';

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('../../features/auth/pages/SignupPage.jsx'));
const ResetPasswordPage = lazy(() =>
  import('../../features/auth/pages/ResetPasswordPage.jsx'),
);
const ForgotPasswordPage = lazy(() =>
  import('../../features/auth/pages/ForgotPasswordPage.jsx'),
);
const DashboardPage = lazy(() =>
  import('../../features/analytics/pages/DashboardPage.jsx'),
);
const WorkspacesPage = lazy(() =>
  import('../../features/workspace/pages/WorkspacesPage.jsx'),
);
const WorkspaceMembersPage = lazy(() =>
  import('../../features/workspace/pages/WorkspaceMembersPage.jsx'),
);
const WorkspaceSettingsPage = lazy(() =>
  import('../../features/workspace/pages/WorkspaceSettingsPage.jsx'),
);
const ProjectsPage = lazy(() =>
  import('../../features/projects/pages/ProjectsPage.jsx'),
);
const KanbanPage = lazy(() =>
  import('../../features/tasks/pages/KanbanPage.jsx'),
);
const SearchPage = lazy(() =>
  import('../../features/search/pages/SearchPage.jsx'),
);

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route
                path="/workspace/:workspaceId/projects"
                element={<ProjectsPage />}
              />
              <Route
                path="/workspace/:workspaceId/board/:projectId"
                element={<KanbanPage />}
              />
              <Route
                path="/workspace/:workspaceId/search"
                element={<SearchPage />}
              />
              <Route
                element={<RoleGuard allowedRoles={['owner', 'admin', 'member']} />}
              >
                <Route
                  path="/workspace/:workspaceId/members"
                  element={<WorkspaceMembersPage />}
                />
              </Route>
              <Route
                element={<RoleGuard allowedRoles={['owner', 'admin']} />}
              >
                <Route
                  path="/workspace/:workspaceId/settings"
                  element={<WorkspaceSettingsPage />}
                />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-right" richColors closeButton />
    </BrowserRouter>
  );
}
