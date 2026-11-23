import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../lib/storage';
import { chatRooms, seedMessages, type ChatMessage } from '../lib/chat';
import { seedNotifications, type AppNotification } from '../lib/notifications';

export type Role = 'member' | 'leader' | 'ministry_admin' | 'admin';

export interface User {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  campus_id: number | null;
  ministries?: { id: number; name: string }[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => () => useAuthStore.setState({ hydrated: true }),
    }
  )
);

interface UiState {
  campusId: number | null;
  setCampusId: (id: number | null) => void;
  pushToken: string | null;
  setPushToken: (t: string) => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      campusId: null,
      setCampusId: (id) => set({ campusId: id }),
      pushToken: null,
      setPushToken: (t) => set({ pushToken: t }),
      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

/**
 * Quick actions learn the member's own order: the tiles re-sort by what they
 * actually open, most recent first, and the untouched ones keep the house order
 * behind them. Persisted so the layout survives a reload.
 */
interface QuickActionsState {
  recent: string[];
  touch: (screen: string) => void;
  reset: () => void;
}

export const useQuickActionsStore = create<QuickActionsState>()(
  persist(
    (set) => ({
      recent: [],
      touch: (screen) =>
        set((s) => ({
          recent: [screen, ...s.recent.filter((k) => k !== screen)].slice(0, 8),
        })),
      reset: () => set({ recent: [] }),
    }),
    {
      name: 'quick-actions-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

/**
 * Sermon / devotional notes — the member's journal.
 * Persisted locally so a note survives a reload; `removeNote` clears the entry
 * again (tapping the bookmark a second time unsaves it).
 */
interface JournalState {
  /** Written notes, keyed by sermon id. */
  notes: Record<string, string>;
  /** When each note was last written. */
  savedAt: Record<string, number>;
  /** Bookmarked sermons, keyed by sermon id -> when it was saved for later. */
  saved: Record<string, number>;
  saveNote: (id: string | number, text: string) => void;
  removeNote: (id: string | number) => void;
  toggleSaved: (id: string | number) => void;
  clear: () => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      notes: {},
      savedAt: {},
      saved: {},
      saveNote: (id, text) =>
        set((s) => {
          const key = String(id);
          const trimmed = text.trim();
          if (!trimmed) {
            const { [key]: _text, ...rest } = s.notes;
            const { [key]: _at, ...restAt } = s.savedAt;
            return {
              notes: rest,
              savedAt: restAt,
            };
          }
          return {
            notes: { ...s.notes, [key]: text },
            savedAt: { ...s.savedAt, [key]: Date.now() },
          };
        }),
      removeNote: (id) =>
        set((s) => {
          const key = String(id);
          const { [key]: _text, ...notes } = s.notes;
          const { [key]: _at, ...savedAt } = s.savedAt;
          return { notes, savedAt };
        }),
      /** The journal: bookmark a message to come back to, independent of notes. */
      toggleSaved: (id) =>
        set((s) => {
          const key = String(id);
          if (s.saved[key]) {
            const { [key]: _at, ...saved } = s.saved;
            return { saved };
          }
          return { saved: { ...s.saved, [key]: Date.now() } };
        }),
      clear: () => set({ notes: {}, savedAt: {}, saved: {} }),
    }),
    {
      name: 'journal-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ notes: s.notes, savedAt: s.savedAt, saved: s.saved }),
    }
  )
);

/**
 * Recently played sermons. Session-only: the player is the source of truth and
 * there is no `/media/history` endpoint yet. Swap to a persisted store once
 * the API records plays.
 */
export interface RecentPlay {
  id: string;
  title: string;
  speaker: string;
  at: number;
}

interface RecentsState {
  recent: RecentPlay[];
  push: (item: { id: string; title: string; speaker: string }) => void;
  clear: () => void;
}

export const useRecentsStore = create<RecentsState>((set) => ({
  recent: [],
  push: (item) =>
    set((s) => ({
      recent: [{ ...item, at: Date.now() }, ...s.recent.filter((r) => r.id !== item.id)].slice(0, 8),
    })),
  clear: () => set({ recent: [] }),
}));

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

interface ChatState {
  /** roomId -> am I a member of that room? */
  joined: Record<string, boolean>;
  /** roomId -> messages, oldest first. */
  messages: Record<string, ChatMessage[]>;
  /** roomId -> timestamp of the last message I read. */
  lastRead: Record<string, number>;
  send: (roomId: string, body: string, author?: string) => void;
  toggleJoin: (roomId: string) => void;
  markRead: (roomId: string) => void;
  reset: () => void;
}

const initialJoined: Record<string, boolean> = Object.fromEntries(
  chatRooms.map((r) => [r.id, r.joinedByDefault])
);

const initialMessages: Record<string, ChatMessage[]> = Object.fromEntries(
  chatRooms.map((r) => [r.id, seedMessages.filter((m) => m.roomId === r.id)])
);

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      joined: initialJoined,
      messages: initialMessages,
      lastRead: {},

      send: (roomId, body, author = 'You') => {
        const trimmed = body.trim();
        if (!trimmed) return;
        const message: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          roomId,
          author,
          body: trimmed,
          at: Date.now(),
          mine: true,
        };
        set((s) => ({
          messages: { ...s.messages, [roomId]: [...(s.messages[roomId] ?? []), message] },
          lastRead: { ...s.lastRead, [roomId]: message.at },
        }));
      },

      toggleJoin: (roomId) =>
        set((s) => ({ joined: { ...s.joined, [roomId]: !s.joined[roomId] } })),

      markRead: (roomId) => {
        const thread = get().messages[roomId] ?? [];
        const latest = thread.length ? thread[thread.length - 1].at : Date.now();
        set((s) => ({ lastRead: { ...s.lastRead, [roomId]: latest } }));
      },

      reset: () => set({ joined: initialJoined, messages: initialMessages, lastRead: {} }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ joined: s.joined, messages: s.messages, lastRead: s.lastRead }),
    }
  )
);

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

interface NotificationsState {
  items: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: seedNotifications,
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
      reset: () => set({ items: seedNotifications }),
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ items: s.items }),
    }
  )
);

/** Unread count for the bell badge. */
export function unreadNotifications(items: AppNotification[]) {
  return items.filter((n) => !n.read).length;
}
