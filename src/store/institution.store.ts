import { create } from 'zustand';
import { api } from '@/lib/api';

export interface InstitutionInfo {
  id: string;
  name: string;
  department?: string;
  pointBalance: number;
}

interface InstitutionState {
  mode: 'personal' | 'institution';
  institution: InstitutionInfo | null;
  switchMode: (mode: 'personal' | 'institution') => Promise<void>;
  fetchInstitution: () => Promise<void>;
  reset: () => void;
}

export const useInstitutionStore = create<InstitutionState>((set) => ({
  mode: 'personal',
  institution: null,

  switchMode: async (mode) => {
    await api.patch('/institution/mode', { mode });
    set({ mode });
    if (mode === 'institution') {
      const { data } = await api.get('/institution/me');
      set({ institution: data });
    }
  },

  fetchInstitution: async () => {
    try {
      const { data } = await api.get('/institution/me');
      if (data) {
        set({ institution: data, mode: 'institution' });
      }
    } catch {
      // 소속 기관 없음
    }
  },

  reset: () => set({ mode: 'personal', institution: null }),
}));
