import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, WifiOff, Building2, Plus } from 'lucide-react';
import { useUiStore } from '../../../core/store/uiStore.js';
import { useAuthStore } from '../../../core/store/authStore.js';
import { useLogout } from '../../../features/auth/hooks/useAuthMutations.js';
import { useSocket } from '../../../core/hooks/useSocket.js';
import { Button } from '../ui/button.jsx';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar.jsx';
import { ThemeToggle } from '../ThemeToggle.jsx';
import { Breadcrumbs } from './Breadcrumbs.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.jsx';
import { NotificationPanel } from '../../../features/notifications/components/NotificationPanel.jsx';
import { CommandSearch } from '../../../features/search/components/CommandSearch.jsx';

export function Topbar() {
  const navigate = useNavigate();
  const { toggleSidebar, openCreateWorkspace } = useUiStore();
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const { isConnected } = useSocket();
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="h-14 border-b flex items-center gap-2 sm:gap-3 px-3 sm:px-4 flex-shrink-0 bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden flex-shrink-0"
          onClick={toggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0 overflow-hidden">
          <Breadcrumbs />
        </div>

        {!isConnected && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full flex-shrink-0">
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Reconnecting...</span>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          <ThemeToggle />

          <NotificationPanel />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 flex-shrink-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/workspaces")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Workspaces
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => openCreateWorkspace()}
              >
                <Plus className="mr-2 h-4 w-4" />
                New workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => logout()}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
