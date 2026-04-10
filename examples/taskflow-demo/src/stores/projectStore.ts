import { create } from 'zustand';
import { api } from '../api';
import type { Project } from '../types';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => void;
  currentProject: () => Project | undefined;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await api.getProjects();
      set({ projects, loading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch projects';
      set({ error: message, loading: false });
    }
  },

  createProject: async (data) => {
    try {
      const project = await api.createProject(data as Parameters<typeof api.createProject>[0]);
      set((s) => ({ projects: [...s.projects, project], error: null }));
      return project;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create project';
      set({ error: message });
      throw e;
    }
  },

  updateProject: async (id, data) => {
    try {
      const updated = await api.updateProject(id, data);
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        error: null,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update project';
      set({ error: message });
      throw e;
    }
  },

  deleteProject: async (id) => {
    try {
      await api.deleteProject(id);
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
        error: null,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete project';
      set({ error: message });
      throw e;
    }
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },

  clearError: () => set({ error: null }),
}));
