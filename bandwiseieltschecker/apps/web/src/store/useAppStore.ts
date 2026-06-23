import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';
import { supabase } from '@/lib/auth';

interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  credits: number;
  current_streak: number;
}

interface AppState {
  user: AuthUser | null;
  token: string | null;
  isAuthLoading: boolean;

  // Optimistic submission tracking
  pendingSubmissionId: string | null;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setPendingSubmission: (id: string | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthLoading: true,
      pendingSubmissionId: null,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        apiClient.setToken(token);
      },
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      setPendingSubmission: (id) => set({ pendingSubmissionId: id }),

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, token: null, pendingSubmissionId: null });
        apiClient.setToken(null);
      },

      refreshUser: async () => {
        try {
          const { token } = get();
          if (!token) return;
          const user = await apiClient.getMe();
          set({ user });
        } catch {
          // Token expired or invalid
          set({ user: null, token: null });
          apiClient.setToken(null);
        }
      },
    }),
    {
      name: 'ielts-checker-auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      },
    },
  ),
);
