import { create } from 'zustand';
import { api } from '../api';
import type { Member } from '../types';

interface MemberState {
  members: Member[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  createMember: (data: Partial<Member>) => Promise<Member>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getMemberById: (id: string) => Member | undefined;
  clearError: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const members = await api.getMembers();
      set({ members, loading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch members';
      set({ error: message, loading: false });
    }
  },

  createMember: async (data) => {
    try {
      const member = await api.createMember(data as Parameters<typeof api.createMember>[0]);
      set((s) => ({ members: [...s.members, member], error: null }));
      return member;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create member';
      set({ error: message });
      throw e;
    }
  },

  updateMember: async (id, data) => {
    try {
      const updated = await api.updateMember(id, data);
      set((s) => ({
        members: s.members.map((m) => (m.id === id ? { ...m, ...updated } : m)),
        error: null,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update member';
      set({ error: message });
      throw e;
    }
  },

  deleteMember: async (id) => {
    try {
      await api.deleteMember(id);
      set((s) => ({ members: s.members.filter((m) => m.id !== id), error: null }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete member';
      set({ error: message });
      throw e;
    }
  },

  getMemberById: (id) => get().members.find((m) => m.id === id),

  clearError: () => set({ error: null }),
}));
