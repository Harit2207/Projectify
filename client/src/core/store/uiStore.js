import { create } from 'zustand';

export const useUiStore = create((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  modalProps: {},

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  openModal: (modalId, props = {}) =>
    set({ activeModal: modalId, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),
}));
