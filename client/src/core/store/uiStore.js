import { create } from 'zustand';

export const useUiStore = create((set) => ({
  isSidebarOpen: true,
  isCreateWorkspaceOpen: false,

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),

  openCreateWorkspace: () =>
    set({ isCreateWorkspaceOpen: true, isSidebarOpen: false }),
  closeCreateWorkspace: () => set({ isCreateWorkspaceOpen: false }),
}));
