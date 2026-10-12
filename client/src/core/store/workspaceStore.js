import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWorkspaceStore = create(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) =>
        set({ currentWorkspace: workspace }),
      clearWorkspace: () => set({ currentWorkspace: null }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace
          ? {
              id: state.currentWorkspace._id ?? state.currentWorkspace.id,
              _id: state.currentWorkspace._id ?? state.currentWorkspace.id,
              name: state.currentWorkspace.name,
              slug: state.currentWorkspace.slug,
              members: state.currentWorkspace.members ?? [],
            }
          : null,
      }),
    },
  ),
);
