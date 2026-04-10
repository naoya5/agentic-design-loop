import { create } from 'zustand';
import { api } from '../api';
import type { Task, TaskDependency, TaskStatus } from '../types';

interface TaskState {
  tasks: Task[];
  dependencies: TaskDependency[];
  loading: boolean;
  error: string | null;
  selectedTaskId: string | null;
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus, sortOrder: number) => Promise<void>;
  fetchDependencies: (taskId: string) => Promise<void>;
  addDependency: (taskId: string, toTaskId: string, type: string) => Promise<void>;
  removeDependency: (taskId: string, depId: string) => Promise<void>;
  setSelectedTask: (id: string | null) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
  selectedTask: () => Task | undefined;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  dependencies: [],
  loading: false,
  error: null,
  selectedTaskId: null,

  fetchTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const tasks = await api.getTasks(projectId);
      set({ tasks, loading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch tasks';
      set({ error: message, loading: false });
    }
  },

  createTask: async (data) => {
    try {
      const task = await api.createTask(data as Parameters<typeof api.createTask>[0]);
      set((s) => ({ tasks: [...s.tasks, task], error: null }));
      return task;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create task';
      set({ error: message });
      throw e;
    }
  },

  updateTask: async (id, data) => {
    try {
      const updated = await api.updateTask(id, data);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        error: null,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update task';
      set({ error: message });
      throw e;
    }
  },

  deleteTask: async (id) => {
    try {
      await api.deleteTask(id);
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
        selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
        error: null,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete task';
      set({ error: message });
      throw e;
    }
  },

  moveTask: async (id, status, sortOrder) => {
    try {
      const updated = await api.moveTask(id, { status, sort_order: sortOrder });
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        error: null,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to move task';
      set({ error: message });
      throw e;
    }
  },

  fetchDependencies: async (taskId) => {
    try {
      const deps = await api.getTaskDependencies(taskId);
      set({ dependencies: deps });
    } catch (e: unknown) {
      console.error('Failed to fetch dependencies:', e);
    }
  },

  addDependency: async (taskId, toTaskId, type) => {
    try {
      const dep = await api.addTaskDependency(taskId, { to_task_id: toTaskId, type });
      set((s) => ({ dependencies: [...s.dependencies, dep] }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add dependency';
      set({ error: message });
      throw e;
    }
  },

  removeDependency: async (taskId, depId) => {
    try {
      await api.removeTaskDependency(taskId, depId);
      set((s) => ({ dependencies: s.dependencies.filter((d) => d.id !== depId) }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to remove dependency';
      set({ error: message });
      throw e;
    }
  },

  setSelectedTask: (id) => set({ selectedTaskId: id }),

  getTasksByStatus: (status) => {
    return get().tasks.filter((t) => t.status === status).sort((a, b) => a.sort_order - b.sort_order);
  },

  selectedTask: () => {
    const { tasks, selectedTaskId } = get();
    return tasks.find((t) => t.id === selectedTaskId);
  },

  clearError: () => set({ error: null }),
}));
