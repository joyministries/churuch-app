import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, authApi, type User } from '@/lib/api';

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,
      login: async (email: string, password: string) => {
        const { token, user } = await authApi.login(email, password);
        api.setToken(token);
        set({ token, user });
      },
      logout: () => {
        api.setToken(null);
        set({ token: null, user: null });
      },
      hydrate: async () => {
        const t = get().token;
        if (t) {
          try {
            const user = await authApi.me();
            set({ user });
          } catch {
            get().logout();
          }
        }
        set({ hydrated: true });
      },
    }),
    {
      name: 'admin-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?.hydrate(),
    }
  )
);