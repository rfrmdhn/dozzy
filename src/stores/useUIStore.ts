import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isSidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    toggleSidebar: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;

    // Modal states
    isCreateProjectModalOpen: boolean;
    openCreateProjectModal: () => void;
    closeCreateProjectModal: () => void;

    isCreateTaskModalOpen: boolean;
    openCreateTaskModal: () => void;
    closeCreateTaskModal: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            theme: 'system',
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setTheme: (theme) => set({ theme }),

            isCreateProjectModalOpen: false,
            openCreateProjectModal: () => set({ isCreateProjectModalOpen: true }),
            closeCreateProjectModal: () => set({ isCreateProjectModalOpen: false }),

            isCreateTaskModalOpen: false,
            openCreateTaskModal: () => set({ isCreateTaskModalOpen: true }),
            closeCreateTaskModal: () => set({ isCreateTaskModalOpen: false }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({
                isSidebarOpen: state.isSidebarOpen,
                theme: state.theme
            }),
        }
    )
);
