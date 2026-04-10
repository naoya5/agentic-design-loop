import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type View = 'kanban' | 'gantt' | 'dashboard' | 'members' | 'activity';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  currentView: View;
  searchQuery: string;
  searchOpen: boolean;
  aiPanelOpen: boolean;
  taskDetailOpen: boolean;
  filterPriority: string | null;
  filterAssignee: string | null;
  filterStatus: string | null;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setView: (view: View) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  setAIPanelOpen: (open: boolean) => void;
  setTaskDetailOpen: (open: boolean) => void;
  setFilterPriority: (p: string | null) => void;
  setFilterAssignee: (a: string | null) => void;
  setFilterStatus: (s: string | null) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      darkMode: false,
      currentView: 'kanban',
      searchQuery: '',
      searchOpen: false,
      aiPanelOpen: false,
      taskDetailOpen: false,
      filterPriority: null,
      filterAssignee: null,
      filterStatus: null,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setView: (view) => set({ currentView: view }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setAIPanelOpen: (open) => set({ aiPanelOpen: open }),
      setTaskDetailOpen: (open) => set({ taskDetailOpen: open }),
      setFilterPriority: (p) => set({ filterPriority: p }),
      setFilterAssignee: (a) => set({ filterAssignee: a }),
      setFilterStatus: (s) => set({ filterStatus: s }),
      clearFilters: () => set({ filterPriority: null, filterAssignee: null, filterStatus: null }),
    }),
    {
      name: 'taskflow-ui',
      partialize: (state) => ({ darkMode: state.darkMode, sidebarOpen: state.sidebarOpen }),
    }
  )
);
