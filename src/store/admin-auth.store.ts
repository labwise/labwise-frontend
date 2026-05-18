'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: string;
  email: string;
  name: string;
}

interface AdminAuthState {
  admin: Admin | null;
  token: string | null;
  _hydrated: boolean;
  setAuth: (admin: Admin, token: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      _hydrated: false,
      setAuth: (admin, token) => {
        localStorage.setItem('admin-token', token);
        set({ admin, token });
      },
      logout: () => {
        localStorage.removeItem('admin-token');
        set({ admin: null, token: null });
      },
    }),
    {
      name: 'admin-auth',
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    },
  ),
);
